import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        }
      : {
          host: process.env.DB_HOST || '127.0.0.1',
          port: Number(process.env.DB_PORT) || 5432,
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'vehicle_rental',
        },
    pool: {
      min: Number(process.env.DB_POOL_MIN) || 2,
      max: Number(process.env.DB_POOL_MAX) || 10,
    },
    migrations: {
      directory: path.join(__dirname, 'src', 'db', 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, 'src', 'db', 'seeds'),
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: Number(process.env.DB_POOL_MIN) || 2,
      max: Number(process.env.DB_POOL_MAX) || 10,
    },
    migrations: {
      directory: path.join(__dirname, 'src', 'db', 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, 'src', 'db', 'seeds'),
      extension: 'ts',
    },
  },
};

export default knexConfig;
