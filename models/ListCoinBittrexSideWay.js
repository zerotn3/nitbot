/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <tin@ltv.vn> on Jan 04, 2018
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relationship = require("mongoose-relationship");

const listCoinBittrexSideWaySchema = new mongoose.Schema({
  marketNn : String,
  volume: Number,
  spread: Number,
  adx: Number,
  trend: String
}, { timestamps: true });

const ListCoinBittrexSideWay = mongoose.model('ListCoinBittrexSideWay', listCoinBittrexSideWaySchema);

module.exports = ListCoinBittrexSideWay;
