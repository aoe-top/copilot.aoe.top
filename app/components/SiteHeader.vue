<script setup lang="ts">
type NavLink = { href: string; label: string };

const navLinks: NavLink[] = [
    { href: "/business-plan", label: "商业计划" },
    { href: "/models", label: "模型列表" },
];
</script>

<template>
    <header class="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div
            class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"
        >
            <RouterLink to="/" class="flex items-center gap-2">
                <div class="text-base font-semibold">Glosc Copilot</div>
                <Badge variant="secondary">AI Desktop Copilot</Badge>
            </RouterLink>

            <nav
                class="hidden items-center gap-6 text-sm text-muted-foreground md:flex"
            >
                <a
                    v-for="link in navLinks"
                    :key="link.href"
                    :href="link.href"
                    class="hover:text-foreground"
                >
                    {{ link.label }}
                </a>
            </nav>

            <div class="flex items-center gap-2">
                <ThemeToggle />
                <Button
                    as-child
                    variant="secondary"
                    class="hidden sm:inline-flex"
                >
                    <a href="/business-plan">阅读商业计划</a>
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
    </header>
</template>
