import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
    if (redisClient) return redisClient;

    const restUrl =
        process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const restToken =
        process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (restUrl && restToken) {
        redisClient = new Redis({ url: restUrl, token: restToken });
        return redisClient;
    }

    // Best-effort fallback for environments not configured yet.
    // This keeps dev from hard-crashing, while still surfacing the misconfig.
    throw new Error(
        "Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL/KV_REST_API_TOKEN)."
    );
}

function safeJsonParse<T>(value: string): T | string {
    try {
        return JSON.parse(value) as T;
    } catch {
        return value;
    }
}

export class UtilsStorage {
    /**
     * 1小时
     */
    static cacheTimeShort = 60 * 60;
    /**
     * 1天
     */
    static cacheTime = 60 * 60 * 24;
    /**
     * 30天
     */
    static cacheTimeLong = 60 * 60 * 24 * 30;

    static async getItem<T>(key: string) {
        const redis = getRedisClient();
        const value = await redis.get<string>(key);
        if (value === null || value === undefined) return null;
        return safeJsonParse<T>(value) as T;
    }

    static async setItem(
        key: string,
        value: any,
        maxAge: number = UtilsStorage.cacheTimeLong
    ): Promise<void> {
        const redis = getRedisClient();
        const payload = JSON.stringify(value);
        await redis.set(key, payload, { ex: maxAge });
    }

    static async removeItem(key: string): Promise<void> {
        const redis = getRedisClient();
        await redis.del(key);
    }

    static async clear(): Promise<void> {
        // 清空缓存
        const redis = getRedisClient();
        // Note: flushdb clears the entire Redis database.
        await redis.flushdb();
    }

    static async StorageGetByKey<T = any>(
        storageKey: string,
        fun: () => Promise<T>,
        maxAge: number = UtilsStorage.cacheTimeLong
    ) {
        const cachedData = await UtilsStorage.getItem<T>(storageKey);
        if (cachedData) {
            return cachedData;
        }
        const data = await fun();
        await UtilsStorage.setItem(storageKey, data, maxAge);

        return data as T;
    }

    static async getItemKey() {
        // 获取所有缓存key
        const redis = getRedisClient();
        return await redis.keys("*");
    }

    static async removeItemInKey(key: string) {
        // 移除包含 key 的缓存
        const keys = await UtilsStorage.getItemKey();

        const toDelete = keys.filter((k) => k.includes(key));
        await Promise.all(toDelete.map((k) => UtilsStorage.removeItem(k)));
    }
}
