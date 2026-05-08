// services/packagePaymentService.js
import PackagePaymentModel from '../models/postgresql/PackagePayment.js';
import blinque from '../../blinque/index.js';
import getConfig from '../../../../config_loader.js';
import getPrismaClient from '../../../../lib/prisma.js';

class PackagePaymentService {
  
  /**
   * Internal create method that formats data for the Prisma/Postgres model.
   * Handles the 'connect' syntax required for relations.
   */
  async create(data) {
    // 1. Extract and cast clean values
    const orgId = parseInt(data.organizationId, 10);
    const pkgId = data.pricingPackageId; // UUID string
    const amt = parseFloat(data.amount);
    
    if (isNaN(orgId)) throw new Error("Invalid Organization ID provided to PackagePaymentService.");
    if (!pkgId) throw new Error("Pricing Package ID is required.");

    const status = amt === 0 ? 'PAID' : (data.paymentStatus || 'PENDING');

    // 2. Map to the specific structure expected by your PostgreSQL model
    // Note: We use 'connect' to link the foreign keys to existing records
    return await PackagePaymentModel.create({
      amount: amt,
      paymentStatus: status,
      billingCycle: data.billingCycle,
      organization: {
        connect: { id: orgId }
      },
      pricingPackage: {
        connect: { id: pkgId }
      }
    });
  }

  /**
   * Orchestrates the checkout process via Blinque (Yoco/Paystack).
   */
  async initiate(data) {
    const { 
      amount, 
      organizationId, 
      pricingPackageId, // Consistently use the schema name
      billingCycle, 
      gateway = 'yoco', 
      userId 
    } = data;

    const orgId = parseInt(organizationId, 10);

    // 1. Handle Freemium (Immediate Activation)
    if (parseFloat(amount) === 0) {
      const record = await this.create({
        organizationId: orgId,
        pricingPackageId: pricingPackageId,
        amount: 0,
        billingCycle,
        paymentStatus: 'PAID'
      });
      
      await this.activateSubscription(record);
      
      return { 
        success: true, 
        isFreemium: true, 
        message: "Package activated successfully." 
      };
    }

    // 2. Fetch user email for the gateway
    const prisma = await getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      select: { email: true }
    });
    
    if (!user?.email) {
      throw new Error("Unable to determine user email for payment.");
    }

    // 3. Create PENDING record (Audit Trail)
    const pendingRecord = await this.create({
      organizationId: orgId,
      pricingPackageId,
      amount,
      billingCycle,
      paymentStatus: 'PENDING'
    });

    console.log(`[PackagePaymentService] Created pending record: ${pendingRecord.id}`);

    // 4. Load Engine & Config
    const [config, engine] = await Promise.all([getConfig(), blinque.init()]);
    const frontendUrl = config.brand?.frontend_base_url || 'http://localhost:3000';
    
    const successUrl = `${frontendUrl}/org-admin?payment=success&ref=${pendingRecord.id}`;
    const cancelUrl = `${frontendUrl}/org-admin?payment=cancelled`;

    const checkoutService = blinque.getPaymentGateway(gateway);
    
    // 5. Build Checkout Payload
    const checkoutPayload = {
      paymentRecordId: pendingRecord.id,
      amount: amount,
      currency: 'ZAR',
      orderId: String(pendingRecord.id), // Use the record ID for tracking
      successUrl,
      cancelUrl,
      email: user.email,
      metadata: {
        packageId: String(pricingPackageId),
        billingCycle,
        pylon_gateway: gateway,
        userId: String(userId),
        organizationId: String(orgId)
      }
    };

    const checkoutSession = await checkoutService.initiateCheckout(checkoutPayload);

    return {
      success: true,
      gateway,
      paymentRecordId: pendingRecord.id,
      ...checkoutSession
    };
  }

  async activateSubscription(paymentRecord) {
    const prisma = await getPrismaClient();
    try {
      await prisma.organization.update({
        where: { id: paymentRecord.organizationId },
        data: {
          pricingPackage: {
            connect: { id: paymentRecord.pricingPackageId }
          }
        }
      });
     // console.log(`[PackagePaymentService] Subscription activated for Org ${paymentRecord.organizationId}`);
    } catch (error) {
      console.error(`[PackagePaymentService] Activation error:`, error.message);
    }
}

  async updateStatus(id, updateData) {
    const status = updateData.status;
    const reference = updateData.gatewayReference || updateData.reference;
    const gatewayName = updateData.gateway || updateData.pylon_gateway;

    const payment = await PackagePaymentModel.updateStatus(id, {
      status,
      provider_reference: reference,
      gateway_name: gatewayName,
      updated_at: new Date()
    });

    if (status === 'PAID') {
      //console.log(`[PackagePaymentService] Payment ${id} verified. Activating...`);
      await this.activateSubscription(payment);
    }
    return payment;
  }

  // --- Standard CRUD wrappers ---
  async getById(id) { return await PackagePaymentModel.findById(id); }
  async getAll() { return await PackagePaymentModel.findAll(); }
  async getByOrg(orgId) { return await PackagePaymentModel.findByOrganization(orgId); }
  async update(id, data) { return await PackagePaymentModel.update(id, data); }
  async delete(id) { return await PackagePaymentModel.delete(id); }
}

export default new PackagePaymentService();