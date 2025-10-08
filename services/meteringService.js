import MeteringModel from '../models/supabase/Metering.js';

class MeteringService {
  async create(data) {
    return await MeteringModel.create(data);
  }

  async getById(id) {
    const metering = await MeteringModel.findById(id);
    if (!metering) throw new Error('Metering record not found');
    return metering;
  }

  async getByOrganizationAndFeature(organizationId, featureId) {
    const metering = await MeteringModel.findByOrganizationAndFeature(organizationId, featureId);
    if (!metering) throw new Error('Metering record not found');
    return metering;
  }

  async getAll() {
    return await MeteringModel.findAll();
  }

  async update(id, data) {
    await this.getById(id);
    return await MeteringModel.update(id, data);
  }

  async delete(id) {
    await this.getById(id);
    return await MeteringModel.delete(id);
  }

  // Pylon-specific methods
  async getUsage(organizationId, featureId) {
    return await MeteringModel.getOrCreate(organizationId, featureId);
  }

  async incrementUsage(organizationId, featureId, amount = 1) {
    return await MeteringModel.incrementUsage(organizationId, featureId, amount);
  }
}

export default new MeteringService();