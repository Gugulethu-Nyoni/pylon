import pricingPackageFeatureService from '../services/pricingPackageFeatureService.js';

class PricingPackageFeatureController {
  async createPricingPackageFeature(req, res) {
    try {
      
      const { pricingPackageId, featureId, limitValue, status } = req.body; 

      const finalData = {
        pricingPackageId:pricingPackageId,
        featureId: featureId,
        limitValue: parseInt(limitValue),
        status: parseInt(status) > 0 ? true : false 
      }

      const result = await pricingPackageFeatureService.create(finalData);
      res.status(201).json(result);
    } catch (err) {
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