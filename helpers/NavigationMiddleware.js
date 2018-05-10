/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <luc@ltv.vn> on Jan 19, 2017
 */
const h = require('../helpers/helper');

module.exports = (req, res, next) => {
  if (req.user) {
    h.calcDataForNav(req.user)
      .then((data) => {
        res.locals.count_ending = data.countEnding;
        res.locals.downline = data.downLine < 0 ? 0 : data.downLine;
        res.locals.countF1 = data.countF1;
        return next();
      })
      .catch((err) => {
        console.log("Could not init data for navigation. Errors: ", err);
        return next();
      });
  } else {
    return next();
  }
};