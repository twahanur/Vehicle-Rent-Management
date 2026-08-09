import type { Knex } from 'knex';
import { TABLES, RENTAL_STATUS } from '../schema';

export async function seed(knex: Knex): Promise<void> {
  await knex(TABLES.RENTALS).insert([
    {
      id: 1,
      vehicle_id: 1, // Toyota Camry ($100/day)
      customer_name: 'Rahim Ahmed',
      customer_phone: '+8801711000111',
      start_date: '2026-07-29',
      end_date: '2026-08-03', // 6 days total (Jul 29, 30, 31 + Aug 1, 2, 3)
      total_amount: 600.0,
      status: RENTAL_STATUS.COMPLETED,
    },
    {
      id: 2,
      vehicle_id: 2, // Toyota RAV4 ($150/day)
      customer_name: 'Karim Chowdhury',
      customer_phone: '+8801811000222',
      start_date: '2026-08-10',
      end_date: '2026-08-15', // 6 days total
      total_amount: 900.0,
      status: RENTAL_STATUS.BOOKED,
    },
    {
      id: 3,
      vehicle_id: 1, // Toyota Camry
      customer_name: 'Tanvir Hossain',
      customer_phone: '+8801911000333',
      start_date: '2026-08-01',
      end_date: '2026-08-05',
      total_amount: 500.0,
      status: RENTAL_STATUS.CANCELLED,
    },
  ]);

  await knex.raw(`SELECT setval(pg_get_serial_sequence('${TABLES.RENTALS}', 'id'), coalesce(max(id), 1)) FROM ${TABLES.RENTALS};`);
}
