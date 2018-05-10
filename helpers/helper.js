/**
 * Created by luc on 12/13/16.
 */

const User = require('../models/User');
const Config = require('../models/Config');
const WalletTransaction = require('../models/WalletTransaction');
const ListCoinBittrex = require('../models/ListCoinBittrex');
const RateInfoBnb = require('../models/RateInfoBnb');
const RequestBtc = require('../models/RequestBtc');
const TransferBtc = require('../models/TransferBtc');
const constants = require('../config/constants.json');
const UPGRADE_LEVEL = constants.UPGRADE_LEVEL;
const Role = constants.ROLE;
const MenuList = constants.MENUS;
const nodeMailer = require('nodemailer');

const binance = require('node-binance-api');
const listcoinBNB = require('../listcoinbinance');
const BB = require('technicalindicators').BollingerBands;
const RSI = require('technicalindicators').RSI;
const R = require('ramda');
const _ = require('lodash');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

binance.options({
  APIKEY: '<key>',
  APISECRET: '<secret>',
  useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
  test: true // If you want to use sandbox mode where orders are simulated
});

// const token = '472833515:AAGXIRPigpyRKgO1NfLCPXBJ3R-5twUKBNw';
// //
// //
// const bot = new TelegramBot(token, {polling: true})


const mailer = nodeMailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: process.env.SENDGRID_USER,
    pass: process.env.SENDGRID_PASSWORD
  }
});
const schedule = require('node-schedule');
const url = require('url');
const request = require('request-promise');
const crypto = require('crypto');
const moment = require('moment');

const walkUsers = (user, list) => {
  return User.find({_id: user._id})
    .deepPopulate('users')
    .then((userData) => {
      let usrLst = userData[0].users;
      list = list || [];
      let promises = [];
      usrLst.forEach((usr) => {
        if (usr.users.length > 0) {
          promises.push(walkUsers(usr, list));
        }
        if ((usr.virSponsor || '').toString() == user.id && usr.active) {
          list.push(usr);
        }
      });

      return Promise.all(promises).then(function () {
        return list;
      });
    });
};

const fetchAllUsers = (user) => {
  return new Promise((resolve) => {
    let list = [];
    walkUsers(user, list).then(() => {
      resolve(list);
    });
  });
};

const walkUsersByVirtualSponsor = (user, list) => {
  list = list || [];
  if (user.active) {
    let parent;
    for (let i = 0; i < list.length; i++) {
      if ((user.virSponsor || '').toString() == list[i].HTMLid) {
        parent = list[i];
      }
    }
    list.push(user.toTreeItem(parent));
  }
  return User.find({virSponsor: user._id})
    .then((usrLst) => {
      let promises = [];
      usrLst.forEach((usr) => {
        promises.push(walkUsersByVirtualSponsor(usr, list));
      });

      return Promise.all(promises).then(function () {
        return list;
      });
    });
};

const fetchAllUsers1 = (user) => {
  return new Promise((resolve) => {
    let list = [];
    walkUsersByVirtualSponsor(user, list).then(() => {
      resolve(list);
    });
  });
};

const findVirtualSponsor = (user) => {
  return User.find({_id: user._id})
    .deepPopulate('users')
    .then((userData) => {
      let usrLst = userData[0].users;
      usrLst = _.filter(usrLst, u => (u.virSponsor || '').toString() == userData[0]._id.toString() && u.active);

      if (!usrLst || usrLst.length < 2) {
        return user;
      } else {
        usrLst = _.filter(usrLst, u => (u.virSponsor || '').toString() == userData[0]._id.toString());
        let promises = [];
        usrLst.forEach((usr) => {
          if (usr.users.length < 2) {
            return usr;
          }
        });

        usrLst.forEach((usr) => {
          promises.push(findVirtualSponsor(usr));
        });

        return Promise.all(promises).then((data) => {
          return data[0];
        });
      }
    });
};

