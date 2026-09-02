<template>
  <div
    class="relative select-none flex-shrink-0 flex items-end justify-center transition-all duration-300 z-20"
    :class="position === 'left' ? 'mr-1' : 'ml-1'"
    :style="{ height: `${height}px`, width: `${width}px` }"
    :title="`${styleName} Bookend`"
  >
    <!-- Brass L-Bracket Bookend -->
    <div
      v-if="style === 'brass-bracket'"
      class="relative w-full h-full flex flex-col justify-between items-center rounded-t-sm shadow-xl plate-brass border border-amber-300/40 overflow-hidden"
    >
      <!-- Top Brass Finial -->
      <div class="w-3 h-3 rounded-full bg-gradient-to-b from-amber-200 to-amber-600 shadow-md mt-2 border border-amber-100/50"></div>
      
      <!-- Center Engraved Emblem -->
      <div class="text-[10px] text-amber-950 font-serif font-bold opacity-70">
        🏛️
      </div>

      <!-- Base Heavy L-Foot -->
      <div class="w-full h-3 bg-gradient-to-t from-amber-700 to-amber-500 border-t border-amber-900/40 flex items-center justify-around px-1">
        <div class="w-1.5 h-1.5 rounded-full bg-black/40"></div>
        <div class="w-1.5 h-1.5 rounded-full bg-black/40"></div>
      </div>
    </div>

    <!-- Carved Oak Wood Bookend -->
    <div
      v-else-if="style === 'carved-oak'"
      class="relative w-full h-full flex flex-col justify-between items-center rounded-t-sm shadow-xl wood-oak border border-[#2b1f14] overflow-hidden"
    >
      <!-- Beveled Wood Top -->
      <div class="w-full h-2 bg-black/20 border-b border-amber-950/40"></div>
      <div class="text-[12px] opacity-40">🪵</div>
      <!-- Wood Base -->
      <div class="w-full h-4 bg-black/40 border-t border-black/30"></div>
    </div>

    <!-- Cast Iron Heavy Bookend -->
    <div
      v-else
      class="relative w-full h-full flex flex-col justify-between items-center rounded-t-sm shadow-2xl plate-matte-black border border-stone-700 overflow-hidden"
    >
      <div class="w-2.5 h-2.5 rounded-full bg-stone-600 shadow-inner mt-2"></div>
      <div class="text-[10px] text-stone-400 font-mono">⚓</div>
      <div class="w-full h-3 bg-black/60 border-t border-stone-800 flex items-center justify-center">
        <div class="w-2 h-1 bg-stone-700 rounded-sm"></div>
      </div>
    </div>

    <!-- Base Shadow -->
    <div class="absolute -bottom-0.5 inset-x-0 h-1.5 bg-black/80 rounded-full blur-[1px] -z-10"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BookendStyle } from '@/types/journal'

const props = withDefaults(
  defineProps<{
    position?: 'left' | 'right'
    style?: BookendStyle
    height?: number
    width?: number
  }>(),
  {
    position: 'left',
    style: 'brass-bracket',
    height: 140,
    width: 22,
  }
)

const styleName = computed(() => {
  switch (props.style) {
    case 'brass-bracket': return 'Polished Brass'
    case 'carved-oak': return 'Carved Oak'
    case 'cast-iron': return 'Cast Iron'
    default: return 'Brass'
  }
})
</script>
