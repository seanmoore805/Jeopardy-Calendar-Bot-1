
export function gradeResponse(userResponse: string, correctResponses: string[]): boolean {
	const strippedResponse = userResponse
		.trim()
		.toLowerCase()
		.replace(/^(what|who|where|when) (is|are) (an|a|the)? ?/, "")
		.replace("is it ", "")
		.replace(/\?$/, "")
		.replace("?", "")
		.trim();

	return correctResponses.includes(strippedResponse);
}
