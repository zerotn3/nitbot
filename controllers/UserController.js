const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const url = require('url');
const redirect_after_login = "/dashboard";
const userHelper = require('../helpers/helper').user;
const Config = require('../models/Config');
const constants = require('../config/constants.json');
const UL = constants.UPGRADE_LEVEL;
const moment = require("moment");
const request = require('request-promise');
const UPGRADE_LEVEL = constants.UPGRADE_LEVEL;
const helper = require('../helpers/helper');
const _ = require('lodash');
const WalletTransaction = require('../models/WalletTransaction');
const RequestBtc = require('../models/RequestBtc');

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/listCoin');
  }
  res.render('account/login', {
    title: 'Login',
    pageType: 'login',
    dataSiteKey: process.env.GG_CAPCHA_DATA_SITE_KEY
  });
};
/**
 * GET /active user
 * Active user.
 */
exports.getActive = (req, res) => {
  if (req.user.active == true) {
    req.flash('errors', {msg: 'Failed to activate - account already active'});
    return res.redirect('/dashboard');
  }
  res.render('account/active', {
    title: 'Active User',
    pageType: 'ribbon',
    adminWalletId: process.env.ADMIN_WALLET_ID,
  });
};

/**
 * POST /account/postAdminConfig
 * Set config by Admin.
 */
exports.postActive = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  const user = req.user;
  userHelper.verifyHashCode(user, req.body.hash_cd)
    .then((hashCode) => {
      user.activeUser(hashCode)
        .then(() => {
          req.flash('success', {msg: 'Active Successful.'});
          res.redirect('/dashboard');
        })
        .catch((err) => {
          req.flash('errors', {msg: `Could not active user ${err.message}`});
          res.redirect('/account/active');
        });
    })
    .catch((err) => {
      req.flash('errors', {msg: `Could not active user (${err.code}): ${err.error.message}`});
      res.redirect('/account/active');
    });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.assert('username', 'Username is not valid').notEmpty();
  req.assert('password', 'Password cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }
  //check captcha
  // if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
  //   req.flash('errors', {msg: 'Please select captcha.'});
  //   return res.redirect('/login');
  // } else {
    let secretKey = process.env.GG_CAPCHA_SECRET;

    let verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;

    //request(verificationUrl, function (error, response, body) {
    //  body = JSON.parse(body);
      // Success will be true or false depending upon captcha validation.
      // if (body.success !== undefined && !body.success) {
      //   req.flash('errors', {msg: 'Failed captcha verification. Please contact Admin.'});
      //   return res.redirect('/login');
      // }
      passport.authenticate('local', (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (user.emailVerified == false) {
          req.flash('errors', "please check your email and click the link to confirm your account.");
          return res.redirect('/login');
        }
        if (!user) {
          req.flash('errors', info);
          return res.redirect('/login');
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }

          req.flash('success', {msg: 'Success! You are logged in.'});

          let returnTo = req.session.returnTo;
          let isActive = user.active;

          let redirectSs = req.session.returnTo || "/listCoin";
          returnTo = returnTo == "" || returnTo == "/" ? redirect_after_login : redirectSs;
          if (returnTo == '/logout') {
            returnTo = '/dashboard';
          }
          if (!isActive)
            returnTo = "/listCoin";
          res.redirect(returnTo);
        });
      })(req, res, next);
    //});
  //}
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  res.redirect('/login');
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
  let query = require('url').parse(req.url, true).query;
  let idsponsor = query.sponsor;
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Create Account',
    pageType: 'register',
    idsponsor: idsponsor,
    dataSiteKey: process.env.GG_CAPCHA_DATA_SITE_KEY
  });
};
/**
 * GET /signup
 * Signup page.
 */
exports.getConfirmEmail = (req, res) => {
  res.render('account/confirmemail', {
    title: 'Create Account'
  });
};
/**
 * GET /signup
 * Signup page.
 */
exports.getSignupDone = (req, res) => {
  req.logout();
  res.render('account/signupdone', {
    title: 'Register Succesful'
  });
};
/**
 *
 * @param req
 * @param res
 */
