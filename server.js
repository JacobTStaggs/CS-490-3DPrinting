//Loading all the dependencies
var express = require('express');
var app = express();
//Setting the view engine to ejs
app.set('view engine', 'ejs');
//res.render is useful to load each view up, each page will need this
//Index
app.get('/', function(req, res){
  res.render('pages/index');
});

// TODO Setting the port **WILL NEED TO HAVE A SETTINGS.JSON FILE FOR THIS LATER**
app.listen(8080);
console.log('Web-app is running on port: 8080');
