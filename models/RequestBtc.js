/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <luc@ltv.vn> on Jan 23, 2017
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relationship = require("mongoose-relationship");

const requestBtcSchema = new mongoose.Schema({
  user: { type: Schema.ObjectId, ref: 'User', childPath: 'requestBtc', },
  btc_req: Number,
  status_req: String,
  walletid: String,
  walletname: String,
}, { timestamps: true });

requestBtcSchema.plugin(relationship, { relationshipPathName: 'user' });
const RequestBtc = mongoose.model('RequestBtc', requestBtcSchema);

module.exports = RequestBtc;
