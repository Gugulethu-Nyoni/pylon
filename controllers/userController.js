// pylon/controllers/userController.js
import userService from '../services/userService.js';

class UserController {
  async createUser(req, res) {
    try {
      let result;
      
      // If request came through Pylon feature guard, use metered creation
      if (req.pylon) {
        result = await userService.create(req);
      } else {
        // Direct creation (personal account or non-Pylon route)
        result = await userService.createDirect(req.body);
      }
      
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getUserPlan(req, res) {
    try {
      const result = await userService.getUserPlan(req.params.userId);
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async getOrganizationUsers(req, res) {
    try {
      const result = await userService.getOrganizationUsers(req.params.organizationId);
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async getUserById(req, res) {
    try {
      const result = await userService.getById(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async getAllUsers(req, res) {
    try {
      const result = await userService.getAll();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateUser(req, res) {
    try {
      const resourceId = parseInt(req.params.id, 10);

      if (isNaN(resourceId)) {
        return res.status(400).json({ error: 'Invalid User ID provided. Must be a number.' });
      }

      const result = await userService.update(resourceId, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const resourceId = parseInt(req.params.id, 10);

      if (isNaN(resourceId)) {
        return res.status(400).json({ error: 'Invalid User ID provided. Must be a number.' });
      }

      await userService.delete(resourceId);
      res.status(204).send();
    } catch (err) {
      if (err.message.includes("Record to delete does not exist")) {
        res.status(404).json({ error: "User not found." });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }

  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { roleId, organizationId } = req.body;
      
      const result = await userService.updateUserRole(id, organizationId, roleId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async adminDeleteUser(req, res) {
    try {
      const { id } = req.params;
      await userService.delete(id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async bulkCreateUsers(req, res) {
    try {
      const { users } = req.body;
      const results = [];
      
      for (const user of users) {
        const result = await userService.createDirect(user);
        results.push(result);
      }
      
      res.status(201).json({ users: results });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getSystemUserStats(req, res) {
    try {
      const stats = await userService.getSystemUserStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async systemCreateUser(req, res) {
    try {
      const result = await userService.systemCreateUser(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async systemDeleteUser(req, res) {
    try {
      const { id } = req.params;
      await userService.systemDeleteUser(id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getSeatStats(req, res) {
    try {
      const { organizationId } = req.params;
      const result = await userService.getSeatStats(organizationId);
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async removeUserFromOrganization(req, res) {
    try {
      const { organizationId, userId } = req.params;
      await userService.removeUserFromOrganization(userId, organizationId);
      res.json({ message: 'User removed from organization successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

export default new UserController();