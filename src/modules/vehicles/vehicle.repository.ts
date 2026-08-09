import { db } from '../../config/knex.js';
import { TABLES, VehiclesTable } from '../../db/schema.js';
import { CreateVehicleBody, UpdateVehicleBody, VehicleQueryFilter } from './vehicle.types.js';
import { getPaginationParams, PaginatedResult } from '../../common/utils/pagination.js';

export class VehicleRepository {
  async findById(id: number): Promise<VehiclesTable | undefined> {
    return db(TABLES.VEHICLES)
      .where({ id })
      .whereNull('deleted_at')
      .first();
  }

  async findByPlateNumber(plateNumber: string, excludeId?: number): Promise<VehiclesTable | undefined> {
    const query = db(TABLES.VEHICLES).where({ plate_number: plateNumber }).whereNull('deleted_at');
    if (excludeId) {
      query.whereNot('id', excludeId);
    }
    return query.first();
  }

  async findAll(filter: VehicleQueryFilter): Promise<PaginatedResult<VehiclesTable>> {
    const { page, limit, offset } = getPaginationParams(filter);

    const baseQuery = db(TABLES.VEHICLES).whereNull('deleted_at');

    if (filter.category) {
      baseQuery.where('category', 'ILIKE', filter.category);
    }

    if (filter.search) {
      baseQuery.andWhere((builder) => {
        builder
          .where('name', 'ILIKE', `%${filter.search}%`)
          .orWhere('plate_number', 'ILIKE', `%${filter.search}%`);
      });
    }

    const countResult = await baseQuery.clone().count<{ count: string }>('id as count').first();
    const total = Number(countResult?.count || 0);

    const data = await baseQuery.select('*').orderBy('id', 'desc').limit(limit).offset(offset);

    const formattedData = data.map((v) => ({
      ...v,
      daily_rate: Number(v.daily_rate),
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedData,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async create(data: CreateVehicleBody & { photo_path?: string | null }): Promise<VehiclesTable> {
    const [vehicle] = await db(TABLES.VEHICLES)
      .insert({
        name: data.name,
        plate_number: data.plate_number,
        category: data.category,
        daily_rate: data.daily_rate,
        photo_path: data.photo_path || null,
      })
      .returning('*');

    return {
      ...vehicle,
      daily_rate: Number(vehicle.daily_rate),
    };
  }

  async update(id: number, data: UpdateVehicleBody & { photo_path?: string | null }): Promise<VehiclesTable | undefined> {
    const [updated] = await db(TABLES.VEHICLES)
      .where({ id })
      .whereNull('deleted_at')
      .update({
        ...data,
        updated_at: db.fn.now() as any,
      })
      .returning('*');

    if (!updated) return undefined;

    return {
      ...updated,
      daily_rate: Number(updated.daily_rate),
    };
  }

  async softDelete(id: number): Promise<boolean> {
    const updatedCount = await db(TABLES.VEHICLES)
      .where({ id })
      .whereNull('deleted_at')
      .update({
        deleted_at: db.fn.now(),
        updated_at: db.fn.now(),
      });

    return updatedCount > 0;
  }

  async getFleetSummary(): Promise<{ total_vehicles: number; active_vehicles: number; deleted_vehicles: number }> {
    const totalResult = await db(TABLES.VEHICLES).count<{ count: string }>('id as count').first();
    const activeResult = await db(TABLES.VEHICLES).whereNull('deleted_at').count<{ count: string }>('id as count').first();
    
    const total = Number(totalResult?.count || 0);
    const active = Number(activeResult?.count || 0);
    
    return {
      total_vehicles: total,
      active_vehicles: active,
      deleted_vehicles: total - active,
    };
  }
}

export const vehicleRepository = new VehicleRepository();
