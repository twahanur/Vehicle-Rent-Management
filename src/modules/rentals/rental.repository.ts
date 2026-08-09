import { Knex } from 'knex';
import { db } from '../../config/knex.js';
import { TABLES, RENTAL_STATUS, RentalsTable } from '../../db/schema.js';
import { Rental, CreateRentalBody, UpdateRentalBody, RentalQueryFilter } from './rental.types.js';
import { getPaginationParams, PaginatedResult } from '../../common/utils/pagination.js';

export class RentalRepository {
  async findById(id: number, trx?: Knex.Transaction): Promise<Rental | undefined> {
    const query = (trx || db)(TABLES.RENTALS).where({ id });
    const row = await query.first();
    if (!row) return undefined;
    return this.formatRental(row);
  }

  async findOverlapping(
    vehicleId: number,
    startDate: string,
    endDate: string,
    excludeRentalId?: number,
    trx?: Knex.Transaction,
  ): Promise<Rental[]> {
    const query = (trx || db)(TABLES.RENTALS)
      .where('vehicle_id', vehicleId)
      .whereIn('status', [RENTAL_STATUS.BOOKED, RENTAL_STATUS.ONGOING])
      .andWhere('start_date', '<=', endDate)
      .andWhere('end_date', '>=', startDate);

    if (excludeRentalId) {
      query.andWhereNot('id', excludeRentalId);
    }

    if (trx) {
      query.forUpdate();
    }

    const rows = await query;
    return rows.map(this.formatRental);
  }

  async findAll(filter: RentalQueryFilter): Promise<PaginatedResult<Rental>> {
    const { page, limit, offset } = getPaginationParams(filter);

    const baseQuery = db(TABLES.RENTALS);

    if (filter.vehicle_id) {
      baseQuery.where('vehicle_id', filter.vehicle_id);
    }

    if (filter.status) {
      baseQuery.where('status', filter.status);
    }

    if (filter.start_date) {
      baseQuery.where('start_date', '>=', filter.start_date);
    }

    if (filter.end_date) {
      baseQuery.where('end_date', '<=', filter.end_date);
    }

    const countResult = await baseQuery.clone().count<{ count: string }>('id as count').first();
    const total = Number(countResult?.count || 0);

    const rows = await baseQuery.select('*').orderBy('id', 'desc').limit(limit).offset(offset);
    const data = rows.map(this.formatRental);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async create(
    data: CreateRentalBody & { total_amount: number; status?: string },
    trx?: Knex.Transaction,
  ): Promise<Rental> {
    const executor = trx || db;
    const [rental] = await executor(TABLES.RENTALS)
      .insert({
        vehicle_id: data.vehicle_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        start_date: data.start_date,
        end_date: data.end_date,
        total_amount: data.total_amount,
        status: (data.status as any) || RENTAL_STATUS.BOOKED,
      })
      .returning('*');

    return this.formatRental(rental);
  }

  async update(
    id: number,
    data: UpdateRentalBody & { total_amount?: number },
    trx?: Knex.Transaction,
  ): Promise<Rental | undefined> {
    const executor = trx || db;
    const [updated] = await executor(TABLES.RENTALS)
      .where({ id })
      .update({
        ...data,
        updated_at: db.fn.now() as any,
      })
      .returning('*');

    if (!updated) return undefined;
    return this.formatRental(updated);
  }

  async delete(id: number): Promise<boolean> {
    const deletedCount = await db(TABLES.RENTALS).where({ id }).delete();
    return deletedCount > 0;
  }

  private formatRental(r: RentalsTable): Rental {
    const formatDate = (val: any) => {
      if (!val) return '';
      if (typeof val === 'string') return val.substring(0, 10);
      if (val instanceof Date) return val.toISOString().substring(0, 10);
      return String(val).substring(0, 10);
    };

    return {
      ...r,
      total_amount: Number(r.total_amount),
      start_date: formatDate(r.start_date),
      end_date: formatDate(r.end_date),
    };
  }
}

export const rentalRepository = new RentalRepository();
