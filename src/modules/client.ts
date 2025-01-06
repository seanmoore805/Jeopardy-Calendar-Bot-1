import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";

/** Discord.js Client object */
export const client = new Client({
	/* Overview of required permissions:
	 *
	 * Intents:
	 * - GuildMembers: Used to read to maintain guild-specific leaderboards
	 * Allowed Mentions:
	 * - roles: Used for role pings for announcing clues
	 */
	// TODO: Graceful handling if it doesn't have intent enabled
	intents: [ GatewayIntentBits.GuildMembers ],
	allowedMentions: { parse: ["roles"] },
});
client.token = process.env.API_KEY!;
