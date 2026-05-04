// pylon/services/userService.js
import pylonService from './pylonService.js';
import MeteringModel from '../models/postgresql/Metering.js';
import { signupUser } from '../../auth/services/authService.js';
import UserModel from '../models/postgresql/User.js'; // Only needed for update/query, not create

class UserService {
  
 async create(req) {
    const data = req.body;
    const userData = req.userData; // From feature guard middleware
    
    try {
      // 1. Auth handles user creation (password, email, database insert)
      const authResult = await signupUser({
        name: data.name,
        email: data.email,
        password: data.password,
        username: data.username,
        ref: data.ref || 1
      });
      
      console.log("Auth user created:", authResult);
      
      // 2. Find the user to get the ID
      const createdUser = await UserModel.findByEmail(data.email);
      
      if (!createdUser || !createdUser.id) {
        throw new Error("User created but could not be retrieved");
      }
      
      // 3. Update organizationId (link user to organization)
      if (userData && userData.organizationId) {
        await UserModel.update(createdUser.id, {
          organizationId: userData.organizationId
        });
      }
      
      // 4. Log metering (seat usage)
      if (userData && userData.organizationId) {
        console.log("Logging user creation metering...");
        await pylonService.logUsage({
          ...userData,
          id: createdUser.id,
          metadata: { 
            userId: createdUser.id,
            email: data.email,
            organizationId: userData.organizationId
          }
        });
      }
      
      return {
        id: createdUser.id,
        name: data.name,
        email: data.email,
        organizationId: userData?.organizationId,
        message: "User created. Verification email sent."
      };
      
    } catch (err) {
      console.error("User creation error:", err.message);
      throw new Error(`User creation failed: ${err.message}`);
    }
  }


  async createDirect(data) {
    // Direct creation without metering (for personal accounts or system users)
    return await UserModel.create(data);
  }

  async getById(id) {
    return await UserModel.findById(id);
  }

  async getUserPlan(userId) {
    return await UserModel.getUserPlanFeatures(parseInt(userId, 10));
  }

  async getOrganizationUsers(organizationId) {
    return await UserModel.getOrganizationUsers(parseInt(organizationId, 10));
  }

  async getOrganizationUsersWithSeatInfo(organizationId) {
    const users = await UserModel.getOrganizationUsers(parseInt(organizationId, 10));
    const organization = await UserModel.getOrganizationWithSeatFeature(organizationId);
    
    const seatFeature = organization?.pricingPackage?.features?.find(
      f => f.feature?.name === 'seats' || f.featureName === 'seats'
    );
    
    const maxSeats = seatFeature?.seats || seatFeature?.limitValue || 1;
    
    return {
      users,
      seatInfo: {
        current: users.length,
        max: maxSeats,
        remaining: maxSeats - users.length,
        percentageUsed: Math.round((users.length / maxSeats) * 100)
      }
    };
  }

  async getSeatStats(organizationId) {
    const users = await UserModel.getOrganizationUsers(parseInt(organizationId, 10));
    const organization = await UserModel.getOrganizationWithSeatFeature(organizationId);
    
    const seatFeature = organization?.pricingPackage?.features?.find(
      f => f.feature?.name === 'seats' || f.featureName === 'seats'
    );
    
    const maxSeats = seatFeature?.seats || seatFeature?.limitValue || 1;
    
    return {
      current: users.length,
      max: maxSeats,
      remaining: maxSeats - users.length,
      percentageUsed: Math.round((users.length / maxSeats) * 100),
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role,
        access_level: u.access_level,
        status: u.status,
        joinedAt: u.createdAt,
        lastLoginAt: u.last_login_at
      }))
    };
  }

  async getAll() {
    return await UserModel.findAll();
  }

  async update(id, data) {
    // Check if this update requires metering (e.g., role change)
    const oldUser = await UserModel.findById(id);
    const updateResult = await UserModel.update(id, data);
    
    // If role changed and user is in an organization, log metering
    if (oldUser && data.roleId && oldUser.roleId !== data.roleId && oldUser.organizationId) {
      await MeteringModel.create({
        organizationId: parseInt(oldUser.organizationId, 10),
        featureName: 'user_role',
        action: 'update',
        metadata: {
          userId: id,
          oldRole: oldUser.roleId,
          newRole: data.roleId,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return updateResult;
  }

  async updateUserRole(userId, organizationId, roleId) {
    const user = await UserModel.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.organizationId !== parseInt(organizationId, 10)) {
      throw new Error('User does not belong to this organization');
    }
    
    const updated = await UserModel.update(userId, { roleId });
    
    // Log role change metering
    await MeteringModel.create({
      organizationId: parseInt(organizationId, 10),
      featureName: 'user_role',
      action: 'update',
      metadata: {
        userId,
        oldRole: user.roleId,
        newRole: roleId,
        timestamp: new Date().toISOString()
      }
    });
    
    return updated;
  }

  async delete(id) {
    // Get user info before deletion for metering
    const user = await UserModel.findById(id);
    
    const deleted = await UserModel.delete(id);
    
    // If user was in an organization, log seat deallocation
    if (user && user.organizationId) {
      await MeteringModel.create({
        organizationId: parseInt(user.organizationId, 10),
        featureName: 'seats',
        action: 'user_deleted',
        metadata: {
          userId: id,
          email: user.email,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return deleted;
  }

  async removeUserFromOrganization(userId, organizationId) {
    const user = await UserModel.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.organizationId !== parseInt(organizationId, 10)) {
      throw new Error('User does not belong to this organization');
    }
    
    // Remove organization association (don't delete user)
    const updated = await UserModel.update(userId, { 
      organizationId: null,
      roleId: null
    });
    
    // Log seat deallocation
    await MeteringModel.create({
      organizationId: parseInt(organizationId, 10),
      featureName: 'seats',
      action: 'user_removed',
      metadata: {
        userId,
        email: user.email,
        timestamp: new Date().toISOString()
      }
    });
    
    return updated;
  }

  async inviteUserToOrganization(organizationId, userData, invitedByUserId) {
    // Check if user already exists
    let user = await UserModel.findByEmail(userData.email);
    
    if (!user) {
      // Create new user with organization context
      user = await UserModel.create({
        ...userData,
        organizationId: parseInt(organizationId, 10),
        is_verified: false, // Will need to verify email
        access_level: userData.access_level || 1
      });
    } else {
      // Update existing user to add organization
      if (!user.organizationId) {
        user = await UserModel.update(user.id, {
          organizationId: parseInt(organizationId, 10)
        });
      } else if (user.organizationId !== parseInt(organizationId, 10)) {
        throw new Error('User already belongs to another organization');
      }
    }
    
    // Log invitation metering
    await MeteringModel.create({
      organizationId: parseInt(organizationId, 10),
      featureName: 'seats',
      action: 'user_invited',
      metadata: {
        userId: user.id,
        email: user.email,
        invitedBy: invitedByUserId,
        timestamp: new Date().toISOString()
      }
    });
    
    return user;
  }

  async getSystemUserStats() {
    const totalUsers = await UserModel.count();
    const usersByOrganization = await UserModel.groupByOrganization();
    const usersByAccessLevel = await UserModel.groupByAccessLevel();
    
    return {
      totalUsers,
      usersByOrganization,
      usersByAccessLevel,
      organizationsWithUsers: Object.keys(usersByOrganization).length
    };
  }

  async systemCreateUser(userData) {
    // System admin creation - bypasses seat limits and feature guards
    return await UserModel.create(userData);
  }

  async systemDeleteUser(id) {
    // System admin deletion - hard delete
    return await UserModel.delete(id);
  }
}

export default new UserService();