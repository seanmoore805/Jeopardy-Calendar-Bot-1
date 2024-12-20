import { readFileSync, writeFileSync } from "fs";

const tsvPath = "./data/2021.tsv";
const jsonPath = "./data/2021.json";

const tsv = readFileSync(tsvPath, "utf8");
const lines = tsv.split("\r\n");
const questions = lines.slice(1).map(line => {
	if (line === "") return undefined;
	// Day | Round | Value | Category | Clue | Correct Response(s)...
	const data: string[] = line.split("\t");
	const obj = {
		originalDate: new Date(data[0] + " 2021").toISOString().split("T")[0],
		round: data[1],
		// TODO: Fix schema to allow for undefined values
		value: /*data[2] === "FJ" ? undefined :*/ parseInt(data[2].replace(",", "")),
		category: data[3],
		clue: data[4],
		responses: line.split("\t").slice(5),
	};
	return obj;
});

const json = {
	name: "2021",
	firstDay: "2023-01-02",
	lastDay: "2023-12-31",
	questions: questions,
};

writeFileSync(jsonPath, JSON.stringify(json, null, 2));
