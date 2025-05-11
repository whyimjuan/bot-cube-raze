const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events,
    Partials,
    ChannelType
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});

const STAFF_APP_CHANNEL_ID = '1367152173309366344';
const STAFF_DECISION_CHANNEL_ID = '1368344498710777946';

client.once('ready', () => {
    console.log(`Bot listo como ${client.user.tag}`);
});

const QUESTIONS = [
    'Nick de Minecraft',
    'Nombre de Discord',
    'Edad',
    '¿Tienes experiencia como staff?',
    '¿Dónde fuiste staff antes?',
    'Menciona 5 tipos de hacks',
    'Diferencia entre SPAM y FLOOD',
    '¿Sabes hacer SS? ¿Cómo se hace?',
    '¿Por qué quieres ser staff aquí?',
    '¿Qué harías si no tienes pruebas?',
    'Horas semanales que puedes dedicar',
    '¿Cómo manejas un conflicto?',
    '¿Qué sabes sobre plugins (Paper, etc)?',
    '¿A qué rango te postulas?'
];

client.on('messageCreate', async (message) => {
    if (message.content === '!setpostulacion') {
        const embed = new EmbedBuilder()
            .setTitle('¡Aplicación para Staff!')
            .setDescription('Haz clic en el botón para postularte al staff del servidor.')
            .setColor('Blue')
            .setFooter({ text: 'CubeRaze Network ©' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_staff')
                .setLabel('Postularme')
                .setStyle('Primary')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'apply_staff') {
            // Enviar un mensaje al DM del usuario con los botones para dividir el formulario en tres partes
            const embed = new EmbedBuilder()
                .setTitle('Formulario de Postulación')
                .setDescription('Haz clic en un botón para empezar la postulación (cada uno representa una parte del formulario).')
                .setColor('Blue')
                .setFooter({ text: 'CubeRaze Network ©' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('part1')
                    .setLabel('Parte 1')
                    .setStyle('Primary'),
                new ButtonBuilder()
                    .setCustomId('part2')
                    .setLabel('Parte 2')
                    .setStyle('Primary'),
                new ButtonBuilder()
                    .setCustomId('part3')
                    .setLabel('Parte 3')
                    .setStyle('Primary')
            );

            await interaction.user.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: 'Te hemos enviado el formulario al DM.', ephemeral: true });
        }

        // Manejar clics en los botones que envían las partes del formulario
        if (interaction.customId === 'part1' || interaction.customId === 'part2' || interaction.customId === 'part3') {
            const part = interaction.customId === 'part1' ? QUESTIONS.slice(0, 5) :
                        interaction.customId === 'part2' ? QUESTIONS.slice(5, 10) :
                        QUESTIONS.slice(10);

            const modal = new ModalBuilder()
                .setCustomId(`${interaction.customId}_modal`)
                .setTitle(`Formulario de Postulación - ${interaction.customId === 'part1' ? 'Parte 1' : interaction.customId === 'part2' ? 'Parte 2' : 'Parte 3'}`);

            const row = new ActionRowBuilder();
            part.forEach((question, index) => {
                row.addComponents(
                    new TextInputBuilder()
                        .setCustomId(`q${index}`)
                        .setLabel(question)
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                );
            });

            modal.addComponents(row);
            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('part1') || interaction.customId.startsWith('part2') || interaction.customId.startsWith('part3')) {
            const part = interaction.customId === 'part1_modal' ? QUESTIONS.slice(0, 5) :
                        interaction.customId === 'part2_modal' ? QUESTIONS.slice(5, 10) :
                        QUESTIONS.slice(10);

            const answers = [];
            part.forEach((_, index) => {
                answers.push(interaction.fields.getTextInputValue(`q${index}`));
            });

            const embed = new EmbedBuilder()
                .setTitle('Nueva Aplicación para Staff')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setColor('Blue')
                .setFooter({ text: 'CubeRaze Network ©' });

            part.forEach((q, i) => {
                embed.addFields({ name: q, value: answers[i], inline: false });
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('accept_app').setLabel('Aceptar').setStyle('Success'),
                new ButtonBuilder().setCustomId('reject_app').setLabel('Rechazar').setStyle('Danger')
            );

            const channel = await client.channels.fetch(STAFF_APP_CHANNEL_ID);
            if (channel?.type === ChannelType.GuildText) {
                await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
            }

            await interaction.reply({ content: 'Tu solicitud fue enviada con éxito.', ephemeral: true });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'accept_app' || interaction.customId === 'reject_app') {
            const modal = new ModalBuilder()
                .setCustomId(`reason_modal_${interaction.customId}`)
                .setTitle(interaction.customId === 'accept_app' ? 'Razón de aceptación' : 'Razón de rechazo')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('reason')
                            .setLabel('Razón')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
                );

            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        const isAccept = interaction.customId === 'reason_modal_accept_app';
        const reason = interaction.fields.getTextInputValue('reason');
        const originalMessage = await interaction.channel.messages.fetch(interaction.message.id);
        const userMention = originalMessage.content.match(/<@(\d+)>/);
        const userId = userMention ? userMention[1] : null;
        const user = await client.users.fetch(userId).catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle(`¡El jugador ${user ? user.tag : 'desconocido'} ${isAccept ? 'ha sido ascendido a Helper' : 'no ha sido ascendido a Helper'}!`)
            .setColor(isAccept ? 'Green' : 'Red')
            .addFields(
                { name: 'Estado', value: isAccept ? '✅ Solicitud aprobada' : '🔴 Solicitud no aprobada' },
                { name: 'Razón', value: reason }
            )
            .setFooter({ text: 'CubeRaze Network ©' });

        const decisionChannel = await client.channels.fetch(STAFF_DECISION_CHANNEL_ID);
        if (decisionChannel?.type === ChannelType.GuildText) {
            await decisionChannel.send({ embeds: [embed] });
        }

        if (user) {
            try {
                await user.send(`Tu solicitud para ser staff ha sido ${isAccept ? 'aceptada' : 'rechazada'}.\nRazón: ${reason}`);
            } catch {
                console.log('No se pudo enviar mensaje directo al usuario.');
            }
        }

        await interaction.reply({ content: 'Decisión registrada.', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
