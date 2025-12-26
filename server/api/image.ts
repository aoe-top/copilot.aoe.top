import {
    convertToModelMessages,
    streamText,
    generateImage,
    tool,
    stepCountIs,
    jsonSchema,
} from "ai";
import type { ToolSet, UIMessage } from "ai";

// http://localhost:3000/api/image
export default defineEventHandler(async (event) => {
    const {
        messages,
        model,
        prompt,
        aspectRatio,
        n,
        seed,
        providerOptions,
    }: {
        messages: UIMessage[];
        model: string;
        prompt: string;
        aspectRatio: `${number}:${number}`;
        n: number;
        seed?: number;
        providerOptions: Record<string, any>;
    } = await readBody(event);

    const { image } = await generateImage({
        model,
        prompt,
        aspectRatio,
        n,
        seed,
        providerOptions,
    });
});
