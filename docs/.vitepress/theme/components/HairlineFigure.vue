<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useData } from 'vitepress'

interface Props {
  name: string
  intensity?: number
  theme?: 'auto' | 'light' | 'dark'
  label?: string
  caption?: string
  aspectRatio?: string
  maxWidth?: string
  align?: 'center' | 'left' | 'right'
  halo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  intensity: 0.65,
  theme: 'auto',
  aspectRatio: '5 / 4',
  maxWidth: '420px',
  align: 'center',
  halo: true,
})

const { isDark } = useData()
const containerRef = ref<HTMLDivElement | null>(null)
let figureInstance: any = null

const mountFigure = async () => {
  if (typeof window === 'undefined' || !containerRef.value) return

  if (figureInstance) {
    figureInstance.destroy()
    figureInstance = null
  }

  try {
    const hairline = await import('@lucasmarkes/hairline')
    const figureFn = (hairline as Record<string, any>)[props.name]

    if (typeof figureFn !== 'function') {
      console.warn(`[HairlineFigure] Unknown figure name: "${props.name}"`)
      return
    }

    const effectiveTheme = props.theme === 'auto' ? (isDark.value ? 'dark' : 'light') : props.theme

    figureInstance = figureFn(containerRef.value, {
      intensity: props.intensity,
      theme: effectiveTheme,
      label: props.label,
    })
  } catch (err) {
    console.warn(`[HairlineFigure] Failed to mount "${props.name}":`, err)
  }
}

onMounted(() => {
  mountFigure()
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

watch(() => props.name, () => {
  mountFigure()
})

onUnmounted(() => {
  if (figureInstance) {
    figureInstance.destroy()
    figureInstance = null
  }
})
</script>

<template>
  <figure
    class="hairline-figure-wrap"
    :class="`align-${align}`"
    :style="{ maxWidth: maxWidth }"
  >
    <div class="stage-container">
      <div v-if="halo" class="stage-halo"></div>
      <div
        ref="containerRef"
        class="stage-canvas"
        :style="{ aspectRatio: aspectRatio }"
        :aria-label="label || name"
        role="img"
      ></div>
    </div>
    <figcaption v-if="caption" class="stage-caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>

<style scoped>
.hairline-figure-wrap {
  position: relative;
  width: 100%;
  margin: 2rem auto;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;
}

.hairline-figure-wrap.align-left {
  margin-left: 0;
  margin-right: auto;
}

.hairline-figure-wrap.align-right {
  margin-left: auto;
  margin-right: 0;
}

.stage-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.stage-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 75%;
  height: 75%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
  filter: blur(48px);
  z-index: 0;
}

:root:not(.dark) .stage-halo {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(56, 189, 248, 0.04) 50%, transparent 70%);
}

.dark .stage-halo {
  background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%);
}

.stage-canvas {
  position: relative;
  z-index: 1;
  width: 100%;
  cursor: grab;
  touch-action: pan-y;
}

.stage-canvas:active {
  cursor: grabbing;
}

:deep(.stage-canvas svg) {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.stage-caption {
  margin-top: 0.6rem;
  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-3);
  text-align: center;
  font-style: italic;
}

@media (max-width: 640px) {
  .hairline-figure-wrap {
    margin: 1.25rem auto;
  }
  .stage-halo {
    filter: blur(28px);
  }
}
</style>
