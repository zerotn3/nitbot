const bittrex = require('node-bittrex-api');
const {forEach} = require('p-iteration');
const _ = require('lodash');
const RSI = require('technicalindicators').RSI;
const BB = require('technicalindicators').BollingerBands;
const EMA = require('technicalindicators').EMA;
const bottelegram = require('./bottelegram');
const ListCoinBittrex = require('../models/ListCoinBittrex');
const ListCoinBittrexChecked = require('../models/ListCoinBittrexChecked');
const moment = require('moment');

async function getListCoinBittrex() {
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


const getListCoinFromBD = () => {
  return new Promise((resolve, reject) => {
    ListCoinBittrex.find({}, (err, val) => {
      if (!err) {
        resolve(val);
      } else {
        reject(err);
      }
    });
  });
}
const funcCheckCoinEMA = () => {
  getListCoinFromBD()
    .then((data) => {
        data.forEach((coinNm) => {
          setTimeout(() => {
            Promise.all([funGetEMA(coinNm.marketNn)])
              .then((data) => {
                let Sval = data[0][0].ema5;
                let Lval = data[0][1].ema10;
                let Sval1 = data[0][2].ema51;
                let Lval1 = data[0][3].ema101;
                let ClosePrice = data[0][4].lastClosePrice;
                let ClosePrice1 = data[0][5].lastClosePrice1;
                let timenow = moment().subtract(1, 'days').format('YYYY-MM-DD h:mm:ss a');
                //check up trend
                if ((Sval > Lval) && (Sval1 < Lval1) && (ClosePrice > ClosePrice1)) {
                  Promise.all([saveCoinChecked(coinNm.marketNn, Number(ClosePrice1))])
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

const saveCoinChecked = (marketName, priceEnter) => {
  return new Promise((resolve, reject) => {
    ListCoinBittrexChecked.findOne({marketNn: marketName, enterPrice: priceEnter}, function (err, marketNn) {
      if (!err) {
        if (!marketNn) {

          let message = `
🚀 #${coinNm.marketNn} 🚀
⚡ Giá : ${ClosePrice1}
🕕 Ngày:  ${timenow}
🔗 https://bittrex.com/Market/Index?MarketName=${coinNm.marketNn}
`;
          bottelegram.sendMessageTelegramGroup(message);

          let listCoinBittrexChecked = new ListCoinBittrexChecked();
          listCoinBittrexChecked.marketNn = marketName;
          listCoinBittrexChecked.enterPrice = priceEnter;
          listCoinBittrexChecked.save(function (err) {
            if (!err) {
              resolve(`Save Done`);
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
}


const funGetEMA = async (marketNm) => {
  return new Promise((resolve, reject) => {
    bittrex.getticks({
      marketName: marketNm,
      tickInterval: 'hour'
    }, (data, err) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      try {
        let coinArr = data.result;
        let listclosePrice = _.map(coinArr, 'C');
        let lastClosePrice = _.last(listclosePrice);
        coinArr.pop();
        let listcloseLastPrice = _.map(coinArr, 'C');
        let lastClosePrice1 = _.last(listcloseLastPrice);

        let emaarr = [];
        //the last candle
        let emaVal10 = _.last(EMA.calculate({period: 10, values: listclosePrice}));
        let emaVal5 = _.last(EMA.calculate({period: 5, values: listclosePrice}));

        //the last candle - 1
        let emaVal10_1 = _.last(EMA.calculate({period: 10, values: listcloseLastPrice}));
        let emaVal5_1 = _.last(EMA.calculate({period: 5, values: listcloseLastPrice}));

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



const bittrexSignal = {

  getListCoinBittrex: getListCoinBittrex,
  funcCheckCoinEMA: funcCheckCoinEMA
};

module.exports = bittrexSignal;