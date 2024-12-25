import { readFileSync, writeFileSync } from "fs";

const tsvPath = "./data/2022.tsv";
const jsonPath = "./data/2022.json";

const tsv = readFileSync(tsvPath, "utf8");
const lines = tsv.split("\r\n");
const questions = lines.slice(1).map(line => {
	if (line === "") return undefined;
	// Day | Round | Value | Category | Clue | Correct Response(s)...
	const data: string[] = line.split("\t");
	const obj = {
		originalDate: new Date(data[0] + " 2022").toISOString().split("T")[0],
		round: data[1],
		// TODO: Fix schema to allow for undefined values
		value: /*data[2] === "FJ" ? undefined :*/ parseInt(data[2].replace("$", "").replace(",", "")),
		category: data[3].replace(/ {2,}/g, " "),
		clue: data[4].replace(/ {2,}/g, " "),
		responses: line.split("\t").slice(5).map(r=>r.replace(/ {2,}/g, " ")),
	};
	for (const response of line.split("\t").slice(5)) {
		obj.responses.push(response.trim()
			.toLowerCase()
			.replace(/^¿+|\?+$/g, "") // Drop trailing/leading ?s
			.replace(/[‘’]/g, "'") // Un-smart-ify quotes
			.replace(/[“”]/g, '"') // Un-smart-ify quotes
			.replace(/ {2,}/g, " ") // Collapse multiple spaces
			.replace(/^(what|who|where|when|how)('?s| (was|is|are|were)) /, "") // Drop leading "what is"/etc
			.replace(/^is (it|this|that) (called )?/, "")
			.replace(/^(an|a|the) /, "") // Drop leading articles
			.trim() // Drop trailing/leading spaces
		);
	}
	return obj;
});

const json = {
	name: "2022",
	firstDay: "2024-01-01",
	lastDay: "2024-12-31",
	questions: questions,
};

writeFileSync(jsonPath, JSON.stringify(json, null, 2));
