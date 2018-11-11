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
bittrex.options({
  'apikey': '749a157ead0c4410b6914877bdb44c6f',
  'apisecret': '167d943d554f408e9dccedb6c3a95d2c',
});

const startFindBittex = () => {
  funcListCoinTopVolume();
}

/**
 * Check List Coin Top & Save
 */
const funcListCoinTopVolume = () => {
  bittrex.getmarkets(function (data, err) {
    if (err) {
      return console.error(err);
    }
    data.result = _.filter(data.result, u => u.MarketName.toString().indexOf('BTC-') > -1);
    //data.result = _.sortBy(data.result, ['BaseVolume']);
    //let last4ArrCoin = data.result.slice((data.result.length - 4), data.result.length);
    for (var i in data.result) {
      saveCoinChecked(data.result[i].MarketName, data.result[i].MinTradeSize);
    }
  });
}

/**
 * Save list coin
 * Save lại coin nếu chưa có trong db
 * @param marketName
 * @returns {Promise}
 */
const saveCoinChecked = (marketName, minTradeSize) => {
  return new Promise((resolve, reject) => {

    ListCoinTopBittrex.findOne({marketNn: marketName}, function (err, marketNn) {
      if (!err) {
        if (!marketNn) {
          let listCoinTop = new ListCoinTopBittrex();
          listCoinTop.marketNn = marketName;
          listCoinTop.minTradeSize = minTradeSize;
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
      //console.log(`Checking ${data[i].marketNn} ....`);
      funcCheckPrice(data[i].marketNn, data[i].buyFlag, data[i].sellFlag, data[i].percentSell, data[i].buy_pri, data[i].btcQty, data[i].minTradeSize);
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
const funcCheckPrice = (marketNm, buyFlag, sellFlag, percentSell, enterPrice, btcQty, minTradeSize) => new Promise((resolve, reject) =>
  bittrex.getticker({
    market: marketNm,
  }, (data, err) => {
    if (err) {
      console.log(err);
      reject(err);
    }
    let CurrentPrice = data.result.Ask;
    let CurrentPriceBid = data.result.Bid;
    let giaban = (Number(enterPrice) + ((Number(enterPrice) * Number(percentSell)) / 100)).toFixed(8);
    let nameCoin = _.last(_.split(marketNm, '-', 2));

    funcGetBalance('ETC').then((balance) => {
      if (!balance.success) {
        console.log(`Có lỗi check balance : ${err.message}`);
        return;
      }
      /**
       * Check if balance <=0 that mean not yet BUY coin. Buy again
       */
      if (balance.result.Balance <= 0 && CurrentPrice <= enterPrice ) {
        console.log(`Mua ${marketNm} tại giá ${CurrentPrice} `);
        console.log(`Balance của ${marketNm} hiện tại là : ${balance.result.Balance}`);
        let realQty = (btcQty / (CurrentPrice + CurrentPrice * 0.0025)).toFixed(8);
        tradebuy(marketNm, realQty, CurrentPrice)
          .then((databuy) => {
            funcUpdateFlagAndPriceBuy(marketNm, 'Y', CurrentPrice);
            funcSaveHistoryBuySell(marketNm, CurrentPrice, percentSell, 'BUY',
              databuy.result.OrderId, databuy.result.Quantity, databuy.result.Rate);
          })
          .catch((err) => {
            console.log(`Có lỗi hệ thống khi buy ${err}`)
          });
      }
      /**
       * Check if balance > 0 that mean not yet SELL coin. SELL again
       */
      if (balance.result.Balance > 0 && CurrentPriceBid >= giaban && buyFlag == 'Y') {
        console.log(`Bán ${marketNm} tại giá ${CurrentPriceBid}`)
        tradesell(marketNm, balance.result.Balance, CurrentPriceBid)
          .then((datasell) => {
            if (!datasell.success) {
              console.log(`Có lỗi không sell được : ${err.message}`);
              return;
            }
            funcUpdateFlagBuyAfterSell(marketNm, 'N',);
            funcSaveHistoryBuySell(marketNm, CurrentPriceBid, percentSell, 'SELL',
              datasell.result.OderId, datasell.result.Quantity, datasell.result.Rate);
          })
      }
    });
    /* /!**
      * Buy
      *!/
     if (CurrentPrice <= enterPrice && buyFlag == 'N') {
       console.log(`Mua ${marketNm} tại giá ${CurrentPrice}`);
       let realQty = (btcQty / (CurrentPrice + CurrentPrice * 0.0025)).toFixed(8);
       Promise.all([tradebuy(marketNm, realQty, CurrentPrice)])
         .then((databuy) => {
           funcUpdateFlagAndPriceBuy(marketNm, 'Y', CurrentPrice);
           funcSaveHistoryBuySell(marketNm, CurrentPrice, percentSell, 'BUY',
             databuy[0].result.OrderId, databuy[0].result.Quantity, databuy[0].result.Rate);
         })
         .catch((err) => {
           console.log(`Có lỗi hệ thống ${err}`)
         });

       /!**
        * Sell
        *!/
     } else if (buyFlag == 'Y' && CurrentPriceBid >= giaban) {
       console.log(`Bán ${marketNm} tại giá ${CurrentPriceBid}`)
       let nameCoin = _.last(_.split(marketNm, '-', 2));
       funcGetBalance(nameCoin).then((balance) => {
         if (!balance.success) {
           console.log(`Có lỗi check balance : ${err.message}`);
           return;
         }
         tradesell(marketNm, balance.result.Balance, CurrentPriceBid).then((datasell) => {
           if (!datasell.success) {
             console.log(`Có lỗi không sell được : ${err.message}`);
             return;
           }
           funcUpdateFlagBuyAfterSell(marketNm, 'N',);
           funcSaveHistoryBuySell(marketNm, CurrentPriceAsk, percentSell, 'SELL',
             datasell.result.OderId, datasell.result.Quantity, datasell.result.Rate);
         })
       });
     }*/
  })
);

/**
 * Update flag buy after buy
 * @param marketNm
 * @param flag
 */
const funcUpdateFlagAndPriceBuy = (marketNm, flag, CurrentPrice) => {
  let promises = [];
  promises.push(ListCoinTopBittrex.update({marketNn: marketNm}, {
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
      console.log(`Mua méo được : ${err.message}`)
    });
}

/**
 * Update flag buy aff sell
 * @param marketNm
 * @param flag
 * @param CurrentPrice
 */
const funcUpdateFlagBuyAfterSell = (marketNm, flag) => {
  let promises = [];
  promises.push(ListCoinTopBittrex.update({marketNn: marketNm}, {
    $set: {
      buyFlag: flag
    }
  }));

  Promise.all(promises)
    .then(() => {
      console.log(`Sell thành công ${marketNm} và chuyển về trạng thái đợi mua`);
    })
    .catch((err) => {
      console.log(`Mua bán được : ${err.message}`)
    });
}

const funcSaveHistoryBuySell = (marketName, enterPrice, percentSell, typeP, oder, qty, rate) => {
  return new Promise((resolve, reject) => {
    const enterTime = moment(new Date(), constants.DATE_FORMAT).tz("Asia/Ho_Chi_Minh").toDate();
    let listCoinBuySellBittrex = new ListCoinBuySellBittrex();
    listCoinBuySellBittrex.marketNn = marketName;
    listCoinBuySellBittrex.enterPrice = enterPrice;
    listCoinBuySellBittrex.percentSell = percentSell;
    listCoinBuySellBittrex.enterTime = enterTime;
    listCoinBuySellBittrex.type = typeP;
    listCoinBuySellBittrex.oder = oder;
    listCoinBuySellBittrex.qty = qty;
    listCoinBuySellBittrex.rate = rate;

    listCoinBuySellBittrex.save(function (err) {
      if (!err) {
        resolve(`Save Done`);
        console.log(`Đã ${typeP}: ${marketName} với giá ${enterPrice} tại thời điểm ${enterTime}`)
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

const funcGetBalance = (MarketName) => {
  return new Promise((resolve, reject) =>
    bittrex.getbalance({currency: MarketName}, function (data, err) {
      if (err) {
        console.log(`>>>> Error Get Balance: ${err.message}`);
        reject(err);
      }
      resolve(data);
    }))
};
/**
 * Sell Coin
 * @param MarketName
 * @param Quantity
 * @returns {Promise}
 */
const tradesell = (MarketName, Quantity, Rate) => {
  return new Promise((resolve, reject) =>
    bittrex.tradesell({
      MarketName: MarketName,
      OrderType: 'LIMIT',
      Quantity: Number(Quantity),//1.00000000,
      Rate: Number(Rate),
      TimeInEffect: 'IMMEDIATE_OR_CANCEL', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
      ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
      Target: 0, // used in conjunction with ConditionType
    }, function (data, err) {
      if (err) {
        console.log(`>>>> Error sell: ${err.message}`);
        reject(err);
      }
      resolve(data);
    }))
};

/**
 * Buy Coin
 * @param MarketName
 * @param Quantity
 * @param Rate
 * @returns {Promise}
 */
const tradebuy = (MarketName, Quantity, Rate) => {
  return new Promise((resolve, reject) =>
    bittrex.tradebuy({
      MarketName: MarketName,
      OrderType: 'LIMIT',
      Quantity: Quantity,
      Rate: Number(Rate),
      TimeInEffect: 'IMMEDIATE_OR_CANCEL', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
      ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
      Target: 0, // used in conjunction with ConditionType
    }, function (data, err) {
      if (err) {
        console.log(`>>>> Error buy: ${err.message}`);
        reject(err);
      }
      resolve(data);
    }))
};


/**
 * ************************************************************************************
 * Check Side Way
 * ************************************************************************************
 */


const checkListTopCoinBittrex = {

  startFindBittex: startFindBittex,
  getListCoinBittrex: getListCoinBittrex,
  funcCheckListTopCoin: funcCheckListTopCoin
};

module.exports = checkListTopCoinBittrex;

