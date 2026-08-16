import 'dotenv/config';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

/**
 * DataSource usado pela CLI do TypeORM (`npm run migration:*`), fora do
 * ciclo de vida do Nest — por isso lê `process.env` diretamente em vez de
 * `ConfigService`. As opções devem ficar em sincronia com
 * `postgres.module.ts`, que é quem a aplicação usa em runtime.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  namingStrategy: new SnakeNamingStrategy(),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/common/database/postgres/migrations/*.ts'],
  synchronize: false,
});
