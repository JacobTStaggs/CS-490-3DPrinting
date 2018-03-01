var express = require('express'),
    app = express(),
    path = require('path'),
    mongoose = require('mongoose'),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    User = require("./models/user"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");


mongoose.connect('mongodb://localhost/auth');

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(require('express-session')({
  secret: "superlongsecretthatnooneknows",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// use res.render to load up an ejs view file
app.use(express.static(path.join(__dirname, 'public')));

// index page
app.get('/', function(req, res) {
    res.render('pages/index');
});

// LOGIN
// render login form
app.get("/login", function(req, res) {
   res.render("pages/login");
});
//login logic
//middleware
app.post("/login", passport.authenticate("local", {
   successRedirect: "/profile",
   failureRedirect: "/login"
}), function(req, res) {

});

  app.get("/logout",function(req, res) {
      req.logout();
      res.redirect("/");
  });
// about page
app.get('/signup', function(req, res) {
    res.render('pages/signup');
});
app.post('/signup', function(req, res){
  User.register(new User({username: req.body.username, fName: req.body.fName, lName: req.body.lName}), req.body.password, function(err, user){
  if(err){
    console.log(err);
    return res.render('pages/signup');
  }
  passport.authenticate("local")(req,res,function(){
    res.redirect('/profile');
  });
  });
});
app.get('/profile', isLoggedIn ,function(req,res){
  res.render('/profile');
})

app.post('/profile', passport.authenticate("local",{
  successRedirect: "/profile",
  failureRedirect: "/login"
}));

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

app.listen(8080);
console.log('8080 is the magic port');
