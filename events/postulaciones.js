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
            const modal = new ModalBuilder()
                .setCustomId('staff_application_modal')
                .setTitle('Aplicación para Staff');

            // Dividir preguntas en filas de 5
            for (let i = 0; i < QUESTIONS.length; i += 5) {
                const row = new ActionRowBuilder();
                QUESTIONS.slice(i, i + 5).forEach((question, index) => {
                    row.addComponents(
                        new TextInputBuilder()
                            .setCustomId(`q${i + index}`)
                            .setLabel(question)
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    );
                });
                modal.addComponents(row);
            }

            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'staff_application_modal') {
            const answers = [];
            for (let i = 0; i < QUESTIONS.length; i++) {
                answers.push(interaction.fields.getTextInputValue(`q${i}`));
            }

            const embed = new EmbedBuilder()
                .setTitle('Nueva Aplicación para Staff')
                .setThumbnail(interaction.user.displayAvatarURL())
                .setColor('Blue')
                .setFooter({ text: 'CubeRaze Network ©' });

            QUESTIONS.forEach((q, i) => {
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
