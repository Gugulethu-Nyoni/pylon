// Add to your schema.prisma:
/*
model Role {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add additional fields as needed
}
*/

// Import the function that returns the Prisma client promise
import getPrismaClient from '../../../../../lib/prisma.js';

export default class RoleModel {
  /**
   * Creates a new role in the database.
   * @param {object} data - The data for the new role.
   * @returns {Promise<object>} The created role object.
   */
  static async create(data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.role.create({ data });
  }

  /**
   * Finds a role by its unique ID.
   * @param {string} id - The ID of the role to find.
   * @returns {Promise<object|null>} The found role object, or null if not found.
   */
  static async findById(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.role.findUnique({ where: { id } });
  }

  /**
   * Retrieves all roles from the database.
   * @returns {Promise<Array<object>>} An array of all role objects.
   */
  static async findAll() {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.role.findMany();
  }


// ACCEPT THE PARAMETER
static async getOrganizationRoles(organizationId) {
    const prisma = await getPrismaClient(); 
    
    // USE THE PARAMETER FOR FILTERING
    return prisma.role.findMany({
        where: {
            organizationId: organizationId, // Filters roles by the provided organizationId
            isSystemRole: false,           // Optional: You might want to exclude system roles
        },
    });
}


  // getOrganizationRoles

  /**
   * Updates an existing role by its ID.
   * @param {string} id - The ID of the role to update.
   * @param {object} data - The data to update the role with.
   * @returns {Promise<object>} The updated role object.
   */
  static async update(id, data) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.role.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a role by its ID.
   * @param {string} id - The ID of the role to delete.
   * @returns {Promise<object>} The deleted role object.
   */
  static async delete(id) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.role.delete({ where: { id } });
  }

  /**
   * Finds roles with pagination.
   * @param {number} [skip=0] - The number of records to skip.
   * @param {number} [take=10] - The number of records to take.
   * @returns {Promise<Array<object>>} An array of role objects for the given pagination.
   */
  static async findWithPagination(skip = 0, take = 10) {
    const prisma = await getPrismaClient(); // Get the initialized Prisma client
    return prisma.role.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' }, // Assuming 'createdAt' field exists for ordering
    });
  }
}