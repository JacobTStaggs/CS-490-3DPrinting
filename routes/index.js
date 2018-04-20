var express = require('express');
var passport = require('passport');
var User = require('../models/usersModel.js');
var ObjectId = require('mongodb').ObjectId;
// const multer = require('multer');
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require('nodemailer');
const fileUpload = require('express-fileupload');
var NodeStl = require('node-stl');
const MongoClient = require('mongodb').MongoClient;
var mongoDB = 'mongodb://127.0.0.1/my_database';
// var app = require('../app.js');
var MaterialModel = require('../models/materials.js');
var ProjectModel = require('../models/projects.js');
var path = require('path');

MongoClient.connect(mongoDB, (err, client) => {
  if (err) return console.log(err);
  db = client.db('rcbi'); // whatever your database name is
  console.log('connected');
});
var router = express.Router();

router.use(fileUpload());

router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

router.get('/login', function(req, res, next) {
  res.render('login.ejs', {
    message: req.flash('loginMessage')
  });
});

router.get('/signup', function(req, res) {

  res.render('signup.ejs', {
    message: req.flash('signupMessage')
  });
});




router.get('/addMaterial', isEngineer, isLoggedIn, function(req, res) {
  res.render('addMaterial.ejs', {
    user: req.user
  });
});


router.post('/addMaterial', isLoggedIn, function(req, res) {
  db.collection('materials').save({
    name: req.body.matName,
    actualCost: req.body.matOurCost,
    salePrice: req.body.matSellingPrice,
    description: req.body.matDescription
  });
  db.collection('materials').find().toArray(function(err, results) {
    res.render('materials.ejs', {
      user: req.user,
      materials: results
    });
  });
});

router.get('/materials', isLoggedIn, function(req, res) {
  db.collection('materials').find().toArray(function(err, results) {
    res.render('materials.ejs', {
      user: req.user,
      materials: results
    });
  });
});





router.get('/projects', isLoggedIn, function(req, res) {
  db.collection('projects').find().toArray(function(err, results) {
    res.render('projects.ejs', {
      user: req.user,
      projects: results
    });
  });
});

// SHOW EDIT USER FORM
router.get('/editPassword/(:id)', function(req, res, next) {
  var o_id = new ObjectId(req.params.id).toString();
  res.render('editPassword.ejs', {
    message: '',
    id: o_id
  });
});

router.post('/projects', isLoggedIn, function(req, res) {
  let choice = req.body.filter;
  let parameter = req.body.parameter;
  if (choice == 'email') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'email': parameter
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  } else if (choice == 'engineer') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'engineerEmail': parameter
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  } else if (choice == 'shipped') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'shipped': true
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  } else if (choice == 'unpaid') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'paid': false
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  } else if (choice == 'invoiced') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'invoiced': true
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  } else if (choice == 'paid') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'paid': true,
      'archived': false
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  } else if (choice == 'unpaid') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'unpaid': true,
      'archived': false
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  } else if (choice == 'completed') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'completed': true,
      'archived': false
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  } else if (choice == 'archived') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'archived': true
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  } else if (choice == 'notinvoiced') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'invoiced': false,
      'archived': false
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  } else if (choice == 'all') {
    console.log(req.body.parameter);
    db.collection('projects').find({
      'archived': false
    }).toArray(function(err, results) {
      res.render('projects.ejs', {
        projects: results,
        user: req.user
      });
    });
  }
});


// SHOW EDIT USER FORM
router.get('/verifyEmail/(:id)', isLoggedIn, isVerified, function(req, res, next) {
  res.render('verifyEmail.ejs', {
    user: req.user
  });
});

