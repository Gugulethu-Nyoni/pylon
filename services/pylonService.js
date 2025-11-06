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

      //console.log("THERE?",req.userId);

      let isAllowed = false;
      //let hasCredit = false;
      let notAlloweMessage;
      let noCreditMessage;  

      const routeFeature = `${model.toLowerCase()}_${action}`; // e.g., Form + create → form_create
      //console.log("routeFeature",routeFeature);
      // Retrieve user data
      const userData = await UserModel.getPylonUserById(req.userId);
      //console.log('- userData:', JSON.stringify(userData,null,2));

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

      //console.log("Feature Map:", features);

        if (!userData) {
          console.log('User not found:', req.userId);
          return res.status(404).json({ message: 'User not found' });
        }

      // Extract user settings
      const userSettings = userData.userSettings;
     // console.log('- User Settings:', userSettings);
      //console.log('- routeFeature:', routeFeature);

      if(userSettings.includes(routeFeature)) { 
        isAllowed = true;
      //console.log("routeFeature",isAllowed);
      } else {
        notAlloweMessage = 'You have no access to this feature'; 
      }

      // Check feature access or quota
       const hasCredit = await this.checkCredit(userData, routeFeature, features);
       //console.log("hasCredit",hasCredit);
       if(!hasCredit.status) {
        noCreditMessage = `${features[routeFeature]?.timeframe.charAt(0).toUpperCase()}${features[routeFeature]?.timeframe.slice(1).toLowerCase()} Quota exceeded. You need to upgrade your plan.`;
       }

       if(isAllowed && hasCredit.status) {
      //console.log('Feature access granted');

      // prepare data need to metering
      // metering happens at controller level after succesful record creation
      req.userData = {
        id: userData.id,
        organizationId: userData.organization?.id,
        featureName: routeFeature,
        action: action,
      };
      req.pylon = true; // so that in your controller 

         next();
       } else {
        console.log(`${features[routeFeature]?.timeframe} Quota exceeded for user:`, req.userId);
        return res.status(403).json({
            message: `${notAlloweMessage || ''} ${noCreditMessage}`.trim(),

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
async checkCredit(userData, routeFeature, features) {
  const timeframe = features[routeFeature]?.timeframe;
  const limitValue = features[routeFeature]?.limitValue;
  const status = features[routeFeature]?.status;
  const count = features[routeFeature]?.count;

  /// STATUS IS false we return false regardless of count metering or not 
  if (!status) {
    return {
      status: false,
      message: 'This feature is disabled'
    };
  }


  // If limitValue is -1, the feature is unlimited, so return true immediately.
   
    if (count && limitValue === -1) {
        return {
            status: true,
            message: 'Unlimited access' // Optional message for clarity
        };
    }
    

  // if this is a count based feature
  if (count) {
    const usageCount = timeframe === "MONTHLY"
      ? await MeteringModel.countMonthlyUsage(userData.organizationId, routeFeature)
      : await MeteringModel.countYearlyUsage(userData.organizationId, routeFeature);

    const credit = limitValue - usageCount;

    //console.log("limitValue",limitValue);
    //console.log("usageCount",limitValue);
    //console.log("credit",credit);


    if (credit <= 0) {
      return {
        status: false,
        message: `Quota exhausted for this ${timeframe.toLowerCase()}`
      };
    } else {
      // return true if credit is still available
      return {
        status: true,
        remaining: credit
      };
    }
  }

  // For features that are not count-based
  return {
    status: true
  };
}

async logUsage(data) {
  const usageData = {
  organizationId: parseInt(data.organizationId,10),
  featureName: data.featureName,
  action: data.action,
  metadata: { userId: data.id }
};


return await MeteringModel.create(usageData);
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