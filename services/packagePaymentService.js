// services/packagePaymentService.js
import PackagePaymentModel from '../models/postgresql/PackagePayment.js';
import blinque from '../../blinque/index.js';
import getConfig from '../../../../config_loader.js';
import getPrismaClient from '../../../../lib/prisma.js';

class PackagePaymentService {
  
  async create(data) {
    if (data.amount === 0) data.paymentStatus = 'PAID';
    return await PackagePaymentModel.create(data);
  }

  /**
   * Orchestrates the hand-off to Blinque using centralized config.
   * Supports multiple gateways: yoco, paystack
   */
  async initiate(data) {
    const { amount, organizationId, packageId, billingCycle, gateway = 'yoco', userId } = data;

    // Ensure organizationId is integer
    const orgId = typeof organizationId === 'string' ? parseInt(organizationId, 10) : organizationId;

    // 1. Handle Freemium (Immediate Activation)
    if (amount === 0) {
      await this.create({
        organizationId: orgId,
        pricingPackageId: packageId,
        amount: 0,
        billingCycle,
        paymentStatus: 'PAID'
      });
      
      return { 
        success: true, 
        isFreemium: true, 
        message: "Package activated successfully." 
      };
    }

    // 2. Fetch user email from database
    const prisma = await getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      select: { email: true }
    });
    
    if (!user?.email) {
      throw new Error("Unable to determine user email for payment.");
    }

    // 3. Create PENDING record before checkout (for webhook to update later)
    const pendingRecord = await this.create({
      organizationId: orgId,
      pricingPackageId: packageId,
      amount,
      billingCycle,
      paymentStatus: 'PENDING'
    });

    console.log(`[PackagePaymentService] Created pending record: ${pendingRecord.id}`);

    // 4. Load Config & Blinque Engine
    const [config, engine] = await Promise.all([getConfig(), blinque.init()]);

    const frontendUrl = config.brand?.frontend_base_url || 'http://localhost:3000';
    
    // Simplified: redirect to dashboard after payment
    const successUrl = `${frontendUrl}/org-admin?payment=success`;
    const cancelUrl = `${frontendUrl}/org-admin?payment=cancelled`;

    const checkoutService = blinque.getPaymentGateway(gateway);
    
    // 5. Build payload for gateway
    const checkoutPayload = {
      amount: amount,
      currency: 'ZAR',
      orderId: orgId,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
      email: user.email,
      metadata: {
        packageId,
        billingCycle,
        pylon_gateway: gateway,
        userId: userId,
        paymentRecordId: pendingRecord.id,
        organizationId: orgId
      }
    };

    const checkoutSession = await checkoutService.initiateCheckout(checkoutPayload);

    return {
      success: true,
      gateway,
      ...checkoutSession
    };
  }

  async getById(id) {
    return await PackagePaymentModel.findById(id);
  }

  async getAll() {
    return await PackagePaymentModel.findAll();
  }

  async getByOrg(orgId) {
    return await PackagePaymentModel.findByOrganization(orgId);
  }

  async update(id, data) {
    return await PackagePaymentModel.update(id, data);
  }

  async updateStatus(id, status) {
    const payment = await PackagePaymentModel.updateStatus(id, status);
    if (status === 'PAID') {
      console.log(`[PackagePaymentService] Payment ${id} marked as PAID. Activating subscription...`);
    }
    return payment;
  }

  async delete(id) {
    return await PackagePaymentModel.delete(id);
  }
}

export default new PackagePaymentService();