router.post('/verifyEmail/(:id)', isLoggedIn, isVerified, function(req, res) {

  var o_id = new ObjectId(req.params.id).toString();


  db.collection('users').find({
    "_id": ObjectId(o_id).toString
  }).toArray(function(err, results) {

    for (var i = 0; i < results.length; i++) {

      if (results[i]._id == o_id) {

        console.log(results[i]);


        var state;
        if (req.body.userState == "NOT") {
          state = result[i].state;
        } else {
          state = req.body.userState;
        }
        db.collection('users').updateOne({
          "_id": results[i]._id
        }, {

          $set: {
            "local.emailValidated": true
          }

        });
        console.log("success");
        res.render('landing.ejs', {
          user: req.user
        });
        break;
      }

    }
  });
});
router.post('/editPassword/(:id)', function(req, res) {
  console.log(req.params.id);
  var o_id = new ObjectId(req.params.id).toString();

  console.log(o_id);


  db.collection('users').find({
    "_id": ObjectId(o_id).toString
  }).toArray(function(err, results) {

    for (var i = 0; i < results.length; i++) {

      if (results[i]._id == o_id) {

        console.log(results[i]);
        let password = req.body.password;

        db.collection('users').updateOne({
          "_id": results[i]._id
        }, {

          $set: {
            "local.password": bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
          }

        });
        console.log("success");
        res.render('success.ejs', {
          user: req.user
        });

        break;
      }

    }
  });
  res.render('success.ejs', {


  });
});


router.get('/edit/(:id)', function(req, res, next) {
  var o_id = new ObjectId(req.params.id).toString();

  db.collection('projects').find({
    "_id": ObjectId(o_id).toString
  }).toArray(function(err, result) {
    if (err) return console.log(err);

    // if porject not found
    if (!result) {
      req.flash('error', 'Project not found with id = ' + req.params.id);
      res.redirect('/projects');
    } else { // if porject not found
      for (var i = 0; i < result.length; i++) {

        if (result[i]._id == o_id) {
          console.log(result[i]);
          var project = result[i];

          db.collection('users').find({
            "local.role": "engineer"
          }).toArray(function(err, engineers) {
            console.log("get Engineers");
            console.log(engineers);

            res.render('edit.ejs', {
              user: req.user,
              title: 'Edit User',
              project: project,
              engineers: engineers


            });
          });


        }
      }

    }
  });
});

router.post('/edit/(:id)', function(req, res) {
  var o_id = new ObjectId(req.params.id).toString();

  engineerInfo = JSON.parse(req.body.projEngineer);

  var archived = false;
  var completed = false;

  if (req.body.projArchived == 'true')
    archived = true;
  if (req.body.projCompleted == 'true')
    completed = true;

  db.collection('projects').update({
    "_id": ObjectId(o_id).toString
  }, {
    $set: {
      "projectName": req.body.projName,
      "email": req.body.projCustEmail,
      "engineerName": engineerInfo.name,
      "engineerEmail": engineerInfo.email,
      "engineerID": engineerInfo.id,
      "finalCost": req.body.projEstimateCost,
      "completed": completed,
      "Density": req.body.projDensity,
      "comments": req.body.projComments,
      "archived": archived
    }
  });
  res.redirect("/edit/" + req.body.projId);
});

// SHOW EDIT USER FORM
router.get('/editUser/(:id)', function(req, res, next) {
  var o_id = new ObjectId(req.params.id).toString();

  db.collection('users').find({
    "_id": ObjectId(o_id).toString
  }).toArray(function(err, result) {
    if (err) return console.log(err);

    // if user not found
    if (!result) {
      req.flash('error', 'User not found with id = ' + req.params.id);
      res.redirect('/projects');
    } else { // if user found
      for (var i = 0; i < result.length; i++) {
        if (result[i]._id == o_id) {
          console.log(result[i]);
          res.render('editUser.ejs', {
            user: req.user,
            title: 'Edit User',

            id: result[i]._id,
            userFName: result[i].local.firstName,
            userLName: result[i].local.lastName,
            userEmail: result[i].local.email,
            userStreet: result[i].local.street,
            userCity: result[i].local.city,
            userState: result[i].local.state,
            userZip: result[i].local.zip,
            userPhone: result[i].local.phone,
            userContract: result[i].local.contract,
            userRole: result[i].local.role,
            userBan: result[i].local.banned
          });
        }


      }

    }
  });
});




