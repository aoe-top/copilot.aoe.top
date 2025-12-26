import { deleteCookie, getCookie } from "h3";
import { ProxyAgent } from "undici";
import { decodeJwt } from "jose";
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

async function exchangeCodeForToken(code: string, redirectUri: string) {
    const tenant = process.env.MICROSOFT_TENANT_ID || "common";
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

    const res = await oauthFetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formEncode({
            client_id: requireEnv("MICROSOFT_CLIENT_ID"),
            client_secret: requireEnv("MICROSOFT_CLIENT_SECRET"),
            code,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw createError({
            statusCode: 502,
            statusMessage: `Microsoft token exchange failed: ${text}`,
        });
    }

    return (await res.json()) as any;
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event) as any;
    const code = query?.code ? String(query.code) : "";
    const state = query?.state ? String(query.state) : "";

    const stateCookie = getCookie(event, "oauth_state_microsoft") || "";
    deleteCookie(event, "oauth_state_microsoft", { path: "/" });

    if (!code) {
        return sendRedirect(
            event,
            `/login?error=${encodeURIComponent("Missing code")}`,
            302
        );
    }
    if (!state || !stateCookie || state !== stateCookie) {
        return sendRedirect(
            event,
            `/login?error=${encodeURIComponent("Invalid state")}`,
            302
        );
    }

    try {
        const baseUrl = getBaseUrl(event);
        const redirectUri = `${baseUrl}/api/user/microsoft/callback`;

        const token = await exchangeCodeForToken(code, redirectUri);
        const idToken = token?.id_token ? String(token.id_token) : "";
        if (!idToken) {
            throw createError({
                statusCode: 502,
                statusMessage: "Microsoft token response missing id_token",
            });
        }

        const claims = decodeJwt(idToken) as any;
        const oid = claims?.oid ? String(claims.oid) : undefined;
        const tid = claims?.tid ? String(claims.tid) : undefined;
        const email =
            claims?.preferred_username || claims?.email
                ? String(
                      claims.preferred_username || claims.email
                  ).toLowerCase()
                : undefined;
        const name = claims?.name ? String(claims.name) : undefined;

        if (!oid) {
            throw createError({
                statusCode: 502,
                statusMessage: "Microsoft id_token missing oid",
            });
        }

        const now = new Date();
        const db = new UtilsMongodb();

        let user = await db.findOne("user", { "microsoft.oid": oid } as any);
        if (!user && email) {
            user = await db.findOne("user", { email } as any);
        }

        if (user) {
            await db.updateOne(
                "user",
                { _id: (user as any)._id } as any,
                {
                    $set: {
                        email: email ?? (user as any).email,
                        name: name ?? (user as any).name,
                        microsoft: {
                            oid,
                            tid,
                            email,
                            name,
                        },
                        provider: (user as any).provider || "microsoft",
                        updatedAt: now,
                    },
                } as any
            );
            user = await db.findOne("user", { _id: (user as any)._id } as any);
        } else {
            const insertRes = await db.insertOne("user", {
                email,
                name,
                microsoft: {
                    oid,
                    tid,
                    email,
                    name,
                },
                provider: "microsoft",
                createdAt: now,
                updatedAt: now,
            });
            user = await db.findOne("user", {
                _id: insertRes.insertedId,
            } as any);
        }

        const { token: sessionToken } = await createSessionForUser(
            (user as any)._id
        );
        setSessionCookie(event, sessionToken);

        return sendRedirect(event, "/account", 302);
    } catch (err: any) {
        const msg =
            err?.data?.statusMessage ||
            err?.statusMessage ||
            "microsoft_oauth_failed";
        return sendRedirect(
            event,
            `/login?error=${encodeURIComponent(msg)}`,
            302
        );
    }
});
