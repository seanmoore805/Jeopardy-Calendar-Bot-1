/** @format */

import {
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import emojiToImage from "../emojiToImage";

const data = new SlashCommandBuilder()
	.setName("respond")
	.setDescription("Respond to today's clue")
	.addStringOption((builder) => {
		return builder
			.setName("response")
			.setDescription("Your response to the clue")
			.setRequired(true);
	})
	.addIntegerOption((builder) => {
		return builder
			.setName("wager")
			.setDescription("Your Final Jeopardy! wager (Saturdays only)")
			.setRequired(false)
			.setMinValue(0);
	});

async function execute(interaction: CommandInteraction) {
	const embed = new EmbedBuilder()
		.setTitle("Responses are not yet implemented!")
		.setDescription(
			"I don't have a database set up yet, so I can't record your responses.\n" +
			"Please wait until <@438818224293937153> gives the go-ahead to start responding."
		)
		.setFooter({
			text: `Requested by ${interaction.user.tag}`,
			iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
		})
		.setTimestamp(new Date())
		.setColor("Yellow")
		.setThumbnail(emojiToImage("🚧"))
	;

	await interaction.reply({ embeds: [embed.data], ephemeral: true });
}

export { data, execute };
