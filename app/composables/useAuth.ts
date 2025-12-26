import type { AuthUserPublic } from "~~/shared/interface";

export function useAuth() {
    const user = useState<AuthUserPublic | null>("auth:user", () => null);
    const loaded = useState<boolean>("auth:loaded", () => false);
    const pending = useState<boolean>("auth:pending", () => false);

    async function refresh() {
        if (pending.value) return;
        pending.value = true;
        try {
            const res = await $fetch<{
                ok: boolean;
                user: AuthUserPublic | null;
            }>("/api/user/me", { credentials: "include" });
            user.value = res?.user ?? null;
            loaded.value = true;
        } finally {
            pending.value = false;
        }
    }

    async function logout() {
        await $fetch("/api/user/logout", {
            method: "POST",
            credentials: "include",
        });
        user.value = null;
        loaded.value = true;
    }

    if (process.client && !loaded.value && !pending.value) {
        refresh().catch(() => {
            loaded.value = true;
        });
    }

    return {
        user,
        loaded,
        pending,
        refresh,
        logout,
        isLoggedIn: computed(() => !!user.value),
    };
}
