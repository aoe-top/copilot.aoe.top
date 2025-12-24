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
        return await useStorage("redis").getItem<T>(key);
    }

    static async setItem(
        key: string,
        value: any,
        maxAge: number = UtilsStorage.cacheTimeLong
    ): Promise<void> {
        return await useStorage("redis").setItem(key, value, {
            ttl: maxAge,
        });
    }

    static async removeItem(key: string): Promise<void> {
        return await useStorage("redis").removeItem(key);
    }

    static async clear(): Promise<void> {
        // 清空缓存
        return await useStorage("redis").clear();
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
        return await useStorage("redis").getKeys();
    }

    static async removeItemInKey(key: string) {
        // 移除包含 key 的缓存
        const keys = await UtilsStorage.getItemKey();

        keys.forEach(async (k) => {
            if (k.includes(key)) {
                await UtilsStorage.removeItem(k);
            }
        });
    }
}
