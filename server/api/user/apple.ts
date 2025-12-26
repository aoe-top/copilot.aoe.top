export default defineEventHandler(async () => {
    throw createError({
        statusCode: 410,
        statusMessage: "Apple login is temporarily disabled.",
    });
});
