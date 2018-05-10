/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <luc@ltv.vn> on Jan 26, 2017
 */

const _ = require('lodash');
const Config = require('../models/Config');
const constants = require('../config/constants.json');
const UL = constants.UPGRADE_LEVEL;
const moment = require('moment-timezone');
const helper = require('../helpers/helper');

exports.index = (req, res) => {
  Config.find({
    name: {
      "$in": [UL.LVL_1, UL.LVL_2, UL.LVL_3, UL.LVL_4, UL.LVL_5, UL.LVL_6, constants.COUNT_ENDING]
    }
  })
    .then((response) => {
      let configs = response.reduce((obj, itm) => {
        obj[itm.name] = itm.value;
        return obj;
      }, {});

      let endDate = configs[constants.COUNT_ENDING];
      let time = moment(endDate, constants.DATE_FORMAT).format(constants.TIME_FORMAT);
      configs[constants.COUNT_ENDING] = moment(endDate, constants.DATE_FORMAT).format(constants.DATE_FORMAT_ONLY);


      res.render('admin/config', {
        title: 'Admin Config',
        pageType: '',
        configs: configs,
        UL: UL,
        COUNT_ENDING: constants.COUNT_ENDING,
        DATE_FORMAT_ONLY: constants.DATE_FORMAT_ONLY,
        TIME_FORMAT: constants.TIME_FORMAT,
        time: time,
      });
    });
};

exports.postConfig = (req, res) => {
  let countEnding = req.body.COUNT_ENDING;
  let timeEnding = req.body.endTime;
  let dateEnding = `${countEnding} ${timeEnding}`;

  const date = moment(dateEnding, constants.DATE_FORMAT).tz("Asia/Ho_Chi_Minh").toDate();
  helper.startCountDownSchedule(date);

  let configs = [
    {
      name: constants.UPGRADE_LEVEL.LVL_1,
      value: req.body.UPGRD_LVL_1 || 0,
    },
    {
      name: constants.UPGRADE_LEVEL.LVL_2,
      value: req.body.UPGRD_LVL_2 || 0,
    },
    {
      name: constants.UPGRADE_LEVEL.LVL_3,
      value: req.body.UPGRD_LVL_3 || 0,
    },
    {
      name: constants.UPGRADE_LEVEL.LVL_4,
      value: req.body.UPGRD_LVL_4 || 0,
    },
    {
      name: constants.UPGRADE_LEVEL.LVL_5,
      value: req.body.UPGRD_LVL_5 || 0,
    },
    {
      name: constants.COUNT_ENDING,
      value: dateEnding,
    },
  ];

  let promises = [];

  _.forEach(configs, (c) => {
    promises.push(Config.update({ name: c.name }, {
      $set: {
        value: c.value,
      }
    }));
  });

  Promise.all(promises)
    .then(() => {
      req.flash('success', { msg: 'Save Success.' });
      res.redirect('/admin/config');
    })
    .catch((err) => {
      req.flash('errors', { msg: `Something wrong when updating data! (${err.message})` });
      res.redirect('/admin/config');
    });
};
