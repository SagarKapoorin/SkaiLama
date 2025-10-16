import type { Request, Response, NextFunction } from 'express';
import { getCachedData, setCachedData } from '../utils/cacheHelper.js';
import { isRedisAvailable } from '../config/redis.js';

interface CacheOptions {
  keyGenerator: (req: Request) => string;
  ttl?: number;
}

export const cacheMiddleware = (options: CacheOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    //skip caching if Redis unavailable or not GET request
    if (!isRedisAvailable() || req.method !== 'GET') {
      next();
      return;
    }

    try {
      const cacheKey = options.keyGenerator(req);
      const cachedData = await getCachedData(cacheKey);
      if (cachedData) {
        res.status(200).json(cachedData);
        return;
      }
      const originalJson = res.json.bind(res);

      res.json = function (data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCachedData(cacheKey, data, options.ttl);
        }
        return originalJson(data);
      };
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};
