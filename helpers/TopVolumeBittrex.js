const bittrex = require('node-bittrex-api');
const _ = require('lodash');
// const bottelegram = require('./bottelegram');
const ListCoinBittrex = require('../models/ListCoinBittrex');
const ListCoinTopBittrex = require('../models/ListCoinTopBittrex');
const ListCoinBuySellBittrex = require('../models/ListCoinBuySellBittrex');
const moment = require('moment');

const constants = require('../config/constants.json');

bittrex.options({
  apikey: 'd355c14501924c158d3d29db9ef0155e',
  apisecret: '79e59b9dd7db41a3ad9e31e512142192',
});

const startFindBittex = () => {
  funcListCoinTopVolume();
};

/**
 * Check List Coin Top & Save
 */
const funcListCoinTopVolume = () => {
  bittrex.getmarkets((data, err) => {
    if (err) {
      return console.error(err);
    }
    data.result = _.filter(data.result, u => u.MarketName.toString().indexOf('BTC-') > -1);
    for (const i in data.result) {
      saveCoinChecked(data.result[i].MarketName, data.result[i].MinTradeSize);
    }
  });
};

/**
 * Save list coin
 * Save lại coin nếu chưa có trong db
 * @param marketName
 * @returns {Promise}
 */
const saveCoinChecked = (marketName, minTradeSize) => new Promise((resolve, reject) => {
  ListCoinTopBittrex.findOne({
    marketNn: marketName
  }, (err, marketNn) => {
    if (!err) {
      if (!marketNn) {
        const listCoinTop = new ListCoinTopBittrex();
        listCoinTop.marketNn = marketName;
        listCoinTop.minTradeSize = minTradeSize;
        listCoinTop.activeFlag = 'N';
        listCoinTop.buyFlag = 'N';
        listCoinTop.sellFlag = 'N';
        listCoinTop.save((err) => {
          if (!err) {
            resolve('Save Done');
            console.log(`Coin top mới : ${marketName}`);
          } else {
            reject('Save Fail');
          }
        });
      }
    } else {
      reject(err);
      console.log('Có lỗi hệ thống, liên hệ Admin');
    }
  });
});
/**
 * List all các coin hiện tại đang top
 */
const funcCheckListTopCoin = () => {
  // chỉ search những coin có active flag = "Y"
  ListCoinTopBittrex.find({
    activeFlag: 'Y'
  }, (err, data) => {
    if (err) {
      console.log(err);
    }
    for (const i in data) {
      // console.log(`Checking ${data[i].marketNn} ....`);
      funcCheckPrice(data[i].marketNn, data[i].buyFlag, data[i].sellFlag, data[i].percentSell, data[i].buy_pri, data[i].btcQty, data[i].minTradeSize);
    }
  });
};
/**
 * Check lần lượt các coin để tìm điều kiên buy sell
 * @param marketNm
 * @param buyFlag
 * @param enterPrice
 * @returns {Promise}
 */
