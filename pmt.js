/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const env = process.env.NODE_ENV || "development";
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
const moment = require('moment-timezone');
const Config = require('./models/Config');
const constants = require('./config/constants.json');
const User = require('./models/User');

const upload = multer({dest: path.join(__dirname, 'uploads')});


/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
if (env == 'development') {
  dotenv.load({path: '.env'});
}

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const dashboardController = require('./controllers/DashboardController');
const userController = require('./controllers/UserController');
const apiController = require('./controllers/api');
const contactController = require('./controllers/ContactController');
const configController = require('./controllers/ConfigController');
const configBittrexController = require('./controllers/ConfigBittrexController');
const walletController = require('./controllers/WalletController');
const helper = require('./helpers/helper');
const seeder = require('./helpers/seeder');
//const bitttrexSignal = require('./helpers/bitttrexSignal');
//const binanceSignal = require('./helpers/binanceSignal');
const topVolumeBittrex = require('./helpers/TopVolumeBittrex');

const listCoinController = require('./controllers/ListCoinController');


/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * NavigationMiddleware
 */
const NavigationMiddleware = require('./helpers/NavigationMiddleware');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI, (error) => {
  if (error) {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
  }

  // Feed some data in DB
  seeder.createConfigs();
  seeder.createUsers();
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(expressValidator({
  customValidators: {
    rightWallet: function (value) {
      return value === 'withdrawn' || value == 'direct';
    },
    validAmount: function (amount, wallet, user) {
      if (parseFloat(amount - 0.005) < 0 || !user) {
        return false;
      }

      const walletAmount = user.wallet[wallet];
      if (walletAmount <= 0) {
        return false;
      }

      return amount <= walletAmount;
    },
    /*isUsernameAvailable: function (username) {
      return new Promise(function (resolve, reject) {
        User.findOne({'username': username}, function (err, results) {

          if (err) {
            return resolve(false);
          }
          reject(results);
        });
      });
    },*/
  },
}));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  if (req.path === '/api/upload') {
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.moment = moment;
  res.locals.DATE_FORMAT = constants.DATE_FORMAT;
  res.locals.DATE_FORMAT_ONLY = constants.DATE_FORMAT_ONLY;
  if (req.user) {
    res.locals.menus = helper.getMenuByUser(req.user);
  }
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' && !req.path.match(/^\/auth/) && !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
    req.path == '/account') {
    req.session.returnTo = req.path;
  }
  next();
});
app.use((req, res, next) => {
  req.session.touch();
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {maxAge: 31557600000}));

app.use((req, res, next) => {
  let allowLevel4Pages = ["/dashboard", "/logout", "/", "/account/createAccountOverflow"];
  if (req.user) {
    let level = req.user.profile.level;
    if (level == 4 && !req.user.refUser) {
      res.locals.needRefUser = true;
      if (allowLevel4Pages.indexOf(req.path) < 0) {
        res.redirect("/dashboard");
      } else {
        next();
      }
    } else {
      res.locals.needRefUser = false;
      next();
    }
  } else {
    next();
  }
});

/**
 * Primary app routes.
 */
//app.get('/', homeController.index);
app.get('/', userController.getLogin); //login
app.post('/', userController.postLogin);

app.get('/home', homeController.home);
app.get('/about', homeController.about);
app.get('/service', homeController.service);
app.get('/faqs', homeController.faqs);
app.get('/contactus', homeController.contactus);
app.get('/dashboard', passportConfig.isAuthenticated, NavigationMiddleware, dashboardController.index);

app.get('/login', userController.getLogin); //login
app.post('/login', userController.postLogin);

app.get('/logout', userController.logout); //logout

app.get('/forgot', userController.getForgot);// forget
app.post('/forgot', userController.postForgot);

app.post('/changePassword2', userController.postChangePassword2); // forget password 2

app.get('/reset/:token', userController.getReset); //reset
app.post('/reset/:token', userController.postReset);

app.get('/reset2/:token',  userController.getReset2); //reset pass 2
app.post('/reset2/:token', userController.postReset2);

