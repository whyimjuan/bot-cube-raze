const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea a un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a banear')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('razón')
        .setDescription('Razón del ban')
        .setRequired(false)
    ),

  async execute(interaction) {
   
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({ content: 'No tienes permisos para usar este comando.', ephemeral: true });
    }

    const usuario = interaction.options.getUser('usuario');
    const razón = interaction.options.getString('razón') || 'No se proporcionó una razón';

    if (!interaction.guild.me.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({ content: 'No tengo permisos para banear a los usuarios.', ephemeral: true });
    }


    if (usuario.id === interaction.user.id) {
      return interaction.reply({ content: 'No puedes banearte a ti mismo.', ephemeral: true });
    }

   
    if (usuario.id === interaction.guild.ownerId) {
      return interaction.reply({ content: 'No puedes banear al dueño del servidor.', ephemeral: true });
    }

    try {
      await interaction.guild.members.ban(usuario, { reason: razón });
      return interaction.reply({ content: `${usuario.tag} ha sido baneado por: ${razón}` });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: 'Hubo un error al intentar banear al usuario.', ephemeral: true });
    }
  }
};
