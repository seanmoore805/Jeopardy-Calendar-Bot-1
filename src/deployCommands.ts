import { ApplicationCommand, REST, Routes } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import config from "../config.json";

dotenv.config();
const token = process.env.API_KEY;
const clientId = config.applicationId;
const guildId = config["test-servers"];

if (!token) {
	throw new Error("No token provided.\n" +
		"Please add the Discord bot token to the .env file (see .env.example)");
}

const commands: object[] = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync("./out/src/commands").filter((file) => file.endsWith(".js"));
console.log(`Found ${commandFiles.length} command files.`);

async function loadCommands() {
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		// Skip "post___" admin commands
		if (file.includes("post")) {
			console.log("Skipping " + file);
			continue;
		}
		await import(`./commands/${file}`).then((command) => {
			commands.push(command.data.toJSON());
			console.debug(`Loaded command ${command.data.name}`);
		});
	}
	console.debug(`Loaded ${commands.length} commands.\n`);

	return commands;
}

const rest = new REST({ version: "10" }).setToken(token);

async function deployCommands() {
	const commands = await loadCommands();

	if (commands.length === 0) {
		console.warn("No commands to deploy. Exiting...");
		return;
	}

	if (config.testing) {
		console.warn("WARNING: Testing mode is enabled. Deploying to test servers only.");
		console.warn("To deploy to all servers, set \"testing\" to false in config.json.");
	}

	// Construct and prepare an instance of the REST module

	// and deploy your commands!
	try {
		console.log(`Started refreshing ${commands.length} application commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = config.testing ?
			            await rest.put(
				            Routes.applicationGuildCommands(clientId, guildId),
				            { body: commands },
			            ) as ApplicationCommand[] :
			            await rest.put(
				            Routes.applicationCommands(clientId),
				            { body: commands },
			            ) as ApplicationCommand[];

		console.log(`Successfully reloaded ${data.length} application commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
}

deployCommands();
