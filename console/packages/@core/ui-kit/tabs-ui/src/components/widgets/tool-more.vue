<script lang="ts" setup>
import type { DropdownMenuProps } from '@tuquet-core/shadcn-ui';

import { LayoutGrid } from '@tuquet-core/icons';
import { VbenDropdownMenu } from '@tuquet-core/shadcn-ui';

defineProps<DropdownMenuProps>();
</script>

<template>
  <VbenDropdownMenu :menus="menus" :modal="false">
    <div
      class="flex-center h-full cursor-pointer border-l border-border px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <LayoutGrid class="size-4" />
    </div>
  </VbenDropdownMenu>
</template>
