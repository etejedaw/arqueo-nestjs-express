import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from "typeorm";

@Entity("users")
export class User {
	@PrimaryGeneratedColumn("uuid") id: string;
	@Column() name: string;
	@Column({ unique: true }) email: string;
	@Column() password: string;
	@Column({ type: "boolean", default: false }) isAdmin: boolean;
	@CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
	@UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
	@DeleteDateColumn({ type: "timestamptz" }) deletedAt: Date | null;
}
