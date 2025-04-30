const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const warns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Elimina un warn de un usuario')
    .addUserOption(option => option.setName('usuario').setDescription('Usuario a desadvertir').setRequired(true)),

  async execute(interaction) {
    const usuario = interaction.options.getUser('usuario');

    if (!warns.has(usuario.id) || warns.get(usuario.id) === 0) {
      return interaction.reply({ content: `${usuario.tag} no tiene ningún warn.` });
    }

    warns.set(usuario.id, warns.get(usuario.id) - 1);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('Warn eliminado')
      .setDescription(`Se ha eliminado un warn de ${usuario.tag}. Total de warns: ${warns.get(usuario.id)}`)
      .setTimestamp()
      .setFooter({ text: 'Sistema de Warns' });

    await interaction.reply({ embeds: [embed] });
  }
};
