import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, BaseEntity } from "typeorm";
import { Clue } from "./Clue";
import { User } from "./User";

/** A User's Response to a Clue */
@Entity()
export class Response extends BaseEntity {

	/** Internal ID number */
	@PrimaryGeneratedColumn()
	id: number = 0;

	/** The Clue this Response was given to */
	@ManyToOne(() => Clue, (clue) => clue.userResponses)
	clue!: Clue;

	/** The User who gave this Response */
	@ManyToOne(() => User)
	user!: User;

	/** The raw text of the response as submitted by the user */
	@Column("varchar")
	rawResponse!: string;

	/** The processed text of the response, useable for grading ("What is" removed, etc) */
	@Column("varchar")
	parsedResponse!: string;

	/** If this response is correct (`true`) or not */
	@Column("boolean")
	correct!: boolean;

	/** The time this response was submitted */
	@CreateDateColumn()
	timestamp!: Date;

}
