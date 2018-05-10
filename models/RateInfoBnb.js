/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <tin@ltv.vn> on Jan 04, 2018
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relationship = require("mongoose-relationship");

const rateInfoBnbSchema = new mongoose.Schema({
  marketNn : String,
  status : String,
  stepSize: Number,
  minQty: Number,
  maxQty: Number,
}, { timestamps: true });

const RateInfoBnb = mongoose.model('RateInfoBnb', rateInfoBnbSchema);

module.exports = RateInfoBnb;
