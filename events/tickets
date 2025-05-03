const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel, Partials.Message],
});

const TICKETS_CATEGORY_ID = '1367568508862599199';
const CLOSED_CATEGORY_ID = '1367568547626356838';
const STAFF_ROLE_ID = '1367570297787514952';

let ticketCounter = 1;
const ticketMetadata = new Map();
const claimedTickets = new Map();

client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!setticketchannel' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    const embed = new EmbedBuilder()
      .setTitle('📫 Soporte de SandyCraft')
      .setDescription(`**¿NECESITAS AYUDA?**

Abre un ticket para recibir ayuda del equipo del STAFF de SandyCraft.
Selecciona la categoría que más se ajuste a lo que necesitas.

🌍 **General**

🚧 **Bugs**

❌ **Reportar jugador**

🙏🏻 **Apelacion**

🎥 **Creador de contenido**

🛒 **Tienda Web**

⭕ **Reportar STAFF**

❔ **Otros**


*El mal uso de este sistema no será permitido. Si haces un uso indebido, podrías recibir una sanción.*`)
      .setColor(0x38c8e8);

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
  // Formulario al seleccionar categoría
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

  // Crear canal de ticket
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
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
        },
        {
          id: STAFF_ROLE_ID,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageChannels],
        },
        {
          id: client.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        },
      ],
    });

    ticketMetadata.set(ticketChannel.id, {
      autorId: interaction.user.id,
      categoria,
      usuario,
      modalidad,
      descripcion,
      abierto: new Date()
    });

    const infoEmbed = new EmbedBuilder()
      .setTitle(`📝 Detalles del Ticket`)
      .addFields(
        { name: 'Usuario', value: usuario },
        { name: 'Modalidad', value: modalidad },
        { name: 'Descripción', value: descripcion },
        { name: 'Reclamado por', value: '> (Este ticket no ha sido reclamado)' }
      )
      .setFooter({ text: `Creado el ${new Date().toLocaleString()}` })
      .setColor(0x38c8e8);

    const advertencia = new EmbedBuilder()
      .setDescription('❗ ¡Recuerda no mencionar al Staff! Te atenderán lo antes posible.')
      .setColor(0xffcc00);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('claim_ticket').setLabel('Reclamar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('close_ticket').setLabel('Cerrar').setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ embeds: [infoEmbed] });
    await ticketChannel.send({ embeds: [advertencia], components: [buttons] });

    await interaction.reply({ content: `✅ Tu ticket ha sido creado: ${ticketChannel}`, ephemeral: true });
  }

  // Reclamar ticket
  if (interaction.isButton() && interaction.customId === 'claim_ticket') {
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: '❌ Solo el Staff puede reclamar tickets.', ephemeral: true });
    }

    if (claimedTickets.has(interaction.channel.id)) {
      return interaction.reply({ content: 'Este ticket ya ha sido reclamado.', ephemeral: true });
    }

    claimedTickets.set(interaction.channel.id, interaction.user.id);

    const claimEmbed = new EmbedBuilder()
      .setTitle('🎟️ Ticket Reclamado')
      .setDescription(`Este ticket ha sido reclamado por ${interaction.user}.`)
      .setColor(0x00ff00);

    await interaction.channel.send({ embeds: [claimEmbed] });
    await interaction.reply({ content: 'Has reclamado este ticket.', ephemeral: true });
  }

// Cerrar ticket
if (interaction.isButton() && interaction.customId === 'close_ticket') {
    const meta = ticketMetadata.get(interaction.channel.id);
    if (!meta) return interaction.reply({ content: '❌ No se encontró información del ticket.', ephemeral: true });
  
    const logEmbed = new EmbedBuilder()
      .setTitle('🛑 Ticket Cerrado')
      .setDescription(`Este ticket fue cerrado por ${interaction.user}.`)
      .setColor(0xff4444);
  
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('reopen_ticket').setLabel('🔓 Re-Abrir').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('delete_ticket').setLabel('🗑️ Eliminar').setStyle(ButtonStyle.Danger)
    );
  
    // Enviar log solo como mensaje sin botones por DM
    const user = await interaction.guild.members.fetch(meta.autorId).catch(() => null);
    if (user) {
      await user.send({ embeds: [logEmbed] }).catch(() => {});
    }
  
    const staffClaim = claimedTickets.get(interaction.channel.id);
    if (staffClaim) {
      const staffUser = await interaction.guild.members.fetch(staffClaim).catch(() => null);
      if (staffUser) {
        await staffUser.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }
  
    // Mover a categoría de cerrados y enviar los botones SOLO en el canal
    await interaction.channel.setParent(CLOSED_CATEGORY_ID);
    await interaction.channel.send({ embeds: [logEmbed], components: [buttons] });
    await interaction.reply({ content: '✅ Ticket cerrado.', ephemeral: true });
  }
  
  
  // Eliminar ticket
  if (interaction.isButton() && interaction.customId === 'delete_ticket') {
    await interaction.reply({ content: '🗑️ Eliminando canal...', ephemeral: true });
    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 3000);
  }

  // Reabrir ticket
  if (interaction.isButton() && interaction.customId === 'reopen_ticket') {
    await interaction.channel.setParent(TICKETS_CATEGORY_ID);
    await interaction.reply({ content: '🔓 Ticket reabierto.', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
