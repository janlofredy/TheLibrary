<template>
  <div
    v-if="book"
    class="min-h-screen w-full flex flex-col justify-between py-6 px-3 sm:px-8 relative overflow-x-hidden select-none transition-colors duration-500"
    :class="`wood-${store.currentLibrary?.woodMaterial || 'walnut'}`"
  >
    <!-- Ambient Lamp Lighting & Vignette -->
    <div class="fixed inset-0 pointer-events-none bg-radial from-amber-500/10 via-transparent to-black/80 -z-0"></div>

    <!-- Desk Top Navigation Bar -->
    <header class="relative z-20 max-w-5xl mx-auto w-full flex items-center justify-between pb-4 border-b border-white/10 mb-6">
      <!-- Back to Bookshelf -->
      <button
        class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/80 border border-stone-700/70 text-amber-200 hover:text-amber-100 text-xs font-serif-book tracking-wider transition cursor-pointer shadow-md"
        @click="handleReturnToShelf"
      >
        <span>←</span> <span>Back to Shelf</span>
      </button>

      <!-- Centered Book Title & Volume Banner -->
      <div class="text-center px-4">
        <h1 class="text-lg sm:text-xl font-serif-book font-bold text-amber-100 drop-shadow truncate max-w-[280px] sm:max-w-md">
          {{ book.title }}
        </h1>
        <p v-if="book.subtitle" class="text-xs text-stone-400 font-serif italic truncate">
          {{ book.subtitle }}
        </p>
      </div>

      <!-- Right Actions: Focus Mode & Customizer -->
      <div class="flex items-center gap-2">
        <button
          class="p-2 rounded-full bg-black/40 hover:bg-black/70 border border-stone-800 text-stone-300 hover:text-amber-200 text-xs font-mono transition cursor-pointer"
          :title="isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'"
          @click="isFocusMode = !isFocusMode"
        >
          {{ isFocusMode ? '⛶ Normal' : '🗖 Focus' }}
        </button>

        <button
          class="p-2 rounded-full bg-black/40 hover:bg-black/70 border border-stone-800 text-stone-300 hover:text-amber-200 text-xs transition cursor-pointer"
          title="Customize Book Cover & Spine"
          @click="store.openBookCustomizer(book)"
        >
          ⚙
        </button>
      </div>
    </header>

    <!-- The Open Book Desk Workspace -->
    <main class="relative z-10 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center my-2">
      <!-- Open Book Outer Leather Cover Shadow Base -->
      <div
        class="relative w-full rounded-lg p-2 sm:p-3 shadow-2xl transition-all duration-300 book-spread-shadow"
        :style="{ backgroundColor: book.spineColor }"
      >
        <!-- Gold/Stitched Border Trim around Leather Cover -->
        <div class="absolute inset-1.5 border border-amber-300/20 rounded pointer-events-none"></div>

        <!-- The Tactile Open Paper Sheet -->
        <div
          class="relative w-full rounded-sm min-h-[580px] sm:min-h-[660px] p-6 sm:p-10 transition-all duration-300 flex flex-col justify-between"
          :class="`paper-${activePaperStyle}`"
        >
          <!-- Center Spine Gutter Crease Shadow -->
          <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 pointer-events-none book-gutter-crease opacity-30 hidden sm:block"></div>

          <div>
            <!-- Page Header: Title, Date, Mood & Paper Texture Switcher -->
            <div
              v-if="!isFocusMode"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/10 mb-4 select-none"
            >
              <!-- Page Title & Date -->
              <div class="flex-1">
                <input
                  v-model="pageTitle"
                  type="text"
                  placeholder="Untitled Page"
                  class="w-full bg-transparent border-0 font-serif-book font-bold text-xl sm:text-2xl text-stone-900 focus:outline-none placeholder:text-stone-400"
                  @blur="savePageHeader"
                />
                <div class="flex items-center gap-3 mt-1 text-xs text-stone-500 font-mono">
                  <span>📅 {{ formattedDate }}</span>
                  <span>•</span>
                  <span><strong>{{ pageWordCount }}</strong> words</span>
                </div>
              </div>

              <!-- Mood & Paper Selectors -->
              <div class="flex flex-wrap items-center gap-2">
                <!-- Mood Selector -->
                <div class="flex items-center bg-black/5 rounded-full p-0.5 border border-black/10">
                  <button
                    v-for="m in moods"
                    :key="m.id"
                    type="button"
                    class="px-2 py-0.5 rounded-full text-xs transition cursor-pointer"
                    :class="activeMood === m.id ? 'bg-amber-700 text-amber-100 shadow-sm font-bold' : 'text-stone-600 hover:text-stone-900'"
                    :title="m.label"
                    @click="setMood(m.id)"
                  >
                    {{ m.emoji }}
                  </button>
                </div>

                <!-- Paper Style Selector -->
                <select
                  v-model="activePaperStyle"
                  class="text-xs bg-black/5 border border-black/10 rounded px-2 py-1 text-stone-700 focus:outline-none cursor-pointer"
                  @change="savePaperStyle"
                >
                  <option value="lined">Lined Paper</option>
                  <option value="dotted">Dotted Grid</option>
                  <option value="parchment">Antique Sepia</option>
                  <option value="slate">Dark Slate</option>
                </select>
              </div>
            </div>

            <!-- The Paper Rich Text Editor -->
            <PaperEditor
              v-if="currentPage"
              :key="currentPage.id"
              :model-value="pageContent"
              :show-toolbar="!isFocusMode"
              @change="handleContentChange"
            />
          </div>

          <!-- Page Footer: Tags & Page Number -->
          <div
            v-if="!isFocusMode"
            class="pt-4 border-t border-black/10 flex items-center justify-between text-xs text-stone-500 font-mono select-none"
          >
            <!-- Tags display -->
            <div class="flex items-center gap-1.5 overflow-x-auto max-w-[60%]">
              <span class="text-stone-400">Tags:</span>
              <span
                v-for="tag in pageTags"
                :key="tag"
                class="px-2 py-0.5 rounded-full bg-black/5 text-stone-600 text-[10px]"
              >
                #{{ tag }}
              </span>
              <button
                type="button"
                class="text-stone-400 hover:text-stone-700 cursor-pointer text-xs"
                title="Add Tag"
                @click="promptAddTag"
              >
                +
              </button>
            </div>

            <!-- Page Number Badge -->
            <div class="font-serif-book font-bold text-stone-700 tracking-wider">
              — Page {{ currentPageIndex + 1 }} —
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom Page Navigation Desk Bar -->
    <footer class="relative z-20 max-w-3xl mx-auto w-full flex items-center justify-between pt-4 select-none">
      <!-- Previous Page -->
      <button
        class="px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 border border-stone-700 text-stone-300 hover:text-amber-200 text-xs font-serif-book tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow"
        :disabled="currentPageIndex <= 0"
        :class="{ 'opacity-40 cursor-not-allowed': currentPageIndex <= 0 }"
        @click="goToPreviousPage"
      >
        <span>‹</span> <span>Previous Page</span>
      </button>

      <!-- Center Page Counter & Jumper -->
      <div class="flex items-center gap-3 bg-black/60 px-5 py-1.5 rounded-full border border-stone-700 shadow-md">
        <span class="text-xs font-serif-book tracking-widest text-amber-200 font-bold">
          Page {{ currentPageIndex + 1 }} of {{ totalPages }}
        </span>

        <button
          v-if="totalPages > 1"
          type="button"
          class="text-stone-400 hover:text-rose-400 text-xs transition"
          title="Delete this page"
          @click="handleDeleteCurrentPage"
        >
          🗑
        </button>
      </div>

      <!-- Next / Add Page Actions -->
      <div class="flex items-center gap-2">
        <button
          v-if="currentPageIndex < totalPages - 1"
          class="px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 border border-stone-700 text-stone-300 hover:text-amber-200 text-xs font-serif-book tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow"
          @click="goToNextPage"
        >
          <span>Next Page</span> <span>›</span>
        </button>

        <button
          class="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-amber-100 text-xs font-serif-book font-bold tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-lg"
          title="Append a new page to this journal"
          @click="handleAddNewPage"
        >
          <span>+</span> <span>New Page</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import type { PaperStyle, Mood } from '@/types/journal'
