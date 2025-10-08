import ModelModel from '../models/supabase/Model.js';
import ModelsManifest from '../lib/models_manifest.js';

class ModelService {
  async create(data) {
    return await ModelModel.create(data);
  }

  async getById(id) {
    return await ModelModel.findById(id);
  }

  async getAll() {
    //return await ModelModel.findAll();
    return ModelsManifest;
  }

  async update(id, data) {
    return await ModelModel.update(id, data);
  }

  async delete(id) {
    return await ModelModel.delete(id);
  }
}

export default new ModelService();