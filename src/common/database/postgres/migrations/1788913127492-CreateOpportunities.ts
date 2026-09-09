import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOpportunities1788913127492 implements MigrationInterface {
  name = 'CreateOpportunities1788913127492';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."opportunities_stage_enum" AS ENUM('NOVA', 'CONTATO', 'ORCAMENTO_ENVIADO', 'NEGOCIACAO', 'GANHA', 'PERDIDA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."opportunities_status_enum" AS ENUM('ABERTA', 'FECHADA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "opportunities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "customer_id" uuid NOT NULL, "seller_id" uuid NOT NULL, "title" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, "stage" "public"."opportunities_stage_enum" NOT NULL, "due_at" TIMESTAMP, "source" character varying, "notes" text, "status" "public"."opportunities_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4bd9cd12ddc0ff48a5a97ddebce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_924074230bf6120750945f70bd" ON "opportunities" ("tenant_id", "stage", "due_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "opportunities" ADD CONSTRAINT "FK_e632a59d52a3aa5dce0c7748bc6" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "opportunities" ADD CONSTRAINT "FK_38763bb2e54056b8273e32fabe1" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "opportunities" DROP CONSTRAINT "FK_38763bb2e54056b8273e32fabe1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "opportunities" DROP CONSTRAINT "FK_e632a59d52a3aa5dce0c7748bc6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_924074230bf6120750945f70bd"`,
    );
    await queryRunner.query(`DROP TABLE "opportunities"`);
    await queryRunner.query(`DROP TYPE "public"."opportunities_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."opportunities_stage_enum"`);
  }
}
