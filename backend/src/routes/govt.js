const express = require('express');
const router = express.Router();
const { getDashboard, broadcastAlert } = require('../controllers/govtController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/dashboard', verifyToken, requireRole('govt'), getDashboard);
router.post('/broadcast', verifyToken, requireRole('govt'), broadcastAlert);

module.exports = router;
