import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTimestampsToGeneration1768506977213 implements MigrationInterface {
  name = 'AddTimestampsToGeneration1768506977213'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generation" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "generation" DROP COLUMN "updated_at"`)
    await queryRunner.query(`ALTER TABLE "generation" DROP COLUMN "created_at"`)
  }
}
