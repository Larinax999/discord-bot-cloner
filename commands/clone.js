const Discord = require("discord.js")
if (!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
};
const prefixregex = /(\S)*(?=help)/i;
/**
 *
 *
 * @param {import("discord.js").Client} bot
 * @param {import("discord.js").Message} message
 * @param {String[]} args
 */
exports.run = async (bot, message, args) => {
    if (message.author != bot.user) return;
    let target = message.mentions.users.first();
    if (!target) return message.reply("กรุณาแท็คผู้ใช้")
    if (!target.bot) return message.reply("ต้องเป็นบอทเท่านั้น")
    let msg = await message.reply("กำลัง clone " + target.username)
    let prefix;
    if (!args[0]) {
        prefix = await new Promise(async (resolve) => {
            let prefix;
            if (target.presence.game && target.presence.game.name) {
                let prefix = target.presence.game.name.match(prefixregex);
                if (prefix) return resolve(prefix[0]);
            }
            if (!prefix) {
                prefix = await new Promise((resolve1) => {
                    setTimeout(() => {
                        if (!prefix) return resolve1(null);
                    }, 6000);

                    /**
                     * 
                     * @param {import("discord.js").Message} message 
                     */
                    const fun = (message) => {
                        if (message.author == target) {
                            bot.removeListener("message", fun)
                            if (message.content) {
                                scan(message.content)
                            }
                            if (message.embeds) {
                                let e = message.embeds.length
                                while (e--) {
                                    message.embeds[e].title && scan(message.embeds[e].title)
                                    message.embeds[e].description && scan(message.embeds[e].description)
                                    message.embeds[e].url && scan(message.embeds[e].url)
                                    if (message.embeds[e].author) {
                                        message.embeds[e].author.name && scan(message.embeds[e].author.name)
                                        message.embeds[e].author.url && scan(message.embeds[e].author.url)
                                    }
                                    if (message.embeds[e].footer) {
                                        message.embeds[e].footer.text && scan(message.embeds[e].footer.text)
                                    }
                                    if (message.embeds[e].fields) {
                                        let f = message.embeds[e].fields.length
                                        while (f--) {
                                            message.embeds[e].fields[f].name && scan(message.embeds[e].fields[f].name)
                                            message.embeds[e].fields[f].value && scan(message.embeds[e].fields[f].value)
                                        }
                                    }
                                }
                            }
                        }
                        async function scan(string) {
                            let match = string.match(prefixregex)
                            if (match) return resolve1(match[0])
                        }

                    }
                    bot.on("message", fun)
                    message.channel.send(`${target}`)
                })
                return resolve(prefix)
            }
        })
    } else prefix = args[1]

    if (!prefix) return msg.edit(`:x: ไม่พบ prefix ของ ${target.tag}`)
    await msg.edit(`prefix ของ ${target.tag} คือ \`${prefix}\``)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const hasclone = new Set();

    const tasklist = [];
    tasklist.push("help")
    let cloning = false;
    let tasktimer = setInterval(async () => {
        if (cloning) return;
        else {
            if (tasklist.length<=0) return clearInterval(tasktimer)
            clonecommand(tasklist[0])
            tasklist.shift()
        }
    }, 2000);
    async function clonecommand(command) {
        if (hasclone.has(command)) return cloning = false;
        hasclone.add(command);
        cloning = true;
        /**
         * @typedef {[{react:String,edit:{content:String,options:{}},del:boolean}]} react
         */
        /**
         * @type {{react: react,messages:[{react:react,content:[],options:{},isdm:boolean}]}}
         */
        const save = {
            react: [],
            messages: []
        };
        let thismsgtrack;
        let activing = true;
        /**
         * 
         * @param {import("discord.js").Message} message 
         */
        const fun = (msg) => {
            if (msg.author == target && (msg.channel.type == "dm" || msg.channel == message.channel)) {
                const react = [];
                let reacting = false;
                let reactcheck = setInterval(async () => {
                    if (reacting) reacting = false
                    else {
                        clearInterval(reactcheck)
                        const thismsg = {
                            react: [],
                            content: msg.content,
                            options: {
                                embed: msg.embeds ? msg.embeds[0] : null
                            },
                            isdm: msg.channel.type == "dm" ? true : false
                        }
                        console.log(react)
                        activing = true;
                        while (react[0]) {
                            activing = true;
                            const onedit = (oldmsg, newmsg) => {
                                activing = true;
                                if (newmsg.id == msg.id) {
                                    thismsg.react.push({
                                        react: react[0],
                                        edit: {
                                            content: newmsg.content,
                                            options: {
                                                embed: newmsg.embeds ? newmsg.embeds[0] : null,
                                            }
                                        },

                                    })
                                }
                            }

                            const ondelete = (delmsg) => {
                                activing = true;
                                if (delmsg.id == msg.id) {
                                    thismsg.react.push({
                                        react: react[0],
                                        del: true
                                    })
                                }
                            }
                            bot.on("messageDelete", ondelete)
                            bot.on("messageUpdate", onedit)
                            await msg.react(react[0])
                            await new Promise(resolve => {
                                setTimeout(() => {
                                    bot.removeListener("messageDelete", ondelete)
                                    bot.removeListener("messageUpdate", onedit)
                                    resolve()
                                }, 1500);
                            })
                            react.shift()
                        }
                        save.messages.push(thismsg)
                    }
                }, 2000);
                const addreact = (reaction, user) => {
                    if (user == target && reaction.message.id == msg.id) {
                        activing = true;
                        reacting = true;
                        react.push(reaction.emoji.toString())
                    }
                }
                bot.on('messageReactionAdd', addreact)
            }
        }
        bot.on("message", fun)


        let activecheck = setInterval(async () => {
            if (activing) activing = false
            else {
                clearInterval(activecheck)
                bot.removeListener('message', fun)
                console.log(save)
                bot.commands.set(command, {
                    run: async (bot, message, args) => {
                        if (save.react) {
                            for (let i = 0; i < save.react.length; i++) {
                                await message.react(save.react[i]);
                            }
                        }
                        for (let m = 0; m < save.messages.length; m++) {
                            let sendmsg = save.messages[m].isdm ? await message.author.send(save.messages[m].content, save.messages[m].options) : await message.channel.send(save.messages[m].content, save.messages[m].options)
                            if (save.messages[m].react) {
                                let awaitreact = false
                                for (let i = 0; i < save.messages[m].react.length; i++) {
                                    if (save.messages[m].react[i].edit || save.messages[m].react[i].del) awaitreact = true
                                    await sendmsg.react(save.messages[m].react[i].react);
                                }
                                if (awaitreact) {
                                    const filter = (reaction, user) => user == message.author;
                                    const collector = await sendmsg.createReactionCollector(filter, {
                                        time: 1000 * 60 * 60
                                    });
                                    collector.on('collect', async r => {
                                        let user = r.users.last()
                                        user.id != bot.user.id && r.remove(user);
                                        let emoji = r.emoji.toString();
                                        for (var i = 0; i < save.messages[m].react.length; i++) {
                                            if (save.messages[m].react[i].react == emoji) {
                                                if (save.messages[m].react[i].edit) {
                                                    if (save.messages[m].react[i].edit.options && save.messages[m].react[i].edit.options.embed) {
                                                        save.messages[m].react[i].edit.options.embed = new Discord.RichEmbed(save.messages[m].react[i].edit.options.embed)
                                                    }
                                                    sendmsg.edit(save.messages[m].react[i].edit.content, save.messages[m].react[i].edit.options)
                                                }
                                                if (save.messages[m].react[i].del) sendmsg.delete()
                                            }
                                        }
                                    });
                                    collector.on('end', () => {
                                        if (sendmsg) sendmsg.delete()
                                    });
                                }
                            }
                        }

                    }
                })
                let foundcommand = [];
                for (let i = 0; i < save.react.length; i++) {
                    if (save.react[i].edit) {
                        let matched = await scanregex({
                            content: save.react[i].edit.content,
                            embeds: save.react[i].edit.options ? [save.react[i].edit.options.embed] : null
                        }, new RegExp(`(?<=${escapeRegExp(prefix)})\\w*`, 'gi'))
                        if (matched) {
                            for (let m = 0; m < matched.length; m++) {
                                foundcommand.push(matched[m])
                            }
                        }
                    }
                }
                for (let m = 0; m < save.messages.length; m++) {
                    if (save.messages[m]) {
                        if (save.messages[m].react) {
                            for (let r = 0; r < save.messages[m].react.length; r++) {
                                if (save.messages[m].react[r].edit) {
                                    let matched = await scanregex({
                                        content: save.messages[m].react[r].edit.content,
                                        embeds: save.messages[m].react[r].edit.options ? [save.messages[m].react[r].edit.options.embed] : null
                                    }, new RegExp(`(?<=${escapeRegExp(prefix)})\\w*`, 'gi'))
                                    if (matched) {
                                        for (let m = 0; m < matched.length; m++) {
                                            foundcommand.push(matched[m])
                                        }
                                    }
                                }
                            }
                        }
                        let matched = await scanregex({
                            content: save.messages[m].content,
                            embeds: save.messages[m].options ? [save.messages[m].options.embed] : null
                        }, new RegExp(`(?<=${escapeRegExp(prefix)})\\w*`, 'gi'))
                        if (matched) {
                            for (let m = 0; m < matched.length; m++) {
                                foundcommand.push(matched[m])
                            }
                        }
                    }
                }
                console.log(foundcommand)
                for (let i = 0; i < foundcommand.length; i++) {
                    tasklist.push(foundcommand[i])
                }
                message.channel.send(`clone คำสั่ง ${command} ของ ${target.tag} ✅`)
                cloning = false;
            }
        }, 3000);
        thismsgtrack = await message.channel.send(`${prefix}${command}`)
        const addreact = (reaction, user) => {
            if (user == target && reaction.message.id == thismsgtrack.id) {
                activing = true
                save.react.push(reaction.emoji.toString())
            }
        }
        bot.on('messageReactionAdd', addreact)
        setTimeout(() => {
            bot.removeListener('messageReactionAdd', addreact)
        }, 5000);
        /**
         * 
         * @param {Discord.Message} msg 
         * @param {RegExp} regex 
         * @return {String[]}
         */
        function scanregex(msg, regex) {
            if (typeof (msg) == "string") {
                return msg.match(regex)
            }
            let matched = [];
            if (msg.content) {
                matchregex(msg.content)
            }
            if (msg.embeds) {
                let e = msg.embeds.length
                while (e--) {
                    if(!msg.embeds[e]) continue;
                    msg.embeds[e].title && matchregex(msg.embeds[e].title, regex)
                    msg.embeds[e].description && matchregex(msg.embeds[e].description)
                    msg.embeds[e].url && matchregex(msg.embeds[e].url)
                    if (msg.embeds[e].author) {
                        msg.embeds[e].author.name && matchregex(msg.embeds[e].author.name)
                        msg.embeds[e].author.url && matchregex(msg.embeds[e].author.url)
                    }
                    if (msg.embeds[e].footer) {
                        msg.embeds[e].footer.text && matchregex(msg.embeds[e].footer.text)
                    }
                    if (msg.embeds[e].fields) {
                        let f = msg.embeds[e].fields.length
                        while (f--) {
                            msg.embeds[e].fields[f].name && matchregex(msg.embeds[e].fields[f].name)
                            msg.embeds[e].fields[f].value && matchregex(msg.embeds[e].fields[f].value)
                        }
                    }
                }
            }

            /**
             * 
             * @param {String} string 
             * @return {String[]}
             */
            function matchregex(string) {
                let match = string.match(regex)
                console.log(string)
                if (match) {
                    for (let i = 0; i < match.length; i++) {
                        matched.push(match[i])
                    }
                }
            }
            return matched;
        }
    }
}
exports.conf = {
    aliases: []
};

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}