const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, wardSchema } = require('../validation/schemas');
const ctrl = require('../controllers/wardController');

router.post('/', authenticate, authorize('GOV'), validate(wardSchema), ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

module.exports = router;
