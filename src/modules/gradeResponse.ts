
export default function gradeResponse(userResponse: string, correctResponses: string[]): boolean {
	const strippedResponse = userResponse
		.trim()
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

	return correctResponses.includes(strippedResponse);
}
