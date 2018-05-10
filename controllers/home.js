const moment = require("moment");
const constants = require('../config/constants.json');
/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('home', {
    title: 'Home - Bitrain - Investment Smart',
    time_req: constants.COUNT_ENDING,
  });
};
/**
 * GET /
 * Home page.
 */
exports.home = (req, res) => {

  res.render('home', {
    title: 'Home - Bitrain - Investment Smart',
    time_req: constants.COUNT_ENDING,
  });
};
/**
 *
 * @param req
 * @param res
 */
exports.about = (req, res) => {
  res.render('about', {
    title: 'About - Bitrain - Investment Smart'
  });
};
/**
 *
 * @param req
 * @param res
 */
exports.service = (req, res) => {
  res.render('service', {
    title: 'Service - Bitrain - Investment Smart'
  });
};
/**
 *
 * @param req
 * @param res
 */
exports.faqs = (req, res) => {
  res.render('faqs', {
    title: 'FAQs - Bitrain - Investment Smart'
  });
};
/**
 *
 * @param req
 * @param res
 */
exports.contactus = (req, res) => {
  res.render('contactus', {
    title: 'Contact - Bitrain - Investment Smart'
  });
};
