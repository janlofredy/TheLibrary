<template>
  <div class="relative w-full mb-8 sm:mb-12 flex flex-col group/shelf">
    <!-- Shelf Top Ambient Occlusion Cavity (Pure Snug Wooden Bookshelf) -->
    <div class="relative min-h-[300px] w-full flex items-end px-6 sm:px-12 pt-8 pb-1.5 overflow-x-auto overflow-y-hidden">
      <!-- Back Wall Ambient Shadow -->
      <div class="absolute inset-0 shelf-depth-shadow pointer-events-none -z-10"></div>
      
      <!-- Bookshelf Floor Row (Snug Tight-Packed Spines, Free Leaning, Easy Drag Reordering) -->
      <div class="flex items-end gap-1 sm:gap-1.5 z-10 min-w-full pb-0.5">
        <!-- Render books with direct drag reordering -->
        <template v-for="(book, idx) in sortedBooks" :key="book.id">
          <div
            class="relative flex items-end transition-transform duration-200"
            :class="dragOverIndex === idx ? 'scale-[1.03] -translate-y-1' : ''"
            @dragover.prevent="handleDragOver($event, idx)"
            @dragleave="handleDragLeave($event, idx)"
            @drop.prevent="handleDrop($event, idx)"
          >
            <!-- Drop Indicator Bar -->
            <div
              v-if="dragOverIndex === idx"
              class="absolute -left-1 inset-y-0 w-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)] z-40 animate-pulse pointer-events-none"
            ></div>

            <BookSpine
              :book="book"
              :left-neighbor="idx > 0 ? sortedBooks[idx - 1] : null"
              :right-neighbor="idx < sortedBooks.length - 1 ? sortedBooks[idx + 1] : null"
              @select="handleSelectBook"
              @edit="handleEditBook"
            />
          </div>
        </template>

        <!-- Drop target at end of shelf books -->
        <div
          class="relative h-44 w-12 flex items-end justify-center transition-all duration-200 ml-1"
          :class="dragOverIndex === sortedBooks.length ? 'bg-amber-400/20 border-2 border-dashed border-amber-400/80 scale-[1.02]' : ''"
          @dragover.prevent="handleDragOver($event, sortedBooks.length)"
          @dragleave="handleDragLeave($event, sortedBooks.length)"
          @drop.prevent="handleDrop($event, sortedBooks.length)"
        >
          <!-- Add Book Button -->
          <button
            type="button"
            class="h-[210px] w-12 rounded-t-sm border border-dashed border-stone-600/30 hover:border-amber-400/80 hover:bg-amber-400/10 transition-all duration-200 flex flex-col items-center justify-center text-stone-500 hover:text-amber-300 group/add cursor-pointer flex-shrink-0"
            title="Add new Journal to this shelf"
            @click="handleAddBook"
          >
            <span class="text-xl font-light group-hover/add:scale-125 transition-transform">+</span>
            <span class="text-[9px] uppercase tracking-wider font-mono mt-1 opacity-0 group-hover/add:opacity-100 transition-opacity">New</span>
          </button>
        </div>
      </div>

      <!-- Floor Depth Shadow -->
      <div class="absolute bottom-0 inset-x-0 h-6 shelf-base-shadow pointer-events-none z-10"></div>
    </div>

    <!-- Solid Wooden Shelf Plank (The Physical Shelf) -->
    <div class="relative h-7 w-full shelf-plank z-30 flex items-center justify-between px-4 sm:px-8">
      <!-- Left Shelf Bracket Details -->
      <div class="w-4 h-2 bg-black/40 rounded-sm"></div>

      <!-- Center Metallic Nameplate -->
      <div
        class="relative px-5 py-0.5 rounded-sm flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-md"
        :class="`plate-${shelf.nameplateStyle}`"
        @click="handleEditShelf"
      >
        <!-- Screws on Nameplate -->
        <div class="w-1.5 h-1.5 rounded-full bg-black/40 shadow-inner flex items-center justify-center">
          <div class="w-1 h-0.5 bg-black/30"></div>
        </div>

        <!-- Engraved Shelf Name -->
        <span class="text-[11px] sm:text-xs font-serif-book font-bold tracking-widest uppercase truncate max-w-[200px] sm:max-w-[320px]">
          {{ shelf.name }}
        </span>

        <!-- Right Screw -->
        <div class="w-1.5 h-1.5 rounded-full bg-black/40 shadow-inner flex items-center justify-center">
          <div class="w-1 h-0.5 bg-black/30"></div>
        </div>
      </div>

      <!-- Right Shelf Actions Menu Trigger -->
      <div class="flex items-center gap-1.5 opacity-40 group-hover/shelf:opacity-100 transition-opacity">
        <button
          class="p-1 rounded text-stone-400 hover:text-amber-200 hover:bg-black/30 text-xs transition cursor-pointer"
          title="Share Shelf"
          @click="store.openShareModal('shelf', shelf.id)"
        >
          ✨
        </button>
        <button
          class="p-1 rounded text-stone-400 hover:text-amber-200 hover:bg-black/30 text-xs transition cursor-pointer"
          title="Edit Shelf"
          @click="handleEditShelf"
        >
          ✎
        </button>
        <button
          class="p-1 rounded text-stone-400 hover:text-rose-400 hover:bg-black/30 text-xs transition cursor-pointer"
          title="Delete Shelf"
          @click="handleDeleteShelf"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Shelf, Book } from '@/types/journal'
import { useLibraryStore } from '@/stores/libraryStore'
import BookSpine from './BookSpine.vue'

const props = defineProps<{
  shelf: Shelf
}>()

const store = useLibraryStore()
const dragOverIndex = ref<number | null>(null)

const books = computed(() => store.getBooksForShelf(props.shelf.id))

const sortedBooks = computed(() => {
  return [...books.value].sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))
})

function handleDragOver(e: DragEvent, idx: number) {
  e.dataTransfer!.dropEffect = 'move'
  dragOverIndex.value = idx
}

function handleDragLeave(_e: DragEvent, idx: number) {
  if (dragOverIndex.value === idx) {
    dragOverIndex.value = null
  }
}

async function handleDrop(e: DragEvent, targetIdx: number) {
  dragOverIndex.value = null
  if (!e.dataTransfer) return

  const bookId = e.dataTransfer.getData('text/plain')
  if (bookId) {
    await store.moveBookToSlot(bookId, props.shelf.id, targetIdx)
  }
}

function handleSelectBook(book: Book) {
  store.openBook(book.id)
}

function handleEditBook(book: Book) {
  store.openBookCustomizer(book)
}

function handleAddBook() {
  store.targetShelfIdForNewBook = props.shelf.id
  store.editingBook = null
  store.isBookCustomizerOpen = true
}

function handleEditShelf() {
  store.openShelfModal(props.shelf)
}

function handleDeleteShelf() {
  if (confirm(`Are you sure you want to remove the shelf "${props.shelf.name}" and all its journals?`)) {
    store.deleteShelf(props.shelf.id)
  }
}
</script>
