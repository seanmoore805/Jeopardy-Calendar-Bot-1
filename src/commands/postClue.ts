/** @format */

import {
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { Client as DBClient } from "@replit/database";
import emojiToImage from "../emojiToImage";
import { ownerId } from "../../config.json";
import dataset from "../../data/2021.json";
import { Question, Round } from "../types/Question";

const data = new SlashCommandBuilder()
	.setName("post_clue")
	.setDescription("[Admin only] Posts today's clue");


async function execute(interaction: CommandInteraction) {
	if (interaction.user.id !== ownerId) {
		const embed = new EmbedBuilder()
			.setTitle("You are not authorized to use this command.")
			.setDescription("You must be a bot owner to use this command.")
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
			})
			.setTimestamp(new Date())
			.setColor("Red")
			.setThumbnail(emojiToImage("🚫"))
		;

		return await interaction.reply({ embeds: [embed.data], ephemeral: true });
	}

	// Determine today's clue
	const today = new Date();
	const firstDay = new Date(dataset.firstDay + "T00:00:00.000");
	const daysSinceFirstDay = Math.floor((today.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24));

	const clue = dataset.questions[daysSinceFirstDay];
	console.log(clue);

	const image = clue.round === "Jeopardy" ?
		"https://static.wikia.nocookie.net/gameshows/images/b/be/Jeopardy%21_-26.png/revision/latest?cb=20130222023804" :
		clue.round === "Double Jeopardy" ?
			"https://static.wikia.nocookie.net/gameshows/images/f/f2/Double_Jeopardy%21_-64.png/revision/latest?cb=20130222023815" :
			clue.round === "Final Jeopardy" ?
				"https://static.wikia.nocookie.net/gameshows/images/6/66/Final_Jeopardy%21_-65.png/revision/latest?cb=20130222023830" :
				null;

	const database = new DBClient();
	database.set("currentClue", {
		category: clue.category,
		value: clue.value,
		clue: clue.clue,
		originalDate: new Date(clue.originalDate + "T00:00:00"),
		responses: clue.responses,
		round: clue.round === "Jeopardy" ?
			Round.Jeopardy :
			clue.round === "Double Jeopardy" ?
				Round["Double Jeopardy"] :
				clue.round === "Final Jeopardy" ?
					Round["Final Jeopardy"] :
					null,
	} as Question);
	database.set("dayNum", daysSinceFirstDay);



	const embed = new EmbedBuilder()
		.setTitle(`Posting clue for ${today.toLocaleDateString("en-US")}`)
		.setDescription(
			`> **${clue.category} - ${clue.value ?? "Final Jeopardy!"}**
			> ${clue.clue}
			
			*Original date: ${clue.originalDate}*`
		)
		.setImage(image)
		.setFooter({
			text: `Requested by ${interaction.user.tag}`,
			iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
		})
		.setTimestamp(new Date())
		.setColor("Green")
		.setThumbnail(emojiToImage("✅"))
	;

	await interaction.reply({ embeds: [embed.data], ephemeral: true });
}

export { data, execute };
