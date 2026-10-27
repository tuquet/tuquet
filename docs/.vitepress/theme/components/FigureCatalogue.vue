<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from 'vitepress'
import HairlineFigure from './HairlineFigure.vue'

interface FigureItem {
  id: string
  name: string
  shelf: 'interfaces' | 'data' | 'machines' | 'devices' | 'coding' | 'security' | 'connectivity' | 'empty' | 'marks'
  desc: string
  isMark?: boolean
  markSrc?: string
}

const shelves = [
  { id: 'all', label: 'All', count: 30 },
  { id: 'interfaces', label: 'Interfaces', count: 1 },
  { id: 'data', label: 'Data', count: 3 },
  { id: 'machines', label: 'Machines', count: 3 },
  { id: 'devices', label: 'Devices', count: 3 },
  { id: 'coding', label: 'Coding', count: 3 },
  { id: 'security', label: 'Security', count: 3 },
  { id: 'connectivity', label: 'Connectivity', count: 3 },
  { id: 'empty', label: 'Empty', count: 8 },
  { id: 'marks', label: 'Marks', count: 3 },
]

const figures: FigureItem[] = [
  // Interfaces (1)
  { id: 'exploded', name: 'Exploded', shelf: 'interfaces', desc: 'An app window in four layers; pointer opens the gap and selects layers.' },

  // Data (3)
  { id: 'terrain', name: 'Terrain', shelf: 'data', desc: 'Eighty-one pillars on a plinth rising dynamically around pointer presence.' },
  { id: 'phosphor', name: 'Phosphor', shelf: 'data', desc: '7×7 dot matrix fading like phosphor where the pointer paints it.' },
  { id: 'riffle', name: 'Riffle', shelf: 'data', desc: 'A tray of cards that fan out and stand up under pointer interaction.' },

  // Machines (3)
  { id: 'slow', name: 'Slow', shelf: 'machines', desc: 'Crates on a conveyor belt; hover slows the clock without stopping it.' },
  { id: 'turntable', name: 'Turntable', shelf: 'machines', desc: 'Isometric blocks on a turntable settling on the nearest quarter turn.' },
  { id: 'elevator', name: 'Elevator', shelf: 'machines', desc: 'Four floors beside an open shaft; pointer height dispatches the car.' },

  // Devices (3)
  { id: 'keyboard', name: 'Keyboard', shelf: 'devices', desc: 'Sixty-key board where keys sink and ripple outwards across neighbours.' },
  { id: 'phone', name: 'Phone', shelf: 'devices', desc: 'A phone in layers: glass, logic board, battery, and protective shell.' },
  { id: 'laptop', name: 'Laptop', shelf: 'devices', desc: 'A thin laptop whose display lid opens on a calibrated spring.' },

  // Coding (3)
  { id: 'terminal', name: 'Terminal', shelf: 'coding', desc: 'A terminal window scrolling history and lifting lines under pointer.' },
  { id: 'cabinet', name: 'Cabinet', shelf: 'coding', desc: 'A rack of server blades pulled out on rails according to pointer height.' },
  { id: 'branches', name: 'Branches', shelf: 'coding', desc: 'A DAG commit tree on a plinth whose history branches rise in sequence.' },

  // Security (3)
  { id: 'vault', name: 'Vault', shelf: 'security', desc: 'A vault door whose rotating combination dial unlocks heavy sliding bolts.' },
  { id: 'lockers', name: 'Lockers', shelf: 'security', desc: 'Twelve storage lockers where hovering opens doors with swinging physics.' },
  { id: 'padlock', name: 'Padlock', shelf: 'security', desc: 'A security padlock whose shackle springs upward and swings open.' },

  // Connectivity (3)
  { id: 'patch', name: 'Patch', shelf: 'connectivity', desc: 'A 24-port patch panel whose cables lift and lean away when touched.' },
  { id: 'dish', name: 'Dish', shelf: 'connectivity', desc: 'A parabolic satellite dish on a 2-axis gimbal following on a spring.' },
  { id: 'router', name: 'Router', shelf: 'connectivity', desc: 'A Wi-Fi router whose antennas lean directionally toward the pointer.' },

  // Empty (8)
  { id: 'loupe', name: 'Loupe', shelf: 'empty', desc: 'A stand loupe magnifying ruled lines across a drafting sheet.' },
  { id: 'sieve', name: 'Sieve', shelf: 'empty', desc: 'Stacked test sieves where pointer height separates individual meshes.' },
  { id: 'rail', name: 'Rail', shelf: 'empty', desc: 'A garment rail with seven bare hangers rocking on gentle brush.' },
  { id: 'plug', name: 'Plug', shelf: 'empty', desc: 'A grounded wall socket drawing up a power plug on pointer approach.' },
  { id: 'query', name: 'Query', shelf: 'empty', desc: 'A solid question mark on a plinth with a loose ball rolling after it.' },
  { id: 'drawer', name: 'Drawer', shelf: 'empty', desc: 'A three-drawer filing unit sliding out with internal dividers.' },
  { id: 'basket', name: 'Basket', shelf: 'empty', desc: 'A wire basket tilting on a spring under a swinging bail handle.' },
  { id: 'plot', name: 'Plot', shelf: 'empty', desc: 'A minimalist bar chart with flat metric tabs lifting on hover.' },

  // Marks (3)
  { id: 'vercel', name: 'Vercel', shelf: 'marks', desc: 'Vercel Mark: The triangle hovers and seats into its base slot.', isMark: true, markSrc: '/figures/marks/vercel.html' },
  { id: 'mastra', name: 'Mastra', shelf: 'marks', desc: 'Mastra Mark: Joined spheres drawing in and stretching a connection neck.', isMark: true, markSrc: '/figures/marks/mastra.html' },
  { id: 'notion', name: 'Notion', shelf: 'marks', desc: 'Notion Mark: The isometric cube opening its lid as an empty container.', isMark: true, markSrc: '/figures/marks/notion.html' },
]

