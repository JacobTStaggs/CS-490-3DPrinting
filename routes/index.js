var express = require('express');
var passport = require('passport');
var NodeStl = require('node-stl');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  res.render('login.ejs', { message: req.flash('loginMessage') });
});

router.get('/quote', function (req, res, next){
  res.render('quote.ejs', {user: req.user});
});

router.get('/info', function(req, res, next){
  if(req.User.email == null){
    email = "test";
  }else{
    email = req.User.email;
  }
  res.render('info.ejs', {userEmail: email});
});

router.get('/signup', function(req, res) {
  res.render('signup.ejs', { message: req.flash('signupMessage') });
});

router.get('/profile', isLoggedIn, function(req, res) {
  res.render('profile.ejs', { user: req.user });
});
router.get('/quote', function(req,res){
  res.render('quote.ejs');
});

router.post('/quote', function(req, res){

  if (!req.files)
  return res.status(400).send('No files were uploaded.');

// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
let sampleFile = req.files.sampleFile;
let material = req.body.materials;
let projectName = req.body.projectName;
var cost = 0;
var str1 = sampleFile.name;
var path = 'C:/files/';
var finalPath = path.concat(str1);
sampleFile.mv(path, function(err){
  if(err)
    return res.statis(500).send(err);
});
var file = NodeStl('C:/FILES/' + str1);
console.log(file.volume);
var volume = file.volume;
if (material == 'mat1'){
  cost = .20;
}else if(material == 'mat2'){
 cost = .25;
}
let finalCost = volume * cost;
finalCost = finalCost.toFixed(2);
// Use the mv() method to place the file somewhere on your server
sampleFile.mv(finalPath, function(err) {
  if (err)
    return res.status(500).send(err);
  res.render('info.ejs', {volume: volume, 'name': str1, 'material': material, 'cost': finalCost, 'user': req.user, 'project': projectName});
});
});
router.get('')
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/profile',
  failureRedirect: '/signup',
  failureFlash: true,
}));

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true,
}));


module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
      return next();
  res.redirect('/');
}
