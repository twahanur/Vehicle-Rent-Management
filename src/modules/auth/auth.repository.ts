import { db } from '../../config/knex.js';
import { TABLES, StaffTable } from '../../db/schema.js';

export class AuthRepository {
  async findByEmail(email: string): Promise<StaffTable | undefined> {
    return db(TABLES.STAFF).where({ email }).first();
  }

  async findById(id: number): Promise<StaffTable | undefined> {
    return db(TABLES.STAFF).where({ id }).first();
  }
}

export const authRepository = new AuthRepository();