const findVirtualSponsor1 = (user, queue) => {
  queue = queue || [];
  return User.find({_id: user._id})
    .deepPopulate('users')
    .then((userData) => {
      let usrLst = userData[0].users;
      let uId = userData[0]._id.toString();
      usrLst = _.filter(usrLst, u => (u.virSponsor || '').toString() == uId && u.active);

      if (!usrLst || usrLst.length < 2) {
        return user;
      } else {
        usrLst.forEach((usr) => {
          queue.push(usr);
        });
        let firstUsr = queue.shift();
        return Promise.all([findVirtualSponsor1(firstUsr, queue)])
          .then((data) => {
            return data[0];
          });
      }
    });
};

const countDownLine = (user) => {
  return new Promise((resolve) => {
    fetchAllUsers1(user).then((users) => {
      resolve(users ? users.length - 1 : 0);
    }).catch(() => {
      resolve(0);
    });
  });
};

const getMenuByUser = (user) => {
  let menus = [];
  MenuList.forEach((menu) => {
    if (menu.roles.indexOf(parseInt(user.usr_role)) >= 0) {
      menus.push(menu);
    }
  });
  return menus;
};

const hasPermission = (user, path) => {
  for (let i = 0; i < MenuList.length; i++) {
    let menu = MenuList[i];
    if (menu.roles.indexOf(parseInt(user.usr_role)) >= 0 && menu.link == path) {
      return true;
    }
  }
  return false;
};

const sendBTCToUpLine = (sponsor, amount, uplineAmount) => {
  if (amount <= 0 || !sponsor) {
    return;
  }
  User.findOne({_id: sponsor.virSponsor || sponsor.sponsor}, (err, sponsor) => {
    if (!err && sponsor) {
      sponsor.wallet.overflow = parseFloat((sponsor.wallet.overflow + uplineAmount).toFixed(8));
      sponsor.save((err) => {
        if (!err) {
          sendBTCToUpLine(sponsor, amount - uplineAmount, uplineAmount);
        }
      });
    }
  });
};

const howMuchForNextLevel = (user, callback) => {
  let upLvls = _.values(constants.UPGRADE_LEVEL);
  let usrLvl = user.profile.level;
  Config.findOne({name: upLvls[usrLvl]}, (error, config) => {
    callback(error, {
      level: upLvls.indexOf(config.name) + 1,
      amount: config ? parseFloat(config.value) : 0,
    });
  });
};

const sendSponsorBTC = (user, sponsor, amount) => {
  if (!sponsor)
    return;
  let sponsorLevel = sponsor.profile.level;
  let upLvls = _.values(constants.UPGRADE_LEVEL);
  Config.findOne({value: amount}, (error, config) => {
    let level = upLvls.indexOf(config.name) + 1;

    if (level == sponsorLevel) {
      sponsor.wallet.upgrade = parseFloat((sponsor.wallet.upgrade + amount).toFixed(8));
    } else if (level < sponsorLevel) {
      sponsor.wallet.withdrawn = parseFloat((sponsor.wallet.withdrawn + amount).toFixed(8));
    } else {
      const curAmount = sponsor.wallet.keepUpgrade[config.name];
      sponsor.wallet.keepUpgrade[config.name] = parseFloat((curAmount + amount).toFixed(8));
    }

    sponsor.save((err) => {
      if (!err) {
        console.log("sendSponsorBTC: ", user);
        if (user) {
          user.wallet.lastReceiver = sponsor._id.toString();
          user.save();
        }
      } else {
        console.log("sendSponsorUpgradeBTC: (Could not send) -> ", err);
      }
    });
  });
};

const sendSponsorUpgradeBTC = (user, amount) => {
  let lastReceiver = user.wallet.lastReceiver;
  if (lastReceiver) {
    User.findOne({_id: lastReceiver})
      .populate('virSponsor')
      .exec((err, uS) => {
        if (!err) {
          sendSponsorBTC(user, uS.virSponsor, amount);
        } else {
          console.log("sendSponsorUpgradeBTC: (Could not send) -> ", err);
        }
      });
  } else {
    User.findOne({_id: user.sponsor})
      .deepPopulate('virSponsor')
      .then((sponsor) => {
        sendSponsorBTC(user, sponsor, amount);
      })
      .catch((err) => {
        console.log("sendSponsorUpgradeBTC: (Could not send) -> ", err);
      });
  }
};

/**
 * Send email with options
 * @param opts (opts: from(Optional), to, subject, content)
 */
