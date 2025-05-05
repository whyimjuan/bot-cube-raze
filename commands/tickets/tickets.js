const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, Events, ChannelType } = require('discord.js');
require('dotenv').config();

const TICKETS_CATEGORY_ID = '1368050092564807761';
const CLOSED_CATEGORY_ID = '1368049954609692743';
const STAFF_ROLE_ID = '1358617654071394377';

let ticketCounter = 1;
const ticketMetadata = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, () => {
  console.log(`Sistema de Tickets ${client.user.tag}`);
  client.user.setPresence({
    status: 'online',
    activities: [{
      name: 'CubeRaze.aternos.me',
      type: 4,
    }],
  });
});

client.on('messageCreate', async (message) => {
  if (message.content === '!setticketchannel' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    const embed = new EmbedBuilder()
      .setTitle('📫 Soporte de CubeRaze')
      .setDescription(`**¿NECESITAS AYUDA?**\n\nAbre un ticket para recibir ayuda del equipo del STAFF de CubeRaze.`)
      .setColor(0xAE03DE);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_menu')
      .setPlaceholder('Selecciona una categoría...')
      .addOptions([
        { label: 'General', emoji: '🌍', value: 'general' },
        { label: 'Bugs', emoji: '🛠️', value: 'bugs' },
        { label: 'Reportar jugador', emoji: '❌', value: 'reportar_jugador' },
        { label: 'Apelacion', emoji: '🙏', value: 'apelacion' },
        { label: 'Creador de contenido', emoji: '🎥', value: 'creador_contenido' },
        { label: 'Tienda Web', emoji: '🛒', value: 'tienda_web' },
        { label: 'Reportar STAFF', emoji: '⭕', value: 'reportar_staff' },
        { label: 'Otros', emoji: '❓', value: 'otros' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);
    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${interaction.values[0]}`)
      .setTitle('Formulario de Soporte')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('usuario').setLabel('¿Cuál es tu nombre de usuario?').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('modalidad').setLabel('¿En qué modalidad ocurrió el problema?').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('descripcion').setLabel('Describe tu problema').setStyle(TextInputStyle.Paragraph).setRequired(true)
        )
      );
    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
    const categoria = interaction.customId.split('_')[2];
    const usuario = interaction.fields.getTextInputValue('usuario');
    const modalidad = interaction.fields.getTextInputValue('modalidad');
    const descripcion = interaction.fields.getTextInputValue('descripcion');
    const ticketId = ticketCounter++;
    const channelName = `🟢-ticket-${ticketId}`;

    const ticketChannel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: TICKETS_CATEGORY_ID,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageChannels] },
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ],
    });

    const infoEmbed = new EmbedBuilder()
      .setTitle('📝 Detalles del Ticket')
      .addFields(
        { name: '👤 Usuario', value: usuario, inline: true },
        { name: '🎮 Modalidad', value: modalidad, inline: true },
        { name: '📝 Descripción', value: descripcion },
        { name: '🧑‍💼 Reclamado por', value: '> (Este ticket no ha sido reclamado)' },
        { name: '❗ Importante', value: '¡Recuerda no mencionar al Staff! Te atenderán lo antes posible.' }
      )
      .setFooter({ text: `Creado el ${new Date().toLocaleString()}` })
      .setColor(0xAE03DE);

    const statusMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_status')
      .setPlaceholder('Selecciona el estado del ticket...')
      .addOptions([
        { label: 'En revisión', emoji: '🟡', value: 'en_revision' },
        { label: 'Cerrar Ticket', emoji: '🔴', value: 'cerrar' },
        { label: 'Urgente ⚠️', emoji: '⚠️', value: 'urgente' },
      ]);

    const row = new ActionRowBuilder().addComponents(statusMenu);
    const ticketMessage = await ticketChannel.send({ embeds: [infoEmbed], components: [row] });

    ticketMetadata.set(ticketChannel.id, {
      autorId: interaction.user.id,
      categoria,
      usuario,
      modalidad,
      descripcion,
      infoMessageId: ticketMessage.id,
      estado: 'abierto',
      urgente: false,
    });

    await interaction.reply({ content: `✅ Tu ticket ha sido creado: ${ticketChannel}`, ephemeral: true });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_status') {
    const meta = ticketMetadata.get(interaction.channel.id);
    if (!meta) return interaction.reply({ content: '❌ No se encontró información del ticket.', ephemeral: true });

    let newName = interaction.channel.name;
    const status = interaction.values[0];

    if (status === 'en_revision') {
      newName = newName.replace('🟢', '🟡');
      const embed = new EmbedBuilder()
        .setTitle('🔄 Ticket en Revisión')
        .setDescription(`Este ticket fue marcado como "En Revisión" por ${interaction.user}`)
        .setColor(0xFAA61A);
      await interaction.channel.send({ embeds: [embed] });
    } else if (status === 'cerrar') {
      newName = newName.replace(/^.\-/, '🔴-');
      const embed = new EmbedBuilder()
        .setTitle('🛑 Ticket Cerrado')
        .setDescription(`Este ticket fue cerrado por ${interaction.user}`)
        .setColor(0xAE03DE);
      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('delete_ticket').setLabel('🗑️ Eliminar').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('reopen_ticket').setLabel('🔓 Re-Abrir').setStyle(ButtonStyle.Secondary)
      );
      await interaction.channel.setParent(CLOSED_CATEGORY_ID);
      await interaction.channel.send({ embeds: [embed], components: [buttons] });
    } else if (status === 'urgente') {
      newName = newName.replace(/^.\-/, '⚠️-');
      meta.urgente = true;
    }

    await interaction.channel.setName(newName);
    meta.estado = status;
    await interaction.reply({ content: `✅ Estado actualizado: ${status}`, ephemeral: true });
  }

  if (interaction.isButton()) {
    const meta = ticketMetadata.get(interaction.channel.id);
    if (!meta) return interaction.reply({ content: '❌ No se encontró información del ticket.', ephemeral: true });

    if (interaction.customId === 'delete_ticket') {
      await interaction.reply({ content: '✅ Eliminando ticket...', ephemeral: true });
      await interaction.channel.delete();
    } else if (interaction.customId === 'reopen_ticket') {
      await interaction.channel.setParent(TICKETS_CATEGORY_ID);
      const newName = interaction.channel.name.replace(/^.\-/, '🟢-');
      await interaction.channel.setName(newName);
      meta.estado = 'reabierto';
      await interaction.reply({ content: '✅ Ticket reabierto.', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);