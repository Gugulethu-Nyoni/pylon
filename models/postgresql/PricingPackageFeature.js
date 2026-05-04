// Add to your schema.prisma:
/*
model PricingPackageFeature {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Add additional fields as needed
}
*/

// Import the function that returns the Prisma client promise
import getPrismaClient from '../../../../../lib/prisma.js';

export default class PricingPackageFeatureModel {
  
  static async create(data) {
  const prisma = await getPrismaClient();
  
  // Extract helper fields and prepare clean data
  const { feature_adding_mode, featureSet, featureId: singleFeatureId, ...payload } = data;
  
  const cleanData = {
    pricingPackageId: payload.pricingPackageId,
    limitValue: parseInt(payload.limitValue, 10) || 0,
    status: payload.status === '1' || payload.status === true || parseInt(payload.status) === 1,
  };

  // SINGLE MODE
  if (feature_adding_mode === 'single') {
    const featureExists = await prisma.feature.findUnique({ where: { id: singleFeatureId } });
    if (!featureExists) throw new Error(`Feature ${singleFeatureId} not found`);
    
    return prisma.pricingPackageFeature.create({
      data: { ...cleanData, featureId: singleFeatureId },
      include: { pricingPackage: true, feature: true }
    });
  }

  // CRUD BUNDLE MODE - FIXED: Exact matching instead of startsWith
  if (feature_adding_mode === 'crud_bundle_mode') {
    if (!featureSet) throw new Error('featureSet required for bundle mode');
    
    const baseFeature = await prisma.feature.findUnique({ where: { id: featureSet } });
    if (!baseFeature) throw new Error(`Base feature ${featureSet} not found`);
    
    // Extract the model name (e.g., "course" from "course_create")
    const modelName = baseFeature.name.split('_')[0];
    
    // Exact matching for the 4 CRUD operations
    const crudFeatures = await prisma.feature.findMany({
      where: {
        name: {
          in: [
            `${modelName}_create`,
            `${modelName}_read`,
            `${modelName}_update`,
            `${modelName}_delete`
          ]
        }
      }
    });
    
    const results = [];
    for (const feature of crudFeatures) {
      try {
        const result = await prisma.pricingPackageFeature.create({
          data: { ...cleanData, featureId: feature.id },
          include: { pricingPackage: true, feature: true }
        });
        results.push(result);
      } catch (error) {
        if (error.code !== 'P2002') throw error; // Skip duplicates, rethrow others
      }
    }
    return results;
  }

  // ALL FEATURES MODE
  if (feature_adding_mode === 'all_features') {
    const allFeatures = await prisma.feature.findMany();
    const results = [];
    
    for (const feature of allFeatures) {
      try {
        const result = await prisma.pricingPackageFeature.create({
          data: { ...cleanData, featureId: feature.id },
          include: { pricingPackage: true, feature: true }
        });
        results.push(result);
      } catch (error) {
        if (error.code !== 'P2002') throw error;
      }
    }
    return results;
  }

  throw new Error(`Invalid mode: ${feature_adding_mode}`);
}

  static async findById(id) {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.findUnique({ 
      where: { id },
      include: {
        pricingPackage: true,
        feature: true
      }
    });
  }

  static async findByPackageAndFeature(pricingPackageId, featureId) {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.findUnique({
      where: {
        pricingPackageId_featureId: {
          pricingPackageId,
          featureId
        }
      },
      include: {
        pricingPackage: true,
        feature: true
      }
    });
  }

  static async findAll() {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.findMany({
      include: {
        pricingPackage: true,
        feature: true
      }
    });
  }

  static async update(id, data) {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.update({
      where: { id },
      data,
      include: {
        pricingPackage: true,
        feature: true
      }
    });
  }

  static async delete(id) {
    const prisma = await getPrismaClient();
    return prisma.pricingPackageFeature.delete({ 
      where: { id } 
    });
  }
}