const activeShelf = ref('all')
const searchQuery = ref('')
const { isDark } = useData()

const filteredFigures = computed(() => {
  return figures.filter((fig) => {
    const matchesShelf = activeShelf.value === 'all' || fig.shelf === activeShelf.value
    const matchesQuery = searchQuery.value === '' ||
      fig.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      fig.desc.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      fig.shelf.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesShelf && matchesQuery
  })
})
</script>

<template>
  <div class="catalogue-root">
    <!-- Filter Bar -->
    <div class="filter-strip">
      <div class="pills-scroll">
        <button
          v-for="s in shelves"
          :key="s.id"
          type="button"
          class="shelf-pill"
          :class="{ active: activeShelf === s.id }"
          @click="activeShelf = s.id"
        >
          <span class="pill-label">{{ s.label }}</span>
          <span class="pill-count">{{ s.count }}</span>
        </button>
      </div>

      <div class="search-wrap">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Filter figures..."
        />
      </div>
    </div>

    <!-- Figures Grid -->
    <div class="figures-grid">
      <div
        v-for="fig in filteredFigures"
        :key="fig.id"
        class="figure-tile"
      >
        <div class="tile-canvas-wrap">
          <HairlineFigure
            v-if="!fig.isMark"
            :name="fig.id"
            :halo="false"
            max-width="100%"
          />
          <iframe
            v-else
            :src="`${fig.markSrc}?theme=${isDark ? 'dark' : 'light'}`"
            class="tile-iframe"
            loading="lazy"
            title="Mark figure"
          />
        </div>

        <div class="tile-info">
          <div class="tile-title-row">
            <span class="tile-name">{{ fig.name }}</span>
            <span class="tile-tag">{{ fig.shelf }}</span>
          </div>
          <p class="tile-desc">{{ fig.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.catalogue-root {
  margin: 1.5rem 0 3rem;
  width: 100%;
}

.filter-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.pills-scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: none;
}

.pills-scroll::-webkit-scrollbar {
  display: none;
}

.shelf-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.shelf-pill:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-3);
}

.shelf-pill.active {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  border-color: var(--vp-c-text-1);
}

.pill-count {
  font-size: 11px;
  opacity: 0.7;
  font-family: var(--vp-font-family-mono);
}

.search-wrap {
  flex: 0 1 200px;
  min-width: 140px;
}

.search-input {
  width: 100%;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  font-size: 13px;
  outline: none;
}

.search-input:focus {
  border-color: var(--vp-c-brand-1);
}

.figures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.figure-tile {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-elv);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.figure-tile:hover {
  border-color: var(--vp-c-text-3);
  box-shadow: 0 6px 24px -4px rgba(0, 0, 0, 0.08);
}

.dark .figure-tile {
  border-color: rgba(255, 255, 255, 0.08);
}

.dark .figure-tile:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.5);
}

.tile-canvas-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 5 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
}

.dark .tile-canvas-wrap {
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.tile-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.tile-info {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tile-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tile-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.tile-tag {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
}

.tile-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .figures-grid {
    grid-template-columns: 1fr;
  }
}
</style>
