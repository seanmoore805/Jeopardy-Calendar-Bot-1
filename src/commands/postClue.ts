/** @format */

import {
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { Database } from "../modules/database";
import emojiToImage from "../modules/emojiToImage";
import { ownerId, gameChannels, commandIds } from "../../config.json";
import dataset from "../../data/2021.json";
import { Question, Round } from "../types/Question";
import { channel } from "diagnostics_channel";

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

	const resultTime = Math.round(new Date(today.toDateString() + " 23:00").valueOf() / 1000);

	const clue = dataset.questions[daysSinceFirstDay];
	console.log(clue);

	// TODO: This should probably be like a config or lookup table or something
	const image = clue.round === "Jeopardy" ?
		"https://static.wikia.nocookie.net/gameshows/images/b/be/Jeopardy%21_-26.png/revision/latest?cb=20130222023804" :
		clue.round === "Double Jeopardy" ?
			"https://static.wikia.nocookie.net/gameshows/images/f/f2/Double_Jeopardy%21_-64.png/revision/latest?cb=20130222023815" :
			clue.round === "Final Jeopardy" ?
				"https://static.wikia.nocookie.net/gameshows/images/6/66/Final_Jeopardy%21_-65.png/revision/latest?cb=20130222023830" :
				null;

	const database = new Database();
	database.set("currentClue", {
		category: clue.category,
		value: clue.value,
		clue: clue.clue,
		originalDate: new Date(clue.originalDate + "T00:00:00"),
		responses: clue.responses,
		round:
		// TODO: This is dumb. Fix it.
		clue.round === "Jeopardy" ?
			Round.Jeopardy :
			clue.round === "Double Jeopardy" ?
				Round["Double Jeopardy"] :
				clue.round === "Final Jeopardy" ?
					Round["Final Jeopardy"] :
					null,
	} as Question);
	database.set("dayNum", daysSinceFirstDay);


	// TODO: Add support for Final Jeopardy
	if (clue.round === "Final Jeopardy") {
		const embed = new EmbedBuilder()
			.setTitle(`Final Jeopardy category for ${today.toLocaleDateString("en-US")}`)
			.setDescription(
				`> **${clue.category} - Final Jeopardy!**

				*Original date: ${clue.originalDate}*

				Use ${commandIds["wager"]} to submit your wager. Your current scores are listed below, \
				wager based on your **weekly** score. Less than $0? You can still participate by wagering $0.

				The correct response will be revealed at <t:${resultTime}:t>.`.replace(/\t/g, "")
			)
			.addFields([
				{
					name: `Week ${Math.floor(daysSinceFirstDay / 7)} Scores`,
					value: formatScores(new Map(await database.get(`scores/weekly/${Math.floor(daysSinceFirstDay / 7)}`))),
					inline: true,
				},
				{
					name: "All-Time (YTD) Scores",
					value: formatScores(new Map(await database.get("scores/alltime"))),
					inline: true,
				},
			])
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
			})
			.setTimestamp(new Date())
			.setColor("Purple")
			.setThumbnail(image);

		// Find ping for this channel
		const id = gameChannels.filter((channel) => channel.channelId === interaction.channelId)[0]?.roleId;

		await interaction.reply({
			content: id ? `<@&${id}> New clue!` : "",
			embeds: [embed.data],
			ephemeral: false
		});

		return;
	}

	const embed = new EmbedBuilder()
		.setTitle(`Clue for ${today.toLocaleDateString("en-US")}`)
		.setDescription(
			`> **${clue.category} - $${clue.value}**
			> ${clue.clue}
			
			*Original date: ${clue.originalDate}*

			Use ${commandIds["respond"]} to submit your response. The correct response will be revealed at <t:${resultTime}:t>.`
		)
		.setFooter({
			text: `Requested by ${interaction.user.tag}`,
			iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
		})
		.setTimestamp(new Date())
		.setColor("Purple")
		.setThumbnail(image)
	;

	// Find ping for this channel
	const id = gameChannels.filter((channel) => channel.channelId === interaction.channelId)[0]?.roleId;

	await interaction.reply({
		content: id ? `<@&${id}> New clue!` : "",
		embeds: [embed.data],
		ephemeral: false
	});
}

export { data, execute };

/**
 * Helper function to format the list of scores for the embed
 *
 * @param scores Map of scores to format
 * @returns A string of the scores, sorted by score descending, separated by newlines
 *          Each line formatted as "1. @user - $200"
 */
function formatScores(scores: Map<string, string[]>) {
	let ret = "";
	let position = 1;
	for (const score of scores) {
		ret += `__${position}. $${score}__  `;
		ret += Array.from(scores.entries())
			.filter((entry) => entry[1] === score)
			.map((entry) => `<@${entry[0]}>`)
			.join(", ");
		ret += "\n";
		position += Array.from(scores.entries())
			.filter((entry) => entry[1] === score)
			.length;
		if (position > 30) {
			ret += "Use `/stats scores weekly` to see the full list (not yet implemented)";
			break;
		}
	}
	return ret;
}
