import dayjs from 'dayjs';
import PylonModel from '../models/postgresql/Pylon.js';
import UserModel from '../models/postgresql/User.js';
import MeteringModel from '../models/postgresql/Metering.js';

class PylonService {
  constructor() {}

  /**
   * Evaluates the organization's current subscription lifecycle phase.
   * Internal helper used by the featureGuard.
   */
 checkSubscription(org) {
  const now = dayjs();

  // 1. Active Paid Period
  if (org.paidPeriodEnd && dayjs(org.paidPeriodEnd).isAfter(now)) {
    const endDate = org.paidPeriodEnd;
    const daysRemaining = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return { 
      status: 'ACTIVE', 
      allowed: true,
      daysRemaining,
      endDate
    };
  }

  // 2. Grace Period (7-day buffer after paidPeriodEnd)
  if (org.paidPeriodEnd && dayjs(org.paidPeriodEnd).add(7, 'day').isAfter(now)) {
    const endDate = dayjs(org.paidPeriodEnd).add(7, 'day').toDate();
    const daysRemaining = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return { 
      status: 'GRACE', 
      allowed: true,
      daysRemaining,
      endDate
    };
  }

  // 3. Active Trial Period
  if (org.trialEndsAt && dayjs(org.trialEndsAt).isAfter(now)) {
    const endDate = org.trialEndsAt;
    const daysRemaining = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return { 
      status: 'TRIAL', 
      allowed: true,
      daysRemaining,
      endDate
    };
  }

  // 4. Everything else is Lapsed/Expired
  return { status: 'LAPSED', allowed: false, daysRemaining: 0 };
}
  /**
   * FIXED: Proper middleware factory function with Subscription Gate
   */
  featureGuard(model, action, options = {}) {
    return async (req, res, next) => {
      try {
        let isAllowed = false;
        let notAllowedMessage;
        let noCreditMessage;

        const routeFeature = `${model.toLowerCase()}_${action}`;
        
        // Retrieve user data
        const userData = await UserModel.getPylonUserById(req.userId);

        if (!userData) {
          console.log('User not found:', req.userId);
          return res.status(404).json({ message: 'User not found' });
        }

        const org = userData.organization;

        // --- LAYER 1: SUBSCRIPTION GATE ---
        if (!options.bypassSubscription) {
          const sub = this.checkSubscription(org);
          if (!sub.allowed) {
            return res.status(402).json({
              message: 'Subscription Required',
              code: 'PAYMENT_REQUIRED',
              status: sub.status
            });
          }
          req.subscriptionStatus = sub.status;
        }

        // --- LAYER 2: FEATURE PERMISSIONS (Based on Pricing Package) ---
        const features = Object.fromEntries(
          org.pricingPackage.features.map(f => [
            f.feature.name,
            {
              limitValue: f.limitValue,
              status: f.status,
              count: f.feature.count,
              timeframe: f.feature.timeframe
            }
          ])
        );

        // Check if feature exists and is enabled in the organization's pricing package
        const featureExists = features[routeFeature] !== undefined;
        const featureEnabled = features[routeFeature]?.status === true;

        if (featureExists && featureEnabled) {
          isAllowed = true;
        } else if (!featureExists) {
          notAllowedMessage = `Feature '${routeFeature}' is not included in your current plan.`;
        } else if (!featureEnabled) {
          notAllowedMessage = `Feature '${routeFeature}' is disabled in your plan.`;
        } else {
          notAllowedMessage = 'You have no access to this feature';
        }

        // --- LAYER 3: QUOTA METERING ---
        const hasCredit = await this.checkCredit(userData, routeFeature, features);
        if (!hasCredit.status) {
          const timeframeLabel = features[routeFeature]?.timeframe;
          const formattedTimeframe = timeframeLabel 
            ? `${timeframeLabel.charAt(0).toUpperCase()}${timeframeLabel.slice(1).toLowerCase()}` 
            : 'Plan';
            
          noCreditMessage = `${formattedTimeframe} Quota exceeded. You need to upgrade your plan.`;
        }

        // --- FINAL EVALUATION ---
        if (isAllowed && hasCredit.status) {
          req.userData = {
            id: userData.id,
            organizationId: org?.id,
            featureName: routeFeature,
            action: action,
          };
          req.pylon = true;

          next();
        } else {
          console.log(`${features[routeFeature]?.timeframe || 'Feature'} Quota/Access denied for user:`, req.userId);
          return res.status(403).json({
            message: `${notAllowedMessage || ''} ${noCreditMessage || ''}`.trim(),
          });
        }
      } catch (error) {
        console.error('Error in featureGuard:', error);
        return res.status(500).json({
          message: 'Internal server error in feature guard'
        });
      }
    };
  }


  
  /**
   * Helper method for feature access logic
   */
  async checkCredit(userData, routeFeature, features) {
  const featureDetail = features[routeFeature];
  if (!featureDetail) return { status: false, message: 'Feature not defined in package' };

  const { timeframe, limitValue, status, count } = featureDetail;

  if (!status) {
    return { status: false, message: 'This feature is disabled' };
  }

  // Unlimited access
  if (count && limitValue === -1) {
    return { status: true, message: 'Unlimited access' };
  }

  // Count-based feature check
  if (count) {
    let usageCount;
    
    if (timeframe === "MONTHLY") {
      usageCount = await MeteringModel.countMonthlyUsage(userData.organizationId, routeFeature);
    } else if (timeframe === "YEARLY") {
      usageCount = await MeteringModel.countYearlyUsage(userData.organizationId, routeFeature);
    } else if (timeframe === "FOREVER") {
      // FOREVER = count ALL usage ever (no time boundary)
      usageCount = await MeteringModel.countTotalUsage(userData.organizationId, routeFeature);
    } else {
      // Default to MONTHLY behavior
      usageCount = await MeteringModel.countMonthlyUsage(userData.organizationId, routeFeature);
    }

    const credit = limitValue - usageCount;

    if (credit <= 0) {
      return { status: false, message: `Quota exhausted for this ${timeframe.toLowerCase()}` };
    } else {
      return { status: true, remaining: credit };
    }
  }

  return { status: true };
}


  async logUsage(data) {
    const usageData = {
      organizationId: parseInt(data.organizationId, 10),
      featureName: data.featureName,
      action: data.action,
      metadata: { userId: data.id }
    };

    return await MeteringModel.create(usageData);
  }

  async create(data) {
    return await PylonModel.create(data);
  }

  async getById(id) {
    return await PylonModel.findById(id);
  }

  async getAll() {
    return await PylonModel.findAll();
  }

  async update(id, data) {
    return await PylonModel.update(id, data);
  }

  async delete(id) {
    return await PylonModel.delete(id);
  }
}

export default new PylonService();