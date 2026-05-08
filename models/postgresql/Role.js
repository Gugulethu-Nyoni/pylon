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
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class RoleModel {

  static async create(data) {
    const prisma = await getPrismaClient();
    return prisma.role.create({ data });
  }

  static async findById(id) {
    const prisma = await getPrismaClient();
    return prisma.role.findUnique({ where: { id } });
  }

  static async findByOrgId(organizationId) {
    const prisma = await getPrismaClient();
    return prisma.role.findMany({ where: { organizationId } });
  }

  static async findAll() {
    const prisma = await getPrismaClient();
    return prisma.role.findMany();
  }

  static async getRoleRegistry() {
    const filePath = join(__dirname, '..', '..', '..', '..', '..', 'lib', 'defaultRoles.json');
    
    try {
      const raw = readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Failed to load defaultRoles.json: ${err.message}`);
    }
  }

  static async getOrganizationRoles(organizationId) {
    const prisma = await getPrismaClient();
    return prisma.role.findMany({
      where: {
        organizationId: organizationId,
        isSystemRole: false,
      },
    });
  }

  static async update(id, data) {
    const prisma = await getPrismaClient();
    return prisma.role.update({
      where: { id },
      data,
    });
  }

  static async delete(id) {
    const prisma = await getPrismaClient();
    return prisma.role.delete({ where: { id } });
  }

  static async findWithPagination(skip = 0, take = 10) {
    const prisma = await getPrismaClient();
    return prisma.role.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}