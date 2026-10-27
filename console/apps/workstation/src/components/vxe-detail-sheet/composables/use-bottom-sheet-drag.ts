import { ref } from 'vue';

export interface UseBottomSheetDragOptions {
  defaultHeightDvh?: number;
  expandedHeightDvh?: number;
  onDismiss?: () => void;
}

export function useBottomSheetDrag(options: UseBottomSheetDragOptions = {}) {
  const { defaultHeightDvh = 60, expandedHeightDvh = 94, onDismiss } = options;

  const isBottomExpanded = ref(false);
  const isDragging = ref(false);
  const sheetHeightDvh = ref<null | number>(null);

  let startY = 0;
  let initialHeightDvh = defaultHeightDvh;
  let lastPointerY = 0;
  let lastPointerTime = 0;
  let pointerVelocityY = 0; // px/ms (>0 is moving downwards, <0 is moving upwards)

  function toggleBottomHeight() {
    isBottomExpanded.value = !isBottomExpanded.value;
    sheetHeightDvh.value = null;
  }

  function onGrabberPointerDown(e: PointerEvent) {
    // Only capture primary button / touch / stylus
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.currentTarget as HTMLElement | null;
    if (target?.setPointerCapture) {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture fails
      }
    }

    startY = e.clientY;
    lastPointerY = e.clientY;
    lastPointerTime = performance.now();
    pointerVelocityY = 0;
    initialHeightDvh = isBottomExpanded.value
      ? expandedHeightDvh
      : defaultHeightDvh;
    isDragging.value = true;
    sheetHeightDvh.value = initialHeightDvh;
  }

  function onGrabberPointerMove(e: PointerEvent) {
    if (!isDragging.value) return;
    const currentY = e.clientY;
    const now = performance.now();
    const dt = now - lastPointerTime;
    if (dt > 0) {
      pointerVelocityY = (currentY - lastPointerY) / dt;
    }
    lastPointerY = currentY;
    lastPointerTime = now;

    const deltaPx = startY - currentY; // Pull up: deltaPx > 0, pull down: deltaPx < 0
    const windowHeight =
      (typeof window === 'undefined' ? 0 : window.innerHeight) || 1;
    const deltaDvh = (deltaPx / windowHeight) * 100;

    // Fluid resistance at the top (>94dvh) and bottom (<30dvh)
    let nextDvh = initialHeightDvh + deltaDvh;
    if (nextDvh > 94) {
      nextDvh = 94 + (nextDvh - 94) * 0.25; // Soft ceiling
    } else if (nextDvh < 30) {
      nextDvh = 30 - (30 - nextDvh) * 0.4; // Soft floor before release dismiss
    }

    sheetHeightDvh.value = Math.max(15, Math.min(98, nextDvh));
  }

  function onGrabberPointerUp(e: PointerEvent) {
    if (!isDragging.value) return;
    const target = e.currentTarget as HTMLElement | null;
    if (target?.releasePointerCapture) {
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
    isDragging.value = false;
    const currentDvh =
      sheetHeightDvh.value ??
      (isBottomExpanded.value ? expandedHeightDvh : defaultHeightDvh);

    // Velocity-assisted snap & dismiss:
    // If moving downward rapidly (>0.6 px/ms) or dragged down below 36dvh -> dismiss
    if (pointerVelocityY > 0.6 || currentDvh < 36) {
      onDismiss?.();
      sheetHeightDvh.value = null;
      isBottomExpanded.value = false;
    } else if (pointerVelocityY < -0.5 || currentDvh > 75) {
      // Fast flick upwards or dragged high -> Snap to full expanded (94dvh)
      isBottomExpanded.value = true;
      sheetHeightDvh.value = null;
    } else {
      // Snap back to default (60dvh)
      isBottomExpanded.value = false;
      sheetHeightDvh.value = null;
    }
  }

  return {
    isBottomExpanded,
    isDragging,
    onGrabberPointerDown,
    onGrabberPointerMove,
    onGrabberPointerUp,
    sheetHeightDvh,
    toggleBottomHeight,
  };
}
