import OrganizationModel from '../models/mysql/Organization.js';
import PricingPackageModel from '../models/mysql/PricingPackage.js';
import UserModel from '../models/mysql/User.js';



class OrganizationService {
  async create(data) {
    const { name, pricingPackageId, ownerId } = data;
    
    // Get pricing package details
    const pricingPackage = await PricingPackageModel.findById(pricingPackageId);
    
    if (!pricingPackage) {
      throw new Error('Pricing package not found');
    }

    const now = new Date();
    let finalData = { ...data };

    // Check if it's a free package (both prices are 0 or less than 1)
    const isFreePackage = 
      (!pricingPackage.priceMonthly || pricingPackage.priceMonthly < 1) && 
      (!pricingPackage.priceYearly || pricingPackage.priceYearly < 1);

    if (isFreePackage) {
      // For free packages, activate immediately with 1-year period
      finalData.paidPeriodStart = now;
      finalData.paidPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      console.log('Creating free package with automatic activation');
    } else {
      // For paid packages, set trial period (30 days)
      finalData.trialStartedAt = now;
      finalData.trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      console.log('Creating paid package with trial period');
    }

    // Create the organization
    const organization = await OrganizationModel.create(finalData);
    const userUpdate = await UserModel.updateOrgId(organization.ownerId, organization.id); 
    //console.log("organization data",organization);

    return organization;
  }

  async getById(id) {
    return await OrganizationModel.findById(id);
  }

  async getAll() {
    return await OrganizationModel.findAll();
  }

  async update(id, data) {
    return await OrganizationModel.update(id, data);
  }

  async delete(id) {
    return await OrganizationModel.delete(id);
  }
}

export default new OrganizationService();