import PylonModel from '../models/supabase/Pylon.js';

class PylonService {
  async create(data) {
    return await PylonModel.create(data);
  }

  async getById(id) {
    return await PylonModel.findById(id);
  }

  async getAll() {
    return await PylonModel.findAll();
  }

  async update(id, data) {
    return await PylonModel.update(id, data);
  }

  async delete(id) {
    return await PylonModel.delete(id);
  }
}

export default new PylonService();