import type { Knex } from 'knex';
import { TABLES } from '../schema';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(TABLES.STAFF, (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLES.STAFF);
}
