import UserModel from '../models/mysql/User.js';

class UserService {
  async create(data) {
    return await UserModel.create(data);
  }

  async getById(id) {
    return await UserModel.findById(id);
  }

  async getUserPlan(id) {
    return await UserModel.getPylonUserById(parseInt(id,10));
  }

    async getOrganizationUsers(organizationId) {
    return await UserModel.getOrganizationUsers(parseInt(organizationId,10));
  }

  // getOrganizationUsers

  async getAll() {
    return await UserModel.findAll();
  }

  async update(id, data) {
    return await UserModel.update(id, data);
  }

  async delete(id) {
    return await UserModel.delete(id);
  }
}

export default new UserService();