const funcCheckPrice = (marketNm, buyFlag, sellFlag, percentSell, enterPrice, btcQty, minTradeSize) => new Promise((resolve, reject) =>
  bittrex.getticker({
    market: marketNm,
  }, (data, err) => {
    if (err) {
      console.log(err);
      reject(err);
    }
    const CurrentPrice = data.result.Ask;
    const CurrentPriceBid = data.result.Bid;
    const giaban = (Number(enterPrice) + ((Number(enterPrice) * Number(percentSell)) / 100)).toFixed(8);
    // console.log(`Giá nhỏ nhất mua bán được của ${marketNm} là ${minTradeSize}`);

    const nameCoin = _.last(_.split(marketNm, '-', 2));
    funcGetBalance(nameCoin).then((balance) => {
      if (!balance.success) {
        console.log(`Có lỗi check balance : ${err.message}`);
        return;
      }

      /**
       * Check if balance <=0 that mean not yet BUY coin. Buy again
       */
      if (balance.result.Balance <= 0 && CurrentPrice <= enterPrice) {
        console.log(`Mua ${marketNm} tại giá ${CurrentPrice}`);
        console.log(`Balance của ${marketNm} hiện tại là : ${balance.result.Balance}`);
        const realQty = (btcQty / (CurrentPrice + CurrentPrice * 0.0025)).toFixed(8);
        tradebuy(marketNm, realQty, CurrentPrice)
          .then((databuy) => {
            funcUpdateFlagAndPriceBuy(marketNm, 'Y', CurrentPrice);
            funcSaveHistoryBuySell(marketNm, CurrentPrice, percentSell, 'BUY',
              databuy.result.OrderId, databuy.result.Quantity, databuy.result.Rate);
          })
          .catch((err) => {
            console.log(`Có lỗi hệ thống khi buy ${err}`);
          });
      }
      /**
       * Check if balance > 0 that mean not yet SELL coin. SELL again
       */
      if (balance.result.Balance > 0 && CurrentPriceBid >= giaban) {
        console.log(`Bán ${marketNm} tại giá ${CurrentPriceBid}`);
        console.log(`Balance của ${marketNm} hiện tại là : ${balance.result.Balance}`);
        tradesell(marketNm, balance.result.Balance, CurrentPriceBid)
          .then((datasell) => {
            if (!datasell.success) {
              console.log(`Có lỗi không sell được : ${err.message}`);
              return;
            }
            funcUpdateFlagBuyAfterSell(marketNm, 'N', );
            funcSaveHistoryBuySell(marketNm, CurrentPriceBid, percentSell, 'SELL',
              datasell.result.OderId, datasell.result.Quantity, datasell.result.Rate);
          });
      }
      /**
       * function cắt lỗ nếu giá giảm xuống quá 5%
       */
      const giacatlo = enterPrice * (1 - 0.05);
      if (balance.result.Balance > 0 && CurrentPriceBid <= giacatlo) {
        console.log(`Bán ${marketNm} tại giá ${CurrentPriceBid}`);
        console.log(`Balance của ${marketNm} hiện tại là : ${balance.result.Balance}`);
        tradesell(marketNm, balance.result.Balance, CurrentPriceBid)
          .then((datasell) => {
            if (!datasell.success) {
              console.log(`Có lỗi không sell được : ${err.message}`);
              return;
            }
            funcUpdateFlagBuyAfterSell(marketNm, 'N', );
            funcSaveHistoryBuySell(marketNm, CurrentPriceBid, percentSell, 'SELL',
              datasell.result.OderId, datasell.result.Quantity, datasell.result.Rate);
          });
      }
    });
  }));

/**
 * Update flag buy after buy
 * @param marketNm
 * @param flag
 */
const funcUpdateFlagAndPriceBuy = (marketNm, flag, CurrentPrice) => {
  const promises = [];
  promises.push(ListCoinTopBittrex.update({
    marketNn: marketNm
  }, {
    $set: {
      buyFlag: flag,
      buy_pri: CurrentPrice
    }
  }));

  Promise.all(promises)
    .then(() => {
      console.log(`Buy thành công ${marketNm} và chuyển về trạng thái đợi bán`);
    })
    .catch((err) => {
      console.log(`Mua méo được : ${err.message}`);
    });
};

/**
 * Update flag buy aff sell
 * @param marketNm
 * @param flag
 * @param CurrentPrice
 */
const funcUpdateFlagBuyAfterSell = (marketNm, flag) => {
  const promises = [];
  promises.push(ListCoinTopBittrex.update({
    marketNn: marketNm
  }, {
    $set: {
      buyFlag: flag
    }
  }));

  Promise.all(promises)
    .then(() => {
      console.log(`Sell thành công ${marketNm} và chuyển về trạng thái đợi mua`);
    })
    .catch((err) => {
      console.log(`Mua bán được : ${err.message}`);
    });
};

