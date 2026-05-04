/**
 * PackagePayment Model (PostgreSQL)
 * Maps to the Prisma schema for tracking subscription payment attempts.
 * 
 * Schema Fields:
 * - id: String (UUID)
 * - organizationId: Int
 * - pricingPackageId: String
 * - amount: Int (in cents/smallest unit)
 * - paymentStatus: PaymentStatus (PENDING, PROCESSING, PAID, FAILED, CANCELLED, REFUNDED)
 * - billingCycle: BillingCycle (MONTHLY, YEARLY)
 * - providerReference: String? (Stores Paystack reference / Yoco checkoutId)
 * - gatewayReference: String? (Stores gateway's internal transaction ID)
 * - createdAt: DateTime
 * - updatedAt: DateTime
 * - organization: Organization relation
 * - pricingPackage: PricingPackage relation
 */

import getPrismaClient from '../../../../../lib/prisma.js';

export default class PackagePaymentModel {
  /**
   * Create a new payment attempt record
   */
  static async create(data) {
    const prisma = await getPrismaClient();
    
    const createData = {
      organizationId: data.organizationId,
      pricingPackageId: data.pricingPackageId,
      amount: data.amount,
      paymentStatus: data.paymentStatus || 'PENDING',
      billingCycle: data.billingCycle || 'MONTHLY'
    };
    
    // Add providerReference if provided
    if (data.providerReference) {
      createData.providerReference = data.providerReference;
    }
    
    // Add gatewayReference if provided
    if (data.gatewayReference) {
      createData.gatewayReference = data.gatewayReference;
    }
    
    return prisma.packagePayment.create({ data: createData });
  }

  /**
   * Find payment by provider reference (Paystack reference or Yoco checkoutId)
   */
  static async findByProviderReference(reference) {
    const prisma = await getPrismaClient();
    return prisma.packagePayment.findFirst({
      where: { providerReference: reference }
    });
  }

  /**
   * Find payment by ID with related Org and Package details
   */
  static async findById(id) {
    const prisma = await getPrismaClient();
    return prisma.packagePayment.findUnique({ 
      where: { id },
      include: { 
        organization: true, 
        pricingPackage: true 
      } 
    });
  }

  /**
   * Update a payment record
   */
  static async update(id, data) {
    const prisma = await getPrismaClient();
    
    const updateData = {};
    
    if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus;
    if (data.providerReference) updateData.providerReference = data.providerReference;
    if (data.gatewayReference) updateData.gatewayReference = data.gatewayReference;
    if (data.amount) updateData.amount = data.amount;
    
    return prisma.packagePayment.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Update payment status only
   */
  static async updateStatus(id, status) {
    const prisma = await getPrismaClient();
    return prisma.packagePayment.update({
      where: { id },
      data: { paymentStatus: status }
    });
  }

  /**
   * Get all payments for a specific organization
   */
  static async findByOrganization(organizationId) {
    const prisma = await getPrismaClient();
    return prisma.packagePayment.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Administrative view of all payments
   */
  static async findAll() {
    const prisma = await getPrismaClient();
    return prisma.packagePayment.findMany({
      include: { 
        organization: { select: { name: true, id: true } },
        pricingPackage: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Delete a payment record
   */
  static async delete(id) {
    const prisma = await getPrismaClient();
    return prisma.packagePayment.delete({ where: { id } });
  }
}