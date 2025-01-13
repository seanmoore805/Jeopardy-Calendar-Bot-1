// Deploy slash commands on the Discord API
// Based on https://discordjs.guide/creating-your-bot/command-deployment.html

import {
	REST,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	RESTPutAPIApplicationCommandsResult,
	RESTPutAPIApplicationGuildCommandsResult,
	Routes,
} from "discord.js";
import { applicationId, testGuilds } from "../config.json";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Command from "../types/Command";
import "dotenv/config";
import { serviceLogger } from "../modules/logger";
const token = process.env.DISCORD_TOKEN;
const logger = serviceLogger("deployCommands");

async function deployCommands() {
	// Verify token exists
	if (!token) {
		logger.error("ERROR: Missing Discord.js token!");
		return;
	}

	/** Commands to be deployed "globally" (to all guilds) */
	const globalCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
	/** Commands to be deployed "locally" (to the dev guild only) */
	const localCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
	// Grab all the command folders from the commands directory you created earlier
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const extname = path.extname(__filename);
	const foldersPath = path.join(__dirname, "../commands");
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		// Grab all the command files from the commands directory you created earlier
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(extname));

		// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
		for (const file of commandFiles) {
			const filePath = "file://" + path.join(commandsPath, file);
			const command: Command = (await import(filePath)).default;
			if (!command) {
				logger.error(`Failed to load command ${folder}/${filePath}! (Make sure you do "export default { ... }")`);
				return;
			}
			logger.verbose(`Loading ${command.global ? "GLOBAL" : "LOCAL"} command ${command.data.name}`);
			if (command.global) {
				globalCommands.push(command.data.toJSON());
			} else {
				localCommands.push(command.data.toJSON());
			}
		}
	}

	// Construct and prepare an instance of the REST module
	const rest = new REST().setToken(token);

	// and deploy your commands!
	(async () => {
		try {
			logger.verbose(`Started refreshing ${globalCommands.length} GLOBAL application (/) commands.`);

			// The put method is used to fully refresh all commands globally with the current set
			const data = await rest.put(
				Routes.applicationCommands(applicationId),
				{ body: globalCommands },
			) as RESTPutAPIApplicationCommandsResult;

			logger.info(`Successfully reloaded ${data.length} GLOBAL application (/) commands.`);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			logger.error(error);
		}
	})();
	(async () => {
		try {
			for (const testGuild of testGuilds) {
				// The put method is used to fully refresh all commands in the guild with the current set
				logger.verbose(`Started refreshing ${localCommands.length} LOCAL application (/) commands to guild ${testGuild}.`);
				const data = await rest.put(
					Routes.applicationGuildCommands(applicationId, testGuild),
					{ body: localCommands },
				) as RESTPutAPIApplicationGuildCommandsResult;
				logger.info(`Successfully reloaded ${data.length} LOCAL application (/) commands to guild ${testGuild}.`);
			}
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			logger.error(error);
		}
	})();
}

deployCommands();
