const { MessageEmbed, Permissions } = require("discord.js");
const fs = require('fs');
module.exports = async (client, message) => {
    if (message.author.bot) return;
    const PREFIX = client.prefix;
    const mention = new RegExp(`^<@!?${client.user.id}>( |)$`);
    if (message.content.match(mention)) {
        const embed = new MessageEmbed()
        .setDescription(`Need help? My prefix is: \`${PREFIX}\``)
        .setColor('#5865f2');
    };
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`);
    function logwrite(msg, server, chatroom) {fs.mkdirSync('Serverwise/'+String(server)+'/'+String(chatroom)+'/', { recursive: true }); fs.appendFileSync('Serverwise/'+String(server)+'/'+String(chatroom)+'/'+'MESSAGES.log', msg+'\n', function (err) {if (err) throw err; });}; // logwrite, Serverwise, FoxBot-Old
    const whitelinkdomains = JSON.parse(fs.readFileSync('whitelinks.json'));
    const whitelinks = whitelinkdomains.domains;
    if (message.content.includes('http')) {
      if(!whitelinks.some(link => message.content.includes(link))){
        try {
        let lastmsg = message.content;
        const link_embed = new MessageEmbed().setColor('#ff0000').setDescription(`A message by ${message.author} was deleted for containing an unknown link:\n\`${lastmsg}\``);
        message.delete()
        message.channel.send({embeds: [link_embed]})
        } catch (error) {
        message.channel.send('⚠️ Suspicious link alert! Moderators, please delete this link FAST!')
        }
    }
};
    if (message.content) { console.log('\x1b[36m%s\x1b[0m',message.channel.guild.name,"\x1b[33m#"+message.channel.name,"\x1b[0m", message.author.username + "#" + message.author.discriminator, "said: ", message.content); logwrite(`[${String(new Date).split(" ", 5).join(" ")}]`+ String(message.author.username) + "#" + String(message.author.discriminator) + " said: " + String(message.content), message.channel.guild.name, message.channel.name);}; // MESSAGE LOG
    if (!prefixRegex.test(message.content)) return;
    const [ matchedPrefix ] = message.content.match(prefixRegex);
    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
    if (!command) return; ;
    if(!message.guild.me.permissions.has(Permissions.FLAGS.SEND_MESSAGES)) return await message.author.dmChannel.send({ content: `Excuse me, I don't have the permission to send messages in <#${message.channelId}>!`}).catch(() => {});
    if(!message.guild.me.permissions.has(Permissions.FLAGS.VIEW_CHANNEL)) return;
    if(!message.guild.me.permissions.has(Permissions.FLAGS.EMBED_LINKS)) return await message.channel.send({ content: `Excuse me, I don't have the permission to embed links in <#${message.channelId}>!`}).catch(() => {});
    try{
        command.run(client, message, args);
    } catch (error) {
        console.log(error);
        const embed = new MessageEmbed()
        .setDescription(`
        :warning: Unfortunately, an error occurred. Report sent to developer's console.
        `)
        .setColor('#ff0000');
        return message.channel.send({ embeds: [embed] });
    }
}
