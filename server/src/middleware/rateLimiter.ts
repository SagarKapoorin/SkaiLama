import type { Request, Response, NextFunction } from 'express';
import { getRedisClient, isRedisAvailable } from '../config/redis.js';

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
  message?: any;
}

export const redisRateLimiter = (options: RateLimiterOptions) => {
  const {
    windowMs,
    maxRequests,
    keyPrefix = 'rate_limit',
    keyGenerator,
    message,
  } = options;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!isRedisAvailable()) {
      next();
      return;
    }
    try {
      const identifier = keyGenerator ? keyGenerator(req) : req.ip;
      const key = `${keyPrefix}:${identifier}`;
      const client = getRedisClient();
      const current = await client.incr(key);
      if (current === 1) {
        await client.expire(key, windowSeconds);
      }
      const ttl = await client.ttl(key);

      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(maxRequests - current, 0).toString());
      res.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());

      if (current > maxRequests) {
        res.setHeader('Retry-After', ttl.toString());
        res.status(429).json(
          message || { error: 'Too many requests, please try again later.' }
        );
        return;
      }
      next();
    } catch (err) {
      console.error('Redis rate limiter error:', err);
      next();
    }
  };
};