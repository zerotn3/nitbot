/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <luc@ltv.vn> on Jan 26, 2017
 */

const _ = require('lodash');
const Config = require('../models/ListCoinTopBittrex');
const moment = require('moment-timezone');

exports.index = (req, res) => {
  Config.find({})
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

exports.postConfigBittrex = (req, res) => {
  let marketNm = req.body.marketNm;
  let buy_pri = req.body.buy_pri;
  let percentSell = req.body.percentSell;
  let activeFlag = req.body.activeFlag == 'Y' ? 'Y' : 'N';
  let btcQty = req.body.btcQty;
  //const date = moment(dateEnding, constants.DATE_FORMAT).tz("Asia/Ho_Chi_Minh").toDate();
  let promises = [];
  promises.push(Config.update({marketNn: marketNm}, {
    $set: {
      buy_pri: buy_pri,
      percentSell: percentSell,
      activeFlag: activeFlag,
      btcQty: btcQty,
    }
  }));

  Promise.all(promises)
    .then(() => {
      req.flash('success', {msg: 'Save Success.'});
      res.redirect('/listCoin');
    })
    .catch((err) => {
      req.flash('errors', {msg: `Something wrong when updating data! (${err.message})`});
      res.redirect('/listCoin');
    });
};
