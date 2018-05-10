/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <luc@ltv.vn> on Jan 23, 2017
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relationship = require("mongoose-relationship");

const transferBtcSchema = new mongoose.Schema({
  user: { type: Schema.ObjectId, ref: 'User', childPath: 'transferBtc', },
  username_rec: String,
  amounTransder: Number,
  status_trans: String,
}, { timestamps: true });

transferBtcSchema.plugin(relationship, { relationshipPathName: 'user' });
const TransferBtc = mongoose.model('TransferBtc', transferBtcSchema);

module.exports = TransferBtc;
