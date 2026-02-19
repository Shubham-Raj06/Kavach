const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ward = require('../controllers/wardController');

// Public (auth required for all)
router.get('/', auth, ward.list);
router.get('/:wardId', auth, ward.getOne);
router.post('/locate', auth, ward.locate);          // spatial join
router.get('/:wardId/hospitals', auth, ward.getHospitals);    // nearest 3
router.get('/:wardId/history', auth, ward.getRiskHistory);  // 30-day sparkline
router.post('/seed', auth, ward.seed);             // SUPER_ADMIN only

module.exports = router;
