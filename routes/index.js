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
 var fs = require('fs');
 var writeCSV = require('write-csv')
 const Json2csvParser = require('json2csv').Parser;



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

router.get('/addUser', function(req, res) {

  res.render('addUser.ejs', {
    message: req.flash('signupMessage'),
    user: req.user
  });
});

router.post('/addUser', isLoggedIn, function(req, res, err) {

  if (err)
    console.log(err)

  User.findOne({
    'local.email': req.body.email
  }, function(err, user) {
    if (err)
      return done(err);
    if (user) {
      return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
    } else {


      var newUser = new User();
      newUser.local.email = req.body.email;
      newUser.local.password = newUser.generateHash(req.body.password);
      newUser.local.firstName = req.body.firstName;
      newUser.local.lastName = req.body.lastName;
      newUser.local.role = req.body.role;
      newUser.local.street = req.body.street;
      newUser.local.city = req.body.city;
      newUser.local.state = req.body.state;
      newUser.local.zip = req.body.zip;
      newUser.local.phone = req.body.phone;
      newUser.local.contract = false;
      newUser.local.emailValidated = true;
      newUser.local.banned = false;
      newUser.save(function(err) {
        if (err)
          throw err;
        res.redirect('/adminUserList');
      });
    }
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
         projects: results.sort().sort()
       });
     });
   } else if(req.user.local.role == 'admin' || req.user.local.role == 'super'){
     db.collection('projects').find({
       'status': "Created",
       'archived': false
     }).toArray(function(err, results) {
       console.log(results);
       res.render('projects.ejs', {
         user: req.user,
         projects: results
       });
     });

   } else {
     var engineer;
      db.collection('users').find({'local.role': 'engineer'}).toArray(function(err, results){
        console.log(results);
        engineer = results;
      })
     db.collection('projects').find({
       'archived': false
     }).toArray(function(err, results) {
       console.log(req.user);
       res.render('projects.ejs', {
         user: req.user,
         projects: results,
         engineers: engineer,
       });
     });
   }
 });


 router.get('/archived', isLoggedIn, function(req, res) {
     db.collection('projects').find({
       'archived': true
     }).toArray(function(err, results) {
       console.log(results);
       res.render('archived.ejs', {
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

 router.get('/reports', isLoggedIn, function(req, res, next) {
     res.render('reports.ejs', {
       user: req.user,
     });
 });
 router.post('/reports', isLoggedIn, function(req, res, next) {
   let choice = req.body.choice;
   console.log(choice);
      var month = new Date().getMonth() + 1;
      var datePosted = month +  "-" + new Date().getDate() +  "-" +  new Date().getFullYear();
   if(choice == 'projects'){
     db.collection('projects').find().toArray(function(err, results) {
       const fields = ['_id', 'email', 'finalFinalCost', 'materialName', 'fileNewName', 'fileVolumeCmCubed', 'engineerEmail', 'datePosted', 'Density','status'];
       // writeCSV( './report/projects'+datePosted+'.csv',results);
       const json2csvParser = new Json2csvParser({ fields });
       const csv = json2csvParser.parse(results);
       var fileContent = csv;


      fs.writeFile('./report/'+datePosted+'projects.csv', fileContent, (err) => {
          if (err) {
              console.error(err);
              return;
          };
    console.log("File has been created");
    res.download('./report/'+datePosted+'projects.csv');
});
       console.log(csv);
       console.log(results);
   });

 }else if(choice == 'users'){
   db.collection('users').find().toArray(function(err, results) {
     const fields = ['_id', 'local.firstName', 'local.lastName', 'local.email', 'local.role', 'local.street', 'local.city', 'local.zip', 'local.phone','local.contract', 'local.emailValidated', 'local.banned'];
     const json2csvParser = new Json2csvParser({ fields });
     const csv = json2csvParser.parse(results);
     var fileContent = csv;


    fs.writeFile('./report/'+datePosted+'users.csv', fileContent, (err) => {
        if (err) {
            console.error(err);
            return;
        };

  console.log("File has been created");
res.download('./report/'+datePosted+'users.csv');
});
     console.log(csv);
     console.log(results);

});

}else{
  db.collection('materials').find().toArray(function(err, results) {
    const fields = ['_id', 'name', 'actualCost', 'salePrice', 'description' ];
    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(results);
    var fileContent = csv;


   fs.writeFile('./report/'+datePosted+'materials.csv', fileContent, (err) => {
       if (err) {
           console.error(err);
           return;
       };

 console.log("File has been created");
res.download('./report/'+datePosted+'materials.csv');
});
    console.log(csv);
    console.log(results);

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
       'engineerEmail': req.user.local.email
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

   console.log(req.body.projFinalFinalCost);

   var archived = false;
   var completed = false;
   console.log("test");


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
             "finalFinalCost": req.body.projFinalFinalCost,
             "Density": req.body.projDensity,
             "projectComments": req.body.projComments,

             "status": req.body.projStatus,

             "archived": archived
           }
         });

         res.redirect('/projects');
       }
     }
   });
 });
router.post('/editUpdated/(:id)', function(req, res, next) {
  var o_id = new ObjectId(req.params.id).toString();

  db.collection('projects').updateOne({
    "_id": project._id
  }, {
    $set: {
      "dateFinished": req.body.dateFinished
    }
  });
  res.redirect('/projects');
});

 router.get('/editUpdated/(:id)', isLoggedIn, function(req, res, next) {
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

             res.render('editUpdated.ejs', {
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

 router.get("/quickUpdate/(:id)" , isLoggedIn, function(req, res, next) {

   var o_id = new ObjectId(req.params.id).toString();

   var project;

   db.collection('projects').find({
     "_id": ObjectId(o_id).toString
   }).toArray(function(err, results) {

     for (var i = 0; i < results.length; i++) {

       if (results[i]._id == o_id) {

         project = results[i];

       }
     }

     if (req.user.local.role == "engineer") {

       if (project.status == "Created") {

         db.collection('projects').updateOne({
           "_id": project._id
         }, {
           $set: {
             "status": "Assigned",
             "engineerName": req.user.local.firstName + req.user.local.lastName,
             "engineerEmail": req.user.local.email,
             "engineerID": req.user.local._id
           }
         });

         res.redirect('/projects');


       } else if (project.status == "Accepted") {
              console.log("Made it to accepted")
         db.collection('projects').updateOne({
           "_id": project._id
         }, {
           $set: {
             "status": "Printed",
             "archived": true
           }
         });

         res.redirect('/projects');

       } else {
         console.log("An unexpected status was encountered")
         res.redirect("/landing")
       }

     } else if (req.user.local.role == "user") {

       if (project.status == "Created" || project.status == "Assigned") {

         db.collection('projects').updateOne({
           "_id": project._id
         }, {
           $set: {
             "status": "Canceled",
             "archived":true
           }
         });

         res.redirect('/projects');

       } else {
       console.log("Too far, user not found");
       res.redirect("/landing");

     }

     }
   });



 });



 router.post('/quickUpdate/(:id)', isLoggedIn, function(req, res, next) {
   var o_id = new ObjectId(req.params.id).toString();

   var project;

   db.collection('projects').find({
     "_id": ObjectId(o_id).toString
   }).toArray(function(err, results) {

     for (var i = 0; i < results.length; i++) {

       if (results[i]._id == o_id) {

         project = results[i];

       }
     }

     if (req.user.local.role == "admin" || req.user.local.role == "super") {

       engineerInfo = JSON.parse(req.body.projEngineer);

       db.collection('projects').updateOne({
         "_id": project._id
       }, {
         $set: {
           "status": "Assigned",
           "engineerName": engineerInfo.name,
           "engineerEmail": engineerInfo.email,
           "engineerID": engineerInfo.id
         }
       });

       res.redirect('/projects');

     } else if (req.user.local.role == "engineer") {

       if (project.status == "Created") {

         db.collection('projects').updateOne({
           "_id": project._id
         }, {
           $set: {
             "status": "Assigned",
             "engineerName": req.user.local.firstName + req.user.local.lastName,
             "engineerEmail": req.user.local.email,
             "engineerID": req.user.local._id
           }
         });

         res.redirect('/projects');


       } else if (project.status == "Assigned") {

         console.log("Made it to Assigned sub loop")
         console.log(req.body.finalPrice)

         db.collection('projects').updateOne({
           "_id": project._id
         }, {
           $set: {
             "status": "Finalized",
             "finalFinalCost": req.body.finalPrice,
             "finalCompletionDate": req.body.finalCompletionDate
           }
         });
         sendFinalEmail(project.custEmail);
         res.redirect('/projects');

       } else if (project.status == "Accepted") {
              console.log("Made it to accepted")
         db.collection('projects').updateOne({
           "_id": project._id
         }, {
           $set: {
             "status": "Printed",
             "archived": true
           }
         });

         res.redirect('/projects');

       } else {
         console.log("An unexpected status was encountered")
         res.redirect("/landing")
       }

     } else if (req.user.local.role == "user") {

       if (project.status == "Created" || project.status == "Assigned") {

         db.collection('projects').updateOne({
           "_id": project._id
         }, {
           $set: {
             "status": "Canceled",
             "archived":true
           }
         });

         res.redirect('/projects');

       } else if (project.status == "Finalized") {

         var accept = "Canceled";
         var archive = true;
         if (req.body.accepted == "true"){
           accept = "Accepted";
           archive = false;
}
         db.collection('projects').updateOne({
           "_id": project._id
         }, {
           $set: {
             "status": accept,
             "archived": archive
           }
         });

         res.redirect('/projects');

       }



     } else {
       console.log("Too far, user not found");
       res.redirect("/landing");

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
     var month = new Date().getMonth() + 1;
     var datePosted = month +  "/" + new Date().getDate() +  "/" +  new Date().getFullYear();

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
                   status: "Created",
                   archived: false,
                   completed: false,
                   finalCost: finalCost,
                   requestedCompletionDate: req.body.requestedCompletionDate
                 }, (err, result) => {
                   if (err) return console.log(err);
                   console.log('saved to database');
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
             status: "Created",
             projectComments: req.body.projectComments,
             archived: false,
             completed: false,
             finalCost: finalCost,
             requestedCompletionDate: req.body.requestedCompletionDate
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


 router.get('/addUser', function(req, res) {

   res.render('addUser.ejs', {
     message: req.flash('signupMessage'),
     user: req.user
   });
 });

 router.post('/addUser', isLoggedIn, function(req, res, err) {

   if (err)
     console.log(err)

   User.findOne({
     'local.email': req.body.email
   }, function(err, user) {
     if (err)
       return done(err);
     if (user) {
       return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
     } else {


       var newUser = new User();
       newUser.local.email = req.body.email;
       newUser.local.password = newUser.generateHash(req.body.password);
       newUser.local.firstName = req.body.firstName;
       newUser.local.lastName = req.body.lastName;
       newUser.local.role = req.body.role;
       newUser.local.street = req.body.street;
       newUser.local.city = req.body.city;
       newUser.local.state = req.body.state;
       newUser.local.zip = req.body.zip;
       newUser.local.phone = req.body.phone;
       newUser.local.contract = false;
       newUser.local.emailValidated = true;
       newUser.local.banned = false;
       newUser.save(function(err) {
         if (err)
           throw err;
         res.redirect('/adminUserList');
       });
     }
   });



 });


 router.get('/verify', function(req, res) {
   res.render('verify.ejs', {
     user: req.user
   });
   sendEmail(req.user._id, req.user.local.email);
 });

 router.post('/login', passport.authenticate('local-login', {
   successRedirect: '/projects',
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
     },
     tls: {
       rejectUnauthorized: false
     }
   });

   var mailOptions = {
     from: 'RCBI3DPRINTING@noresponse.COM',
     to: userEmail,
     subject: 'RCBI - Verify your email',
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

 function sendFinalEmail(custEmail) {
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
     to: custEmail,
     subject: 'RCBI - Confirm your final pricing',
     html: '<p>Go <a href="http://localhost:3000/login">here</a> to login to accept or deny the final pricing</p>'
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
     },
     tls: {
       rejectUnauthorized: false
     }
   });

   var mailOptions = {
     from: 'RCBI3DPRINTING@noresponse.COM',
     to: userEmail,
     subject: 'RCBI - Reset your password',
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
     },
     tls: {
       rejectUnauthorized: false
     }
   });

   var mailOptions = {
     from: 'RCBI3DPRINTING@noresponse.COM',
     to: email,
     subject: 'RCBI - New project has been posted',
     html: '<p>There has been a new project submitted. Please login <a href="http://localhost:1000/login">here</a> to login and see it. </p>'
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
   successRedirect: '/projects',
   failureRedirect: '/login',
   failureFlash: true,
 }));



 module.exports = router;
