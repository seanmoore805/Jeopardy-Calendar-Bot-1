import "reflect-metadata";
import { DataSource } from "typeorm";
import "dotenv/config";
import { Calendar } from "./entities/Calendar";
import { Clue } from "./entities/Clue";
import { Guild } from "./entities/Guild";
import { Response } from "./entities/Response";
import { Scoreboard } from "./entities/Scoreboard";
import { ScoreEntry } from "./entities/ScoreEntry";
import { ScoreGroup } from "./entities/ScoreGroup";
import { User } from "./entities/User";
import { Wager } from "./entities/Wager";

export const AppDataSource = new DataSource({
	type: "postgres",
	host: "localhost",
	port: 5432,
	username: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME,
	synchronize: true,
	logging: "all",
	entities: [Calendar, Clue, Guild, Response, Scoreboard, ScoreEntry, ScoreGroup, User, Wager],
	migrations: [],
	subscribers: [],
});