exports.getError = (req, res) => {
  res.render('account/error', {
    title: 'Bitrain - Error'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  req.assert('username', 'Username is not valid').notEmpty();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.assert('password2', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword2', '2nd Passwords do not match').equals(req.body.password2);
  // req.sanitize('email').normalizeEmail({remove_dots: false});

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }
  //check captcha
  if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    req.flash('errors', {msg: 'Please select captcha.'});
    return res.redirect('/signup');
  } else {
    let secretKey = process.env.GG_CAPCHA_SECRET;

    let verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;

    request(verificationUrl, function (error, response, body) {
      body = JSON.parse(body);
      // Success will be true or false depending upon captcha validation.
      if (body.success !== undefined && !body.success) {
        req.flash('errors', {msg: 'Failed captcha verification. Please contact Admin.'});
        return res.redirect('/signup');
      }
      const sponsorId = req.query.sponsor || 'dongtienthongminh4';

      const user = new User({
        email: req.body.email,
        username: req.body.username.toLowerCase(),
        full_nm: req.body.full_nm,
        phone_no: req.body.phone_no,
        id_blc: req.body.id_blc,
        id_idf: req.body.id_idf,
        location: req.body.location,
        password: req.body.password,
        password2: req.body.password2,
        usr_role: "3", //inactive
        active: false,
        country: {
          code: req.body.location_code,
          name: req.body.location
        }
      });

      User.findOne({username: req.body.username}, (err, existingUser) => {
        if (err) {
          return next(err);
        }
        if (existingUser) {
          req.flash('errors', {msg: 'Account with that username address already exists.'});
          return res.redirect('/signup');
        }

        User.findOne({username: sponsorId}, (err1, sponsor) => {
          if (err) {
            req.flash('errors', {msg: 'Sponsor ID is not exist'});
            return res.redirect('/signup');
          }
          if (sponsor) { // Found the sponsor
            sponsor.users.push(user); // add user to users
            sponsor.save();
            user.sponsor = sponsor;

            user.save((err) => {
              if (err) {
                return next(err);
              }
              req.logIn(user, (err) => {
                if (err) {
                  return next(err);
                }
                if (!user.active) {
                  let verify_link = url.format({
                    protocol: req.protocol,
                    host: req.get('host'),
                    pathname: "/verify_email",
                    query: {
                      uid: req.user._id.toString()
                    }
                  });
                  helper.email.sendVerifyEmail(req.user, verify_link)
                    .then(() => {
                      req.flash('success', {msg: 'Register Successful! \n\n please check your email and click the link to confirm your account.'});
                    }).catch((err) => {
                    console.log("Could not send verify email, ", err);
                  });
                  res.redirect('/signupdone');
                } else {
                  res.redirect(redirect_after_login);
                }
              })
            });
          } else {
            req.flash('errors', {msg: 'Sponsor ID is not exist'});
            return res.redirect('/signup');
          }
        });
      });
    });
  }
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  User.populate(req.user, {path: 'sponsor'}, (err, user) => {
    req.user = user;
    res.render('account/profile', {
      title: 'Account Management',
      pageType: 'profile'
    });
  });
};
/**
 * Get My Link Reference
 * @param req
 * @param res
 */
exports.getMyLink = (req, res) => {
  let usrId = req.user._id.toString();
  User.find({_id: req.user._id})
    .populate('sponsor')
    .populate('users')
    .exec((err, users) => {
      User.populate(users[0].users, {path: '_id'}, (err, usrLst) => {
        if (err)
          return next(err);

        usrLst = _.filter(usrLst, u => u.sponsor.toString() == usrId);

        let shareLink = url.format({
          protocol: req.protocol,
          host: req.get('host'),
          pathname: "/signup",
          query: {
            sponsor: req.user.username
          }
        });

        res.render('account/mylink', {
          title: 'My Link & F1 List',
          f1List: usrLst,
          myLink: shareLink
        });
      });
    });
};

/**
 * Get List User Floor 1,2,3,4,5
 * @param req
 * @param res
 */
exports.getlistuserfloor = (req, res) => {
  User.find({_id: req.user._id})
    .populate('sponsor')
    .populate('users')
    .exec((err, users) => {
      User.populate(users[0].users, {path: '_id'}, (err, usrLst) => {
        if (err)
          return next(err);

        let shareLink = url.format({
          protocol: req.protocol,
          host: req.get('host'),
          pathname: "/signup",
          query: {
            sponsor: req.user.id
          }
        });

        res.render('account/listuserfloor', {
          title: 'List user floor 1',
          f1List: usrLst,
          myLink: shareLink
        });
      });
    });
};
/**
 *
 * @param req
 * @param res
 */
exports.getReqWithdrawnList = (req, res) => {
  let p1 = new Promise((resolve, reject) => {
    User.find({}, (err, users) => {
      if (err) {
        reject(err);
      } else {
        resolve(users);
      }
    });
  });

  let p2 = new Promise((resolve, reject) => {
    RequestBtc.find({status_req: 'N'})
      .populate('user')
      .then((reqBTCs) => {
        resolve(reqBTCs);
      })
      .catch((err) => {
        reject(err);
      });
  });


  let p3 = new Promise((resolve, reject) => {
    RequestBtc.find({status_req: 'Y'})
      .populate('user')
      .then((reqBTCs) => {
        resolve(reqBTCs);
      })
      .catch((err) => {
        reject(err);
      });
  });

  Promise.all([p1, p2, p3])
    .then((data) => {
      res.render('account/reqWithdrawnList', {
        title: 'List Request Withdrawn',
        users: data[0],
        reqBTCsN: data[1],
        reqBTCsY: data[2]
      });
    })
    .catch((err) => {
      return next(err);
    });
};

exports.withdrawnCheckDone = (req, res) => {
  const reqCode = req.query.code;
  RequestBtc.update({_id: reqCode}, {
    $set: {
      status_req: 'Y'
    }
  }, (err, reqBtc) => {
    if (err) {
      req.flash('errors', err);
      return res.redirect('/account/reqWithdrawnList');
    } else {
      RequestBtc.findOne({_id: reqCode})
        .then((reqBtc) => {
          helper.email.notifySentBtcCompleted(reqBtc);
        });
      return res.redirect('/account/reqWithdrawnList');
    }
  });
};

/**
 *
 * @param req
 * @param res
 * @param next
 */
exports.postSearch_req = (req, res, next) => {
  req.flash('success', {msg: 'Profile information has been updated.'});
  res.redirect('/account');
}
/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
  //req.assert('username', 'Please enter a valid Username').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user.comparePassword2(req.body.password21, (err, isMatch) => {
      if (err) {
        return next(err);
      }
      if (isMatch) {
        /*user.username = req.body.username || '';
        user.profile.name = req.body.name || '';
        user.profile.gender = req.body.gender || '';
        user.profile.location = req.body.location || '';
        user.profile.website = req.body.website || '';

        user.profile.id_blc = req.body.id_blc || '';*/
        user.email = req.body.email || '';

        user.save((err) => {
          if (err) {
            if (err.code === 11000) {
              req.flash('errors', {msg: 'The email address you have entered is already associated with an account.'});
              return res.redirect('/account');
            }
            return next(err);
          }
          req.flash('success', {msg: 'Profile information has been updated.'});
          res.redirect('/account');
        });
      } else {
        req.flash('errors', {msg: 'Password 2 is incorrect'});
        res.redirect('/account');
      }
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user.password = req.body.password;
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.flash('success', {msg: 'Password has been changed.'});
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postChangePassword = (req, res, next) => {
  req.assert('new_pass', 'Password must be at least 4 characters long').len(4);
  req.assert('cf_new_pass', 'Passwords do not match').equals(req.body.new_pass);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user.comparePassword2(req.body.password22, (err, isMatch) => {
      if (err) {
        return next(err);
      }
      if (isMatch) {
        user.password = req.body.new_pass;
        user.save((err) => {
          if (err) {
            return next(err);
          }
          req.flash('success', {msg: 'Password has been changed.'});
          res.redirect('/account');
        });
      } else {
        req.flash('errors', {msg: 'Password 2 is incorrect'});
        res.redirect('/account');
      }
    });
  });
};

