const express = require('express');
const router = express.Router();
const f1Collector = require('../collectors/f1collector');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const cache = new Map();
const getYearParam = (req) => {
  const yearParam = Number.parseInt(req.query.year, 10);
  return Number.isFinite(yearParam) ? yearParam : new Date().getFullYear();
};
const STANDINGS_MAX_AGE_MS = 60 * 60 * 1000;
const SCHEDULE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const getCache = (key, maxAgeMs) => {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > maxAgeMs) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key, data) => {
  cache.set(key, { timestamp: Date.now(), data });
};

const getLatestSessionCached = async (yearParam, raceOnly = false) => {
  const yearKey = Number.isFinite(yearParam) ? yearParam : 'current';
  const cacheKey = `latestSession:${raceOnly ? 'race' : 'any'}:${yearKey}`;
  const cached = getCache(cacheKey, 30000);
  if (cached) {
    return cached;
  }
  const session = raceOnly
    ? await f1Collector.getLatestRaceSession(yearParam)
    : await f1Collector.getLatestSession(yearParam);
  setCache(cacheKey, session);
  return session;
};

const getLatestSessionFromDb = async (yearParam) => {
  const where = Number.isFinite(yearParam) ? { year: yearParam } : undefined;
  return prisma.f1Session.findFirst({
    where,
    orderBy: { dateStart: 'desc' }
  });
};

const isFresh = (updatedAt, maxAgeMs) =>
  updatedAt && Date.now() - new Date(updatedAt).getTime() <= maxAgeMs;

const mapDriversFromDb = (drivers) => {
  const sorted = [...drivers].sort((a, b) => {
    const pointsDiff = (b.points ?? 0) - (a.points ?? 0);
    if (pointsDiff !== 0) {
      return pointsDiff;
    }
    if (a.position !== null && b.position !== null) {
      return a.position - b.position;
    }
    return a.driverNumber - b.driverNumber;
  });

  return sorted.map((driver, index) => ({
    driver_number: driver.driverNumber,
    full_name: driver.fullName,
    team_name: driver.teamName,
    country_code: driver.countryCode,
    position: driver.position ?? index + 1,
    points: driver.points ?? 0
  }));
};

const mapMeetingFromDb = (meeting) => ({
  meeting_key: meeting.meetingKey,
  meeting_name: meeting.meetingName,
  meeting_official_name: meeting.officialName,
  location: meeting.location,
  country_code: meeting.countryCode,
  country_name: meeting.countryName,
  circuit_short_name: meeting.circuitShortName,
  date_start: meeting.dateStart,
  date_end: meeting.dateEnd,
  year: meeting.year
});

const handleF1Error = (res, error) => {
  const status = error?.response?.status;
  if (status === 429) {
    return res.status(503).json({
      error: 'OpenF1 rate limit reached. Please retry shortly.'
    });
  }
  if (error?.code === 'EAI_AGAIN' || error?.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'OpenF1 is temporarily unreachable. Please retry shortly.'
    });
  }
  return res.status(500).json({ error: error.message });
};

// API endpoints (live data)
router.get('/session', async (req, res) => {
  try {
    const yearParam = Number.parseInt(req.query.year, 10);
    const session = await getLatestSessionCached(
      Number.isFinite(yearParam) ? yearParam : undefined
    );
    res.json(session);
  } catch (error) {
    if (error?.code === 'EAI_AGAIN' || error?.code === 'ENOTFOUND') {
      const yearParam = Number.parseInt(req.query.year, 10);
      const session = await getLatestSessionFromDb(yearParam);
      if (session) {
        return res.json({
          session_key: session.sessionKey,
          session_name: session.sessionName,
          date_start: session.dateStart,
          date_end: session.dateEnd,
          circuit_short_name: session.circuitName,
          country_name: session.country,
          year: session.year
        });
      }
    }
    handleF1Error(res, error);
  }
});

