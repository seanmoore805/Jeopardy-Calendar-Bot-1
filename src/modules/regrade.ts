import { Database } from "./database";
import dataset from "../../data/2021.json";
import { gradeResponse } from "./gradeResponse";

export async function regradeAll() {
	const db = new Database();

	// Clear all scores
	const scoreList = (await db.list()).filter((entry) =>
		entry.startsWith("scores/")
	) as string[];

	for (const score of scoreList) {
		await db.delete(score);
	}

	// Regrade and rescore all responses
	const responseList = (await db.list()).filter((entry) =>
		entry.startsWith("responses/")
	) as string[];

	for (const response of responseList) {
		const day = parseInt(response.split("/")[1]);
		const userId = response.split("/")[2];
		const userResponse = await db.get(response) as string;

		if (!userResponse) {
			continue;
		}

		const isCorrect = gradeResponse(userResponse, dataset.questions[day].responses);

		const value = dataset.questions[day].value ??
			await db.get(`wagers/${day}/${userId}`) as number;

		const scoreAdjustment = isCorrect ? value : -value;

		setScore(userId, scoreAdjustment);
	}

	console.log("Regrading complete");
}

export async function regradeUser(userId: string) {
	const db = new Database();

	// Clear scores for user
	await db.deleteMultiple(`scores/weekly/${userId}`, `scores/alltime/${userId}`);

	// Regrade and rescore all responses for user
	const responseList = (await db.list()).filter((entry) =>
		entry.startsWith("responses/") && entry.endsWith(userId)
	) as string[];

	for (const response of responseList) {
		const day = parseInt(response.split("/")[1]);
		const userResponse = await db.get(response) as string;

		if (!userResponse) {
			continue;
		}

		const isCorrect = gradeResponse(userResponse, dataset.questions[day].responses);

		const value = dataset.questions[day].value ??
			await db.get(`wagers/${day}/${userId}`) as number;

		const scoreAdjustment = isCorrect ? value : -value;

		setScore(userId, scoreAdjustment);
	}

	console.log(`Regrading complete for user ${userId}`);
}

function setScore(userId: string, scoreAdjustment: number) {
	const db = new Database();

	db.get(`scores/weekly/${userId}`).then((score) => {
		if (score && +score === score) {
			db.set(`scores/weekly/${userId}`, score + scoreAdjustment);
		} else {
			db.set(`scores/weekly/${userId}`, scoreAdjustment);
		}
	});

	db.get(`scores/alltime/${userId}`).then((score) => {
		if (score && +score === score) {
			db.set(`scores/alltime/${userId}`, score + scoreAdjustment);
		} else {
			db.set(`scores/alltime/${userId}`, scoreAdjustment);
		}
	});
}
