import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import emojiToImage from "../emojiToImage";

const data = new SlashCommandBuilder()
	.setName("help")
	.setDescription("Shows a list of all commands");

async function execute(interaction: CommandInteraction) {
	const commandsPath = __dirname;
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith(".js"));
	const embed = new EmbedBuilder()
		.setTitle(`Help for ${interaction.client.user?.username}`)
		.setDescription("Here are all my commands:")
		.setFooter({
			text: `Requested by ${interaction.user.username}`,
			iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
		})
		.setTimestamp(new Date())
		.setColor("Blue")
		.setThumbnail(emojiToImage("ℹ"))
	;

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		await import(filePath).then((command) => {
			// Set a new item in the Collection with the key as the command name and the value as the exported module
			if ("data" in command && "execute" in command) {
				embed.addFields({
					name: "/" + command.data.name,
					value: command.data.description
				});
			} else {
				console.warn(
					`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
				);
			}
		});
	}

	await interaction.reply({ embeds: [embed.data], ephemeral: true });
}

export { data, execute };
