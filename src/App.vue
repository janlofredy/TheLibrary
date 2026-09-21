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
      <!-- Standalone Public Reader View (When opening a shared Gist link) -->
      <PublicReader
        v-if="store.sharedGistId"
        :gist-id="store.sharedGistId"
        @exit="store.sharedGistId = null"
      />

      <!-- Grand Library Aisle Landing Page (For unauthenticated visitors not in demo mode) -->
      <LandingView v-else-if="!store.isAuthenticated && !store.isGuestDemoMode" />

      <!-- Writing Desk Mode (When a Book is open and animation finished) -->
      <WritingDesk v-else-if="store.activeOpenedBookId" />

      <!-- Bookshelf Browsing Mode -->
      <template v-else>
        <Navbar />
        <main class="flex-1 w-full">
          <BookshelfView />
        </main>
      </template>

      <!-- 3D Book Pull & Opening Transition Scene -->
      <BookOpeningScene
        v-if="store.isOpeningAnimationActive && store.openingBook"
        :book="store.openingBook"
        mode="opening"
        @complete="store.completeOpeningAnimation"
      />

      <!-- Modals -->
      <BookCustomizerModal />
      <ShelfModal />
      <LibraryModal />
      <AuthModal />
      <ShareModal />
      <ConflictResolutionModal />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import Navbar from '@/components/common/Navbar.vue'
import LandingView from '@/components/landing/LandingView.vue'
import BookshelfView from '@/components/bookshelf/BookshelfView.vue'
import WritingDesk from '@/components/desk/WritingDesk.vue'
import BookOpeningScene from '@/components/bookshelf/BookOpeningScene.vue'
import PublicReader from '@/components/share/PublicReader.vue'
import BookCustomizerModal from '@/components/customizer/BookCustomizerModal.vue'
import ShelfModal from '@/components/customizer/ShelfModal.vue'
import LibraryModal from '@/components/customizer/LibraryModal.vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import ShareModal from '@/components/share/ShareModal.vue'
import ConflictResolutionModal from '@/components/common/ConflictResolutionModal.vue'

const store = useLibraryStore()

onMounted(() => {
  store.init()
})
</script>
