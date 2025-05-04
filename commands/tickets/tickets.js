const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, Events, ChannelType } = require('discord.js');
require('dotenv').config();

const TICKETS_CATEGORY_ID = '1368050092564807761'; 
const CLOSED_CATEGORY_ID = '1368049954609692743'; 
const STAFF_ROLE_ID = '1358617654071394377'; 

let ticketCounter = 1;
const ticketMetadata = new Map();
const claimedTickets = new Map();

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
      .setDescription(`
        **¿NECESITAS AYUDA?**

        Abre un ticket para recibir ayuda del equipo del STAFF de CubeRaze.
        Selecciona la categoría que más se ajuste a lo que necesitas.
      `)
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
          new TextInputBuilder()
            .setCustomId('usuario')
            .setLabel('¿Cuál es tu nombre de usuario?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('modalidad')
            .setLabel('¿En qué modalidad ocurrió el problema?')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('descripcion')
            .setLabel('Describe tu problema')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
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
    const channelName = `ticket-${ticketId}`;

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
        { label: 'No atendido', emoji: '🟢', value: 'no_atendido' },
        { label: 'En revisión', emoji: '🟡', value: 'en_revision' },
        { label: 'Atendido', emoji: '🔴', value: 'atendido' },
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
      abierto: new Date(),
      infoMessageId: ticketMessage.id,
      estado: 'no_atendido',  // Estado por defecto
      urgente: false,  // No urgente por defecto
    });

    await interaction.reply({ content: `✅ Tu ticket ha sido creado: ${ticketChannel}`, ephemeral: true });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_status') {
    const meta = ticketMetadata.get(interaction.channel.id);
    if (!meta) return interaction.reply({ content: '❌ No se encontró información del ticket.', ephemeral: true });

    const status = interaction.values[0];
    const currentName = interaction.channel.name;
    let newName = currentName;

    // Cambiar el nombre del canal según el estado
    if (status === 'no_atendido') {
      newName = `🟢-${currentName}`;
    } else if (status === 'en_revision') {
      newName = `🟡-${currentName}`;
    } else if (status === 'atendido') {
      newName = `🔴-${currentName}`;
      await interaction.channel.setParent(CLOSED_CATEGORY_ID);
    }

    // Marcar como urgente
    if (status === 'urgente') {
      newName = `⚠️-${currentName}`;
      meta.urgente = true;  // Marcar ticket como urgente
    }

    try {
      await interaction.channel.setName(newName);
      meta.estado = status;
      await interaction.reply({ content: `✅ El estado del ticket ha sido actualizado a ${status}.`, ephemeral: true });
    } catch (error) {
      console.error('Error al cambiar el nombre del canal:', error);
      await interaction.reply({ content: '⚠️ Error al actualizar el estado del ticket.', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);