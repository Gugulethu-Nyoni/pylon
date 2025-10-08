// Add to your schema.prisma:
/*
model Organization {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add additional fields as needed
}
*/

// Import the function that returns the Prisma client promise
import getPrismaClient from '../../lib/prisma.js';


export default class OrganizationModel {
  static async create(data) {
    const prisma = await getPrismaClient();
    return prisma.organization.create({ data });
  }

  static async findById(id) {
    const prisma = await getPrismaClient();
    return prisma.organization.findUnique({ 
      where: { id },
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
    return prisma.organization.update({
      where: { id },
      data,
    });
  }

  static async delete(id) {
    const prisma = await getPrismaClient();
    return prisma.organization.delete({ where: { id } });
  }
}