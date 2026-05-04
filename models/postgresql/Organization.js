/**
 * Organization Model (PostgreSQL)
 * 
 * Current Schema Fields:
 * - id: Int (autoincrement)
 * - name: String?
 * - pricingPackageId: String
 * - paidPeriodStart: DateTime?
 * - paidPeriodEnd: DateTime?
 * - trialStartedAt: DateTime?
 * - trialEndsAt: DateTime?
 * - ownerId: Int (unique)
 * - owner: User relation
 * - pricingPackage: PricingPackage relation
 * 
 * Subscription status is derived from dates:
 * - If trialEndsAt > now -> TRIALING
 * - If paidPeriodEnd > now -> ACTIVE
 * - Else -> EXPIRED/NONE
 */

import getPrismaClient from '../../../../../lib/prisma.js';

export default class OrganizationModel {
  
  static async create(data) {
    const prisma = await getPrismaClient();
    
    console.log('=== ORGANIZATION MODEL CREATE ===');
    const { pricingPackageId, ownerId, ...restData } = data;
    
    const createData = {
      ...restData,
      pricingPackage: { connect: { id: pricingPackageId } }
    };
    
    if (ownerId) {
      createData.owner = { connect: { id: ownerId } };
    }
    
    try {
      const result = await prisma.organization.create({ data: createData });
      console.log('Organization created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Prisma error:', error.message);
      throw error;
    }
  }

  static async findById(id) {
    const prisma = await getPrismaClient();
    const whereId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    return prisma.organization.findUnique({ 
      where: { id: whereId },
      include: {
        pricingPackage: {
          include: {
            features: {
              include: {
                feature: true
              }
            }
          }
        }
      }
    });
  }

  static async findAll() {
    const prisma = await getPrismaClient();
    return prisma.organization.findMany({
      include: {
        pricingPackage: true
      }
    });
  }

  static async update(id, data) {
    const prisma = await getPrismaClient();
    
    const updateData = { ...data };
    const whereId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (updateData.pricingPackageId) {
      const pkgId = updateData.pricingPackageId;
      delete updateData.pricingPackageId;
      updateData.pricingPackage = { connect: { id: pkgId } };
    }

    if (updateData.ownerId) {
      const ownerId = updateData.ownerId;
      delete updateData.ownerId;
      updateData.owner = { connect: { id: ownerId } };
    }
    
    return prisma.organization.update({ 
      where: { id: whereId }, 
      data: updateData 
    });
  }

  static async updateSubscription(id, subscriptionData) {
    const prisma = await getPrismaClient();
    const whereId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    return prisma.organization.update({
      where: { id: whereId },
      data: {
        paidPeriodStart: subscriptionData.start,
        paidPeriodEnd: subscriptionData.end,
        updatedAt: new Date()
      }
    });
  }

  static async delete(id) {
    const prisma = await getPrismaClient();
    const whereId = typeof id === 'string' ? parseInt(id, 10) : id;
    return prisma.organization.delete({ where: { id: whereId } });
  }
}