/** @format */

import {
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import dotenv from "dotenv";
import emojiToImage from "../modules/emojiToImage";
import { ownerId, commandIds } from "../../config.json";
import { Database } from "../modules/database";
import { Question } from "../types/Question";

const data = new SlashCommandBuilder()
	.setName("post_results")
	.setDescription("[Admin only] Posts the results of the current clue");


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

	await interaction.deferReply({ ephemeral: true });

	const database = new Database();
	const today = new Date();

	const dayNum = (await database.get("dayNum"));
	let currentClue = (await database.get("currentClue"));
	const responses = await database.get(`responses/${dayNum}`);
	const correctResponses = responses.filter((response) => response.isCorrect);
	const incorrectResponses = responses.filter((response) => !response.isCorrect);
	const weeklyScores = new Map(await database.get(`scores/weekly/${Math.floor(dayNum / 7)}`));
	const alltimeScores = new Map(await database.get("scores/alltime"));
	dotenv.config(); // Sets timezone for nextClueTime (env is "TZ")
	const nextClueTime = new Date(new Date().toISOString().split("T")[0] + "T07:00").valueOf() /
		1000;

	if (!currentClue) {
		currentClue = (await database.get("previousClue"));
	}

	let embed;
	if (currentClue.value === null) {
		// FJ embed with scores
		embed = new EmbedBuilder()
			.setTitle(`Results for ${today.toLocaleDateString("en-US")}`)
			.setDescription(
				`> **${currentClue.category} - Final Jeopardy!**
				> ${currentClue.clue}
				
				*Original date: ${("" + currentClue.originalDate).split("T")[0]}*
				
				The correct response: **${currentClue.responses[0]}**
				
				${correctResponses.length} ${correctResponses.length === 1 ? "person" : "people"} got it right, \
				and ${incorrectResponses.length} ${incorrectResponses.length === 1 ? "person" : "people"} got it wrong. \
				That makes an accuracy of ${(correctResponses.length / (correctResponses.length + incorrectResponses.length) * 100).toFixed(0)}%.
				
				Tomorrow's clue will be posted at <t:${nextClueTime}:t> local.`.replace(/\t/g, "")
			)
			.addFields([
				{
					name: "Acceptable Responses",
					value: typeof currentClue.responses === "string" ?
						"∙ " + currentClue.responses :
						"∙ " + currentClue.responses.filter((r) => r === r.toLowerCase()).join("\n∙ ").substr(0, 1024) + " ",
					inline: true,
				},
				{
					name: "Correct Responses",
					value: correctResponses.length > 0 ?
						joinResponses(correctResponses).substr(0, 1024) + " " :
						"None!",
					inline: true,
				},
				{
					name: "Incorrect Responses",
					value: incorrectResponses.length > 0 ?
						joinResponses(incorrectResponses).substr(0, 1024) :
						"None!",
					inline: true,
				},
				{
					name: `Week ${Math.floor(dayNum / 7)} Scores`,
					value: formatWeeklyScores(weeklyScores).substr(0, 1024),
					inline: true,
				},
				{
					name: "All-Time (YTD) Scores",
					value: formatAlltimeScores(alltimeScores).substr(0, 1024),
					inline: true,
				},
			])
			.setFooter({
				text: "Automatically triggered by timer",
				iconURL: emojiToImage("🕚"),
			})
			.setTimestamp(new Date())
			.setColor("Purple");
		// .setThumbnail(emojiToImage("📝"));
	} else {
		// Regular weekday version w/o scores
		embed = new EmbedBuilder()
			.setTitle(`Results for ${today.toLocaleDateString("en-US")}`)
			.setDescription(`> **${currentClue.category} - $${currentClue.value}**
			> ${currentClue.clue}
			
			*Original date: ${("" + currentClue.originalDate).split("T")[0]}*
			
			The correct response: **${currentClue.responses[0]}**
			
			${correctResponses.length} ${correctResponses.length === 1 ? "person" : "people"} got it right, \
			and ${incorrectResponses.length} ${incorrectResponses.length === 1 ? "person" : "people"} got it wrong. \
				That makes an accuracy of ${(correctResponses.length / (correctResponses.length + incorrectResponses.length) * 100).toFixed(0)}%.
			
			Tomorrow's clue will be posted at <t:${nextClueTime}:t> local.`.replace(/\t/g, ""))
			.addFields([
				{
					name: "Acceptable Responses",
					value: typeof currentClue.responses === "string" ?
						"∙ " + currentClue.responses :
						"∙ " + currentClue.responses.filter((r) => r === r.toLowerCase()).join("\n∙ ").substr(0, 1024) + " ",
					inline: true,
				},
				{
					name: "Correct Responses",
					value: correctResponses.length > 0 ?
						joinResponses(correctResponses).substr(0, 1024) + " " :
						"None!",
					inline: true,
				},
				{
					name: "Incorrect Responses",
					value: incorrectResponses.length > 0 ?
						joinResponses(incorrectResponses).substr(0, 1024) :
						"None!",
					inline: true,
				},
				{
					name: "Scores",
					value: `* To view the current scores for the week, use ${commandIds["stats scores weekly"]}\n` +
					`  * ${weeklyLeaders(weeklyScores)}\n` +
					`  * A total of ${weeklyScores.size} people have responded this week\n` +
					`* To view the current scores for the whole year, use ${commandIds["stats scores alltime"]}\n` +
					`* For an overview of your overall record, use ${commandIds["stats scores user"]}`,
					inline: false,
				}
			])
			.setFooter({
				text: "Automatically triggered by timer",
				iconURL: emojiToImage("🕚"),
			})
			.setTimestamp(new Date())
			.setColor("Purple");
		// .setThumbnail(emojiToImage("📝"));
	}

	await interaction.editReply({ embeds: [embed.data] });// , ephemeral: true });

}

