// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const canalOrigenId = '1368670946780778598';
    const canalDestinoId = '1366071252606914733';

    if (message.channel.id !== canalOrigenId) return;

    // Separar el mensaje en líneas
    const lineas = message.content.split('\n');
    const titulo = lineas[0] || 'Sin título';
    const descripcion = lineas.slice(1).join('\n') || ' ';

    // Crear el embed
    const embed = new EmbedBuilder()
      .setTitle(titulo)
      .setDescription(descripcion)
      .setColor(0xfebf25);

    // Adjuntar imagen si existe
    if (message.attachments.size > 0) {
      const imagen = message.attachments.find(att => att.contentType?.startsWith('image/'));
      if (imagen) {
        embed.setImage(imagen.url);
      }
    }

    const canalDestino = message.client.channels.cache.get(canalDestinoId);
    if (canalDestino) {
      canalDestino.send({ embeds: [embed] });
    } else {
      console.error('No se pudo encontrar el canal destino.');
    }
  }
};
