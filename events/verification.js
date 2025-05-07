const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, Collection, PermissionsBitField } = require('discord.js');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

const verificationCodes = new Collection();

const VERIFICATION_CHANNEL_ID = '1362267060394262559'; // 🔁 

const VERIFIED_ROLE_ID = '1362267172247830651'; // 🔁 

client.once(Events.ClientReady, () => {
  console.log(`✅ Sistema de Verificacion ${client.user.tag}`);
});


client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  if (
    message.content === '!canalverificacion' &&
    message.channel.id === VERIFICATION_CHANNEL_ID &&
    message.member.permissions.has(PermissionsBitField.Flags.Administrator)
  ) {
    const embed = new EmbedBuilder()
      .setDescription('# 🎉 ¡Bienvenido a **CubeRaze**! 🎉\n\nEstamos muy emocionados de tenerte con nosotros. 😊 Para asegurarnos de que eres un miembro legítimo, por favor completa el proceso de verificación.\n\n🔑 **Pasos para completar tu verificación:**\n\n**1.** Haz clic en el botón a continuación para recibir tu código de verificación.\n**2.** Este código será enviado directamente a tu DM.\n**3.** Una vez que tengas tu código, vuelve a este canal y envíalo para completar tu verificación.\n\n💬 **¡Nos encantaría tenerte en nuestra comunidad y disfrutarás de todo lo que CubeRaze tiene para ofrecer!**')
      .setColor(0xfebf25);

    const button = new ButtonBuilder()
      .setCustomId('start_verification')
      .setLabel('Verificación')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);
    await message.channel.send({ embeds: [embed], components: [row] });

    setTimeout(() => message.delete().catch(() => {}), 5000);
  }
});


client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'start_verification') {
    const code = uuidv4().split('-')[0];
    verificationCodes.set(interaction.user.id, code);

    const embed = new EmbedBuilder()
      .setTitle('Código de Verificación')
      .setDescription(`Tu código de verificación es: \`${code}\`\n\n¡Envíalo en el canal #verificación para ser verificado!`)
      .setColor(0xAE03DE);

    try {
      await interaction.user.send({ embeds: [embed] });
      await interaction.reply({ content: '📩 Te envié un mensaje con tu código.', ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: '❌ No pude enviarte un DM. Habilítalo e intenta de nuevo.', ephemeral: true });
    }
  }
});


client.on(Events.MessageCreate, async message => {
  if (message.channel.id !== VERIFICATION_CHANNEL_ID || message.author.bot) return;

  const code = verificationCodes.get(message.author.id);
  if (!code) {
    await message.delete().catch(() => {});
    return;
  }

  if (message.content.trim() === code) {
    const role = message.guild.roles.cache.get(VERIFIED_ROLE_ID);
    if (role) {
      await message.member.roles.add(role).catch(console.error);
    }


    const confirmationEmbed = new EmbedBuilder()
      .setTitle('✅ Verificación Exitosa')
      .setDescription('Has sido verificado correctamente.')
      .setColor(0xAE03DE);

    await message.author.send({ embeds: [confirmationEmbed] });


    verificationCodes.delete(message.author.id);
    setTimeout(() => message.delete().catch(() => {}), 1000);
  } else {

    setTimeout(() => message.delete().catch(() => {}), 1000);
  }
});

client.login(process.env.TOKEN);
