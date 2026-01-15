import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTimestampsToAudio1768507270044 implements MigrationInterface {
  name = 'AddTimestampsToAudio1768507270044'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audio" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    )
    await queryRunner.query(
      `ALTER TABLE "audio" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    )
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_470355432cc67b2c470c30bef7c"`,
    )
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "googleId"`)
    await queryRunner.query(`ALTER TABLE "user" ADD "googleId" text`)
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_470355432cc67b2c470c30bef7c" UNIQUE ("googleId")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_470355432cc67b2c470c30bef7c"`,
    )
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "googleId"`)
    await queryRunner.query(
      `ALTER TABLE "user" ADD "googleId" character varying`,
    )
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_470355432cc67b2c470c30bef7c" UNIQUE ("googleId")`,
    )
    await queryRunner.query(`ALTER TABLE "audio" DROP COLUMN "updated_at"`)
    await queryRunner.query(`ALTER TABLE "audio" DROP COLUMN "created_at"`)
  }
}
