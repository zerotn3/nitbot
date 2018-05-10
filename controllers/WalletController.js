/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <luc@ltv.vn> on Jan 27, 2017
 */

const WalletTransaction = require('../models/WalletTransaction');
const RequestBtc = require('../models/RequestBtc');
const TransferBtc = require('../models/TransferBtc');
const uH = require('../helpers/helper').user;
const User = require('../models/User');
/**
 *
 * @param req
 * @param res
 */
exports.getWallet = (req, res) => {
  let p1 = new Promise((resolve, reject) => {
    WalletTransaction.find({user: req.user.id}, (err, wts) => {
      if (err) {
        reject(err);
      } else {
        resolve(wts);
      }
    });
  });

  let p2 = new Promise((resolve, reject) => {
    RequestBtc.find({user: req.user.id}, (err, reqBtcs) => {
      if (err) {
        reject(err);
      } else {
        resolve(reqBtcs);
      }
    });
  });

  let p3 = new Promise((resolve, reject) => {
    TransferBtc.find({user: req.user.id}, (err, transBtcs) => {
      if (err) {
        reject(err);
      } else {
        resolve(transBtcs);
      }
    });
  });

  Promise.all([p1, p2, p3])
    .then((data) => {
      res.render('account/wallet', {
        title: 'Wallet',
        walletTransactions: data[0],
        requestBtc: data[1],
        transferBtc: data[2]
      });
    })
    .catch((err) => {
      console.log('getWallet', err);
      res.render('account/wallet', {
        title: 'Wallet',
        walletTransactions: [],
        requestBtc: [],
        transferBtc: []
      });
    });
};

/**
 * Post Request Withdrawn
 */
exports.postRequestWithdrawn = (req, res, next) => {
  const user = req.user;
  const withdrawnFee = 0.005;
  req.check('wallet_addr', `The wallet should be 'withdrawn' or 'direct'`).rightWallet();
  req.check('btc_req', `The amount should be greater than 0 less than or equals '${req.body.wallet_addr}' amount (fee withdrawn: 0.005).`).validAmount(req.body.wallet_addr, user);
  req.check('password2', `Password should not empty`).notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account/wallet');
  }

  const withdrawnAmount = parseFloat(req.body.btc_req);
  const walletNm = req.body.wallet_addr;

  user.comparePassword2(req.body.password2, (err, isMatch) => {
    if (err) {
      return next(err);
    }

    if (isMatch) {
      const reqBtc = {
        btc_req: parseFloat((withdrawnAmount - withdrawnFee).toFixed(8)),
        status_req: 'N',
        walletid: user.id_blc,
        walletname: walletNm,
      };

      uH.createRequestBtc(user, reqBtc)
        .then(() => {
          user.wallet[walletNm] = parseFloat((user.wallet[walletNm] - withdrawnAmount).toFixed(8));
          user.save((err) => {
            if (err) {
              req.flash('errors', {msg: 'The system is not available now, please try again later.'});
              res.redirect('/account/wallet');
            } else {
              req.flash('success', {msg: 'Request Successful. BTC will be issued within 24h.'});
              res.redirect('/account/wallet');
            }
          });
        })
        .catch((err) => {
          req.flash('errors', {msg: `Request Fail: (${err.message}).`});
          res.redirect('/account/wallet');
        });
    } else {
      req.flash('errors', {msg: 'Password 2 does not match'});
      res.redirect('/account/wallet');
    }
  });
};
// /**
//  *
//  * @param req
//  * @param res
//  * @param next
//  */
// exports.postTransferBtc = (req, res, next) => {
//   const user = req.user;
//   req.check('amount_transfer', `The amount should be greater than 0 less than or equals ` + user.wallet.direct + ` amount.`).validAmount('direct', user);
//   req.check('password2', `Password should not empty`).notEmpty();
//
//   const errors = req.validationErrors();
//
//   if (errors) {
//     req.flash('errors', errors);
//     return res.redirect('/account/wallet');
//   }
//
//   User.findOne({ username: req.body.user_id_received }, (err, existingUser) => {
//     if (err) {
//       return next(err);
//     }
//     if (!existingUser) {
//       req.flash('errors', { msg: 'User ID received does not exist.' });
//       return res.redirect('/account/wallet');
//     }
//     user.comparePassword2(req.body.password2, (err, isMatch) => {
//       if (err) {
//         return next(err);
//       }
//       if (isMatch) {
//         user.wallet.direct = parseFloat((user.wallet.direct - req.body.amount_transfer).toFixed(8));
//         user.save((err) => {
//           if (err) {
//             return next(err);
//           }
//           User.findById(existingUser._id, (err, user2) => {
//             if (err) {
//               return next(err);
//             }
//             user2.wallet.direct = parseFloat(user2.wallet.direct) + parseFloat(req.body.amount_transfer);
//             user2.save((err) => {
//               if (err) {
//                 return next(err);
//               }
//               req.flash('success', { msg: 'Transfer Complete.' });
//               return res.redirect('/account/wallet');
//             });
//           });
//         });
//       } else {
//         req.flash('errors', { msg: 'Password 2 is incorrect' });
//         return res.redirect('/account/wallet');
//       }
//     });
//   });
// };
/**
 * Post Request Withdrawn
 */
exports.postTransferBtc = (req, res, next) => {
  const user = req.user;
  const userRec = req.body.user_id_received
  //req.check('user_id_received', `User ID received does not exist.`).isUsernameAvailable();
  req.check('amount_transfer', `The amount should be greater than 0 less than or equals` + user.wallet.direct + `amount.`).validAmount(`direct`, user);
  req.check('password2', `Password should not empty`).notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account/wallet');
  }

  const transferAmount = parseFloat(req.body.amount_transfer);
  //check User received
  User.findOne({username: userRec}, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (!existingUser || existingUser.active == false) {
      req.flash('errors', {msg: 'User ID received does not exist.'});
      return res.redirect('/account/wallet');
    }
    user.comparePassword2(req.body.password2, (err, isMatch) => {
      if (err) {
        return next(err);
      }

      if (isMatch) {
        const transBtc = {
          username_rec: req.body.user_id_received,
          amounTransder: parseFloat((transferAmount).toFixed(8)),
          status_trans: 'Y',
        };
        User.findOne({username: req.body.user_id_received}, (err, userReceived) => {
          if (err) {
            return next(err);
          }

          uH.createTransaction(userReceived, 'direct', parseFloat((transferAmount).toFixed(8)));
          uH.createTransferBtc(user, transBtc)
            .then(() => {
              user.wallet.direct = parseFloat((user.wallet.direct - transferAmount).toFixed(8));
              user.save((err) => {

                if (err) {
                  req.flash('errors', {msg: 'The system is not available now, please try again later.'});
                  res.redirect('/account/wallet');
                } else {
                  //save id received
                  userReceived.wallet.direct = parseFloat(userReceived.wallet.direct + transferAmount).toFixed(8);
                  userReceived.save((err) => {
                    if (err) {
                      return next(err);
                    } else {
                      req.flash('success', {msg: 'Request Successful.'});
                      res.redirect('/account/wallet');
                    }
                  });
                }
              });
            })
            .catch((err) => {
              req.flash('errors', {msg: `Request Fail: (${err.message}).`});
              res.redirect('/account/wallet');
            });
        });
      } else {
        req.flash('errors', {msg: 'Password 2 does not match'});
        res.redirect('/account/wallet');
      }
    });
  });
};