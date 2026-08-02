import {
	Column,
	CreateDateColumn,
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
	@Column({ default: true }) declare isActive: boolean;
	@CreateDateColumn({ type: "timestamptz" }) declare createdAt: Date;
	@UpdateDateColumn({ type: "timestamptz" }) declare updatedAt: Date;
}
