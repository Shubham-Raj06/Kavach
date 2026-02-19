const express = require('express');
const router = express.Router();
const { getAlerts, createAlert, alertValidation } = require('../controllers/alertController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/:ward', verifyToken, getAlerts);
router.post('/', verifyToken, requireRole('govt'), alertValidation, createAlert);

module.exports = router;
