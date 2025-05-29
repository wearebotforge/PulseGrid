const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The member to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(target.id);

    // Check if member is bannable
    if (!member) {
      return interaction.reply({ content: `User not found in this server.`, ephemeral: true });
    }
    if (!member.bannable) {
      return interaction.reply({ content: `I cannot ban this user. They might have higher role or admin permissions.`, ephemeral: true });
    }
    if (member.id === interaction.user.id) {
      return interaction.reply({ content: `You cannot ban yourself!`, ephemeral: true });
    }
    if (member.id === interaction.guild.ownerId) {
      return interaction.reply({ content: `You cannot ban the server owner!`, ephemeral: true });
    }

    try {
      // DM the user
      try {
        await target.send(`You have been banned from **${interaction.guild.name}**.\nReason: ${reason}`);
      } catch (dmError) {
        // User might have DMs closed, ignore error
      }

      // Ban the user
      await member.ban({ reason });

      // Confirmation message to command user
      await interaction.reply({ content: `${target.tag} has been banned.\nReason: ${reason}`, ephemeral: false });

      // Log the ban in a specific channel if exists
      const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'mod-logs' || ch.name === 'logs');
      if (logChannel && logChannel.isTextBased()) {
        const embed = new EmbedBuilder()
          .setTitle('User Banned')
          .setColor('Red')
          .addFields(
            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
            { name: 'Reason', value: reason }
          )
          .setTimestamp();

        logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error banning member:', error);
      return interaction.reply({ content: `There was an error trying to ban this user.`, ephemeral: true });
    }
  }
};
