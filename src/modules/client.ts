import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { serviceLogger } from "./logger";
import Command from "../types/Command";
const logger = serviceLogger("clientBuilder");

declare module "discord.js" {
	// eslint-disable-next-line no-shadow
	export interface Client {
		commands: Collection<string, Command>;
	}
}

/** Prepared Discord.js Client object with token and commands preloaded */
export const client = new Client({
	/* Overview of required permissions:
	 *
	 * Intents:
	 * - GuildMembers: Used to read to maintain guild-specific leaderboards
	 * Allowed Mentions:
	 * - roles: Used for role pings for announcing clues
	 */
	// TODO: Graceful handling if it doesn't have intent enabled
	intents: [ GatewayIntentBits.GuildMembers ],
	allowedMentions: { parse: ["roles"] },
});

async function loadCommands() {
	// Add commands collection to client object
	/**
	 * Collection of all commands available in the bot
	 *
	 * @see https://discordjs.guide/creating-your-bot/command-handling.html#loading-command-files
	 */
	client.commands = new Collection();

	// Find commands folder from current directory
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const foldersPath = path.join(__dirname, "../commands");
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".ts"));

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);

			const command: Command = (await import("file://" + filePath)).default;

			if (!command) {
				logger.error(`Failed to load command ${folder}/${filePath}! (Make sure you do "export default { ... }")`);
				return;
			}

			// Set a new item in the Collection with the key as the command name and the value as the exported module
			client.commands.set(command.data.name, command);

			logger.verbose(`Loaded command ${command.data.name}`);
		}
	}
}

// Add API key to be able to login
client.token = process.env.DISCORD_TOKEN!;

loadCommands();
