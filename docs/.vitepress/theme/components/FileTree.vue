<template>
  <div class="file-tree not-prose">
    <div v-if="title" class="tree-header">
      <span class="tree-title">{{ title }}</span>
    </div>
    <div class="tree-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<style scoped>
.file-tree {
  margin: 18px 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background-color: var(--vp-c-bg-alt);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  overflow: hidden;
}

.tree-header {
  padding: 8px 14px;
  background-color: var(--vp-c-bg-elv);
  border-bottom: 1px solid var(--vp-c-border);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tree-body {
  padding: 12px 16px;
  overflow-x: auto;
}

:deep(ul) {
  list-style: none !important;
  margin: 0 !important;
  padding-left: 18px !important;
  position: relative;
}

:deep(ul:first-child) {
  padding-left: 0 !important;
}

:deep(li) {
  margin: 4px 0 !important;
  padding: 2px 0 !important;
  line-height: 1.5 !important;
  position: relative;
  color: var(--vp-c-text-1);
}

:deep(ul:not(:first-child)) {
  border-left: 1px solid var(--vp-c-divider);
  margin-left: 6px !important;
}

:deep(li::before) {
  content: none !important;
}

:deep(.comment) {
  color: var(--vp-c-text-3);
  font-size: 12px;
  margin-left: 8px;
  font-style: italic;
  font-family: var(--vp-font-family-base);
}

:deep(.highlight) {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
</style>
