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
import getPrismaClient from '../../../../../lib/prisma.js';

export default class FeatureModel {
  /**
   * Creates a new feature in the database.
   * @param {object} data - The data for the new feature.
   * @returns {Promise<object>} The created feature object.
   */
  static async create(data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.feature.create({ data });
  }

  /**
   * Finds a feature by its unique ID.
   * @param {string} id - The ID of the feature to find.
   * @returns {Promise<object|null>} The found feature object, or null if not found.
   */
  static async findById(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.feature.findUnique({ where: { id } });
  }

  /// getNonCrudFeatureNames

  static async getNonCrudFeatureNames() {
  const prisma = await getPrismaClient();
  const result = await prisma.feature.findMany({
    where: { non_crud_feature_set_name: { not: null } }, // exclude nulls
    select: { id: true, non_crud_feature_set_name: true },
  });
  console.log("✅ Prisma returned:", result);
  return result;
}

  /**
   * Retrieves all features from the database.
   * @returns {Promise<Array<object>>} An array of all feature objects.
   */
  static async findAll() {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.feature.findMany();
  }

  /**
   * Updates an existing feature by its ID.
   * @param {string} id - The ID of the feature to update.
   * @param {object} data - The data to update the feature with.
   * @returns {Promise<object>} The updated feature object.
   */
  static async update(id, data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.feature.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a feature by its ID.
   * @param {string} id - The ID of the feature to delete.
   * @returns {Promise<object>} The deleted feature object.
   */
  static async delete(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.feature.delete({ where: { id } });
  }

  /**
   * Finds features with pagination.
   * @param {number} [skip=0] - The number of records to skip.
   * @param {number} [take=10] - The number of records to take.
   * @returns {Promise<Array<object>>} An array of feature objects for the given pagination.
   */
  static async findWithPagination(skip = 0, take = 10) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.feature.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Assuming 'createdAt' field exists for ordering
    });
  }
}