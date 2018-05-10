const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const relationship = require("mongoose-relationship");
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const Config = require('./Config');
const constants = require('../config/constants.json');
const WalletTransaction = require('./WalletTransaction');
const { LVL_2, LVL_3, LVL_4, LVL_5 } = constants.UPGRADE_LEVEL;

const userSchema = new mongoose.Schema({
  email: String,
  username: { type: String, unique: true },
  password: String,
  full_nm: String,
  phone_no: String,
  id_blc: String,
  location: String,
  location_code: String,
  id_idf: String,
  password2: String,
  old_pass: String,
  new_pass: String,
  cf_new_pass: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  usr_role: Number,
  hash_cd: String,

  facebook: String,
  twitter: String,
  google: String,
  github: String,
  instagram: String,
  linkedin: String,
  steam: String,
  tokens: Array,
  active: Boolean,
  emailVerified: { type: Boolean, default: false },

  users: [{ type: Schema.ObjectId, ref: 'User' }],
  sponsor: {
    type: Schema.ObjectId,
    ref: 'User',
    childPath: 'children',
  },
  virSponsor: {
    type: Schema.ObjectId,
    ref: 'User',
    childPath: 'children',
  },

  country: {
    code: String,
    name: String
  },
  profile: {
    name: String,
    gender: { type: String, default: 'male' },
    location: String,
    website: String,
    picture: String,
    level: Number
  },
  wallet: {
    _preWithdrawn: { type: Number, default: 0 },
    withdrawn: {
      type: Number,
      default: 0,
      set: function (withdrawn) {
        this.wallet._preWithdrawn = this.wallet.withdrawn;
        const uH = require('../helpers/helper').user;
        uH.createTransaction(this, 'withdrawn', parseFloat((this.wallet.withdrawn - this.wallet._preWithdrawn).toFixed(8)));
        return withdrawn;
      }
    },
    _preDirect: { type: Number, default: 0 },
    direct: {
      type: Number,
      default: 0,
      set: function (direct) {
        this.wallet._preDirect = this.wallet.direct;
        const uH = require('../helpers/helper').user;
        uH.createTransaction(this, 'direct', parseFloat((this.wallet.direct - this.wallet._preDirect).toFixed(8)));
        return direct;
      }
    },
    _preUpgrade: { type: Number, default: 0 },
    upgrade: {
      type: Number,
      default: 0,
      set: function (upgrade) {
        this.wallet._preUpgrade = this.wallet.upgrade;
        const uH = require('../helpers/helper').user;
        uH.createTransaction(this, 'upgrade', parseFloat((this.wallet.upgrade - this.wallet._preUpgrade).toFixed(8)));
        return upgrade;
      }
    },
    _preOverflow: { type: Number, default: 0 },
    overflow: {
      type: Number,
      default: 0,
      set: function (overflow) {
        this.wallet._preOverflow = this.wallet.overflow;
        const uH = require('../helpers/helper').user;
        uH.createTransaction(this, 'overflow', parseFloat((this.wallet.overflow - this.wallet._preOverflow).toFixed(8)));
        return overflow;
      }
    },
    keepUpgrade: {
      [LVL_2]: { type: Number, default: 0 },
      [LVL_3]: { type: Number, default: 0 },
      [LVL_4]: { type: Number, default: 0 },
      [LVL_5]: { type: Number, default: 0 },
    },
    lastReceiver: { type: String },
    transactions: [{ type: Schema.ObjectId, ref: 'WalletTransaction' }],
  },
  requestBtc: [{ type: Schema.ObjectId, ref: 'RequestBtc' }],
  transferBtc: [{ type: Schema.ObjectId, ref: 'TransferBtc' }],
  refUser: { type: String },
}, { timestamps: true });

userSchema.plugin(relationship, { relationshipPathName: 'sponsor' });
userSchema.plugin(deepPopulate, {
  whitelist: [
    'users'
  ]
});

/**
 * Password hash middleware.
 */
userSchema.pre('save', function save(next) {
  const user = this;
  this.transactions = this.transactions || [];

  if (!user.isModified('password') && !user.isModified('wallet.upgrade') && !user.isModified('password2')) {
    return next();
  }

  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, null, (err, hash) => {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      });
    });
  }

  if (user.isModified('password2')) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password2, salt, null, (err, hash) => {
        if (err) {
          return next(err);
        }
        user.password2 = hash;
        next();
      });
    });
  }

  if (user.isModified('wallet.upgrade')) {
    const uH = require('../helpers/helper').user;
    uH.addTransaction(user, 'upgrade');
    uH.howMuchForNextLevel(user, (error, config) => {
      let valueForNextLvl = config.amount;
      let remainUpgrade = 0;

      if (user.wallet.upgrade >= valueForNextLvl) {
        remainUpgrade = parseFloat((user.wallet.upgrade - valueForNextLvl).toFixed(8));
        user.wallet.upgrade = 0;
        user.wallet.withdrawn = parseFloat((user.wallet.withdrawn + remainUpgrade).toFixed(8));
        user.profile.level += 1;

        const level = user.profile.level;
        const lvls = [0, 0, LVL_2, LVL_3, LVL_4, LVL_5];
        user.wallet.upgrade = parseFloat((user.wallet.upgrade + user.wallet.keepUpgrade[lvls[level]]).toFixed(8));
        user.wallet.keepUpgrade[lvls[level]] = 0;

        if (user.sponsor) {
          uH.sendSponsorUpgradeBTC(user, valueForNextLvl);
        }
      }

      next();
    });
  }
});

/**
 * Helper method for active user
 */
userSchema.methods.activeUser = function (hashCode) {
  const uH = require('../helpers/helper').user;
  return uH.activeUser(this, hashCode);
};

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for validating user's password2.
 */
userSchema.methods.comparePassword2 = function comparePassword(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password2, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function gravatar(size) {
  if (!size) {
    size = 200;
  }
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.avatar = function avatar() {
  return `/assets/images/${this.profile.gender || 'male'}.png`;
};

userSchema.methods.populateReferrals = function () {
  User.populate(this.users, { path: '_id' }, (err, usrLst) => {
    if (!err) {
      usrLst.forEach((usr) => {
        usr.populateReferrals();
      });
    }
  });
};

userSchema.methods.toTreeItem = function (parent) {
  const sponsor = `${this.sponsor}`;
  const virSponsor = `${this.virSponsor}`;
  const lastReceiver = `${this.wallet.lastReceiver}`;
  const sNm = global.userMap[sponsor] ? global.userMap[sponsor].username : '';
  const vsNm = global.userMap[virSponsor] ? global.userMap[virSponsor].username : '';
  const rcvNm = global.userMap[lastReceiver] ? global.userMap[lastReceiver].username : '';
  const wallet = {
    withdrawn: this.wallet.withdrawn,
    direct: this.wallet.direct,
    upgrade: this.wallet.upgrade,
    overflow: this.wallet.overflow,
  };
  let item = {
    text: {
      name: this.username,
      title: `Level ${this.profile.level || '0'}`,
      contact: `${this.email}|${this.phone_no}|${sNm}|${vsNm}|${JSON.stringify(wallet)}|${rcvNm}`
    },
    image: this.avatar(),
    HTMLid: (this._id._id || this._id).toString(),
  };

  if (parent)
    item.parent = parent;

  return item;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
