// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const canalOrigenId = '1368670946780778598';
    if (message.channel.id !== canalOrigenId) return;

    const lineas = message.content.split('\n');
    const primerRenglon = lineas[0];
    const contenido = lineas.slice(1).join('\n') || ' ';

    const canalMencionado = message.mentions.channels.first();
    if (!canalMencionado) {
      return message.reply('❌ Debes mencionar un canal en la primera línea del mensaje.');
    }

    // Detectar si contiene @everyone o @here
    const debeMencionarEveryone = message.content.includes('@everyone');
    const debeMencionarHere = message.content.includes('@here');

    const menciones = debeMencionarEveryone
      ? '@everyone'
      : debeMencionarHere
      ? '@here'
      : null;

    const embed = new EmbedBuilder()
      .setDescription(contenido)
      .setColor(0xfebf25)
      .setFooter({ text: 'CubeRaze Network ©' });

    if (message.attachments.size > 0) {
      const imagen = message.attachments.find(att => att.contentType?.startsWith('image/'));
      if (imagen) {
        embed.setImage(imagen.url);
      }
    }

    try {
      await canalMencionado.send({
        content: menciones || undefined,
        embeds: [embed],
      });
    } catch (error) {
      console.error('Error al enviar el embed:', error);
      message.reply('❌ Ocurrió un error al enviar el mensaje al canal mencionado.');
    }
  }
};
