import { getCookie } from "h3";
import {
    clearSessionCookie,
    deleteSessionByToken,
    getSessionCookieName,
} from "~~/server/utils/Auth";

export default defineEventHandler(async (event) => {
    if (event.method !== "POST") {
        throw createError({
            statusCode: 405,
            statusMessage: "Method Not Allowed",
        });
    }

    const token = getCookie(event, getSessionCookieName());
    if (token) {
        await deleteSessionByToken(token);
    }

    clearSessionCookie(event);
    return { ok: true };
});
