// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    css: ["~/assets/css/tailwind.css"],
    ssr: false,
    vite: {
        plugins: [tailwindcss()],
    },

    imports: {
        dirs: ["~~/shared", "~~/server/utils", "@/components/ui/**"],
    },

    modules: ["shadcn-nuxt", "@nuxtjs/seo"],
    shadcn: {
        /**
         * Prefix for all the imported component.
         * @default "Ui"
         */
        prefix: "",
        /**
         * Directory that the component lives in.
         * Will respect the Nuxt aliases.
         * @link https://nuxt.com/docs/api/nuxt-config#alias
         * @default "@/components/ui"
         */
        componentDir: "@/components/ui",
    },

    // 确保暗色主题在SSR时也被应用
    app: {
        head: {
            htmlAttrs: {
                class: "dark",
            },
        },
    },
    site: {
        url: "https://www.glosc.ai",
        name: "Glosc Copilot",
        description:
            'Glosc Copilot 是跨平台 AI 智能桌面助手用自然语言把"打开应用 / 管理文件 / 执行命令 / 自动化流程"变成一次对话， 通过情感化交互与 Live2D 虚拟形象，带来更有温度的陪伴式体验',
    },
});
