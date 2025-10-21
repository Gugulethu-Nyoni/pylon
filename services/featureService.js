import FeatureModel from '../models/mysql/Feature.js';

class FeatureService {
  async create(data) {
    return await FeatureModel.create(data);
  }

  async getById(id) {
    return await FeatureModel.findById(id);
  }

  // getNonCrudFeatureNames

  async getNonCrudFeatureNames() {
    return await FeatureModel.getNonCrudFeatureNames();
  }

  async getAll() {
    return await FeatureModel.findAll();
  }

  async update(id, data) {
    return await FeatureModel.update(id, data);
  }

  async delete(id) {
    return await FeatureModel.delete(id);
  }
}

export default new FeatureService();