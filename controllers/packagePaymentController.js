import packagePaymentService from '../services/packagePaymentService.js';
import organizationService from '../services/organizationService.js';
import PackagePaymentModel from '../models/postgresql/PackagePayment.js';
import getPrismaClient from '../../../../lib/prisma.js';
import pylonService from '../services/pylonService.js';


class PackagePaymentController {
  /**
   * INTERNAL CALLBACK: The universal hand-off point from Blinque/Gateways.
   */
  async handleBlinqueCallback(req, res) {
    console.log("-----------------------------------------");
    console.log("NEW WEBHOOK ARRIVED");
    console.log("-----------------------------------------");

    const deepSeek = (obj, targetKey) => {
      if (!obj || typeof obj !== 'object') return null;
      if (Object.prototype.hasOwnProperty.call(obj, targetKey)) return obj[targetKey];
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const found = deepSeek(item, targetKey);
          if (found !== null) return found;
        }
      }
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          const found = deepSeek(obj[key], targetKey);
          if (found !== null) return found;
        }
      }
      return null;
    };

    try {
      const payload = req.body;

      // 1. Extract Raw Values
      const rawReference = deepSeek(payload, 'reference') || 
                           deepSeek(payload, 'checkoutId') || 
                           payload.externalId;

      const gateway = deepSeek(payload, 'pylon_gateway') || 
                      deepSeek(payload, 'gateway') || 'unknown';
      
      const rawStatus = deepSeek(payload, 'status') || 
                        deepSeek(payload, 'event');

      const vendorRef = deepSeek(payload, 'id') || 
                        deepSeek(payload, 'gatewayReference');

      // 2. LOGIC: Handle the timestamp suffix (e.g., "11_1777893" -> "11")
      let cleanExternalId = rawReference && String(rawReference).includes('_') 
                              ? String(rawReference).split('_')[0] 
                              : rawReference;
          cleanExternalId = parseInt(cleanExternalId,10);

      // 3. Normalize Status
      const successTerms = ['success', 'charge.success', 'payment.succeeded', 'paid', 'PAID'];
      const normalizedStatus = successTerms.includes(String(rawStatus).toLowerCase()) ? 'PAID' : 'FAILED';

      console.log(`[PackagePayment] WEBHOOK PARSE RESULT:`);
      console.log(` -> Cleaned ID:   ${cleanExternalId}`);
      console.log(` -> Normalized:   ${normalizedStatus}`);
      console.log(` -> Gateway:      ${gateway}`);
      console.log(` -> Vendor Ref:   ${vendorRef}`);
      console.log(`==========================================`);

      if (!cleanExternalId) {
        console.error("[PackagePayment] Error: Could not extract reference.");
        return res.status(400).json({ error: "Missing Reference" });
      }

      // 4. Resolve the DB record
      const prisma = await getPrismaClient();
      const paymentRecord = await prisma.packagePayment.findFirst({
        where: { 
            organizationId: !isNaN(parseInt(cleanExternalId)) ? parseInt(cleanExternalId) : undefined,
            paymentStatus: 'PENDING'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!paymentRecord) {
        console.error(`[PackagePayment] No pending record found for ID: ${cleanExternalId}`);
        return res.status(200).json({ message: "Reference not tracked" });
      }

      // 5. Update Payment Record with Audit Logs
      await PackagePaymentModel.update(paymentRecord.id, {
        paymentStatus: normalizedStatus,
        rawResponse: payload, // Maps to rawTransactionResponse in Model
        logMessage: `Webhook received from ${gateway}. Status: ${normalizedStatus}. Vendor Ref: ${vendorRef}`
      });

      // 6. Activation Logic
      if (normalizedStatus === 'PAID') {
        await organizationService.activateSubscription(
            cleanExternalId, 
            paymentRecord.pricingPackageId,
            paymentRecord.billingCycle
        );
        console.log(`[PackagePayment] SUCCESS: Subscription activated for Org ${cleanExternalId}`);
      }

      return res.status(200).json({ success: true });

    } catch (err) {
      console.error("[PackagePaymentController] Universal Callback Error:", err.message);
      return res.status(500).json({ error: "Internal processing error" });
    }
  }

/**
   * Traffic Controller: Checks if the user needs to pay or is already active.
   * Uses PylonService.checkSubscription for consistent subscription status logic.
   */
  async checkStatus(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const prisma = await getPrismaClient();

      const org = await prisma.organization.findFirst({
        where: { ownerId: userId },
        include: { pricingPackage: true }
      });
      
      if (!org) {
        return res.json({ success: true, status: 'NONE', hasOrganization: false });
      }

      // Use PylonService.checkSubscription for consistent status
      const subscription = pylonService.checkSubscription(org);
      
      // Check if there's a completed payment (for backward compatibility)
      const payment = await prisma.packagePayment.findFirst({
        where: { organizationId: org.id, paymentStatus: 'PAID' },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({ 
        success: true, 
        status: subscription.status,  // ACTIVE, TRIAL, GRACE, LAPSED
        hasOrganization: true,
        hasPayment: !!payment,
        organization: org,
        subscriptionDetails: {
          allowed: subscription.allowed,
          daysRemaining: subscription.daysRemaining,
          endDate: subscription.endDate
        }
      });

    } catch (err) {
      console.error("[PackagePaymentController] checkStatus Error:", err);
      res.status(500).json({ error: err.message });
    }
  }

  async initiatePackagePayment(req, res) {
    try {
      const result = await packagePaymentService.initiate(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error("Error initiating checkout:", err);
      res.status(400).json({ error: err.message });
    }
  }

  async createPackagePayment(req, res) {
    try {
      const result = await packagePaymentService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      console.error("Error creating payment record:", err);
      res.status(400).json({ error: err.message });
    }
  }

  async getPackagePaymentById(req, res) {
    try {
      const result = await packagePaymentService.getById(req.params.id);
      if (!result) return res.status(404).json({ error: "Payment record not found" });
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async getAllPackagePayments(req, res) {
    try {
      const result = await packagePaymentService.getAll();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updatePackagePayment(req, res) {
    try {
      const result = await packagePaymentService.update(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deletePackagePayment(req, res) {
    try {
      await packagePaymentService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

export default new PackagePaymentController();