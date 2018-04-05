var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({
  local: {
    id: Schema.Types.ObjectId,
    materialID: ID,
    clientID: {type: Schema.Types.ObjectId, ref: 'User'},
    engineerID: {type: Schema.Types.ObjectId, ref: 'User'},
    totalCost: Number,
    colors: String,
    Density: String,
    datePosted: Date,
    stlFile: String,
    status: String,
    paid: Boolean,
    print: Boolean,
    ship: Boolean,
    invoiced: Boolean
  },
});
module.exports = mongoose.model('Project', project);
