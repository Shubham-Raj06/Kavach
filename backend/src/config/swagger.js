const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Kavach API',
            version: '2.0.0',
            description: `
## Kavach — AI Hyperlocal Disease Outbreak Prediction System

Real-data-driven, government-deployable outbreak intelligence platform.

### Authentication
Most endpoints require a **Bearer JWT token** in the \`Authorization\` header.
Get a token from \`POST /api/auth/login\`.

### Roles
| Role | Access |
|------|--------|
| \`CITIZEN\` | Submit reports, view risk, community posts |
| \`HOSPITAL\` | Ingest admissions, view ward analytics |
| \`GOV\` | Governance, drift, all analytics |
| \`SUPER_ADMIN\` | Full access, seed, activate models |
            `.trim(),
            contact: {
                name: 'Kavach Team',
                email: 'kavach@example.gov.in',
            },
            license: { name: 'MIT' },
        },
        servers: [
            { url: 'https://kavach-dashboard-back.vercel.app', description: 'Production' },
            { url: 'http://localhost:5000', description: 'Local Dev' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        code: { type: 'string' },
                    },
                },
                WardRisk: {
                    type: 'object',
                    properties: {
                        wardId: { type: 'string', example: '42' },
                        riskScore: { type: 'number', example: 74 },
                        outbreakCategory: { type: 'string', example: 'WATERBORNE' },
                        confidence: { type: 'number', example: 0.87 },
                        isAnomaly: { type: 'boolean' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                CitizenReport: {
                    type: 'object',
                    properties: {
                        wardId: { type: 'string' },
                        syndromeType: { type: 'string', enum: ['FEVER', 'DIARRHEA', 'VOMITING', 'RESPIRATORY', 'SKIN_RASH'] },
                        severity: { type: 'integer', minimum: 1, maximum: 5 },
                        lat: { type: 'number', example: 28.6139 },
                        lng: { type: 'number', example: 77.2090 },
                        description: { type: 'string' },
                    },
                },
                HospitalAdmission: {
                    type: 'object',
                    required: ['wardId', 'facilityId', 'reportingPeriodStart', 'reportingPeriodEnd', 'syndromes'],
                    properties: {
                        wardId: { type: 'string' },
                        facilityId: { type: 'string' },
                        facilityName: { type: 'string' },
                        reportingPeriodStart: { type: 'string', format: 'date-time' },
                        reportingPeriodEnd: { type: 'string', format: 'date-time' },
                        syndromes: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string', example: 'FEVER' },
                                    count: { type: 'integer', example: 12 },
                                },
                            },
                        },
                        severeCount: { type: 'integer', example: 2 },
                        deathCount: { type: 'integer', example: 0 },
                    },
                },
                Alert: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        wardId: { type: 'string' },
                        severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                        syndrome: { type: 'string' },
                        message: { type: 'string' },
                        riskScore: { type: 'number' },
                        confidence: { type: 'number' },
                        resolved: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Login, register, token refresh' },
            { name: 'Citizen', description: 'Submit symptom reports' },
            { name: 'Risk', description: 'Ward risk scores and predictions' },
            { name: 'Alerts', description: 'Active outbreak alerts' },
            { name: 'Wards', description: 'Ward boundaries, hospitals, history' },
            { name: 'Community', description: 'Community posts with moderation' },
            { name: 'Ingestion', description: 'Data ingestion (hospital ABDM, weather, water)' },
            { name: 'Governance', description: 'Model registry, drift, performance metrics' },
            { name: 'Admin', description: 'Admin controls (SUPER_ADMIN)' },
            { name: 'Hotspots', description: 'Geo-clustered hotspot data' },
        ],
        paths: {
            // ── Auth ────────────────────────────────────────────────────────
            '/api/auth/register': {
                post: {
                    tags: ['Auth'], summary: 'Register a new user', security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object', required: ['name', 'email', 'password', 'role'],
                                    properties: {
                                        name: { type: 'string', example: 'Kavyansh Bagotra' },
                                        email: { type: 'string', example: 'user@example.com' },
                                        password: { type: 'string', example: 'StrongPass@123' },
                                        role: { type: 'string', enum: ['CITIZEN', 'HOSPITAL', 'GOV'], example: 'CITIZEN' },
                                    },
                                }
                            }
                        },
                    },
                    responses: {
                        201: { description: 'User created, returns JWT token' },
                        400: { description: 'Validation error' },
                        409: { description: 'Email already exists' },
                    },
                },
            },
            '/api/auth/login': {
                post: {
                    tags: ['Auth'], summary: 'Login and get JWT token', security: [],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string', example: 'user@example.com' },
                                        password: { type: 'string', example: 'StrongPass@123' },
                                    },
                                }
                            }
                        },
                    },
                    responses: {
                        200: { description: 'Returns accessToken and refreshToken' },
                        401: { description: 'Invalid credentials' },
                    },
                },
            },
            '/api/auth/refresh': {
                post: {
                    tags: ['Auth'], summary: 'Refresh access token using refresh token', security: [],
                    responses: { 200: { description: 'New access token' } },
                },
            },

            // ── Citizen Reports ──────────────────────────────────────────────
            '/api/citizen/report': {
                post: {
                    tags: ['Citizen'], summary: 'Submit a symptom report',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/CitizenReport' } } },
                    },
                    responses: {
                        201: { description: 'Report created; triggers ML re-inference for ward' },
                        429: { description: 'Rate limit exceeded' },
                    },
                },
            },
            '/api/citizen/reports': {
                get: {
                    tags: ['Citizen'], summary: 'List citizen reports (paginated)',
                    parameters: [
                        { name: 'wardId', in: 'query', schema: { type: 'string' } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
                        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                    ],
                    responses: { 200: { description: 'List of reports' } },
                },
            },

            // ── Risk ─────────────────────────────────────────────────────────
            '/api/risk': {
                get: {
                    tags: ['Risk'], summary: 'Get risk scores for all wards',
                    responses: {
                        200: {
                            description: 'Array of WardRisk objects',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/WardRisk' } } } },
                        }
                    },
                },
            },
            '/api/risk/{wardId}': {
                get: {
                    tags: ['Risk'], summary: 'Get risk score for a specific ward',
                    parameters: [{ name: 'wardId', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'WardRisk object', content: { 'application/json': { schema: { $ref: '#/components/schemas/WardRisk' } } } },
                        404: { description: 'Ward not found' },
                    },
                },
            },

            // ── Alerts ───────────────────────────────────────────────────────
            '/api/alerts': {
                get: {
                    tags: ['Alerts'], summary: 'Get active alerts (all wards)',
                    parameters: [
                        { name: 'wardId', in: 'query', schema: { type: 'string' } },
                        { name: 'severity', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } },
                        { name: 'resolved', in: 'query', schema: { type: 'boolean' } },
                    ],
                    responses: { 200: { description: 'Array of Alert objects' } },
                },
            },

            // ── Wards ────────────────────────────────────────────────────────
            '/api/wards': {
                get: { tags: ['Wards'], summary: 'List all wards', responses: { 200: { description: 'Ward list' } } },
            },
            '/api/wards/locate': {
                get: {
                    tags: ['Wards'], summary: 'Find ward for a lat/lng coordinate',
                    parameters: [
                        { name: 'lat', in: 'query', required: true, schema: { type: 'number', example: 28.6139 } },
                        { name: 'lng', in: 'query', required: true, schema: { type: 'number', example: 77.2090 } },
                    ],
                    responses: { 200: { description: 'Ward info + risk score' } },
                },
            },
            '/api/wards/{wardId}/history': {
                get: {
                    tags: ['Wards'], summary: 'Get 30-day risk history for a ward',
                    parameters: [{ name: 'wardId', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Array of daily risk snapshots with volatility and outbreak count' } },
                },
            },
            '/api/wards/{wardId}/hospitals': {
                get: {
                    tags: ['Wards'], summary: 'Get nearest hospitals to a ward',
                    parameters: [{ name: 'wardId', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'List of hospitals with distance' } },
                },
            },
            '/api/wards/seed': {
                post: {
                    tags: ['Wards'], summary: 'Seed demo ward data (SUPER_ADMIN only)',
                    responses: { 200: { description: 'Wards seeded' }, 403: { description: 'Unauthorized' } },
                },
            },

            // ── Community ────────────────────────────────────────────────────
            '/api/community': {
                post: {
                    tags: ['Community'], summary: 'Create a community post (with toxicity + spam check)',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        wardId: { type: 'string' },
                                        content: { type: 'string', example: 'There is contaminated water near sector 4' },
                                    },
                                }
                            }
                        },
                    },
                    responses: {
                        201: { description: 'Post created' },
                        400: { description: 'Content rejected by moderation' },
                        429: { description: 'Spam detected or rate limit' },
                    },
                },
            },
            '/api/community/ward/{wardId}': {
                get: {
                    tags: ['Community'], summary: 'Get posts for a ward',
                    parameters: [{ name: 'wardId', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'List of posts' } },
                },
            },
            '/api/community/{id}/report': {
                post: {
                    tags: ['Community'], summary: 'Report a community post',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } },
                    },
                    responses: { 200: { description: 'Report submitted' } },
                },
            },

            // ── Ingestion ────────────────────────────────────────────────────
            '/api/ingestion/hospital': {
                post: {
                    tags: ['Ingestion'], summary: 'Submit ABDM-format hospital admission data',
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/HospitalAdmission' } } },
                    },
                    responses: {
                        201: { description: 'Admission ingested; triggers async ML inference' },
                        400: { description: 'Validation error' },
                    },
                },
            },
            '/api/ingestion/hospital/seed': {
                post: {
                    tags: ['Ingestion'], summary: 'Seed 8 days of demo hospital admission data',
                    responses: { 200: { description: 'Demo data seeded' } },
                },
            },
            '/api/ingestion/weather/trigger': {
                post: {
                    tags: ['Ingestion'], summary: 'Manually trigger weather ingestion from OpenWeatherMap',
                    responses: { 200: { description: 'Weather data fetched for all wards' } },
                },
            },
            '/api/ingestion/water/trigger': {
                post: {
                    tags: ['Ingestion'], summary: 'Manually trigger water quality ingestion from DJB',
                    responses: { 200: { description: 'Water quality data fetched' } },
                },
            },
            '/api/ingestion/features/backfill': {
                post: {
                    tags: ['Ingestion'], summary: 'Backfill feature vectors for past N hours',
                    requestBody: {
                        content: { 'application/json': { schema: { type: 'object', properties: { hoursBack: { type: 'integer', example: 24 } } } } },
                    },
                    responses: { 200: { description: 'Backfill started async' } },
                },
            },
            '/api/ingestion/status': {
                get: {
                    tags: ['Ingestion'], summary: 'Get last ingestion run status + ML circuit breaker state',
                    responses: { 200: { description: 'Job status object' } },
                },
            },

            // ── Governance ───────────────────────────────────────────────────
            '/api/governance/models': {
                get: {
                    tags: ['Governance'], summary: 'List all registered ML model versions',
                    responses: { 200: { description: 'Model registry list' } },
                },
                post: {
                    tags: ['Governance'], summary: 'Register a new ML model version',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        modelVersion: { type: 'string', example: 'v1.2.0' },
                                        algorithm: { type: 'string', example: 'XGBoost' },
                                        metrics: { type: 'object', properties: { precision: { type: 'number' }, recall: { type: 'number' }, f1Score: { type: 'number' } } },
                                    },
                                }
                            }
                        },
                    },
                    responses: { 201: { description: 'Model registered' } },
                },
            },
            '/api/governance/models/active': {
                get: {
                    tags: ['Governance'], summary: 'Get current active model version',
                    responses: { 200: { description: 'Active model details' } },
                },
            },
            '/api/governance/models/{version}/activate': {
                put: {
                    tags: ['Governance'], summary: 'Promote a model version to active',
                    parameters: [{ name: 'version', in: 'path', required: true, schema: { type: 'string', example: 'v1.2.0' } }],
                    responses: { 200: { description: 'Model activated' } },
                },
            },
            '/api/governance/predictions': {
                get: {
                    tags: ['Governance'], summary: 'Recent prediction logs (audit trail)',
                    parameters: [
                        { name: 'wardId', in: 'query', schema: { type: 'string' } },
                        { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
                    ],
                    responses: { 200: { description: 'Prediction log entries' } },
                },
            },
            '/api/governance/drift': {
                get: {
                    tags: ['Governance'], summary: 'Feature drift status (PSI per ward per feature)',
                    parameters: [{ name: 'wardId', in: 'query', schema: { type: 'string' } }],
                    responses: { 200: { description: 'Drifting features list' } },
                },
            },
            '/api/governance/performance': {
                get: {
                    tags: ['Governance'], summary: 'Live precision/recall/F1 from validated predictions',
                    responses: { 200: { description: 'Performance metrics' } },
                },
            },
            '/api/governance/retrain/trigger': {
                post: {
                    tags: ['Governance'], summary: 'Request model retraining (logs to AuditLog)',
                    requestBody: {
                        content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string', example: 'PSI drift detected' } } } } },
                    },
                    responses: { 200: { description: 'Retraining request logged' } },
                },
            },

            // ── Health ────────────────────────────────────────────────────────
            '/health': {
                get: {
                    tags: [], summary: 'Health check', security: [],
                    responses: { 200: { description: 'Service status, DB connection, ML circuit breaker' } },
                },
            },
        },
    },
    apis: [], // paths defined inline above
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
