import { db } from '../../config/knex.js';
import { TABLES, StaffTable } from '../../db/schema.js';

export class AuthRepository {
  async findByEmail(email: string): Promise<StaffTable | undefined> {
    return db(TABLES.STAFF).where({ email }).first();
  }

  async findById(id: number): Promise<StaffTable | undefined> {
    return db(TABLES.STAFF).where({ id }).first();
  }

  async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    const updatedCount = await db(TABLES.STAFF)
      .where({ id })
      .update({
        password_hash: passwordHash,
        updated_at: db.fn.now(),
      });
    return updatedCount > 0;
  }
}

export const authRepository = new AuthRepository();
