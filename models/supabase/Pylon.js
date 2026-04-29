// Add to your schema.prisma:
/*
model Pylon {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add additional fields as needed
}
*/

// Import the function that returns the Prisma client promise
import getPrismaClient from '../../../../../lib/prisma.js';

export default class PylonModel {
  /**
   * Creates a new pylon in the database.
   * @param {object} data - The data for the new pylon.
   * @returns {Promise<object>} The created pylon object.
   */
  static async create(data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pylon.create({ data });
  }

  /**
   * Finds a pylon by its unique ID.
   * @param {string} id - The ID of the pylon to find.
   * @returns {Promise<object|null>} The found pylon object, or null if not found.
   */
  static async findById(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pylon.findUnique({ where: { id } });
  }

  /**
   * Retrieves all pylons from the database.
   * @returns {Promise<Array<object>>} An array of all pylon objects.
   */
  static async findAll() {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pylon.findMany();
  }

  /**
   * Updates an existing pylon by its ID.
   * @param {string} id - The ID of the pylon to update.
   * @param {object} data - The data to update the pylon with.
   * @returns {Promise<object>} The updated pylon object.
   */
  static async update(id, data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pylon.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a pylon by its ID.
   * @param {string} id - The ID of the pylon to delete.
   * @returns {Promise<object>} The deleted pylon object.
   */
  static async delete(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pylon.delete({ where: { id } });
  }

  /**
   * Finds pylons with pagination.
   * @param {number} [skip=0] - The number of records to skip.
   * @param {number} [take=10] - The number of records to take.
   * @returns {Promise<Array<object>>} An array of pylon objects for the given pagination.
   */
  static async findWithPagination(skip = 0, take = 10) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.pylon.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Assuming 'createdAt' field exists for ordering
    });
  }
}