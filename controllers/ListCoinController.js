const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const ListCoinBittrex = require('../models/ListCoinBittrex');
const ListCoinTopBittrex = require('../models/ListCoinTopBittrex');
const ListCoinBuySellBittrex = require('../models/ListCoinBuySellBittrex');

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

const bittrex = require('node-bittrex-api');
const getStandardDeviation = require('get-standard-deviation');
const BB = require('technicalindicators').BollingerBands;


const binance = require('node-binance-api');


// let countrun = 0;
// let minutes = 1, the_interval = minutes * 60 * 100;
// setInterval(function () {
//   getBB26();
//   getListCoin();
//   countrun = countrun + 1;
//   console.log("==========Chạy được   " + countrun + "   lần=============")
// }, the_interval);


function getBB(period, stdDev, values) {
  let rs
  let input = {
    period: period,
    values: values,
    stdDev: stdDev

  }
  rs = BB.calculate(input);
  return rs;
}


function checkBetweenTwoBB(marketNm) {
  bittrex.getcandles({
    marketName: marketNm,
    tickInterval: 'thirtyMin'
  }, function (data, err) {
    if (err) {
      return console.error(err);
    }
    let coinArr = data.result;
    let last6candle = coinArr.slice((coinArr.length - 6), coinArr.length)
    let last20candle = coinArr.slice((coinArr.length - 20), coinArr.length)
    let bb62 = getBB(6, 2, last6candle);
    let bb202 = getBB(20, 2, last20candle);


  });
}

function getListCoin() {
  let promise;
  //delete list coin before delete
  deleteListCoinBeforeScan();


  bittrex.getmarketsummaries(function (data, err) {
    if (err) {
      return console.error(err);
    }
    //Chỉ get cặp BTC va volume > 500
    data.result = _.filter(
      data.result, u => u.MarketName.toString().indexOf('BTC-') > -1
        && u.BaseVolume > 500
        && _spread(u.Last, u.Ask, u.Bid) > 0.2
        && _checkTrend(u.MarketName) != 'up'
        && _checkCandle(u.MarketName) != '2red'
    );

    for (let i in data.result) {
      let coinRes = data.result[i];
      //console.log(data.result[i].MarketName);
      const listcoin = new ListCoinBittrex({
        marketNn: coinRes.MarketName,
        bvolume: coinRes.BaseVolume,
        spread: _spread(coinRes.Last, coinRes.Ask, coinRes.Bid),
        candle: _checkCandle(coinRes.MarketName),
        trend: _checkTrend(coinRes.MarketName),

        // bid: coinRes,
        // highVl: coinRes,
        // lowVl: coinRes,
        // lastVl: coinRes,
        // openBuyOrder: coinRes,
        // openSellOrder: Number,
        // timeMarket: String
      });

      listcoin.save(function (error) {
        //console.log("List coin has been saved!");
        if (error) {
          console.error(error);
        }
      });
      promise = "OK";
    }
  });
  return promise;
}

function deleteListCoinBeforeScan() {

  ListCoinBittrex.remove({}, (err) => {
    if (err) {
      return next(err);
    }
  });
}

function _spread(bittrexlast, bittrexask, bittrexbid) {
  return (100 / bittrexlast) * (bittrexask - bittrexbid);
}

function _checkTrend(marketNm) {
  let count_up = 0;
  let count_down = 0;
  setTimeout(function () {
    bittrex.getcandles({
      marketName: marketNm,
      tickInterval: 'thirtyMin'
    }, function (data, err) {
      if (err) {
        return console.error(err);
      }

      let coinArr = data.result;
      let newArrCoin = coinArr.slice((coinArr.length - 20), coinArr.length);

      newArrCoin.forEach(function (price) {
        {
          if (price.C > price.O) {
            count_up = count_up + 1;
          }
          if (price.C < price.O) {
            count_down = count_down + 1;
          }
        }
      });
    })
  }, 500);

  if (count_up > count_down) {
    return "up";
  } else if (count_up < count_down) {
    return "down";
  } else {
    return "sideway";
  }
}


function _checkCandle(marketNm) {

  //let CC = setTimeout(function () {
  let countred = 0;
  bittrex.getcandles({
    marketName: marketNm,
    tickInterval: 'thirtyMin'
  }, function (data, err) {
    if (err) {
      return console.error(err);
    }
    let coinArr = data.result;
    let last3candle = coinArr.slice((coinArr.length - 4), coinArr.length - 1);
    last3candle.forEach(function (price) {
      {
        if (price.C < price.O) {
          countred = countred + 1;
        }
      }
    });
    //return countred;
  });
  //}, 500);
  //console.log(countred);
  if (countred === 2) {
    return "2red";
  } else {
    return "1red";
  }
}

/**
 *
 * @param req
 * @param res
 */
exports.getReqWithdrawnList = (req, res) => {
  let p1 = new Promise((resolve, reject) => {
    ListCoinTopBittrex.find({}, (err, listCoin) => {
      if (err) {
        reject(err);
      } else {
        resolve(listCoin);
      }
    });
  });
  let p2 = new Promise((resolve, reject) => {
    ListCoinBuySellBittrex.find({}, (err, listBuySell) => {
      if (err) {
        reject(err);
      } else {
        resolve(listBuySell);
      }
    });
  });

  Promise.all([p1, p2])
    .then((data) => {
      res.render('account/listCoin', {
        title: 'List Coin',
        listCoin: data[0],
        listBuySell: data[1],
      });
    })
    .catch((err) => {
      return next(err);
    });
};

function getPerWL(coinNm, timeenterPrice, enterPrice) {
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



