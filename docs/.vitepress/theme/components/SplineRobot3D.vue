<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

defineOptions({ name: 'SplineRobot3D' })

const props = withDefaults(
  defineProps<{
    sceneUrl?: string
  }>(),
  {
    sceneUrl: 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode',
  },
)

const { isDark } = useData()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoading = ref(true)
const hasError = ref(false)

interface SplineAppInstance {
  dispose?: () => void
  load: (url: string) => Promise<void>
}

let splineApp: null | SplineAppInstance = null
let disposed = false

const RUNTIME_CDNS = [
  'https://unpkg.com/@splinetool/runtime@1.9.82/build/runtime.js',
  'https://cdn.jsdelivr.net/npm/@splinetool/runtime@1.9.82/build/runtime.js',
]

async function loadSplineRuntime(): Promise<{
  Application: new (canvas: HTMLCanvasElement) => SplineAppInstance
}> {
  let lastErr: unknown
  for (const url of RUNTIME_CDNS) {
    try {
      const mod = await import(/* @vite-ignore */ url)
      if (mod?.Application) {
        return mod
      }
    } catch (error) {
      lastErr = error
    }
  }
  throw lastErr ?? new Error('Failed to load @splinetool/runtime')
}

onMounted(async () => {
  if (typeof window === 'undefined' || !canvasRef.value) return
  try {
    isLoading.value = true
    hasError.value = false
    const { Application } = await loadSplineRuntime()
    if (disposed || !canvasRef.value) return

    const app = new Application(canvasRef.value)
    splineApp = app
    await app.load(props.sceneUrl)
    if (!disposed) {
      isLoading.value = false
      updateSplineLighting(isDark.value)
    }
  } catch (err) {
    if (!disposed) {
      console.warn('Spline load error:', err)
      isLoading.value = false
      hasError.value = true
    }
  }
})

function updateSplineLighting(dark: boolean) {
  if (!splineApp) return
  try {
    const objects = splineApp.getAllObjects?.() || []
    for (const obj of objects) {
      // Find lights or ambient illumination objects in the 3D scene
      const name = (obj.name || '').toLowerCase()
      if (
        name.includes('light') ||
        name.includes('sun') ||
        name.includes('directional') ||
        name.includes('point') ||
        name.includes('ambient')
      ) {
        if (typeof obj.intensity === 'number') {
          // Boost lighting by 2.2x - 2.8x in light mode so the robot doesn't look black
          obj.intensity = dark ? 1.0 : 2.5
        }
      }
    }
  } catch (e) {
    // Graceful fallback to CSS post-processing
  }
}

watch(isDark, (newDark) => {
  updateSplineLighting(newDark)
})

onBeforeUnmount(() => {
  disposed = true
  try {
    splineApp?.dispose?.()
  } catch {
    // Ignore WebGL cleanup errors on unmount
  }
  splineApp = null
})
</script>

<template>
  <div class="spline-robot-wrapper">
    <!-- Ambient Halo Glow behind 3D Spline scene -->
    <div class="spline-halo"></div>

    <!-- Minimal Hairline-style loader while .splinecode streams from CDN -->
    <Transition name="fade">
      <div v-if="isLoading" class="spline-loader">
        <div class="spinner"></div>
        <span class="loader-text">Loading 3D Scene...</span>
      </div>
    </Transition>

    <!-- Fallback message if offline -->
    <div v-if="hasError" class="spline-fallback">
      <span>3D scene offline (WebGL / network error)</span>
    </div>

    <!-- Interactive Spline WebGL Canvas -->
    <canvas
      ref="canvasRef"
      class="spline-canvas"
      :class="{ 'is-ready': !isLoading }"
    ></canvas>
  </div>
</template>

<style scoped>
.spline-robot-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 580px;
  height: 480px;
  margin: 0 auto;
  user-select: none;
  -webkit-user-select: none;
}

.spline-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 440px;
  height: 380px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.1) 45%, transparent 70%);
  border-radius: 50%;
  filter: blur(52px);
  pointer-events: none;
  z-index: 0;
}

:root:not(.dark) .spline-halo {
  background: radial-gradient(circle, rgba(14, 165, 233, 0.22) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%);
  filter: blur(40px);
}

.spline-canvas {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.5s ease-in-out, filter 0.3s ease;
}

/* Light mode calibration: enhance brightness and dynamic range so metallic surfaces shine cleanly */
:root:not(.dark) .spline-canvas {
  filter: brightness(1.22) contrast(1.08) drop-shadow(0 15px 35px rgba(0, 0, 0, 0.12));
}

.dark .spline-canvas {
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5));
}

.spline-canvas:active {
  cursor: grabbing;
}

.spline-canvas.is-ready {
  opacity: 1;
}

.spline-loader {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  pointer-events: none;
}

.spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-top-color: #38bdf8;
  animation: spin 0.8s linear infinite;
}

.loader-text {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
}

.spline-fallback {
  position: absolute;
  z-index: 2;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .spline-robot-wrapper {
    max-width: 440px;
    height: 400px;
  }
}

@media (max-width: 640px) {
  .spline-robot-wrapper {
    max-width: 320px;
    height: 320px;
  }
}
</style>
