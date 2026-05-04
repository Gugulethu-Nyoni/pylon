import OrganizationModel from '../models/postgresql/Organization.js';
import PricingPackageModel from '../models/postgresql/PricingPackage.js';
import UserModel from '../models/postgresql/User.js';

class OrganizationService {
  /**
   * Creates an organization and sets initial subscription state.
   */
  async create(data) {
    const { pricingPackageId, ownerId } = data;
    
    const pricingPackage = await PricingPackageModel.findById(pricingPackageId);
    
    if (!pricingPackage) {
      throw new Error('Pricing package not found');
    }

    const now = new Date();
    let finalData = { ...data };

    const isFreePackage = 
      (!pricingPackage.priceMonthly || pricingPackage.priceMonthly < 1) && 
      (!pricingPackage.priceYearly || pricingPackage.priceYearly < 1);

    if (isFreePackage) {
      // Free packages get 1 year of access immediately
      finalData.paidPeriodStart = now;
      finalData.paidPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      console.log(`[OrgService] Creating free package for ${data.name}. Access granted until ${finalData.paidPeriodEnd}`);
    } else {
      // Paid packages start with a 30-day trial
      finalData.trialStartedAt = now;
      finalData.trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 
      console.log(`[OrgService] Creating paid package for ${data.name}. Trial ends: ${finalData.trialEndsAt}`);
    }

    const organization = await OrganizationModel.create(finalData);
    
    // Ensure the owner is linked to the new organization
    if (organization.ownerId && organization.id) {
      await UserModel.updateOrgId(organization.ownerId, organization.id); 
    }

    return organization;
  }

  /**
   * Activate or Extend Subscription
   * Triggered by the PaymentController. 
   * Uses 'billingCycle' to determine duration and stacks onto existing time.
   */
  async activateSubscription(organizationId, packageId, billingCycle = 'MONTHLY') {
    const org = await OrganizationModel.findById(organizationId);
    if (!org) throw new Error('Organization not found for activation.');

    const now = new Date();
    let newExpiry;

    /**
     * Logic: Stacking Subscriptions
     * If paidPeriodEnd is in the future, we stack. Otherwise, we start from now.
     */
    const currentExpiry = org.paidPeriodEnd && new Date(org.paidPeriodEnd) > now 
      ? new Date(org.paidPeriodEnd) 
      : now;

    newExpiry = new Date(currentExpiry);

    if (billingCycle.toUpperCase() === 'YEARLY') {
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    } else {
      newExpiry.setMonth(newExpiry.getMonth() + 1);
    }

    console.log(`[Subscription] Activating ${organizationId}. Cycle: ${billingCycle}. New Expiry: ${newExpiry.toISOString()}`);

    // Update the organization using schema-valid fields
    return await OrganizationModel.update(organizationId, {
      pricingPackageId: packageId,
      paidPeriodStart: now,
      paidPeriodEnd: newExpiry
    });
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