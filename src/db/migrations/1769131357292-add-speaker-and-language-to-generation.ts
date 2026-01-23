import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSpeakerAndLanguageToGeneration1769131357292 implements MigrationInterface {
  name = 'AddSpeakerAndLanguageToGeneration1769131357292'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generation" ADD "language" character varying`,
    )

    await queryRunner.query(
      `ALTER TABLE "generation" ADD "speaker" character varying`,
    )

    await queryRunner.query(
      `UPDATE "generation" SET "language" = 'english', "speaker" = 'Achernar'`,
    )

    await queryRunner.query(
      `
      ALTER TABLE "generation"
        ALTER COLUMN "speaker" SET NOT NULL,
        ALTER COLUMN "language" SET NOT NULL
      `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "generation" DROP COLUMN "speaker"`)
    await queryRunner.query(`ALTER TABLE "generation" DROP COLUMN "language"`)
  }
}
