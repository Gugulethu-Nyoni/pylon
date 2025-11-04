import PylonModel from '../models/mysql/Pylon.js';
import UserModel from '../../../../models/mysql/User.js';
import MeteringModel from '../models/mysql/Metering.js';


class PylonService {
  constructor() {
    // You can initialize properties here if needed
  }

  //  FIXED: Proper middleware factory function
featureGuard(model, action) {
  return async (req, res, next) => {
    try {

      let isAllowed = false;
      let hasCredit = false;
      let notAlloweMessage;
      let noCreditMessage;  

      const routeFeature = `${model.toLowerCase()}_${action}`; // e.g., Form + create → form_create

      // Retrieve user data
      const userData = await UserModel.getPylonUserById(req.userId);
      console.log('- userData:', JSON.stringify(userData,null,2));

        const features = Object.fromEntries(
        userData.organization.pricingPackage.features.map(f => [
          f.feature.name,
          {
            limitValue: f.limitValue,
            status: f.status,
            count: f.feature.count,
            timeframe: f.feature.timeframe
          }
        ])
      );

      console.log("Feature Map:", features);

        if (!userData) {
          console.log('User not found:', req.userId);
          return res.status(404).json({ message: 'User not found' });
        }

      // Extract user settings
      const userSettings = userData.userSettings;
      console.log('- User Settings:', userSettings);
      console.log('- routeFeature:', routeFeature);

      if(userSettings.includes(routeFeature)) { 
        isAllowed = true;
        console.log("routeFeature",isAllowed);
      } else {
        notAlloweMessage = 'You have no access to this feature'; 
      }

      // Check feature access or quota
       hasCredit = this.checkCredit(userData, routeFeature, features);

       if(!hasCredit) {
        noCreditMessage = 'Quota exceeded. You need to upgrade your plan.';
       }

       if(isAllowed && hasCredit) {
      console.log('Feature access granted');
         next();
       } else {
        console.log('Quota exceeded for user:', req.userId);
        return res.status(403).json({
          message: `${notAlloweMessage} ${noCreditMessage}`,
        });

       }

      
    } catch (error) {
      console.error('Error in featureGuard:', error);
      return res.status(500).json({
        message: 'Internal server error in feature guard'
      });
    }
  };
}



  // Helper method for feature access logic
  checkCredit(userData, routeFeature, features) {
  const timeframe = features[routeFeature]?.timeframe;
  const limitValue = features[routeFeature]?.limitValue;
  const status = features[routeFeature]?.status;
  const count = features[routeFeature]?.count;

/// STATUS IS false we reture false regardless of count metering or not 
  if(!status ) {
    return {
      status: false,
      message: 'This feature is disabled'
    }
  }


const usageCount = timeframe === "MONTHLY"
  ? await MeteringModel.countMonthlyUsage(userData.organizationId, routeFeature)
  : await MeteringModel.countYearlyUsage(userData.organizationId, routeFeature);


    
    return false;
  }




  async create(data) {
    return await PylonModel.create(data);
  }

  async getById(id) {
    return await PylonModel.findById(id);
  }

  async getAll() {
    return await PylonModel.findAll();
  }

  async update(id, data) {
    return await PylonModel.update(id, data);
  }

  async delete(id) {
    return await PylonModel.delete(id);
  }
}

export default new PylonService();