const sendEmail = (opts) => {
  return new Promise((resolve, reject) => {
    const mailOpts = {
      to: opts.to,
      from: opts.from || process.env.EMAIL_FROM,
      subject: opts.subject,
    };

    if (opts.content) {
      mailOpts.text = opts.content;
    } else if (opts.html) {
      mailOpts.html = opts.html;
    }

    mailer.sendMail(mailOpts, (err, res) => {
      if (!err) {
        resolve(res);
      } else {
        reject(err);
      }
    });
  });
};

const transferBTCFromOverflowToWithdrawn = () => {
  return new Promise((resolve) => {
    User.find({})
      .then((users) => {
        users.forEach((u) => {
          u.wallet.withdrawn = parseFloat((u.wallet.withdrawn + u.wallet.overflow).toFixed(8));
          u.wallet.overflow = 0;
          u.save((err) => {
            if (err) {
              console.log('Error: ', err, ", User: ", u);
              //TODO: Should email to admin about this problem.
            }
          });
        });

        resolve("Transferred BTC from Overflow Wallet to Withdrawn");
      });
  });
};

const startCountDownSchedule = (date) => {
  let countDownJob = schedule.scheduledJobs[constants.COUNT_DOWN_SCHEDULE];
  if (countDownJob) {
    countDownJob.cancel();
    console.log("Previous job was canceled!");
  }
  let j = schedule.scheduleJob(constants.COUNT_DOWN_SCHEDULE, date, () => {
    console.log('Start transfer BTC from Overflow Wallet to Withdrawn Wallet');
    transferBTCFromOverflowToWithdrawn()
      .then((msg) => {
        console.log(msg);
        //TODO: Should email to admin (Can be sending to users)
      });
  });
  console.log(`Scheduled Transfer BTC (From Overflow Wallet to Withdrawn Wallet) Job, the job with start on: ${moment(date).format(constants.DATE_FORMAT)}`);
};

const notifyTransaction = (user, transaction) => {
  sendEmail({
    from: process.env.EMAIL_ALERT,
    to: user.email,
    subject: `Account balance was changed (${user.username})`,
    html: `<p><img src="https://bitrain.info/assets/images/logo-blue.png" alt="Bitrain.info" width="228" height="84" /></p><br />
            <p>Your account was changed &nbsp;${transaction.amount} BTC at ${transaction.createdAt}.<br />
            <strong>Current Balance:</strong> ${user.wallet[transaction.wallet]}<br />
            <strong>Description:</strong> ${transaction.wallet}<br />
            <strong>Account:</strong> ${user.username}</p>
            <p class="gmail_msg">Best Regards,</p><br />
            <p class="gmail_msg">The Bitrain Team</p><br />
            <p class="gmail_msg"><strong class="gmail_msg">Do not reply</strong> to this email. If you have any questions, please contact with <strong><a href="https://bitrain.info/contactus">Bitrain Support Team</a></strong></p>`,
  })
    .then((res, opts) => {
      console.log("notifyTransaction: ", res, opts);
    })
    .catch((error) => {
      console.log(error);
    });
};

const sendVerifyEmail = (user, verifyLink) => {
  return sendEmail({
    to: user.email,
    subject: '[BitRain] Verify Email',
    html: `<p><img src="https://bitrain.info/assets/images/logo-blue.png" alt="Bitrain.info" width="228" height="84" /></p><br />
           <p>WELCOME TO BITRAIN.INFO</p><br />
           <p>Please verify your email by click the link below</p><br />
           <a href="${verifyLink}">${verifyLink}</a><br />
            User Id: ${user.username}<br />
            <p class="gmail_msg">Best Regards,</p><br />
            <p class="gmail_msg">The Bitrain Team</p><br />
            <p class="gmail_msg"><strong class="gmail_msg">Do not reply</strong> to this email. If you have any questions, please contact with <strong><a href="https://bitrain.info/contactus">Bitrain Support Team</a></strong></p>`,
  });
};

/**
 * Calculate data for navigation
 * CountDown
 * DownLine
 * F1
 */
