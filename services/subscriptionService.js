import dayjs from 'dayjs';
import OrganizationModel from '../models/postgresql/Organization.js';
import PricingPackageModel from '../models/postgresql/PricingPackage.js';

class SubscriptionService {
  /**
   * Logic for initial signup: Trial vs. Free vs. Paid
   */
  async initializeSubscription(organizationId, packageId) {
    const pkg = await PricingPackageModel.findById(packageId);
    
    let trialEndsAt = null;
    let paidPeriodEnd = null;

    // Rule 1: If price is 0, it's Free (Active forever-ish)
    if (pkg.priceMonthly === 0) {
      paidPeriodEnd = dayjs().add(10, 'year').toDate(); // Effective "forever"
    } 
    // Rule 2: If package has trial enabled
    else if (pkg.hasTrial) {
      trialEndsAt = dayjs().add(pkg.trialDays, 'day').toDate();
    }
    // Rule 3: Paid with no trial starts as NULL (blocked by guard until payment)

    return await OrganizationModel.update(organizationId, {
      trialEndsAt,
      paidPeriodEnd,
      pricingPackageId: packageId
    });
  }

  /**
   * The Anniversary Logic: Extending a subscription after payment
   */
  async activatePaidSubscription(organizationId, billingCycle) {
    const org = await OrganizationModel.findById(organizationId);
    
    // Start from the current paidPeriodEnd if it's in the future (extension)
    // or from 'now' if they are expired/new
    const startDate = (org.paidPeriodEnd && dayjs(org.paidPeriodEnd).isAfter(dayjs()))
      ? dayjs(org.paidPeriodEnd)
      : dayjs();

    const nextEnd = billingCycle === 'YEARLY' 
      ? startDate.add(1, 'year') 
      : startDate.add(1, 'month');

    return await OrganizationModel.update(organizationId, {
      trialEndsAt: null, // Clear trial once they pay
      paidPeriodStart: dayjs().toDate(),
      paidPeriodEnd: nextEnd.toDate()
    });
  }

  /**
   * Helper to determine current status for the Guard
   */
  getSubscriptionStatus(org) {
    const now = dayjs();

    // 1. Check Paid Period
    if (org.paidPeriodEnd && dayjs(org.paidPeriodEnd).isAfter(now)) {
      return 'ACTIVE';
    }

    // 2. Check Grace Period (7 days post paidPeriodEnd)
    if (org.paidPeriodEnd && dayjs(org.paidPeriodEnd).add(7, 'day').isAfter(now)) {
      return 'GRACE_PERIOD';
    }

    // 3. Check Trial
    if (org.trialEndsAt && dayjs(org.trialEndsAt).isAfter(now)) {
      return 'TRIALING';
    }

    return 'EXPIRED';
  }
}

export default new SubscriptionService();