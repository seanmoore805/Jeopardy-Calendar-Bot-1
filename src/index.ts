/** @format */

import dotenv from "dotenv";
import {
	ActivityType,
	Client,
	Collection,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
	PresenceStatusData,
} from "discord.js";
import fs from "fs";
import path from "path";
import nodeCron from "node-cron";
import emojiToImage from "./modules/emojiToImage";
import { ownerId, status, gameChannels } from "../config.json";
import postClue from "./modules/postClue";
import postResults from "./modules/postResults";
import { Database } from "./modules/database";

declare module "discord.js" {
	export interface Client {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		commands: Collection<unknown, any>;
	}
}

dotenv.config();
const token = process.env.API_KEY;
// Set time zone to US Eastern (EST UTC-5 / EDT UTC-4)
process.env.TZ = "America/New_York";

if (!token) {
	throw new Error(
		"No token provided.\n" +
			"Please add the Discord bot token to the .env file (see .env.example)"
	);
}

// Create a new client instance
const client = new Client({
	intents: [GatewayIntentBits.Guilds],
	allowedMentions: { parse: ["roles"] }
});

// Post clue at 7 AM Eastern Time
nodeCron.schedule("00 00 07 * * *", () => {
	console.log("Timer: Posting clue");
	postClue(client);
}, {
	name: "postClue",
	scheduled: true,
	timezone: "America/New_York",
});
// Post results at 11 PM Eastern Time
nodeCron.schedule("30 00 23 * * *", () => {
	console.log("Timer: Posting results");
	postResults(client);
}, {
	name: "postResults",
	scheduled: true,
	timezone: "America/New_York",
});

client.once(Events.Invalidated, () => {
	console.log("==SESSION INVALIDATED==");
	console.log("Restarting...");
	process.exit();
});

/*
 * When the client is ready, run this code (only once)
 * We use 'c' for the event parameter to keep it separate from the already defined 'client'
 */
client.once(Events.ClientReady, (c) => {
	const now = new Date();
	const clue = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} 07:00:00`);
	const results = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} 22:50:30`);
	const reset = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate() + 1} 02:00:00`);
	const eveningReminder = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} 19:00:00`);

	if (clue > now) {
		setTimeout(() => {
			postClue(client);
		}, clue - now);
		console.log("Set clue timeout");
	}
	if (results > now) {
		setTimeout(() => {
			for (const chan in gameChannels) {
				client.channels.cache.get(chan.channelId)
					.send("Last call! Responses close in 10 minutes from this message");
			}
		}, results - now);
		setTimeout(() => {
			postResults(client);
		}, results - now + 600000); // + 10 minutes
		console.log("Set results timeout");
	}
	if (clue < now && results > now) {
		setTimeout(() => {
			postClue(client);
		}, 1000);
		console.log("Try post clue anyway");
	}
	if (results < now) {
		const db = new Database();
		db.get("currentClue").then((cc) => {
			if (cc) {
				for (const chan in gameChannels) {
					client.channels.cache.get(chan.channelId)
						.send("Last call! Responses close in 10 minutes from this message");
				}
				setTimeout(() => {
					postResults(client);
				}, 600000); // 10 minutes
				console.log("Try post results anyway");
			}
		});
	}
	if (reset > now) {
		setTimeout(() => {
			console.log("Resetting: Set exit code");
			process.exit();
		}, reset - now);
		console.log("Set reset timeout");
	}
	if (eveningReminder > now) {
		setTimeout(() => {
			for (const chan in gameChannels) {
				client.channels.cache.get(chan.channelId)
					.send(`<@&${chan.roleId}> Don't forget to respond to the clue!`);
			}
		}, eveningReminder - now);
		console.log("Set evening reminder timeout");
	}
	if (eveningReminder < now && results > now) {
		setTimeout(async () => {
			for (const chanInfo in gameChannels) {
				const chan = client.channels.cache.get(chanInfo.channelId);
				const message = `<@&${chanInfo.roleId}> Don't forget to respond to the clue!`;
				const msgs = (await chan.messages.fetch()).filter((m) => m.content === message);
				let today = false;
				for (const msg of msgs) {
					if (new Date(msg[1].createdTimestamp).getDate() === new Date().getDate()) {
						today = true;
					}
				}
				if (!today) {
					console.log("Sending evening reminder");
					chan.send(message);
				} else {
					console.log("Already sent evening reminder");
				}
			}
		}, 1000);
		console.log("Try send evening reminder anyway");
	}
	setInterval(()=>{
		console.log("[Heartbeat] " + new Date());
	}, 300000);


	console.log(`Ready! ${c.user.tag} is logged in and serving ${c.guilds.cache.size} ` +
		`guilds with ${client.commands.size} commands`);

	// TODO: Match status type to ActivityType
	c.user.setActivity({ name: status.name, type: ActivityType.Playing });
	c.user.setStatus(status.status);

});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));

