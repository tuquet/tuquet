import { describe, expect, it } from 'vitest';

import { getVxeUI } from '#/adapter/vxe-table';

describe('vxe standard cell renderers', () => {
  it('registers CellDate, CellIdCopy, and CellStatus renderers in vxeUI', () => {
    const vxeUI = getVxeUI();
    const cellDate = vxeUI?.renderer?.get('CellDate');
    const cellIdCopy = vxeUI?.renderer?.get('CellIdCopy');
    const cellStatus = vxeUI?.renderer?.get('CellStatus');

    expect(cellDate).toBeDefined();
    expect(cellDate?.renderTableDefault).toBeTypeOf('function');

    expect(cellIdCopy).toBeDefined();
    expect(cellIdCopy?.renderTableDefault).toBeTypeOf('function');

    expect(cellStatus).toBeDefined();
    expect(cellStatus?.renderTableDefault).toBeTypeOf('function');
  });

  it('renders CellDate correctly with date string and fallback', () => {
    const cellDate = getVxeUI()?.renderer?.get('CellDate');

    // Empty date
    const emptyVNode = cellDate?.renderTableDefault?.(
      {} as any,
      { column: { field: 'date' }, row: { date: null } } as any,
    );
    expect(emptyVNode).toBeDefined();
    expect(emptyVNode?.children).toBe('—');

    // Valid date string
    const validVNode = cellDate?.renderTableDefault?.(
      {} as any,
      {
        column: { field: 'date' },
        row: { date: '2026-01-01T12:00:00Z' },
      } as any,
    );
    expect(validVNode).toBeDefined();
    expect(typeof validVNode?.children).toBe('string');
    expect(validVNode?.children).not.toBe('—');
  });

  it('renders CellIdCopy correctly with short id', () => {
    const cellIdCopy = getVxeUI()?.renderer?.get('CellIdCopy');
    const testUuid = '12345678-abcd-ef01-2345-6789abcdef01';

    const vnode = cellIdCopy?.renderTableDefault?.(
      {} as any,
      { column: { field: 'id' }, row: { id: testUuid } } as any,
    );
    expect(vnode).toBeDefined();
    expect(Array.isArray(vnode?.children)).toBe(true);

    const children = vnode?.children as any[];
    const codeNode = children[0];
    expect(codeNode.children).toBe('12345678...ef01');
  });

  it('renders CellStatus correctly according to statusMap', () => {
    const cellStatus = getVxeUI()?.renderer?.get('CellStatus');
    const renderOpts = {
      props: {
        statusMap: {
          installed: { label: 'Đã cài đặt', variant: 'success' },
          disabled: { label: 'Tạm dừng', variant: 'muted' },
        },
      },
    };

    const vnode = cellStatus?.renderTableDefault?.(
      renderOpts as any,
      { column: { field: 'status' }, row: { status: 'installed' } } as any,
    );
    expect(vnode).toBeDefined();
  });
});
