import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeProgressPercentageTypeToFloat1768999414030 implements MigrationInterface {
  name = 'ChangeProgressPercentageTypeToFloat1768999414030'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generation" DROP COLUMN "progressPercentage"`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" ADD "progressPercentage" double precision NOT NULL DEFAULT '0'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generation" DROP COLUMN "progressPercentage"`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" ADD "progressPercentage" integer NOT NULL DEFAULT '0'`,
    )
  }
}
