import { Events, MessageFlags } from "discord.js";
import "dotenv/config";
import logger from "./modules/logger";
import { client } from "./modules/client";

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
	logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Slash command handler
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) {
		logger.info(`Ignoring non-command interaction from ${interaction.user.displayName}`, interaction);
		return;
	}

	const command = interaction.client.commands.get(interaction.commandName);
	logger.verbose(`Received command from ${interaction.user.displayName}: ${interaction.commandName}`);

	if (!command) {
		logger.error(`No command matching ${interaction.commandName} was found.`);
		await interaction.reply({
			content: "There was an error while executing this command!",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		logger.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: "There was an error while executing this command!",
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({
				content: "There was an error while executing this command!",
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});

// Token already applied from env in ./modules/login
client.login();
