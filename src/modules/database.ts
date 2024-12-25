/** @format */

import KeyvSqlite from "@keyv/sqlite";
import dotenv from "dotenv";

export class Database {
	db: KeyvSqlite;

	constructor() {
		dotenv.config();
		this.db = new KeyvSqlite("sqlite:///out/data/database.sqlite");
	}

	async get(key: string) {
		const value = await this.db.get(key);
		return value === undefined ? value : JSON.parse(value);
	}
	async set(key: string, value: any) {
		try {
			return await this.db.set(key, JSON.stringify(value));
		} catch (e) {
			if (e.name === "SQLITE_BUSY" && e.message === "database is locked") {
				console.warn("Database busy, retrying");
				return this.set(key, value);
			} else {
				throw e;
			}
		}
	}
	async delete(key: string) {
		return await this.db.delete(key);
	}
}
