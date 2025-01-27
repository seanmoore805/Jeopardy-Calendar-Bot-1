import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany, BaseEntity } from "typeorm";
import { Calendar } from "./Calendar";
import { Response } from "./Response";

/** An individual score entry mapping one user to one score */
@Entity()
export class Clue extends BaseEntity {

	/** Sequence of this clue in the calendar (0-indexed) */
	@PrimaryColumn("int")
	sequence!: number;

	/** The full Calendar this clue belongs to */
	@ManyToOne(() => Calendar, (calendar) => calendar.clues)
	calendar!: Calendar;

	/** The category for this clue */
	@Column("varchar")
	category!: "Jeopardy!" | "Double Jeopardy!" | "Final Jeopardy!";

	/** The clue's value; if `undefined` (i.e. FJ!) a wager will be required before revealing clue */
	@Column("int")
	value?: number;

	/** The original clue text */
	@Column("varchar")
	clue!: string;

	/** The "official" response as printed on the calendar */
	@Column("varchar")
	response!: string;

	/** A string parsable as a regular expression to be used to grade responses */
	@Column("varchar")
	gradingRegex!: RegExp;

	/** The original date for which this clue was printed on calendar */
	@Column("date")
	originalDate!: Date;

	/** If this clue should be counted to scores (i.e. for practice weeks) (default `true`=yes) */
	@Column("boolean")
	crediting: boolean = true;

	/** All the responses given to this clue */
	@OneToMany(() => Response, (response) => response.clue)
	userResponses!: Response;

}
