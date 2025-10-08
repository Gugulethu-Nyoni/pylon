// Add to your schema.prisma:
/*
model PricingPackageFeature {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add additional fields as needed
}
*/

// Import the function that returns the Prisma client promise
import getPrismaClient from '../../lib/prisma.js';

export default class PricingPackageFeatureModel {
  static async create(data) {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.create({ 
      data,
      include: {
        pricingPackage: true,
        feature: true
      }
    });
  }

  static async findById(id) {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.findUnique({ 
      where: { id },
      include: {
        pricingPackage: true,
        feature: true
      }
    });
  }

  static async findByPackageAndFeature(pricingPackageId, featureId) {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.findUnique({
      where: {
        pricingPackageId_featureId: {
          pricingPackageId,
          featureId
        }
      },
      include: {
        pricingPackage: true,
        feature: true
      }
    });
  }

  static async findAll() {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.findMany({
      include: {
        pricingPackage: true,
        feature: true
      }
    });
  }

  static async update(id, data) {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.update({
      where: { id },
      data,
      include: {
        pricingPackage: true,
        feature: true
      }
    });
  }

  static async delete(id) {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.delete({ 
      where: { id } 
    });
  }
}