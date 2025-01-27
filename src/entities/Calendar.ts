import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn, BaseEntity } from "typeorm";
import { Clue } from "./Clue";
import { Scoreboard } from "./Scoreboard";

/** A full Calendar of clues (or more generally a question set following the same formatting) */
@Entity()
export class Calendar extends BaseEntity {

	/** Internal ID number */
	@PrimaryGeneratedColumn()
	id!: number;

	/** Name of the calendar (typically release year) */
	@Column("varchar")
	name!: string;

	/** The first game date of the calendar (current year; used to extrapolate current position) */
	@Column("date")
	firstDate!: Date;

	/** This Calendar's scoreboard */
	@OneToOne(() => Scoreboard, (scoreboard) => scoreboard.calendar)
	@JoinColumn()
	scores!: Scoreboard;

	/** All the clues */
	@OneToMany(() => Clue, (clue) => clue.calendar)
	@JoinColumn()
	clues!: Clue[];

}
