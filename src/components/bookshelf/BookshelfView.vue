<template>
  <div
    class="relative min-h-[calc(100vh-64px)] w-full py-8 px-2 sm:px-6 transition-colors duration-500 overflow-y-auto"
    :class="`wood-${woodTheme}`"
  >
    <!-- Subtle Bookshelf Room Vignette Overlay -->
    <div class="fixed inset-0 pointer-events-none bg-radial from-transparent via-black/20 to-black/70 -z-0"></div>

    <div class="relative z-10 max-w-7xl mx-auto flex flex-col items-center">
      <!-- In-Library Cloud Sync Prompt Banner (When GitHub is not linked) -->
      <div
        v-if="!store.hasGitHubVault && !store.isGuestDemoMode && !isSyncBannerDismissed"
        class="w-full max-w-4xl mx-auto mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#21160e]/95 via-[#2b1c12]/95 to-[#21160e]/95 border border-amber-600/40 shadow-2xl backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden group"
      >
        <!-- Ambient glow edge -->
        <div class="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div class="flex items-start sm:items-center gap-3.5 relative z-10">
          <div class="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg shadow-amber-950/50">
            💾
          </div>
          <div class="text-left">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-sm sm:text-base font-serif-book font-bold text-amber-100 tracking-wide">
                Save Library Online Using Your Own GitHub
              </h2>
              <span class="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-[10px] font-mono text-emerald-300 uppercase">
                Local-First Active
              </span>
            </div>
            <p class="text-xs text-stone-300/90 font-serif mt-1 leading-relaxed max-w-xl">
              Your journals are currently saved locally in this browser. Connect your free, private GitHub repository for automatic cross-device sync, version control, and cloud backup.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end relative z-10 flex-shrink-0">
          <button
            type="button"
            class="px-4 py-2 text-xs font-serif-book font-bold tracking-wider uppercase rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 transition shadow-lg shadow-amber-950/50 cursor-pointer flex items-center gap-2 border border-amber-300/40 hover:scale-[1.02] active:scale-[0.98]"
            @click="store.openAuthModal('vault-setup')"
          >
            <span>🐙</span>
            <span>Connect GitHub Vault</span>
          </button>

          <button
            type="button"
            class="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-white/5 text-xs transition cursor-pointer"
            title="Dismiss notification"
            @click="dismissSyncBanner"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Guest Demo Sandbox Banner -->
      <div
        v-if="store.isGuestDemoMode"
        class="w-full max-w-4xl mx-auto mb-6 px-4 py-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
      >
        <div class="flex items-center gap-2">
          <span>🏛️</span>
          <span class="text-amber-200 font-serif">
            You are exploring the <strong>Demo Archive</strong>. Ready to create your own sanctuary?
          </span>
        </div>
        <button
          type="button"
          class="px-3.5 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif-book font-bold uppercase text-[11px] tracking-wider transition cursor-pointer shadow flex items-center gap-1.5"
          @click="store.startLocalLibrary()"
        >
          <span>📖</span>
          <span>Start Your Own Library</span>
        </button>
      </div>

      <!-- Library Header Display -->
      <div class="text-center mb-8 px-4">
        <h1 class="text-2xl sm:text-3xl font-serif-book font-bold tracking-wider text-amber-100/90 drop-shadow-md">
          {{ currentLibrary?.name || 'My Library' }}
        </h1>
        <p v-if="currentLibrary?.description" class="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto mt-1 italic font-serif">
          {{ currentLibrary.description }}
        </p>
      </div>

      <!-- Shelf Rows List -->
      <div v-if="shelves.length > 0" class="w-full flex flex-col items-center">
        <ShelfRow
          v-for="shelf in shelves"
          :key="shelf.id"
          :shelf="shelf"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="my-16 p-8 border-2 border-dashed border-stone-600/50 rounded-lg bg-black/40 text-center max-w-md"
      >
        <p class="text-stone-300 font-serif text-lg mb-4">This library has no shelves yet.</p>
        <button
          class="px-5 py-2.5 rounded bg-amber-700 hover:bg-amber-600 text-amber-100 font-medium tracking-wide shadow-lg transition"
          @click="store.openShelfModal()"
        >
          + Build First Shelf
        </button>
      </div>

      <!-- Add New Shelf Button -->
      <div v-if="shelves.length > 0" class="mt-4 mb-8">
        <button
          class="px-6 py-2.5 rounded-full border border-amber-600/40 bg-black/50 hover:bg-amber-950/60 hover:border-amber-500/80 text-amber-200/90 hover:text-amber-100 text-xs sm:text-sm tracking-widest uppercase font-serif-book transition-all duration-200 shadow-xl flex items-center gap-2 cursor-pointer"
          @click="store.openShelfModal()"
        >
          <span class="text-base font-light">+</span> Add New Shelf
        </button>
      </div>

      <!-- Support Open Source Banner -->
      <div class="w-full max-w-4xl mx-auto mb-16 px-4">
        <EthicalAd
          variant="banner"
          :show-label="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import ShelfRow from './ShelfRow.vue'
import EthicalAd from '@/components/common/EthicalAd.vue'

const store = useLibraryStore()

const isSyncBannerDismissed = ref(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('sync_banner_dismissed') === 'true')

function dismissSyncBanner() {
  isSyncBannerDismissed.value = true
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('sync_banner_dismissed', 'true')
  }
}

const currentLibrary = computed(() => store.currentLibrary)
const shelves = computed(() => store.currentShelves)
const woodTheme = computed(() => currentLibrary.value?.woodMaterial || 'walnut')
</script>
