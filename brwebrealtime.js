const bittrex = require('node-bittrex-api');
const _ = require('lodash');
const RSI = require('technicalindicators').RSI;
const BB = require('technicalindicators').BollingerBands;
const TelegramBot = require('node-telegram-bot-api');


let countrun = 0;
let minutes = 1, the_interval = minutes * 60 * 100;
setInterval(function () {
  getListCoin();
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


function getListCoin() {

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

      Promise.all([rsivl])
        .then((data) => {
          console.log(data);
          if(data <= 21) {
            bot.sendMessage('218238495', `RSI của ${coinRes.MarketName} là : ${data}`);
          }
        })
        .catch((err) => {
          return next(err);
        });
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
  let newArrCoin = coinArr.slice((coinArr.length - 20), coinArr.length);
  let listclosePrice = _.map(newArrCoin, 'C');
  let inputRSI = {
    values: listclosePrice,
    period: 14
  };
  let RSTvl = _.last(RSI.calculate(inputRSI));

  resolve(RSTvl);
}));


function _BB26(listclosePBB) {
  let period = 6

  let input = {
    period: period,
    values: listclosePBB,
    stdDev: 2
  }
  return BB.calculate(input)
}