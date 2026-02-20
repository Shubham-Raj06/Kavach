require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

const logger = require('./src/utils/logger');
const { connectDB } = require('./src/utils/db');
const errorHandler = require('./src/middleware/errorHandler');
const { sanitizeInput, detectPII, securityHeaders } = require('./src/middleware/security');

// ─── Database ──────────────────────────────────────────────────────────────
connectDB();

// ─── Routes ────────────────────────────────────────────────────────────────
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
const communityRoutes = require('./src/routes/community');
const ingestionRoutes = require('./src/routes/ingestion');  // Phase 1 — data pipelines
const governanceRoutes = require('./src/routes/governance'); // Phase 8 — model governance

const app = express();
const server = http.createServer(app);

// ─── Socket.io ─────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
      : true,
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

// Make io available to route handlers (e.g. for real-time broadcast after ingestion)
app.set('io', io);

// Phase 4: initialise ward/dashboard/admin rooms + FCM registration
const { initSocketManager } = require('./src/services/socketManager');
initSocketManager(io);

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(securityHeaders);
app.use(cors({
  origin: (origin, callback) => {
    //Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    // Check if origin is allowed or if it's a Vercel preview/production deployment
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// Tighter limit for write operations
app.use('/api/citizen', rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: 'Too many reports' } }));
app.use('/api/community', rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: 'Too many posts' } }));

// ─── Body Parsing + Security ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));  // tighten from 10mb
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(compression()); // Phase 9: response compression
app.use(sanitizeInput); // Phase 6: XSS + NoSQL injection prevention
app.use(detectPII);     // Phase 6: log PII patterns in production

// ─── Logging ───────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.path === '/health', // don't spam health check logs
}));

// ─── Enhanced Health Check ─────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const { getCircuitBreakerStatus } = require('./src/services/mlInferenceService');
  const mongoose = require('mongoose');

  res.json({
    status: 'ok',
    service: 'kavach-backend',
    version: process.env.npm_package_version || '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    env: process.env.NODE_ENV,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mlCircuit: getCircuitBreakerStatus(),
    memory: process.memoryUsage().rss,
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
app.use('/api/community', communityRoutes);
app.use('/api/ingestion', ingestionRoutes);  // Phase 1 — real data ingestion
app.use('/api/governance', governanceRoutes); // Phase 8 — model governance

// ─── Swagger Docs ─────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Kavach API Docs',
  customCss: '.swagger-ui .topbar { background: #0f172a; } .swagger-ui .topbar-wrapper img { content: none; } .swagger-ui .topbar-wrapper::before { content: "🛡️ Kavach API"; color: white; font-size: 20px; font-weight: bold; }',
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.js'
  ],
  swaggerOptions: { persistAuthorization: true },
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// ─── Root Route (Vercel Fix) ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🛡️ Kavach Backend is running',
    docs: '/api-docs',
    time: new Date().toISOString()
  });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

// ─── Background Jobs ───────────────────────────────────────────────────────
// Phase 3 & 4: start all scheduled ingestion + ML inference jobs
const { startAllJobs } = require('./src/jobs');
// Legacy daily risk snapshot (keeps ward risk history)
require('./src/jobs/snapshotRisk');
// Start new scheduler after DB is ready (~2s delay handled internally)
startAllJobs(io);

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Kavach backend v2.0 running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  logger.info(`📡 Socket.io ready — ward/dashboard/admin rooms initialized`);
  logger.info(`🔄 Job scheduler started — weather(3h), water(24h), features+ML(1h), drift(6h)`);
});

module.exports = app;
// module.exports = { app, server, io }; // Legacy export for local dev