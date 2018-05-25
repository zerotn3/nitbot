/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <tin@ltv.vn> on Jan 04, 2018
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relationship = require("mongoose-relationship");

const listCoinBuySellBittrexSchema = new mongoose.Schema({
  marketNn : String,
  enterPrice : Number,
  enterTime: String,
  percentSell: String,
  type: String,
  orderId: String,
  qty: Number,
  rate: Number
}, { timestamps: true });

//listCoinBittrexSchema.plugin(relationship, { relationshipPathName: 'user' });
const ListCoinBuySellBittrex = mongoose.model('ListCoinBuySellBittrex', listCoinBuySellBittrexSchema);

module.exports = ListCoinBuySellBittrex;
