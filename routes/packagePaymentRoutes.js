import express from 'express';
import packagePaymentController from '../controllers/packagePaymentController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../../../../middleware/validateApiKey.js';
import { authenticateToken } from '../../../@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '../../../@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /packagePayments/:id
// For example:
// router.get('/packagePayments/stats', validateApiKey, packagePaymentController.getPackagePaymentStats);
// =========================================================================

// 🟢 PUBLIC - No authentication
// For example:
// router.get('/packagePayments/public/:id', packagePaymentController.getPublicPackagePaymentById);
// router.get('/packagePayments/latest', packagePaymentController.getLatestPackagePayments);

/**
 * 🔵 SERVICE-TO-SERVICE / WEBHOOK COMMUNICATION
 * This endpoint handles the normalized data sent from the Blinque 
 * Gateway (which was triggered by the Paystack Webhook).
 * 
 * Path: /@semantq/pylon/packagePayment/payments/callback
 */

// No middleware here to allow external webhook flow
router.post(
  '/packagePayment/packagePayments/callback', 
  packagePaymentController.handleBlinqueCallback.bind(packagePaymentController)
);

// 🟡 AUTHENTICATED - Logged-in users only
router.get('/packagePayment/packagePayments/checkStatus/:userId', authenticateToken, packagePaymentController.checkStatus);
router.get('/packagePayment/packagePayments', authenticateToken, packagePaymentController.getAllPackagePayments);
router.get('/packagePayment/packagePayments/:id', authenticateToken, packagePaymentController.getPackagePaymentById);
router.post('/packagePayment/packagePayments', authenticateToken, packagePaymentController.createPackagePayment);

// INITIATE ACCOUNT PAYMENT
router.post('/packagePayment/packagePayments/initiate', authenticateToken, packagePaymentController.initiatePackagePayment);
router.put('p/ackagePayment/packagePayments/:id', authenticateToken, packagePaymentController.updatePackagePayment);
router.delete('/packagePayment/packagePayments/:id', authenticateToken, packagePaymentController.deletePackagePayment);

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 2
// router.patch('/packagePayments/:id', authenticateToken, authorize(2), packagePaymentController.patchPackagePayment);
// router.delete('/packagePayments/:id/admin', authenticateToken, authorize(3), packagePaymentController.adminDeletePackagePayment);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
// router.post('/packagePayments/bulk', validateApiKey, authenticateToken, packagePaymentController.bulkCreatePackagePayments);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
// router.post('/packagePayments/system', validateApiKey, authenticateToken, authorize(3), packagePaymentController.systemCreatePackagePayment);

export default router;