import express from 'express';
import pricingPackageFeatureController from '../controllers/pricingPackageFeatureController.js';
import { authenticateToken } from '@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// 🟢 ADMIN ONLY - Pricing package feature management
router.post('/pricing-package-features', authenticateToken, authorize(3), pricingPackageFeatureController.createPricingPackageFeature);
router.get('/pricing-package-features', authenticateToken, pricingPackageFeatureController.getAllPricingPackageFeatures);
router.get('/pricing-package-features/:id', authenticateToken, pricingPackageFeatureController.getPricingPackageFeatureById);
router.put('/pricing-package-features/:id', authenticateToken, authorize(3), pricingPackageFeatureController.updatePricingPackageFeature);
router.delete('/pricing-package-features/:id', authenticateToken, authorize(3), pricingPackageFeatureController.deletePricingPackageFeature);

export default router;