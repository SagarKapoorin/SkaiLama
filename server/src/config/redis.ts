import dotenv from "dotenv";
dotenv.config();
import { createClient } from "redis";
import type { RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;
let isRedisConnected = false;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
      isRedisConnected = false;
    });

    redisClient.on("ready", () => {
      console.log("Redis Client Ready");
      isRedisConnected = true;
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis Client Reconnecting...");
      isRedisConnected = false;
    });

    redisClient.on("end", () => {
      console.log("Redis Client Disconnected");
      isRedisConnected = false;
    });

    await redisClient.connect();
    console.log("Redis connected");
  } catch (error) {
    console.error("Redis connection failed:", error);
    isRedisConnected = false;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient || !isRedisConnected)
    throw new Error("Redis client not initialized");
  return redisClient;
};

export const isRedisAvailable = (): boolean => {
  return isRedisConnected && redisClient !== null;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    console.log("Redis disconnected");
  }
};
