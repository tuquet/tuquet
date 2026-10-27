<script lang="ts" setup>
import type { VbenFormSchema } from '@tuquet/common-ui';
import type { Recordable } from '@tuquet/types';

import { computed, ref } from 'vue';

import { AuthenticationForgetPassword, z } from '@tuquet/common-ui';
import { $t } from '@tuquet/locales';

import { toast } from '@tuquet-core/shadcn-ui';

import { resetPassword } from '#/api/core/auth';
import { captureError } from '#/utils/bugsink';

defineOptions({ name: 'ForgetPassword' });

const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.emailTip'),
      },
      fieldName: 'email',
      label: $t('authentication.email'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailTip') })
        .email({ message: $t('authentication.emailValidErrorTip') }),
    },
  ];
});

async function handleSubmit(values: Recordable<any>) {
  try {
    loading.value = true;
    await resetPassword(values.email);
    toast.success($t('authentication.resetLinkSent'));
  } catch (error: any) {
    captureError(error, { view: 'ForgetPassword' });
    toast.error(error.message || $t('authentication.resetLinkFailed'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthenticationForgetPassword
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
