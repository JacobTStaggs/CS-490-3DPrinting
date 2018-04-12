var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var materialSchema =new Schema({
  local: {
    name: String,
    actualCost: Number,
    salePrice: Number,
    colors: [String],
    description: String
  },
});


module.exports = mongoose.model('material', materialSchema);
