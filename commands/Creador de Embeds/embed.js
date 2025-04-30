const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Crea y envía un embed personalizado (solo admins)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('titulo')
        .setDescription('Título del embed')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('descripcion')
        .setDescription('Descripción del embed')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('url')
        .setDescription('URL para el título (opcional)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Color en hexadecimal, ej: #ff9900')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('imagen')
        .setDescription('URL de imagen grande')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('thumbnail')
        .setDescription('URL de miniatura')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('footer')
        .setDescription('Texto del footer')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('footer_icon')
        .setDescription('URL del ícono del footer')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('autor')
        .setDescription('Nombre del autor')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('autor_icon')
        .setDescription('URL del ícono del autor')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('timestamp')
        .setDescription('¿Agregar timestamp (fecha/hora actual)?')),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '🛑 Solo los administradores pueden usar este comando.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder();

    const titulo = interaction.options.getString('titulo');
    const descripcion = interaction.options.getString('descripcion');
    const url = interaction.options.getString('url');
    const color = interaction.options.getString('color');
    const imagen = interaction.options.getString('imagen');
    const thumbnail = interaction.options.getString('thumbnail');
    const footer = interaction.options.getString('footer');
    const footer_icon = interaction.options.getString('footer_icon');
    const autor = interaction.options.getString('autor');
    const autor_icon = interaction.options.getString('autor_icon');
    const timestamp = interaction.options.getBoolean('timestamp');

    if (titulo) embed.setTitle(titulo);
    if (descripcion) embed.setDescription(descripcion);
    if (url) embed.setURL(url);
    if (color) {
      embed.setColor(color.startsWith('#') ? parseInt(color.replace('#', ''), 16) : 0x0099ff);
    } else {
      embed.setColor(0x0099ff); 
    }
    if (imagen) embed.setImage(imagen);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (footer) embed.setFooter({ text: footer, iconURL: footer_icon || null });
    if (autor) embed.setAuthor({ name: autor, iconURL: autor_icon || null });
    if (timestamp) embed.setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
