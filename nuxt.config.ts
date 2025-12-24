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
    },
});
