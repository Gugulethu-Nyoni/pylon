import express from 'express';
import pricingPackageController from '../controllers/pricingPackageController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../../../../middleware/validateApiKey.js';
import { authenticateToken } from '../../../@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '../../../@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /pricingPackages/:id
// For example:
// router.get('/pricingPackages/stats', validateApiKey, pricingPackageController.getPricingPackageStats);
// =========================================================================

// 🟢 PUBLIC - No authentication
// For example:
// router.get('/pricingPackages/public/:id', pricingPackageController.getPublicPricingPackageById);
// router.get('/pricingPackages/latest', pricingPackageController.getLatestPricingPackages);

// 🟡 AUTHENTICATED - Logged-in users only
router.get('/pricingPackage/pricingPackages', pricingPackageController.getAllPricingPackages);
router.get('/pricingPackage/pricingPackages/:id', authenticateToken, pricingPackageController.getPricingPackageById);
router.post('/pricingPackage/pricingPackages', authenticateToken, pricingPackageController.createPricingPackage);
router.put('/pricingPackage/pricingPackages/:id', authenticateToken, pricingPackageController.updatePricingPackage);
router.delete('/pricingPackage/pricingPackages/:id', authenticateToken, pricingPackageController.deletePricingPackage); // 🆕 DELETE route added

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 2
// router.patch('/pricingPackages/:id', authenticateToken, authorize(2), pricingPackageController.patchPricingPackage);
// router.delete('/pricingPackages/:id/admin', authenticateToken, authorize(3), pricingPackageController.adminDeletePricingPackage);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
// router.post('/pricingPackages/bulk', validateApiKey, authenticateToken, pricingPackageController.bulkCreatePricingPackages);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
// router.post('/pricingPackages/system', validateApiKey, authenticateToken, authorize(3), pricingPackageController.systemCreatePricingPackage);

export default router;