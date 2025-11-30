import RoleModel from '../models/mysql/Role.js';

class RoleService {
  async create(data) {
    return await RoleModel.create(data);
  }

  async getById(id) {
    return await RoleModel.findById(id);
  }

  async getAll() {
    return await RoleModel.findAll();
  }

async getOrganizationRoles(organizationId) {
    // PASS IT TO THE MODEL
    return await RoleModel.getOrganizationRoles(organizationId); 
}

  
  async update(id, data) {
    return await RoleModel.update(id, data);
  }

  async delete(id) {
    return await RoleModel.delete(id);
  }
}

export default new RoleService();