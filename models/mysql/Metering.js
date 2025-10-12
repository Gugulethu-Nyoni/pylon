// Add to your schema.prisma:
/*
model Metering {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add additional fields as needed
}
*/

// Import the function that returns the Prisma client promise
import getPrismaClient from '../../../../../lib/prisma.js';

export default class MeteringModel {
  static async create(data) {
    const prisma = await getPrismaClient();
    return prisma.metering.create({ 
      data,
      include: {
        organization: true,
        feature: true
      }
    });
  }

  static async findById(id) {
    const prisma = await getPrismaClient();
    return prisma.metering.findUnique({ 
      where: { id },
      include: {
        organization: true,
        feature: true
      }
    });
  }

  static async findByOrganizationAndFeature(organizationId, featureId) {
    const prisma = await getPrismaClient();
    return prisma.metering.findUnique({
      where: {
        organizationId_featureId: {
          organizationId,
          featureId
        }
      },
      include: {
        organization: true,
        feature: true
      }
    });
  }

  static async findAll() {
    const prisma = await getPrismaClient();
    return prisma.metering.findMany({
      include: {
        organization: true,
        feature: true
      }
    });
  }

  static async update(id, data) {
    const prisma = await getPrismaClient();
    return prisma.metering.update({
      where: { id },
      data,
      include: {
        organization: true,
        feature: true
      }
    });
  }

  static async delete(id) {
    const prisma = await getPrismaClient();
    return prisma.metering.delete({ where: { id } });
  }

  // Pylon-specific methods
  static async getOrCreate(organizationId, featureId) {
    const prisma = await getPrismaClient();
    
    const existing = await prisma.metering.findUnique({
      where: { 
        organizationId_featureId: { organizationId, featureId } 
      }
    });

    if (existing) {
      // Check if period needs reset
      if (existing.periodEnd && existing.periodEnd < new Date()) {
        const feature = await prisma.feature.findUnique({ 
          where: { id: featureId } 
        });
        const { periodStart, periodEnd } = this.calculatePeriod(feature?.timeframe);
        
        return prisma.metering.update({
          where: { id: existing.id },
          data: { 
            currentValue: 0, 
            periodStart, 
            periodEnd 
          }
        });
      }
      return existing;
    }

    // Create new metering record
    const feature = await prisma.feature.findUnique({ 
      where: { id: featureId } 
    });
    const { periodStart, periodEnd } = this.calculatePeriod(feature?.timeframe);
    
    return prisma.metering.create({
      data: { 
        organizationId, 
        featureId, 
        currentValue: 0,
        periodStart,
        periodEnd
      }
    });
  }

  static async incrementUsage(organizationId, featureId, amount = 1) {
    const prisma = await getPrismaClient();
    
    const metering = await this.getOrCreate(organizationId, featureId);
    
    return prisma.metering.update({
      where: { id: metering.id },
      data: { currentValue: { increment: amount } }
    });
  }

  static calculatePeriod(timeframe) {
    const now = new Date();
    let periodEnd;

    switch (timeframe) {
      case 'MONTHLY':
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'YEARLY':
        periodEnd = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        periodEnd = new Date(2100, 0, 1); // Forever
    }

    return { periodStart: now, periodEnd };
  }
}