router.post('/editUser/(:id)', function(req, res) {
  console.log(req.params.id);
  console.log("param");


  var o_id = new ObjectId(req.params.id).toString();

  console.log(o_id);

  db.collection('users').find({
    "_id": ObjectId(o_id).toString
  }).toArray(function(err, results) {

    for (var i = 0; i < results.length; i++) {

      if (results[i]._id == o_id) {

        console.log(results[i]);


        var state;
        if (req.body.userState == "NOT") {
          state = result[i].state;
        } else {
          state = req.body.userState;
        }

        var Banned = false;
        if (req.body.userBan == "true")
          Banned = true;

        db.collection('users').updateOne({
          "_id": results[i]._id
        }, {

          $set: {
            "local.firstName": req.body.userFName,
            "local.lastName": req.body.userLName,
            "local.email": req.body.userEmail,
            "local.street": req.body.userStreet,
            "local.city": req.body.userCity,
            "local.state": state,
            "local.zip": req.body.userZip,
            "local.phone": req.body.userPhone,
            "local.contract": req.body.userContract,
            "local.role": req.body.userRole,
            "local.banned": Banned
          }

        });
        console.log("success");

        res.render('editUser.ejs', {
          user: req.user,
          title: 'Edit User',
          //data: rows[0],
          id: o_id,
          userFName: req.body.userFName,
          userLName: req.body.userLName,
          userEmail: req.body.userEmail,
          userStreet: req.body.userStreet,
          userCity: req.body.userCity,
          userState: req.body.userState,
          userZip: req.body.userZip,
          userPhone: req.body.userPhone,
          userContract: req.body.userContract,
          userRole: req.body.userRole,
          userBan: Banned
        });

      }

    }
  });
});









router.get('/landing', isLoggedIn, function(req, res) {
  res.render('landing.ejs', {
    user: req.user
  });
})
router.get('/adminUserList', isLoggedIn, isRole, function(req, res) {
  db.collection('users').find().toArray(function(err, results) {
    if (err) console.log(err);
    res.render('adminUserList.ejs', {
      user: req.user,
      users: results,
    });
  });
});

router.post('/addMaterial', isLoggedIn, function(req, res) {
  db.collection('materials').save({
    name: req.body.matName,
    actualCost: req.body.matOurCost,
    salePrice: req.body.matSellingPrice,
    description: req.body.matDescription
  });
  res.redirect('/materials', {
    user: req.user
  });
});




router.get('/quote', isLoggedIn, function(req, res) {
  db.collection('materials').find().toArray(function(err, results) {
    if (err) console.log(err);
    console.log(results);
    res.render('quote.ejs', {
      materials: results,
      user: req.user
    });
  });
});

router.get('/resetPassword', function(req, res) {
  res.render('resetPassword.ejs');
});
router.post('/resetPassword', function(req, res) {
  res.send('Email sent');
  let email = req.body.email;
  console.log(email);
  db.collection('users').find({
    "local.email": email
  }).toArray(function(err, result) {
    console.log(result[0]._id);
    resetPassword(email, result[0]._id);
    return result;
  });


})

router.post('/quote', isLoggedIn, function(req, res) {

  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }


  var matArr = JSON.parse(req.body.material)
  let materialID = matArr.id;
  let materialName = matArr.name;
  let materialCost = matArr.price;

  let projectName = req.body.projectName;
  let email = req.user.local.email;
  let clientID = req.user.id;
  let density = req.body.projectDensity;
  var datePosted = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  let projectComments = req.body.projectComments;
  //Calculate Estimate Price

  var theFile = req.files.myFile;
  var originalName = theFile.name;
  var stripped = theFile.name.split(".");
  if (path.extname(theFile.name).toLowerCase() != ".stl")
    res.redirect('/quote')

  var newName = stripped[0] + "-" + Date.now() + path.extname(theFile.name);

  console.log(__dirname);
  var fullPath = path.join(__dirname, "..", "uploads", newName);
  console.log(fullPath);
  //  Use the mv() method to place the file somewhere on your server

  theFile.mv(fullPath, function(err) {

    if (err)
      console.log(err);

    var fileInfo = NodeStl(fullPath);

    console.log(fileInfo.volume);
    var volume = fileInfo.volume;
    finalCost = calcPrintCost(materialCost, volume, density);
    console.log(finalCost);

    db.collection('projects').save({

      projectName: projectName,
      clientName: req.user.local.firstName + " " + req.user.local.lastName,
      email: email,
      clientID: clientID,

      materialName: materialName,
      materialCost: materialCost,
      materialID: materialID,



      fileOldName: originalName,
      fileNewName: newName,
      filePath: fullPath,
      fileSize: theFile.data.length,
      fileMimeType: theFile.mimetype,
      fileMd5: theFile.md5,
      fileEncoding: theFile.encoding,
      volume: volume,
      email: email,
      engineerName: 'Unassigned',
      engineerEmail: 'Unassigned',
      datePosted: datePosted,
      Density: density,

      archived: false,
      completed: false,
      finalCost: finalCost
    }, (err, result) => {
      if (err) return console.log(err);


    });

    console.log('saved to database');
    res.redirect('/projects');

  });


});




