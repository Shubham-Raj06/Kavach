const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, citizenReportSchema } = require('../validation/schemas');
const ctrl = require('../controllers/citizenController');

// Any authenticated user can submit a report
router.post('/', authenticate, validate(citizenReportSchema), ctrl.create);
router.get('/', authenticate, ctrl.list);
router.get('/:wardId/cluster', authenticate, ctrl.clusterByWard);

module.exports = router;
