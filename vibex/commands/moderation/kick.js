const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The member to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({ content: `User not found in this server.`, ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({ content: `I cannot kick this user. They might have higher role or admin permissions.`, ephemeral: true });
    }
    if (member.id === interaction.user.id) {
      return interaction.reply({ content: `You cannot kick yourself!`, ephemeral: true });
    }
    if (member.id === interaction.guild.ownerId) {
      return interaction.reply({ content: `You cannot kick the server owner!`, ephemeral: true });
    }

    try {
      // DM the user about kick
      try {
        await target.send(`You have been kicked from **${interaction.guild.name}**.\nReason: ${reason}`);
      } catch {
        // DMs might be closed, ignore error
      }

      await member.kick(reason);

      await interaction.reply({ content: `${target.tag} has been kicked.\nReason: ${reason}`, ephemeral: false });

      // Log channel
      const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'mod-logs' || ch.name === 'logs');
      if (logChannel && logChannel.isTextBased()) {
        const embed = new EmbedBuilder()
          .setTitle('User Kicked')
          .setColor('Orange')
          .addFields(
            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
            { name: 'Reason', value: reason }
          )
          .setTimestamp();

        logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error kicking member:', error);
      return interaction.reply({ content: `There was an error trying to kick this user.`, ephemeral: true });
    }
  }
};
