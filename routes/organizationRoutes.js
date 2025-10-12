import express from 'express';
import organizationController from '../controllers/organizationController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../../../../middleware/validateApiKey.js';
import { authenticateToken } from '@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /organizations/:id
// For example:
// router.get('/organizations/stats', validateApiKey, organizationController.getOrganizationStats);
// =========================================================================

// 🟢 PUBLIC - No authentication
// For example:
// router.get('/organizations/public/:id', organizationController.getPublicOrganizationById);
// router.get('/organizations/latest', organizationController.getLatestOrganizations);

// 🟡 AUTHENTICATED - Logged-in users only
router.get('/organizations', authenticateToken, organizationController.getAllOrganizations);
router.get('/organizations/:id', authenticateToken, organizationController.getOrganizationById);
router.post('/organizations', authenticateToken, organizationController.createOrganization);
router.put('/organizations/:id', authenticateToken, organizationController.updateOrganization);
router.delete('/organizations/:id', authenticateToken, organizationController.deleteOrganization); // 🆕 DELETE route added

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 2
// router.patch('/organizations/:id', authenticateToken, authorize(2), organizationController.patchOrganization);
// router.delete('/organizations/:id/admin', authenticateToken, authorize(3), organizationController.adminDeleteOrganization);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
// router.post('/organizations/bulk', validateApiKey, authenticateToken, organizationController.bulkCreateOrganizations);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
// router.post('/organizations/system', validateApiKey, authenticateToken, authorize(3), organizationController.systemCreateOrganization);

export default router;