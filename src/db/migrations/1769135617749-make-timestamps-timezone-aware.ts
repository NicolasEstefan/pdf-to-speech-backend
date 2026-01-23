import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeTimestampsTimezoneAware1769135617749 implements MigrationInterface {
  name = 'MakeTimestampsTimezoneAware1769135617749'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audio" ALTER COLUMN "created_at" TYPE timestamp with time zone`,
    )
    await queryRunner.query(
      `ALTER TABLE "audio" ALTER COLUMN "updated_at" TYPE timestamp with time zone`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" ALTER COLUMN "created_at" TYPE timestamp with time zone`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" ALTER COLUMN "updated_at" TYPE timestamp with time zone`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generation" ALTER COLUMN "updated_at" TYPE timestamp without time zone`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" ALTER COLUMN "created_at" TYPE timestamp without time zone`,
    )
    await queryRunner.query(
      `ALTER TABLE "audio" ALTER COLUMN "updated_at" TYPE timestamp without time zone`,
    )
    await queryRunner.query(
      `ALTER TABLE "audio" ALTER COLUMN "created_at" TYPE timestamp without time zone`,
    )
  }
}
