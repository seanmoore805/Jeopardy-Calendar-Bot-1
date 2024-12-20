/** @format */

import { Client, EmbedBuilder } from "discord.js";
import { Database } from "./database";
import emojiToImage from "../emojiToImage";
import { gameChannels } from "../../config.json";
import { Question } from "../types/Question";

export async function postResults(client: Client) {
	const database = new Database();
	const today = new Date();
	const dayNum = (await database.get("dayNum")) as number;
	const currentClue = (await database.get("currentClue")) as Question;

	const responseKeys = await database.list(`response/${dayNum}/`);
	const responses = await Promise.all(
		await responseKeys.map((key) => database.get(key) as Promise<string>)
	);

	const acceptableResponses = responses.filter((response) =>
		currentClue.responses.includes(response)
	);
	const incorrectResponses = responses.filter(
		(response) => !currentClue.responses.includes(response)
	);

	const scoresKeys = (await database.list()).filter((key) =>
		key.startsWith("scores/weekly/")
	);
	const scores = await Promise.all(
		scoresKeys.map((key) => database.get(key) as Promise<number>)
	);

	const nextClueTime = Math.round(
		new Date(
			today.getUTCFullYear(),
			today.getUTCMonth() - 1,
			today.getUTCDate() + 1,
			7
		).valueOf() / 1000
	);

	const embed = new EmbedBuilder()
		.setTitle(`Results for ${today.toLocaleDateString("en-US")}`)
		.setDescription(
			`> **${currentClue.category} - ${currentClue.value ?? "Final Jeopardy!"}**
			> ${currentClue.clue}
		
			*Original date: ${currentClue.originalDate}*
			
			The correct response: **${currentClue.responses[0]}**
			
			${responses.length - incorrectResponses.length} people got it right, \
			and ${incorrectResponses.length} people got it wrong.
			
			Tomorrow's clue will be posted at <t:${nextClueTime}:t>.`
		)
		.addFields([
			{
				name: "Acceptable Responses",
				value:
					acceptableResponses.length > 0 ? acceptableResponses.join("\n") : "None!",
				inline: true,
			},
			{
				name: "Incorrect Responses",
				value:
					incorrectResponses.length > 0 ?
						incorrectResponses.join("\n") :
						"None!",
				inline: true,
			},
			{
				name: "Updated Scores",
				value: "TBD",
				inline: false,
			},
		])
		.setFooter({
			text: "Manually triggered from console",
			iconURL: emojiToImage("🕖"),
		})
		.setTimestamp(new Date())
		.setColor("Purple")
		.setThumbnail(emojiToImage("📝"));
	console.log(embed.data.description);
	gameChannels.forEach(async (channelId) => {
		const channel = client.channels.cache.get(channelId);
		if (!channel || !channel.isTextBased()) return;
		await channel.send({ embeds: [embed.data] });
	});
}
