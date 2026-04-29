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
  
  console.log('=== ORGANIZATION MODEL CREATE ===');
  console.log('Raw incoming data:', JSON.stringify(data, null, 2));
  
  // Handle pricingPackage relation
  const { pricingPackageId, ownerId, ...restData } = data;
  
  console.log('Extracted values:', {
    pricingPackageId,
    ownerId,
    restData: JSON.stringify(restData, null, 2)
  });
  
  const createData = {
    ...restData,
    pricingPackage: { connect: { id: pricingPackageId } }
  };
  
  // Handle owner relation if ownerId is provided
  if (ownerId !== undefined && ownerId !== null) {
    console.log(`Connecting owner with id: ${ownerId}`);
    createData.owner = { connect: { id: ownerId } };
  }
  
  console.log('Final createData being sent to Prisma:', JSON.stringify(createData, null, 2));
  
  try {
    const result = await prisma.organization.create({ data: createData });
    console.log('✅ Organization created successfully:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Prisma error:', error.message);
    console.error('Full error:', error);
    throw error;
  }
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

  static async simulatePayment(id) {
    const paidPeriodStart = new Date();
    const paidPeriodEnd = new Date();
    paidPeriodEnd.setFullYear(paidPeriodEnd.getFullYear() + 1);

    const prisma = await getPrismaClient();
    return prisma.organization.update({
      where: { id },
      data: { paidPeriodStart, paidPeriodEnd }
    });
  }

  static async update(id, data) {
    const prisma = await getPrismaClient();
    
    // Handle pricingPackage relation in updates too
    if (data.pricingPackageId) {
      const { pricingPackageId, ...restData } = data;
      return prisma.organization.update({
        where: { id },
        data: {
          ...restData,
          pricingPackage: { connect: { id: pricingPackageId } }
        }
      });
    }
    
    return prisma.organization.update({ where: { id }, data });
  }

  static async delete(id) {
    const prisma = await getPrismaClient();
    return prisma.organization.delete({ where: { id } });
  }
}