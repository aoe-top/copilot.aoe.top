<template>
    <div class="container mx-auto px-4 py-8">
        <div
            class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
        >
            <div>
                <h1 class="text-3xl font-bold">模型列表</h1>
                <p class="text-sm text-muted-foreground">
                    共支持 {{ allCount }} 个模型，当前显示
                    {{ filteredCount }} 个
                </p>
            </div>
            <div class="flex items-center gap-2">
                <Button size="sm" variant="secondary" @click="refresh"
                    >刷新</Button
                >
            </div>
        </div>

        <Card>
            <CardHeader class="gap-3">
                <CardTitle class="text-base">筛选与排序</CardTitle>
                <div
                    class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5"
                >
                    <div class="space-y-1">
                        <div class="text-xs text-muted-foreground">关键词</div>
                        <input
                            v-model.trim="searchQuery"
                            class="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="搜索 id / name / description / tags"
                            type="search"
                        />
                    </div>

                    <div class="space-y-1">
                        <div class="text-xs text-muted-foreground">类型</div>
                        <select
                            v-model="typeFilter"
                            class="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="all">全部</option>
                            <option
                                v-for="t in typeOptions"
                                :key="t"
                                :value="t"
                            >
                                {{ t }}
                            </option>
                        </select>
                    </div>

                    <div class="space-y-1">
                        <div class="text-xs text-muted-foreground">
                            标签（多选）
                        </div>
                        <div class="relative">
                            <Button
                                ref="tagTriggerRef"
                                type="button"
                                variant="outline"
                                class="w-full justify-between"
                                :disabled="tagOptions.length === 0"
                                @click="toggleTagDropdown"
                            >
                                <span class="truncate text-left">
                                    <span v-if="selectedTags.length">{{
                                        selectedTagsLabel
                                    }}</span>
                                    <span v-else class="text-muted-foreground"
                                        >全部</span
                                    >
                                </span>
                                <span class="ml-2 text-muted-foreground"
                                    >▾</span
                                >
                            </Button>

                            <div
                                v-if="tagDropdownOpen"
                                ref="tagDropdownRef"
                                class="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md"
                            >
                                <div
                                    class="flex items-center gap-2 border-b p-2"
                                >
                                    <input
                                        v-model.trim="tagQuery"
                                        class="h-8 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        placeholder="搜索标签"
                                        type="search"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        :disabled="!selectedTags.length"
                                        @click="clearTags"
                                    >
                                        清空
                                    </Button>
                                </div>

                                <div class="max-h-56 overflow-auto p-2">
                                    <div
                                        v-if="filteredTagOptions.length === 0"
                                        class="py-2 text-sm text-muted-foreground"
                                    >
                                        无匹配标签
                                    </div>
                                    <label
                                        v-for="t in filteredTagOptions"
                                        :key="t"
                                        class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-accent"
                                    >
                                        <input
                                            class="h-4 w-4"
                                            type="checkbox"
                                            :checked="selectedTags.includes(t)"
                                            @change="toggleTag(t)"
                                        />
                                        <span class="truncate text-sm">{{
                                            t
                                        }}</span>
                                    </label>
                                </div>

                                <div
                                    class="border-t p-2 text-xs text-muted-foreground"
                                >
                                    已选：{{ selectedTags.length }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <div class="text-xs text-muted-foreground">
                            最大令牌范围
                        </div>
                        <div class="flex items-center gap-2">
                            <input
                                v-model.number="maxTokensMin"
                                class="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                inputmode="numeric"
                                placeholder="最小"
                                type="number"
                                min="0"
                            />
                            <span class="text-xs text-muted-foreground">-</span>
                            <input
                                v-model.number="maxTokensMax"
                                class="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                inputmode="numeric"
                                placeholder="最大"
                                type="number"
                                min="0"
                            />
                        </div>
                    </div>

                    <div class="space-y-1">
                        <div class="text-xs text-muted-foreground">排序</div>
                        <div class="flex items-center gap-2">
                            <select
                                v-model="sortKey"
                                class="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="id">ID</option>
                                <option value="name">名称</option>
                                <option value="type">类型</option>
                                <option value="context_window">
                                    上下文窗口
                                </option>
                                <option value="max_tokens">最大令牌</option>
                                <option value="pricing_input">输入价格</option>
                                <option value="pricing_output">输出价格</option>
                            </select>
                            <Button
                                size="sm"
                                variant="secondary"
                                @click="toggleSortDir"
                            >
                                {{ sortDir === "asc" ? "升序" : "降序" }}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent class="pt-0">
                <div v-if="pending" class="py-10 text-sm text-muted-foreground">
                    正在加载模型列表…
                </div>
                <div
                    v-else-if="fetchError"
                    class="py-10 text-sm text-destructive"
                >
                    加载失败：{{ fetchErrorMessage }}
                </div>
                <div v-else>
                    <div
                        v-if="groupedModels.length === 0"
                        class="py-10 text-sm text-muted-foreground"
                    >
                        没有匹配的模型
                    </div>

                    <Accordion
                        v-else
                        v-model="openOwners"
                        type="multiple"
                        class="w-full"
                    >
                        <AccordionItem
                            v-for="group in groupedModels"
                            :key="group.owner"
                            :value="group.owner"
                            class="border-b"
                        >
                            <AccordionTrigger class="py-4">
                                <div
                                    class="flex w-full items-center justify-between gap-4 pr-2"
                                >
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium">{{
                                            group.owner
                                        }}</span>
                                        <Badge variant="secondary">
                                            {{ group.models.length }}
                                        </Badge>
                                    </div>
                                    <div
                                        class="hidden text-xs text-muted-foreground sm:block"
                                    >
                                        {{
                                            groupSummary(
                                                group.owner,
                                                group.models
                                            )
                                        }}
                                    </div>
                                </div>
                            </AccordionTrigger>

                            <AccordionContent class="pb-4">
                                <div class="space-y-3">
                                    <Table class="[&_th]:whitespace-nowrap">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead class="w-65"
                                                    >ID / 名称</TableHead
                                                >
                                                <TableHead>类型</TableHead>
                                                <TableHead class="w-40"
                                                    >窗口 / 令牌</TableHead
                                                >
                                                <TableHead class="w-50"
                                                    >价格</TableHead
                                                >
                                                <TableHead class="min-w-70"
                                                    >描述</TableHead
                                                >
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow
                                                v-for="model in visibleModelsByOwner(
                                                    group.owner,
                                                    group.models
                                                )"
                                                :key="model.id"
                                            >
                                                <TableCell class="align-top">
                                                    <div class="space-y-1">
                                                        <div
                                                            class="font-mono text-xs text-muted-foreground"
                                                        >
                                                            {{ model.id }}
                                                        </div>
                                                        <div
                                                            class="font-medium"
                                                        >
                                                            {{
                                                                model.name ||
                                                                "-"
                                                            }}
                                                        </div>
                                                        <div
                                                            v-if="
                                                                model.tags
                                                                    ?.length
                                                            "
                                                            class="flex flex-wrap gap-1"
                                                        >
                                                            <Badge
                                                                v-for="tag in model.tags.slice(
                                                                    0,
                                                                    6
                                                                )"
                                                                :key="tag"
                                                                variant="secondary"
                                                                class="text-[11px]"
                                                            >
                                                                {{ tag }}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell class="align-top">
                                                    <Badge variant="outline">
                                                        {{ model.type || "-" }}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell class="align-top">
                                                    <div
                                                        class="space-y-1 text-sm"
                                                    >
                                                        <div>
                                                            <span
                                                                class="text-muted-foreground"
                                                                >窗口：</span
                                                            >
                                                            {{
                                                                model.context_window ??
                                                                "-"
                                                            }}
                                                        </div>
                                                        <div>
                                                            <span
                                                                class="text-muted-foreground"
                                                                >令牌：</span
                                                            >
                                                            {{
                                                                model.max_tokens ??
                                                                "-"
                                                            }}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell class="align-top">
                                                    <div
                                                        class="space-y-1 text-sm"
                                                    >
                                                        <div>
                                                            <span
                                                                class="text-muted-foreground"
                                                                >输入：</span
                                                            >
                                                            {{
                                                                model.pricing
                                                                    ?.input ||
                                                                "-"
                                                            }}
                                                        </div>
                                                        <div>
                                                            <span
                                                                class="text-muted-foreground"
                                                                >输出：</span
                                                            >
                                                            {{
                                                                model.pricing
                                                                    ?.output ||
                                                                "-"
                                                            }}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell class="align-top">
                                                    <HoverCard>
                                                        <HoverCardTrigger
                                                            as-child
                                                        >
                                                            <div
                                                                class="cursor-default"
                                                            >
                                                                <div
                                                                    class="max-w-130 truncate text-sm"
                                                                    :title="
                                                                        model.description
                                                                    "
                                                                >
                                                                    {{
                                                                        model.description ||
                                                                        "-"
                                                                    }}
                                                                </div>
                                                            </div>
                                                        </HoverCardTrigger>
                                                        <HoverCardContent
                                                            class="w-105"
                                                        >
                                                            <div
                                                                class="space-y-2"
                                                            >
                                                                <div
                                                                    class="text-sm font-medium"
                                                                >
                                                                    {{
                                                                        model.name ||
                                                                        model.id
                                                                    }}
                                                                </div>
                                                                <div
                                                                    class="text-sm text-muted-foreground"
                                                                >
                                                                    {{
                                                                        model.description ||
                                                                        "-"
                                                                    }}
                                                                </div>
                                                                <div
                                                                    class="flex flex-wrap gap-1"
                                                                    v-if="
                                                                        model
                                                                            .tags
                                                                            ?.length
                                                                    "
                                                                >
                                                                    <Badge
                                                                        v-for="tag in model.tags"
                                                                        :key="
                                                                            tag
                                                                        "
                                                                        variant="secondary"
                                                                        class="text-[11px]"
                                                                    >
                                                                        {{
                                                                            tag
                                                                        }}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>

                                    <div
                                        v-if="
                                            hasMore(group.owner, group.models)
                                        "
                                        class="flex justify-center"
                                    >
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            @click="loadMore(group.owner)"
                                        >
                                            显示更多（{{
                                                remainingCount(
                                                    group.owner,
                                                    group.models
                                                )
                                            }}）
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </CardContent>
        </Card>
    </div>
