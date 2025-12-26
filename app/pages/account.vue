<script setup lang="ts">
const { user, pending, loaded, refresh, logout } = useAuth();

async function onLogout() {
    await logout();
    await navigateTo("/login");
}

onMounted(() => {
    refresh().catch(() => {});
});
</script>

<template>
    <div class="mx-auto max-w-3xl px-4 py-10">
        <Card>
            <CardHeader>
                <CardTitle>个人中心</CardTitle>
                <CardDescription>查看当前登录用户信息</CardDescription>
            </CardHeader>

            <CardContent>
                <div
                    v-if="pending && !loaded"
                    class="text-sm text-muted-foreground"
                >
                    正在加载…
                </div>

                <div v-else-if="!user" class="space-y-4">
                    <div class="text-sm text-muted-foreground">
                        当前未登录。
                    </div>
                    <div class="flex flex-col gap-2">
                        <Button as-child variant="secondary">
                            <a href="/api/user/github">使用 GitHub 登录</a>
                        </Button>
                        <Button as-child variant="secondary">
                            <a href="/api/user/microsoft">使用微软账号登录</a>
                        </Button>
                    </div>
                </div>

                <div v-else class="space-y-6">
                    <div class="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage
                                v-if="user.avatarUrl"
                                :src="user.avatarUrl"
                            />
                            <AvatarFallback>
                                {{
                                    (
                                        user.name ||
                                        user.githubLogin ||
                                        user.email ||
                                        "U"
                                    )
                                        .slice(0, 1)
                                        .toUpperCase()
                                }}
                            </AvatarFallback>
                        </Avatar>
                        <div class="space-y-1">
                            <div class="text-base font-medium">
                                {{ user.name || user.githubLogin || "已登录" }}
                            </div>
                            <div class="text-sm text-muted-foreground">
                                {{ user.email || "（未提供邮箱）" }}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div class="grid gap-3 sm:grid-cols-2">
                        <div class="space-y-1">
                            <div class="text-xs text-muted-foreground">
                                用户ID
                            </div>
                            <div class="text-sm font-mono">{{ user.id }}</div>
                        </div>
                        <div class="space-y-1">
                            <div class="text-xs text-muted-foreground">
                                GitHub
                            </div>
                            <div class="text-sm">
                                <span v-if="user.githubLogin"
                                    >@{{ user.githubLogin }}</span
                                >
                                <span v-else class="text-muted-foreground"
                                    >未绑定</span
                                >
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <Button variant="secondary" @click="refresh"
                            >刷新</Button
                        >
                        <Button variant="outline" @click="onLogout"
                            >退出登录</Button
                        >
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
