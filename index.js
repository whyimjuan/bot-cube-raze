const express = require('express');
const app = express();
const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ClientID, GuildID } = require('./config.json'); // Asegúrate de tener estos valores

// Crear cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ]
});

client.commands = new Map();         // Comandos slash
client.prefixCommands = new Map();   // Comandos con prefijo (!)

// === Cargar comandos slash ===
const slashCommandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
const slashCommands = [];

for (const folder of slashCommandFolders) {
  const folderPath = path.join(__dirname, 'commands', folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(folderPath, file));
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      slashCommands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] El comando slash ${file} no tiene "data" o "execute".`);
    }
  }
}

// === Cargar comandos de prefijo (!comando) ===
const prefixCommandPath = path.join(__dirname, 'prefixCommands'); // Asegúrate de que esta carpeta existe
const prefixCommandFiles = fs.existsSync(prefixCommandPath) ? fs.readdirSync(prefixCommandPath).filter(f => f.endsWith('.js')) : [];

for (const file of prefixCommandFiles) {
  const command = require(path.join(prefixCommandPath, file));
  if ('name' in command && 'execute' in command) {
    client.prefixCommands.set(command.name, command);
  } else {
    console.log(`[WARNING] El comando de prefijo ${file} no tiene "name" o "execute".`);
  }
}

// === Cargar eventos ===
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(__dirname, 'events', file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// === Evento listo ===
client.once(Events.ClientReady, () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  client.user.setPresence({
    status: 'online',
    activities: [{ name: 'CubeRaze.aternos.me', type: 4 }],
  });
});

// === Manejo de comandos slash ===
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No se encontró el comando ${interaction.commandName}`);
    return interaction.reply({ content: 'Este comando no existe', ephemeral: true });
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    interaction.reply({ content: 'Hubo un error al ejecutar este comando', ephemeral: true });
  }
});

// === Manejo de comandos con prefijo (!) ===
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`Error al ejecutar el comando ${commandName}:`, error);
    message.reply('Ocurrió un error al ejecutar este comando.');
  }
});

// === Registro de comandos slash con REST ===
const rest = new REST().setToken(process.env.TOKEN);
(async () => {
  try {
    console.log(`Registrando ${slashCommands.length} comandos (/)...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(ClientID, GuildID),
      { body: slashCommands },
    );
    console.log(`Comandos registrados: ${data.map(cmd => cmd.name).join(', ')}`);
  } catch (error) {
    console.error('Error al registrar comandos:', error);
  }
})();

// === Iniciar sesión del bot ===
client.login(process.env.TOKEN);

// === Servidor Express para mantener activo el bot (Render) ===
app.get('/', (req, res) => res.send('¡Bot de Discord está corriendo!'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor web escuchando en el puerto ${port}`));
