import subscriptionService from '../services/subscriptionService.js';
import OrganizationModel from '../models/postgresql/Organization.js';

/**
 * Subscription Guard Middleware
 * Protects routes based on Organization subscription status.
 */
export const subscriptionGuard = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(403).json({ error: "Organization context missing." });
    }

    // 1. Fetch the latest Organization data
    const org = await OrganizationModel.findById(organizationId);
    if (!org) {
      return res.status(404).json({ error: "Organization not found." });
    }

    // 2. Determine Status
    const status = subscriptionService.getSubscriptionStatus(org);

    // 3. Inject status into request for downstream use (controllers/views)
    req.subscriptionStatus = status;
    res.setHeader('X-Subscription-Status', status);

    // 4. Exclusion: Always allow access to billing and support routes
    const bypassRoutes = ['/billing', '/payments', '/packages', '/support'];
    const isBypass = bypassRoutes.some(route => req.originalUrl.includes(route));

    if (isBypass) {
      return next();
    }

    // 5. Enforcement Logic
    switch (status) {
      case 'ACTIVE':
      case 'TRIALING':
        return next();

      case 'GRACE_PERIOD':
        // Allow access but you could add a custom header for frontend warning banners
        res.setHeader('X-Subscription-Warning', 'Payment Overdue - Grace Period Active');
        return next();

      case 'EXPIRED':
        return res.status(402).json({
          error: "Subscription Expired",
          message: "Your access has been suspended. Please update your payment details.",
          status: 'EXPIRED'
        });

      default:
        return res.status(402).json({ error: "Valid subscription required." });
    }
  } catch (err) {
    console.error('Subscription Guard Error:', err);
    res.status(500).json({ error: "Internal server error during subscription check." });
  }
};