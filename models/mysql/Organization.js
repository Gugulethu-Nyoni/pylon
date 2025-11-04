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
import getPrismaClient from '../../../../../lib/prisma.js';


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


  /**
  * Simulates a payment by setting the paid period for a full year.
  * @param {string | number} id - The ID of the organization to update.
  * @returns {Promise<object>} The updated organization record.
  */
 static async simulatePayment (id) {
  // Get the current time for paidPeriodStart
  const paidPeriodStart = new Date();
  
  // Calculate the paidPeriodEnd (one year from now)
  const paidPeriodEnd = new Date();
  paidPeriodEnd.setFullYear(paidPeriodEnd.getFullYear() + 1);

  const prisma = await getPrismaClient();

  // Update the organization record
  return prisma.organization.update({
   where: { id },
   data: {
    paidPeriodStart: paidPeriodStart,
    paidPeriodEnd: paidPeriodEnd,
   },
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