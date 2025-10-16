import { getRedisClient, isRedisAvailable } from '../config/redis.js';

const DEFAULT_TTL = parseInt(process.env.REDIS_TTL || '3600', 10);
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  if (!isRedisAvailable()) return null;
  try {
    const client = getRedisClient();
    const cachedData = await client.get(key);
    // console.log('Cached Data:', cachedData);
    if (cachedData) {
      console.log(`Cache HIT: ${key}`);
      return JSON.parse(cachedData) as T;
    }
    console.log(`Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
};

export const setCachedData = async (
  key: string, 
  data: any, 
  ttl: number = DEFAULT_TTL
): Promise<void> => {
  if (!isRedisAvailable()) return;

  try {
    const client = getRedisClient();
    await client.setEx(key, ttl, JSON.stringify(data));
    // console.log(`Cache SET: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('Redis SET error:', error);
  }
};
export const deleteCachedData = async (key: string): Promise<void> => {
  if (!isRedisAvailable()) return;
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error('Redis DEL error:', error);
  }
};

export const deleteCachedDataByPattern = async (pattern: string): Promise<void> => {
  if (!isRedisAvailable()) return;
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error('Redis pattern DELETE error:', error);
  }
};

export const clearAllCache = async (): Promise<void> => {
  if (!isRedisAvailable()) return;
  try {
    const client = getRedisClient();
    await client.flushAll();
    // console.log('All cache cleared');
  } catch (error) {
    console.error('Redis FLUSH error:', error);
  }
};

export const generateCacheKey = {

  allProfiles: (skip: number = 0, limit: number = 100) =>
    `profiles:all:skip:${skip}:limit:${limit}`,
  profileById: (profileId: string) => `profile:${profileId}`,
  eventsByProfile: (
    profileId: string,
    timezone: string,
    skip: number = 0,
    limit: number = 100
  ) => `events:profile:${profileId}:tz:${timezone}:skip:${skip}:limit:${limit}`,
  eventById: (eventId: string) => `event:${eventId}`,
  eventLogs: (eventId: string, skip: number = 0, limit: number = 100) =>
    `event:${eventId}:logs:skip:${skip}:limit:${limit}`,
  allTimezones: () => 'timezones:all'
};
