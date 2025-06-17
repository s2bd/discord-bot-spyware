const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const express = require('express');
const app = express();

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// In-memory storage for server activities
const activityLog = new Map();
const MAX_ACTIVITIES_PER_SERVER = 100;

// Load commands
client.commands = new Map();
client.aliases = new Map();
client.prefix = 'mux, ';

// Load messageCreate handler
const messageCreate = require('./messageCreate');
client.on('messageCreate', (message) => messageCreate(client, message));

// Load other event handlers
client.on('guildMemberAdd', (member) => {
  const activity = `[${new Date().toLocaleString()}] Member ${member.user.tag} joined!`;
  logActivity(member.guild.id, activity);
  console.log(activity);
});

client.on('guildMemberRemove', (member) => {
  const activity = `[${new Date().toLocaleString()}] Member ${member.user.tag} removed!`;
  logActivity(member.guild.id, activity);
  console.log(activity);
});

client.on('roleCreate', (role) => {
  const activity = `[${new Date().toLocaleString()}] Role ${role.name} was created!`;
  logActivity(role.guild.id, activity);
  console.log(activity);
});

client.on('roleDelete', (role) => {
  const activity = `[${new Date().toLocaleString()}] Role ${role.name} was deleted!`;
  logActivity(role.guild.id, activity);
  console.log(activity);
});

client.on('channelCreate', (channel) => {
  if (channel.isTextBased()) {
    const activity = `[${new Date().toLocaleString()}] Channel #${channel.name} was created!`;
    logActivity(channel.guild.id, activity);
    console.log(activity);
  }
});

client.on('channelDelete', (channel) => {
  if (channel.isTextBased()) {
    const activity = `[${new Date().toLocaleString()}] Channel #${channel.name} was deleted!`;
    logActivity(channel.guild.id, activity);
    console.log(activity);
  }
});

client.on('channelUpdate', (oldChannel, newChannel) => {
  if (newChannel.isTextBased()) {
    const activity = `[${new Date().toLocaleString()}] Channel #${newChannel.name} updated!`;
    logActivity(newChannel.guild.id, activity);
    console.log(activity);
  }
});

// Log activity to memory
function logActivity(guildId, activity) {
  if (!activityLog.has(guildId)) activityLog.set(guildId, []);
  activityLog.get(guildId).push({ content: activity, time: new Date().toLocaleString() });
  if (activityLog.get(guildId).length > MAX_ACTIVITIES_PER_SERVER) {
    activityLog.get(guildId).shift();
  }
}

// Express setup
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', async (req, res) => {
  const servers = [];
  for (const guild of client.guilds.cache.values()) {
    const members = guild.members.cache.map(member => ({
      name: member.user.tag,
      id: member.user.id,
      avatar: member.user.avatarURL() || 'https://cdn.discordapp.com/embed/avatars/0.png',
    }));
    const activities = activityLog.get(guild.id) || [];
    servers.push({
      name: guild.name,
      id: guild.id,
      memberCount: members.length,
      members,
      activityCount: activities.length,
      activities,
    });
  }
  res.render('dashboard', { servers });
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});

// Login to Discord
client.once('ready', () => {
  console.log(`Guardian Discord Bot\n${'-'.repeat(69)}`);
  console.log(`Logged in as: ${client.user.tag} with ID: ${client.user.id}`);
  const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
  console.log(`Invite Link: ${inviteLink}`);
  console.log(`╭─${'━'.repeat(49)}╮`);
  console.log(" LIVE CHAT LOG - See the Serverwise Logs For Details ");
  console.log(`╰─${'━'.repeat(49)}╯`);
});

client.login(process.env.TOKEN);
