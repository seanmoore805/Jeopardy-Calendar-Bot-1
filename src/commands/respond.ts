/** @format */

import {
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import dotenv from "dotenv";
import emojiToImage from "../modules/emojiToImage";
import { Database } from "../modules/database";
import { Question } from "../types/Question";
import { ownerId, commandIds } from "../../config.json";
import { gradeResponse } from "../modules/gradeResponse";

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

	const strippedResponse = response.trim()
		.toLowerCase()
		.replace(/^¿+|\?+$/g, "") // Drop trailing/leading ?s
		.replace(/[‘’]/g, "'") // Un-smart-ify quotes
		.replace(/[“”]/g, '"') // Un-smart-ify quotes
		.replace(/ {2,}/g, " ") // Collapse multiple spaces
		.replace(/^(what|who|where|when|why|how)('?s| (was|is|are|were)) /g, "") // Drop leading "what is"/etc
		.replace(/^(is|was) (it|this|that) (called )?/g, "")
		.replace(/^(an|a|the) /g, "") // Drop leading articles
		.trim() // Drop trailing/leading spaces
	;

	const db = new Database();
	const dayNum = await db.get("dayNum") as number;
	const currentClue = await db.get("currentClue") as Question;

	const today = new Date();
	const resultTime = Math.round(new Date(today.toDateString() + " 23:00").valueOf() / 1000);

	// Don't allow responses after the results are posted
	if (!currentClue) {
		dotenv.config(); // Sets timezone for nextClueTime (env is "TZ")
		const nextClueTime = new Date(new Date().toISOString().split("T")[0] + "T07:00").valueOf() /
                1000;
		console.log("Rejected: No active clue");
		const embed = new EmbedBuilder()
			.setTitle("There is no active clue!")
			.setDescription(`There is no active clue right now. Please wait for the next clue to be posted.
				
				The next clue will be posted at <t:${nextClueTime}:t> local (<t:${nextClueTime}:R> from now).`.replace(/\t/g, ""))
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
			})
			.setTimestamp(new Date())
			.setColor("Red")
			.setThumbnail(emojiToImage("⛔"));
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
	let responses = (await db.get(`responses/${dayNum}`));
	if (!responses) {
		responses = [];
	}
	// Block duplicate responses
	const duplicateResponse = responses.find((r) => r.userId === interaction.user.id);
	if (duplicateResponse) {
		console.log("Rejected: Duplicate response");
		const embed = new EmbedBuilder()
			.setTitle("You've already responded to this clue!")
			.setDescription(`You already responded to the clue:
				> **${currentClue.category} - ${currentClue?.value ?? "Final Jeopardy!"}**
				> ${currentClue.clue}
				
				with the response: \`${duplicateResponse.rawResponse}\`
				which I interpreted as: \`${duplicateResponse.strippedResponse}\`
				
				If you think this is a mistake, please contact <@${ownerId}>`)
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
			})
			.setTimestamp(new Date())
			.setColor("Red")
			.setThumbnail(emojiToImage("❌"));
		return interaction.reply({ embeds: [embed], ephemeral: true });
	}
	// Make sure they wagered first if FJ!
	if (currentClue.value === null) {
	        const db = new Database();
	        let wagers = (await db.get(`wagers/${Math.floor(dayNum / 7)}`));
	        wagers = new Map(wagers);
	        if (!wagers) {
	            wagers = new Map();
	        }
	        if (wagers.get(interaction.user.id) == null) {
			console.log("Rejected: No wager");
	            const embed = new EmbedBuilder()
	                .setTitle("You haven't wagered yet!")
	                .setDescription(`You have to use </wager:1061749970253922334> to submit your wager before you can respond to the clue. As a reminder, here's the category:
					
					> **${currentClue.category} - Final Jeopardy!**
					*Original date: ${currentClue.originalDate.substr(0,10)}*
	
					Use ${commandIds["stats scores alltime"]} to see your score for this week, or scroll up to the clue message. Less than $0? You can still participate by wagering $0.
	
	 				The clue will be revealed after you submit your wager.
					
					If you think this is a mistake, please contact <@${ownerId}>`)
	                .setFooter({
	                text: `Requested by ${interaction.user.tag}`,
	                iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
	            })
	                .setTimestamp(new Date())
	                .setColor("Red")
	                .setThumbnail(emojiToImage("❌"));
	            return interaction.reply({ embeds: [embed], ephemeral: true });
		}
	}

	await interaction.deferReply({ ephemeral: true });

	const isCorrect = gradeResponse(
		strippedResponse,
		typeof currentClue.responses === "string" ? [currentClue.responses] : currentClue.responses
	);
	responses.push({
		userId: interaction.user.id,
		rawResponse: response,
		strippedResponse: strippedResponse,
		isCorrect: isCorrect,
		time: interaction.createdTimestamp,
	});
	await db.set(`responses/${dayNum}`, responses);
	const value = currentClue.value ?? await getWager(Math.floor(dayNum / 7), interaction.user.id);

	const scoreAdjustment = isCorrect ? value : -value;

	db.get(`scores/weekly/${Math.floor(dayNum / 7)}`).then((scores) => {
		scores = new Map(scores);
		if (!scores) {
			scores = new Map();
		}
		const currentScore = scores.get(interaction.user.id) ?? 0;
		scores.set(interaction.user.id, currentScore + scoreAdjustment);
		
		db.set(`scores/weekly/${Math.floor(dayNum / 7)}`, Array.from(scores.entries())).then(() => {
			db.get("scores/alltime").then((scores) => {
				scores = new Map(scores);
				if (!scores) {
					scores = new Map();
				}
				const currentScore = scores.get(interaction.user.id) ?? 0;
				scores.set(interaction.user.id, currentScore + scoreAdjustment);
				db.set("scores/alltime", Array.from(scores.entries()));
			});
		});
	});
	// db.get("scores/alltime").then((scores) => {
	//     var _a;
	//     scores = new Map(scores);
	//     if (!scores) {
	//         scores = new Map();
	//     }
	//     const currentScore = (_a = scores.get(interaction.user.id)) !== null && _a !== void 0 ? _a : 0;
	//     scores.set(interaction.user.id, currentScore + scoreAdjustment);
	//     db.set("scores/alltime", Array.from(scores.entries()));
	// });


	const embed = new EmbedBuilder()
		.setTitle("Your response has been recorded!")
		.setDescription(
			`You responded: \`${response}\`
			Which I interpreted as: \`${strippedResponse}\`
			
			To the clue:
			> **${currentClue.category} - ${currentClue?.value ?? "Final Jeopardy!"}**
			> ${currentClue.clue}

			If this doesn't seem right, please let <@${ownerId}> know to fix it.
			
			The correct response will be revealed tonight at <t:${resultTime}:t> local.`.replace(/\t/g, "")
		)
		.setFooter({
			text: `Requested by ${interaction.user.tag}`,
			iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
		})
		.setTimestamp(new Date())
		.setColor("Green")
		.setThumbnail(emojiToImage("✅"))
	;

	await interaction.editReply({ embeds: [embed.data] });

	console.log(`Response by @${interaction.user.tag}: ${strippedResponse} - ${isCorrect ? "Correct" : "INCORRECT"}`);
	if (!isCorrect) {
		interaction.client.users.fetch(ownerId)
			.then((user) => user.createDM()
				.then((ch) => ch.send(
					`Incorrect response by @${interaction.user.tag}: \`${strippedResponse}\``)
				)
			)
		;
	}
}

async function getWager(weekNum: number, userId: string) {
	const db = new Database();
	let wagers = (await db.get(`wagers/${weekNum}`));
	wagers = new Map(wagers);
	if (!wagers) {
		wagers = new Map();
	}
	return wagers.get(userId) ?? 0;
}

export { data, execute };
