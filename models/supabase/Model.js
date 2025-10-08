// Add to your schema.prisma:
/*
model Model {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add additional fields as needed
}
*/

// Import the function that returns the Prisma client promise
import getPrismaClient from '../../lib/prisma.js';

export default class ModelModel {
  /**
   * Creates a new model in the database.
   * @param {object} data - The data for the new model.
   * @returns {Promise<object>} The created model object.
   */
  static async create(data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.model.create({ data });
  }

  /**
   * Finds a model by its unique ID.
   * @param {string} id - The ID of the model to find.
   * @returns {Promise<object|null>} The found model object, or null if not found.
   */
  static async findById(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.model.findUnique({ where: { id } });
  }

  /**
   * Retrieves all models from the database.
   * @returns {Promise<Array<object>>} An array of all model objects.
   */
  static async findAll() {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.model.findMany();
  }

  /**
   * Updates an existing model by its ID.
   * @param {string} id - The ID of the model to update.
   * @param {object} data - The data to update the model with.
   * @returns {Promise<object>} The updated model object.
   */
  static async update(id, data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a model by its ID.
   * @param {string} id - The ID of the model to delete.
   * @returns {Promise<object>} The deleted model object.
   */
  static async delete(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.model.delete({ where: { id } });
  }

  /**
   * Finds models with pagination.
   * @param {number} [skip=0] - The number of records to skip.
   * @param {number} [take=10] - The number of records to take.
   * @returns {Promise<Array<object>>} An array of model objects for the given pagination.
   */
  static async findWithPagination(skip = 0, take = 10) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.model.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Assuming 'createdAt' field exists for ordering
    });
  }
}