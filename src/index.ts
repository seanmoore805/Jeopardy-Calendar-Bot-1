import { Events } from "discord.js";
import "dotenv/config";
import logger from "./modules/logger";
import { client } from "./modules/client";

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Token already applied from env in ./modules/login
client.login();