const funcSaveHistoryBuySell = (marketName, enterPrice, percentSell, typeP, oder, qty, rate) => new Promise((resolve, reject) => {
  const enterTime = moment(new Date(), constants.DATE_FORMAT).tz('Asia/Ho_Chi_Minh').toDate();
  const listCoinBuySellBittrex = new ListCoinBuySellBittrex();
  listCoinBuySellBittrex.marketNn = marketName;
  listCoinBuySellBittrex.enterPrice = enterPrice;
  listCoinBuySellBittrex.percentSell = percentSell;
  listCoinBuySellBittrex.enterTime = enterTime;
  listCoinBuySellBittrex.type = typeP;
  listCoinBuySellBittrex.oder = oder;
  listCoinBuySellBittrex.qty = qty;
  listCoinBuySellBittrex.rate = rate;

  listCoinBuySellBittrex.save((err) => {
    if (!err) {
      resolve('Save Done');
      console.log(`Đã ${typeP}: ${marketName} với giá ${enterPrice} tại thời điểm ${enterTime}`);
    } else {
      reject('Save Fail');
    }
  });
});

/**
 * Check and save listcoin
 */
const getListCoinBittrex = () => {
  console.log('Bắt đầu check list coin trên bittrex .....');
  // eslint-disable-next-line no-use-before-define
  Promise.all([getListDataBittrex()])
    .then((data) => {
      for (const i in data[0]) {
        const marketName = data[0][i].MarketName;
        const p1 = new Promise((resolve, reject) => {
          ListCoinBittrex.findOne({
            marketNn: marketName
          }, (err, marketNn) => {
            if (!err) {
              if (!marketNn) {
                const listCoinBittrex = new ListCoinBittrex();
                listCoinBittrex.marketNn = marketName;

                listCoinBittrex.save((err) => {
                  if (!err) {
                    console.log(`Coin mới vừa cập nhật : ${marketName}`);
                  } else {
                    console.log('Có lỗi hệ thống trong quá trình kiểm tra list coin');
                  }
                });
                resolve(marketNn);
              }
            } else {
              reject(err);
              console.log('Có lỗi hệ thống, liên hệ Admin');
            }
          });
        });
        Promise.all([p1])
          .then((data) => {
            // console.log(`aloha ${data}`);
          })
          .catch((err) => {
            console.log(`Có lỗi hệ thống ${err}`);
          });
      }
    })
    .catch((err) => {
      console.log(`IssueTool : ${err.toString()}`);
    });
};

/**
 * Get List Symbol Bittrex
 * @returns {Promise}
 */
const getListDataBittrex = () => new Promise((resolve, reject) =>
  bittrex.getmarketsummaries((data, error) => {
    if (error) {
      console.log(error);
      reject(error);
    }
    resolve(data.result);
  }));

const funcGetBalance = MarketName => new Promise((resolve, reject) =>
  bittrex.getbalance({
    currency: MarketName
  }, (data, err) => {
    if (err) {
      console.log(`>>>> Error Get Balance: ${err.message}`);
      reject(err);
    }
    resolve(data);
  }));
/**
 * Sell Coin
 * @param MarketName
 * @param Quantity
 * @returns {Promise}
 */
const tradesell = (MarketName, Quantity, Rate) => new Promise((resolve, reject) =>
  bittrex.tradesell({
    MarketName,
    OrderType: 'LIMIT',
    Quantity: Number(Quantity), // 1.00000000,
    Rate: Number(Rate),
    TimeInEffect: 'GOOD_TIL_CANCELLED', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
    ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
    Target: 0, // used in conjunction with ConditionType
  }, (data, err) => {
    if (err) {
      console.log(`>>>> Error sell: ${err.message}`);
      reject(err);
    }
    resolve(data);
  }));

/**
 * Buy Coin
 * @param MarketName
 * @param Quantity
 * @param Rate
 * @returns {Promise}
 */
const tradebuy = (MarketName, Quantity, Rate) => new Promise((resolve, reject) =>
  bittrex.tradebuy({
    MarketName,
    OrderType: 'LIMIT',
    Quantity,
    Rate: Number(Rate),
    TimeInEffect: 'GOOD_TIL_CANCELLED', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
    ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
    Target: 0, // used in conjunction with ConditionType
  }, (data, err) => {
    if (err) {
      console.log(`>>>> Error buy: ${err.message}`);
      reject(err);
    }
    resolve(data);
  }));

const checkListTopCoinBittrex = {

  startFindBittex,
  getListCoinBittrex,
  funcCheckListTopCoin
};

module.exports = checkListTopCoinBittrex;
