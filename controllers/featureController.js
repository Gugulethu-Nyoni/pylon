import featureService from '../services/featureService.js';

class FeatureController {
  async createFeature(req, res) {
  try {
    const { 
      name, 
      unit, 
      model_action, 
      description, 
      meterType, // Array: ["COUNT", "ON_OFF"]
      timeframe,
      ...otherData // Catch any other fields like pricingPackageFeatures
    } = req.body;

    // 1. Construct the final 'name' and ensure 'model_action' is removed
    const finalName = `${name}_${model_action}`; // e.g., "form_create"

    // 2. Transform the meterType array into the two boolean fields
    const supportsCount = meterType?.includes("COUNT") ?? null;
    const supportsOnOff = meterType?.includes("ON_OFF") ?? null;

    // 3. Build the final data object for the Prisma service call
    const finalData = {
      name: finalName,
      unit: unit,
      description: description,
      timeframe: timeframe,
      count: supportsCount,     // true or null
      on_off: supportsOnOff,   // true or null
      ...otherData // Include any optional fields like pricingPackageFeatures
      // Note: meterType and model_action are no longer in finalData
    };
    
    // 4. Call the service
    const result = await featureService.create(finalData);
    
    res.status(201).json(result);
  } catch (err) {
    // You should log the error for debugging purposes
    console.error("Error creating feature:", err);
    res.status(400).json({ error: err.message });
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