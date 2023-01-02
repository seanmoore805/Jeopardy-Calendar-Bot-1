/** @format */

import {
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import emojiToImage from "../emojiToImage";
import { version } from "../../package.json";

const data = new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Replies with pong (show debug info)");

enum TimeUnits {
	SECOND = 1 * 1000,
	MINUTE = 1 * 60 * 1000,
	HOUR = 1 * 60 * 60 * 1000,
	DAY = 1 * 24 * 60 * 60 * 1000,
}

async function execute(interaction: CommandInteraction) {

	let uptimeFormatted = "";
	let uptime = interaction.client.uptime;
	if (uptime > TimeUnits.DAY) {
		// Days
		uptimeFormatted += `${Math.floor(uptime / (TimeUnits.DAY))}d `;
		uptime -= Math.floor(uptime / (TimeUnits.DAY)) * TimeUnits.DAY;
	}
	if (uptime > TimeUnits.HOUR) {
		// Hours
		uptimeFormatted += `${Math.floor(uptime / TimeUnits.HOUR)}h `;
		uptime -= Math.floor(uptime / TimeUnits.HOUR) * TimeUnits.HOUR;
	}
	if (uptime > TimeUnits.MINUTE) {
		// Minutes
		uptimeFormatted += `${Math.floor(uptime / TimeUnits.MINUTE)}m `;
		uptime -= Math.floor(uptime / TimeUnits.MINUTE) * TimeUnits.MINUTE;
	}
	if (uptime > TimeUnits.SECOND) {
		// Seconds
		uptimeFormatted += `${Math.floor(uptime /  TimeUnits.SECOND)}s `;
		uptime -= Math.floor(uptime / TimeUnits.SECOND) * TimeUnits.SECOND;
	}


	const embed = new EmbedBuilder()
		.setTitle(`${interaction.client.user?.username} is online!`)
		.setDescription(
			`Interaction Latency: ${interaction.createdTimestamp - Date.now()} ms
			API Latency: ${Math.round(interaction.client.ws.ping)} ms
			Uptime: ${uptimeFormatted}
			Version: ${version}`
		)
		.setFooter({
			text: `Requested by ${interaction.user.tag}`,
			iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
		})
		.setTimestamp(new Date())
		.setColor("Green")
		.setThumbnail(emojiToImage("🏓"))
	;

	await interaction.reply({ embeds: [embed.data], ephemeral: true });
}

export { data, execute };
