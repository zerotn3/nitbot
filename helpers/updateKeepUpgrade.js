const mongoose = require('mongoose');
const dotenv = require('dotenv');
const env = process.env.NODE_ENV || "development";
const helper = require('../helpers/helper');
const constants = require('../config/constants.json');
const User = require('../models/User');
const { LVL_2, LVL_3, LVL_4, LVL_5 } = constants.UPGRADE_LEVEL;

if (env == 'development') {
  dotenv.load({ path: '.env' });
}

const addKeepUpgrade = () => {
  return new Promise((resolve, reject) => {
    User.find({})
      .then((users) => {
        users.forEach((user) => {
          user.wallet.keepUpgrade = {
            [LVL_2]: 0,
            [LVL_3]: 0,
            [LVL_4]: 0,
            [LVL_5]: 0,
          };

          user.save((err) => {
            if (err) {
              console.log(`Could not save user ${user.username}, ${user.full_nm}`);
            } else {
              console.log(`Changed ${user.full_nm}`);
            }
          });
        });

        resolve(users);
      })
      .catch((err) => {
        console.log(`Error: ${err.message}`);
        reject(err);
      });
  });
};

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI, (error) => {
  if (error) {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
  }

  addKeepUpgrade()
    .then(() => {
      console.log('addKeepUpgrade -> DONE');
    });
});
