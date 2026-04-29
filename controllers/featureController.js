import featureService from '../services/featureService.js';

class FeatureController {
  async createFeature(req, res) {
    try {
      const payloadData = req.body?.data ?? req.body ?? {};
      const { 
        name, 
        unit, 
        model_action, 
        model_actions, // NEW: array for bundle
        description, 
        meterType, 
        timeframe,
        feature_type, 
        feature_set_name_options, 
        feature_set_name, 
        non_crud_name,
        crud_bundle // NEW: flag for bundle
      } = payloadData; 

      // Check if this is a CRUD bundle
      const isCrudBundle = crud_bundle === 'true' || crud_bundle === true;
      
      // Validation
      if (!feature_type || (feature_type !== 'crud' && feature_type !== 'non_crud')) {
        throw new Error("Feature type is required and must be 'crud' or 'non_crud'."); 
      }

      // Handle CRUD Bundle
      if (isCrudBundle && feature_type === 'crud') {
        const actions = model_actions || ['create', 'read', 'update', 'delete'];
        const results = [];
        
        for (const action of actions) {
          const finalName = `${name}_${action}`;
          const finalData = {
            name: finalName,
            unit,
            description: `${description || name} - ${action} operation`,
            timeframe,
            count: meterType?.includes("COUNT") ?? null,
            on_off: meterType?.includes("ON_OFF") ?? null,
            non_crud: null,
            non_crud_feature_set_name: null,
          };
          const result = await featureService.create(finalData);
          results.push(result);
        }
        
        return res.status(201).json({
          success: true,
          message: `CRUD bundle '${name}' created with ${results.length} features`,
          data: results
        });
      }

      // Handle single feature (existing logic)
      let finalName;
      let finalFeatureSet = null;
      const isCrud = feature_type === 'crud';

      if (isCrud) {
        if (!name || !model_action) {
          throw new Error("Missing Model Name or Action for a CRUD feature.");
        }
        finalName = `${name}_${model_action}`;
      } else {
        if (!non_crud_name) {
          throw new Error("Missing Non-CRUD Feature Name.");
        }
        
        if (feature_set_name_options === 'add_new') {
          finalFeatureSet = feature_set_name;
        } else {
          finalFeatureSet = feature_set_name_options;
        }
        finalName = `${finalFeatureSet}_${non_crud_name}`.toLowerCase();
      }
      
      const supportsCount = meterType?.includes("COUNT") ?? null;
      const supportsOnOff = meterType?.includes("ON_OFF") ?? null;
      
      const finalData = {
        name: finalName,
        unit,
        description,
        timeframe,
        count: supportsCount,
        on_off: supportsOnOff,
        non_crud: !isCrud ? 1 : null,
        non_crud_feature_set_name: finalFeatureSet,
      };
      
      const result = await featureService.create(finalData);
      res.status(201).json(result);
      
    } catch (err) {
      console.error("Error creating feature:", err);
      
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
  }

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
      const resourceId = parseInt(req.params.id, 10);
      
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
      const resourceId = parseInt(req.params.id, 10);
      
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