import roleService from '../services/roleService.js';

class RoleController {
  async createRole(req, res) {
    try {
      const result = await roleService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getRoleById(req, res) {
    try {
      const result = await roleService.getById(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async getAllRoles(req, res) {
    try {
      const result = await roleService.getAll();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }


  // roleController.js

async getOrganizationRoles(req, res) {
    try {
      // 1. EXTRACT THE PARAMETER
      const organizationId = parseInt(req.params.organizationId); // Assuming organizationId is an integer
      
      // 2. PASS IT TO THE SERVICE
      const result = await roleService.getOrganizationRoles(organizationId);
      
      res.json(result);
    } catch (err) {
      // Handle non-numeric organizationId or other errors
      console.error("Error fetching organization roles:", err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
}


  

  async updateRole(req, res) {
    try {
      // Parse ID from string to integer (for sqlite/mysql; mongo uses string IDs)
      const resourceId = parseInt(req.params.id, 10);

      // Validate parsed ID
      if (isNaN(resourceId)) {
        return res.status(400).json({ error: 'Invalid Role ID provided. Must be a number.' });
      }

      const result = await roleService.update(resourceId, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deleteRole(req, res) {
    try {
      // Parse ID from string to integer (for sqlite/mysql; mongo uses string IDs)
      const resourceId = parseInt(req.params.id, 10);

      // Validate parsed ID
      if (isNaN(resourceId)) {
        return res.status(400).json({ error: 'Invalid Role ID provided. Must be a number.' });
      }

      await roleService.delete(resourceId);
      res.status(204).send();
    } catch (err) {
      if (err.message.includes("Record to delete does not exist")) {
        res.status(404).json({ error: "Role not found." });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }
}

export default new RoleController();