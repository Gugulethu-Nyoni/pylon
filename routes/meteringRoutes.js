import express from 'express';
import meteringController from '../controllers/meteringController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../../../../middleware/validateApiKey.js';
import { authenticateToken } from '@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /meterings/:id
// For example:
// router.get('/meterings/stats', validateApiKey, meteringController.getMeteringStats);
// =========================================================================

// 🟢 PUBLIC - No authentication
// For example:
// router.get('/meterings/public/:id', meteringController.getPublicMeteringById);
// router.get('/meterings/latest', meteringController.getLatestMeterings);

// 🟡 AUTHENTICATED - Logged-in users only
router.get('/meterings', authenticateToken, meteringController.getAllMeterings);
router.get('/meterings/:id', authenticateToken, meteringController.getMeteringById);
router.post('/meterings', authenticateToken, meteringController.createMetering);
router.put('/meterings/:id', authenticateToken, meteringController.updateMetering);
router.delete('/meterings/:id', authenticateToken, meteringController.deleteMetering); // 🆕 DELETE route added

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 2
// router.patch('/meterings/:id', authenticateToken, authorize(2), meteringController.patchMetering);
// router.delete('/meterings/:id/admin', authenticateToken, authorize(3), meteringController.adminDeleteMetering);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
// router.post('/meterings/bulk', validateApiKey, authenticateToken, meteringController.bulkCreateMeterings);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
// router.post('/meterings/system', validateApiKey, authenticateToken, authorize(3), meteringController.systemCreateMetering);

export default router;