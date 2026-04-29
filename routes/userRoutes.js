import express from 'express';
import userController from '../controllers/userController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../../../../middleware/validateApiKey.js';
import { authenticateToken } from '../../../@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '../../../@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /users/:id
// For example:
// router.get('/users/stats', validateApiKey, userController.getUserStats);
// =========================================================================

// 🟢 PUBLIC - No authentication
// For example:
// router.get('/users/public/:id', userController.getPublicUserById);
// router.get('/users/latest', userController.getLatestUsers);

// 🟡 AUTHENTICATED - Logged-in users only
router.get('/user/users', authenticateToken, userController.getAllUsers);

router.get('/user/users/plan/:id', authenticateToken, userController.getUserPlan);
router.get('/user/users/account/:organizationId', authenticateToken, userController.getOrganizationUsers);


//user/users/plan/${user.id}
router.get('/user/users/:id', authenticateToken, userController.getUserById);
router.post('/user/users', authenticateToken, userController.createUser);
router.put('/user/users/:id', authenticateToken, userController.updateUser);
router.delete('/user/users/:id', authenticateToken, userController.deleteUser); // 🆕 DELETE route added

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 2
// router.patch('/users/:id', authenticateToken, authorize(2), userController.patchUser);
// router.delete('/users/:id/admin', authenticateToken, authorize(3), userController.adminDeleteUser);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
// router.post('/users/bulk', validateApiKey, authenticateToken, userController.bulkCreateUsers);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
// router.post('/users/system', validateApiKey, authenticateToken, authorize(3), userController.systemCreateUser);

export default router;