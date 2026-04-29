import pricingPackageFeatureService from '../services/pricingPackageFeatureService.js';

class PricingPackageFeatureController {
 async createPricingPackageFeature(req, res) {
  try {
    // 🔍 DEBUG: Log the raw request body
    console.log('📥 [CONTROLLER START] Raw Request Body:', JSON.stringify(req.body, null, 2));

    const { 
      seats, 
      pricingPackageId, 
      featureId, 
      limitValue, 
      status,
      feature_adding_mode, 
      featureSet 
    } = req.body;
    
    // 🛠️ Prepare sanitized data
    const finalData = {
      pricingPackageId,
      featureId,
      limitValue: parseInt(limitValue, 10) || 0,
      // Normalize status to a real boolean
      status: status === true || status === 'true' || parseInt(status, 10) > 0,
      feature_adding_mode: feature_adding_mode || 'single', 
      featureSet
    };
    
    if (seats) {
      finalData.seats = parseInt(seats, 10);
    }

    // 🔍 DEBUG: Log the data being sent to the service layer
    console.log('📤 [CONTROLLER] Passing to Service:', {
      mode: finalData.feature_adding_mode,
      package: finalData.pricingPackageId,
      hasFeatureSet: !!finalData.featureSet,
      featureId: finalData.featureId || 'N/A'
    });
    
    const result = await pricingPackageFeatureService.create(finalData);
    
    // 🔍 DEBUG: Log successful creation count (if array) or ID (if single)
    const count = Array.isArray(result) ? result.length : 1;
    console.log(`✅ [CONTROLLER SUCCESS] Created ${count} record(s)`);

    res.status(201).json(result);
  } catch (err) {
    // ❌ DEBUG: Log the full stack or error message
    console.error('❌ [CONTROLLER ERROR] PricingPackageFeature:', err.message);
    res.status(400).json({ error: err.message });
  }
}


  async getPricingPackageFeatureById(req, res) {
    try {
      const result = await pricingPackageFeatureService.getById(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async getAllPricingPackageFeatures(req, res) {
    try {
      const result = await pricingPackageFeatureService.getAll();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updatePricingPackageFeature(req, res) {
    try {
      // Parse ID from string to integer (for sqlite/mysql; mongo uses string IDs)
      const resourceId = parseInt(req.params.id, 10);

      // Validate parsed ID
      if (isNaN(resourceId)) {
        return res.status(400).json({ error: 'Invalid PricingPackageFeature ID provided. Must be a number.' });
      }

      const result = await pricingPackageFeatureService.update(resourceId, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deletePricingPackageFeature(req, res) {
    try {
      // Parse ID from string to integer (for sqlite/mysql; mongo uses string IDs)
      const resourceId = parseInt(req.params.id, 10);

      // Validate parsed ID
      if (isNaN(resourceId)) {
        return res.status(400).json({ error: 'Invalid PricingPackageFeature ID provided. Must be a number.' });
      }

      await pricingPackageFeatureService.delete(resourceId);
      res.status(204).send();
    } catch (err) {
      if (err.message.includes("Record to delete does not exist")) {
        res.status(404).json({ error: "PricingPackageFeature not found." });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }
}

export default new PricingPackageFeatureController();