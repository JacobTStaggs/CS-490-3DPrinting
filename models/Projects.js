var mongoose = require('mongoose')

var projectSchema = mongoose.Schema({
  local: {
    projectName: String,
    engineer: String,
    material: String,
    email: String,
    finalCost: Number,
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
module.exports = mongoose.model('projects', projectSchema, 'projects');
