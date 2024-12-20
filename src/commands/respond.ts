/** @format */

import {
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import emojiToImage from "../emojiToImage";
import { Database } from "../modules/database";
import { Question } from "../types/Question";

const data = new SlashCommandBuilder()
	.setName("respond")
	.setDescription("Respond to today's clue")
	.addStringOption((builder) => {
		return builder
			.setName("response")
			.setDescription("Your response to the clue")
			.setMaxLength(300)
			.setRequired(true);
	});

async function execute(interaction: CommandInteraction) {
	const response = interaction.options.get("response", true).value as string;
	const wager = interaction.options.get("wager", false)?.value;

	const strippedResponse = response
		.toLowerCase()
		.replace(/^(what|who|where|when) (is|are) (an|a|the)? ?/, "")
		.replace("is it ", "")
		.replace(/\?$/, "")
		.replace("?", "");

	const db = new Database();
	const dayNum = await db.get("dayNum") as number;
	const currentClue = await db.get("currentClue") as Question;

	const today = new Date();
	const resultTime = Math.round(new Date(today.toDateString() + " 23:00").valueOf() / 1000);

	// TODO: Add stop accepting when no active clue

	db.set(`responses/${dayNum}/${interaction.user.id}`, strippedResponse);

	const isCorrect = currentClue.responses.includes(strippedResponse);

	const value = currentClue.value ?? await db.get(`wagers/${dayNum}/${interaction.user.id}`) as number;
	const scoreAdjustment = isCorrect ? value : -value;

	db.get(`scores/weekly/${interaction.user.id}`).then((score) => {
		if (score && +score === score) {
			db.set(`scores/weekly/${interaction.user.id}`, score + scoreAdjustment);
		} else {
			db.set(`scores/weekly/${interaction.user.id}`, scoreAdjustment);
		}
	});

	db.get(`scores/alltime/${interaction.user.id}`).then((score) => {
		if (score && +score === score) {
			db.set(`scores/alltime/${interaction.user.id}`, score + scoreAdjustment);
		} else {
			db.set(`scores/alltime/${interaction.user.id}`, scoreAdjustment);
		}
	});

	const embed = new EmbedBuilder()
		.setTitle("Your response has been recorded!")
		.setDescription(
			`You responded: \`${response}\`
			Which I interpreted as: \`${strippedResponse}\`
			to the clue:
			> ${currentClue.category} - ${currentClue?.value ?? "Final Jeopardy!"}
			> ${currentClue.clue}` +
			(interaction.options.get("wager", false) ?
				`\nand wagered \`$${wager}\`, but that's not implemented yet, \
				so it's been ignored.` :
				"") +
			`\n\nThe correct response will be revealed tonight at <t:${resultTime}:t>.`
		)
		.setFooter({
			text: `Requested by ${interaction.user.tag}`,
			iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
		})
		.setTimestamp(new Date())
		.setColor("Green")
		.setThumbnail(emojiToImage("✅"))
	;

	await interaction.reply({ embeds: [embed.data], ephemeral: true });

	console.log(`Response by ${interaction.user.tag}: ${strippedResponse} - ${isCorrect ? "Correct" : "Incorrect"}`);
}

export { data, execute };
