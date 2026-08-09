import type { Knex } from 'knex';
import { TABLES, RENTAL_STATUS } from '../schema';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLES.RENTALS, (table) => {
    table.increments('id').primary();
    table
      .integer('vehicle_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable(TABLES.VEHICLES)
      .onDelete('RESTRICT');
    table.string('customer_name', 255).notNullable();
    table.string('customer_phone', 100).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.decimal('total_amount', 10, 2).notNullable();
    table.string('status', 50).notNullable().defaultTo(RENTAL_STATUS.BOOKED);
    table.timestamps(true, true);

    table.index(['vehicle_id']);
    table.index(['vehicle_id', 'start_date', 'end_date']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists(TABLES.RENTALS);
}
