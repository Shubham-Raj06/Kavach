const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./src/models'); // Adjust path as needed
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function seedUser() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('📦 Connected to MongoDB');

        const email = 'rajshubham556@gmail.com';
        const passwordRaw = '123456';
        const passwordHash = await bcrypt.hash(passwordRaw, 12);

        const existing = await User.findOne({ email });
        if (existing) {
            console.log('✅ User already exists:', email);

            // Update password just in case
            existing.password = passwordHash; // Use 'password' field as per Schema, not passwordHash (legacy)
            existing.role = 'citizen'; // Force role update (lowercase enum)
            existing.ward = 12; // Ensure valid ward
            await existing.save();
            console.log('🔄 Password/Ward/Role updated.');
        } else {
            const newUser = await User.create({
                name: 'Shubham Raj',
                email,
                passwordHash,
                role: 'CITIZEN',
                ward: 12, // Numeric ward 1-272
                isActive: true
            });
            console.log('🚀 User created:', newUser.email);
        }

        mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error seeding:', err);
        process.exit(1);
    }
}

seedUser();