app.get('/signup', userController.getSignup);//sign up
app.post('/signup', userController.postSignup);

app.get('/error', userController.getError);//sign up

app.get('/contact', passportConfig.isAuthenticated, NavigationMiddleware, contactController.getContact); //get contact
app.post('/contact', passportConfig.isAuthenticated, contactController.postContact);

app.get('/account', passportConfig.isAuthenticated, NavigationMiddleware, userController.getAccount);

app.get('/account/active', passportConfig.isAuthenticated, NavigationMiddleware, userController.getActive); //active
app.post('/account/active', passportConfig.isAuthenticated, userController.postActive);

app.get('/admin/config', passportConfig.isAuthenticated, NavigationMiddleware, configController.index);
app.post('/admin/config', passportConfig.isAuthenticated, configController.postConfig);



app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile); //profile
app.get('/account/mylink', passportConfig.isAuthenticated, NavigationMiddleware, userController.getMyLink); //link ref
app.get('/account/listuserfloor', passportConfig.isAuthenticated, NavigationMiddleware, userController.getlistuserfloor); //link list user of floor

app.get('/account/wallet', passportConfig.isAuthenticated, NavigationMiddleware, walletController.getWallet); // wallet
app.post('/account/requestWithdrawn', passportConfig.isAuthenticated, walletController.postRequestWithdrawn);
app.post('/account/transferBtc', passportConfig.isAuthenticated, walletController.postTransferBtc);

app.get('/account/reqWithdrawnList', passportConfig.isAuthenticated, NavigationMiddleware, userController.getReqWithdrawnList);



app.get('/account/withdrawn/checkDone', passportConfig.isAuthenticated, userController.withdrawnCheckDone);
app.post('/admin/search_req', userController.postSearch_req);

app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword); //update pass

app.post('/account/changeBlockChain', passportConfig.isAuthenticated, userController.postChangeBlockChain);
app.post('/account/createAccountOverflow', userController.postCreateAccountOverflow); // create new user for LV4, LV5

app.post('/account/changePassWord', passportConfig.isAuthenticated, userController.postChangePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, NavigationMiddleware, userController.getOauthUnlink);

app.get('/confirmEmail', userController.getConfirmEmail);//confirm Email
app.get('/signupDone', userController.getSignupDone);//confirm Email
app.get('/verify_email', userController.getVerifyEmail);

//=========================New App =======================

app.get('/listCoin', passportConfig.isAuthenticated, NavigationMiddleware, listCoinController.getReqWithdrawnList);
app.get('/admin/configbittrex', passportConfig.isAuthenticated, NavigationMiddleware, configBittrexController.index);
app.post('/admin/configBittrex', configBittrexController.postConfigBittrex);
app.get('/removeCheck', passportConfig.isAuthenticated, listCoinController.removeCheck);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/upload', apiController.getFileUpload);
app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
app.get('/api/google-maps', apiController.getGoogleMaps);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email', 'user_location']}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/login'}), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', {scope: 'profile email'}));
app.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/login'}), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  /**
   * Bittrex
   */
  // bitttrexSignal.getListCoinBittrex();
  // bitttrexSignal.funcCheckCoinEMA();
  //
  // let countrun = 0;
  // let minutes = 10, the_interval = minutes * 60 * 1000;
  // setInterval(function () {
  //   bitttrexSignal.funcCheckCoinEMA();
  //   countrun = countrun + 1;
  //   console.log("==========Chạy được   " + countrun + "   lần=============")
  // }, the_interval);

  /**
   * Binance
   */
  topVolumeBittrex.startFindBittex();
  topVolumeBittrex.funcCheckListTopCoin();

  let countrun = 0;
  let minutes = 0.05, the_interval = minutes * 60 * 1000;
  console.log("==========Bat dau check=============")
  setInterval(function () {
    //topVolumeBittrex.startFindBittex();
    topVolumeBittrex.funcCheckListTopCoin();
    countrun = countrun + 1;
    //console.log("==========Chạy được   " + countrun + "   lần=============")
  }, the_interval);
});

module.exports = app;
