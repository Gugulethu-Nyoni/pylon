import PricingPackageModel from '../models/mysql/PricingPackage.js';

class PricingPackageService {
  
  async create(data) {
  const {
    name,
    priceMonthly,
    priceYearly,
    isStandard,
    pricingTableLabel,
    yearlyPriceDiscountPercentage
  } = data;

  const finalData = {
    name: name,
    priceMonthly: priceMonthly ? parseInt(priceMonthly) : null,
    priceYearly: priceYearly ? parseInt(priceYearly) : null,
    isStandard: isStandard === '1' || isStandard === 1 || isStandard === true,
    pricingTableLabel: pricingTableLabel || null,
    yearlyPriceDiscountPercentage: yearlyPriceDiscountPercentage
      ? parseFloat(yearlyPriceDiscountPercentage)
      : null
  };

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