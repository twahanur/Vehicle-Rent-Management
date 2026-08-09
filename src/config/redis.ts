import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 2000);
    return delay;
  },
});

redis.on('error', (err) => {
  console.error('⚠️ Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis successfully');
});

/**
 * Atomic Redis Lock Acquisition using SET key value PX ttl NX
 * @returns lockValue (string identifier) if acquired successfully, or null if lock is held by another process
 */
export async function acquireLock(key: string, ttlMs: number = 5000): Promise<string | null> {
  const lockValue = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  try {
    const result = await redis.set(key, lockValue, 'PX', ttlMs, 'NX');
    if (result === 'OK') {
      return lockValue;
    }
    return null;
  } catch (error) {
    console.error(`⚠️ Failed to acquire Redis lock for key "${key}":`, error);
    // If Redis is unavailable, return null to fall back gracefully
    return null;
  }
}

/**
 * Atomic Redis Lock Release using Lua Script
 * Ensures lock is deleted ONLY if the lock value matches (prevents releasing expired/overwritten locks)
 */
export async function releaseLock(key: string, lockValue: string): Promise<boolean> {
  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  try {
    const result = await redis.eval(luaScript, 1, key, lockValue);
    return result === 1;
  } catch (error) {
    console.error(`⚠️ Failed to release Redis lock for key "${key}":`, error);
    return false;
  }
}
