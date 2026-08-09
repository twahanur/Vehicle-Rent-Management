import type { Knex } from 'knex';
import { TABLES } from '../schema';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLES.VEHICLES, (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('plate_number', 100).notNullable().unique();
    table.string('category', 100).notNullable();
    table.decimal('daily_rate', 10, 2).notNullable();
    table.string('photo_path', 500).nullable();
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);
  });

  // Partial PostgreSQL index for active vehicles queries
  await knex.raw(`CREATE INDEX idx_vehicles_active ON ${TABLES.VEHICLES}(deleted_at) WHERE deleted_at IS NULL;`);
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLES.VEHICLES);
}
