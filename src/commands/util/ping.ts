import { SlashCommandBuilder } from "discord.js";
import Command from "../../types/Command";

export default {
	global: false,
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Replies with Pong!"),
	async execute(interaction) {
		await interaction.reply("Pong!");
	},
} satisfies Command;
