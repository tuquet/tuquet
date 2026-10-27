<script setup lang="ts">
import type { Recordable } from '@tuquet/types';

import type { VbenFormSchema } from '@tuquet-core/form-ui';

import { computed, reactive } from 'vue';

import { $t } from '@tuquet/locales';

import { useVbenForm } from '@tuquet-core/form-ui';
import { VbenButton } from '@tuquet-core/shadcn-ui';

interface Props {
  formSchema?: VbenFormSchema[];
}

const props = withDefaults(defineProps<Props>(), {
  formSchema: () => [],
});

const emit = defineEmits<{
  submit: [Recordable<any>];
}>();

const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: {
      labelWidth: 130,
      // All form fields
      componentProps: {
        class: 'w-full',
      },
    },
    layout: 'horizontal',
    schema: computed(() => props.formSchema),
    showDefaultActions: false,
  }),
);

async function handleSubmit() {
  const { valid } = await formApi.validate();
  const values = await formApi.getValues();
  if (valid) {
    emit('submit', values);
  }
}

defineExpose({
  getFormApi: () => formApi,
});
</script>
<template>
  <div>
    <Form />
    <VbenButton type="submit" class="mt-4" @click="handleSubmit">
      {{ $t('profile.updatePassword') }}
    </VbenButton>
  </div>
</template>
