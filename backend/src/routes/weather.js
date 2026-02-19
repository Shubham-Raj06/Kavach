const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, weatherSchema } = require('../validation/schemas');
const ctrl = require('../controllers/weatherController');

router.post('/', authenticate, authorize('GOV'), validate(weatherSchema), ctrl.create);
router.get('/', authenticate, ctrl.list);
router.get('/:wardId/latest', authenticate, ctrl.latestByWard);

module.exports = router;
