import type { Knex } from 'knex';
import { TABLES } from '../schema';

export async function seed(knex: Knex): Promise<void> {
  await knex(TABLES.VEHICLES).insert([
    {
      id: 1,
      name: 'Toyota Camry 2024',
      plate_number: 'DHAKA-METRO-GA-11-2233',
      category: 'Sedan',
      daily_rate: 100.0,
      photo_path: null,
      deleted_at: null,
    },
    {
      id: 2,
      name: 'Toyota RAV4 SUV',
      plate_number: 'DHAKA-METRO-GHA-44-5566',
      category: 'SUV',
      daily_rate: 150.0,
      photo_path: null,
      deleted_at: null,
    },
    {
      id: 3,
      name: 'Mercedes-Benz E-Class',
      plate_number: 'DHAKA-METRO-CHA-77-8899',
      category: 'Luxury',
      daily_rate: 300.0,
      photo_path: null,
      deleted_at: null,
    },
  ]);

  await knex.raw(`SELECT setval(pg_get_serial_sequence('${TABLES.VEHICLES}', 'id'), coalesce(max(id), 1)) FROM ${TABLES.VEHICLES};`);
}