async function loadCommands() {
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		await import(filePath).then((command) => {
			// Set a new item in the Collection with the key as the command name and the value as the exported module
			if ("data" in command && "execute" in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.warn(
					`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
				);
			}
		});
	}
}

loadCommands();

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	let debug = `Received command from ${interaction.user.tag}: ${interaction.commandName}`;
	for (let options = interaction.options.data; ; options = options[0].options) {
		/**
		 * I have absolutely no idea why I wrote it this way,
		 * but this adds the values of the options to the output
		 * i.e. the `response:Something` in `Received [...]: respond response:Something`
		 * 
		 * I think this might also handle subcommands too?
		 * i.e. everything after `stats` in `[...]: stats scores user user:123456789`
		 * idk it was too long ago and I'm redoing all of this anyway
		 */
		for (const option of options) {
			if (option.value !== undefined) {
				debug += ` ${option.name}:${option.value}`;
			} else {
				debug += ` ${option.name}`;
			}
		}
		if (options.length === 0 || !options[0].options || options[0].options.length === 0) break;
	}
	console.debug(debug);

	/** `{ "userId": "ban reason" }` */
	const bans = {};
	if (interaction.user.id in bans) {
		const reason = bans[interaction.user.id];
		console.debug(`BANNED: ${interaction.user.tag} (${reason})`);
		const embed = new EmbedBuilder()
			.setTitle("Banned")
			.setDescription(`You have been permanently banned from using ${interaction.client.user.username} ` +
				`for the following reason(s):\n> ${reason}\n\n` +
				`If you believe this is a mistake, please contact <@${ownerId}>.`
			)
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
			})
			.setTimestamp(new Date())
			.setColor("Red")
			.setThumbnail(emojiToImage("🚫"));
		await interaction.reply({ embeds: [embed.data], ephemeral: true });
		return;
	}

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);

		const embed = new EmbedBuilder()
			.setTitle(`Unknown command: \`${interaction.commandName}\``)
			.setDescription(
				"Somehow, you managed to trigger a command that doesn't exist. " +
				`Please let <@${ownerId}> know something has gone wrong!`
			)
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
			})
			.setTimestamp(new Date())
			.setColor("Red")
			.setThumbnail(emojiToImage("❓"))
		;

		await interaction.reply({ embeds: [embed.data], ephemeral: true });
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(`${interaction.commandName} failed to execute!`);
		console.error(error);

		const embed = new EmbedBuilder()
			.setTitle(`Something went wrong with \`${interaction.commandName}\``)
			.setDescription(
				`Please let <@${ownerId}> know something has gone wrong!` +
				(error instanceof Error ?
					"```ansi\n[1;4;31m" + error.name + "\n[0;31m" + error.message + "```" :
					"```ansi\n[1;31m" + error + "```"
				) +
				"\n**Note:** If you got an `SQLITE BUSY: database is locked` error, please just submit again. " +
				"You can copy your previous command by clicking the name of it in the little reply prompt above " +
				"(the \"[username] used [command name]\" part)."
			)
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.avatarURL() ?? interaction.user.defaultAvatarURL,
			})
			.setTimestamp(new Date())
			.setColor("Red")
			.setThumbnail(emojiToImage("❗"))
		;

		interaction.client.users.fetch(ownerId)
			.then((user) =>user.createDM()
				.then((ch) => ch.send({
					content: `${interaction.commandName} failed to execute!`,
					embeds: [embed.data]
				}))
			)
		;

		try {
			if (interaction.deferred) {
				await interaction.editReply({ embeds: [embed.data] });
			} else {
				await interaction.reply({ embeds: [embed.data], ephemeral: true });
			}
		} catch (err2) {
			console.error("Failed to send error!");
			console.error(err2);
		}
	}
});

console.log("Starting");
// Log in to Discord with your client's token
client.login(token);
