const binance = require('node-binance-api');
const listcoinBNB = require('./listcoinbinance');
const BB = require('technicalindicators').BollingerBands;
const R = require('ramda');
const fs = require('fs');
const moment = require('moment');

//
// binance.exchangeInfo(function(error, data) {
//   let minimums = {};
//   for ( let obj of data.symbols ) {
//     let filters = {status: obj.status};
//     for ( let filter of obj.filters ) {
//       if ( filter.filterType == "LOT_SIZE" ) {
//         filters.stepSize = filter.stepSize;
//         filters.minQty = filter.minQty;
//         filters.maxQty = filter.maxQty;
//       }
//     }
//     filters.orderTypes = obj.orderTypes;
//     filters.icebergAllowed = obj.icebergAllowed;
//     minimums[obj.symbol] = filters;
//   }
//   console.log(minimums);
// });

const buymarket = (coinNm, price) => {
  let numberEth =  0.01;
  let amount = price * numberEth;
  let quantity = binance.roundStep(amount, stepSize);
  binance.buy(coinNm, quantity, price, {type: 'LIMIT'}, (error, response) => {
    console.log("Limit Buy response", response);
    console.log("order id: " + response.orderId);
  });
}
