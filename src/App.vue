<template>
  <div class="min-h-screen flex flex-col bg-[#120d09] text-stone-200">
    <!-- Cozy Loading Screen -->
    <div
      v-if="store.isLoading"
      class="fixed inset-0 z-50 bg-[#120d09] flex flex-col items-center justify-center p-4 text-center"
    >
      <div class="text-4xl mb-4 animate-bounce">📚</div>
      <h2 class="text-xl font-serif-book font-bold text-amber-200 tracking-wider">
        Entering The Journal Library
      </h2>
      <p class="text-xs font-mono text-stone-500 mt-2">Opening vaults & arranging shelves...</p>
    </div>

    <!-- Main App Content -->
    <template v-else>
      <!-- Writing Desk Mode (When a Book is open) -->
      <WritingDesk v-if="store.activeOpenedBookId" />

      <!-- Bookshelf Browsing Mode -->
      <template v-else>
        <Navbar />
        <main class="flex-1 w-full">
          <BookshelfView />
        </main>
      </template>

      <!-- Modals -->
      <BookCustomizerModal />
      <ShelfModal />
      <LibraryModal />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import Navbar from '@/components/common/Navbar.vue'
import BookshelfView from '@/components/bookshelf/BookshelfView.vue'
import WritingDesk from '@/components/desk/WritingDesk.vue'
import BookCustomizerModal from '@/components/customizer/BookCustomizerModal.vue'
import ShelfModal from '@/components/customizer/ShelfModal.vue'
import LibraryModal from '@/components/customizer/LibraryModal.vue'

const store = useLibraryStore()

onMounted(() => {
  store.init()
})
</script>
