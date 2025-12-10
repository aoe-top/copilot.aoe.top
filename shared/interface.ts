declare global {
    interface ModelInfo {
        id: string;
        object: string;
        created: number;
        owned_by: string;
        name: string;
        description: string;
        context_window: number;
        max_tokens: number;
        type: string;
        tags?: string[];
        pricing: {
            input?: string;
            output?: string;
            input_cache_read?: string;
            input_cache_write?: string;
            web_search?: string;
            image?: string;
        };
    }
}

export {};
