import express from 'express';
import modelController from '../controllers/modelController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../../../../middleware/validateApiKey.js';
import { authenticateToken } from '@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /models/:id
// For example:
// router.get('/models/stats', validateApiKey, modelController.getModelStats);
// =========================================================================

// 🟢 PUBLIC - No authentication
// For example:
// router.get('/models/public/:id', modelController.getPublicModelById);
// router.get('/models/latest', modelController.getLatestModels);

// 🟡 AUTHENTICATED - Logged-in users only
router.get('/model/models', modelController.getAllModels);
router.get('/model/models/:id', authenticateToken, modelController.getModelById);
router.post('/model/models', authenticateToken, modelController.createModel);
router.put('/model/models/:id', authenticateToken, modelController.updateModel);
router.delete('/model/models/:id', authenticateToken, modelController.deleteModel); // 🆕 DELETE route added

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 2
// router.patch('/models/:id', authenticateToken, authorize(2), modelController.patchModel);
// router.delete('/models/:id/admin', authenticateToken, authorize(3), modelController.adminDeleteModel);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
// router.post('/models/bulk', validateApiKey, authenticateToken, modelController.bulkCreateModels);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
// router.post('/models/system', validateApiKey, authenticateToken, authorize(3), modelController.systemCreateModel);

export default router;