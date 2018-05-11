const bittrex = require('node-bittrex-api');
const {forEach} = require('p-iteration');
const _ = require('lodash');
const RSI = require('technicalindicators').RSI;
const BB = require('technicalindicators').BollingerBands;
const EMA = require('technicalindicators').EMA;
//const bottelegram = require('./bottelegram');
const ListCoinBittrex = require('../models/ListCoinBittrex');
const ListCoinTopBittrex = require('../models/ListCoinTopBittrex');
const ListCoinBuySellBittrex = require('../models/ListCoinBuySellBittrex');
const moment = require('moment');

const constants = require('../config/constants.json');


const startFindBittex = () => {
  funcListCoinTopVolume();
}

/**
 * Check List Coin Top & Save
 */
const funcListCoinTopVolume = () => {
  bittrex.getmarketsummaries(function (data, err) {
    if (err) {
      return console.error(err);
    }
    data.result = _.filter(data.result, u => u.MarketName.toString().indexOf('BTC-') > -1);
    //data.result = _.sortBy(data.result, ['BaseVolume']);
    //let last4ArrCoin = data.result.slice((data.result.length - 4), data.result.length);
    for (var i in data.result) {
      saveCoinChecked(data.result[i].MarketName);
    }
  });
}

/**
 * Save list coin
 * Save lại coin nếu chưa có trong db
 * @param marketName
 * @returns {Promise}
 */
const saveCoinChecked = (marketName) => {
  return new Promise((resolve, reject) => {

    ListCoinTopBittrex.findOne({marketNn: marketName}, function (err, marketNn) {
      if (!err) {
        if (!marketNn) {
          let listCoinTop = new ListCoinTopBittrex();
          listCoinTop.marketNn = marketName;
          listCoinTop.activeFlag = 'N';
          listCoinTop.buyFlag = 'N';
          listCoinTop.sellFlag = 'N';
          listCoinTop.save(function (err) {
            if (!err) {
              resolve(`Save Done`);
              console.log(`Coin top mới : ${marketName}`)
            }
            else {
              reject(`Save Fail`);
            }
          });
        }
      } else {
        reject(err);
        console.log(`Có lỗi hệ thống, liên hệ Admin`);
      }
    });
  });
};
/**
 * List all các coin hiện tại đang top
 */
const funcCheckListTopCoin = () => {
  //chỉ search những coin có active flag = "Y"
  ListCoinTopBittrex.find({activeFlag: "Y"}, (err, data) => {
    if (err) {
      console.log(err);
    }
    for (var i in data) {
      console.log(`Checking ${data[i].marketNn} ....`);
      funcCheckPrice(data[i].marketNn, data[i].buyFlag, data[i].sellFlag, data[i].percentSell, data[i].buy_pri);
    }
  });
};
/**
 * Check lần lượt các coin để tìm điều kiên buy sell
 * @param marketNm
 * @param buyFlag
 * @param sellFlag
 * @param enterPrice
 * @returns {Promise}
 */
const funcCheckPrice = (marketNm, buyFlag, sellFlag, percentSell, enterPrice) => new Promise((resolve, reject) =>
  bittrex.getticker({
    market: marketNm,
  }, (data, err) => {
    if (err) {
      console.log(err);
      reject(err);
    }
    let CurrentPrice = data.result.Last;
    let giaban = (Number(enterPrice) + ((Number(enterPrice) * Number(percentSell)) / 100)).toFixed(8);
    //console.log(giaban);
    if (CurrentPrice <= enterPrice && buyFlag == 'N') {
      console.log(`Mua ${marketNm} tại giá ${CurrentPrice}`);
      //function buy
      //update flagbuy  = Y
      funcUpdateFlagBuy(marketNm, 'Y');
      funcSaveHistoryBuySell(marketNm, CurrentPrice, percentSell, 'BUY');
    } else if (buyFlag == 'Y' && CurrentPrice >= giaban) {
      console.log(`Bán ${marketNm} tại giá ${CurrentPrice}`)
      //function sell
      //update flag sell = Y
      funcUpdateFlagBuy(marketNm, 'N');
      funcSaveHistoryBuySell(marketNm, CurrentPrice, percentSell, 'SELL');
    }
  }));

/**
 * Update flag buy after buy
 * @param marketNm
 * @param flag
 */
const funcUpdateFlagBuy = (marketNm, flag) => {
  let promises = [];
  promises.push(ListCoinTopBittrex.update({marketNn: marketNm}, {
    $set: {
      buyFlag: flag
    }
  }));

  Promise.all(promises)
    .then(() => {
      console.log(`Buy thành công ${marketNm} và chuyển về trạng thái đợi bán`);
    })
    .catch((err) => {
      console.log(`Mua méo được`)
    });
}

const funcSaveHistoryBuySell = (marketName, enterPrice, percentSell, typeP) => {
  return new Promise((resolve, reject) => {
    const enterTime = moment(new Date(), constants.DATE_FORMAT).tz("Asia/Ho_Chi_Minh").toDate();
    let listCoinBuySellBittrex = new ListCoinBuySellBittrex();
    listCoinBuySellBittrex.marketNn = marketName;
    listCoinBuySellBittrex.enterPrice = enterPrice;
    listCoinBuySellBittrex.percentSell = percentSell;
    listCoinBuySellBittrex.enterTime = enterTime;
    listCoinBuySellBittrex.type = typeP;

    listCoinBuySellBittrex.save(function (err) {
      if (!err) {
        resolve(`Save Done`);
        console.log(`Đã mua: ${marketName} với giá ${enterPrice} tại thời điểm ${enterTime}`)
      }
      else {
        reject(`Save Fail`);
      }
    });
  });
}

/**
 * Check and save listcoin
 */
const getListCoinBittrex = () => {
  console.log(`Bắt đầu check list coin trên bittrex .....`);
  Promise.all([getListDataBittrex()])
    .then((data) => {
        for (let i in data[0]) {
          let marketName = data[0][i].MarketName;
          let p1 = new Promise((resolve, reject) => {
            ListCoinBittrex.findOne({marketNn: marketName}, function (err, marketNn) {
              if (!err) {
                if (!marketNn) {
                  let listCoinBittrex = new ListCoinBittrex();
                  listCoinBittrex.marketNn = marketName;

                  listCoinBittrex.save(function (err) {
                    if (!err) {
                      console.log(`Coin mới vừa cập nhật : ${marketName}`);
                    }
                    else {
                      console.log(`Có lỗi hệ thống trong quá trình kiểm tra list coin`);
                    }
                  });
                  resolve(marketNn);
                }
              } else {
                reject(err);
                console.log(`Có lỗi hệ thống, liên hệ Admin`);
              }
            });
          });
          Promise.all([p1])
            .then((data) => {
              //console.log(`aloha ${data}`);
            })
            .catch((err) => {
              console.log(`Có lỗi hệ thống ${err}`)
            });
        }
      }
    )
    .catch((err) => {
      console.log(`IssueTool : ${err.toString()}`);
    });
};

/**
 * Get List Symbol Bittrex
 * @returns {Promise}
 */
const getListDataBittrex = () => {
  return new Promise((resolve, reject) =>
    bittrex.getmarketsummaries((data, error) => {
      if (error) {
        console.log(error);
        reject(error);
      }
      resolve(data.result);
    }))
};

const checkListTopCoinBittrex = {

  startFindBittex: startFindBittex,
  getListCoinBittrex: getListCoinBittrex,
  funcCheckListTopCoin: funcCheckListTopCoin
};

module.exports = checkListTopCoinBittrex;

