import type { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { TABLES } from '../schema';

export async function seed(knex: Knex): Promise<void> {
  await knex(TABLES.RENTALS).del();
  await knex(TABLES.VEHICLES).del();
  await knex(TABLES.STAFF).del();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  await knex(TABLES.STAFF).insert([
    {
      id: 1,
      name: 'System Admin',
      email: 'admin@rental.com',
      password_hash: passwordHash,
    },
    {
      id: 2,
      name: 'Manager User',
      email: 'manager@rental.com',
      password_hash: passwordHash,
    },
  ]);

  await knex.raw(`SELECT setval(pg_get_serial_sequence('${TABLES.STAFF}', 'id'), coalesce(max(id), 1)) FROM ${TABLES.STAFF};`);
}
