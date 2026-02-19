const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Kavach database (MongoDB)...');

    // ── Syndrome Mappings ──────────────────────────────────────────────────────
    const syndromeMappings = [
        { syndromeType: 'DIARRHEA', outbreakCategory: 'WATERBORNE', weight: 0.9 },
        { syndromeType: 'DIARRHEA', outbreakCategory: 'FOODBORNE', weight: 0.7 },
        { syndromeType: 'VOMITING', outbreakCategory: 'FOODBORNE', weight: 0.8 },
        { syndromeType: 'VOMITING', outbreakCategory: 'WATERBORNE', weight: 0.6 },
        { syndromeType: 'FEVER', outbreakCategory: 'VECTOR_BORNE', weight: 0.8 },
        { syndromeType: 'FEVER', outbreakCategory: 'AIRBORNE', weight: 0.6 },
        { syndromeType: 'COUGH', outbreakCategory: 'AIRBORNE', weight: 0.9 },
        { syndromeType: 'RESPIRATORY_DISTRESS', outbreakCategory: 'AIRBORNE', weight: 0.9 },
        { syndromeType: 'RESPIRATORY_DISTRESS', outbreakCategory: 'HOSPITAL_ACQUIRED', weight: 0.7 },
        { syndromeType: 'SKIN_RASH', outbreakCategory: 'VECTOR_BORNE', weight: 0.85 },
        { syndromeType: 'JAUNDICE', outbreakCategory: 'WATERBORNE', weight: 0.9 },
        { syndromeType: 'HEADACHE', outbreakCategory: 'VECTOR_BORNE', weight: 0.6 },
    ];

    for (const mapping of syndromeMappings) {
        await prisma.syndromeMapping.upsert({
            where: { syndromeType_outbreakCategory: { syndromeType: mapping.syndromeType, outbreakCategory: mapping.outbreakCategory } },
            update: { weight: mapping.weight },
            create: mapping,
        });
    }
    console.log('✅ Syndrome mappings seeded');

    // ── Demo Wards (let MongoDB generate IDs) ─────────────────────────────────
    // ── Demo Wards ─────────────────────────────────────────────────────────────
    const wardDefs = [
        { name: 'Ward 1 - Dharavi', city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', latitude: 19.0419, longitude: 72.8530, population: 85000 },
        { name: 'Ward 2 - Kurla', city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', latitude: 19.0726, longitude: 72.8796, population: 72000 },
        { name: 'Ward 3 - Govandi', city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', latitude: 19.0600, longitude: 72.9200, population: 65000 },
        { name: 'Ward 4 - Mankhurd', city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', latitude: 19.0440, longitude: 72.9360, population: 58000 },
        { name: 'Ward 5 - Chembur', city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', latitude: 19.0622, longitude: 72.8990, population: 91000 },
        { name: 'Ward 6 - Bandra', city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', latitude: 19.0596, longitude: 72.8295, population: 110000 },
        { name: 'Ward 7 - Andheri', city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', latitude: 19.1136, longitude: 72.8697, population: 145000 },
        { name: 'Ward 8 - Borivali', city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', latitude: 19.2307, longitude: 72.8567, population: 98000 },
    ];

    // Upsert by name so re-seeding is idempotent
    const wards = [];
    for (const def of wardDefs) {
        const existing = await prisma.ward.findFirst({ where: { name: def.name } });
        if (existing) {
            wards.push(existing);
        } else {
            const w = await prisma.ward.create({ data: def });
            wards.push(w);
        }
    }
    const ward1 = wards[0];
    const ward2 = wards[1];
    const ward3 = wards[2];
    console.log('✅ Demo wards seeded');

    // ─────────────────────────────────────────────────────────────
    // Demo Users
    // ─────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Gov@123', 12);
    const adminHash = await bcrypt.hash('Admin@123', 12);
    const hospitalHash = await bcrypt.hash('Hospital@123', 12);
    const citizenHash = await bcrypt.hash('Citizen@123', 12);

    // SUPER_ADMIN (upserted separately with stronger password)
    await prisma.user.upsert({
        where: { email: 'admin@kavach.health' },
        update: {},
        create: {
            email: 'admin@kavach.health',
            passwordHash: adminHash,
            role: 'SUPER_ADMIN',
            name: 'Kavach Platform Admin',
            isActive: true,
        },
    });
    console.log('✅ SUPER_ADMIN seeded (admin@kavach.health / KavachAdmin@2026)');

    await prisma.user.upsert({
        where: { email: 'gov@kavach.health' },
        update: {},
        create: { email: 'gov@kavach.health', role: 'GOV', name: 'BMC Health Officer', district: 'Mumbai', passwordHash },
    });

    await prisma.user.upsert({
        where: { email: 'hospital@kavach.health' },
        update: {},
        create: { email: 'hospital@kavach.health', role: 'HOSPITAL', name: 'KEM Hospital Admin', wardId: ward1.id, passwordHash: hospitalHash },
    });

    await prisma.user.upsert({
        where: { email: 'citizen@kavach.health' },
        update: {},
        create: { email: 'citizen@kavach.health', role: 'CITIZEN', name: 'Demo Citizen', wardId: ward1.id, passwordHash: citizenHash },
    });
    console.log('✅ Demo users seeded (password: Kavach@2024)');

    // ── Demo Hospital Admissions (last 7 days) ─────────────────────────────────
    const now = new Date();
    const SYNDROME_CATEGORY = {
        DIARRHEA: 'WATERBORNE', VOMITING: 'FOODBORNE', FEVER: 'VECTOR_BORNE',
        COUGH: 'AIRBORNE', RESPIRATORY_DISTRESS: 'AIRBORNE',
        SKIN_RASH: 'VECTOR_BORNE', JAUNDICE: 'WATERBORNE', UNKNOWN: 'UNKNOWN',
    };

    const admissionData = [
        // Ward 1 — escalating diarrhea (high risk scenario)
        { ward: ward1, syndromeType: 'DIARRHEA', admissionCount: 12, daysAgo: 7 },
        { ward: ward1, syndromeType: 'DIARRHEA', admissionCount: 14, daysAgo: 6 },
        { ward: ward1, syndromeType: 'DIARRHEA', admissionCount: 18, daysAgo: 5 },
        { ward: ward1, syndromeType: 'DIARRHEA', admissionCount: 22, daysAgo: 4 },
        { ward: ward1, syndromeType: 'DIARRHEA', admissionCount: 31, daysAgo: 3 },
        { ward: ward1, syndromeType: 'DIARRHEA', admissionCount: 38, daysAgo: 2 },
        { ward: ward1, syndromeType: 'DIARRHEA', admissionCount: 45, daysAgo: 1 },
        { ward: ward1, syndromeType: 'VOMITING', admissionCount: 8, daysAgo: 2 },
        { ward: ward1, syndromeType: 'VOMITING', admissionCount: 12, daysAgo: 1 },
        // Ward 2 — moderate fever
        { ward: ward2, syndromeType: 'FEVER', admissionCount: 8, daysAgo: 3 },
        { ward: ward2, syndromeType: 'FEVER', admissionCount: 11, daysAgo: 2 },
        { ward: ward2, syndromeType: 'FEVER', admissionCount: 15, daysAgo: 1 },
        // Ward 3 — low risk
        { ward: ward3, syndromeType: 'COUGH', admissionCount: 4, daysAgo: 2 },
        { ward: ward3, syndromeType: 'COUGH', admissionCount: 5, daysAgo: 1 },
    ];

    for (const d of admissionData) {
        const reportDate = new Date(now - d.daysAgo * 24 * 60 * 60 * 1000);
        await prisma.hospitalAdmission.create({
            data: {
                wardId: d.ward.id,
                hospitalName: 'Demo Hospital',
                reportDate,
                syndromeType: d.syndromeType,
                outbreakCategory: SYNDROME_CATEGORY[d.syndromeType],
                admissionCount: d.admissionCount,
            },
        });
    }
    console.log('✅ Demo hospital admissions seeded');

    // ── Demo Water Quality (Ward 1 — chlorine dropping) ───────────────────────
    const waterData = [
        { ward: ward1, chlorineLevel: 0.85, phLevel: 7.1, turbidity: 2.1, daysAgo: 7 },
        { ward: ward1, chlorineLevel: 0.80, phLevel: 7.0, turbidity: 2.4, daysAgo: 6 },
        { ward: ward1, chlorineLevel: 0.72, phLevel: 6.9, turbidity: 2.8, daysAgo: 5 },
        { ward: ward1, chlorineLevel: 0.60, phLevel: 6.8, turbidity: 3.5, daysAgo: 4 },
        { ward: ward1, chlorineLevel: 0.45, phLevel: 6.7, turbidity: 4.2, daysAgo: 3 },
        { ward: ward1, chlorineLevel: 0.30, phLevel: 6.5, turbidity: 5.8, daysAgo: 2 },
        { ward: ward1, chlorineLevel: 0.18, phLevel: 6.3, turbidity: 7.2, daysAgo: 1 }, // DANGER
        { ward: ward2, chlorineLevel: 0.75, phLevel: 7.2, turbidity: 1.8, daysAgo: 1 },
        { ward: ward3, chlorineLevel: 0.80, phLevel: 7.3, turbidity: 1.5, daysAgo: 1 },
    ];

    for (const d of waterData) {
        const reportDate = new Date(now - d.daysAgo * 24 * 60 * 60 * 1000);
        await prisma.waterQualityReport.create({
            data: { wardId: d.ward.id, reportDate, chlorineLevel: d.chlorineLevel, phLevel: d.phLevel, turbidity: d.turbidity, source: 'TAP' },
        });
    }
    console.log('✅ Demo water quality data seeded');

    // ── Demo Weather (rainfall spike 2 days ago) ──────────────────────────────
    const weatherData = [
        { ward: ward1, rainfall: 5, temperature: 28, humidity: 72, daysAgo: 7 },
        { ward: ward1, rainfall: 8, temperature: 27, humidity: 75, daysAgo: 6 },
        { ward: ward1, rainfall: 12, temperature: 26, humidity: 80, daysAgo: 5 },
        { ward: ward1, rainfall: 6, temperature: 27, humidity: 78, daysAgo: 4 },
        { ward: ward1, rainfall: 4, temperature: 28, humidity: 74, daysAgo: 3 },
        { ward: ward1, rainfall: 52, temperature: 25, humidity: 92, daysAgo: 2 }, // SPIKE
        { ward: ward1, rainfall: 18, temperature: 26, humidity: 85, daysAgo: 1 },
    ];

    for (const d of weatherData) {
        const recordedAt = new Date(now - d.daysAgo * 24 * 60 * 60 * 1000);
        await prisma.weatherData.create({
            data: { wardId: d.ward.id, recordedAt, rainfall: d.rainfall, temperature: d.temperature, humidity: d.humidity },
        });
    }
    console.log('✅ Demo weather data seeded');

    // ─────────────────────────────────────────────────────────────
    // Demo Hospitals
    // ─────────────────────────────────────────────────────────────
    const hospitalDefs = [
        { name: 'KEM Hospital', wardId: ward1.id, city: 'Mumbai', capacity: 1800, icuBeds: 120 },
        { name: 'Sion Hospital', wardId: ward2.id, city: 'Mumbai', capacity: 1200, icuBeds: 80 },
        { name: 'BYL Nair Hospital', wardId: ward3.id, city: 'Mumbai', capacity: 1500, icuBeds: 95 },
    ];

    for (const h of hospitalDefs) {
        const existing = await prisma.hospital.findFirst({ where: { name: h.name } });
        if (!existing) await prisma.hospital.create({ data: h });
    }
    console.log('✅ Demo hospitals seeded');

    console.log('\n🎉 Seed complete! Credentials:');
    console.log('   SUPER_ADMIN: admin@kavach.health     / Admin@123');
    console.log('   GOV:         gov@kavach.health       / Gov@123');
    console.log('   HOSPITAL:    hospital@kavach.health  / Hospital@123');
    console.log('   CITIZEN:     citizen@kavach.health   / Citizen@123');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
