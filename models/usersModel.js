var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var Schema = mongoose.Schema;

var userSchema = new Schema({
  local: {
    firstName: String,
    lastName:String,
    email: String,
    password: String,
    role:{
      type: String,
      enum: ['user', 'engineer', 'admin']
    },
    street:String,
    city: String,
    state: String,
    zip: Number,
    phone: Number,
    contract: Boolean,
    emailValidated: Boolean
  },
});

userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('user', userSchema);
