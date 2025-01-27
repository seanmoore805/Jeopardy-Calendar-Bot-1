import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, BaseEntity, OneToOne } from "typeorm";
import { User } from "./User";
import { Calendar } from "./Calendar";

/** A Discord Guild (server) */
@Entity()
export class Guild extends BaseEntity {

	/** Internal ID number */
	@PrimaryGeneratedColumn()
	id!: number;

	/** Discord guild (server) ID */
	@Column("varchar")
	discordId!: string;

	/** Users who are in this guild */
	@ManyToMany(() => User, (user) => user.guilds)
	@JoinTable()
	members!: User[];

	/** Which Calendar this Guild is playing */
	@OneToOne(() => Calendar)
	calendar!: Calendar;

	/** Discord Message ID of the daily clue message in this guild */
	@Column("varchar")
	dailyMessageId!: string;

}
