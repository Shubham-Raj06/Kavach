const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validate, hospitalAdmissionSchema } = require('../validation/schemas');
const ctrl = require('../controllers/hospitalController');

// POST  /api/hospital        — ingest admission record (HOSPITAL role)
// GET   /api/hospital        — list admissions (GOV, HOSPITAL)
// GET   /api/hospital/:wardId/summary — aggregated syndrome summary for a ward

router.post('/', authenticate, authorize('HOSPITAL', 'GOV'), validate(hospitalAdmissionSchema), ctrl.create);
router.get('/', authenticate, authorize('GOV', 'HOSPITAL'), ctrl.list);
router.get('/:wardId/summary', authenticate, authorize('GOV', 'HOSPITAL'), ctrl.wardSummary);

module.exports = router;