</template>

<script setup lang="ts">
import type { ModelInfo } from "~~/shared/interface";
import { onClickOutside } from "@vueuse/core";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "~/components/ui/hover-card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";

type SortKey =
    | "id"
    | "name"
    | "type"
    | "context_window"
    | "max_tokens"
    | "pricing_input"
    | "pricing_output";

type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

const {
    data: modelsResponse,
    pending,
    error: fetchError,
    refresh,
} = await useFetch<any>("/api/models");

const allModels = computed<ModelInfo[]>(() => {
    const maybe = modelsResponse.value?.data;
    return Array.isArray(maybe) ? (maybe as ModelInfo[]) : [];
});

const allCount = computed(() => allModels.value.length);

const searchQuery = ref("");
const typeFilter = ref<string>("all");
const selectedTags = ref<string[]>([]);
const maxTokensMin = ref<number | null>(null);
const maxTokensMax = ref<number | null>(null);

const sortKey = ref<SortKey>("id");
const sortDir = ref<SortDir>("asc");

const openOwners = ref<string[]>([]);
const visibleCountByOwner = reactive<Record<string, number>>({});

const typeOptions = computed(() => {
    const set = new Set<string>();
    for (const model of allModels.value) {
        if (model.type) set.add(model.type);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
});

const tagOptions = computed(() => {
    const set = new Set<string>();
    for (const model of allModels.value) {
        for (const tag of model.tags ?? []) {
            if (tag) set.add(tag);
        }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
});

const tagDropdownOpen = ref(false);
const tagQuery = ref("");
const tagTriggerRef = ref<HTMLElement | null>(null);
const tagDropdownRef = ref<HTMLElement | null>(null);

onClickOutside(
    tagDropdownRef,
    () => {
        tagDropdownOpen.value = false;
    },
    { ignore: [tagTriggerRef] }
);

const filteredTagOptions = computed(() => {
    const q = tagQuery.value.trim().toLowerCase();
    if (!q) return tagOptions.value;
    return tagOptions.value.filter((t) => t.toLowerCase().includes(q));
});

const selectedTagsLabel = computed(() => {
    const list = selectedTags.value;
    if (!list.length) return "全部";
    const head = list.slice(0, 2).join(", ");
    const rest = list.length - 2;
    return rest > 0 ? `${head} +${rest}` : head;
});

function toggleTagDropdown() {
    if (tagOptions.value.length === 0) return;
    tagDropdownOpen.value = !tagDropdownOpen.value;
    if (tagDropdownOpen.value) tagQuery.value = "";
}

function toggleTag(tag: string) {
    const list = selectedTags.value;
    const idx = list.indexOf(tag);
    if (idx >= 0) {
        selectedTags.value = [...list.slice(0, idx), ...list.slice(idx + 1)];
    } else {
        selectedTags.value = [...list, tag];
    }
}

function clearTags() {
    selectedTags.value = [];
}

function toggleSortDir() {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
}

function toSearchText(model: ModelInfo) {
    const parts = [
        model.id,
        model.name,
        model.description,
        model.type,
        model.owned_by,
        ...(model.tags ?? []),
    ].filter(Boolean);
    return parts.join(" ").toLowerCase();
}

function parsePricingNumber(value?: string) {
    if (!value) return null;
    const match = value.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const num = Number.parseFloat(match[0]);
    return Number.isFinite(num) ? num : null;
}

function getSortValue(model: ModelInfo, key: SortKey) {
    switch (key) {
        case "id":
            return model.id ?? "";
        case "name":
            return model.name ?? "";
        case "type":
            return model.type ?? "";
        case "context_window":
            return model.context_window ?? -1;
        case "max_tokens":
            return model.max_tokens ?? -1;
        case "pricing_input":
            return (
                parsePricingNumber(model.pricing?.input) ??
                Number.POSITIVE_INFINITY
            );
        case "pricing_output":
            return (
                parsePricingNumber(model.pricing?.output) ??
                Number.POSITIVE_INFINITY
            );
        default:
            return "";
    }
}

function compareValues(a: unknown, b: unknown) {
    if (typeof a === "number" && typeof b === "number") {
        return a - b;
    }
    return String(a ?? "").localeCompare(String(b ?? ""), "zh-Hans", {
        numeric: true,
        sensitivity: "base",
    });
}

function sortModels(models: ModelInfo[]) {
    const dir = sortDir.value === "asc" ? 1 : -1;
    const key = sortKey.value;
    return [...models].sort((a, b) => {
        const va = getSortValue(a, key);
        const vb = getSortValue(b, key);
        const diff = compareValues(va, vb);
        if (diff !== 0) return diff * dir;
        return a.id.localeCompare(b.id, "zh-Hans", { numeric: true });
    });
}

const filteredModels = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    const min = maxTokensMin.value;
    const max = maxTokensMax.value;

    return allModels.value.filter((m) => {
        if (typeFilter.value !== "all" && m.type !== typeFilter.value)
            return false;

        if (selectedTags.value.length) {
            const tags = m.tags ?? [];
            if (!selectedTags.value.some((t) => tags.includes(t))) return false;
        }

        if (q && !toSearchText(m).includes(q)) return false;

        const tokens = m.max_tokens ?? null;
        if (typeof min === "number" && Number.isFinite(min)) {
            if (tokens === null || tokens < min) return false;
        }
        if (typeof max === "number" && Number.isFinite(max)) {
            if (tokens === null || tokens > max) return false;
        }

        return true;
    });
});

