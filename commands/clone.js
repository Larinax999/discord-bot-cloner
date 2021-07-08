const Discord = require("discord.js");
const Cloner = require(`../scripts/cloner`)
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

    const cloner = new Cloner(bot, target, message.channel)
    if (!args[1]) await cloner.findprefix()
    else cloner.prefix = args[1]
    if (!cloner.prefix) {
        cloner.destroy()
        return msg.edit(`:x: ไม่พบ prefix ของ ${target.tag}`)
    }
    await msg.edit(`prefix ของ ${target.tag} คือ \`${cloner.prefix}\``)
	for (let i=2;i < args.length;i++) {
		cloner.add(args[i])
	}
    await new Promise((resolve) => setTimeout(resolve, 1000))
    cloner.cloneall()
    cloner.on("cloned",(command)=>{
        message.channel.send(`clone คำสั่ง ${command.name} ของ ${target.tag} ✅`)
    })
}
exports.conf = {
    aliases: []
};