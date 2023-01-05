/** @format */

import dotenv from "dotenv";
import {
	ActivityType,
	Client,
	Collection,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
	PresenceStatusData,
} from "discord.js";
import fs from "fs";
import path from "path";
import emojiToImage from "./emojiToImage";
import { ownerId, status } from "../config.json";

declare module "discord.js" {
	export interface Client {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		commands: Collection<unknown, any>;
	}
}

const token = dotenv.config().parsed?.API_KEY;

if (!token) {
	throw new Error(
		"No token provided.\n" +
			"Please add the Discord bot token to the .env file (see .env.example)"
	);
}

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

/*
 * When the client is ready, run this code (only once)
 * We use 'c' for the event parameter to keep it separate from the already defined 'client'
 */
client.on(Events.ClientReady, (c) => {
	console.log(
		`Ready! ${c.user.tag} is logged in and serving ${c.guilds.cache.size} ` +
		`guilds with ${client.commands.size} commands`
	);

	// TODO: Match status type to ActivityType
	c.user.setActivity({ name: status.name, type: ActivityType.Playing });
	c.user.setStatus(status.status as PresenceStatusData);
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));

async function loadCommands() {
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		await import(filePath).then((command) => {
			// Set a new item in the Collection with the key as the command name and the value as the exported module
			if ("data" in command && "execute" in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.warn(
					`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
				);
			}
		});
	}
}

loadCommands();

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	console.debug("Received command: " + interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);

		const embed = new EmbedBuilder()
			.setTitle(`Unknown command: \`${interaction.commandName}\``)
			.setDescription(
				`Somehow, you managed to trigger a command that doesn't exist.
				Please let <@${ownerId}> know something has gone wrong!`
			)
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
			})
			.setTimestamp(new Date())
			.setColor("Red")
			.setThumbnail(emojiToImage("❓"))
		;

		await interaction.reply({ embeds: [embed.data], ephemeral: true });
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(`${interaction.commandName} failed to execute!`);
		console.error(error);

		const embed = new EmbedBuilder()
			.setTitle(`Something went wrong with \`${interaction.commandName}\``)
			.setDescription(
				`Please let <@${ownerId}> know something has gone wrong!` +
				(error instanceof Error ?
					"```ansi\n[1;4;31m" + error.name + "\n[0;31m" + error.message + "```" :
					"```ansi\n[1;31m" + error + "```")
			)
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
			})
			.setTimestamp(new Date())
			.setColor("Red")
			.setThumbnail(emojiToImage("❗"))
		;

		await interaction.reply({ embeds: [embed.data], ephemeral: true });
	}
});

// Log in to Discord with your client's token
client.login(token);
