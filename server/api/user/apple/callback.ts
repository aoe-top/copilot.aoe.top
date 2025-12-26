import { deleteCookie, getCookie } from "h3";
import { ProxyAgent } from "undici";
import { SignJWT, decodeJwt, importPKCS8 } from "jose";
import { UtilsMongodb } from "~~/server/utils/UtilsMongodb";
import { createSessionForUser, setSessionCookie } from "~~/server/utils/Auth";

let proxyAgent: ProxyAgent | null = null;

function getProxyUrl() {
    return (
        process.env.HTTPS_PROXY ||
        process.env.HTTP_PROXY ||
        process.env.ALL_PROXY ||
        ""
    );
}

function getTimeoutMs() {
    const raw = process.env.OAUTH_FETCH_TIMEOUT_MS;
    const ms = raw ? Number(raw) : 30_000;
    return Number.isFinite(ms) && ms > 0 ? ms : 30_000;
}

async function oauthFetch(url: string, init: RequestInit) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), getTimeoutMs());

    try {
        const proxyUrl = getProxyUrl();
        const dispatcher = proxyUrl
            ? (proxyAgent ||= new ProxyAgent(proxyUrl))
            : undefined;
        return await fetch(url, {
            ...init,
            signal: controller.signal,
            ...(dispatcher ? { dispatcher } : {}),
        } as any);
    } finally {
        clearTimeout(timeoutId);
    }
}

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

function formEncode(data: Record<string, string>) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(data)) p.set(k, v);
    return p.toString();
}

function getApplePrivateKey() {
    // Accept either raw PEM with newlines, or \n escaped
    const raw = requireEnv("APPLE_PRIVATE_KEY");
    return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

async function buildAppleClientSecret() {
    const teamId = requireEnv("APPLE_TEAM_ID");
    const clientId = requireEnv("APPLE_CLIENT_ID");
    const keyId = requireEnv("APPLE_KEY_ID");

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 5 * 60; // 5 minutes

    const key = await importPKCS8(getApplePrivateKey(), "ES256");

    return await new SignJWT({})
        .setProtectedHeader({ alg: "ES256", kid: keyId })
        .setIssuer(teamId)
        .setSubject(clientId)
        .setAudience("https://appleid.apple.com")
        .setIssuedAt(now)
        .setExpirationTime(exp)
        .sign(key);
}

async function exchangeCodeForToken(code: string, redirectUri: string) {
    const res = await oauthFetch("https://appleid.apple.com/auth/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formEncode({
            client_id: requireEnv("APPLE_CLIENT_ID"),
            client_secret: await buildAppleClientSecret(),
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw createError({
            statusCode: 502,
            statusMessage: `Apple token exchange failed: ${text}`,
        });
    }

    return (await res.json()) as any;
}

export default defineEventHandler(async () => {
    throw createError({
        statusCode: 410,
        statusMessage: "Apple login is temporarily disabled.",
    });
});