const filteredCount = computed(() => filteredModels.value.length);

const groupedModels = computed(() => {
    const map = new Map<string, ModelInfo[]>();
    for (const model of filteredModels.value) {
        const owner = model.owned_by || "unknown";
        const list = map.get(owner);
        if (list) list.push(model);
        else map.set(owner, [model]);
    }

    return Array.from(map.entries())
        .sort((a, b) =>
            a[0].localeCompare(b[0], "zh-Hans", { sensitivity: "base" })
        )
        .map(([owner, models]) => ({
            owner,
            models: sortModels(models),
        }));
});

watchEffect(() => {
    for (const group of groupedModels.value) {
        if (visibleCountByOwner[group.owner] == null) {
            visibleCountByOwner[group.owner] = PAGE_SIZE;
        }
    }
});

function visibleModelsByOwner(owner: string, models: ModelInfo[]) {
    const limit = visibleCountByOwner[owner] ?? PAGE_SIZE;
    return models.slice(0, limit);
}

function hasMore(owner: string, models: ModelInfo[]) {
    const limit = visibleCountByOwner[owner] ?? PAGE_SIZE;
    return models.length > limit;
}

function remainingCount(owner: string, models: ModelInfo[]) {
    const limit = visibleCountByOwner[owner] ?? PAGE_SIZE;
    return Math.max(0, models.length - limit);
}

function loadMore(owner: string) {
    const current = visibleCountByOwner[owner] ?? PAGE_SIZE;
    visibleCountByOwner[owner] = current + PAGE_SIZE;
}

function groupSummary(owner: string, models: ModelInfo[]) {
    const types = new Set(
        models.map((m) => m.type).filter(Boolean) as string[]
    );
    const typeText = types.size ? `${types.size} 类` : "无类型";
    const previewCount = Math.min(
        models.length,
        visibleCountByOwner[owner] ?? PAGE_SIZE
    );
    return `${typeText} · 预览 ${previewCount}/${models.length}`;
}

const fetchErrorMessage = computed(() => {
    const e = fetchError.value as any;
    return e?.message || "未知错误";
});
</script>
