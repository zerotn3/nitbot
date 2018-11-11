const {forEach} = require('p-iteration');
const _ = require('lodash');
const moment = require('moment');

const binance = require('node-binance-api');


const searchListAllSysBnb = async() => {
  await binance.bookTickers((error, ticker) => {
    console.log("bookTickers", ticker);
  });
}

const checkListTopCoinBinance = {

  searchListAllSysBnb: searchListAllSysBnb,
  
};

module.exports = checkListTopCoinBinance;

