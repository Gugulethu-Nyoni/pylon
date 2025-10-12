import pricingPackageService from '../services/pricingPackageService.js';

class PricingPackageController {
  async createPricingPackage(req, res) {
    try {
      const result = await pricingPackageService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getPricingPackageById(req, res) {
    try {
      const result = await pricingPackageService.getById(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async getAllPricingPackages(req, res) {
    try {
      const result = await pricingPackageService.getAll();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updatePricingPackage(req, res) {
    try {
      // Parse ID from string to integer (for sqlite/mysql; mongo uses string IDs)
      const resourceId = parseInt(req.params.id, 10);

      // Validate parsed ID
      if (isNaN(resourceId)) {
        return res.status(400).json({ error: 'Invalid PricingPackage ID provided. Must be a number.' });
      }

      const result = await pricingPackageService.update(resourceId, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deletePricingPackage(req, res) {
    try {
      // Parse ID from string to integer (for sqlite/mysql; mongo uses string IDs)
      const resourceId = parseInt(req.params.id, 10);

      // Validate parsed ID
      if (isNaN(resourceId)) {
        return res.status(400).json({ error: 'Invalid PricingPackage ID provided. Must be a number.' });
      }

      await pricingPackageService.delete(resourceId);
      res.status(204).send();
    } catch (err) {
      if (err.message.includes("Record to delete does not exist")) {
        res.status(404).json({ error: "PricingPackage not found." });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }
}

export default new PricingPackageController();