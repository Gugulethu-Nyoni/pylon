import PylonModel from '../models/mysql/Pylon.js';

class PylonService {

  constructor () {
  
  /*
  this.model = model;
  this.action = action;
  this.routeAction = this.model.toLowerCase() + '_' + this.action; // Form + create === form_create
  console.log(this.routeAction);
   */

  }

 featureGuard (model, action) {

  //const model = model;
  //const action = action;
  const routeAction = model.toLowerCase() + '_' + action; // Form + create === form_create
  console.log(routeAction);


// simulate

let allowed = false;


return async (req, res, next) => {


if (!allowed) { 
console.log('Quota exceeded!');
return res.status(403).json({ message: 'Quota exceeded you need to upgrade your plan'})
} else {


  next();
}



}




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