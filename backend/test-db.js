const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: ['error'] });
p.$connect()
    .then(() => { console.log('✅ MongoDB connected!'); return p.$disconnect(); })
    .catch(e => { console.error('❌ Connection error:', e.message); return p.$disconnect(); });
