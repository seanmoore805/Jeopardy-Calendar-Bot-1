import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export default interface Command {
	/** SlashCommandBuilder object with data for Discord/the client-side command itself */
	data: SlashCommandBuilder,
	/** Function for the bot to run when the command is received */
	execute: (interaction: CommandInteraction) => Promise<void>,
	/** Whether this command should be available globally (`true`) or only in the managing server (`false`)
	 *
	 * (Note: user permission verification must be performed in the command itself)
	 */
	global: boolean,
// eslint-disable-next-line semi -- Just wants to keeping adding more semicolons for some reason???
};
