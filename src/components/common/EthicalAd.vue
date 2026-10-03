<template>
  <div
    class="creator-sponsor-container relative transition-all duration-300"
    :class="containerClasses"
  >
    <!-- Top Support Badge Label -->
    <div
      v-if="showLabel"
      class="flex items-center justify-between text-[10px] font-mono tracking-widest text-stone-500 uppercase px-2 mb-1.5 select-none"
    >
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400/90 inline-block animate-pulse"></span>
        <span class="text-amber-300/80 font-medium">Support My Open-Source Project</span>
      </div>
      <div class="flex items-center gap-2">
        <a
          :href="CREATOR_LINKS.portfolioUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-stone-400 hover:text-amber-200 transition"
        >
          janlofre.com ↗
        </a>
      </div>
    </div>

    <!-- Sponsor Card Content -->
    <div
      class="sponsor-card relative rounded-xl border p-4 transition-all duration-300 group overflow-hidden"
      :class="cardStyleClasses"
    >
      <!-- Ambient warm glow -->
      <div class="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-amber-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>

      <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Left: Icon & Description -->
        <div class="flex items-start gap-3.5 min-w-0">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-inner border bg-black/40"
            :style="{ borderColor: activeItem.accentColor + '60' }"
          >
            {{ activeItem.icon }}
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-0.5">
              <h4 class="font-serif-book font-bold text-sm text-amber-100 group-hover:text-amber-200 transition-colors">
                {{ activeItem.title }}
              </h4>
              <span
                class="text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider"
                :style="{ color: activeItem.accentColor, borderColor: activeItem.accentColor + '50', backgroundColor: activeItem.accentColor + '15' }"
              >
                {{ activeItem.badge }}
              </span>
            </div>

            <p class="text-xs font-serif text-stone-300 leading-snug line-clamp-2">
              {{ activeItem.description }}
            </p>

            <div class="text-[10px] font-mono text-amber-400/90 italic mt-1">
              ✨ Support my open-source project
            </div>
          </div>
        </div>

        <!-- Right: Actions Buttons -->
        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
          <a
            :href="CREATOR_LINKS.buyMeACoffeeUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif-book font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-500 text-stone-950 transition shadow-md cursor-pointer"
            title="Buy Me a Coffee"
          >
            <span>☕</span>
            <span>Buy a Coffee</span>
          </a>

          <a
            :href="CREATOR_LINKS.githubSponsorsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif-book font-bold uppercase tracking-wider bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-pink-500/60 text-stone-200 transition shadow-sm cursor-pointer"
            title="GitHub Sponsors"
          >
            <span>💖</span>
            <span>Sponsor</span>
          </a>

          <a
            :href="CREATOR_LINKS.portfolioUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border border-stone-800 hover:border-stone-600 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            title="Creator Portfolio"
          >
            <span>janlofre.com</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CREATOR_LINKS, SPONSOR_ITEMS, type SponsorCardData } from '@/services/adService'

const props = withDefaults(
  defineProps<{
    variant?: 'banner' | 'card' | 'bookmark' | 'compact'
    showLabel?: boolean
    itemIndex?: number
  }>(),
  {
    variant: 'card',
    showLabel: true,
    itemIndex: undefined,
  }
)

const activeItem = computed<SponsorCardData>(() => {
  if (props.itemIndex !== undefined && SPONSOR_ITEMS[props.itemIndex]) {
    return SPONSOR_ITEMS[props.itemIndex]
  }
  // Alternate naturally based on time
  const idx = Math.floor(Date.now() / (1000 * 60 * 10)) % SPONSOR_ITEMS.length
  return SPONSOR_ITEMS[idx]
})

const containerClasses = computed(() => {
  switch (props.variant) {
    case 'banner':
      return 'w-full max-w-4xl mx-auto my-4'
    case 'bookmark':
      return 'w-full max-w-[260px]'
    case 'compact':
      return 'w-full max-w-md'
    case 'card':
    default:
      return 'w-full max-w-2xl mx-auto my-3'
  }
})

const cardStyleClasses = computed(() => {
  switch (props.variant) {
    case 'bookmark':
      return 'bg-[#1a140f]/95 border-amber-800/40 shadow-xl'
    case 'banner':
      return 'bg-gradient-to-r from-[#1b140f]/90 via-[#231811]/90 to-[#1b140f]/90 border-amber-700/30 shadow-xl'
    case 'compact':
      return 'bg-[#16100c]/90 border-stone-800/80 shadow-md'
    case 'card':
    default:
      return 'bg-gradient-to-b from-[#1c1510]/90 to-[#120e0a]/90 border-amber-600/30 shadow-2xl backdrop-blur-sm'
  }
})
</script>
