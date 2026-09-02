<template>
  <div class="min-h-screen flex flex-col bg-[#120d09] text-stone-200">
    <!-- Header -->
    <header class="h-16 w-full bg-[#16100b]/95 border-b border-[#3b2a1a] px-4 sm:px-8 flex items-center justify-between z-40 backdrop-blur sticky top-0 shadow-lg">
      <div class="flex items-center gap-3">
        <span class="text-xl">📖</span>
        <div>
          <span class="text-[10px] font-mono text-amber-400 uppercase tracking-widest block">Shared Reading Room</span>
          <h1 class="font-serif-book font-bold text-sm sm:text-base text-amber-100 truncate max-w-[200px] sm:max-w-[360px]">
            {{ payload?.book?.title || payload?.shelf?.name || 'Shared Journal' }}
          </h1>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded text-xs font-serif-book font-bold tracking-wider bg-amber-600 hover:bg-amber-500 text-amber-100 transition shadow cursor-pointer flex items-center gap-1.5"
          :disabled="isImporting"
          @click="handleImportToLibrary"
        >
          <span>📥</span> <span>{{ isImporting ? 'Importing...' : 'Import to My Library' }}</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded border border-stone-700 hover:border-stone-500 text-stone-300 text-xs font-mono transition cursor-pointer"
          @click="handleReturnHome"
        >
          Exit Reader
        </button>
      </div>
    </header>

    <!-- Reader Loading State -->
    <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div class="text-4xl mb-4 animate-spin">📜</div>
      <h2 class="text-lg font-serif-book font-bold text-amber-200">Opening Shared Journal...</h2>
      <p class="text-xs font-mono text-stone-500 mt-2">Fetching pages and leather bindings...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div class="text-4xl mb-4">⚠️</div>
      <h2 class="text-lg font-serif-book font-bold text-rose-300">{{ errorMessage }}</h2>
      <button
        type="button"
        class="mt-4 px-4 py-2 rounded bg-stone-800 text-stone-200 text-xs font-mono hover:bg-stone-700 cursor-pointer"
        @click="handleReturnHome"
      >
        Return to My Bookshelf
      </button>
    </div>

    <!-- Reader Content (Physical Book Spread) -->
    <main v-else-if="payload" class="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <!-- Book Meta Card -->
      <div class="w-full flex items-center justify-between mb-4 px-2 text-xs font-mono text-stone-400">
        <div>
          <span>Exported: {{ new Date(payload.exportedAt).toLocaleDateString() }}</span>
        </div>
        <div>
          <span>Page {{ currentPageIndex + 1 }} of {{ totalPages }}</span>
        </div>
      </div>

      <!-- Open Book Spread -->
      <div class="relative w-full rounded-xl p-3 sm:p-6 book-spread-shadow flex flex-col shadow-2xl transition-all" :style="{ backgroundColor: bookSpineColor }">
        <!-- Leather Stitching Trim -->
        <div class="absolute inset-2 border border-amber-300/30 rounded-lg pointer-events-none"></div>

        <!-- Paper Page Container -->
        <div class="relative w-full rounded-md min-h-[480px] p-6 sm:p-10 shadow-inner flex flex-col justify-between" :class="`paper-${currentPaperStyle}`">
          <!-- Page Header -->
          <div class="border-b border-black/10 pb-3 mb-4 flex items-center justify-between">
            <h2 class="font-serif-book font-bold text-xl sm:text-2xl text-stone-800">
              {{ currentPage?.title || 'Untitled Page' }}
            </h2>
            <div class="flex items-center gap-2 text-xs font-mono text-stone-500">
              <span v-if="currentPage?.mood">Mood: {{ currentPage.mood }}</span>
              <span>•</span>
              <span>{{ currentPage?.entryDate ? new Date(currentPage.entryDate).toLocaleDateString() : '' }}</span>
            </div>
          </div>

          <!-- Page Content (Render HTML/Markdown) -->
          <div class="flex-1 font-serif text-stone-800 text-sm sm:text-base leading-relaxed overflow-y-auto max-h-[380px] pr-2 space-y-4 prose" v-html="pageHtmlContent"></div>

          <!-- Page Footer Navigation -->
          <div class="pt-4 border-t border-black/10 mt-6 flex items-center justify-between text-xs font-mono text-stone-600">
            <button
              type="button"
              class="px-3 py-1.5 rounded border border-black/20 hover:bg-black/5 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              :disabled="currentPageIndex <= 0"
              @click="currentPageIndex--"
            >
              ‹ Previous Page
            </button>

            <span class="font-serif italic">— Page {{ currentPageIndex + 1 }} —</span>

            <button
              type="button"
              class="px-3 py-1.5 rounded border border-black/20 hover:bg-black/5 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              :disabled="currentPageIndex >= totalPages - 1"
              @click="currentPageIndex++"
            >
              Next Page ›
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchSharedGist, importSharedPayload, type SharedPayload } from '@/services/shareService'
import { useLibraryStore } from '@/stores/libraryStore'

const props = defineProps<{
  gistId: string
}>()

const emit = defineEmits<{
  (e: 'exit'): void
}>()

const store = useLibraryStore()

const isLoading = ref(true)
const isImporting = ref(false)
const errorMessage = ref<string | null>(null)
const payload = ref<SharedPayload | null>(null)
const currentPageIndex = ref(0)

onMounted(async () => {
  try {
    isLoading.value = true
    payload.value = await fetchSharedGist(props.gistId)
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load shared journal.'
  } finally {
    isLoading.value = false
  }
})

const pages = computed(() => payload.value?.pages || [])
const totalPages = computed(() => pages.value.length || 1)
const currentPage = computed(() => pages.value[currentPageIndex.value] || null)

const bookSpineColor = computed(() => payload.value?.book?.spineColor || '#7a1c2f')
const currentPaperStyle = computed(() => currentPage.value?.paperStyle || 'lined')

const pageHtmlContent = computed(() => {
  if (!currentPage.value) return '<p class="italic text-stone-400">Empty page.</p>'
  if (typeof currentPage.value.content === 'string') {
    return currentPage.value.content || '<p class="italic text-stone-400">No content written on this page.</p>'
  }
  return '<p class="italic text-stone-400">Formatted content unavailable.</p>'
})

async function handleImportToLibrary() {
  if (!payload.value) return
  isImporting.value = true

  try {
    const targetShelf = store.currentShelves[0]
    if (!targetShelf) {
      alert('Please create at least one shelf in your library first!')
      return
    }

    const { booksCount, pagesCount } = await importSharedPayload(payload.value, targetShelf.id)
    await store.loadAll()
    alert(`Successfully imported ${booksCount} book (${pagesCount} pages) onto "${targetShelf.name}"!`)
    handleReturnHome()
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Import failed')
  } finally {
    isImporting.value = false
  }
}

function handleReturnHome() {
  // Clear search query param without page reload
  window.history.replaceState({}, '', window.location.pathname)
  emit('exit')
}
</script>
