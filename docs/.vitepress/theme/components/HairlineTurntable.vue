<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useData } from 'vitepress'

interface Props {
  intensity?: number
  theme?: 'auto' | 'light' | 'dark'
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  intensity: 0.7,
  theme: 'auto',
  label: 'Blocks on an isometric turntable. Flick across to spin.',
})

const { isDark } = useData()
const containerRef = ref<HTMLDivElement | null>(null)
let figureInstance: any = null

onMounted(async () => {
  if (typeof window === 'undefined' || !containerRef.value) return

  try {
    const { turntable } = await import('@lucasmarkes/hairline')
    const effectiveTheme = props.theme === 'auto' ? (isDark.value ? 'dark' : 'light') : props.theme

    figureInstance = turntable(containerRef.value, {
      intensity: props.intensity,
      theme: effectiveTheme,
      label: props.label,
    })
  } catch (err) {
    console.warn('Failed to mount HairlineTurntable:', err)
  }
})

watch(isDark, (newVal) => {
  if (figureInstance && props.theme === 'auto') {
    figureInstance.update({
      theme: newVal ? 'dark' : 'light',
    })
  }
})

watch(() => props.intensity, (newVal) => {
  if (figureInstance) {
    figureInstance.update({ intensity: newVal })
  }
})

onUnmounted(() => {
  if (figureInstance) {
    figureInstance.destroy()
    figureInstance = null
  }
})
</script>

<template>
  <div class="hairline-turntable-wrapper">
    <div class="turntable-halo"></div>
    <div
      ref="containerRef"
      class="hairline-turntable-figure"
      :aria-label="label"
      role="img"
    ></div>
  </div>
</template>

<style scoped>
.hairline-turntable-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 580px;
  margin: 0 auto;
  user-select: none;
  -webkit-user-select: none;
}

.turntable-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 440px;
  height: 380px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.1) 45%, transparent 70%);
  border-radius: 50%;
  filter: blur(52px);
  pointer-events: none;
  z-index: 0;
}

.hairline-turntable-figure {
  position: relative;
  z-index: 1;
  width: 100%;
  aspect-ratio: 5 / 4;
  cursor: grab;
  touch-action: pan-y;
  transition: transform 0.2s ease;
}

.hairline-turntable-figure:active {
  cursor: grabbing;
}

:deep(.hairline-turntable-figure svg) {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

/* Hide the needle arrow indicator directly under the circular platter */
:deep(.hairline-turntable-figure svg > g > path:nth-of-type(3)),
:deep(.hairline-turntable-figure svg path[d*="L200 "]),
:deep(.hairline-turntable-figure svg path[d*="L 200 "]),
:deep(.hairline-turntable-figure svg path[d^="M196"]),
:deep(.hairline-turntable-figure svg path[d^="M 196"]) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

@media (max-width: 960px) {
  .hairline-turntable-wrapper {
    max-width: 460px;
  }
  .turntable-halo {
    width: 340px;
    height: 300px;
  }
}

@media (max-width: 640px) {
  .hairline-turntable-wrapper {
    max-width: 340px;
  }
  .turntable-halo {
    width: 260px;
    height: 220px;
    filter: blur(36px);
  }
}
</style>
