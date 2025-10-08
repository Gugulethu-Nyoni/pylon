import featureService from '../services/featureService.js';

class FeatureController {
  async createFeature(req, res) {
    try {
      const result = await featureService.create(req.body);
      res.status(201).json(result);
    } catch (err) {
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

  async getFeatureByName(req, res) {
    try {
      const result = await featureService.getByName(req.params.name);
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
      const result = await featureService.update(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deleteFeature(req, res) {
    try {
      await featureService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

export default new FeatureController();