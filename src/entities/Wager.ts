import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, BaseEntity } from "typeorm";
import { Clue } from "./Clue";
import { User } from "./User";

/** A User's Wager for a Clue */
@Entity()
export class Wager extends BaseEntity {

	/** Internal ID number */
	@PrimaryGeneratedColumn()
	id: number = 0;

	/** The Clue this Wager was given to */
	@ManyToOne(() => Clue)
	clue!: Clue;

	/** The User who gave this Wager */
	@ManyToOne(() => User)
	user!: User;

	/** The amount wagered (normalized if necessary) */
	@Column("int")
	value!: number;

	/** The time this wager was submitted */
	@CreateDateColumn()
	timestamp!: Date;

}
