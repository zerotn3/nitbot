/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <luc@ltv.vn> on Jan 17, 2017
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relationship = require("mongoose-relationship");

const walletTransactionSchema = new mongoose.Schema({
  user: { type: Schema.ObjectId, ref: 'User', childPath: 'wallet.transactions', },
  wallet: {
    type: String,
    enum: ["withdrawn", "direct", "upgrade", "overflow"]
  },
  amount: { type: Number, default: 0 },
}, { timestamps: true });

walletTransactionSchema.plugin(relationship, { relationshipPathName: 'user' });
const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;
