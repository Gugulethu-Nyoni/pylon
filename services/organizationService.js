import OrganizationModel from '../models/supabase/Organization.js';

class OrganizationService {
  async create(data) {
    return await OrganizationModel.create(data);
  }

  async getById(id) {
    return await OrganizationModel.findById(id);
  }

  async getAll() {
    return await OrganizationModel.findAll();
  }

  async update(id, data) {
    return await OrganizationModel.update(id, data);
  }

  async delete(id) {
    return await OrganizationModel.delete(id);
  }
}

export default new OrganizationService();