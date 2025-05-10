// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const canalOrigenId = '1368670946780778598';
    if (message.channel.id !== canalOrigenId) return;

    const lineas = message.content.split('\n');
    const canalMencionado = message.mentions.channels.first();
    if (!canalMencionado) {
      return message.reply('❌ Debes mencionar un canal en la primera línea del mensaje.');
    }

    // Detectar menciones @everyone o @here
    const mencionaEveryone = message.content.includes('@everyone');
    const mencionaHere = message.content.includes('@here');
    const mención = mencionaEveryone ? '@everyone' : mencionaHere ? '@here' : null;

    // Eliminar la mención y el canal mencionado del contenido del embed
    const contenidoSinMencion = lineas
      .slice(1)
      .join('\n')
      .replace(/@everyone/g, '')
      .replace(/@here/g, '')
      .trim();

    const embed = new EmbedBuilder()
      .setDescription(contenidoSinMencion || ' ')
      .setColor(0xfebf25)
      .setFooter({ text: 'CubeRaze Network ©' });

    // Agregar imagen si hay
    if (message.attachments.size > 0) {
      const imagen = message.attachments.find(att => att.contentType?.startsWith('image/'));
      if (imagen) {
        embed.setImage(imagen.url);
      }
    }

    try {
      await canalMencionado.send({
        content: mención || undefined,
        embeds: [embed],
      });
    } catch (error) {
      console.error('Error al enviar el embed:', error);
      message.reply('❌ Ocurrió un error al enviar el mensaje al canal mencionado.');
    }
  }
};