const calcDataForNav = (user) => {
  const findCountEnding = new Promise((resolve, reject) => {
    Config.findOne({name: constants.COUNT_ENDING})
      .then((data) => {
        resolve(data.value);
      })
      .catch((error) => {
        reject(error);
      });
  });

  const countDownLine = new Promise((resolve) => {
    fetchAllUsers1(user).then((users) => {
      resolve(users ? users.length - 1 : 0);
    }).catch(() => {
      resolve(0);
    });
  });

  const countF1 = new Promise((resolve) => {
    return User.findOne({_id: user.id})
      .populate('users')
      .then((userData) => {
        const usrLst = _.filter(userData.users, (u) => {
          return u.sponsor.toString() == user._id.toString();
        });
        resolve(usrLst ? usrLst.length : 0);
      })
      .catch(() => {
        resolve(0);
      });
  });

  return Promise.all([findCountEnding, countDownLine, countF1]).then((data) => {
    return {
      countEnding: data[0],
      downLine: data[1],
      countF1: data[2],
    }
  });
};

const activeUser = (user, hashCode) => {
  return new Promise((resolve, reject) => {
    User.findOne({_id: user.sponsor}, (err, s) => {
      if (err) {
        reject(err);
        return;
      }

      Promise.all([Config.findOne({name: UPGRADE_LEVEL.LVL_1}), findVirtualSponsor1(s, [])])
        .then((data) => {
          let config = data[0];
          let vSponsor = data[1];
          const rate = 3.0;
          const upgradeValue = parseFloat(config.value); // Should be 0.3
          const oneOfThree = parseFloat((upgradeValue / rate).toFixed(8)); // Should be 0.1

          const upLineAmount = parseFloat((oneOfThree / 5).toFixed(8));
          const amount = oneOfThree;

          const sponsor = user.sponsor;

          let lastReceiver = user.sponsor.toString();
          if (!user.virSponsor) {
            //lastReceiver = user.virSponsor.toString();
            lastReceiver = vSponsor.id;
          }

          User.update({_id: user.id}, {
            $set: {
              active: true,
              'profile.level': 1,
              'wallet.lastReceiver': lastReceiver,
              'usr_role': Role.ACTIVE,
              'hash_cd': hashCode,
              'virSponsor': vSponsor,
            }
          }, (err) => {
            if (err) {
              console.log(`Could not active user ${user.full_nm}, ${err.message}`);
              reject(err);
            } else {
              User.findOne({_id: user.id}, (err, _resUsr) => {
                if (!err) {
                  global.userMap[_resUsr._id.toString()] = _resUsr;
                }
              });
            }
          });

          let p1 = new Promise((resolve, reject) => {
            User.findOne({_id: sponsor}, (err, sponsor) => {
              if (!err) {
                let x = sponsor.wallet.direct + oneOfThree;
                sponsor.wallet.direct = parseFloat(x.toFixed(8));
                sponsor.save((err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(sponsor);
                  }
                });
              } else {
                reject(err);
              }
            });
          });

          let p2 = new Promise((resolve, reject) => {
            let x = vSponsor.wallet.upgrade + oneOfThree;
            vSponsor.wallet.upgrade = parseFloat(x.toFixed(8));
            vSponsor.wallet.overflow = parseFloat((vSponsor.wallet.overflow + upLineAmount).toFixed(8));
            if (vSponsor._id.toString() != user.sponsor.toString()) {
              vSponsor.users.push(user);
            }
            vSponsor.save((err) => {
              if (err) {
                reject(err);
              } else {
                resolve(vSponsor);
              }
            });
            const h = require('../helpers/helper');
            h.sendBTCToUpLine(vSponsor, amount - upLineAmount, upLineAmount);
          });

          Promise.all([p1, p2])
            .then(() => {
              resolve(true);
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
};

const upgradeLevel = (user, callback) => {
  console.log("upgradeLevel: ", user.full_nm, ", wallet.upgrade: ", user.wallet.upgrade);
  // This area for level handling
  howMuchForNextLevel(user, (error, config) => {
    let valueForNextLvl = config.amount;
    let remainUpgrade = 0;

    if (user.wallet.upgrade >= valueForNextLvl) {
      remainUpgrade = parseFloat((user.wallet.upgrade - valueForNextLvl).toFixed(8));
      User.update({_id: user.id}, {
        $set: {
          'profile.level': user.profile.level + 1,
          'wallet.withdrawn': parseFloat((user.wallet.withdrawn + remainUpgrade).toFixed(8)),
        }
      }, (err) => {
        if (err) {
          console.log("Could not upgrade Level");
          callback(err);
        } else {
          console.log(`${user.full_nm} has upgraded level ${user.profile.level}`);
          callback(null, true);
        }
      });
      if (user.sponsor) {
        sendSponsorUpgradeBTC(user, valueForNextLvl);
      }
    } else {
      callback({error: {message: `Upgrade wallet balance (${user.wallet.upgrade}) is not enough for upgrading level (${valueForNextLvl})`}});
    }
  });
};

const verifyHashCode = (user, hashCode) => {
  return new Promise((resolve, reject) => {
    User.findOne({hash_cd: hashCode}, (err, existingUser) => {
      if (err) {
        reject({
          code: 'VHC001',
          error: err,
        });
      } else {
        if (existingUser) {
          reject({
            code: 'VHC002',
            error: {
              message: 'A transaction already exists.'
            }
          });
        } else {
          checkBlockchainTransaction(user, hashCode)
            .then((hashCode) => {
              resolve(hashCode);
            })
            .catch((err) => {
              reject(err);
            });
        }
      }
    });
  });
};

const checkBlockchainTransaction = (user, hashCode) => {
  let p1 = request({
    url: `https://api.blockcypher.com/v1/btc/main/txs/${hashCode}`, //02368297da079f288369f0cc5ac9fe3dee88f2e803cfb3dfed4ec7c9ff0a0083
    json: true
  });

  let p2 = Config.findOne({name: UPGRADE_LEVEL.LVL_1});

  return new Promise((resolve, reject) => {
    Promise.all([p1, p2])
      .then((data) => {
        const resJson = data[0];
        const valueForUpgradeLv1 = data[1].value;
        let countId = 0;
        resJson.outputs.forEach(function (entry) {
          //check id blockchain wallet of admin
          if (entry.addresses == process.env.ADMIN_WALLET_ID) {
            countId = countId + 1;
            if (entry.value < valueForUpgradeLv1) {
              reject({
                code: 'VHC003',
                error: {
                  message: 'Please deposit exactly : 0.03 BTC',
                },
              });
              return false;
            }
          }
        });

        if (countId == 0) {
          reject({
            code: 'VHC004',
            error: {
              message: 'Hash code wrong. Please check transaction again.',
            },
          });
          return false;
        }

        // let countIdin = 0;
        // resJson.inputs.forEach(function (entry) {
        //   if (entry.addresses == user.id_blc) {
        //     countIdin = countIdin + 1;
        //   }
        // });
        //
        // if (countIdin == 0) {
        //   reject({
        //     code: 'VHC005',
        //     error: {
        //       message: 'Hash code wrong. Please check your ID Blockchain again.',
        //     },
        //   });
        //   return false;
        // }

        resolve(hashCode);
      })
      .catch((err) => {
        reject({
          code: 'VHC006',
          error: err,
        })
      });
  });
};

const addTransaction = (user, wallet) => {
  let prevVal = user.wallet._preUpgrade || 0;
  let amount = parseFloat((user.wallet.upgrade - prevVal).toFixed(8));

  switch (wallet) {
    case 'upgrade':
      prevVal = user.wallet._preUpgrade || 0;
      amount = parseFloat((user.wallet.upgrade - prevVal).toFixed(8));
      break;
    case 'withdrawn':
      prevVal = user.wallet._preWithdrawn || 0;
      amount = parseFloat((user.wallet.withdrawn - prevVal).toFixed(8));
      break;
    case 'direct':
      prevVal = user.wallet._preDirect || 0;
      amount = parseFloat((user.wallet.direct - prevVal).toFixed(8));
      break;
    case 'overflow':
      prevVal = user.wallet._preOverflow || 0;
      amount = parseFloat((user.wallet.overflow - prevVal).toFixed(8));
      break;
  }

  if (amount != 0) {
    WalletTransaction.create({
      user: user,
      wallet: wallet,
      amount: amount,
    }, (err, wt) => {
      if (!err) {
        user.transactions.push(wt);
        user.save();
        notifyTransaction(user, wt);
      }
    });
  }
};

/**
 * Create transaction when the wallet is changing
 *
 * @param user
 * @param wallet
 * @param amount
 */
const createTrans = (user, wallet, amount) => {
  if (amount != 0) {
    WalletTransaction.create({
      user: user,
      wallet: wallet,
      amount: amount,
    }, (err, wt) => {
      if (!err) {
        user.transferBtc.push(wt);
        user.save();
        notifyTransaction(user, wt);
      }
    });
  }
};

const generateHashId = (length) => {
  return crypto.randomBytes(length ? length : 20).toString('hex');
};

const createRequestBtc = (user, reqBtc) => {
  return new Promise((resolve, reject) => {
    RequestBtc.create({
      user: user,
      btc_req: reqBtc.btc_req,
      status_req: reqBtc.status_req,
      walletid: reqBtc.walletid,
      walletname: reqBtc.walletname,
    }, (err, rbtc) => {
      if (!err) {
        resolve(rbtc);
      } else {
        reject(err);
      }
    });
  });
};
const createTransferBtc = (user, transBtc) => {
  return new Promise((resolve, reject) => {
    TransferBtc.create({
      user: user,
      username_rec: transBtc.username_rec,
      amounTransder: transBtc.amounTransder,
      status_trans: transBtc.status_trans,
    }, (err, rbtc) => {
      if (!err) {
        resolve(rbtc);
      } else {
        reject(err);
      }
    });
  });
};

const notifySentBtcCompleted = (reqBtc) => {
  User.findOne({_id: reqBtc.user}, (err, user) => {
    if (!err) {
      sendEmail({
        from: process.env.EMAIL_ALERT,
        to: user.email,
        subject: `Payout Successful!`,
        html: ` <p><img src="https://bitrain.info/assets/images/logo-blue.png" alt="Bitrain.info" width="228" height="84" /></p><br />
                <p>BitRain's Administrator was sent &nbsp;<b>${reqBtc.btc_req}</b> BTC to your <b>${reqBtc.walletname}</b> wallet at <i>${reqBtc.updatedAt}</i>.<br /></p>
                <p class="gmail_msg">Best Regards,</p><br />
                <p class="gmail_msg">The Bitrain Team</p><br />
                <p class="gmail_msg"><strong class="gmail_msg">Do not reply</strong> to this email. If you have any questions, please contact with <strong><a href="https://bitrain.info/contactus">Bitrain Support Team</a></strong></p>`,
      })
        .then((res, opts) => {
          console.log("notifySentBtcCompleted: ", res, opts);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });
};

const notifyBannedAccount = (emails) => {
  if (!emails) {
    return;
  }

  let promises = [];

  _.forEach((email) => {
    promises.push(sendEmail({
      from: process.env.EMAIL_ALERT,
      to: email,
      subject: `Account was banned!`,
      html: `<p>BitRain's System was banned your account with email&nbsp;<b>${email}</b> automatically, because our system detects that you tried to do some tricks.<br /> If there is any problem, please use contact form to contact us and don't try to reply this email.</p>`,
    }));
  });

  return Promise.all(promises);
};

const fetchAllActiveUsersAsMap = () => {
  return new Promise((resolve, reject) => {
    let hashMap = {};
    User.find({active: true})
      .then((users) => {
        _.forEach(users, (user) => {
          hashMap[user._id.toString()] = user;
        });

        resolve(hashMap);
      })
      .catch((err) => {
        reject(err);
      });
  });
};


const startCheckListCoin = () => {
  listcoinBNB.listCBNB = _.filter(
    listcoinBNB.listCBNB, u => u.toString().indexOf('ETH') > -1
  );
  for (let XXX in listcoinBNB.listCBNB) {
    let scoin = listcoinBNB.listCBNB[XXX];
    startSocket(scoin);
  }
};

function closeSocket(scoin) {
  binance.websockets.terminate(`${scoin}@kline_15m`);
}

function startSocket(scoin) {
  setTimeout(function () {
    binance.websockets.chart(scoin, "15m", (symbol, interval, chart) => {
      let keys = Object.keys(chart);

      /**
       * check nen xanh do
       */
      let love3st = R.takeLast(4, keys);
      let redblueArr = [];
      love3st.forEach(function (entry) {
        redblueArr.push(chart[entry]);
      });

      /**
       * Check RSI
       */
      let love50st = R.takeLast(50, keys);
      let RsiArr = [];
      love50st.forEach(function (entry) {
        RsiArr.push(chart[entry]);
      });
      let listRSI = _.map(RsiArr, 'close');
      /**
       * Cal BB26
       */
      let lastCandle = R.takeLast(50, keys);
      let closePrice = [];
      lastCandle.forEach(function (entry) {
        closePrice.push(Number(chart[entry].close));
      });

      Promise.all([checkCandle(redblueArr), checkRSI(listRSI), getBB(6, 2, closePrice)]).then((values) => {
        /**
         * Lay data neu thoa man candle & RSI
         */
        if (values[0] && (values[1] < 70)) {
          //last time
          let tick = binance.last(chart);
          const last = chart[tick].close;
          const volume = chart[tick].volume;
          if (volume > 10) {
            if (values[2] === last) {
              console.log(`Giá của ${scoin} tại thời điểm ${tick} là : ${last}`);
              //buymarket(scoin, last);
              console.log(values[2] + last);
              const listcoin = new ListCoinBittrex({
                marketNn: scoin,
                enterPrice: last,
                lastTime: tick
              });

              listcoin.save(function (error) {
                if (error) {
                  console.error(error);
                }
              });
              // bot.sendMessage('218238495', `Market Name: ${scoin}
              //                     Giá tại BB26 = Last: ${bb26}`);
              // bot.sendMessage('-277262874', `Market Name: ${scoin}
              //                         Giá vào lệnh: ${bb26}`);
              console.log(values[2] + last);
            }
          }
        } else {
          console.log(`${scoin} có 3 nên liên tiếp không đủ điều kiện !`);
          //bot.sendMessage('218238495', `${scoin} 3 nến liên tiếp không đủ điều kiện.`);
          closeSocket(scoin);
        }
      }, function () {
        console.log('stuff failed')
      });


    });
  }, 500);
}


async function getBB(period, stdDev, values) {
  let rs;
  let input = {
    period: period,
    values: values,
    stdDev: stdDev

  }
  rs = R.last(BB.calculate(input));
  return parseFloat(rs.lower).toFixed(8);
}


async function checkRSI(value) {
  const inputRSI = {
    values: value,
    period: 14
  };

  return _.last(RSI.calculate(inputRSI));
}

async function checkCandle(arr) {
  if ((arr[0].close < arr[0].open) && (arr[1].close < arr[1].open)) {
    return false;
  }
  if ((arr[1].close < arr[1].open) && (arr[2].close < arr[2].open)) {
    return false;
  }
  if ((arr[0].close < arr[0].open) && (arr[1].close < arr[1].open) && (arr[2].close < arr[2].open)) {
    return false;
  }
  return true;
}

async function updatePriceFinished() {
  ListCoinBittrex.find({}, (err, listCoin) => {
    if (err) {
      reject(err);
    } else {
      let listP1 = [];
      let promises = [];
      if (listCoin) {
        listCoin.forEach(function (scoin) {

          let coinNm = scoin._doc.marketNn;
          let timeenterPrice = scoin._doc.lastTime;
          let enterPrice = scoin._doc.enterPrice;
          getPerWL(coinNm, timeenterPrice, enterPrice).then((val) => {
            ListCoinBittrex.update({lastTime: timeenterPrice}, {
              $set: {
                matchPrice: val
              }
            }, (err) => {
              if (err) {
                console.log(`Upload Fail`);
                reject(err);
              } else {
                console.log(`${scoin} Upload Done`);
              }
            });
          });
        });
      }
    }
  });
}

async function getPerWL(coinNm, timeenterPrice, enterPrice) {
  let winLosePrice = 0;
  return new Promise((resolve, reject) => {
    binance.candlesticks(coinNm, "15m", (error, ticks, symbol) => {
      if (error) {
        reject(error);
      }
      //console.log("candlesticks()", ticks);
      ticks.forEach(item => {
        if (enterPrice <= Number(item[4])) {
          winLosePrice = Number(item[4]);
          return;
        }
      });

      let last_tick = ticks[ticks.length - 1];
      let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
      if (winLosePrice === 0) {
        winLosePrice = close;
      }
      let wlPr = ((Number(winLosePrice) - enterPrice) / enterPrice * 100).toFixed(2);
      resolve(wlPr);
    }, {startTime: timeenterPrice, endTime: timeenterPrice + 4500000});
  })
}

function checkStepSize() {
  deleteAllRateInfoBnb();
  binance.exchangeInfo(function (error, data) {
    for (let obj of data.symbols) {
      let filters = {status: obj.status};
      for (let filter of obj.filters) {
        if (filter.filterType == "LOT_SIZE") {
          filters.stepSize = filter.stepSize;
          filters.minQty = filter.minQty;
          filters.maxQty = filter.maxQty;
          const infoRate = new RateInfoBnb({
            marketNn: obj.symbol,
            status: obj.status,
            stepSize: filter.stepSize,
            minQty: filter.minQty,
            maxQty: filter.maxQty,
          });

          infoRate.save(function (error) {
            if (error) {
              console.error(error);
            }
          });

        }
      }
    }
    console.log(`save done`)
  });
}

function deleteAllRateInfoBnb() {
  RateInfoBnb.remove({}, function (err) {
      if (err) {
        console.log(err)
      } else {
        console.log(`deleted All record`)
      }
    }
  );
}


const getStepSize = (scoin) => {
  return new Promise((resolve, reject) => {
    RateInfoBnb.findOne({
      marketNn: scoin
    }, (err, val) => {
      if (!err) {
        resolve(val);
      } else {
        reject(err);
      }
    });
  });
};

const buymarket = (coinNm, price) => {
  let numberEth = 0.01;
  let amount = numberEth / price;
  getStepSize(coinNm)
    .then((val) => {
      let stepS = val.stepSize;
      let minQty = val.minQty;
      let quantity = binance.roundStep(amount, stepS);
      if (quantity < minQty) {
        return;
        console.log(`số lượng ${coinNm} không đủ minQty ${minQty} < qTy ${quantity}`);
      }
      console.log(coinNm + '   ' + quantity);
      binance.buy(coinNm, quantity, price, {type: 'LIMIT'}, (error, response) => {
        if (!response) {
          console.log("Limit Buy response fail");
        }
        console.log("Đã mua với order id: " + response.orderId);
      });
    });
}

const sellmarket = (coinNm, amount, price) => {
  binance.sell(coinNm, amount, price, {type: 'LIMIT'}, (error, response) => {
    console.log("Limit Buy response", response);
    console.log("order id: " + response.orderId);
  });
}

function cancelBuy(coinNm) {
  binance.cancelOrders(coinNm, (error, response, symbol) => {
    console.log(symbol+" cancel response:", response);
  });
}


const helpers = {
  user: {
    fetchAllUsers: fetchAllUsers,
    countDownLine: countDownLine,
    findVirtualSponsor: findVirtualSponsor,
    fetchTreeData: fetchAllUsers1,
    howMuchForNextLevel: howMuchForNextLevel,
    sendSponsorUpgradeBTC: sendSponsorUpgradeBTC,
    findVirtualSponsor1: findVirtualSponsor1,
    upgradeLevel: upgradeLevel,
    activeUser: activeUser,
    verifyHashCode: verifyHashCode,
    addTransaction: addTransaction,
    createTransaction: createTrans,
    createRequestBtc: createRequestBtc,
    createTransferBtc: createTransferBtc,
    fetchAllActiveUsersAsMap: fetchAllActiveUsersAsMap,
  },
  generateHashId: generateHashId,
  getMenuByUser: getMenuByUser,
  hasPermission: hasPermission,
  sendBTCToUpLine: sendBTCToUpLine,
  calcDataForNav: calcDataForNav,
  email: {
    send: sendEmail,
    notifyTransaction: notifyTransaction,
    sendVerifyEmail: sendVerifyEmail,
    notifySentBtcCompleted: notifySentBtcCompleted,
    notifyBannedAccount: notifyBannedAccount,
  },
  startCountDownSchedule: startCountDownSchedule,
  checkStepSize: checkStepSize,
  startCheckListCoin: startCheckListCoin,
  updatePriceFinished: updatePriceFinished,
  transferBTCFromOverflowToWithdrawn: transferBTCFromOverflowToWithdrawn,
};

module.exports = helpers;
