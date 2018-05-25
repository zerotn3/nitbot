const bittrex = require('node-bittrex-api');

bittrex.options({
  'apikey' : '749a157ead0c4410b6914877bdb44c6f',
  'apisecret' : '167d943d554f408e9dccedb6c3a95d2c',
});

buycoin();
function sellcoin(){
  bittrex.tradesell({
    MarketName: MarketName,
    OrderType: 'LIMIT',
    Quantity: Quantity,//1.00000000,
    Rate: Rate,
    TimeInEffect: 'GOOD_TIL_CANCELLED', // supported options are 'IMMEDIATE_OR_CANCEL', 'GOOD_TIL_CANCELLED', 'FILL_OR_KILL'
    ConditionType: 'NONE', // supported options are 'NONE', 'GREATER_THAN', 'LESS_THAN'
    Target: 0, // used in conjunction with ConditionType
  }, function (data, err) {
    console.log(data);
  });
};

function buycoin() {
  bittrex.getbalance({ currency : 'ETH' }, function( data, err ) {
    console.log( data );
  });
}