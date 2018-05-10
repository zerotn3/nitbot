/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <tin@ltv.vn> on Jan 04, 2018
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relationship = require("mongoose-relationship");

const listCoinBittrexCheckedSchema = new mongoose.Schema({
  marketNn : String,
  enterPrice : Number,
  lastTime: Number,
  matchPrice: Number,
}, { timestamps: true });

//listCoinBittrexSchema.plugin(relationship, { relationshipPathName: 'user' });
const ListCoinBittrexChecked = mongoose.model('ListCoinBittrexChecked', listCoinBittrexCheckedSchema);

module.exports = ListCoinBittrexChecked;
