const binance = require('node-binance-api');
const listcoinBNB = require('../listcoinbinance');
const {forEach} = require('p-iteration');
const _ = require('lodash');
const RSI = require('technicalindicators').RSI;
const BB = require('technicalindicators').BollingerBands;
const EMA = require('technicalindicators').EMA
const ListCoinBinance = require('../models/ListCoinBinance');
const ListCoinBinanceChecked = require('../models/ListCoinBinanceChecked');
const moment = require('moment');
const bottelegram = require('./bottelegram');
//==========================================

/**
 * Check exist or new coin
 */
const getAllSymboyInBinance = () => {
  console.log(`Bắt đầu check list coin trên Binance .....`);
  Promise.all([funcGetAllSymboy()])
    .then((data) => {
        for (let i in data[0]) {
          let marketName = data[0][i];
          let p1 = new Promise((resolve, reject) => {
            ListCoinBinance.findOne({marketNn: marketName}, function (err, marketNn) {
              if (!err) {
                if (!marketNn) {
                  //Thông báo có coin mới
                  let messCheckCoin = `Có coin mới lên sàn : ${marketName}`;
                  bottelegram.sendMessageTelegramGroup(messCheckCoin);
                  // Save new coin
                  let lstCoinBinance = new ListCoinBinance();
                  lstCoinBinance.marketNn = marketName;
                  lstCoinBinance.save(function (err) {
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
}

/**
 * Get all symbol
 * @returns {Promise}
 */
const funcGetAllSymboy = () => {
  return new Promise((resolve, reject) =>
    binance.bookTickers((error, ticker) => {
      if (error) {
        console.log(error);
        reject(error);
      }
      let lstcoin = _.map(ticker, 'symbol');
      resolve(lstcoin);
    }))
};
/**
 * Function Cal EMA
 * @param marketNm
 * @returns {Promise}
 */
const funGetEMABN = async (marketNm) => {
  return new Promise((resolve, reject) => {
    //Chỉ chơi những coin cặp BTC
    if (marketNm.toString().indexOf('BTC') == -1) {
      return;
    }
    binance.candlesticks(marketNm, "4h", (err, ticks, symbol) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      try {
        //let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
        let coinArr = ticks;
        let lstCPrice = _.map(coinArr, '4');
        let listclosePrice = _.map(lstCPrice, _.ary(parseFloat, 1));
        let lastClosePrice = _.last(listclosePrice);
        let buyBaseVolume = "";
          coinArr.pop();
        let lstcloseLastPrice = _.map(coinArr, '4');
        let listcloseLastPrice = _.map(lstcloseLastPrice, _.ary(parseFloat, 1));
        let lastClosePrice1 = _.last(listcloseLastPrice);

        let emaarr = [];
        //the last candle
        let emaVal10 = _.last(EMA.calculate({period: 20, values: listclosePrice}));
        let emaVal5 = _.last(EMA.calculate({period: 10, values: listclosePrice}));

        //the last candle - 1
        let emaVal10_1 = _.last(EMA.calculate({period: 20, values: listcloseLastPrice}));
        let emaVal5_1 = _.last(EMA.calculate({period: 10, values: listcloseLastPrice}));

        //
        let inputRSI = {
          values: listclosePrice,
          period: 14
        };
        let RSTvl = _.last(RSI.calculate(inputRSI));


        emaarr.push({'ema5': emaVal5});
        emaarr.push({'ema10': emaVal10});
        emaarr.push({'ema51': emaVal5_1});
        emaarr.push({'ema101': emaVal10_1});
        emaarr.push({'lastClosePrice': lastClosePrice});
        emaarr.push({'lastClosePrice1': lastClosePrice1});

        resolve(emaarr);
      } catch (e) {
        console.log(`Lỗi hệ thống ${e.toString()}`);
      }
    })
  })
};

const funcCheckCoinEMABN = () => {
  getListCoinFromBN()
    .then((data) => {
        data.forEach((coinNm) => {
          setTimeout(() => {
            Promise.all([funGetEMABN(coinNm.marketNn)])
              .then((data) => {
                let Sval = data[0][0].ema5;
                let Lval = data[0][1].ema10;
                let Sval1 = data[0][2].ema51;
                let Lval1 = data[0][3].ema101;
                let ClosePrice = data[0][4].lastClosePrice;
                let ClosePrice1 = data[0][5].lastClosePrice1;

                //check up trend
                if ((Sval > Lval) && (Sval1 < Lval1) && (ClosePrice > ClosePrice1)) {

                  Promise.all([saveCoinCheckedBN(coinNm.marketNn, Number(ClosePrice1)),])
                    .then((data) => {

                    })
                    .catch((err) => {
                      console.log(`IssueTool : ${err.toString()}`);
                    });
                }
                // console.log(data);
              })
              .catch((err) => {
                console.log(`IssueTool : ${err}`);
              });
          }, 5000)
        })
      }
    );
}

/**
 *
 * @param marketName
 * @param priceEnter
 * @returns {Promise}
 */
const saveCoinCheckedBN = (marketName, priceEnter) => {
  return new Promise((resolve, reject) => {
    ListCoinBinanceChecked.findOne({marketNn: marketName, enterPrice: priceEnter}, function (err, marketNn) {
      if (!err) {
        if (!marketNn) {
          let timeEnter = moment().subtract(1, 'days').format('YYYY-MM-DD h:mm:ss a');
          let message = `
🚀 #${marketName} 🚀
⚡ Giá Vào: ${priceEnter}
🕕 Ngày:  ${timeEnter}
🔗 https://www.binance.com/tradeDetail.html?symbol=${marketName}
 `;
          bottelegram.sendMessageTelegramGroup(message)

          let listCoinBnBChecked = new ListCoinBinanceChecked();
          listCoinBnBChecked.marketNn = marketName;
          listCoinBnBChecked.enterPrice = priceEnter;
          listCoinBnBChecked.save(function (err) {
            if (!err) {
              resolve(`Done`);
            }
            else {
              reject(`Fail`);
            }
          });
        }
      } else {
        reject(err);
        console.log(`Có lỗi hệ thống, liên hệ Admin`);
      }
    });
  });
}


const getRSIValBnB = (scoin) => {
  return new Promise((resolve, reject) =>
    setTimeout(function () {
      binance.candlesticks(scoin, "30m", (error, ticks, symbol) => {
        if (error) {
          console.log(error);
          reject(error);
        }
        let listclosePrice = _.map(ticks, 4);
        let inputRSI = {
          values: listclosePrice,
          period: 14
        };
        let RSTvl = _.last(RSI.calculate(inputRSI));

        resolve(RSTvl);
      })
    }, 1000))
};

/**
 *
 * @returns {Promise}
 */
const getListCoinFromBN = () => {
  return new Promise((resolve, reject) => {
    ListCoinBinance.find({}, (err, val) => {
      if (!err) {
        resolve(val);
      } else {
        reject(err);
      }
    });
  });
}


const binanceSignal = {
  getAllSymboyInBinance: getAllSymboyInBinance,
  funcCheckCoinEMABN: funcCheckCoinEMABN
};

module.exports = binanceSignal;