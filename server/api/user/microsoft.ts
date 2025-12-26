import crypto from "node:crypto";
import { setCookie } from "h3";

function getBaseUrl(event: any) {
    const url = getRequestURL(event);
    return new URL(url.toString()).origin;
}

function requireEnv(name: string) {
    const v = process.env[name];
    if (!v) {
        throw createError({
            statusCode: 500,
            statusMessage: `Missing ${name}`,
        });
    }
    return v;
}

export default defineEventHandler(async (event) => {
    const state = crypto.randomBytes(16).toString("hex");

    setCookie(event, "oauth_state_microsoft", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 10 * 60,
    });

    const tenant = process.env.MICROSOFT_TENANT_ID || "common";
    const baseUrl = getBaseUrl(event);
    const redirectUri = `${baseUrl}/api/user/microsoft/callback`;

    const authorizeUrl = new URL(
        `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
    );
    authorizeUrl.searchParams.set(
        "client_id",
        requireEnv("MICROSOFT_CLIENT_ID")
    );
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("response_mode", "query");
    authorizeUrl.searchParams.set("scope", "openid profile email");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("prompt", "select_account");

    return sendRedirect(event, authorizeUrl.toString(), 302);
});
