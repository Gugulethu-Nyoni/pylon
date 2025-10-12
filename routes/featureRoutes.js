import express from 'express';
import featureController from '../controllers/featureController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../../../../middleware/validateApiKey.js';
import { authenticateToken } from '@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

const model = 'Feature';

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /features/:id
// For example:
// router.get('/features/stats', validateApiKey, featureController.getFeatureStats);
// =========================================================================

// 🟢 PUBLIC - No authentication
// For example:
// router.get('/features/public/:id', featureController.getPublicFeatureById);
// router.get('/features/latest', featureController.getLatestFeatures);

// 🟡 AUTHENTICATED - Logged-in users only
router.get('/feature/features', authenticateToken, featureController.getAllFeatures);
router.get('/feature/features/:id', authenticateToken, featureController.getFeatureById);
router.post('/feature/features', authenticateToken, featureController.createFeature);
router.put('/feature/features/:id', authenticateToken, featureController.updateFeature);
router.delete('/feature/features/:id', authenticateToken, featureController.deleteFeature); // 🆕 DELETE route added

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 2
// router.patch('/features/:id', authenticateToken, authorize(2), featureController.patchFeature);
// router.delete('/features/:id/admin', authenticateToken, authorize(3), featureController.adminDeleteFeature);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
// router.post('/features/bulk', validateApiKey, authenticateToken, featureController.bulkCreateFeatures);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
// router.post('/features/system', validateApiKey, authenticateToken, authorize(3), featureController.systemCreateFeature);

export default router;