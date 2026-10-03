<template>
  <div
    class="relative h-[210px] w-48 sm:w-56 rounded-t-sm border border-amber-600/40 bg-gradient-to-b from-[#251a13] to-[#17100b] shadow-2xl p-3 flex flex-col justify-between overflow-hidden group/sponsor cursor-pointer transition-all duration-300 hover:border-amber-400 hover:scale-[1.02]"
    @click="openLink"
  >
    <!-- Gilded corner accents -->
    <div class="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-amber-400/60 pointer-events-none"></div>
    <div class="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-amber-400/60 pointer-events-none"></div>
    <div class="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-amber-400/60 pointer-events-none"></div>
    <div class="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-amber-400/60 pointer-events-none"></div>

    <!-- Background warm glow -->
    <div class="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-black/60 pointer-events-none"></div>

    <!-- Top Badge -->
    <div class="relative z-10 flex items-center justify-between text-[9px] font-mono tracking-widest text-amber-300/80 uppercase pb-1 border-b border-amber-500/20">
      <div class="flex items-center gap-1">
        <span>⚜️</span>
        <span>Ex Libris Patron</span>
      </div>
      <span class="text-[8px] text-amber-400 font-mono">SUPPORT</span>
    </div>

    <!-- Center Bookplate Crest & Copy -->
    <div class="relative z-10 text-center my-auto px-1">
      <div class="text-2xl mb-1 filter drop-shadow">
        {{ item.icon }}
      </div>
      <h4 class="font-serif-book font-bold text-xs sm:text-sm text-amber-100 group-hover/sponsor:text-amber-200 transition-colors line-clamp-1">
        {{ item.title }}
      </h4>
      <p class="text-[10px] text-amber-400/90 font-mono tracking-wide mt-0.5 line-clamp-1">
        {{ item.tagline }}
      </p>
      <p class="text-[10px] text-stone-400 font-serif italic mt-1 line-clamp-2 leading-snug">
        Support my open-source project
      </p>
    </div>

    <!-- Bottom Patron Plaque & CTA -->
    <div class="relative z-10 pt-1.5 border-t border-amber-500/20 flex items-center justify-between">
      <span class="text-[9px] font-mono text-stone-400">janlofre.com</span>
      <span class="text-[9px] font-serif-book font-bold uppercase tracking-wider text-amber-300 group-hover/sponsor:text-amber-100 transition-colors flex items-center gap-0.5">
        {{ item.callToAction }} <span>↗</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SPONSOR_ITEMS, type SponsorCardData } from '@/services/adService'

const props = withDefaults(
  defineProps<{
    sponsorIndex?: number
  }>(),
  {
    sponsorIndex: 0,
  }
)

const item = computed<SponsorCardData>(() => {
  return SPONSOR_ITEMS[props.sponsorIndex % SPONSOR_ITEMS.length] || SPONSOR_ITEMS[0]
})

function openLink() {
  if (item.value?.url) {
    window.open(item.value.url, '_blank', 'noopener,noreferrer')
  }
}
</script>
