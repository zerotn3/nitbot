/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <luc@ltv.vn> on Jan 26, 2017
 */

const _ = require('lodash');
const User = require('../models/User');
const Config = require('../models/Config');
const constants = require('../config/constants.json');

const _createUsers = () => {
  User.count().exec((err, count) => {
    if (count > 0) {
      return;
    }
    let admUsr = constants.ADMIN_USER;
    admUsr.id_blc = process.env.ADMIN_WALLET_ID;
    const admin = new User(constants.ADMIN_USER);

    User.create([admin], (error) => {
      if (!error) {
        console.log('First Users were created successfully!');
      } else {
        console.log(`Could not create first users: ${error.message}`);
      }
    });
  });
};

const _createConfigs = () => {
  Config.count().exec((err, count) => {
    if (count > 0)
      return;
    let configs = [
      {
        name: constants.UPGRADE_LEVEL.LVL_1,
        value: 0.3,
      },
      {
        name: constants.UPGRADE_LEVEL.LVL_2,
        value: 0.2,
      },
      {
        name: constants.UPGRADE_LEVEL.LVL_3,
        value: 0.4,
      },
      {
        name: constants.UPGRADE_LEVEL.LVL_4,
        value: 1.6,
      },
      {
        name: constants.UPGRADE_LEVEL.LVL_5,
        value: 6.4,
      },
      {
        name: constants.COUNT_ENDING,
        value: '2017/12/31 00:00:00',
      },
    ];

    let promises = [];

    _.forEach(configs, (c) => {
      promises.push(Config.create(c));
    });

    Promise.all(promises)
      .then(() => {
        console.log('Configs were created!!');
      })
      .catch((err) => {
        console.log(`Could not create configs (${err.message})`);
      });
  });
};

module.exports = {
  createConfigs: _createConfigs,
  createUsers: _createUsers,
};