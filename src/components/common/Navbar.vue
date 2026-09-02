<template>
  <header class="h-16 w-full bg-[#16100b]/95 border-b border-[#3b2a1a] px-4 sm:px-8 flex items-center justify-between z-40 backdrop-blur sticky top-0 shadow-lg">
    <!-- Brand Title & Active Library -->
    <div class="flex items-center gap-3 sm:gap-6">
      <div class="flex items-center gap-2 cursor-pointer" @click="store.openLibraryModal()">
        <span class="text-xl">📚</span>
        <span class="font-serif-book font-bold text-base sm:text-lg tracking-wider text-amber-100 hidden sm:inline">
          The Journal Library
        </span>
      </div>

      <!-- Library Selector Pill -->
      <button
        class="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-stone-700 hover:border-amber-500/80 transition cursor-pointer text-xs"
        @click="store.openLibraryModal()"
      >
        <div class="w-2 h-2 rounded-full bg-amber-400"></div>
        <span class="font-serif font-medium text-amber-200/90 truncate max-w-[120px] sm:max-w-[180px]">
          {{ store.currentLibrary?.name || 'Grand Archive' }}
        </span>
        <span class="text-stone-500 text-[10px]">▼</span>
      </button>
    </div>

    <!-- Center Stats & Cloud Sync Indicator -->
    <div class="flex items-center gap-3">
      <!-- Quick Stats -->
      <div class="hidden lg:flex items-center gap-4 text-xs font-mono text-stone-400 bg-black/30 px-4 py-1.5 rounded-full border border-stone-800">
        <span><strong class="text-amber-300 font-bold">{{ store.libraryStats.shelvesCount }}</strong> Shelves</span>
        <span>•</span>
        <span><strong class="text-amber-300 font-bold">{{ store.libraryStats.booksCount }}</strong> Books</span>
        <span>•</span>
        <span><strong class="text-amber-300 font-bold">{{ store.libraryStats.pagesCount }}</strong> Pages</span>
      </div>

      <!-- Cloud Sync Status Pill -->
      <SyncStatusPill />
    </div>

    <!-- Right Actions -->
    <div class="flex items-center gap-2 sm:gap-3">
      <button
        class="px-3 py-1.5 rounded text-xs font-serif-book tracking-wider border border-amber-900/60 bg-amber-950/30 hover:bg-amber-900/50 text-amber-200 transition cursor-pointer flex items-center gap-1.5"
        @click="store.openShelfModal()"
      >
        <span>+</span> <span class="hidden sm:inline">New Shelf</span>
      </button>

      <button
        class="px-3.5 py-1.5 rounded text-xs font-serif-book font-semibold tracking-wider bg-amber-600 hover:bg-amber-500 text-amber-100 transition shadow cursor-pointer flex items-center gap-1.5"
        @click="openQuickNewBook"
      >
        <span>+</span> <span>New Book</span>
      </button>

      <!-- Account / Cloud Settings Button -->
      <button
        class="p-2 rounded hover:bg-white/5 text-stone-400 hover:text-stone-200 text-sm transition"
        title="GitHub Database & Sync Settings"
        @click="store.openAuthModal()"
      >
        🐙
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useLibraryStore } from '@/stores/libraryStore'
import SyncStatusPill from './SyncStatusPill.vue'

const store = useLibraryStore()

function openQuickNewBook() {
  const firstShelf = store.currentShelves[0]
  if (firstShelf) {
    store.openNewBookModal(firstShelf.id)
  } else {
    store.openShelfModal()
  }
}
</script>
