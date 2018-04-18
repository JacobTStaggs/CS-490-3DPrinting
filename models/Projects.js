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
      ref: 'materials'
    },
    fileName: String,
    clientName: String,
    engineerName: String,
    materialName: String,
    materialColorPicked: String,
    email: String,
    finalCost: Number,
    Density: String,
    datePosted: Date,
    stlFileLocation: String,

    archived: Boolean,
    paid: Boolean,
    print: Boolean,
    ship: Boolean,
    invoiced: Boolean,
    completed: Boolean,
  },
});
module.exports = mongoose.model('project', projectSchema);
