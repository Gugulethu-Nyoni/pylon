import express from 'express';
import pylonController from '../controllers/pylonController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../../../../middleware/validateApiKey.js';
import { authenticateToken } from '../../../@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '../../../@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /pylons/:id
// For example:
// router.get('/pylons/stats', validateApiKey, pylonController.getPylonStats);
// =========================================================================

// 🟢 PUBLIC - No authentication
// For example:
// router.get('/pylons/public/:id', pylonController.getPublicPylonById);
// router.get('/pylons/latest', pylonController.getLatestPylons);

// 🟡 AUTHENTICATED - Logged-in users only
router.get('/pylons', authenticateToken, pylonController.getAllPylons);
router.get('/pylons/:id', authenticateToken, pylonController.getPylonById);
router.post('/pylons', authenticateToken, pylonController.createPylon);
router.put('/pylons/:id', authenticateToken, pylonController.updatePylon);
router.delete('/pylons/:id', authenticateToken, pylonController.deletePylon); // 🆕 DELETE route added

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 2
// router.patch('/pylons/:id', authenticateToken, authorize(2), pylonController.patchPylon);
// router.delete('/pylons/:id/admin', authenticateToken, authorize(3), pylonController.adminDeletePylon);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
// router.post('/pylons/bulk', validateApiKey, authenticateToken, pylonController.bulkCreatePylons);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
// router.post('/pylons/system', validateApiKey, authenticateToken, authorize(3), pylonController.systemCreatePylon);

export default router;