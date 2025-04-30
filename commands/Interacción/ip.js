const { EmbedBuilder, SlashCommandBuilder, InteractionType } = require('discord.js');

const embed = new EmbedBuilder()
  .setColor(0xAE03DE)
  .setTitle('Servidor de Minecraft')
  .addFields(
    { name: 'Dirección IP', value: 'CubeRaze.aternos.me:18552', inline: true },
    { name: 'Versión', value: '1.20.4', inline: true },
    { name: 'Jugadores conectados', value: '20/100', inline: true },
    { name: 'Descripción', value: '¡Bienvenido a nuestro server de aventuras!' },
  )
  .setTimestamp()
  .setFooter({ text: 'Servidor creado por Midominio' });

module.exports = {
data: new SlashCommandBuilder()
  .setName('ip')
  .setDescription('Muestra la información del servidor de Minecraft (fijo)'),
  async execute(interaction) {
    await interaction.reply({ embeds: [embed] })
  }
  } 




