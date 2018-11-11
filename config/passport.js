const express = require('express');
const _ = require('lodash');
const passport = require('passport');
const request = require('request');
const LocalStrategy = require('passport-local').Strategy;
const Config = require('../models/Config');
const constants = require('../config/constants.json');

const url = require('url');
const User = require('../models/User');
const helper = require('../helpers/helper');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
  User.findOne({ username: username.toLowerCase() }, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, { msg: `Username ${username} not found.` });
    }
    user.comparePassword(password, (err, isMatch) => {
      if (err) {
        return done(err);
      }
      if (isMatch) {
        return done(null, user);
      }
      return done(null, false, { msg: 'Invalid username or password.' });
    });
  });
}));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  let urlObj = url.parse(req.originalUrl);
  urlObj.path = req.path;
  let reqUrl = url.format(urlObj);

  let reqPath = reqUrl;
  if (reqPath == "/account/changeBlockChain" || reqPath == "/account/changePassWord" || reqPath == "/account/profile"
    || reqPath == "/account/active" || reqPath == "/account/requestWithdrawn" || reqPath == "/account/transferBtc"
    || reqPath == "/account/listuserfloor" || reqPath.startsWith("/verify_email") || reqPath.startsWith("/listCoin" )
    || reqPath.startsWith("/account/withdrawn/checkDone") || reqPath.startsWith("/removeCheck") || reqPath.startsWith("/checkSideway")) {
    return next();
  } else if (req.isAuthenticated() && helper.hasPermission(req.user, reqPath)) {
    return next();
  }
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, { kind: provider })) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};
