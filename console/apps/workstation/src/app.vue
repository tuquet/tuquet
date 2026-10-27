<script lang="ts" setup>
import { onMounted } from 'vue';

import { Toaster } from '@tuquet-core/shadcn-ui';

import {
  initDesktopAuthHandling,
  isTauriEnvironment,
  revealWindow,
} from '#/adapter/desktop';

defineOptions({ name: 'App' });

onMounted(async () => {
  if (isTauriEnvironment()) {
    await revealWindow();
    await initDesktopAuthHandling();
  }
});
</script>

<template>
  <RouterView />
  <Toaster position="top-right" rich-colors />
</template>
