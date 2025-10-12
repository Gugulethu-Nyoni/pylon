// Add to your schema.prisma:
/*
model PricingPackage {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add additional fields as needed
}
*/

// Import the function that returns the Prisma client promise
import getPrismaClient from '../../../../../lib/prisma.js';

export default class PricingPackageModel {
  /**
   * Creates a new pricingPackage in the database.
   * @param {object} data - The data for the new pricingPackage.
   * @returns {Promise<object>} The created pricingPackage object.
   */
  static async create(data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pricingPackage.create({ data });
  }

  /**
   * Finds a pricingPackage by its unique ID.
   * @param {string} id - The ID of the pricingPackage to find.
   * @returns {Promise<object|null>} The found pricingPackage object, or null if not found.
   */
  static async findById(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pricingPackage.findUnique({ where: { id } });
  }

  /**
   * Retrieves all pricingPackages from the database.
   * @returns {Promise<Array<object>>} An array of all pricingPackage objects.
   */

  /*
  static async findAll() {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pricingPackage.findMany({include: {features: true } });
  } */

  static async findAll() {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pricingPackage.findMany({
        // Include all PricingPackage fields by default (no 'select' needed here)
        include: {
            features: {
                include: {
                    feature: true, // true includes ALL fields of the Feature model
                },
            },
        },
    });
}

  /**
   * Updates an existing pricingPackage by its ID.
   * @param {string} id - The ID of the pricingPackage to update.
   * @param {object} data - The data to update the pricingPackage with.
   * @returns {Promise<object>} The updated pricingPackage object.
   */
  static async update(id, data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pricingPackage.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a pricingPackage by its ID.
   * @param {string} id - The ID of the pricingPackage to delete.
   * @returns {Promise<object>} The deleted pricingPackage object.
   */
  static async delete(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pricingPackage.delete({ where: { id } });
  }

  /**
   * Finds pricingPackages with pagination.
   * @param {number} [skip=0] - The number of records to skip.
   * @param {number} [take=10] - The number of records to take.
   * @returns {Promise<Array<object>>} An array of pricingPackage objects for the given pagination.
   */
  static async findWithPagination(skip = 0, take = 10) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pricingPackage.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Assuming 'createdAt' field exists for ordering
    });
  }
}