// This datasource is used only for migrations
import dotenvFlow from 'dotenv-flow'
dotenvFlow.config()
import { DataSource } from 'typeorm'

export const datasource = new DataSource({
  type: 'postgres',
  synchronize: false,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities: ['./dist/**/*.entity.js'],
  migrations: ['./dist/db/migrations/*.js'],
})
