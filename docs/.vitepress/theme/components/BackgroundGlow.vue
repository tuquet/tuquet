<template>
  <div class="background-canvas" aria-hidden="true">
    <!-- Subtle Top Center Glow (Zinc Ambient) -->
    <div class="top-spotlight"></div>

    <!-- Technical Dot Grid -->
    <div class="dot-grid"></div>
  </div>
</template>

<style scoped>
.background-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
  background-color: var(--vp-c-bg, #09090b);
}

/* Subtle Ambient Spotlight (Zinc-900 / Slate-800 soft radiance) */
.top-spotlight {
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 1000px;
  height: 520px;
  background: var(--spotlight);
  filter: blur(80px);
}

/* Technical Subtle Grid with Radial Fade */
.dot-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse at 50% 15%, black 25%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 15%, black 25%, transparent 75%);
}
</style>
