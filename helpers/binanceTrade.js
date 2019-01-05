// import BB from 'technicalindicators';
const binance = require('node-binance-api');
const NodeCache = require('node-cache');
const _ = require('lodash');
const TelegramBot = require('node-telegram-bot-api');

const token = '715114170:AAGo7ZPpPA4ZROmtUUHM5qMi3OuqC4STIS0';
const bot = new TelegramBot(token, { polling: true });

const LIST_COIN = 'LIST_COIN';

const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const helper = require('./newHelper');

const funcGetAllSymboy = () =>
  new Promise((resolve, reject) =>
    binance.bookTickers((error, ticker) => {
      if (error) {
        console.log(error);
        reject(error);
      }
      const lstcoin = _.map(ticker, 'symbol');
      resolve(lstcoin);
    })
  );

const getListKeyFromCache = async () => {
  try {
    return await myCache.get(LIST_COIN, true);
  } catch (err) {
    const data = await funcGetAllSymboy();
    return data;
  }
};

/**
 * @param {*} item string Symbol
 * @param {*} time string Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
 */
const getClosePrice = (item, time, limits) =>
  new Promise((resolve, reject) => {
    binance.candlesticks(
      item,
      time,
      (error, ticks, symbol) => {
        if (error) {
          console.log(error);
          reject(error);
        }
        const listClosePrice = _.map(ticks, '4');
        const listParseFloat = _.map(listClosePrice, _.ary(parseFloat, 1));
        resolve(listParseFloat);
      },
      { limit: limits }
    );
  });
/**
 * checkSignalBnB
 */
const checkSignalBnB = async () => {
  const lstCoin = await getListKeyFromCache();
  lstCoin.forEach(async (item) => {
    if (item.toString().indexOf('BTC') === -1) {
      return true;
    }
    const listClosePrice = await getClosePrice(item, '2h', 50);
    const AKValue = helper.AkFunctions(listClosePrice, 9, 24);

    const listClosePriceOneMonth = await getClosePrice(item, '1w', 500);
    const { blue, red } = helper.AmFunction(25, 10, listClosePrice, listClosePriceOneMonth);
    // console.log(AKValue, blue, red);

    if (AKValue < 0 || blue < 0 || red < 0) return true;
    if (_.nth(listClosePrice, -2) > _.nth(listClosePrice, -1)) return true;
    if (blue < red) return true;
    const lastPrice = _.last(listClosePrice);
    const mess1 = `Market Name: ${item}`;
    const mess2 = `Buy Price: ${lastPrice}`;
    const mess3 = 'Time Unit 2H';
    const allMess = mess1 + mess2 + mess3;

    bot.sendMessage('-319173537', allMess);
    console.log('[Item Remain]:', item, 'Giá Mua:', lastPrice, 'Khung Thời Gian:', '2H');
  });
};

const binanceTrade = {
  // getListCoinBinance,
  checkSignalBnB
};
module.exports = binanceTrade;
