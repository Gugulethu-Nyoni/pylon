import featureService from '../services/featureService.js';

class FeatureController {
  // featureController.js

  async createFeature(req, res) {
    try {
      const payloadData = req.body?.data ?? req.body ?? {};

      const { 
        name, 
        unit, 
        model_action, 
        description, 
        meterType, 
        timeframe,
        feature_type, 
        feature_set_name_options, 
        feature_set_name, 
        non_crud_name, 
      } = payloadData; 

      // 1. Validation Check for required feature_type
      if (!feature_type || (feature_type !== 'Crud' && feature_type !== 'non_crud')) {
        throw new Error("Feature type is required and must be 'Crud' or 'non_crud'."); 
      }

      let finalName;
      let finalFeatureSet = null; // Default to null for non_crud_feature_set_name
      const isCrud = feature_type === 'Crud';

      // 2. Conditional Logic for Naming and Feature Set

      if (isCrud) {
        // --- CRUD Feature Logic (Guaranteed to be set) ---
        if (!name || !model_action) {
          throw new Error("Missing Model Name or Action for a CRUD feature.");
        }
        // Set the final required 'name' argument for Prisma
        finalName = `${name}_${model_action}`;
        // finalFeatureSet remains null, which is correct for CRUD.
      } else { 
        // --- NON-CRUD Feature Logic ---
        if (!non_crud_name) {
          throw new Error("Missing Non-CRUD Feature Name.");
        }
        

        // Set the non_crud_feature_set_name
        if (feature_set_name_options === 'add_new') {
          finalFeatureSet = feature_set_name; 
        } else {
          finalFeatureSet = feature_set_name_options;
        }
                // Set the final required 'name' argument for Prisma
        finalName = `${finalFeatureSet}_${non_crud_name}`.toLowerCase();

      }
      
      // 3. Transform Metering Fields to Booleans
      const supportsCount = meterType?.includes("COUNT") ?? null;
      const supportsOnOff = meterType?.includes("ON_OFF") ?? null;
      
      // 4. BUILD FINAL DATA: finalName MUST be present here.
      const finalData = {
        // --- CRITICAL FIX: finalName must be defined and passed ---
        name: finalName, // This is now guaranteed to be set
        
        // Standard Fields
        unit: unit,
        description: description,
        timeframe: timeframe, 
        
        // Metering Fields
        count: supportsCount,     
        on_off: supportsOnOff,    
        
        // Non-CRUD Specific Fields (Set for non-CRUD, null for CRUD)
        non_crud: !isCrud ? 1 : null, 
        non_crud_feature_set_name: finalFeatureSet, // Null for CRUD, set for Non-CRUD
      };
      
      // 5. Call the service
      const result = await featureService.create(finalData);
      
      res.status(201).json(result);
    } catch (err) {
      console.error("Error creating feature:", err);
      
      // Check if the error is the Prisma validation error
      if (err.name === 'PrismaClientValidationError') {
          res.status(400).json({ 
              error: "Database validation failed. Required field is missing.",
              detail: err.message
          });
      } else {
          res.status(400).json({ 
              error: "Failed to process feature creation request.",
              detail: err.message 
          });
      }
    }
  } // ← THIS CLOSING BRACE WAS MISSING

  async getNonCrudFeatureNames(req, res) {
    try {
      const result = await featureService.getNonCrudFeatureNames();
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async getFeatureById(req, res) {
    try {
      const result = await featureService.getById(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async getAllFeatures(req, res) {
    try {
      const result = await featureService.getAll();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateFeature(req, res) {
    try {
      // Parse ID from string to integer (for sqlite/mysql; mongo uses string IDs)
      const resourceId = parseInt(req.params.id, 10);

      // Validate parsed ID
      if (isNaN(resourceId)) {
        return res.status(400).json({ error: 'Invalid Feature ID provided. Must be a number.' });
      }

      const result = await featureService.update(resourceId, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deleteFeature(req, res) {
    try {
      // Parse ID from string to integer (for sqlite/mysql; mongo uses string IDs)
      const resourceId = parseInt(req.params.id, 10);

      // Validate parsed ID
      if (isNaN(resourceId)) {
        return res.status(400).json({ error: 'Invalid Feature ID provided. Must be a number.' });
      }

      await featureService.delete(resourceId);
      res.status(204).send();
    } catch (err) {
      if (err.message.includes("Record to delete does not exist")) {
        res.status(404).json({ error: "Feature not found." });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }
}

export default new FeatureController();