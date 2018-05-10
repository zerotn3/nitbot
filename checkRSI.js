const bittrex = require('node-bittrex-api');
const _ = require('lodash');
const RSI = require('technicalindicators').RSI;
const BB = require('technicalindicators').BollingerBands;
const TelegramBot = require('node-telegram-bot-api');
const listCBNB = require('./listcoinbinance');
/**
 * API binance
 **/
const binance = require('node-binance-api');

getListCoinBittrex();

getListCoinBinance();
let countrun = 0;
let minutes = 10, the_interval = minutes * 60 * 1000;
setInterval(function () {
  getListCoinBittrex();
  getListCoinBinance();
  countrun = countrun + 1;
  console.log("==========Chạy được   " + countrun + "   lần=============")
}, the_interval);


const token = '472833515:AAGXIRPigpyRKgO1NfLCPXBJ3R-5twUKBNw';
//
//
const bot = new TelegramBot(token, {polling: true})

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  console.log(chatId);
  bot.sendMessage(chatId, resp);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage('218238495', "tổ lái");
});


function getListCoinBittrex() {

  bittrex.getmarketsummaries(function (data, err) {
    if (err) {
      return console.error(err);
    }
    //Chỉ get cặp BTC va volume > 500
    data.result = _.filter(
      data.result, u =>
        //u.MarketName.toString().indexOf('BTC-') > -1
        u.BaseVolume > 200
    );
    for (let i in data.result) {
      let coinRes = data.result[i];
      let rsivl = getRSIVal(coinRes.MarketName);
      setTimeout(function () {
        Promise.all([rsivl])
          .then((data) => {
            if (data[0] <= 30) {
              console.log(`[Bittrex] RSI của ${coinRes.MarketName} là : ${data}`);
              bot.sendMessage('218238495', `[Bittrex] RSI của ${coinRes.MarketName} là : ${data}`);
            }
          })
          .catch((err) => {
            console.log(`IssueTool : ${err}`);
          });
      }, 1000)
    }
  });
}

const getRSIVal = marketNm => new Promise((resolve, reject) => bittrex.getcandles({
  marketName: marketNm,
  tickInterval: 'thirtyMin'
}, (data, err) => {
  if (err) {
    console.log(err);
    reject(err);
  }
  let coinArr = data.result;
  let listclosePrice = _.map(coinArr, 'C');
  let inputRSI = {
    values: listclosePrice,
    period: 14
  };
  let RSTvl = _.last(RSI.calculate(inputRSI));

  resolve(RSTvl);
}));


function getListCoinBinance() {
  for (let XXX in listCBNB.listCBNB) {
    let scoin = listCBNB.listCBNB[XXX];
    Promise.all([getRSIValBinance(scoin)])
      .then((data) => {
        if (data[0] <= 30 && data[0] != 0) {
          console.log(`[Binance] RSI của ${scoin} là : ${data}`)
          bot.sendMessage('218238495', `[Binance] RSI của ${scoin} là : ${data}`);
        }
      })
      .catch((err) => {
        console.log(`IssueTool : ${err}`);
      });
  }
}


function getRSIValBinance(scoin) {
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


function _BB26(listclosePBB) {
  let period = 6

  let input = {
    period: period,
    values: listclosePBB,
    stdDev: 2
  }
  return BB.calculate(input)
}