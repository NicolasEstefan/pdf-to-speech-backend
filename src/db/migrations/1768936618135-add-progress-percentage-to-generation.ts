import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProgressPercentageToGeneration1768936618135 implements MigrationInterface {
  name = 'AddProgressPercentageToGeneration1768936618135'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generation" ADD "progressPercentage" integer NOT NULL DEFAULT '0'`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" DROP CONSTRAINT "FK_bc381053a6f6ec5e53f40925f2e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" ALTER COLUMN "createdById" SET NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" ADD CONSTRAINT "FK_bc381053a6f6ec5e53f40925f2e" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generation" DROP CONSTRAINT "FK_bc381053a6f6ec5e53f40925f2e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" ALTER COLUMN "createdById" DROP NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" ADD CONSTRAINT "FK_bc381053a6f6ec5e53f40925f2e" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "generation" DROP COLUMN "progressPercentage"`,
    )
  }
}
