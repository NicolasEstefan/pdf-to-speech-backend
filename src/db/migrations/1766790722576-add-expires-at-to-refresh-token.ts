import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExpiresAtToRefreshToken1766790722576 implements MigrationInterface {
  name = 'AddExpiresAtToRefreshToken1766790722576'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token" ADD "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_token" DROP COLUMN "expiresAt"`,
    )
  }
}
