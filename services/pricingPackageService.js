import PricingPackageModel from '../models/mysql/PricingPackage.js';

class PricingPackageService {
  async create(data) {
    const { name, priceMonthly, priceYearly } = data;
    const finalData = {
      name: name,
      priceMonthly: parseInt(priceMonthly),
      priceYearly: parseInt(priceYearly)
    }
    return await PricingPackageModel.create(finalData);
  }

  async getById(id) {
    return await PricingPackageModel.findById(id);
  }

  async getAll() {
    return await PricingPackageModel.findAll();
  }

  async update(id, data) {
    return await PricingPackageModel.update(id, data);
  }

  async delete(id) {
    return await PricingPackageModel.delete(id);
  }
}

export default new PricingPackageService();