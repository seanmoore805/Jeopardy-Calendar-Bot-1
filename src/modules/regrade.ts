import { Database } from "./database";
import dataset from "../../data/2022.json";
import gradeResponse from "./gradeResponse";

/**
 * Regrades all responses for the given week and recalculates scores
 *
 * @param weekNum The number of the week to regrade
 */
export async function regradeWeek(weekNum: number) {
	const db = new Database();
	const firstDay = weekNum * 7;
	const lastDay = firstDay + 6;

	let alltimeScores = (await db.get("scores/alltime"));
	alltimeScores = new Map(alltimeScores);
	let weeklyScores = (await db.get(`scores/weekly/${weekNum}`));
	weeklyScores = new Map(weeklyScores);

	// Clear scores for the week
	for (const [userId, score] of weeklyScores) {
		const currentScore = alltimeScores.get(userId);
		if (!currentScore) {
			continue;
		}
		alltimeScores.set(userId, currentScore - score);
	}
	weeklyScores.clear();

	for (let dayNum = firstDay; dayNum <= lastDay; dayNum++) {
		const responses = (await db.get(`responses/${dayNum}`));
		if (!responses) {
			continue;
		}
		const currentClue = dataset.questions[dayNum];
		if (!currentClue) {
			console.error(`FAILED: Missing clue for day ${dayNum}`);
			return;
		}
		for (const response of responses) {
			const userId = response.userId;
			const isCorrect = gradeResponse(response.strippedResponse, currentClue.responses);
			response.isCorrect = isCorrect;

			const value = currentClue.value ??
				await getWager(weekNum, userId, weeklyScores.get(userId) ?? 0);
			const scoreAdjustment = isCorrect ? value : -value;

			// Update scores
			alltimeScores.set(userId, (alltimeScores.get(userId) ?? 0) + scoreAdjustment);
			weeklyScores.set(userId, (weeklyScores.get(userId) ?? 0) + scoreAdjustment);
		}
		db.set(`responses/${dayNum}`, Array.from(responses));
	}
	// Push scores to database
	db.set("scores/alltime", Array.from(alltimeScores));
	db.set(`scores/weekly/${weekNum}`, Array.from(weeklyScores));
}

/**
 * Regrades all a user's responses and recalculates their scores
 *
 * @param userId The snowflake (ID) of the user to regrade
 */
export async function regradeUser(userId: string) {
	const db = new Database();

	const currentDay = (await db.get("dayNum"));
	const currentWeek = Math.floor(currentDay / 7);

	let alltimeScores = (await db.get("scores/alltime"));
	alltimeScores = new Map(alltimeScores);

	const weeklyScores = [];

	for (let i = 0; i < currentWeek; i++) {
		let scores = (await db.get(`scores/weekly/${i}`));
		scores = new Map(scores);
		weeklyScores.push(scores);
	}

	// Clear the user's scores
	alltimeScores.delete(userId);
	for (let i = 0; i < currentWeek; i++) {
		weeklyScores[i].delete(userId);
	}

	// Regrade the user's responses and recalculate scores
	for (let dayNum = 0; dayNum < currentDay; dayNum++) {
		const weekNum = Math.floor(dayNum / 7);
		const responses = (await db.get(`responses/${dayNum}`));

		if (!responses) {
			continue;
		}

		const response = responses.find((r) => r.userId === userId);
		if (!response) {
			continue;
		}

		const currentClue = dataset.questions[dayNum];
		if (!currentClue) {
			console.error(`FAILED: Missing clue for day ${dayNum}`);
			return;
		}

		const isCorrect = gradeResponse(response.strippedResponse, currentClue.responses);
		response.isCorrect = isCorrect;

		db.set(`responses/${dayNum}`, Array.from(responses));

		const value = currentClue.value ??
			await getWager(weekNum, userId, (weeklyScores[weekNum].get(userId) ?? 0));
		const scoreAdjustment = isCorrect ? value : -value;

		// Update scores
		alltimeScores.set(userId, (alltimeScores.get(userId) ?? 0) + scoreAdjustment);
		weeklyScores[weekNum].set(userId, (weeklyScores[weekNum].get(userId) ?? 0) + scoreAdjustment);
	}

	// Push scores to database
	db.set("scores/alltime", Array.from(alltimeScores));
	for (let i = 0; i < currentWeek; i++) {
		db.set(`scores/weekly/${i}`, Array.from(weeklyScores[i]));
	}
}

