import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUsernameToUser1766793111037 implements MigrationInterface {
  name = 'AddUsernameToUser1766793111037'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "username" character varying NOT NULL`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "username"`)
  }
}
