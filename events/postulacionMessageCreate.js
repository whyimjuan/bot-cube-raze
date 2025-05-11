const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (message.author.bot) return;
    if (message.content === '!setpostulacion') {
      const applyButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('apply_button')
          .setLabel('Postularme')
          .setStyle(ButtonStyle.Primary)
      );
      await message.channel.send({
        content: '¡Postúlate para ser parte del staff!',
        components: [applyButton]
      });
    }
  }
};
