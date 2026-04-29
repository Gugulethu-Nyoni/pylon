import ModelModel from '../models/postgresql/Model.js';
import ModelsManifest from '../../../../lib/models_manifest.js';
import NonCrudModelsManifest from '../../../../lib/non_crud_models_manifest.js';

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

  async getAllNonCrudModels() {
    //return await ModelModel.findAll();
    return NonCrudModelsManifest;
  }

  async update(id, data) {
    return await ModelModel.update(id, data);
  }

  async delete(id) {
    return await ModelModel.delete(id);
  }
}

export default new ModelService();