import PricingPackageFeatureModel from '../models/mysql/PricingPackageFeature.js';

class PricingPackageFeatureService {
  async create(data) {
    // Check if relation already exists
    const existing = await PricingPackageFeatureModel.findByPackageAndFeature(
      data.pricingPackageId,
      data.featureId
    );
    if (existing) {
      throw new Error('Feature already exists in this pricing package');
    }
    return await PricingPackageFeatureModel.create(data);
  }

  async getById(id) {
    const ppf = await PricingPackageFeatureModel.findById(id);
    if (!ppf) throw new Error('Pricing package feature not found');
    return ppf;
  }

  async getAll() {
    return await PricingPackageFeatureModel.findAll();
  }

  async update(id, data) {
    await this.getById(id);
    return await PricingPackageFeatureModel.update(id, data);
  }

  async delete(id) {
    await this.getById(id);
    return await PricingPackageFeatureModel.delete(id);
  }
}

export default new PricingPackageFeatureService();