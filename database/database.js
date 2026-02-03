const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query','error', 'warn'],
});


// test connection 

async function testConnection() {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed: ', error);
        process.exit(1);
    }
    
}


// shutdown 
prisma.on('SIGINT', async ()=> {
    await prisma.$disconnect();
    process.exit(0);
});

module.exports = { prisma,testConnection};