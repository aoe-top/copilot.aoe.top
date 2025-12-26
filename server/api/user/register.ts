export default defineEventHandler(async () => {
    throw createError({
        statusCode: 410,
        statusMessage:
            "Registration is disabled. Please login with a third-party provider.",
    });
});
