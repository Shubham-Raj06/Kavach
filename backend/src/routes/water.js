const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, waterQualitySchema } = require('../validation/schemas');
const ctrl = require('../controllers/waterController');

router.post('/', authenticate, authorize('GOV', 'HOSPITAL'), validate(waterQualitySchema), ctrl.create);
router.get('/', authenticate, ctrl.list);
router.get('/:wardId/latest', authenticate, ctrl.latestByWard);

module.exports = router;
