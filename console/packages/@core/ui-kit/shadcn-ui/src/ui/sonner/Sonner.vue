<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner';

import { Toaster as Sonner } from 'vue-sonner';
import 'vue-sonner/style.css';

const props = defineProps<ToasterProps>();
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :style="{
      '--normal-bg': 'var(--background)',
      '--normal-border': 'var(--border)',
      '--normal-text': 'var(--foreground)',
      '--success-bg': 'var(--background)',
      '--success-border': 'var(--border)',
      '--success-text': 'var(--foreground)',
      '--error-bg': 'var(--background)',
      '--error-border': 'var(--border)',
      '--error-text': 'var(--foreground)',
    }"
  />
</template>
