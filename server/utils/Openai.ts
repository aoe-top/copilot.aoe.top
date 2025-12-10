import OpenAI from "openai";

export class MyOpenai {
    public static getOpenAI() {
        const openai = new OpenAI({
            apiKey: process.env.AI_GATEWAY_API_KEY,
            baseURL: "https://ai-gateway.vercel.sh/v1",
        });
        return openai;
    }
}
