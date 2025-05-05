const { Client, GatewayIntentBits, Partials, EmbedBuilder, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const encuestaFilePath = path.join(__dirname, 'encuestas.json');

let usuariosQueRespondieron = {};
try {
  const data = fs.readFileSync(encuestaFilePath, 'utf-8');
  usuariosQueRespondieron = JSON.parse(data);
} catch (err) {
  
  console.log("No se pudo cargar el archivo de encuestas, se creará uno nuevo.");
}

const questions = [
  "¿Cuál es tu nombre?",
  "¿Cuál es tu edad?",
  "¿De dónde eres?",
  "¿Qué juegos te gustan jugar más?",
  "¿Cómo supiste de CubeRaze?",
  "¿Qué esperas encontrar en nuestra comunidad?",
  "¿Tienes alguna experiencia previa en comunidades similares?"
];

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || message.channel.type === 1) return;

  const userId = message.author.id;

  if (usuariosQueRespondieron[userId]) {
    console.log(`${message.author.tag} ya completó la encuesta.`);
    return;
  }

  try {
    const dmChannel = await message.author.createDM();

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0xAE03DE)
      .setDescription(
        `👋 Bienvenido/a a nuestra comunidad, nos alegra muchísimo tenerte por aquí.\n\nAquí encontrarás jugadores geniales, eventos increíbles y un ambiente donde todos pueden disfrutar de **CubeRaze** al máximo.\n\nAntes de comenzar tu experiencia con nosotros, nos gustaría conocerte un poquito mejor para darte la mejor bienvenida posible 💚\n\nPor favor, responde estas preguntas a continuación 👇`
      );

    await dmChannel.send({ embeds: [welcomeEmbed] });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const responses = [];

    for (let i = 0; i < questions.length; i++) {
      const embed = new EmbedBuilder()
        .setColor(0xAE03DE)
        .setTitle(`Pregunta ${i + 1}`)
        .setDescription(questions[i]);

      await dmChannel.send({ embeds: [embed] });

      const collected = await dmChannel.awaitMessages({
        filter: m => m.author.id === userId,
        max: 1,
        time: 2 * 60 * 1000,
        errors: ['time']
      });

      const answer = collected.first().content;
      responses.push({ question: questions[i], answer });
    }

    const thanksEmbed = new EmbedBuilder()
      .setColor(0xAE03DE)
      .setDescription("✅ ¡Gracias por responder a la encuesta! Te damos la bienvenida nuevamente a CubeRaze 💚");

    await dmChannel.send({ embeds: [thanksEmbed] });

usuariosQueRespondieron[userId] = true;

fs.writeFileSync(encuestaFilePath, JSON.stringify(usuariosQueRespondieron, null, 2));

    const logChannel = await client.channels.fetch("1367152173309366344");
    if (logChannel && logChannel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setTitle(`📋 Encuesta respondida por ${message.author.tag}`)
        .setThumbnail(message.author.displayAvatarURL())
        .setColor(0xAE03DE)
        .setTimestamp();

      responses.forEach((resp, index) => {
        embed.addFields({
          name: `❓ ${resp.question}`,
          value: `💬 ${resp.answer}`,
        });
      });

      await logChannel.send({ embeds: [embed] });
    }

  } catch (err) {
    console.error("❌ Error al enviar DM o registrar respuestas:", err);
  }
});

client.login(process.env.TOKEN);

const { AttachmentBuilder } = require('discord.js');

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;

  // Comando solo para ti o para admins
  if (message.content === '!verencuestas') {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('No tienes permiso para usar este comando.');
    }

    try {
      const buffer = Buffer.from(JSON.stringify(usuariosQueRespondieron, null, 2));
      const attachment = new AttachmentBuilder(buffer, { name: 'encuestas.json' });

      await message.channel.send({
        content: 'Aquí tienes el archivo de encuestas actuales:',
        files: [attachment]
      });
    } catch (err) {
      console.error('❌ Error al enviar el archivo de encuestas:', err);
      message.reply('Ocurrió un error al intentar enviar el archivo.');
    }
  }
});