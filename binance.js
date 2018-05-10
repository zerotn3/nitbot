const binance = require('node-binance-api');
const listcoinBNB = require('./listcoinbinance');
const BB = require('technicalindicators').BollingerBands;
const RSI = require('technicalindicators').RSI;
const R = require('ramda');
const _ = require('lodash');
const moment = require('moment');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const ListCoinBittrex = require('/models/ListCoinBittrex');


const token = '472833515:AAGXIRPigpyRKgO1NfLCPXBJ3R-5twUKBNw';
//
//
const bot = new TelegramBot(token, {polling: true})

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  bot.sendMessage(chatId, resp);
});
//console.log(listcoinBNB);
binance.prices((error, ticker) => {
  //console.log("prices()", ticker);
  //console.log("Price of BTC: ", ticker.BTCUSDT);
});
// Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
console.log(`Checking List Coin ....`);
for (let XXX in listcoinBNB.listCBNB) {
  let scoin = listcoinBNB.listCBNB[XXX];
  //console.log(`Checking ${scoin}`);
  startSocket(scoin);
}

function closeSocket(scoin) {
  binance.websockets.terminate(`${scoin}@kline_15m`);
}

function startSocket(scoin) {
  binance.websockets.chart(scoin, "15m", (symbol, interval, chart) => {
    let keys = Object.keys(chart);

    /**
     * check nen xanh do
     */
    let love3st = R.takeLast(4, keys);
    let redblueArr = [];
    love3st.forEach(function (entry) {
      let dt = moment(Number(entry)).toString();
      //console.log(dt);
      redblueArr.push(chart[entry]);
    });
    let candlests = checkCandle(redblueArr);

    /**
     * Check RSI
     */
    let love50st = R.takeLast(50, keys);
    let RsiArr = [];
    love50st.forEach(function (entry) {
      RsiArr.push(chart[entry]);
    });
    let listRSI = _.map(RsiArr, 'close');
    let rsiVl = checkRSI(listRSI);
    //console.log(rsiVl);

    /**
     * Lay data neu thoa man candle & RSI
     */
    if (candlests && (rsiVl < 70)) {

      let lastCandle = R.takeLast(50, keys);

      let closePrice = [];
      lastCandle.forEach(function (entry) {
        const d = moment(Number(entry)).toString();
        //console.log(d);
        closePrice.push(Number(chart[entry].close));
      });

      let tick = binance.last(chart);
      const last = chart[tick].close;
      const volume = chart[tick].volume;
      if (volume > 10) {
        let bb26 = getBB(6, 2, closePrice);

        if (bb26 === last) {


          bot.sendMessage('218238495', `Market Name: ${scoin}
                                  Giá tại BB26 = Last: ${bb26}`);
          // bot.sendMessage('-277262874', `Market Name: ${scoin}
          //                         Giá vào lệnh: ${bb26}`);
          console.log(bb26 + last);
        }
      }
    } else {
      //console.log(`${scoin} có 3 nên liên tiếp không đủ điều kiện !`);
      //bot.sendMessage('218238495', `${scoin} 3 nến liên tiếp không đủ điều kiện.`);
      closeSocket(scoin);
    }
  });
}


function getBB(period, stdDev, values) {
  let rs;
  let input = {
    period: period,
    values: values,
    stdDev: stdDev

  }
  rs = R.last(BB.calculate(input));
  return parseFloat(rs.lower).toFixed(8);
}


function checkRSI(value) {
  const inputRSI = {
    values: value,
    period: 14
  };

  return _.last(RSI.calculate(inputRSI));
}

function checkCandle(arr) {
  if ((arr[0].close < arr[0].open) && (arr[1].close < arr[1].open)) {
    return false;
  }
  if ((arr[1].close < arr[1].open) && (arr[2].close < arr[2].open)) {
    return false;
  }
  if ((arr[0].close < arr[0].open) && (arr[1].close < arr[1].open) && (arr[2].close < arr[2].open)) {
    return false;
  }
  return true;
}
















