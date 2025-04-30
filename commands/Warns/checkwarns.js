const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const warns = new Map(); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkwarns')
    .setDescription('Verifica cuántos warns tiene un usuario')
    .addUserOption(option => option.setName('usuario').setDescription('Usuario a verificar').setRequired(true)),

  async execute(interaction) {
    const usuario = interaction.options.getUser('usuario');

    const totalWarns = warns.get(usuario.id) || 0;

    const embed = new EmbedBuilder()
      .setColor(totalWarns > 0 ? 0xFF0000 : 0x00FF00)
      .setTitle('Verificación de Warns')
      .setDescription(`El usuario ${usuario.tag} tiene ${totalWarns} warn(s).`)
      .setTimestamp()
      .setFooter({ text: 'Sistema de Warns' });

    await interaction.reply({ embeds: [embed] });
  }
};