import PaperEditor from './PaperEditor.vue'

const store = useLibraryStore()

const book = computed(() => store.activeOpenedBook)
const currentPage = computed(() => store.currentPage)
const currentPageIndex = computed(() => store.currentPageIndex)
const totalPages = computed(() => store.activePages.length)

const isFocusMode = ref(false)
const pageTitle = ref('Untitled Page')
const pageContent = ref('')
const pageWordCount = ref(0)
const activePaperStyle = ref<PaperStyle>('lined')
const activeMood = ref<Mood | undefined>(undefined)
const pageTags = ref<string[]>([])

const moods: { id: Mood; emoji: string; label: string }[] = [
  { id: 'great', emoji: '🌟', label: 'Great' },
  { id: 'good', emoji: '😊', label: 'Good' },
  { id: 'neutral', emoji: '☕', label: 'Reflective / Neutral' },
  { id: 'low', emoji: '🌧️', label: 'Low' },
  { id: 'stormy', emoji: '⚡', label: 'Stormy / Intense' },
]

const formattedDate = computed(() => {
  if (!currentPage.value?.entryDate) return 'Today'
  const d = new Date(currentPage.value.entryDate)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})

// Sync local page inputs when switching pages
watch(
  () => store.currentPage,
  (page) => {
    if (page) {
      pageTitle.value = page.title || `Page ${page.pageNumber}`
      pageContent.value = typeof page.content === 'string' ? page.content : ''
      pageWordCount.value = page.wordCount || 0
      activePaperStyle.value = page.paperStyle || 'lined'
      activeMood.value = page.mood
      pageTags.value = page.tags || []
    }
  },
  { immediate: true }
)

