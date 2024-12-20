/** @format */

import { Client, EmbedBuilder } from "discord.js";
import { Database } from "./database";
import emojiToImage from "../emojiToImage";
import { gameChannels } from "../../config.json";
import dataset from "../../data/2021.json";
import { Question, Round } from "../types/Question";


export async function postClue(client: Client) {
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

	const database = new Database();
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


	// TODO: Add support for Final Jeopardy

	const embed = new EmbedBuilder()
		.setTitle(`Clue for ${today.toLocaleDateString("en-US")}`)
		.setDescription(
			`> **${clue.category} - ${clue.value ?? "Final Jeopardy!"}**
			> ${clue.clue}
			
			*Original date: ${clue.originalDate}*

			Use \`/respond\` to submit your response. The correct response will be revealed at 11pm EST.`
		) // TODO: Use timestamp for 11pm EST - should be exactly today to avoid dst issues
		.setFooter({
			text: "Automatically triggered by timer",
			iconURL: emojiToImage("🕖"),
		})
		.setTimestamp(new Date())
		.setColor("Purple")
		.setThumbnail(image)
	;

	gameChannels.forEach(async (channelId) => {
		const channel = client.channels.cache.get(channelId);
		if (!channel || !channel.isTextBased()) return;
		await channel.send({ embeds: [embed.data] });
	});

}
