import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionBillingFields1788915782621 implements MigrationInterface {
  name = 'AddSubscriptionBillingFields1788915782621';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "provider_customer_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "renews_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "renews_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "provider_customer_id"`,
    );
  }
}
