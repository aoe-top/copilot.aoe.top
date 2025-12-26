<script setup lang="ts">
const errorMessage = ref<string | null>(null);
const { refresh } = useAuth();

const route = useRoute();
watchEffect(() => {
    const q = route.query?.error;
    if (!q) return;
    const raw = Array.isArray(q) ? q[0] : String(q);
    if (raw) {
        errorMessage.value =
            raw.includes("HTTPS_PROXY") || raw.includes("proxy")
                ? "GitHub 登录失败：网络不可达。若你需要代理，请设置 HTTPS_PROXY/HTTP_PROXY 后重试。"
                : `GitHub 登录失败：${raw}`;
    }
});

onMounted(() => {
    refresh().catch(() => {});
});
</script>

<template>
    <div class="mx-auto max-w-md px-4 py-12">
        <Card>
            <CardHeader>
                <CardTitle>登录</CardTitle>
                <CardDescription>选择你的登录方式</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
                <div v-if="errorMessage" class="text-sm text-destructive">
                    {{ errorMessage }}
                </div>

                <div class="flex flex-col gap-2">
                    <Button as-child variant="secondary">
                        <a href="/api/user/github">使用 GitHub 登录</a>
                    </Button>
                    <Button as-child variant="secondary">
                        <a href="/api/user/microsoft">使用微软账号登录</a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
