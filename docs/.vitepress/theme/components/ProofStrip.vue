<script setup lang="ts">
import { Terminal, ShieldCheck, Cpu, Lock } from 'lucide-vue-next'
</script>

<template>
  <div class="proof-strip-wrapper">
    <div class="proof-strip">
      <div class="stat">
        <b>68</b>
        <span>
          <Terminal :size="13" class="ic" aria-hidden="true" />
          Manifest CLI Commands
        </span>
      </div>
      <div class="stat">
        <b>0%</b>
        <span>
          <ShieldCheck :size="13" class="ic text-green" aria-hidden="true" />
          CDP Port Leak
        </span>
      </div>
      <div class="stat">
        <b>&lt;30MB</b>
        <span>
          <Cpu :size="13" class="ic" aria-hidden="true" />
          Rust Binary (0 Zombie)
        </span>
      </div>
      <div class="stat">
        <b>100%</b>
        <span>
          <Lock :size="13" class="ic" aria-hidden="true" />
          Local-First &amp; Free <i class="live"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.proof-strip-wrapper {
  max-width: 1040px;
  margin: 28px auto 0 auto;
  padding: 0 16px;
}

.proof-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-alt);
  overflow: hidden;
}

.stat {
  position: relative;
  display: block;
  padding: 16px 18px;
  border-right: 1px solid var(--vp-c-border);
  transition: background 0.15s ease;
}

.stat:last-child {
  border-right: none;
}

.stat:hover {
  background: var(--vp-c-bg-elv);
}

.stat b {
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 800;
  font-size: clamp(20px, 2vw, 30px);
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}

.stat span {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  color: var(--vp-c-text-2);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
}

.stat:hover span {
  color: var(--vp-c-text-1);
}

.stat .ic {
  width: 13px;
  height: 13px;
  flex: 0 0 13px;
  color: var(--vp-c-text-2);
}

.stat i.live {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
  display: inline-block;
  animation: stat-pulse 2s infinite ease-in-out;
}

@keyframes stat-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@media (max-width: 768px) {
  .proof-strip {
    grid-template-columns: repeat(2, 1fr);
  }
  .stat:nth-child(2) {
    border-right: none;
  }
  .stat:nth-child(1),
  .stat:nth-child(2) {
    border-bottom: 1px solid var(--vp-c-border);
  }
}

@media (max-width: 640px) {
  .proof-strip-wrapper {
    margin: 16px auto 0 auto;
    padding: 0 10px;
  }
  .stat {
    padding: 10px 12px;
  }
  .stat b {
    font-size: 18px;
  }
  .stat span {
    font-size: 9px;
    letter-spacing: 0.04em;
    margin-top: 4px;
    gap: 4px;
  }
  .stat .ic {
    width: 11px;
    height: 11px;
    flex: 0 0 11px;
  }
}
</style>
