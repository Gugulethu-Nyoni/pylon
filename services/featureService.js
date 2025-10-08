import FeatureModel from '../models/supabase/Feature.js';

class FeatureService {
  async create(data) {
    return await FeatureModel.create(data);
  }

  async getById(id) {
    const feature = await FeatureModel.findById(id);
    if (!feature) throw new Error('Feature not found');
    return feature;
  }

  async getByName(name) {
    const feature = await FeatureModel.findByName(name);
    if (!feature) throw new Error('Feature not found');
    return feature;
  }

  async getAll() {
    return await FeatureModel.findAll();
  }

  async update(id, data) {
    await this.getById(id); // Verify exists
    return await FeatureModel.update(id, data);
  }

  async delete(id) {
    await this.getById(id); // Verify exists
    return await FeatureModel.delete(id);
  }
}

export default new FeatureService();