/**
 * POST /account/changeBlockChain
 * Update ID BlockChain.
 */
exports.postChangeBlockChain = (req, res, next) => {

  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }

    user.comparePassword2(req.body.password2, (err, isMatch) => {
      if (err) {
        return next(err);
      }
      if (isMatch) {
        user.id_blc = req.body.id_blc;
        user.save((err) => {
          if (err) {
            return next(err);
          }
          req.flash('success', {msg: 'Update Complete.'});
          res.redirect('/account');
        });
      } else {
        req.flash('errors', {msg: 'Password 2 is incorrect'});
        res.redirect('/account');
      }
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({_id: req.user.id}, (err) => {
    if (err) {
      return next(err);
    }
    req.logout();
    req.flash('info', {msg: 'Your account has been deleted.'});
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const provider = req.params.provider;
  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user[provider] = undefined;
    user.tokens = user.tokens.filter(token => token.kind !== provider);
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.flash('info', {msg: `${provider} account has been unlinked.`});
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({passwordResetToken: req.params.token})
    .where('passwordResetExpires').gt(Date.now())
    .exec((err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash('errors', {msg: 'Password reset token is invalid or has expired.'});
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};
/**
 * Get Reset Password 2
 * @param req
 * @param res
 * @param next
 */
exports.getReset2 = (req, res, next) => {
  // if (req.isAuthenticated()) {
  //   return res.redirect('/');
  // }
  User
    .findOne({passwordResetToken: req.params.token})
    .where('passwordResetExpires').gt(Date.now())
    .exec((err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash('errors', {msg: 'Password 2 reset token is invalid or has expired.'});
        return res.redirect('/account');
      }
      res.render('account/reset2', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function resetPassword(done) {
      User
        .findOne({passwordResetToken: req.params.token})
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
          if (err) {
            return next(err);
          }
          if (!user) {
            req.flash('errors', {msg: 'Password reset token is invalid or has expired.'});
            return res.redirect('back');
          }
          user.password = req.body.password;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          user.save((err) => {
            if (err) {
              return next(err);
            }
            req.logIn(user, (err) => {
              done(err, user);
            });
          });
        });
    },
    function sendResetPasswordEmail(user, done) {
      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      const mailOptions = {
        to: user.email,
        from: 'Support@bitrain.info',
        subject: 'Your account password 1 has been changed',
        html: `<p><img src="https://bitrain.info/assets/images/logo-blue.png" alt="Bitrain.info" width="228" height="84" /></p><br />
               Hello,\n\nThis is a confirmation that the password for your account ${user.username} has just been changed.\n
               <p class="gmail_msg">Best Regards,</p><br />
               <p class="gmail_msg">The Bitrain Team</p><br />
               <p class="gmail_msg"><strong class="gmail_msg">Do not reply</strong> to this email. If you have any questions, please contact with <strong><a href="https://bitrain.info/contactus">Bitrain Support Team</a></strong></p>`
      };
      transporter.sendMail(mailOptions, (err) => {
        req.flash('success', {msg: 'Success! Your password has been changed.'});
        done(err);
      });
    }
  ], (err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
};
/**
 * Get Reset 2
 * @param req
 * @param res
 * @param next
 */
exports.postReset2 = (req, res, next) => {
  req.assert('password2', 'Password 2 must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords 2 must match.').equals(req.body.password2);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function resetPassword(done) {
      User
        .findOne({passwordResetToken: req.params.token})
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
          if (err) {
            return next(err);
          }
          if (!user) {
            req.flash('errors', {msg: 'Password 2 reset token is invalid or has expired.'});
            return res.redirect('back');
          }
          user.password2 = req.body.password2;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          user.save((err) => {
            if (err) {
              return next(err);
            }
            req.logIn(user, (err) => {
              done(err, user);
            });
          });
        });
    },
    function sendResetPasswordEmail(user, done) {
      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      const mailOptions = {
        to: user.email,
        from: 'Support@bitrain.info',
        subject: 'Your account password 2 has been changed',
        html: `<p><img src="https://bitrain.info/assets/images/logo-blue.png" alt="Bitrain.info" width="228" height="84" /></p><br />
            Hello,\n\nThis is a confirmation that the password 2 for your account ${user.username} has just been changed.\n
            <p class="gmail_msg">Best Regards,</p><br />
            <p class="gmail_msg">The Bitrain Team</p><br />
            <p class="gmail_msg"><strong class="gmail_msg">Do not reply</strong> to this email. If you have any questions, please contact with <strong><a href="https://bitrain.info/contactus">Bitrain Support Team</a></strong></p>`
      };
      transporter.sendMail(mailOptions, (err) => {
        req.flash('success', {msg: 'Success! Your password 2 has been changed.'});
        done(err);
      });
    }
  ], (err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/account');
  });
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({remove_dots: false});
  req.assert('username', 'Username is not valid').notEmpty();

  let your_email = req.body.email;
  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function createRandomToken(done) {
      crypto.randomBytes(16, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    function setRandomToken(token, done) {
      User.findOne({username: req.body.username}, (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          req.flash('errors', {msg: 'Account with that email address does not exist.'});
          return res.redirect('/forgot');
        }
        if (user.email != your_email) {
          req.flash('errors', {msg: 'Account with that user name or email does not exist.'});
          return res.redirect('/forgot');
        }

        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        user.save((err) => {
          done(err, token, user);
        });
      });
    },
    function sendForgotPasswordEmail(token, user, done) {
      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      const mailOptions = {
        to: user.email,
        from: 'Support@Bitrain.info',
        subject: 'Reset your password [Bitrain.info]',
        html: `<p><img src="https://bitrain.info/assets/images/logo-blue.png" alt="Bitrain.info" width="228" height="84" /></p><br />
          You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Usern Name: ${user.username} \n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n
          <p class="gmail_msg">Best Regards,</p><br />
          <p class="gmail_msg">The Bitrain Team</p><br />
          <p class="gmail_msg"><strong class="gmail_msg">Do not reply</strong> to this email. If you have any questions, please contact with <strong><a href="https://bitrain.info/contactus">Bitrain Support Team</a></strong></p>`
      };
      transporter.sendMail(mailOptions, (err) => {
        req.flash('info', {msg: `An e-mail has been sent to ${user.email} with further instructions.`});
        done(err);
      });
    }
  ], (err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/forgot');
  });
};
/**
 * Change Password 2
 * @param req
 * @param res
 * @param next
 */
