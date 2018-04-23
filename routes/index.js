 var express = require('express');
 var csvwriter = require('csvwriter');
 var fs = require('fs');
 var passport = require('passport');
 var User = require('../models/usersModel.js');
 var ObjectId = require('mongodb').ObjectId;
 // const multer = require('multer');
 var dateTime = require('node-datetime');
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




 router.get('/addMaterial', isLoggedIn, function(req, res) {
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
   res.redirect("/materials");
 });


 router.get('/materials', isLoggedIn, function(req, res) {
   db.collection('materials').find().toArray(function(err, results) {
     res.render('materials.ejs', {
       user: req.user,
       materials: results
     });
   });
 });

 router.get('/deleteMaterial/(:id)', isLoggedIn, function(req, res) {

   var o_id = new ObjectId(req.params.id).toString();


   db.collection('materials').find().toArray(function(err, results) {

     for (var i = 0; i < results.length; i++) {

       if (results[i]._id == o_id) {

         db.collection('materials').deleteOne({
           "_id": results[i]._id
         }, function(err) {
           if (err) return handleError(err);
           console.log("deleted");
           res.redirect("/materials")
         });
       }
     }
   });
 });





 router.get('/projects', isLoggedIn, function(req, res) {
   if (req.user.local.role == 'engineer') {
     db.collection('projects').find({
       'engineerEmail': req.user.local.email,
       'archived': false
     }).toArray(function(err, results) {
       console.log(results);
       res.render('projects.ejs', {
         user: req.user,
         projects: results
       });
     });
   } else {
     db.collection('projects').find({
       'archived': false
     }).toArray(function(err, results) {
       console.log(results);
       res.render('projects.ejs', {
         user: req.user,
         projects: results
       });
     });
   }
 });

 // SHOW EDIT USER FORM
 router.get('/editPassword/(:id)', function(req, res, next) {
   var o_id = new ObjectId(req.params.id).toString();
   res.render('editPassword.ejs', {
     message: '',
     id: o_id
   });
 });

 router.get('/reports', isLoggedIn, function(req, res, next) {
   db.collection('users').find({
     "local.role": "engineer"
   }).toArray(function(err, results) {
     console.log(results);
     res.render('reports.ejs', {

       engineers: results,
       user: req.user
     });
   });

 });

 router.post('/reports', isLoggedIn, function(req, res) {
   let choice = req.body.parameters;
   console.log(req.body.parameters);
   var dt = dateTime.create();
   var formatted = dt.format('Y-m-d H:M:S');
   if (req.body.parameters == 'All Users') {
     db.collection('users').find().toArray(function(err, results) {
       console.log(results);
       csvwriter(results, function(err, csv) {
         var stream = fs.createWriteStream("stest.csv");
         stream.once('open', function(fd) {
           stream.write(csv);
           stream.end();
         })
         console.log(csv);
       })
     });
   }
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
   } else if (choice == 'notCompleted') {
     console.log(req.body.parameter);
     db.collection('projects').find({
       'completed': false,
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
   } else if (choice == 'notArchived') {
     console.log(req.body.parameter);
     db.collection('projects').find({
       'archived': false
     }).toArray(function(err, results) {
       res.render('projects.ejs', {
         projects: results,
         user: req.user
       });
     });
   } else if (choice == 'yourProjects') {
     console.log(req.body.parameter);
     db.collection('projects').find({
       'archived': false,
       'local.email': req.user.local.email
     }).toArray(function(err, results) {
       res.render('projects.ejs', {
         projects: results,
         user: req.user
       });
     });
   } else if (choice == 'all') {
     console.log(req.body.parameter);
     db.collection('projects').find().toArray(function(err, results) {
       res.render('projects.ejs', {
         projects: results,
         user: req.user
       });
     });
   }
 });


 // SHOW EDIT USER FORM
 router.get('/verifyEmail/(:id)', function(req, res, next) {

   var o_id = new ObjectId(req.params.id).toString();


   db.collection('users').find({
     "_id": ObjectId(o_id).toString
   }).toArray(function(err, results) {

     for (var i = 0; i < results.length; i++) {

       if (results[i]._id == o_id) {

         console.log(results[i]);

         res.render('verifyEmail.ejs', {
           user: results[i]
         });
       }
     }
   });
 });

 router.post('/verifyEmail/(:id)', function(req, res) {

   var o_id = new ObjectId(req.params.id).toString();


   db.collection('users').find({
     "_id": ObjectId(o_id).toString
   }).toArray(function(err, results) {

     for (var i = 0; i < results.length; i++) {

       if (results[i]._id == o_id) {

         console.log(results[i]);



         db.collection('users').updateOne({
           "_id": results[i]._id
         }, {

           $set: {
             "local.emailValidated": true
           }

         }, function(err) {

           console.log("success");
           res.redirect('/');
         });
       }

     }
   });
 });


 router.post('/editPassword/(:id)', function(req, res) {
   console.log(req.params.id);
   var o_id = new ObjectId(req.params.id).toString();

   console.log(o_id);

   if (req.body.password != req.body.passwordRepeat) {
     res.render('editPassword.ejs', {
       message: 'Password and Password Confirm Must Match',
       id: o_id
     });


   } else {


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

           res.render('login.ejs');
         }
       }
     });
   }
 });


 router.get('/edit/(:id)', isLoggedIn, function(req, res, next) {
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
               title: 'Edit Project',
               project: project,
               engineers: engineers


             });
           });


         }
       }

     }
   });
 });

 router.post('/edit/(:id)', isLoggedIn, function(req, res, next) {
   var o_id = new ObjectId(req.params.id).toString();

   engineerInfo = JSON.parse(req.body.projEngineer);

   var archived = false;
   var completed = false;

   if (req.body.projArchived == 'true')
     archived = true;
   if (req.body.projCompleted == 'true')
     completed = true;

   db.collection('projects').find({
     "_id": ObjectId(o_id).toString
   }).toArray(function(err, results) {

     for (var i = 0; i < results.length; i++) {

       if (results[i]._id == o_id) {

         console.log(results[i]);

         db.collection('projects').updateOne({
           "_id": results[i]._id
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
             "projectComments": req.body.projComments,
             "archived": archived
           }
         });

         res.redirect("/edit/" + req.body.projId);
       }
     }
   });
 });

 // SHOW EDIT USER FORM
 router.get('/editUser/(:id)', isLoggedIn, function(req, res, next) {
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

 router.get('/editMaterials/(:id)', isLoggedIn, function(req, res) {
   var o_id = new ObjectId(req.params.id).toString();

   db.collection('materials').find({
     "_id": ObjectId(o_id).toString
   }).toArray(function(err, result) {
     if (err) return console.log(err);

     // if user not found
     if (!result) {
       req.flash('error', 'Material not found with id = ' + req.params.id);
       res.redirect('/materials');
     } else { // if user found
       for (var i = 0; i < result.length; i++) {
         if (result[i]._id == o_id) {
           console.log(result[i]);
           res.render('editMaterials.ejs', {
             user: req.user,
             material: result[i],
             id: result[i]._id
           });
         }
       }
       // render to views/user/edit.ejs template file

     }
   });
 });

 router.post('/editMaterials/(:id)', isLoggedIn, function(req, res, next) {
   var o_id = new ObjectId(req.params.id).toString();

   db.collection('materials').find({
     "_id": ObjectId(o_id).toString
   }).toArray(function(err, result) {
     if (err) return console.log(err);

     // if user not found
     if (!result) {
       req.flash('error', 'Material not found with id = ' + req.params.id);
       res.redirect('/materials');
     } else { // if user found
       for (var i = 0; i < result.length; i++) {
         if (result[i]._id == o_id) {
           console.log(result[i]);

           db.collection('materials').update({
             "_id": result[i]._id
           }, {
             "name": req.body.matName,
             "actualCost": req.body.matOurCost,
             "salePrice": req.body.matSellingPrice,
             "description": req.body.matDescription
           });
           res.redirect("/editMaterials/" + req.params.id);
         }
       }
       // render to views/user/edit.ejs template file

     }
   });
 });


 router.post('/editUser/(:id)', isLoggedIn, function(req, res) {
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

         var Contract = false;
         if (req.body.userContract == "true")
           Contract = true;

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
             "local.contract": Contract,
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
 });

 router.get('/adminUserList', isLoggedIn, isRole, function(req, res) {
   db.collection('users').find({
     "local.banned": false
   }).toArray(function(err, results) {
     if (err) console.log(err);
     res.render('adminUserList.ejs', {
       user: req.user,
       users: results,
     });
   });
 });

 router.post('/adminUserList', isLoggedIn, isRole, function(req, res) {
   var choice = req.body.choice;

   if (choice == 'banned') {
     console.log(req.body.parameter);
     db.collection('users').find({
       'local.banned': true
     }).toArray(function(err, results) {
       res.render('adminUserList.ejs', {
         users: results,
         user: req.user
       });
     });
   } else if (choice == 'contractSigned') {
     console.log(req.body.parameter);
     db.collection('users').find({
       'local.contract': true,
       'local.banned': false
     }).toArray(function(err, results) {
       res.render('adminUserList.ejs', {
         users: results,
         user: req.user
       });
     });

   } else if (choice == 'contractNotSigned') {
     console.log(req.body.parameter);
     db.collection('users').find({
       'local.contract': false,
       'local.banned': false
     }).toArray(function(err, results) {
       res.render('adminUserList.ejs', {
         users: results,
         user: req.user
       });
     });

   } else if (choice == 'email') {
     console.log(req.body.parameter);
     db.collection('users').find({
       'local.email': req.body.parameter
     }).toArray(function(err, results) {
       res.render('adminUserList.ejs', {
         users: results,
         user: req.user
       });
     });

   } else if (choice == 'admins') {
     console.log(req.body.parameter);
     db.collection('users').find({
       'local.role': 'admin'
     }).toArray(function(err, results) {
       res.render('adminUserList.ejs', {
         users: results,
         user: req.user
       });
     });

   } else if (choice == 'engineers') {
     console.log(req.body.parameter);
     db.collection('users').find({
       'local.role': 'engineer'
     }).toArray(function(err, results) {
       res.render('adminUserList.ejs', {
         users: results,
         user: req.user
       });
     });

   } else if (choice == 'finance') {
     console.log(req.body.parameter);
     db.collection('users').find({
       'local.role': 'finance'
     }).toArray(function(err, results) {
       res.render('adminUserList.ejs', {
         users: results,
         user: req.user
       });
     });

   } else if (choice == 'clients') {
     console.log(req.body.parameter);
     db.collection('users').find({
       'local.role': 'user'
     }).toArray(function(err, results) {
       res.render('adminUserList.ejs', {
         users: results,
         user: req.user
       });
     });

   } else if (choice == 'all') {
     console.log(req.body.parameter);
     db.collection('users').find().toArray(function(err, results) {
       res.render('adminUserList.ejs', {
         users: results,
         user: req.user
       });
     });

   } else {
     res.send("somehow we let you make an invalid choice")
   }

 });

 router.post('/addMaterial', isLoggedIn, function(req, res) {
   db.collection('materials').save({
     name: req.body.matName,
     actualCost: req.body.matOurCost,
     salePrice: req.body.matSellingPrice,
     description: req.body.matDescription
   });
   res.redirect('/materials');
 });




 router.get('/quote', isLoggedIn, function(req, res) {
   db.collection('materials').find().toArray(function(err, results) {
     if (err) console.log(err);
     console.log(results);
     res.render('quote.ejs', {
       materials: results,
       user: req.user,
       error: ""
     });
   });
 });

 router.get('/resetPassword', function(req, res) {
   res.render('resetPassword.ejs', {
     user: req.body.user
   });
 });



 router.post('/resetPassword', function(req, res) {



   let email = req.body.email;
   console.log(email);
   db.collection('users').findOne({
     "local.email": email
   }, function(err, result) {
     if (result) {
       resetPassword(email, result._id);
       console.log(result._id);
       res.render('forgotPassword.ejs');
       return result;
     } else {
       res.render('forgotPassword.ejs');
     }
   });
 });






 router.post('/quote', isLoggedIn, function(req, res) {

   if (!req.files) {
     res.status(400).send('No files were uploaded.');
   } else {


     var matArr = JSON.parse(req.body.material);
     let materialID = matArr.id;
     let materialName = matArr.name;
     let materialCost = matArr.price;

     let projectName = req.body.projectName;
     let email = req.user.local.email;
     let clientID = req.user.id;
     let density = req.body.projectDensity;
     var datePosted = new Date().toISOString();
     let projectComments = req.body.projectComments;
     //Calculate Estimate Price

     var theFile = req.files.myFile;
     var originalName = theFile.name;
     var stripped = theFile.name.split(".");

     if ((theFile.data.length > 20000000) && (req.user.local.role != "admin" && req.user.local.role != "engineer")) { // If file larger than x number of bytes, stop it from uploading
       console.log("too big");
       db.collection('materials').find().toArray(function(err, results) {
         if (err) console.log(err);
         res.render('quote.ejs', {
           materials: results,
           user: req.user,
           error: "FILE TOO LARGE. Contact RCBI for help if you need this file printed."
         });
       });
     } else if (path.extname(theFile.name).toLowerCase() != ".stl") {
       console.log("Not STL");
       db.collection('materials').find().toArray(function(err, results) {
         if (err) console.log(err);
         res.render('quote.ejs', {
           materials: results,
           user: req.user,
           error: "FILE INCORRECT FORMAT. '.STL' format only please"
         });
       });
     } else {

       if (req.user.local.role == "admin" || req.user.local.role == "engineer") {

         db.collection('users').findOne({
           "local.email": req.body.custEmail
         }, function(err, result) {
           console.log("Getting Email");
           if (result) {
             console.log(result);
             console.log("user found")
             db.collection('materials').find().toArray(function(err, results) {
               if (err) console.log(err);

               custID = result._id;
               custName = result.local.firstName + " " + result.local.lastName;
               custEmail = result.local.email;

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
                   clientName: custName,
                   email: custEmail,
                   clientID: custID,

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
                   fileVolumeCmCubed: volume,
                   engineerName: 'Unassigned',
                   engineerEmail: 'Unassigned',
                   datePosted: datePosted,
                   Density: density,
                   projectComments: req.body.projectComments,
                   archived: false,
                   completed: false,
                   finalCost: finalCost
                 }, (err, result) => {
                   if (err) return console.log(err);
                   console.log('saved to database');
                   console.log("brackets in place");
                   res.redirect('/projects');

                 });



               });


               //#################### end admin project creation


             });


           } else {
             console.log("user not found")
             db.collection('materials').find().toArray(function(err, results) {
               if (err) console.log(err);
               res.render('quote.ejs', {
                 materials: results,
                 user: req.user,
                 error: "User Not Found. Please check that entered cutomer email exists"
               });
             });


           }
         });


       } else {


         //Sending stuff to admins/getEngineers
         db.collection('users').find({
           "local.role": "engineer"
         }).toArray(function(err, results) {
           for (var i = 0; i < results.length; i++) {
             sendAdmin(results[i].local.email, email)
           }
         });
         //Sending stuff to admins/getEngineers
         db.collection('users').find({
           "local.role": "admin"
         }).toArray(function(err, results) {
           for (var i = 0; i < results.length; i++) {
             sendAdmin(results[i].local.email, email)
           }
         });





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
             fileVolumeCmCubed: volume,
             email: email,
             engineerName: 'Unassigned',
             engineerEmail: 'Unassigned',
             datePosted: datePosted,
             Density: density,
             projectComments: req.body.projectComments,
             archived: false,
             completed: false,
             finalCost: finalCost
           }, (err, result) => {
             if (err) return console.log(err);


           });

           console.log('saved to database');
           res.redirect('/projects');

         });
       }
     }
   }
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

 router.get('/download/(:fileNewName)', isLoggedIn, function(req, res) {

   console.log("made it to download");

   var file = __dirname + '/../uploads/' + req.params.fileNewName;

   console.log(file);
   res.download(file, req.params.fileNewName); // Set disposition and send it.

 });

 router.get("/banned", function(req, res) {
   console.log("a banned user");
   res.render("banned.ejs", {
     user: req.user
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
 router.get('/verify', function(req, res) {
   res.render('verify.ejs', {
     user: req.user
   });
   sendEmail(req.user._id, req.user.local.email);
 });

 router.post('/login', passport.authenticate('local-login', {
   successRedirect: '/landing',
   failureRedirect: '/login',
   failureFlash: true,
 }));





 function isLoggedIn(req, res, next) {

   if (!(req.user.local.emailValidated)) {
     res.redirect('/verify');
   } else if (req.user.local.banned) {
     res.redirect('/banned');
   } else if (req.isAuthenticated()) {
     return next();
   } else {
     res.redirect('/');
   }


 }

 function isRole(req, res, next) {
   if (req.isAuthenticated() && req.user.local.role == 'admin')
     return next();
   res.redirect('/profile');
 }

 function isVerified(req, res, next) {
   if (req.isAuthenticated())
     return next();
   res.redirect('/verify');

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
     },    tls: {
        rejectUnauthorized: false
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
     },    tls: {
        rejectUnauthorized: false
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

 function sendAdmin(email, projectID, projName, custEmail) {
   var transporter = nodemailer.createTransport({
     service: 'gmail',
     auth: {
       user: 'rcbi3dprinting@gmail.com',
       pass: 'RCBI2018'
     },    tls: {
        rejectUnauthorized: false
    }
   });

   var mailOptions = {
     from: 'RCBI3DPRINTING@noresponse.COM',
     to: email,
     subject: 'Sending Email using Node.js',
     html: '<p>There has been a new project submitted. Please login <a href="localhost:1000/login">here</a> to login and see it. </p>'
   };

   transporter.sendMail(mailOptions, function(error, info) {
     if (error) {
       console.log(error);
     } else {
       console.log('Email sent: ' + info.response);
     }
   });
 }


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
 });

 router.post('/login', passport.authenticate('local-login', {
   successRedirect: '/landing',
   failureRedirect: '/login',
   failureFlash: true,
 }));



 module.exports = router;
