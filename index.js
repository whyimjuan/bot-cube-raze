// index.js
const express = require('express');
const app = express();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Crear el bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ]
});

client.commands = new Map();

// Cargar comandos desde las carpetas
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
  const commandsPath = path.join(__dirname, 'commands', folder);
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

// Cargar eventos
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(__dirname, 'events', file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Cuando el bot esté listo
client.once(Events.ClientReady, () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

// Comando / InteractionCreate
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

// Login del bot con el token
client.login(process.env.TOKEN);

// Configuración de la API de Express
app.get('/', (req, res) => {
  res.send('¡Bot de Discord está corriendo!');
});

// Configura el puerto que Render asignará automáticamente
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor web escuchando en el puerto ${port}`);
});