router.get('/drivers', async (req, res) => {
  try {
    const yearParam = getYearParam(req);
    let sessionKey = req.query.session_key;
    let dbSession = null;
    if (!sessionKey) {
      dbSession = await getLatestSessionFromDb(yearParam);
      if (dbSession?.sessionKey && isFresh(dbSession.updatedAt, STANDINGS_MAX_AGE_MS)) {
        const drivers = await prisma.f1Driver.findMany({
          where: { sessionId: dbSession.id }
        });
        if (drivers.length > 0) {
          return res.json(mapDriversFromDb(drivers));
        }
      }
      const latestSession = await getLatestSessionCached(
        Number.isFinite(yearParam) ? yearParam : undefined,
        true
      );
      sessionKey = latestSession?.session_key;
    }
    if (!sessionKey) {
      return res.status(404).json({ error: 'No active F1 session found' });
    }

    const cacheKey = `drivers:${yearParam}:${sessionKey}`;
    const cached = getCache(cacheKey, 15000);
    if (cached) {
      return res.json(cached);
    }
    const persistStandings = async (targetSessionKey, standings) => {
      if (!targetSessionKey || !Array.isArray(standings) || standings.length === 0) {
        return;
      }
      const session = await prisma.f1Session.findUnique({
        where: { sessionKey: targetSessionKey.toString() }
      });
      if (!session) {
        return;
      }
      await Promise.all(
        standings.map((driver) =>
          prisma.f1Driver.updateMany({
            where: {
              sessionId: session.id,
              driverNumber: driver.driver_number ?? driver.driverNumber
            },
            data: {
              position: driver.position ?? driver.position_current ?? driver.rank ?? null,
              points: driver.points ?? driver.points_current ?? null
            }
          })
        )
      );
    };
    const standings = await f1Collector.getChampionshipDrivers(sessionKey);
    let resultDrivers = (standings || []).map((driver) => ({
      ...driver,
      full_name: driver.full_name || driver.driver_name || driver.driver_full_name,
      team_name: driver.team_name || driver.constructor_name || driver.team,
      country_code: driver.country_code || driver.country,
      position: driver.position_current ?? driver.position ?? driver.rank,
      points: driver.points_current ?? driver.points ?? 0,
    }));

    // Merge in names/teams from session drivers if standings are sparse
    if (resultDrivers.some((driver) => !driver.full_name || driver.full_name === 'Unknown')) {
      let sessionDrivers = await f1Collector.getDrivers(sessionKey);
      if (!sessionDrivers || sessionDrivers.length === 0) {
        sessionDrivers = await prisma.f1Driver.findMany({
          where: {
            session: {
              sessionKey: sessionKey.toString()
            }
          }
        });
      }
      const byNumber = new Map();
      const byId = new Map();
      const byAcronym = new Map();

      (sessionDrivers || []).forEach((driver) => {
        if (driver.driver_number !== undefined && driver.driver_number !== null) {
          byNumber.set(String(driver.driver_number), driver);
        }
        if (driver.driverNumber !== undefined && driver.driverNumber !== null) {
          byNumber.set(String(driver.driverNumber), driver);
        }
        if (driver.driver_id) {
          byId.set(driver.driver_id, driver);
        }
        if (driver.name_acronym) {
          byAcronym.set(driver.name_acronym, driver);
        }
        if (driver.nameAcronym) {
          byAcronym.set(driver.nameAcronym, driver);
        }
      });

      const getDriverNumber = (driver) =>
        driver.driver_number ??
        driver.driver_num ??
        driver.number ??
        driver.driverNo;

      resultDrivers = resultDrivers.map((driver) => {
        const numberKey = getDriverNumber(driver);
        const numberLookup =
          numberKey !== undefined && numberKey !== null ? String(numberKey) : null;
        const idKey = driver.driver_id || driver.driverId;
        const acronymKey = driver.name_acronym || driver.abbreviation || driver.code;
        const match =
          (numberLookup && byNumber.get(numberLookup)) ||
          (idKey && byId.get(idKey)) ||
          (acronymKey && byAcronym.get(acronymKey));

        return {
          ...driver,
          driver_number:
            driver.driver_number ?? match?.driver_number ?? match?.driverNumber,
          full_name:
            driver.full_name ||
            driver.driver_name ||
            driver.driver_full_name ||
            match?.full_name ||
            match?.fullName ||
            match?.nameAcronym ||
            match?.name_acronym ||
            'Unknown Driver',
          team_name:
            driver.team_name ||
            driver.constructor_name ||
            driver.team ||
            match?.team_name ||
            match?.teamName ||
            'Unknown',
          country_code:
            driver.country_code || driver.country || match?.country_code || match?.countryCode,
        };
      });
    }

    // Fallback: if current season has no driver data, use previous year's latest race
    if ((resultDrivers || []).length === 0) {
      const previousYear = yearParam - 1;
      const prevSession = await getLatestSessionCached(previousYear, true);
      if (prevSession?.session_key) {
        const previousStandings = await f1Collector.getChampionshipDrivers(
          prevSession.session_key
        );
        resultDrivers = (previousStandings || []).map((driver) => ({
          ...driver,
          full_name: driver.full_name || driver.driver_name || driver.driver_full_name,
          team_name: driver.team_name || driver.constructor_name || driver.team,
          country_code: driver.country_code || driver.country,
          position: driver.position_current ?? driver.position ?? driver.rank,
          points: driver.points_current ?? driver.points ?? 0,
        }));
        await persistStandings(prevSession.session_key, resultDrivers);
      }
    }

    await persistStandings(sessionKey, resultDrivers);
    const hasUnknown = (resultDrivers || []).some(
      (driver) => !driver.full_name || driver.full_name === 'Unknown Driver'
    );
    if (!hasUnknown) {
      setCache(cacheKey, resultDrivers);
    }
    res.json(resultDrivers);
  } catch (error) {
    if (error?.code === 'EAI_AGAIN' || error?.code === 'ENOTFOUND') {
      const session = await getLatestSessionFromDb(yearParam);
      if (!session) {
        return handleF1Error(res, error);
      }
      const drivers = await prisma.f1Driver.findMany({
        where: { sessionId: session.id },
        orderBy: { driverNumber: 'asc' }
      });
      return res.json(mapDriversFromDb(drivers));
    }
    handleF1Error(res, error);
  }
});

