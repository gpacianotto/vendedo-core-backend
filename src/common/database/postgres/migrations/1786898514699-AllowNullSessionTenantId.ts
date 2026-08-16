import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowNullSessionTenantId1786898514699 implements MigrationInterface {
  name = 'AllowNullSessionTenantId1786898514699';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "tenant_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sessions" ALTER COLUMN "tenant_id" SET NOT NULL`,
    );
  }
}
