const http = require("http");
const request = require('request-promise');
const blockchain = require('blockchain.info');
const receive = require('blockchain.info/Receive');
const captchapng = require('captchapng');

const BlockIo = require('block_io');
const version = 2; // API version
const block_io = new BlockIo('c32d-b934-00f7-87ab', '056761092', version);

/**
 * GET /
 *
 */
exports.getStatusWallet = (req, res) => {
  request({
    url: 'https://blockchain.info/stats?format=json',
    json: true
  })
    .then(function (resJson) {
      res.render('account/statuswallet', {
        title: 'hello',
        market_price_usd: resJson.market_price_usd
      });
    })
    .catch(function (err) {
      next(err);
    });
};
