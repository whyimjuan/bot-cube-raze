const { REST, Routes, Client, Events, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const { ClientID, GuildID } = require('./config.json');
const path = require('path');
const fs = require('fs');

// Inicialización del cliente
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const commands = [];
client.commands = new Collection();

// Ruta de comandos
const folderPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(folderPath);

// Cargar los comandos
for (const folder of commandFolders) {
  const commandsPath = path.join(folderPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] El comando en ${filePath} no tiene data.`);
    }
  }
}

// Ruta de eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
let eventCount = 0;

console.log('Cargando eventos:');

// Cargar los eventos
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }

  eventCount++;
}

// Manejo de interacciones de comandos
client.on(Events.InteractionCreate, async interaction => {
  console.log(interaction);

  if (!interaction.isChatInputCommand()) return console.log('No es un comando de entrada de chat');
  if (!interaction.isCommand()) return console.log('No es un comando');

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No se encontró el comando ${interaction.commandName}`);
    return interaction.reply({ content: 'Este comando no existe', ephemeral: true });
  }

  try {
    console.log(`Ejecutando el comando ${interaction.commandName}`);
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error al ejecutar el comando ${interaction.commandName}:`, error);
    return interaction.reply({ content: 'Hubo un error al ejecutar este comando', ephemeral: true });
  }
});

// Evento de cliente listo
client.once(Events.ClientReady, () => {
  console.log('Ready!');
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`User ID: ${client.user.id}`);
  console.log(`Guilds: ${client.guilds.cache.map(guild => guild.name).join(', ')}`);
  console.log(`Eventos cargados: ${eventCount}`);
});

// Cargar comandos para la API de Discord
const foldersPath = path.join(__dirname, 'commands');
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Registrar los comandos en la API de Discord
const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(
      Routes.applicationGuildCommands(ClientID, GuildID),
      { body: commands },
    );
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    console.log(`Commands: ${data.map(command => command.name).join(', ')}`);
  } catch (error) {
    console.error(error);
  }
})();

// Login del cliente
client.login(process.env.TOKEN);

// Estado de actividad del bot
client.on('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  client.user.setPresence({
    status: 'online',
    activities: [{ name: 'CubeRaze.aternos.me', type: 4 }]
  });
});

//MANEJADOR DE COMANDOS !
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (!client.prefixCommands) {
    console.error('prefixCommands no está definido');
    return;
}

const command = client.prefixCommands.get(commandName);
if (!command) return;


  try {
    command.execute(message, args);
  } catch (error) {
    console.error(`Error al ejecutar el comando ${commandName}:`, error);
    message.reply('Ocurrió un error al ejecutar este comando.');
  }
});

// Configura el puerto que Render asignará automáticamente
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Configurando Puerto'));
app.listen(port, () => console.log(`Server on port ${port}`));
