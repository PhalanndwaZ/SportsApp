-- CreateTable
CREATE TABLE "f1_sessions" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3),
    "circuitName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "f1_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "f1_drivers" (
    "id" TEXT NOT NULL,
    "driverNumber" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "nameAcronym" TEXT,
    "teamName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "position" INTEGER,
    "points" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "f1_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "f1_lap_times" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "lapNumber" INTEGER NOT NULL,
    "lapTime" TEXT NOT NULL,
    "sector1" TEXT,
    "sector2" TEXT,
    "sector3" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "f1_lap_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football_matches" (
    "id" TEXT NOT NULL,
    "matchId" INTEGER NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "homeTeamId" INTEGER,
    "awayTeam" TEXT NOT NULL,
    "awayTeamId" INTEGER,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "competition" TEXT NOT NULL,
    "competitionId" INTEGER,
    "matchDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "venue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "football_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football_teams" (
    "id" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "teamName" TEXT NOT NULL,
    "shortName" TEXT,
    "tla" TEXT,
    "competition" TEXT NOT NULL,
    "competitionId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "played" INTEGER NOT NULL,
    "won" INTEGER NOT NULL,
    "drawn" INTEGER NOT NULL,
    "lost" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDiff" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "football_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football_players" (
    "id" TEXT NOT NULL,
    "playerId" INTEGER NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamId" INTEGER,
    "position" TEXT,
    "nationality" TEXT,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "season" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "football_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "f1_sessions_sessionKey_key" ON "f1_sessions"("sessionKey");

-- CreateIndex
CREATE INDEX "f1_sessions_year_sessionName_idx" ON "f1_sessions"("year", "sessionName");

-- CreateIndex
CREATE INDEX "f1_drivers_sessionId_idx" ON "f1_drivers"("sessionId");

-- CreateIndex
CREATE INDEX "f1_lap_times_sessionId_lapNumber_idx" ON "f1_lap_times"("sessionId", "lapNumber");

-- CreateIndex
CREATE UNIQUE INDEX "football_matches_matchId_key" ON "football_matches"("matchId");

-- CreateIndex
CREATE INDEX "football_matches_status_matchDate_idx" ON "football_matches"("status", "matchDate");

-- CreateIndex
CREATE UNIQUE INDEX "football_teams_teamId_key" ON "football_teams"("teamId");

-- CreateIndex
CREATE INDEX "football_teams_competitionId_position_idx" ON "football_teams"("competitionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "football_players_playerId_key" ON "football_players"("playerId");

-- CreateIndex
CREATE INDEX "football_players_teamId_idx" ON "football_players"("teamId");

-- AddForeignKey
ALTER TABLE "f1_drivers" ADD CONSTRAINT "f1_drivers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "f1_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "f1_lap_times" ADD CONSTRAINT "f1_lap_times_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "f1_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "f1_lap_times" ADD CONSTRAINT "f1_lap_times_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "f1_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
