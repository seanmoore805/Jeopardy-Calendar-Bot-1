export interface Question {
	category: string;
	value?: number;
	clue: string;
	responses: string|string[];
	round: Round;
	originalDate?: Date;
}

export enum Round { "Jeopardy", "Double Jeopardy", "Final Jeopardy" }
