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
	@PrimaryGeneratedColumn("uuid") declare id: string;
	@Column() declare name: string;
	@Column({ unique: true }) declare email: string;
	@Column() declare password: string;
	@Column({ type: "boolean", default: false }) declare isAdmin: boolean;
	@CreateDateColumn({ type: "timestamptz" }) declare createdAt: Date;
	@UpdateDateColumn({ type: "timestamptz" }) declare updatedAt: Date;
	@DeleteDateColumn({ type: "timestamptz" }) declare deletedAt: Date | null;
}
