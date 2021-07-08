const prefixregex = /(\S)*(?=help)/i;
const EventEmitter = require('events');

if (!Array.prototype.last) {
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
};
/**
 * @typedef {[{react:String,edit:{content:String,options:{}},del:boolean}]} react
 */
class Cloner extends EventEmitter {
    /**
     * 
     * @param {import('discord.js').Client} bot 
     * @param {import('discord.js').User} target 
     * @param {import('discord.js').TextChannel} channel 
     */
    constructor(bot, target, channel) {
        super()
        this.bot = bot;
        this.channel = channel;
        this.hasclone = new Set();
        this.tasklist = [];
        this.prefix = null;
        this.target = target
        this.cloning = false;
        this.tasktimer = setInterval(async () => {
            if (this.cloning) return;
            else {
                if (this.tasklist.length <= 0) return;
                if(this.tasklist[0]) this.clonecommand(this.tasklist[0])
                this.tasklist.shift()
            }
        }, 2000);
    }
    findprefix() {
        return new Promise(async (resolve) => {

            if (this.target.presence.game && this.target.presence.game.name) {
                this.prefix = this.target.presence.game.name.match(prefixregex);
                if (this.prefix) return resolve(prefix[0]);
            }
            if (!this.prefix) {
                this.prefix = await new Promise((resolve1) => {
                    setTimeout(() => {
                        if (!this.prefix) return resolve1(null);
                    }, 6000);

                    /**
                     * 
                     * @param {import("discord.js").Message} message 
                     */
                    const fun = (message) => {
                        if (message.author == this.target) {
                            this.bot.removeListener("message", fun)
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
                    this.bot.on("message", fun)
                    this.channel.send(`${this.target}`)
                })
                return resolve(this.prefix)
            }
        })
    }
    save() {}
	add(command) {
		this.tasklist.push(command)
	}
    load() {

    }
    cloneall() {
        this.tasklist.push("help")
    }
    async clonecommand(command) {
        if (this.hasclone.has(command)) return this.cloning = false;
        this.hasclone.add(command);
        this.cloning = true;
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
            if (msg.author == this.target && (msg.channel.type == "dm" || msg.channel == this.channel)) {
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
                            this.bot.on("messageDelete", ondelete)
                            this.bot.on("messageUpdate", onedit)
                            await msg.react(react[0])
                            await new Promise(resolve => {
                                setTimeout(() => {
                                    this.bot.removeListener("messageDelete", ondelete)
                                    this.bot.removeListener("messageUpdate", onedit)
                                    resolve()
                                }, 1500);
                            })
                            react.shift()
                        }
                        save.messages.push(thismsg)
                    }
                }, 2000);
                const addreact = (reaction, user) => {
                    if (user == this.target && reaction.message.id == msg.id) {
                        activing = true;
                        reacting = true;
                        react.push(reaction.emoji.toString())
                    }
                }
                this.bot.on('messageReactionAdd', addreact)
            }
        }
        this.bot.on("message", fun)


        let activecheck = setInterval(async () => {
            if (activing) activing = false
            else {
                clearInterval(activecheck)
                this.bot.removeListener('message', fun)
                this.bot.commands.set(command, {
                    run: async (bot, message, args) => {
                        if (save.react) {
                            for (let i = 0; i < save.react.length; i++) {
                                await message.react(save.react[i]);
                            }
                        }
                        for (let m = 0; m < save.messages.length; m++) {
                            let sendmsg = save.messages[m].isdm ? await message.author.send(save.messages[m].content, save.messages[m].options) : await this.channel.send(save.messages[m].content, save.messages[m].options)
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
                        }, new RegExp(`(?<=${escapeRegExp(this.prefix)})\\w*`, 'gi'))
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
                                    }, new RegExp(`(?<=${escapeRegExp(this.prefix)})\\w*`, 'gi'))
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
                        }, new RegExp(`(?<=${escapeRegExp(this.prefix)})\\w*`, 'gi'))
                        if (matched) {
                            for (let m = 0; m < matched.length; m++) {
                                foundcommand.push(matched[m])
                            }
                        }
                    }
                }
                for (let i = 0; i < foundcommand.length; i++) {
                    this.tasklist.push(foundcommand[i])
                }
                this.emit("cloned",{...save,name:command})
                this.cloning = false;
            }
        }, 3000);
        thismsgtrack = await this.channel.send(`${this.prefix}${command}`)
        const addreact = (reaction, user) => {
            if (user == this.target && reaction.message.id == thismsgtrack.id) {
                activing = true
                save.react.push(reaction.emoji.toString())
            }
        }
        this.bot.on('messageReactionAdd', addreact)
        setTimeout(() => {
            this.bot.removeListener('messageReactionAdd', addreact)
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
                    if (!msg.embeds[e]) continue;
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
                if (match) {
                    for (let i = 0; i < match.length; i++) {
                        matched.push(match[i])
                    }
                }
            }
            return matched;
        }
    }
    destroy() {
        clearInterval(this.tasktimer)
        this.removeAllListeners()
    }

}


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
module.exports = Cloner;