exports.postChangePassword2 = (req, res, next) => {

  async.waterfall([
    function createRandomToken(done) {
      crypto.randomBytes(16, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    function setRandomToken(token, done) {
      User.findOne({username: req.user.username}, (err, user) => {
        if (err) {
          return done(err);
        }

        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        user.save((err) => {
          done(err, token, user);
        });
      });
    },
    function sendForgotPasswordEmail(token, user, done) {
      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      const mailOptions = {
        to: user.email,
        from: 'Support@Bitrain.info',
        subject: 'Reset your password [Bitrain.info]',
        html: `<p><img src="https://bitrain.info/assets/images/logo-blue.png" alt="Bitrain.info" width="228" height="84" /></p><br />
          You are receiving this email because you (or someone else) have requested the reset of the password 2 for your account.\n\n
          Usern Name: ${user.username} \n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset2/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n
          <p class="gmail_msg">Best Regards,</p><br />
          <p class="gmail_msg">The Bitrain Team</p><br />
          <p class="gmail_msg"><strong class="gmail_msg">Do not reply</strong> to this email. If you have any questions, please contact with <strong><a href="https://bitrain.info/contactus">Bitrain Support Team</a></strong></p>`
      };
      transporter.sendMail(mailOptions, (err) => {
        req.flash('info', {msg: `An e-mail has been sent to ${user.email} with further instructions.`});
        done(err);
      });
    }
  ], (err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/account');
  });
};
/**
 * Create Account Overflow
 * @param req
 * @param res
 * @param next
 */
exports.postCreateAccountOverflow = (req, res, next) => {
  User.findOne({username: req.body.ovf_user_id}, (err, existingUserID) => {
    if (err) {
      return next(err);
    }
    if (existingUserID) {
      req.flash('errors', {msg: 'Account with that user ID already exists.'});
      return res.redirect('/dashboard');
    }
    User.findById(req.user.id, (err, user) => {
      if (err) {
        return next(err);
      }
      //check bitcoin enought for create new account
      let ambtc = req.body.wallet_addr;
      if (ambtc == "WD") {
        if (user.wallet.withdrawn < 0.3) {
          req.flash('errors', {msg: 'Not enough BTC Coins. Please continue build your team.'});
          return res.redirect('/dashboard');
        }
      } else if (ambtc == "DR") {
        if (user.wallet.direct < 0.3) {
          req.flash('errors', {msg: 'Not enough BTC Coins. Please continue build your team.'});
          return res.redirect('/dashboard');
        }
      }

      user.comparePassword2(req.body.password2, (err, isMatch) => {
        if (err) {
          return next(err);
        }
        if (isMatch) {
          //wallet = Direct wallet / Withdrawn Wallet - 0.3
          User.findById(req.user.id, (err, user) => {
            if (err) {
              return next(err);
            }
            if (req.body.wallet_addr == "WD") {
              user.wallet.withdrawn = parseFloat(user.wallet.withdrawn) - 0.3;
            } else {
              user.wallet.direct = parseFloat(user.wallet.direct) - 0.3;
            }
            user.save((err) => {
                if (err) {
                  req.flash('errors', {msg: 'Request Fail.'});
                  return res.redirect('/dashboard');
                }

                //create new refUser id
                const sponsorId = req.user.id;
                const refUser = new User({
                  email: req.user.email,
                  username: req.body.ovf_user_id,

                  usr_nm: req.user.usr_nm,
                  full_nm: req.user.full_nm,
                  phone_no: req.user.phone_no,
                  id_blc: req.user.id_blc,
                  id_idf: req.user.id_idf,
                  location: req.user.location,
                  password: req.body.password_new,
                  password2: req.body.password_new2,
                  usr_role: "1", //inactive
                  active: false,
                  country: {
                    code: req.user.country.code,
                    name: req.user.country.name
                  },
                  //refUser: user._id.toString(),
                });

                User.findOne({_id: sponsorId}, (err1, sponsor) => {
                  if (!err1) { // Found the sponsor
                    sponsor.users.push(refUser); // add refUser to users
                    sponsor.save();
                    refUser.sponsor = sponsor;

                    helper.user
                      .findVirtualSponsor1(sponsor)
                      .then((virSponsor) => {
                        refUser.virSponsor = virSponsor;
                        if (refUser.virSponsor != refUser.sponsor) {
                          virSponsor.users.push(refUser);
                          virSponsor.save();
                        }
                        // console.log(virSponsor);
                        refUser.save((err) => {
                          if (err) {
                            return next(err);
                          }
                          refUser.activeUser();
                          user.refUser = refUser._id.toString();
                          user.save();
                          req.flash('success', {msg: 'Create Successful. Please login and check new account'});
                          res.redirect('/dashboard');
                        });
                      })
                      .catch((err2) => {
                        return next(err2);
                      });
                  } else {
                    return res.redirect('/dashboard');
                  }
                });
              }
            );
          });
        } else {
          req.flash('errors', {msg: 'Password 2 is incorrect'});
          res.redirect('/dashboard');
        }
      });
    });
  });
};

exports.getVerifyEmail = (req, res) => {
  let userId = req.query.uid;
  const resObj = {
    title: 'Verify Email',
    verified: false,
    verifiedBefore: false,
    msg: '',
  };

  User.findOne({_id: userId})
    .then((user) => {
      if (user.emailVerified) {
        resObj.verifiedBefore = true;
        resObj.msg = 'The link you tried to access is not valid or expired.';
        res.render('verifyEmail', resObj);
      } else {
        resObj.verifiedBefore = false;
        resObj.verified = true;
        user.emailVerified = true;
        user.usr_role = 2;
        user.save((err) => {
          if (err) {
            resObj.msg = "Could not verify email at this time, please contact administrator for more information!";
          } else {
            resObj.msg = "Congratulation! Your email was verified successfully!";
          }
          res.render('verifyEmail', resObj);
        });
      }
    })
    .catch(() => {
      return res.redirect('/dashboard');
    });
};
