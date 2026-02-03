const { prisma} = require('./database');


class F1Service{
    async saveSession(sessionDate) {

        // Save session data
        try {
            const session = await prisma.f1Session.upsert({
                where: {sessionKey: sessionData.session_key},
                update: {
                    sessionName: sessionData.session_name,
                    dateEnd: sessionData.date_end ? new Date(sessionData.date_end): null,
                },
                create: {
                    sessionKey: sessionData.session_key,
                    sessionName: sessionData.session_name,
                    datetart: new Date(sessionData.date_start),
                    dateEnd: sessionData.date_end ? new Date(sessionData.date_end): null,
                    circuitName: sessionData.circuit_short_name,
                    year: sessionData.year, 
                },
            });
            console.log('F1 Session saved: ', session.id);
            return session;
        } catch (error) {
            console.error('Error saving F1 session: ', error);
            throw error;
        }
        
    }


    // Save driver data
    async saveDrivers(drivers, sessionId){
        try {
            const saved = await Promise.all(
                drivers.map(driver =>
                    prisma.f1Driver.create({
                        data: {
                            driverNumber: driver.driver_number,
                            fullName: driver.full_name,
                            nameAcronym: driver.name_acronym,
                            teamName: driver.team_name,
                            sessionId: sessionId,
                        },
                    })

                )
            );
            console.log(`Saved ${saved.length} drivers`);
            return saved;
        } catch (error) {
            console.error('Error saving drivers: ', error);
            throw error;
        }
    }
    // GET RECENT F1 SESSIONS
    async getRecentSessions(limit =10){
        return await prisma.f1Session.findMany({
            take: limit,
            orderBy: {dateStart: 'desc'},
            include: {
                drivers: true, 
            },
        });
    }
}

module.exports = new F1Service();

