import knex, { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';
import { env } from './env.js';

dotenv.config();

const isProduction = env.env === 'production';

export const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: env.dbUrl
      ? {
          connectionString: env.dbUrl,
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
      min: env.dbPoolMin,
      max: env.dbPoolMax,
    },
    migrations: {
      directory: path.join(process.cwd(), 'src', 'db', 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(process.cwd(), 'src', 'db', 'seeds'),
      extension: 'ts',
    },
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: env.dbUrl,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: env.dbPoolMin,
      max: env.dbPoolMax,
    },
    migrations: {
      directory: path.join(process.cwd(), 'src', 'db', 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(process.cwd(), 'src', 'db', 'seeds'),
      extension: 'ts',
    },
  },
};

const activeConfig = knexConfig[env.env] || knexConfig.development;

export const db = knex(activeConfig);
