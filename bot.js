const path = require('path');
global.appRoot = path.resolve(__dirname);
const Discord = require("discord.js")
global.config = require("./config/config")
global.prefix = config.prefix;
const bot = new Discord.Client();
require('./config/command')(bot);
require('./config/event')(bot);
bot.login(config.token)