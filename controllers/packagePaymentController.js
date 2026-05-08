import packagePaymentService from '../services/packagePaymentService.js';
import organizationService from '../services/organizationService.js';
import PackagePaymentModel from '../models/postgresql/PackagePayment.js';
import getPrismaClient from '../../../../lib/prisma.js';
import pylonService from '../services/pylonService.js';

class PackagePaymentController {
  /**
   * INTERNAL CALLBACK: The universal hand-off point from Blinque/Gateways.
   * Processes webhook events from Yoco, Paystack, and other payment gateways.
   */
  async handleBlinqueCallback(req, res) {
    console.log("-----------------------------------------");
    console.log("NEW WEBHOOK ARRIVED");
    console.log("-----------------------------------------");

    try {
      const payload = req.body;
      console.log("WEBHOOK REQ.BODY",req.body);

      // 1. Extract Values from the normalized Blinque payload
      const paymentRecordId = payload.paymentRecordId;
      const gateway = payload.pylon_gateway || payload.gateway || 'unknown';
      const rawStatus = payload.status || payload.event;
      const vendorRef = payload.gatewayReference || payload.reference || payload.id;

      // 2. Normalize Status
      const successTerms = ['success', 'charge.success', 'payment.succeeded', 'paid', 'PAID'];
      const normalizedStatus = successTerms.includes(String(rawStatus).toLowerCase()) ? 'PAID' : 'FAILED';

      console.log(`[PackagePayment] WEBHOOK PARSE RESULT:`);
      console.log(` -> Record ID:    ${paymentRecordId}`);
      console.log(` -> Normalized:   ${normalizedStatus}`);
      console.log(` -> Gateway:      ${gateway}`);
      console.log(` -> Vendor Ref:   ${vendorRef}`);
      console.log(`==========================================`);

      if (!paymentRecordId) {
        console.error("[PackagePayment] Error: Missing paymentRecordId in webhook.");
        return res.status(400).json({ error: "Missing Reference" });
      }

      // 3. Resolve the DB record
      const paymentRecord = await PackagePaymentModel.findById(paymentRecordId);

      if (!paymentRecord) {
        console.error(`[PackagePayment] No record found for ID: ${paymentRecordId}`);
        return res.status(200).json({ message: "Reference not tracked" });
      }

      // 4. Update Payment Record & Trigger Activation via Service
      await packagePaymentService.updateStatus(paymentRecordId, {
        status: normalizedStatus,
        gatewayReference: vendorRef,
        gateway: gateway,
        rawResponse: payload
      });

      return res.status(200).json({ success: true });

    } catch (err) {
      console.error("[PackagePaymentController] Universal Callback Error:", err.message);
      return res.status(500).json({ error: "Internal processing error" });
    }
  }

  /**
   * Traffic Controller: Checks if the user needs to pay or is already active.
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

      const subscription = pylonService.checkSubscription(org);
      
      const payment = await prisma.packagePayment.findFirst({
        where: { organizationId: org.id, paymentStatus: 'PAID' },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({ 
        success: true, 
        status: subscription.status,
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
      res.status(400).json({ error: err.message });
    }
  }

  async createPackagePayment(req, res) {
    try {
      const result = await packagePaymentService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
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