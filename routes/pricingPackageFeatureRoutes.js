import express from 'express';
import pricingPackageFeatureController from '../controllers/pricingPackageFeatureController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../middleware/validateApiKey.js';
import { authenticateToken } from '@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /pricingPackageFeatures/:id
// For example:
// router.get('/pricingPackageFeatures/stats', validateApiKey, pricingPackageFeatureController.getPricingPackageFeatureStats);
// =========================================================================

// 🟢 PUBLIC - No authentication
// For example:
// router.get('/pricingPackageFeatures/public/:id', pricingPackageFeatureController.getPublicPricingPackageFeatureById);
// router.get('/pricingPackageFeatures/latest', pricingPackageFeatureController.getLatestPricingPackageFeatures);

// 🟡 AUTHENTICATED - Logged-in users only
router.get('/pricingPackageFeatures', authenticateToken, pricingPackageFeatureController.getAllPricingPackageFeatures);
router.get('/pricingPackageFeatures/:id', authenticateToken, pricingPackageFeatureController.getPricingPackageFeatureById);
router.post('/pricingPackageFeatures', authenticateToken, pricingPackageFeatureController.createPricingPackageFeature);
router.put('/pricingPackageFeatures/:id', authenticateToken, pricingPackageFeatureController.updatePricingPackageFeature);
router.delete('/pricingPackageFeatures/:id', authenticateToken, pricingPackageFeatureController.deletePricingPackageFeature); // 🆕 DELETE route added

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 2
// router.patch('/pricingPackageFeatures/:id', authenticateToken, authorize(2), pricingPackageFeatureController.patchPricingPackageFeature);
// router.delete('/pricingPackageFeatures/:id/admin', authenticateToken, authorize(3), pricingPackageFeatureController.adminDeletePricingPackageFeature);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
// router.post('/pricingPackageFeatures/bulk', validateApiKey, authenticateToken, pricingPackageFeatureController.bulkCreatePricingPackageFeatures);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
// router.post('/pricingPackageFeatures/system', validateApiKey, authenticateToken, authorize(3), pricingPackageFeatureController.systemCreatePricingPackageFeature);

export default router;