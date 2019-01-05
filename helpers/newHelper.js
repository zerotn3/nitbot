const bb = require('technicalindicators');
const _ = require('lodash');

const EMA = bb.EMA;
const ROC = bb.ROC;
const SMA = bb.SMA;

/**
 * AK Trend
 * @param close
 * @param input1 // 9
 * @param input2 // 24
 */
const AkFunctions = (close, input1, input2) => {
  const fastAaa = EMA.calculate({ period: input1, values: close });
  const fastAab = EMA.calculate({ period: input2, values: close });
  return (_.last(fastAaa) - _.last(fastAab)) * 1.001;
};

/**
 * Absolute Momentum
 * @param p LookBack Period - 25
 * @param sm Smooth Period - 10
 * @param close Close price
 * @param closeAsMonth
 */
const AmFunction = (p, sm, close, closeAsMonth) => {
  const rc = ROC.calculate({ period: p, values: close });
  const bilr = ROC.calculate({ period: p, values: closeAsMonth });
  const arr = [];
  for (const i in rc) {
    if (i > 25) break;
    for (const j in bilr) {
      if (i === j) arr.push(rc[i] - bilr[j]);
    }
  }
  // const rcdm = _.last(rc) - _.last(bilr); // blue
  const blue = _.last(arr);
  const srcdmRed = SMA.calculate({ period: sm, values: arr }); // red
  const red = _.last(srcdmRed);
  return { blue, red };
};

const newHelpers = {
  AkFunctions,
  AmFunction
};

module.exports = newHelpers;
