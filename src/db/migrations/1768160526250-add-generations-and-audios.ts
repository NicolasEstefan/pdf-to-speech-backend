import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGenerationsAndAudios1768160526250 implements MigrationInterface {
  name = 'AddGenerationsAndAudios1768160526250'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audio" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "size" integer NOT NULL, "filePath" character varying NOT NULL, "generationId" uuid, CONSTRAINT "REL_095642c701399efcda38b04090" UNIQUE ("generationId"), CONSTRAINT "PK_9562215b41192ae4ccdf314a789" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "generation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "status" character varying NOT NULL, "createdById" uuid, CONSTRAINT "PK_58db1b8155c99c2604394ffef2a" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "audio" ADD CONSTRAINT "FK_095642c701399efcda38b04090e" FOREIGN KEY ("generationId") REFERENCES "generation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
      `ALTER TABLE "audio" DROP CONSTRAINT "FK_095642c701399efcda38b04090e"`,
    )
    await queryRunner.query(`DROP TABLE "generation"`)
    await queryRunner.query(`DROP TABLE "audio"`)
  }
}
