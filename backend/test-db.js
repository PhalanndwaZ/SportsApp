const { PrismaClient } = require("@prisma/client");
const e = require("cors");

const prisma = new PrismaClient();

async function main() {
    console.log('Testing database connection....');


    // create f1 session
    const session = await prisma.f1Session.create({
        data: {
            sessionKey: 'test-'+ Date.now(),
            sessionName: 'Test Race',
            dateStart: new Date(),
            circuitName: 'Monza',
            country: 'Italy',
            year: 2024,
        },
    });

    console.log('created sessiion: ', session);


    // fetch all sessions
    const allSesstions = await prisma.f1Session.findMany();
    console.log('Total sesstions in db: ', allSesstions.length);


    // clean up test data 
    await prisma.f1Session.delete({
        where: {id: session.id},
    });

    console.log('Database testg complete! ');

}

main().catch((e) =>{
    console.error('Error: ', e);
}).finally(async () => {
    await prisma.$disconnect();
});

