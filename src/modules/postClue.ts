/** @format */

import { Client, EmbedBuilder } from "discord.js";
import { Database } from "./database";
import emojiToImage from "./emojiToImage";
import { gameChannels, commandIds } from "../../config.json";
import dataset from "../../data/2022.json";
import { Question, Round } from "../types/Question";


export default async function postClue(client: Client) {
	console.log("Posting clue...");
	// Determine today's clue
	const today = new Date();
	const firstDay = new Date(dataset.firstDay + "T00:00:00.000");
	const daysSinceFirstDay = Math.floor((today.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24));
	const resultTime = Math.round(new Date(today.toDateString() + " 23:00").valueOf() / 1000);

	const clue = dataset.questions[daysSinceFirstDay];
	if (!clue) {
		console.log("Missing clue!");
		return;
	}

	const image = clue.round === "Jeopardy" ?
		"https://static.wikia.nocookie.net/gameshows/images/b/be/Jeopardy%21_-26.png/revision/latest?cb=20130222023804" :
		clue.round === "Double Jeopardy" ?
			"https://static.wikia.nocookie.net/gameshows/images/f/f2/Double_Jeopardy%21_-64.png/revision/latest?cb=20130222023815" :
			clue.round === "Final Jeopardy" ?
				"https://static.wikia.nocookie.net/gameshows/images/6/66/Final_Jeopardy%21_-65.png/revision/latest?cb=20130222023830" :
				null;

	const database = new Database();
	if (await database.get("currentClue")) {
		console.log("Clue already posted");
		return;
	}
	console.log(clue);

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

	let embed;

	if (clue.round === "Final Jeopardy") {
		// FJ embed with scores
		embed = new EmbedBuilder()
			.setTitle(`Final Jeopardy category for ${today.toLocaleDateString("en-US")}`)
			.setDescription(
				`> **${clue.category} - Final Jeopardy!**

				*Original date: ${clue.originalDate}*

				Use ${commandIds["wager"]} to submit your wager. Your current scores are listed below, \
				wager based on your **weekly** score. Less than $0? You can still participate by wagering $0.

				The clue will be revealed after you submit your wager.

				The correct response will be revealed at <t:${resultTime}:t> local.`.replace(/\t/g, "")
			)
			.addFields([
				{
					name: `Week ${Math.floor(daysSinceFirstDay / 7)} Scores`,
					value: formatWeeklyScores(new Map(await database.get(`scores/weekly/${Math.floor(daysSinceFirstDay / 7)}`))).substr(0, 1024),
					inline: true,
				},
				{
					name: "All-Time (YTD) Scores",
					value: formatAlltimeScores(new Map(await database.get("scores/alltime"))).substr(0, 1024),
					inline: true,
				},
			])
			.setFooter({
				text: "Automatically triggered by timer",
				iconURL: emojiToImage("🕖"),
			})
			.setTimestamp(new Date())
			.setColor("Purple")
			.setThumbnail(image)
		;
	} else {
		// Regular weekday version w/o scores
		embed = new EmbedBuilder()
			.setTitle(`Clue for ${today.toLocaleDateString("en-US")}`)
			.setDescription(
				`> **${clue.category} - $${clue.value}**
				> ${clue.clue}
				
				*Original date: ${clue.originalDate}*
				
				Use ${commandIds["wager"]} to submit your response. The correct response will be revealed at <t:${resultTime}:t> local.`.replace(/\t/g, "")
			)
			.setFooter({
				text: "Automatically triggered by timer",
				iconURL: emojiToImage("🕖"),
			})
			.setTimestamp(new Date())
			.setColor("Purple")
			.setThumbnail(image)
		;
	}

	console.log(embed.data);

	gameChannels.forEach(async (gameChannel) => {
		const channel = client.channels.cache.get(gameChannel.channelId);
		if (!channel) {
			console.error(`Sending results FAILED: \
				Channel ${gameChannel.channelId} could not be found`);
			return;
		}
		if (!channel.isTextBased()) {
			console.error(`Sending results FAILED: \
				Channel ${gameChannel.channelId} is not text-based`);
			return;
		}
		if (!client.user) {
			console.error("Sending results FAILED: \
				Client user is not logged in");
			return;
		}
		if (!channel.isDMBased()) {
			const botGuildMember = channel.guild.members.cache.get(client.user.id);

			if (!botGuildMember) {
				console.error(`Unable to validate permissions: \
					Could not get bot guild member for channel ${gameChannel.channelId}`);
				return;
			}
			if (!channel.permissionsFor(botGuildMember).has("SendMessages")) {
				console.error(`Sending results FAILED: \
					Bot does not have permission to send messages in channel ${gameChannel.channelId}`);
				return;
			}
			if (!channel.permissionsFor(botGuildMember).has("EmbedLinks")) {
				console.error(`Sending results FAILED: \
					Bot does not have permission to make embeds in channel ${gameChannel.channelId}`);
				return;
			}
		}

		try {
			await channel.send({
				content: gameChannel.roleId ? `<@&${gameChannel.roleId}> New clue!` : "",
				embeds: [embed.data],
			});

			// Unset currentClue to close responses
			database.set("previousClue", clue);
			database.delete("currentClue");
		} catch (err) {
			console.log(err);
		}
	});

	return;
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