export { data, execute };

/**
 * Helper function to format the list of responses for the embed
 *
 * @param responses Array of responses to join together
 * @returns A string of the unique responses, separated by newlines
 */
function joinResponses(responses) {
	return "∙ " + responses
		.map((response) => response.strippedResponse.replaceAll("\n* ", "\n\\* ").replaceAll("\n", "`\\n` ")) // Map down to just responses + Anti-Benny measures
		.filter((res, idx, arr) => arr.indexOf(res) === idx) // Filter out duplicates
		.map((response) => [response, responses.filter((res, idx, arr) => res.strippedResponse === response).length]) // Count number of responses
		.sort((a, b) => b[1] - a[1]) // Sort by number of responses
		.map((response) => `${response[0]} *(x${response[1]})*`) // Map back down to one array (*uses en space - ' ')
		.join("\n∙ "); // Join together with newlines
}

/**
 * Helper function to format the list of scores for the embed
 *
 * @param scores Map of scores to format
 * @returns A string of the scores, sorted by score descending, separated by newlines
 *          Each line formatted as "1. @user - $200"
 */
function formatScores(scores) {
	return "∙ " + Array.from(scores.entries())
		.sort((a, b) => b[1] - a[1]) // Sort by score, descending
		.map((entry, idx) => `​${idx + 1}. <@${entry[0]}>: $${entry[1]}`) // Map to string
		.join("\n") // Join together with newlines
		.substring(0, 1024); // Limit to max length of field (TODO: this is the laziest way possible!)
}
function formatWeeklyScores(scores) {
	const sortedScores = Array.from(scores.entries())
		.map((entry) => entry[1]) // Map down to just scores
		.filter((score, idx, arr) => arr.indexOf(score) === idx) // Filter out duplicates
		.sort((a, b) => b - a); // Sort by score, descending
	let ret = "";
	let position = 1;
	for (const score of sortedScores) {
		ret += `__​${position}. $${score}__  `;
		ret += Array.from(scores.entries())
			.filter((entry) => entry[1] === score)
			.map((entry) => `<@${entry[0]}>`)
			.join(", ");
		ret += "\n";
		position += Array.from(scores.entries())
			.filter((entry) => entry[1] === score)
			.length;
		if (position > 25) {
			ret += `Use ${commandIds["stats scores weekly"]} to see the full list`;
			break;
		}
	}
	return ret;
}
function formatAlltimeScores(scores) {
	const sortedScores = Array.from(scores.entries())
		.map((entry) => entry[1]) // Map down to just scores
		.filter((score, idx, arr) => arr.indexOf(score) === idx) // Filter out duplicates
		.sort((a, b) => b - a); // Sort by score, descending
	let ret = "";
	let position = 1;
	for (const score of sortedScores) {
		ret += `__​${position}. $${score}__  `;
		ret += Array.from(scores.entries())
			.filter((entry) => entry[1] === score)
			.map((entry) => `<@${entry[0]}>`)
			.join(", ");
		ret += "\n";
		position += Array.from(scores.entries())
			.filter((entry) => entry[1] === score)
			.length;
		if (position > 20) {
			ret += `Use ${commandIds["stats scores alltime"]} to see the full list`;
			break;
		}
	}
	return ret;
}
function weeklyLeaders(scores) {
	const sortedScores = Array.from(scores.entries())
		.map((entry) => entry[1]) // Map down to just scores
		.filter((score, idx, arr) => arr.indexOf(score) === idx) // Filter out duplicates
		.sort((a, b) => b - a); // Sort by score, descending
	const score = sortedScores[0];

	/** @type {String[]} Array of users ids of everyone in first */
	const firstPlace = Array.from(scores.entries())
		.filter((entry) => entry[1] === score);

	if (firstPlace.length === 1) {
		return `Congrats, <@${firstPlace[0][0]}>! You lead the pack alone with $${score}!`;
	} else if (firstPlace.length === 2) {
		return `<@${firstPlace[0][0]}> and <@${firstPlace[1][0]}> are in joint-first place with $${score}!`;
	} else if (firstPlace.length <= 5) {
		return `${firstPlace.slice(0, -1).map((entry) => `<@${entry[0]}>`).join(", ")}, and <@${firstPlace.slice(-1)[0][0]}> are in ${aOrAnNumber(firstPlace.length)}-way tie for first at $${score}!`;
	} else if (firstPlace.length < 25) {
		return `We have ${aOrAnNumber(firstPlace.length)}-way tie for first at $${score}!`;
	} else if (firstPlace.length < 50) {
		return `It's crowded at the top with ${aOrAnNumber(firstPlace.length)}-way tie for first at $${score}!`;
	} else if (firstPlace.length < 75) {
		return `We have a whopping **${firstPlace.length}-way** tie for first place at $${score}!`;
	} else if (firstPlace.length < 100) {
		return `I'm running out of adjectives! It's an amazing **${firstPlace.length}-way** tie for first place at $${score}!`;
	} else {
		return `Wow, I can't believe it. Triple digits! **\\*\\*${firstPlace.length} people\\*\\***, all tied for first place with $${score}! Great job, everyone!`;
	}
}
function aOrAnNumber(number: number) {
	// "eleven" or "eighteen" or any number starting with 8
	if (number === 11 || number === 18 || ("" + number)[0] === "8") {
		return "an " + number;
	} else {
		return "a " + number;
	}
}
