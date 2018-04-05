var mongoose = require('mongoose');
var materialSchema = mongoose.Schema({
  local: {
    name: String,
    actualCost: Number,
    salePrice: Number,
    colors: [String]
  },
});


module.exports = mongoose.model('Material', materialSchema);
