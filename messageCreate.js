const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = async (client, message) => {
  if (message.author.bot) return;

  const PREFIX = client.prefix;
  const mention = new RegExp(`^<@!?${client.user.id}>( |)$`);

  // Handle bot mention
  if (message.content.match(mention)) {
    const embed = new EmbedBuilder()
      .setDescription(`Need help? My prefix is: \`${PREFIX}\``)
      .setColor('#5865f2');
    return message.channel.send({ embeds: [embed] });
  }

  // Log message to file and activity log
  if (message.content && message.guild) {
    const logEntry = `[${new Date().toLocaleString()}] ${message.author.tag} said: ${message.content}`;
    console.log(
      '\x1b[36m%s\x1b[0m',
      message.guild.name,
      '\x1b[33m#' + message.channel.name,
      '\x1b[0m',
      message.author.tag,
      'said:',
      message.content
    );
    await logwrite(logEntry, message.guild.name, message.channel.name);
    logActivity(message.guild.id, `${message.author.tag} said: ${message.content}`);
  }

  // Link filtering
  let whitelinks = [];
  try {
    await fs.access('whitelinks.json');
    const whitelinkdomains = JSON.parse(await fs.readFile('whitelinks.json', 'utf-8'));
    whitelinks = whitelinkdomains.domains || [];
  } catch (error) {
    // Create whitelinks.json if it doesn't exist
    await fs.writeFile('whitelinks.json', JSON.stringify({ domains: [] }, null, 2));
  }

  if (message.content.includes('http') && message.guild) {
    if (!whitelinks.some(link => message.content.includes(link))) {
      try {
        const lastmsg = message.content;
        const linkEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setDescription(`A message by ${message.author} was deleted for containing an unknown link:\n\`${lastmsg}\``);
        await message.delete();
        await message.channel.send({ embeds: [linkEmbed] });
      } catch (error) {
        await message.channel.send('⚠️ Suspicious link alert! Moderators, please delete this link FAST!');
      }
    }
  }

  // Command handling
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  const [matchedPrefix] = message.content.match(prefixRegex);
  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();
  const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));

  if (!command) return;

  if (!message.guild.me.permissions.has(PermissionsBitField.Flags.SendMessages)) {
    return await message.author.dmChannel.send({
      content: `Excuse me, I don't have the permission to send messages in <#${message.channelId}>!`,
    }).catch(() => {});
  }

  if (!message.guild.me.permissions.has(PermissionsBitField.Flags.ViewChannel)) return;

  if (!message.guild.me.permissions.has(PermissionsBitField.Flags.EmbedLinks)) {
    return await message.channel.send({
      content: `Excuse me, I don't have the permission to embed links in <#${message.channelId}>!`,
    }).catch(() => {});
  }

  try {
    await command.run(client, message, args);
  } catch (error) {
    console.error(error);
    const embed = new EmbedBuilder()
      .setDescription(':warning: Unfortunately, an error occurred. Report sent to developer\'s console.')
      .setColor('#ff0000');
    await message.channel.send({ embeds: [embed] });
  }
};

// Log activity to memory (exported for use in main.js)
function logActivity(guildId, activity) {
  if (!global.activityLog.has(guildId)) global.activityLog.set(guildId, []);
  global.activityLog.get(guildId).push({ content: activity, time: new Date().toLocaleString() });
  if (global.activityLog.get(guildId).length > global.MAX_ACTIVITIES_PER_SERVER) {
    global.activityLog.get(guildId).shift();
  }
}

// Log to file with dynamic folder/file creation
async function logwrite(msg, server, chatroom) {
  const filepath = path.join('Serverwise', String(server), String(chatroom), 'MESSAGES.log');
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.appendFile(filepath, msg + '\n', 'utf-8');
}

// Make logActivity accessible globally
global.activityLog = new Map();
global.MAX_ACTIVITIES_PER_SERVER = 100;
global.logActivity = logActivity;