router.get('/profile', isLoggedIn, function(req, res) {
  db.collection('users').find().toArray(function(err, results) {
    if (err) console.log(err);
    res.render('profile.ejs', {
      users: results,
      user: req.user
    });
  });
});





router.get('/download/(:fileNewName)', function(req, res) {

  console.log("made it to download");

  var file = __dirname + '/../uploads/' + req.params.fileNewName;

  console.log(file);
  res.download(file, req.params.fileNewName); // Set disposition and send it.




});

router.get("/banned", function(req, res) {
  console.log("a banned user");
  res.render("index.ejs", {
    msg: "You were banned, please conteact RCBI if you have questions."
  });

});




router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/verify',
  failureRedirect: '/signup',
  failureFlash: true,
}));
router.get('/verify', isLoggedIn, function(req, res) {
  res.render('verify.ejs', {
    user: req.user
  });
  sendEmail(req.user._id, req.user.local.email);
})

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/landing',
  failureRedirect: '/login',
  failureFlash: true,
}));



module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  if (req.user.local.banned) {
    res.redirect('/banned');
  }
  res.redirect('/');
}

function isRole(req, res, next) {
  if (req.isAuthenticated() && req.user.local.role == 'admin')
    return next();
  res.redirect('/profile');
}

function isVerified(req, res, next) {
  if (req.isAuthenticated() && req.user.local.emailValidated == false) {
    return next();
    res.redirect('/profile');
  }
}


function getEngineers() {
  db.collection('users').find({
    "local.role": "engineer"
  }).toArray(function(err, result) {
    console.log("get Engineers");
    console.log(result);
    return result;
  });
}

function getMaterials() {
  db.collection('materials').find().toArray(function(err, result) {
    console.log(result);
    return result;
  });
}

function isEngineer(req, res, next) {
  if (req.isAuthenticated() && req.user.local.role == 'admin' || req.user.local.role == 'engineer')
    return next();
  res.redirect('/profile');
}

function sendEmail(userID, userEmail) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'rcbi3dprinting@gmail.com',
      pass: 'RCBI2018'
    }
  });

  var mailOptions = {
    from: 'RCBI3DPRINTING@noresponse.COM',
    to: userEmail,
    subject: 'Sending Email using Node.js',
    html: '<p>Click <a href="http://localhost:3000/verifyEmail/' + userID + '">here</a> to verify your account</p>'
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

function calcPrintCost(materialCostPerVolume, volume, density) {
  var densityCostModifier;

  switch (density) {
    case "Solid":
      densityCostModifier = 1.0;
      break;
    case "Sparse":
      densityCostModifier = 0.35;
      break;
    case "Sparse Double Dense":
      densityCostModifier = 0.55;
      break;
  }

  //This is a terrible and rough estimation to estiamte man hours. needs work.
  var manHours = volume;
  var costPerManHour = 25;

  var preCost = (materialCostPerVolume * volume * densityCostModifier) + (manHours * costPerManHour * densityCostModifier);
  cost = preCost.toFixed(2);
  return cost;
}




function resetPassword(userEmail, userID) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'rcbi3dprinting@gmail.com',
      pass: 'RCBI2018'
    }
  });

  var mailOptions = {
    from: 'RCBI3DPRINTING@noresponse.COM',
    to: userEmail,
    subject: 'Sending Email using Node.js',
    html: '<p>Click <a href="http://localhost:1000/editPassword/' + userID + '">here</a> to reset your password</p>'
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}
