/**
 * API 授权验证
 */
export default defineEventHandler(async (event) => {
    const path = event.path;

    if (path.startsWith("/api")) {
        setResponseHeaders(event, {
            "access-control-allow-credentials": "true",
            "access-control-allow-headers": "*",
            "access-control-allow-methods":
                "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "access-control-allow-origin": "*",
        });
        if (event.method === "OPTIONS") {
            setResponseStatus(event, 204);
            return "OK";
        }
    }
});
