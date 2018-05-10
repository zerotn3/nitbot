/**
 * Created by tin.luong on 12/10/2016.
 */
const _ = require('lodash');
const User = require('../models/User');
const userHelper = require('../helpers/helper').user;
const constants = require('../config/constants.json');

exports.index = (req, res) => {
  // status 0 is full, status 1 is not full
  let floors = [
    {id: 1, members: 0, status: 0},
    {id: 2, members: 0, status: 0},
    {id: 3, members: 0, status: 0},
    {id: 4, members: 0, status: 0},
    {id: 5, members: 0, status: 0},
    {id: 6, members: 0, status: 0},
  ];

  // req.user.wallet.upgrade = 0.2;
  // req.user.save();
  let lvup = req.user.profile.level;
  let amountupgradewallet = 0;
  if(lvup == 1) {
    amountupgradewallet = req.user.wallet.keepUpgrade.UPGRD_LVL_2;
  }else if(lvup == 2){
    amountupgradewallet = req.user.wallet.keepUpgrade.UPGRD_LVL_3;
  }else if(lvup == 3){
    amountupgradewallet = req.user.wallet.keepUpgrade.UPGRD_LVL_4;
  }else if(lvup == 4){
    amountupgradewallet = req.user.wallet.keepUpgrade.UPGRD_LVL_5;
  }
  let wallet = [
    {
      name: "Withdrawn Wallet",
      amount: req.user.wallet.withdrawn || 0,
      ext: {
        icon: "md-balance-wallet",
        link: "/account/wallet",
        text: "View history"
      }
    },
    {
      name: "Direct Wallet",
      amount: req.user.wallet.direct || 0,
      ext: {
        icon: "md-balance-wallet",
        link: "/account/wallet",
        text: "View history"
      }
    },
    {
      name: "Upgrade Wallet",
      amount: req.user.wallet.upgrade || 0,
      ext: {
        icon: "md-balance-wallet",
        link: "/account/wallet",
        text: "View history"
      }
    },
    {
      name: "Overflow Wallet",
      amount: req.user.wallet.overflow || 0,
      ext: {
        icon: "md-balance-wallet",
        link: "/account/wallet",
        text: "View history"
      }
    },
  ];

  userHelper.fetchTreeData(req.user)
    .then((users) => {
      let userLen = users.length - 1;
      let floorIdx = 0;
      let idx = 1;

      while (userLen > 0) {
        let newLen = userLen - 2 * idx;
        floors[floorIdx++].members = newLen > 0 ? 2 * idx : userLen;
        idx *= 2;
        userLen = newLen;
      }

      res.render('dashboard', {
        title: 'Dashboard',
        floors: floors,
        treeData: users,
        wallets: wallet,
      });
    });
};
