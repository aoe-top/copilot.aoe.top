//http://localhost:3000/api/models
import type { ModelInfo } from "~~/shared/interface";

export default defineEventHandler(async (event) => {
    const StorageKey = "ModelList";
    const data = await UtilsStorage.StorageGetByKey<ModelInfo>(
        StorageKey,
        async () => {
            const res = await fetch("https://ai-gateway.vercel.sh/v1/models");
            const data = await res.json();
            return data;
        },
        UtilsStorage.cacheTime
    );

    return data;
});
