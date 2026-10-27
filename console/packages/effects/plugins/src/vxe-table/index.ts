/* oxlint-disable unicorn/prefer-export-from */
import {
  VxeForm as _VxeForm,
  VxeFormGather as _VxeFormGather,
  VxeFormGroup as _VxeFormGroup,
  VxeFormItem as _VxeFormItem,
  VxeInput as _VxeInput,
  VxeNumberInput as _VxeNumberInput,
  VxeSelect as _VxeSelect,
  VxeSwitch as _VxeSwitch,
  VxeTextarea as _VxeTextarea,
} from 'vxe-pc-ui';

export { setupVbenVxeTable } from './init';
export type { VxeTableGridColumns, VxeTableGridOptions } from './types';
export * from './use-vxe-grid';

export { default as VbenVxeGrid } from './use-vxe-grid.vue';
export type {
  VxeFormDefines,
  VxeFormEvents,
  VxeFormGroupProps,
  VxeFormInstance,
  VxeFormItemProps,
  VxeFormProps,
  VxeFormPropTypes,
} from 'vxe-pc-ui';

export const VxeForm = _VxeForm;
export const VxeFormGather = _VxeFormGather;
export const VxeFormGroup = _VxeFormGroup;
export const VxeFormItem = _VxeFormItem;
export const VxeInput = _VxeInput;
export const VxeNumberInput = _VxeNumberInput;
export const VxeSelect = _VxeSelect;
export const VxeSwitch = _VxeSwitch;
export const VxeTextarea = _VxeTextarea;

export type {
  VxeGridListeners,
  VxeGridProps,
  VxeGridPropTypes,
} from 'vxe-table';
