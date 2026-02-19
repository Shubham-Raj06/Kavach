/**
 * tenantFilter.js
 * Injects req.tenantFilter based on the authenticated user's role.
 * Apply AFTER requireAuth on any endpoint that needs scoped data access.
 *
 * Usage:
 *   router.get('/wards', requireAuth, tenantFilter, wardController.list);
 *
 * In the controller:
 *   const wards = await prisma.ward.findMany({ where: req.tenantFilter.ward });
 */
const tenantFilter = (req, res, next) => {
    const { role, wardId, hospitalId, district } = req.user;

    switch (role) {
        case 'GOV':
            // GOV users see all wards in their district
            req.tenantFilter = {
                ward: district ? { district } : {},
                hospital: district ? { city: district } : {},
                alert: district ? { ward: { district } } : {},
            };
            break;

        case 'HOSPITAL':
            // Hospital admins see only their hospital's data
            req.tenantFilter = {
                ward: wardId ? { id: wardId } : { id: 'NONE' },
                hospital: hospitalId ? { id: hospitalId } : { id: 'NONE' },
                alert: wardId ? { wardId } : { wardId: 'NONE' },
            };
            break;

        case 'CITIZEN':
            // Citizens see only their ward
            req.tenantFilter = {
                ward: wardId ? { id: wardId } : { id: 'NONE' },
                hospital: { id: 'NONE' }, // citizens cannot see hospital internals
                alert: wardId ? { wardId } : { wardId: 'NONE' },
            };
            break;

        case 'SUPER_ADMIN':
            // Unrestricted
            req.tenantFilter = {
                ward: {},
                hospital: {},
                alert: {},
            };
            break;

        default:
            return res.status(403).json({ error: 'Unknown role — access denied.' });
    }

    next();
};

module.exports = tenantFilter;
