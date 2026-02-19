const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, auditLog } = require('../middleware/auth');
const { validate, createUserSchema, resetPasswordSchema, changeRoleSchema, createHospitalSchema, updateHospitalSchema, wardSchema, updateWardSchema } = require('../validation/schemas');
const admin = require('../controllers/adminController');

// All admin routes: must be authenticated AND SUPER_ADMIN
router.use(requireAuth, requireRole('SUPER_ADMIN'));

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', admin.listUsers);
router.post('/users', validate(createUserSchema), auditLog('CREATE_USER'), admin.createUser);
router.get('/users/:id', admin.getUser);
router.patch('/users/:id/suspend', auditLog('SUSPEND_USER'), admin.suspendUser);
router.patch('/users/:id/activate', auditLog('ACTIVATE_USER'), admin.activateUser);
router.patch('/users/:id/reset-password', validate(resetPasswordSchema), auditLog('RESET_PASSWORD'), admin.resetPassword);
router.patch('/users/:id/role', validate(changeRoleSchema), auditLog('CHANGE_ROLE'), admin.changeRole);

// ── Hospitals ─────────────────────────────────────────────────────────────────
router.get('/hospitals', admin.listHospitals);
router.post('/hospitals', validate(createHospitalSchema), auditLog('CREATE_HOSPITAL'), admin.createHospital);
router.patch('/hospitals/:id', auditLog('UPDATE_HOSPITAL'), admin.updateHospital);

// ── Wards ─────────────────────────────────────────────────────────────────────
router.get('/wards', admin.listWards);
router.post('/wards', validate(wardSchema), auditLog('CREATE_WARD'), admin.createWard);
router.patch('/wards/:id', auditLog('UPDATE_WARD'), admin.updateWard);

// ── System ────────────────────────────────────────────────────────────────────
router.get('/stats', admin.getStats);
router.get('/audit-logs', admin.getAuditLogs);

module.exports = router;