/**
 * Regrades ALL responses and recalculates scores
 */
export async function regradeAll() {
	const db = new Database();

	const currentDay = (await db.get("dayNum"));
	const currentWeek = Math.floor(currentDay / 7);
	const alltimeScores = new Map();
	const weeklyScores: Map<string, number>[] = [];

	// Regrade the all responses and recalculate scores
	for (let dayNum = 0; dayNum <= currentDay; dayNum++) {
		const weekNum = Math.floor(dayNum / 7);
		let responses = (await db.get(`responses/${dayNum}`));
		if (!responses) {
			continue;
		}

		// Trim duplicate responses
		responses = responses.filter((res, idx, arr) => {
			return arr.findIndex((r) => r.userId === res.userId) === idx;
		});

		const currentClue = dataset.questions[dayNum];
		if (!currentClue) {
			console.error(`FAILED: Missing clue for day ${dayNum}`);
			return;
		}

		weeklyScores[weekNum] = weeklyScores[weekNum] ?? new Map();
		console.log(dayNum + " / " + weekNum + " - $" + currentClue.value);

		for (const response of responses) {
			const userId = response.userId;
			const isCorrect = gradeResponse(response.strippedResponse, currentClue.responses);
			response.isCorrect = isCorrect;

			const value = currentClue.value ??
				await getWager(weekNum, userId, (weeklyScores[weekNum].get(userId) ?? 0));
			const scoreAdjustment = isCorrect ? value : -value;

			// Update scores
			if (weekNum !== 0 && weekNum !== 51) {
				alltimeScores.set(userId, (alltimeScores.get(userId) ?? 0) + scoreAdjustment);
			}
			weeklyScores[weekNum].set(userId, (weeklyScores[weekNum].get(userId) ?? 0) + scoreAdjustment);

			if (!isCorrect) {
				console.log(`${userId}: ${response.strippedResponse}`);
			}
		}
		db.set(`responses/${dayNum}`, Array.from(responses));
	}

	// Debug output
	const wn = Math.floor((await db.get("dayNum")) / 7);
	let originalWeeklyScores = await db.get(`scores/weekly/${wn}`);
	originalWeeklyScores = new Map(originalWeeklyScores);
	console.log("\n--------------------------------------\n");
	console.log(`Changes (week ${wn}):`);
	for (const s of weeklyScores[wn]) {
		const o = originalWeeklyScores.get(s[0]);
		if (s[1] !== o) {
			console.log(`${s[0]}: ${o} -> ${s[1]}\t(+${(s[1] - o) / 2})`);
		}
	}

	console.log("\n");

	// MAKE BACKUPS!
	console.log("Setting backups...");
	for (let i = 0; i <= currentWeek; i++) {
		db.set(`scores/weekly/${i}/backup`, await db.get(`scores/weekly/${i}`));
	}
	db.set("scores/alltime/backup", await db.get("scores/alltime"));

	// Push scores to database
	console.log("Setting alltime scores...");
	await db.set("scores/alltime", Array.from(alltimeScores));
	for (let i = 0; i <= currentWeek; i++) {
		console.log(`Setting week ${i} scores...`);
		await db.set(`scores/weekly/${i}`, Array.from(weeklyScores[i]));

	}
}

async function getWager(weekNum: number, userId: string, maxValue: number) {
	const db = new Database();
	let wagers = (await db.get(`wagers/${weekNum}`));
	wagers = new Map(wagers);
	if (!wagers) {
		wagers = new Map();
	}

	const originalWager = wagers.get(userId) ?? 0;
	const adjustedWager = Math.max(Math.min(originalWager, maxValue), 0); // Clamp wager to [0, maxValue]

	if (originalWager !== adjustedWager) {
		console.log(`INCORRECT WAGER FOR ${userId} (${originalWager}>${adjustedWager})`);
		wagers.set(userId, adjustedWager);
	}

	return adjustedWager;
}
