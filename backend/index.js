require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const logger = require('./src/utils/logger');
const { connectDB } = require('./src/utils/db');   // ← Mongoose connection
const errorHandler = require('./src/middleware/errorHandler');

// Connect to MongoDB (non-blocking — server starts regardless)
connectDB();

// Routes
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const hospitalRoutes = require('./src/routes/hospital');
const waterRoutes = require('./src/routes/water');
const weatherRoutes = require('./src/routes/weather');
const citizenRoutes = require('./src/routes/citizen');
const riskRoutes = require('./src/routes/risk');
const alertRoutes = require('./src/routes/alerts');
const wardRoutes = require('./src/routes/wards');
const hotspotRoutes = require('./src/routes/hotspots');
const mlRoutes = require('./src/routes/ml');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    : true,   // Allow all origins in development (Expo Go uses dynamic LAN IPs)
  credentials: true,
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Body Parsing + Cookies ───────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ───────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'kavach-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/ml', mlRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Kavach backend running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
