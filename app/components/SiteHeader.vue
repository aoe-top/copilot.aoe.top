<script setup lang="ts">
import { ref, watch } from "vue";

const { user, refresh, logout } = useAuth();

const displayName = computed(() => {
    return (
        user.value?.name ||
        user.value?.githubLogin ||
        user.value?.email ||
        "已登录"
    );
});

async function onLogout() {
    await logout();
    await navigateTo("/login");
}

type NavLink = { href: string; label: string };

const navLinks: NavLink[] = [
    { href: "/business-plan", label: "商业计划" },
    { href: "/models", label: "模型列表" },
];

const mobileMenuOpen = ref(false);

// 路由变化时自动收起移动端菜单，避免“返回后菜单仍展开”
const route = useRoute();
watch(
    () => route.fullPath,
    () => {
        mobileMenuOpen.value = false;
    }
);

onMounted(() => {
    refresh().catch(() => {});
});
</script>

<template>
    <header class="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div class="mx-auto max-w-6xl px-4">
            <div class="flex items-center justify-between py-3">
                <NuxtLink to="/" class="flex items-center gap-2">
                    <div class="text-base font-semibold">Glosc Copilot</div>
                    <Badge variant="secondary">AI Desktop Copilot</Badge>
                </NuxtLink>

                <nav
                    class="hidden items-center gap-6 text-sm text-muted-foreground md:flex"
                >
                    <NuxtLink
                        v-for="link in navLinks"
                        :key="link.href"
                        :to="link.href"
                        class="hover:text-foreground"
                    >
                        {{ link.label }}
                    </NuxtLink>
                </nav>

                <div class="flex items-center gap-2">
                    <ThemeToggle />

                    <!-- Desktop actions -->
                    <template v-if="user">
                        <Button
                            as-child
                            variant="outline"
                            class="hidden sm:inline-flex"
                        >
                            <NuxtLink to="/account">{{ displayName }}</NuxtLink>
                        </Button>
                        <Button
                            variant="secondary"
                            class="hidden sm:inline-flex"
                            @click="onLogout"
                        >
                            退出
                        </Button>
                    </template>
                    <template v-else>
                        <Button
                            as-child
                            variant="outline"
                            class="hidden sm:inline-flex"
                        >
                            <NuxtLink to="/login">登录</NuxtLink>
                        </Button>
                    </template>
                    <Button as-child class="hidden sm:inline-flex">
                        <a
                            href="https://github.com/glosc-ai/Glosc-Copilot"
                            target="_blank"
                            rel="noreferrer"
                            >GitHub</a
                        >
                    </Button>

                    <!-- Mobile menu toggle -->
                    <Button
                        variant="secondary"
                        class="sm:hidden"
                        :aria-expanded="mobileMenuOpen"
                        aria-controls="site-header-mobile-menu"
                        @click="mobileMenuOpen = !mobileMenuOpen"
                    >
                        {{ mobileMenuOpen ? "收起" : "菜单" }}
                    </Button>
                </div>
            </div>

            <!-- Mobile menu -->
            <div
                id="site-header-mobile-menu"
                class="sm:hidden"
                v-if="mobileMenuOpen"
            >
                <Separator />
                <nav class="flex flex-col gap-1 py-3 text-sm">
                    <NuxtLink
                        v-for="link in navLinks"
                        :key="link.href"
                        :to="link.href"
                        class="rounded-md px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        @click="mobileMenuOpen = false"
                    >
                        {{ link.label }}
                    </NuxtLink>
                </nav>
                <div class="flex flex-col gap-2 pb-3">
                    <template v-if="user">
                        <Button as-child variant="outline">
                            <NuxtLink
                                to="/account"
                                @click="mobileMenuOpen = false"
                                >{{ displayName }}</NuxtLink
                            >
                        </Button>
                        <Button
                            variant="secondary"
                            @click="
                                () => {
                                    mobileMenuOpen = false;
                                    onLogout();
                                }
                            "
                        >
                            退出
                        </Button>
                    </template>
                    <template v-else>
                        <Button as-child variant="outline">
                            <NuxtLink
                                to="/login"
                                @click="mobileMenuOpen = false"
                                >登录</NuxtLink
                            >
                        </Button>
                    </template>
                    <Button as-child variant="secondary">
                        <NuxtLink
                            to="/business-plan"
                            @click="mobileMenuOpen = false"
                            >阅读商业计划</NuxtLink
                        >
                    </Button>
                    <Button as-child>
                        <a
                            href="https://github.com/glosc-ai/Glosc-Copilot"
                            target="_blank"
                            rel="noreferrer"
                            >GitHub</a
                        >
                    </Button>
                </div>
            </div>
        </div>
    </header>
</template>
