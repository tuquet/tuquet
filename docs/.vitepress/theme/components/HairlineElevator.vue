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
  label: 'Four floors beside an open shaft. The pointer height dispatches the car.',
})

const { isDark } = useData()
const containerRef = ref<HTMLDivElement | null>(null)
let figureInstance: any = null

onMounted(async () => {
  if (typeof window === 'undefined' || !containerRef.value) return

  try {
    const { elevator } = await import('@lucasmarkes/hairline')
    const effectiveTheme = props.theme === 'auto' ? (isDark.value ? 'dark' : 'light') : props.theme

    figureInstance = elevator(containerRef.value, {
      intensity: props.intensity,
      theme: effectiveTheme,
      label: props.label,
    })
  } catch (err) {
    console.warn('Failed to mount HairlineElevator:', err)
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
  <div class="hairline-elevator-wrapper">
    <div class="elevator-halo"></div>
    <div
      ref="containerRef"
      class="hairline-elevator-figure"
      :aria-label="label"
      role="img"
    ></div>
  </div>
</template>

<style scoped>
.hairline-elevator-wrapper {
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

.elevator-halo {
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

.hairline-elevator-figure {
  position: relative;
  z-index: 1;
  width: 100%;
  aspect-ratio: 5 / 4;
  cursor: pointer;
  touch-action: pan-y;
  transition: transform 0.2s ease;
}

:deep(.hairline-elevator-figure svg) {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

@media (max-width: 960px) {
  .hairline-elevator-wrapper {
    max-width: 460px;
  }
  .elevator-halo {
    width: 340px;
    height: 300px;
  }
}

@media (max-width: 640px) {
  .hairline-elevator-wrapper {
    max-width: 340px;
  }
  .elevator-halo {
    width: 260px;
    height: 220px;
    filter: blur(36px);
  }
}
</style>
