import { describe, expect, it, vi } from 'vitest';

import { useBottomSheetDrag } from '../composables/use-bottom-sheet-drag';

describe('useBottomSheetDrag', () => {
  it('initializes with default states', () => {
    const { isBottomExpanded, isDragging, sheetHeightDvh } =
      useBottomSheetDrag();
    expect(isBottomExpanded.value).toBe(false);
    expect(isDragging.value).toBe(false);
    expect(sheetHeightDvh.value).toBe(null);
  });

  it('toggles bottom height between default and expanded', () => {
    const { isBottomExpanded, toggleBottomHeight } = useBottomSheetDrag();
    expect(isBottomExpanded.value).toBe(false);
    toggleBottomHeight();
    expect(isBottomExpanded.value).toBe(true);
    toggleBottomHeight();
    expect(isBottomExpanded.value).toBe(false);
  });

  it('handles drag lifecycle and snaps to expanded when dragged up', () => {
    const {
      isBottomExpanded,
      isDragging,
      onGrabberPointerDown,
      onGrabberPointerMove,
      onGrabberPointerUp,
      sheetHeightDvh,
    } = useBottomSheetDrag();

    // Start drag at Y=500
    onGrabberPointerDown({
      button: 0,
      clientY: 500,
      currentTarget: null,
      pointerId: 1,
      pointerType: 'touch',
    } as any);

    expect(isDragging.value).toBe(true);
    expect(sheetHeightDvh.value).toBe(60);

    // Drag up to Y=200 (deltaPx = 300, deltaDvh = 30% of 1000px if height=1000)
    window.innerHeight = 1000;
    onGrabberPointerMove({
      clientY: 200,
    } as any);

    expect(sheetHeightDvh.value).toBeGreaterThan(75);

    // Release pointer
    onGrabberPointerUp({
      currentTarget: null,
      pointerId: 1,
    } as any);

    expect(isDragging.value).toBe(false);
    expect(isBottomExpanded.value).toBe(true);
    expect(sheetHeightDvh.value).toBe(null);
  });

  it('triggers onDismiss when dragged down below threshold', () => {
    const onDismiss = vi.fn();
    const {
      isDragging,
      onGrabberPointerDown,
      onGrabberPointerMove,
      onGrabberPointerUp,
    } = useBottomSheetDrag({ onDismiss });

    window.innerHeight = 1000;
    // Start at Y=400
    onGrabberPointerDown({
      button: 0,
      clientY: 400,
      currentTarget: null,
      pointerId: 1,
      pointerType: 'touch',
    } as any);

    // Drag down to Y=750 (deltaPx = -350, currentDvh = 60 - 35 = 25 < 36)
    onGrabberPointerMove({
      clientY: 750,
    } as any);

    onGrabberPointerUp({
      currentTarget: null,
      pointerId: 1,
    } as any);

    expect(isDragging.value).toBe(false);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
