var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');

var bodyParser = require('body-parser');
var Session = require('./Routes/Session.js');
var Validator = require('./Routes/Validator.js');
var _Validator = require('./Routes/_Validator.js');
var cnnPool = require('./Routes/Connections.js');
var sequelize = require('./Routes/sequelize.js');
var doErrorResponse = require('./Routes/Validator.js').doErrorResponse;

var emails = require('./Notifications/streakWarning.js');
var flashes = require('./Notifications/flashChallenges.js');

var async = require('async');


var app = express();

// Static paths to be served like index.html and all client side js
app.use(express.static(path.join(__dirname, 'public')));

// consider all paths as lowercase yo
app.use(function(req, res, next) {
  req.url = req.url.toLowerCase();
  next();
});

// Parse all request bodies using JSON
app.use(bodyParser.json());

// Attach cookies to req as req.cookies.<cookieName>
app.use(cookieParser());

// Set up Session on req if available
app.use(Session.router);

app.use(function(req, res, next) {
   req.validator = new Validator(req, res);
   req._validator = new _Validator(req, res);

   if (req.path.startsWith("/peer")) {
      next();
      return;
   }

   if (req.session || (req.method === 'POST' &&
    (req.path === '/prss' || req.path === '/ssns' || req.path === '/prss/validateticket')))
      next();
   else
      res.status(401).json([{tag: Validator.Tags.noLogin}]);
});


// TODO: DELETE ME :3
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
   //  res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

function checkAdminMiddleware(req, res, next) {
   if (req.session.isAdmin()) {
      next();
   }
   else {
      res.status(401).json("Hey! You're not an admin!");
   }
}

app.use('/peer', require('./Routes/peer'));
app.use('/crss', require('./Routes/Course/courses'));
app.use('/prss', require('./Routes/Account/users'));
app.use('/ssns', require('./Routes/Account/sessions'));
app.use('/admin', checkAdminMiddleware, require('./Routes/Admin/admin'));

app.delete('/DB', function(req, res) {
   if (process.env.NODE_ENV === 'production') {
      console.warn("YOU FOOOOOOOL");
      return;
   }

   return req.validator.checkAdmin()
   .then(function() {
      return sequelize.do.sync({force: true});
   })
   .then(function() {
      return sequelize.Person.scope(null).findOrCreate({
         where: {email: 'Admin@11.com'},
         defaults: {name: 'AdminMan', password: process.env.ADMIN_PASSWORD, role: 2, checkedDisclaimer: 1}
      });
   })
   .then(function(admin) {
      return admin[0].update({
         activationToken: null
      });
   })
   .then(function() {
      res.sendStatus(200);
   })
   .catch(function(err) {
      res.status(500).json({error: "OH NO: " + JSON.stringify(err)}).end();
   });
});

app.post('/savesesh', function(req, res) {
   return req.validator.checkAdmin()
   .then(function() {
      var sesh = JSON.stringify(Session.sessions);
      return sequelize.SessionSaver.findOrCreate({where: {id: 1}})
      .then(function(savior) {
         return savior[0].update({session: sesh});
      });
   })
   .then(function(savior) {
      return res.json(savior.session);
   })
   .catch(doErrorResponse(res));
});

app.post('/restoresesh', function(req, res) {
   return req.validator.checkAdmin()
   .then(function() {
      return sequelize.SessionSaver.findById(1);
   })
   .then(function(savior) {
      Session.sessions = JSON.parse(savior.session);
   })
   .then(function() {
      res.json("Restored " + Object.keys(Session.sessions).length + " sessions. Yay!");
   })
   .catch(doErrorResponse(res));
});

// Error output
app.use(function(err, req, res, next) {
   console.error(err.stack);
   res.status(500).send('error', {error: err});
});

app.set('port', (process.env.PORT || 3000));

app.listen(process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000,
function () {
   console.log('Node app is running on port', app.get('port'));
});
