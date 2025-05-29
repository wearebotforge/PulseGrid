const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warnsFile = path.join(__dirname, '../../../data/warns.json');

// Load warns or initialize
function loadWarns() {
  if (!fs.existsSync(warnsFile)) {
    fs.writeFileSync(warnsFile, JSON.stringify({}));
  }
  const data = fs.readFileSync(warnsFile);
  return JSON.parse(data);
}

// Save warns
function saveWarns(warns) {
  fs.writeFileSync(warnsFile, JSON.stringify(warns, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option => option.setName('target').setDescription('User to warn').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for warning').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: `User not found in this server.`, ephemeral: true });
    }
    if (member.id === interaction.user.id) {
      return interaction.reply({ content: `You cannot warn yourself!`, ephemeral: true });
    }
    if (member.id === interaction.guild.ownerId) {
      return interaction.reply({ content: `You cannot warn the server owner!`, ephemeral: true });
    }

    // Load current warnings
    const warns = loadWarns();
    if (!warns[interaction.guild.id]) warns[interaction.guild.id] = {};
    if (!warns[interaction.guild.id][target.id]) warns[interaction.guild.id][target.id] = [];

    // Add new warning
    warns[interaction.guild.id][target.id].push({
      moderator: interaction.user.id,
      reason,
      date: new Date().toISOString(),
    });

    // Save updated warnings
    saveWarns(warns);

    // DM the user a warning
    try {
      await target.send(`You have been warned in **${interaction.guild.name}**.\nReason: ${reason}`);
    } catch {
      // ignore if DM fails
    }

    // Reply in channel
    await interaction.reply({
      content: `${target.tag} has been warned.\nReason: ${reason}`,
      ephemeral: false,
    });

    // Log channel
    const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'mod-logs' || ch.name === 'logs');
    if (logChannel && logChannel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setTitle('User Warned')
        .setColor('Yellow')
        .addFields(
          { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Total Warnings', value: warns[interaction.guild.id][target.id].length.toString() }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
    }
  },
};
