import userService from '../services/userService.js';

class UserController {
  async createUser(req, res) {
    try {
      const result = await userService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }


  async getUserPlan(req, res) {
    try {
      const result = await userService.getUserPlan(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }


  // getOrganizationUsers

async getOrganizationUsers(req, res) {
    try {
      //console.log("REQ",req.params.organizationId);
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
      // Parse ID from string to integer (for sqlite/mysql; mongo uses string IDs)
      const resourceId = parseInt(req.params.id, 10);

      // Validate parsed ID
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
      // Parse ID from string to integer (for sqlite/mysql; mongo uses string IDs)
      const resourceId = parseInt(req.params.id, 10);

      // Validate parsed ID
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
}

export default new UserController();