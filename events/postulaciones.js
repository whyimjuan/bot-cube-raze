const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, Events } = require('discord.js');

// In-memory store for applications
const applications = new Map();

module.exports = {
  name: 'postulation',
  once: false,
  execute(client) {
    // Ready event
    client.once(Events.ClientReady, () => {
      console.log(`Bot conectado como ${client.user.tag}`);
    });

    // MessageCreate for command
    client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;
      if (message.content === '!setpostulacion') {
        const applyButton = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('apply_button')
              .setLabel('Postularme')
              .setStyle(ButtonStyle.Primary)
          );
        await message.channel.send({ content: '¡Postúlate para ser parte del staff!', components: [applyButton] });
      }
    });

    // InteractionCreate for buttons, modals, modal submissions
    client.on(Events.InteractionCreate, async (interaction) => {
      // Handle main apply button
      if (interaction.isButton() && interaction.customId === 'apply_button') {
        await interaction.reply({ content: 'Revisa tu DM para comenzar el formulario.', ephemeral: true });
        const dmChannel = await interaction.user.createDM();
        const formButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder().setCustomId('form_part_1').setLabel('Parte 1').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('form_part_2').setLabel('Parte 2').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('form_part_3').setLabel('Parte 3').setStyle(ButtonStyle.Secondary)
          );
        await dmChannel.send({ content: 'Haz clic en un botón para comenzar el formulario.', components: [formButtons] });
        // Initialize storage
        applications.set(interaction.user.id, { responses: {}, partsDone: new Set() });
      }

      // Handle form part buttons
      if (interaction.isButton() && interaction.customId.startsWith('form_part_')) {
        const part = interaction.customId.split('_').pop();
        const modal = new ModalBuilder()
          .setCustomId(`modal_part_${part}`)
          .setTitle(`Formulario Parte ${part}`);

        // Define inputs per part
        const inputs = [];
        if (part === '1') {
          inputs.push(new TextInputBuilder().setCustomId('nick_mc').setLabel('Nick de Minecraft').setStyle(TextInputStyle.Short));
          inputs.push(new TextInputBuilder().setCustomId('discord_name').setLabel('Nombre de Discord').setStyle(TextInputStyle.Short));
          inputs.push(new TextInputBuilder().setCustomId('edad').setLabel('¿Cuántos años tienes?').setStyle(TextInputStyle.Short));
          inputs.push(new TextInputBuilder().setCustomId('experiencia_staff').setLabel('¿Tienes experiencia en ser staff?').setStyle(TextInputStyle.Paragraph));
          inputs.push(new TextInputBuilder().setCustomId('detalle_experiencia').setLabel('En qué servidor has sido staff; si no fuiste en ninguno pon "no". Si respondes "sí", dime en qué server y por qué paraste de ser staff.').setStyle(TextInputStyle.Paragraph));
        } else if (part === '2') {
          inputs.push(new TextInputBuilder().setCustomId('tipo_hacks').setLabel('Dime 5 tipos de hacks').setStyle(TextInputStyle.Paragraph));
          inputs.push(new TextInputBuilder().setCustomId('spam_vs_flood').setLabel('Dime la diferencia entre SPAM y FLOOD').setStyle(TextInputStyle.Paragraph));
          inputs.push(new TextInputBuilder().setCustomId('hacer_ss').setLabel('¿Sabes hacer SS? Si es así, dime cómo empieza y cómo acaba.').setStyle(TextInputStyle.Paragraph));
          inputs.push(new TextInputBuilder().setCustomId('motivo_staff').setLabel('¿Por qué quieres ser parte del staff de este servidor?').setStyle(TextInputStyle.Paragraph));
          inputs.push(new TextInputBuilder().setCustomId('acciones_reglas').setLabel('¿Qué harías si ves a alguien rompiendo las reglas pero no tienes pruebas suficientes?').setStyle(TextInputStyle.Paragraph));
        } else if (part === '3') {
          inputs.push(new TextInputBuilder().setCustomId('horas_semana').setLabel('¿Cuántas horas puedes dedicar al servidor por semana?').setStyle(TextInputStyle.Short));
          inputs.push(new TextInputBuilder().setCustomId('conflicto_jugadores').setLabel('¿Cómo manejarías un conflicto entre dos jugadores?').setStyle(TextInputStyle.Paragraph));
          inputs.push(new TextInputBuilder().setCustomId('experiencia_plugins').setLabel('¿Qué experiencia tienes con plugins (como Paper, Spigot, etc.)?').setStyle(TextInputStyle.Paragraph));
          inputs.push(new TextInputBuilder().setCustomId('rol_postular').setLabel('¿A qué rol (Rango) te quieres postular?').setStyle(TextInputStyle.Short));
        }

        inputs.forEach(input => modal.addComponents(new ActionRowBuilder().addComponents(input)));
        await interaction.showModal(modal);
      }

      // Handle modal submissions
      if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_part_')) {
        const part = interaction.customId.split('_').pop();
        const app = applications.get(interaction.user.id);
        const responses = {};
        interaction.fields.fields.forEach((field, key) => { responses[key] = field.value; });
        Object.assign(app.responses, responses);
        app.partsDone.add(part);
        await interaction.reply({ content: `Parte ${part} completada.`, ephemeral: true });

        if (app.partsDone.size === 3) {
          const embed = new EmbedBuilder().setTitle(`Nuevo formulario de ${interaction.user.tag}`).setColor(0x00AE86).setTimestamp();
          Object.entries(app.responses).forEach(([key, value]) => {
            embed.addFields({ name: key, value });
          });
          const decisionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('decision_accept').setLabel('Aceptar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('decision_reject').setLabel('Rechazar').setStyle(ButtonStyle.Danger)
          );
          const reviewChannel = await client.channels.fetch('1367152173309366344');
          await reviewChannel.send({ embeds: [embed], components: [decisionRow] });
          applications.delete(interaction.user.id);
        }
      }

      // Handle admin decision buttons
      if (interaction.isButton() && ['decision_accept','decision_reject'].includes(interaction.customId)) {
        const decision = interaction.customId === 'decision_accept' ? 'accept' : 'reject';
        const modal = new ModalBuilder().setCustomId(`modal_decision_reason_${decision}`).setTitle(decision === 'accept' ? 'Razón de Aprobación' : 'Razón de Rechazo');
        modal.addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('reason').setLabel('Escribe la razón:').setStyle(TextInputStyle.Short)
        ));
        await interaction.showModal(modal);
      }

      // Handle decision reason submission
      if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_decision_reason_')) {
        const decision = interaction.customId.split('_').pop();
        const reason = interaction.fields.getTextInputValue('reason');
        const original = interaction.message;
        const applicantTag = original.embeds[0].title.replace('Nuevo formulario de ', '');
        const finalEmbed = new EmbedBuilder()
          .setTitle(`Solicitud de ${applicantTag}`)
          .setColor(decision === 'accept' ? 0x2ECC71 : 0xE74C3C)
          .addFields(
            { name: 'Estado', value: decision === 'accept' ? '🟢 Solicitud aprobada' : '🔴 Solicitud no aprobada' },
            { name: 'Razón', value: reason }
          )
          .setFooter({ text: 'CubeRaze Network ©' })
          .setTimestamp();

        const [username] = applicantTag.split('#');
        const user = client.users.cache.find(u => u.tag === applicantTag);
        if (user) await user.send({ embeds: [finalEmbed] });

        const resultChannel = await client.channels.fetch('1368344498710777946');
        await resultChannel.send({ content: `¡El jugador @${username} no ha sido ascendido!`, embeds: [finalEmbed] });
        await interaction.reply({ content: 'Decisión enviada correctamente.', ephemeral: true });
      }
    });
  }
};
