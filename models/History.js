/**
 * Copyright © 2016 LTV Co., Ltd. All Rights Reserved.
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by luc <luc@ltv.vn> on Jan 17, 2017
 */
const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  type: { type: String, unique: true },
  value: { type: String, required: true },
}, { timestamps: true });

const History = mongoose.model('History', historySchema);

module.exports = History;
