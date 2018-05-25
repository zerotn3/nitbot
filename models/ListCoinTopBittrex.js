/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <tin@ltv.vn> on Jan 04, 2018
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relationship = require("mongoose-relationship");

const listCoinTopBittrexSchema = new mongoose.Schema({
  marketNn : String,
  minTradeSize : Number,
  enterPrice : Number,
  lastTime: Number,
  matchPrice: Number,
  baseVol: Number,
  buyFlag: String,
  sellFlag: String,
  activeFlag: String,
  percentSell: Number,
  buy_pri: Number,
  btcQty: Number,
}, { timestamps: true });

//listCoinBittrexSchema.plugin(relationship, { relationshipPathName: 'user' });
const ListCoinTopBittrex = mongoose.model('ListCoinTopBittrex', listCoinTopBittrexSchema);

module.exports = ListCoinTopBittrex;
