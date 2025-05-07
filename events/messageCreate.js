// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Evita que el bot se responda a sí mismo
    if (message.author.bot) return;

    // ID del canal origen y destino
    const canalOrigenId = '1368670946780778598';
    const canalDestinoId = '1366071252606914733';

    // Solo responde si el mensaje viene del canal específico
    if (message.channel.id !== canalOrigenId) return;

    // Crear el embed
    const embed = new EmbedBuilder()
      .setDescription(message.content)
      .setColor(#febf25);

    // Obtener el canal destino y enviar el embed
    const canalDestino = message.client.channels.cache.get(canalDestinoId);
    if (canalDestino) {
      canalDestino.send({ embeds: [embed] });
    } else {
      console.error('No se pudo encontrar el canal destino.');
    }
  }
};
