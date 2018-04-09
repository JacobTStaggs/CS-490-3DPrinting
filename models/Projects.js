var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var projectSchema = new Schema({
  local: {
    projectName: String,
    engineerID: {
      type: Schema.ObjectId,
      ref: 'users'
    },
    clientsID: {
      type: Schema.ObjectId,
      ref: 'users'
    },
    materialID: {
      type: Schema.ObjectId,
      ref: 'users'
    },
    clientName: String,
    engineerName: String,
    materialName: String,
    email: String,
    finalCost: Number,
    colors: String,
    Density: String,
    datePosted: Date,
    stlFileLocation: String,
    status: String,
    paid: Boolean,
    print: Boolean,
    ship: Boolean,
    invoiced: Boolean
  },
});
module.exports = mongoose.model('project', projectSchema);
