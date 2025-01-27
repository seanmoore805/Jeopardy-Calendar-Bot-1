import { Entity, PrimaryGeneratedColumn, OneToMany, OneToOne, JoinColumn, BaseEntity } from "typeorm";
import { Calendar } from "./Calendar";
import { ScoreGroup } from "./ScoreGroup";

/** A full Calendar of clues (or more generally a question set following the same formatting) */
@Entity()
export class Scoreboard extends BaseEntity {

	/** Internal ID number */
	@PrimaryGeneratedColumn()
	id!: number;

	/** The cumulative score for the entire duration of the calendar ("year-to-date") */
	@OneToOne(() => ScoreGroup, (scoreGroup) => scoreGroup.scoreboard)
	@JoinColumn()
	yearly!: ScoreGroup;

	/** Individual scores for each week of play */
	@OneToMany(() => ScoreGroup, (scoreGroup) => scoreGroup.scoreboard)
	weekly!: ScoreGroup[];

	/** The Calendar this Scoreboard holds the scores for */
	@OneToOne(() => Calendar, (calendar) => calendar.scores)
	@JoinColumn()
	calendar: Calendar = new Calendar();

}
