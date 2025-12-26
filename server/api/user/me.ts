import { getUserBySession } from "~~/server/utils/Auth";

export default defineEventHandler(async (event) => {
    const user = await getUserBySession(event);
    return { ok: true, user };
});
