<template>
  <div
    v-if="isVisible"
    class="ethical-ad-container relative transition-all duration-300"
    :class="containerClasses"
  >
    <!-- Privacy / Sponsor Micro Header -->
    <div
      v-if="showLabel"
      class="flex items-center justify-between text-[10px] font-mono tracking-widest text-stone-500 uppercase px-2 mb-1.5 select-none"
    >
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500/80 inline-block animate-pulse"></span>
        <span class="text-stone-400 font-medium">{{ sponsorBadge }}</span>
      </div>
      <div class="flex items-center gap-2 text-stone-500">
        <span class="hover:text-amber-300 cursor-help" title="Privacy-first, tracker-free ethical advertisement supporting open-source development">
          Zero-Tracker
        </span>
        <button
          v-if="allowDismiss"
          type="button"
          class="hover:text-stone-300 transition cursor-pointer p-0.5"
          title="Dismiss ad"
          @click="dismissAd"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Live EthicalAds Placement Node -->
    <div
      v-if="showLiveNetworkAd"
      ref="adContainerEl"
      :data-ea-publisher="publisherId"
      :data-ea-type="placementType"
      :data-ea-style="isDarkTheme ? 'dark' : 'light'"
      :class="['ea-placement', isDarkTheme ? 'dark' : 'light']"
      class="w-full overflow-hidden rounded-lg min-h-[90px]"
    ></div>

    <!-- Thematic Vintage House Sponsor / Fallback Card -->
    <div
      v-else-if="currentSponsor"
      class="house-ad-card relative rounded-xl border p-3.5 transition-all duration-300 group overflow-hidden"
      :class="cardStyleClasses"
    >
      <!-- Subtle parchment / brass background sheen -->
      <div class="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>

      <div class="relative z-10 flex items-start gap-3">
        <!-- Icon badge -->
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 shadow-inner border border-amber-500/30 bg-black/40"
          :style="{ borderColor: currentSponsor.accentColor + '60' }"
        >
          {{ currentSponsor.icon }}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-0.5">
            <h4 class="font-serif-book font-bold text-xs sm:text-sm text-amber-100 group-hover:text-amber-200 transition-colors">
              {{ currentSponsor.title }}
            </h4>
            <span
              class="text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase tracking-wider"
              :style="{ color: currentSponsor.accentColor, borderColor: currentSponsor.accentColor + '50', backgroundColor: currentSponsor.accentColor + '15' }"
            >
              {{ currentSponsor.badge }}
            </span>
          </div>

          <p class="text-[11px] font-serif text-stone-300 leading-snug line-clamp-2 mb-2">
            {{ currentSponsor.description }}
          </p>

          <div class="flex items-center justify-between pt-1 border-t border-white/5">
            <span class="text-[10px] font-mono text-stone-500 italic">
              {{ currentSponsor.tagline }}
            </span>

            <a
              :href="currentSponsor.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-serif-book font-bold uppercase tracking-wider bg-amber-950/70 hover:bg-amber-900 border border-amber-600/50 hover:border-amber-400 text-amber-200 hover:text-amber-100 transition shadow-sm cursor-pointer"
            >
              <span>{{ currentSponsor.callToAction }}</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getStoredAdConfig,
  loadEthicalAdsScript,
  HOUSE_SPONSORS,
  type HouseSponsor,
} from '@/services/adService'

const props = withDefaults(
  defineProps<{
    /** Placement layout style */
    variant?: 'banner' | 'card' | 'bookmark' | 'compact'
    /** EthicalAds placement type: 'image' or 'text' */
    placementType?: 'image' | 'text'
    /** Whether to show 'Sponsor / Zero-Tracker' micro top label */
    showLabel?: boolean
    /** Whether user can dismiss this ad session */
    allowDismiss?: boolean
    /** Fixed house sponsor index (optional) */
    sponsorIndex?: number
  }>(),
  {
    variant: 'card',
    placementType: 'image',
    showLabel: true,
    allowDismiss: false,
    sponsorIndex: undefined,
  }
)

const adContainerEl = ref<HTMLElement | null>(null)
const isDismissed = ref(false)
const adConfig = ref(getStoredAdConfig())
const showLiveNetworkAd = ref(false)
const isDarkTheme = ref(true)

const isVisible = computed(() => {
  if (isDismissed.value) return false
  if (!adConfig.value.enabled) return false
  if (adConfig.value.isAdFreeSupporter) return false
  return true
})

const publisherId = computed(() => adConfig.value.ethicalAdsPublisherId || 'the-journal-library')

const currentSponsor = computed<HouseSponsor | null>(() => {
  if (props.sponsorIndex !== undefined && HOUSE_SPONSORS[props.sponsorIndex]) {
    return HOUSE_SPONSORS[props.sponsorIndex]
  }
  // Deterministic pick based on time of day / minute to cycle naturally
  const idx = Math.floor(Date.now() / (1000 * 60 * 15)) % HOUSE_SPONSORS.length
  return HOUSE_SPONSORS[idx]
})

const sponsorBadge = computed(() => {
  if (showLiveNetworkAd.value) return 'Ethical Ad'
  return currentSponsor.value?.badge || 'Library Patron'
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
      return 'w-full max-w-xl mx-auto my-3'
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

function dismissAd() {
  isDismissed.value = true
}

onMounted(async () => {
  if (adConfig.value.provider === 'ethicalads' && adConfig.value.enabled) {
    await loadEthicalAdsScript()
    // Check if window.ethicalads is present and ready
    if (typeof window !== 'undefined' && (window as unknown as { ethicalads?: unknown }).ethicalads) {
      showLiveNetworkAd.value = true
      try {
        const ea = (window as unknown as { ethicalads: { load?: () => void } }).ethicalads
        if (typeof ea.load === 'function') {
          ea.load()
        }
      } catch {
        showLiveNetworkAd.value = false
      }
    } else {
      // Fallback gracefully to curated vintage house ads
      showLiveNetworkAd.value = false
    }
  } else {
    showLiveNetworkAd.value = false
  }
})
</script>

<style scoped>
.ea-placement {
  min-height: 90px;
}
</style>
