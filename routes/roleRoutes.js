import express from 'express';
import roleController from '../controllers/roleController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../../../../middleware/validateApiKey.js';
import { authenticateToken } from '@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /roles/:id
// For example:
// router.get('/roles/stats', validateApiKey, roleController.getRoleStats);
// =========================================================================

// 🟢 PUBLIC - No authentication
// For example:
// router.get('/roles/public/:id', roleController.getPublicRoleById);
// router.get('/roles/latest', roleController.getLatestRoles);

// 🟡 AUTHENTICATED - Logged-in users only
router.get('/role/roles/account/:organizationId', authenticateToken, roleController.getOrganizationRoles);

router.get('/role/roles/:id', authenticateToken, roleController.getRoleById);
router.post('/role/roles', authenticateToken, roleController.createRole);
router.put('/role/roles/:id', authenticateToken, roleController.updateRole);
router.delete('/role/roles/:id', authenticateToken, roleController.deleteRole);

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 2
// router.patch('/roles/:id', authenticateToken, authorize(2), roleController.patchRole);
// router.delete('/roles/:id/admin', authenticateToken, authorize(3), roleController.adminDeleteRole);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
// router.post('/roles/bulk', validateApiKey, authenticateToken, roleController.bulkCreateRoles);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
// router.post('/roles/system', validateApiKey, authenticateToken, authorize(3), roleController.systemCreateRole);

export default router;