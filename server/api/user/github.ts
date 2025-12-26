import crypto from "node:crypto";
import { setCookie } from "h3";

function getBaseUrl(event: any) {
    const url = getRequestURL(event);
    return new URL(url.toString()).origin;
}

function getGithubClientId() {
    const id = process.env.GITHUB_CLIENT_ID;
    if (!id) {
        throw createError({
            statusCode: 500,
            statusMessage: "Missing GITHUB_CLIENT_ID",
        });
    }
    return id;
}

export default defineEventHandler(async (event) => {
    const state = crypto.randomBytes(16).toString("hex");

    setCookie(event, "github_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 10 * 60,
    });

    const baseUrl = getBaseUrl(event);
    const redirectUri = `${baseUrl}/api/user/github/callback`;

    const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
    authorizeUrl.searchParams.set("client_id", getGithubClientId());
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("scope", "read:user user:email");
    authorizeUrl.searchParams.set("state", state);

    return sendRedirect(event, authorizeUrl.toString(), 302);
});
