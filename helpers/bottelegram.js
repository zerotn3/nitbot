/**
 * coonfig bot
 */

const TelegramBot = require('node-telegram-bot-api');
const token = '472833515:AAGXIRPigpyRKgO1NfLCPXBJ3R-5twUKBNw';
const bot = new TelegramBot(token, {polling: true});
//const idchanneltelegram = "-1001235356068"; //id group
const idchanneltelegram = "218238495"; // id bot

bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"
  console.log(chatId);
  bot.sendMessage(chatId, resp);
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(idchanneltelegram, "Biết vừa thôi, bị khử đấy !!!");
});

const sendMessageTelegramGroup = (message) => {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(function () {
        bot.sendMessage(idchanneltelegram, message)
      }, 1000);
      resolve(`Send Done`);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

const telegramBot = {
  sendMessageTelegramGroup: sendMessageTelegramGroup,
};



module.exports = telegramBot;