// Add to your schema.prisma:
/*
model Feature {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add additional fields as needed
}
*/

// Import the function that returns the Prisma client promise
import getPrismaClient from '../../lib/prisma.js';

export default class FeatureModel {
  static async create(data) {
    const prisma = await getPrismaClient();
    return prisma.feature.create({ data });
  }

  static async findById(id) {
    const prisma = await getPrismaClient();
    return prisma.feature.findUnique({ 
      where: { id },
      include: {
        pricingPackageFeatures: {
          include: {
            pricingPackage: true
          }
        }
      }
    });
  }

  static async findByName(name) {
    const prisma = await getPrismaClient();
    return prisma.feature.findUnique({ where: { name } });
  }

  static async findAll() {
    const prisma = await getPrismaClient();
    return prisma.feature.findMany();
  }

  static async update(id, data) {
    const prisma = await getPrismaClient();
    return prisma.feature.update({
      where: { id },
      data,
    });
  }

  static async delete(id) {
    const prisma = await getPrismaClient();
    return prisma.feature.delete({ where: { id } });
  }
}