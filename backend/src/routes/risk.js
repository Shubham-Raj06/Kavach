const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, riskPredictSchema } = require('../validation/schemas');
const ctrl = require('../controllers/riskController');

// POST /api/risk/predict   — trigger ML prediction for a ward
// GET  /api/risk           — list all predictions (paginated)
// GET  /api/risk/:wardId   — latest prediction for a ward
// GET  /api/risk/heatmap   — all wards with latest risk scores (for map)

router.post('/predict', authenticate, authorize('GOV', 'HOSPITAL'), validate(riskPredictSchema), ctrl.predict);
router.get('/heatmap', authenticate, ctrl.heatmap);
router.get('/my-ward', authenticate, ctrl.myWard);
router.get('/', authenticate, ctrl.list);
router.get('/:wardId', authenticate, ctrl.latestByWard);

module.exports = router;
