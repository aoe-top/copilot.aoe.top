import { deleteCookie, getCookie } from "h3";
import { ProxyAgent } from "undici";
import { UtilsMongodb } from "~~/server/utils/UtilsMongodb";
import {
    createSessionForUser,
    setSessionCookie,
    toPublicUser,
} from "~~/server/utils/Auth";

let githubProxyAgent: ProxyAgent | null = null;

function getProxyUrl() {
    return (
        process.env.HTTPS_PROXY ||
        process.env.HTTP_PROXY ||
        process.env.ALL_PROXY ||
        ""
    );
}

function getGithubTimeoutMs() {
    const raw = process.env.GITHUB_FETCH_TIMEOUT_MS;
    const ms = raw ? Number(raw) : 30_000;
    return Number.isFinite(ms) && ms > 0 ? ms : 30_000;
}

async function githubFetch(url: string, init: RequestInit) {
    const timeoutMs = getGithubTimeoutMs();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const proxyUrl = getProxyUrl();
        const dispatcher = proxyUrl
            ? (githubProxyAgent ||= new ProxyAgent(proxyUrl))
            : undefined;

        return await fetch(url, {
            ...init,
            signal: controller.signal,
            ...(dispatcher ? { dispatcher } : {}),
        } as any);
    } catch (err: any) {
        const code = err?.code || err?.name || "FETCH_FAILED";
        const proxyHint = getProxyUrl()
            ? ""
            : "（提示：如果你在需要代理/受限网络环境，请设置 HTTPS_PROXY/HTTP_PROXY 再重试）";
        throw createError({
            statusCode: 502,
            statusMessage: `GitHub 请求失败: ${code}. ${
                err?.message || "fetch failed"
            }${proxyHint}`,
        });
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

async function exchangeCodeForToken(code: string, redirectUri: string) {
    const res = await githubFetch(
        "https://github.com/login/oauth/access_token",
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "User-Agent": "glosc.ai",
            },
            body: JSON.stringify({
                client_id: requireEnv("GITHUB_CLIENT_ID"),
                client_secret: requireEnv("GITHUB_CLIENT_SECRET"),
                code,
                redirect_uri: redirectUri,
            }),
        }
    );

    if (!res.ok) {
        const text = await res.text();
        throw createError({
            statusCode: 502,
            statusMessage: `GitHub token exchange failed: ${text}`,
        });
    }

    const data = (await res.json()) as any;
    if (!data.access_token) {
        throw createError({
            statusCode: 502,
            statusMessage: "GitHub token exchange returned no access_token",
        });
    }
    return String(data.access_token);
}

async function fetchGithubUser(accessToken: string) {
    const res = await githubFetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "glosc.ai",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw createError({
            statusCode: 502,
            statusMessage: `GitHub user fetch failed: ${text}`,
        });
    }

    return (await res.json()) as any;
}

async function fetchGithubEmail(accessToken: string) {
    const res = await githubFetch("https://api.github.com/user/emails", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "glosc.ai",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });

    if (!res.ok) return undefined;
    const emails = (await res.json()) as any[];
    const primary =
        emails?.find((e) => e?.primary && e?.verified) ||
        emails?.find((e) => e?.verified);
    return primary?.email ? String(primary.email).toLowerCase() : undefined;
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event) as any;
    const code = query?.code ? String(query.code) : "";
    const state = query?.state ? String(query.state) : "";

    const stateCookie = getCookie(event, "github_oauth_state") || "";
    deleteCookie(event, "github_oauth_state", { path: "/" });

    if (!code) {
        throw createError({ statusCode: 400, statusMessage: "Missing code" });
    }
    if (!state || !stateCookie || state !== stateCookie) {
        throw createError({ statusCode: 400, statusMessage: "Invalid state" });
    }

    try {
        const baseUrl = getBaseUrl(event);
        const redirectUri = `${baseUrl}/api/user/github/callback`;

        const accessToken = await exchangeCodeForToken(code, redirectUri);
        const ghUser = await fetchGithubUser(accessToken);
        const email =
            (ghUser?.email ? String(ghUser.email).toLowerCase() : undefined) ||
            (await fetchGithubEmail(accessToken));

        const now = new Date();
        const db = new UtilsMongodb();

        const githubId = Number(ghUser.id);
        const githubLogin = ghUser.login ? String(ghUser.login) : undefined;
        const avatarUrl = ghUser.avatar_url
            ? String(ghUser.avatar_url)
            : undefined;
        const name = ghUser.name ? String(ghUser.name) : githubLogin;

        // Try match existing user by github id
        let user = await db.findOne("user", { "github.id": githubId } as any);

        // Fallback: match by email and link github
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
                        github: {
                            id: githubId,
                            login: githubLogin,
                            avatarUrl,
                        },
                        provider: (user as any).provider || "github",
                        updatedAt: now,
                    },
                } as any
            );
            user = await db.findOne("user", { _id: (user as any)._id } as any);
        } else {
            const insertRes = await db.insertOne("user", {
                email,
                name,
                github: {
                    id: githubId,
                    login: githubLogin,
                    avatarUrl,
                },
                provider: "github",
                createdAt: now,
                updatedAt: now,
            });
            user = await db.findOne("user", {
                _id: insertRes.insertedId,
            } as any);
        }

        const { token } = await createSessionForUser((user as any)._id);
        setSessionCookie(event, token);

        return sendRedirect(event, "/account", 302);
    } catch (err: any) {
        // Keep UX recoverable instead of surfacing a raw stack in the browser
        const statusMessage =
            err?.data?.statusMessage ||
            err?.statusMessage ||
            "github_oauth_failed";
        return sendRedirect(
            event,
            `/login?error=${encodeURIComponent(statusMessage)}`,
            302
        );
    }
});
