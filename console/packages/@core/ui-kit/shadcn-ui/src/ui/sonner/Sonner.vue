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
    :toast-options="{
      classes: {
        toast:
          'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton:
          'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton:
          'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    }"
    :style="{
      '--normal-bg': 'hsl(var(--background))',
      '--normal-border': 'hsl(var(--border))',
      '--normal-text': 'hsl(var(--foreground))',
      '--success-bg': 'hsl(var(--background))',
      '--success-border': 'hsl(var(--border))',
      '--success-text': 'hsl(var(--foreground))',
      '--error-bg': 'hsl(var(--background))',
      '--error-border': 'hsl(var(--border))',
      '--error-text': 'hsl(var(--foreground))',
    }"
  />
</template>
