import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, BaseEntity } from "typeorm";
import { User } from "./User";
import { ScoreGroup } from "./ScoreGroup";

/** An individual score entry mapping one user to one score */
@Entity()
export class ScoreEntry extends BaseEntity {

	/** Internal ID number */
	@PrimaryGeneratedColumn()
	id!: number;

	/** The user who is being scored */
	@OneToOne(() => User)
	user!: User;

	/** The score this user has */
	@Column("int")
	score!: number;

	/** The parent ScoreGroup this entry belongs to (i.e. weekly or yearly score list) */
	@ManyToOne(() => ScoreGroup, (scoreGroup) => scoreGroup.entries)
	group!: ScoreGroup;

}
