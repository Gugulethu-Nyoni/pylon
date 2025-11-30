// Add to your schema.prisma:
/*
model User {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add additional fields as needed
}
*/

// Import the function that returns the Prisma client promise
import getPrismaClient from '../../../../../lib/prisma.js';

export default class UserModel {
  /**
   * Creates a new user in the database.
   * @param {object} data - The data for the new user.
   * @returns {Promise<object>} The created user object.
   */
  static async create(data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.user.create({ data });
  }


  /**
     * Updates a user's organization ID (orgId) field.
     * @param {number | string} userId - The ID of the user to update.
     * @param {number | string} organizationId - The ID of the organization to link.
     * @returns {Promise<object>} The updated user object.
     */
    static async updateOrgId(userId, organizationId) {

        const prisma = await getPrismaClient(); // Get the initialized Prisma client
        
        // This assumes your User model has a field named 'organizationId' or similar
        // and that 'id' in the where clause refers to the User's ID.
        return prisma.user.update({
            where: { id: userId },
            data: { 
                organizationId: organizationId // CRITICAL: Provide the field name and data
            },
        });
    }

  /**
   * Finds a user by its unique ID.
   * @param {string} id - The ID of the user to find.
   * @returns {Promise<object|null>} The found user object, or null if not found.
   */
  static async findById(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.user.findUnique({ where: { id } });
  }

/*
    static async findByUuid(uuid) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.user.findFirst({ where: { uuid } });
  }
*/


static async getPylonUserById(id) {
  const prisma = await getPrismaClient();
  
  return prisma.user.findUnique({
    where: { id },
    include: {
      organization: {
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
      }
    }
  });
}  
  /**
   * Retrieves all users from the database.
   * @returns {Promise<Array<object>>} An array of all user objects.
   */
  static async findAll() {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.user.findMany();
  }


  static async getOrganizationUsers(organizationId) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.user.findMany({
      where: {
        organizationId: organizationId
      }
    });
  }


  // 

  /**
   * Updates an existing user by its ID.
   * @param {string} id - The ID of the user to update.
   * @param {object} data - The data to update the user with.
   * @returns {Promise<object>} The updated user object.
   */
  static async update(id, data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a user by its ID.
   * @param {string} id - The ID of the user to delete.
   * @returns {Promise<object>} The deleted user object.
   */
  static async delete(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.user.delete({ where: { id } });
  }

  /**
   * Finds users with pagination.
   * @param {number} [skip=0] - The number of records to skip.
   * @param {number} [take=10] - The number of records to take.
   * @returns {Promise<Array<object>>} An array of user objects for the given pagination.
   */
  static async findWithPagination(skip = 0, take = 10) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Assuming 'createdAt' field exists for ordering
    });
  }
}