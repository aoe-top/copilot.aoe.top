export default defineEventHandler(async () => {
    throw createError({
        statusCode: 410,
        statusMessage:
            "Password login is disabled. Please login with a third-party provider.",
    });
});