router.get('/teams', async (req, res) => {
  try {
    let sessionKey = req.query.session_key;
    const yearParam = getYearParam(req);
    let dbSession = null;
    if (!sessionKey) {
      dbSession = await getLatestSessionFromDb(yearParam);
      if (dbSession?.id && isFresh(dbSession.updatedAt, STANDINGS_MAX_AGE_MS)) {
        const drivers = await prisma.f1Driver.findMany({
          where: { sessionId: dbSession.id }
        });
        if (drivers.length > 0) {
          const teamMap = new Map();
          drivers.forEach((driver) => {
            if (!driver.teamName) {
              return;
            }
            if (!teamMap.has(driver.teamName)) {
              teamMap.set(driver.teamName, {
                team_name: driver.teamName,
                points: 0,
                position: null
              });
            }
            const entry = teamMap.get(driver.teamName);
            entry.points += driver.points ?? 0;
          });
          const teams = Array.from(teamMap.values()).sort((a, b) => b.points - a.points);
          teams.forEach((team, index) => {
            team.position = index + 1;
          });
          return res.json(teams);
        }
      }
      const latestSession = await getLatestSessionCached(yearParam, true);
      sessionKey = latestSession?.session_key;
    }
    if (!sessionKey) {
      return res.status(404).json({ error: 'No race session found for teams' });
    }

    const cacheKey = `teams:${yearParam}:${sessionKey}`;
    const cached = getCache(cacheKey, 60000);
    if (cached) {
      return res.json(cached);
    }
    const teams = await f1Collector.getChampionshipTeams(sessionKey);
    let formatted = (teams || []).map((team) => ({
      ...team,
      team_name: team.team_name || team.constructor_name || team.name || 'Unknown',
      position: team.position_current ?? team.position,
      points: team.points_current ?? team.points ?? 0,
    }));

    // Fallback: if season hasn't started yet, carry over team list from prior year with 0 points
    if (formatted.length === 0) {
      const previousYear = yearParam - 1;
      const prevSession = await getLatestSessionCached(previousYear, true);
      if (prevSession?.session_key) {
        const prevTeams = await f1Collector.getChampionshipTeams(prevSession.session_key);
        const seen = new Set();
        formatted = (prevTeams || [])
          .map((team) => ({
            ...team,
            team_name: team.team_name || team.constructor_name,
            position: null,
            points: 0,
            season_year: yearParam,
          }))
          .filter((team) => {
            const key = team.team_name || team.constructor_name || team.team_id;
            if (!key || seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });
      }
    }
    setCache(cacheKey, formatted);
    res.json(formatted);
  } catch (error) {
    if (error?.code === 'EAI_AGAIN' || error?.code === 'ENOTFOUND') {
      const session = await getLatestSessionFromDb(yearParam);
      if (!session) {
        return handleF1Error(res, error);
      }
      const drivers = await prisma.f1Driver.findMany({
        where: { sessionId: session.id }
      });
      const teamMap = new Map();
      drivers.forEach((driver) => {
        if (!driver.teamName) {
          return;
        }
        if (!teamMap.has(driver.teamName)) {
          teamMap.set(driver.teamName, {
            team_name: driver.teamName,
            points: 0,
            position: null
          });
        }
        const entry = teamMap.get(driver.teamName);
        entry.points += driver.points ?? 0;
      });
      const teams = Array.from(teamMap.values()).sort((a, b) => b.points - a.points);
      teams.forEach((team, index) => {
        team.position = index + 1;
      });
      return res.json(teams);
    }
    handleF1Error(res, error);
  }
});

router.get('/positions/last', async (req, res) => {
  try {
    let sessionKey = req.query.session_key;
    if (!sessionKey) {
      const yearParam = getYearParam(req);
      const latestSession = await getLatestSessionCached(yearParam, true);
      sessionKey = latestSession?.session_key;
    }
    if (!sessionKey) {
      return res.status(404).json({ error: 'No race session found for results' });
    }

    const yearParam = getYearParam(req);
    const cacheKey = `results:${yearParam}:${sessionKey}`;
    const cached = getCache(cacheKey, 15000);
    if (cached) {
      return res.json(cached);
    }
    let [results, drivers] = await Promise.all([
      f1Collector.getSessionResults(sessionKey),
      f1Collector.getDrivers(sessionKey),
    ]);

    // Fallback to last season's final race if no results yet
    if ((results || []).length === 0) {
      const previousYear = yearParam - 1;
      const prevSession = await getLatestSessionCached(previousYear, true);
      if (prevSession?.session_key) {
        [results, drivers] = await Promise.all([
          f1Collector.getSessionResults(prevSession.session_key),
          f1Collector.getDrivers(prevSession.session_key),
        ]);
      }
    }

    const driverByNumber = new Map(
      (drivers || []).map((driver) => [driver.driver_number, driver])
    );

    const mergedResults = (results || []).map((result) => {
      const driver = driverByNumber.get(result.driver_number);
      return {
        ...result,
        full_name: result.full_name || driver?.full_name,
        team_name: result.team_name || driver?.team_name,
        country_code: result.country_code || driver?.country_code,
      };
    });

    setCache(cacheKey, mergedResults);
    res.json(mergedResults);
  } catch (error) {
    if (error?.code === 'EAI_AGAIN' || error?.code === 'ENOTFOUND') {
      return res.json([]);
    }
    handleF1Error(res, error);
  }
});

router.get('/rounds', async (req, res) => {
  try {
    const yearParam = getYearParam(req);
    const yearKey = Number.isFinite(yearParam) ? yearParam : 'current';
    const cacheKey = `rounds:${yearKey}`;
    const cached = getCache(cacheKey, 600000);
    if (cached) {
      return res.json(cached);
    }
    const latestMeeting = await prisma.f1Meeting.findFirst({
      where: { year: yearParam },
      orderBy: { updatedAt: 'desc' }
    });
    if (latestMeeting && isFresh(latestMeeting.updatedAt, SCHEDULE_MAX_AGE_MS)) {
      const meetings = await prisma.f1Meeting.findMany({
        where: { year: yearParam },
        orderBy: { dateStart: 'asc' }
      });
      const now = new Date();
      const upcoming = meetings
        .filter((meeting) => meeting.dateStart >= now)
        .map(mapMeetingFromDb);
      setCache(cacheKey, upcoming);
      return res.json(upcoming);
    }
    const meetings = await f1Collector.getMeetings(
      Number.isFinite(yearParam) ? yearParam : undefined
    );
    const now = new Date();
    const upcoming = (meetings || [])
      .filter((meeting) => meeting.date_start && new Date(meeting.date_start) >= now)
      .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));

    if (meetings && meetings.length > 0) {
      await Promise.all(
        meetings.map((meeting) =>
          prisma.f1Meeting.upsert({
            where: { meetingKey: meeting.meeting_key },
            update: {
              meetingName: meeting.meeting_name,
              officialName: meeting.meeting_official_name,
              location: meeting.location,
              countryCode: meeting.country_code,
              countryName: meeting.country_name,
              circuitShortName: meeting.circuit_short_name,
              dateStart: new Date(meeting.date_start),
              dateEnd: meeting.date_end ? new Date(meeting.date_end) : null,
              year: meeting.year
            },
            create: {
              meetingKey: meeting.meeting_key,
              meetingName: meeting.meeting_name,
              officialName: meeting.meeting_official_name,
              location: meeting.location,
              countryCode: meeting.country_code,
              countryName: meeting.country_name,
              circuitShortName: meeting.circuit_short_name,
              dateStart: new Date(meeting.date_start),
              dateEnd: meeting.date_end ? new Date(meeting.date_end) : null,
              year: meeting.year
            }
          })
        )
      );
    }

    setCache(cacheKey, upcoming);
    res.json(upcoming);
  } catch (error) {
    if (error?.code === 'EAI_AGAIN' || error?.code === 'ENOTFOUND') {
      const meetings = await prisma.f1Meeting.findMany({
        where: { year: yearParam },
        orderBy: { dateStart: 'asc' }
      });
      const now = new Date();
      const upcoming = meetings
        .filter((meeting) => meeting.dateStart >= now)
        .map(mapMeetingFromDb);
      return res.json(upcoming);
    }
    handleF1Error(res, error);
  }
});

// DATABASE endpoints (saved data)
router.get('/db/drivers', async (req, res) => {
  try {
    const drivers = await prisma.f1Driver.findMany({
      include: {
        session: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
    res.json(drivers);
  } catch (error) {
    handleF1Error(res, error);
  }
});

router.get('/db/sessions', async (req, res) => {
  try {
    const sessions = await prisma.f1Session.findMany({
      include: {
        drivers: true
      },
      orderBy: {
        dateStart: 'desc'
      },
      take: 10
    });
    res.json(sessions);
  } catch (error) {
    handleF1Error(res, error);
  }
});

module.exports = router;
