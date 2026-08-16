import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1786890542805 implements MigrationInterface {
  name = 'CreateAuditLogs1786890542805';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid, "user_id" uuid, "action" character varying NOT NULL, "entity" character varying NOT NULL, "entity_id" uuid, "metadata_json" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_898d14750b88319b89b1ab66cd" ON "audit_logs" ("tenant_id", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_898d14750b88319b89b1ab66cd"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
