const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, Events } = require('discord.js');

// In-memory store for applications
const applications = new Map();

module.exports = {
  name: 'postulation',
  once: false,
  execute(client) {
    client.once(Events.ClientReady, () => {
      console.log(`Bot conectado como ${client.user.tag}`);
    });

    client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;
      if (message.content === '!setpostulacion') {
        const applyButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('apply_button')
            .setLabel('Postularme')
            .setStyle(ButtonStyle.Primary)
        );
        await message.channel.send({ content: '¡Postúlate para ser parte del staff!', components: [applyButton] });
      }
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isButton() && interaction.customId === 'apply_button') {
        await interaction.reply({ content: 'Revisa tu DM para comenzar el formulario.', ephemeral: true });
        const dm = await interaction.user.createDM();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('form_part_1').setLabel('Parte 1').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('form_part_2').setLabel('Parte 2').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('form_part_3').setLabel('Parte 3').setStyle(ButtonStyle.Secondary)
        );
        await dm.send({ content: 'Haz clic en un botón para comenzar el formulario.', components: [row] });
        applications.set(interaction.user.id, { responses: {}, partsDone: new Set() });
      }

      if (interaction.isButton() && interaction.customId.startsWith('form_part_')) {
        const part = interaction.customId.split('_').pop();
        const modal = new ModalBuilder()
          .setCustomId(`modal_part_${part}`)
          .setTitle(`Formulario Parte ${part}`);

        const inputs = [];
        if (part === '1') {
          inputs.push({ id: 'nick_mc', label: 'Nick de Minecraft', style: TextInputStyle.Short });
          inputs.push({ id: 'discord_name', label: 'Nombre de Discord', style: TextInputStyle.Short });
          inputs.push({ id: 'edad', label: '¿Cuántos años tienes?', style: TextInputStyle.Short });
          inputs.push({ id: 'experiencia_staff', label: '¿Tienes experiencia en ser staff?', style: TextInputStyle.Paragraph });
          inputs.push({ id: 'detalle_experiencia', label: 'En qué servidor has sido staff; si no, pon "no". Si sí, dinos cuál y por qué paraste.', style: TextInputStyle.Paragraph });
        } else if (part === '2') {
          inputs.push({ id: 'tipo_hacks', label: 'Dime 5 tipos de hacks', style: TextInputStyle.Paragraph });
          inputs.push({ id: 'spam_vs_flood', label: 'Diferencia entre SPAM y FLOOD', style: TextInputStyle.Paragraph });
          inputs.push({ id: 'hacer_ss', label: '¿Sabes hacer SS? Cómo empieza y cómo acaba.', style: TextInputStyle.Paragraph });
          inputs.push({ id: 'motivo_staff', label: '¿Por qué quieres ser parte del staff?', style: TextInputStyle.Paragraph });
          inputs.push({ id: 'acciones_reglas', label: 'Si ves alguien rompiendo reglas sin pruebas, ¿qué harías?', style: TextInputStyle.Paragraph });
        } else if (part === '3') {
          inputs.push({ id: 'horas_semana', label: '¿Horas por semana que puedes dedicar?', style: TextInputStyle.Short });
          inputs.push({ id: 'conflicto_jugadores', label: '¿Cómo manejarías un conflicto entre jugadores?', style: TextInputStyle.Paragraph });
          inputs.push({ id: 'experiencia_plugins', label: 'Experiencia con plugins (Paper, Spigot, etc.)', style: TextInputStyle.Paragraph });
          inputs.push({ id: 'rol_postular', label: '¿A qué rol te postulas?', style: TextInputStyle.Short });
        }

        // Add each input in its own ActionRow
        inputs.forEach(i => {
          const txt = new TextInputBuilder()
            .setCustomId(i.id)
            .setLabel(i.label)
            .setStyle(i.style);
          modal.addComponents(new ActionRowBuilder().addComponents(txt));
        });

        await interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_part_')) {
        const part = interaction.customId.split('_').pop();
        const app = applications.get(interaction.user.id);
        interaction.fields.fields.forEach((fld, key) => app.responses[key] = fld.value);
        app.partsDone.add(part);
        await interaction.reply({ content: `Parte ${part} completada.`, ephemeral: true });

        if (app.partsDone.size === 3) {
          const embed = new EmbedBuilder()
            .setTitle(`Nuevo formulario de ${interaction.user.tag}`)
            .setColor(0x00AE86)
            .setTimestamp();
          Object.entries(app.responses).forEach(([k, v]) => embed.addFields({ name: k, value: v }));

          const decisionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('decision_accept').setLabel('Aceptar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('decision_reject').setLabel('Rechazar').setStyle(ButtonStyle.Danger)
          );

          const reviewChannel = await client.channels.fetch('1367152173309366344');
          await reviewChannel.send({ embeds: [embed], components: [decisionRow] });
          applications.delete(interaction.user.id);
        }
      }

      if (interaction.isButton() && ['decision_accept','decision_reject'].includes(interaction.customId)) {
        const decision = interaction.customId.split('_').pop();
        const modal = new ModalBuilder()
          .setCustomId(`modal_decision_${decision}`)
          .setTitle(decision === 'accept' ? 'Razón Aprobación' : 'Razón Rechazo');
        const reason = new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Escribe la razón:')
          .setStyle(TextInputStyle.Short);
        modal.addComponents(new ActionRowBuilder().addComponents(reason));
        await interaction.showModal(modal);
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_decision_')) {
        const decision = interaction.customId.split('_').pop();
        const reason = interaction.fields.getTextInputValue('reason');
        const orig = interaction.message;
        const applicant = orig.embeds[0].title.replace('Nuevo formulario de ', '');

        const finalEmbed = new EmbedBuilder()
          .setTitle(`Solicitud de ${applicant}`)
          .setColor(decision === 'accept' ? 0x2ECC71 : 0xE74C3C)
          .addFields(
            { name: 'Estado', value: decision === 'accept' ? '🟢 Solicitud aprobada' : '🔴 Solicitud no aprobada' },
            { name: 'Razón', value: reason }
          )
          .setFooter({ text: 'CubeRaze Network ©' })
          .setTimestamp();

        const [userTag] = applicant.split('#');
        const user = client.users.cache.find(u => u.tag === applicant);
        if (user) await user.send({ embeds: [finalEmbed] });

        const channel = await client.channels.fetch('1368344498710777946');
        await channel.send({ content: `¡El jugador @${userTag} no ha sido ascendido!`, embeds: [finalEmbed] });
        await interaction.reply({ content: 'Decisión enviada.', ephemeral: true });
      }
    });
  }
};