// Debounced Autosave Timer
let autosaveTimeout: NodeJS.Timeout | null = null

function handleContentChange(html: string, words: number) {
  pageContent.value = html
  pageWordCount.value = words

  if (autosaveTimeout) clearTimeout(autosaveTimeout)
  autosaveTimeout = setTimeout(async () => {
    if (currentPage.value) {
      await store.updatePage(currentPage.value.id, {
        content: html,
        wordCount: words,
      })
    }
  }, 400)
}

async function savePageHeader() {
  if (currentPage.value) {
    await store.updatePage(currentPage.value.id, {
      title: pageTitle.value.trim() || `Page ${currentPage.value.pageNumber}`,
    })
  }
}

async function savePaperStyle() {
  if (currentPage.value) {
    await store.updatePage(currentPage.value.id, {
      paperStyle: activePaperStyle.value,
    })
  }
}

async function setMood(m: Mood) {
  activeMood.value = activeMood.value === m ? undefined : m
  if (currentPage.value) {
    await store.updatePage(currentPage.value.id, {
      mood: activeMood.value,
    })
  }
}

function promptAddTag() {
  const tag = prompt('Enter a tag (e.g. goals, reflection):')
  if (tag && tag.trim()) {
    const cleanTag = tag.trim().replace(/^#/, '').toLowerCase()
    if (!pageTags.value.includes(cleanTag)) {
      pageTags.value.push(cleanTag)
      if (currentPage.value) {
        store.updatePage(currentPage.value.id, {
          tags: [...pageTags.value],
        })
      }
    }
  }
}

function goToPreviousPage() {
  if (currentPageIndex.value > 0) {
    store.setPageIndex(currentPageIndex.value - 1)
  }
}

function goToNextPage() {
  if (currentPageIndex.value < totalPages.value - 1) {
    store.setPageIndex(currentPageIndex.value + 1)
  }
}

async function handleAddNewPage() {
  await store.createPage(activePaperStyle.value)
}

async function handleDeleteCurrentPage() {
  if (currentPage.value && confirm(`Delete Page ${currentPageIndex.value + 1}?`)) {
    await store.deletePage(currentPage.value.id)
  }
}

function handleReturnToShelf() {
  store.closeBook()
}
</script>
