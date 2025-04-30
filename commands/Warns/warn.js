const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const warns = new Map(); 

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advierte a un usuario')
    .addUserOption(option => option.setName('usuario').setDescription('Usuario a advertir').setRequired(true)),

  async execute(interaction) {
    const usuario = interaction.options.getUser('usuario');

    
    if (!usuario) {
      return interaction.reply({ content: '¡Debes mencionar a un usuario!', ephemeral: true });
    }

    
    if (!warns.has(usuario.id)) {
      warns.set(usuario.id, 1); 
    } else {
      warns.set(usuario.id, warns.get(usuario.id) + 1); 
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('Warn emitido')
      .setDescription(`Se ha dado un warn a ${usuario.tag}. Total de warns: ${warns.get(usuario.id)}`)
      .setTimestamp()
      .setFooter({ text: 'Sistema de Warns' });

    await interaction.reply({ embeds: [embed] });
  }
};
