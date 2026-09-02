<template>
  <div
    class="relative min-h-[calc(100vh-64px)] w-full py-8 px-2 sm:px-6 transition-colors duration-500 overflow-y-auto"
    :class="`wood-${woodTheme}`"
  >
    <!-- Subtle Bookshelf Room Vignette Overlay -->
    <div class="fixed inset-0 pointer-events-none bg-radial from-transparent via-black/20 to-black/70 -z-0"></div>

    <div class="relative z-10 max-w-7xl mx-auto flex flex-col items-center">
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
      <div v-if="shelves.length > 0" class="mt-4 mb-16">
        <button
          class="px-6 py-2.5 rounded-full border border-amber-600/40 bg-black/50 hover:bg-amber-950/60 hover:border-amber-500/80 text-amber-200/90 hover:text-amber-100 text-xs sm:text-sm tracking-widest uppercase font-serif-book transition-all duration-200 shadow-xl flex items-center gap-2 cursor-pointer"
          @click="store.openShelfModal()"
        >
          <span class="text-base font-light">+</span> Add New Shelf
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import ShelfRow from './ShelfRow.vue'

const store = useLibraryStore()

const currentLibrary = computed(() => store.currentLibrary)
const shelves = computed(() => store.currentShelves)
const woodTheme = computed(() => currentLibrary.value?.woodMaterial || 'walnut')
</script>
