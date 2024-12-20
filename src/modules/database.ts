/** @format */

import { Client } from "@replit/database";
import dotenv from "dotenv";

export class Database {
	db: Client;

	constructor() {
		dotenv.config();
		const key = process.env.REPLIT_DB_URL;
		this.db = new Client(key);
	}

	async get(key: string) {
		return await this.db.get(key);
	}
	async set(key: string, value: any) {
		return await this.db.set(key, value);
	}
	async delete(key: string) {
		return await this.db.delete(key);
	}
	async list(prefix?: string) {
		return await this.db.list(prefix);
	}

	async empty() {
		return await this.db.empty();
	}
	async getAll() {
		return await this.db.getAll();
	}
	async setAll(obj: Record<any, any>) {
		return await this.db.setAll(obj);
	}
	async deleteMultiple(...args: string[]) {
		return await this.db.deleteMultiple(...args);
	}
}
