// pylon/routes/userRoutes.js
import express from 'express';
import userController from '../controllers/userController.js';
// Import authentication and authorization middleware
import { validateApiKey } from '../../../../middleware/validateApiKey.js';
import { authenticateToken } from '../../auth/lib/middleware/authMiddleware.js';
import { authorize } from '../../auth/lib/middleware/authorize.js';
import pylonService from '../services/pylonService.js';

const dataModel = 'User';
const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /users/:id
// For example:
// router.get(
//   '/users/stats', 
//   validateApiKey,
//   pylonService.featureGuard(dataModel, 'read'),
//   userController.getUserStats
// );
// =========================================================================

// 🟢 PUBLIC - No authentication (No Pylon feature guarding)
// For example:
// router.get('/users/public/:id', userController.getPublicUserById);
// router.get('/users/latest', userController.getLatestUsers);

// 🟡 AUTHENTICATED - Logged-in users only
router.get(
  '/user/users',
  authenticateToken,
  pylonService.featureGuard(dataModel, 'read'),
  userController.getAllUsers
);

router.get(
  '/user/users/plan/:userId',
  authenticateToken,
  userController.getUserPlan
);

router.get(
  '/user/users/account/:organizationId',
  authenticateToken,
  pylonService.featureGuard(dataModel, 'read'),
  userController.getOrganizationUsers
);

router.get(
  '/user/users/:id',
  authenticateToken,
  pylonService.featureGuard(dataModel, 'read'),
  userController.getUserById
);

router.post(
  '/user/users',
  authenticateToken,
  pylonService.featureGuard(dataModel, 'create'),
  userController.createUser
);

router.put(
  '/user/users/:id',
  authenticateToken,
  pylonService.featureGuard(dataModel, 'update'),
  userController.updateUser
);

router.delete(
  '/user/users/:id',
  authenticateToken,
  pylonService.featureGuard(dataModel, 'delete'),
  userController.deleteUser
);

// 🟠 AUTHORIZED - Specific user roles
// For example, this route requires an access level of 60 (Org Admin)
router.patch(
  '/user/users/:id/role',
  authenticateToken,
  authorize(60),
  pylonService.featureGuard(dataModel, 'update'),
  userController.updateUserRole
);

router.delete(
  '/user/users/:id/admin',
  authenticateToken,
  authorize(770),
  pylonService.featureGuard(dataModel, 'delete'),
  userController.adminDeleteUser
);

// 🔴 FULLY_PROTECTED - API key + user authentication
// For example:
router.post(
  '/users/bulk',
  validateApiKey,
  authenticateToken,
  pylonService.featureGuard(dataModel, 'create'),
  userController.bulkCreateUsers
);

router.get(
  '/users/system/stats',
  validateApiKey,
  authenticateToken,
  pylonService.featureGuard(dataModel, 'read'),
  userController.getSystemUserStats
);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// For example:
router.post(
  '/users/system',
  validateApiKey,
  authenticateToken,
  authorize(770),
  pylonService.featureGuard(dataModel, 'create'),
  userController.systemCreateUser
);

router.delete(
  '/users/system/:id',
  validateApiKey,
  authenticateToken,
  authorize(770),
  pylonService.featureGuard(dataModel, 'delete'),
  userController.systemDeleteUser
);

export default router;