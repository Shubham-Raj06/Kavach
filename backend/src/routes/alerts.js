const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, alertSchema } = require('../validation/schemas');
const ctrl = require('../controllers/alertController');

router.post('/', authenticate, authorize('GOV', 'HOSPITAL'), validate(alertSchema), ctrl.create);
router.get('/', authenticate, ctrl.list);
router.get('/my-ward', authenticate, ctrl.myWard);
router.get('/:wardId', authenticate, ctrl.byWard);
router.patch('/:id/status', authenticate, authorize('GOV'), ctrl.updateStatus);

module.exports = router;
