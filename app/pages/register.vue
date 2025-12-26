<script setup lang="ts"></script>

<template>
    <div class="mx-auto max-w-md px-4 py-12">
        <Card>
            <CardHeader>
                <CardTitle>注册已关闭</CardTitle>
                <CardDescription>本站仅支持第三方账号登录</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
                <Button as-child variant="secondary">
                    <a href="/api/user/github">使用 GitHub 登录</a>
                </Button>
                <Button as-child variant="secondary">
                    <a href="/api/user/microsoft">使用微软账号登录</a>
                </Button>
                <Button as-child variant="outline">
                    <NuxtLink to="/login">返回登录页</NuxtLink>
                </Button>
            </CardContent>
        </Card>
    </div>
</template>
