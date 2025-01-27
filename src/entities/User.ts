import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, BaseEntity } from "typeorm";
import { Guild } from "./Guild";

/** A User of the bot */
@Entity()
export class User extends BaseEntity {

	/** Internal ID number (eventually going to be more than just Discord??) */
	@PrimaryGeneratedColumn()
	id!: number;

	/** Discord user ID */
	@Column("varchar")
	discordId!: string;

	/** Guilds (Discord servers) that this user is a member of */
	@ManyToMany(() => Guild, (server) => server.members)
	guilds!: Guild[];

}
