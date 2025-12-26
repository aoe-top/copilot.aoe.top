import crypto from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "h3";
import { UtilsMongodb } from "~~/server/utils/UtilsMongodb";
import type { AuthUserPublic } from "~~/shared/interface";

const USERS_COLLECTION = "user";
const SESSIONS_COLLECTION = "session";

function isProd() {
    return process.env.NODE_ENV === "production";
}

export function getSessionCookieName() {
    return process.env.AUTH_SESSION_COOKIE_NAME || "glosc_session";
}

export function getSessionTtlDays() {
    const raw = process.env.AUTH_SESSION_TTL_DAYS;
    const ttl = raw ? Number(raw) : 30;
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 30;
}

export function generateSessionToken() {
    return crypto.randomBytes(32).toString("hex");
}

export function setSessionCookie(
    event: any,
    token: string,
    ttlDays = getSessionTtlDays()
) {
    setCookie(event, getSessionCookieName(), token, {
        httpOnly: true,
        secure: isProd(),
        sameSite: "lax",
        path: "/",
        maxAge: ttlDays * 24 * 60 * 60,
    });
}

export function clearSessionCookie(event: any) {
    deleteCookie(event, getSessionCookieName(), { path: "/" });
}

export async function createSessionForUser(userId: any) {
    const token = generateSessionToken();
    const ttlDays = getSessionTtlDays();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

    const db = new UtilsMongodb();
    await db.insertOne(SESSIONS_COLLECTION, {
        token,
        userId,
        createdAt: now,
        expiresAt,
    });

    return { token, expiresAt };
}

export async function getUserBySession(
    event: any
): Promise<AuthUserPublic | null> {
    const token = getCookie(event, getSessionCookieName());
    if (!token) return null;

    const db = new UtilsMongodb();
    const session = await db.findOne(SESSIONS_COLLECTION, {
        token,
        expiresAt: { $gt: new Date() },
    } as any);

    if (!session) return null;

    const user = await db.findOne(USERS_COLLECTION, {
        _id: (session as any).userId,
    } as any);
    if (!user) return null;

    return toPublicUser(user);
}

export function toPublicUser(userDoc: any): AuthUserPublic {
    return {
        id: String(userDoc._id),
        email: userDoc.email,
        name: userDoc.name,
        githubLogin: userDoc.github?.login,
        githubId: userDoc.github?.id,
        avatarUrl: userDoc.github?.avatarUrl,
        microsoftOid: userDoc.microsoft?.oid,
        appleSub: userDoc.apple?.sub,
    };
}

export async function deleteSessionByToken(token: string) {
    const db = new UtilsMongodb();
    await db.deleteOne(SESSIONS_COLLECTION, { token } as any);
}
