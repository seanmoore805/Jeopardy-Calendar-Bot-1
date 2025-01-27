import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BaseEntity } from "typeorm";
import { Scoreboard } from "./Scoreboard";
import { ScoreEntry } from "./ScoreEntry";

/** A group of score entries for one time period (i.e. all scores for a week) */
@Entity()
export class ScoreGroup extends BaseEntity {

	/** Internal ID number */
	@PrimaryGeneratedColumn()
	id!: number;

	/** Free-text description of this group's effective period (i.e. "yearly", "week 1") (exact phrasing tbd) */
	@Column("varchar")
	period!: string;

	/** The user who is being scored */
	@OneToMany(() => ScoreEntry, (scoreEntry) => scoreEntry.group)
	entries!: ScoreEntry[];

	/** The parent Scoreboard this entry belongs to */
	@ManyToOne(() => Scoreboard)
	scoreboard!: Scoreboard;

}
