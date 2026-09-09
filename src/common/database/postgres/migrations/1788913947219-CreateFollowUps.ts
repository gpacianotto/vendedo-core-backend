import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFollowUps1788913947219 implements MigrationInterface {
  name = 'CreateFollowUps1788913947219';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."follow_ups_priority_enum" AS ENUM('LOW', 'NORMAL', 'HIGH')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."follow_ups_status_enum" AS ENUM('PENDING', 'COMPLETED', 'CANCELED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "follow_ups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "opportunity_id" uuid, "customer_id" uuid, "assigned_to" uuid NOT NULL, "type" character varying NOT NULL, "scheduled_at" TIMESTAMP NOT NULL, "completed_at" TIMESTAMP, "priority" "public"."follow_ups_priority_enum" NOT NULL DEFAULT 'NORMAL', "status" "public"."follow_ups_status_enum" NOT NULL DEFAULT 'PENDING', "note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d510aabdff2ec7fdc67a1092157" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5177fa78181bcf70a964e0ed6e" ON "follow_ups" ("tenant_id", "assigned_to", "status", "scheduled_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "follow_ups" ADD CONSTRAINT "FK_26b0a3704583d1d7a7c52555a3b" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow_ups" ADD CONSTRAINT "FK_98b3f566a978ce9c06495c5a1ac" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow_ups" ADD CONSTRAINT "FK_779d819934eb871aaf5ff2744fd" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "follow_ups" DROP CONSTRAINT "FK_779d819934eb871aaf5ff2744fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow_ups" DROP CONSTRAINT "FK_98b3f566a978ce9c06495c5a1ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow_ups" DROP CONSTRAINT "FK_26b0a3704583d1d7a7c52555a3b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5177fa78181bcf70a964e0ed6e"`,
    );
    await queryRunner.query(`DROP TABLE "follow_ups"`);
    await queryRunner.query(`DROP TYPE "public"."follow_ups_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."follow_ups_priority_enum"`);
  }
}
