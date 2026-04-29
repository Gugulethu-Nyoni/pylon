// Import the function that returns the Prisma client promise
import getPrismaClient from '../../../../../lib/prisma.js';

export default class FeatureModel {
  /**
   * Creates a new feature or CRUD bundle in the database.
   * @param {object} data - The data for the new feature.
   * @param {boolean} isCrudBundle - Whether to create all 4 CRUD features.
   * @returns {Promise<object|Array>} The created feature object(s).
   */
  static async create(data, isCrudBundle = false) {
    const prisma = await getPrismaClient();
    
    // If not a CRUD bundle, create single feature
    if (!isCrudBundle) {
      return prisma.feature.create({ data });
    }
    
    // CRUD Bundle: Create all 4 features
    const { name, description, meterType, timeframe, isSystemFeature } = data;
    const actions = ['create', 'read', 'update', 'delete'];
    
    const features = await Promise.all(
      actions.map(action => 
        prisma.feature.create({
          data: {
            name: `${name}_${action}`,
            description: `${description} - ${action} operation`,
            unit: null,
            timeframe: timeframe || 'MONTHLY',
            count: meterType?.includes('COUNT') || false,
            on_off: meterType?.includes('ON_OFF') || false,
            non_crud: null,
            non_crud_feature_set_name: null,
            isSystemFeature: isSystemFeature === 'true' || isSystemFeature === true,
          }
        })
      )
    );
    
    return features;
  }

  /**
   * Finds a feature by its unique ID.
   * @param {string} id - The ID of the feature to find.
   * @returns {Promise<object|null>} The found feature object, or null if not found.
   */
  static async findById(id) {
    const prisma = await getPrismaClient();
    return prisma.feature.findUnique({ where: { id } });
  }

  /**
   * Gets non-CRUD feature names.
   * @returns {Promise<Array>} Array of non-CRUD features.
   */
  static async getNonCrudFeatureNames() {
    const prisma = await getPrismaClient();
    const result = await prisma.feature.findMany({
      where: { non_crud_feature_set_name: { not: null } },
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
    const prisma = await getPrismaClient();
    return prisma.feature.findMany();
  }

  /**
   * Updates an existing feature by its ID.
   * @param {string} id - The ID of the feature to update.
   * @param {object} data - The data to update the feature with.
   * @returns {Promise<object>} The updated feature object.
   */
  static async update(id, data) {
    const prisma = await getPrismaClient();
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
    const prisma = await getPrismaClient();
    return prisma.feature.delete({ where: { id } });
  }

  /**
   * Finds features with pagination.
   * @param {number} [skip=0] - The number of records to skip.
   * @param {number} [take=10] - The number of records to take.
   * @returns {Promise<Array<object>>} An array of feature objects for the given pagination.
   */
  static async findWithPagination(skip = 0, take = 10) {
    const prisma = await getPrismaClient();
    return prisma.feature.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}