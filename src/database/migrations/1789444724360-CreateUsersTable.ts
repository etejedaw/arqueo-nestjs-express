import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1789444724360 implements MigrationInterface {
	name = "CreateUsersTable1789444724360";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE users (
				id uuid NOT NULL DEFAULT gen_random_uuid(),
				name character varying NOT NULL,
				email character varying NOT NULL,
				password character varying NOT NULL,
				is_admin boolean NOT NULL DEFAULT false,
				created_at timestamptz NOT NULL DEFAULT now(),
				updated_at timestamptz NOT NULL DEFAULT now(),
				deleted_at timestamptz,
				CONSTRAINT pk_users PRIMARY KEY (id),
				CONSTRAINT uq_users_email UNIQUE (email)
			)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE users`);
	}
}
