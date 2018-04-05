
var mongoose = require('mongoose');

//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/my_database';
mongoose.connect(mongoDB);
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;
db.createCollection("users", function(err, res) {
   if (err) throw err;
   console.log("Collection created!");
 });
 db.collection('user').insertOne({
   first: 'Jacob',
   last: 'Staggs'
 });

var a = db.user.find();
console.log(a);
var test = db.collection('user').findOne({}, function(err, result){
  if(err) throw err;
  test += result.first;
});


console.log(test);
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
