<template>
  <div class="relative w-full mb-8 sm:mb-12 flex flex-col group/shelf">
    <!-- Shelf Top Ambient Occlusion Cavity (Spatial Slots Track) -->
    <div class="relative min-h-[300px] w-full flex items-end px-4 sm:px-8 pt-8 pb-1.5 overflow-x-auto overflow-y-hidden">
      <!-- Back Wall Ambient Shadow -->
      <div class="absolute inset-0 shelf-depth-shadow pointer-events-none -z-10"></div>
      
      <!-- Spatial Slot Track (12 Slots across shelf) -->
      <div class="flex items-end gap-2 sm:gap-3 z-10 min-w-full pb-0.5 justify-between">
        <div
          v-for="slotIndex in totalSlots"
          :key="slotIndex - 1"
          class="relative flex items-end justify-center min-w-[42px] sm:min-w-[54px] min-h-[265px] transition-all duration-200 rounded-t"
          :class="dragOverSlot === (slotIndex - 1) ? 'bg-amber-400/20 border-2 border-dashed border-amber-400/80 scale-[1.02]' : ''"
          @dragover.prevent="handleDragOver(slotIndex - 1)"
          @dragleave="handleDragLeave(slotIndex - 1)"
          @drop="handleDrop(slotIndex - 1)"
        >
          <!-- Book inside this slot if present -->
          <BookSpine
            v-if="getBookAtSlot(slotIndex - 1)"
            :book="getBookAtSlot(slotIndex - 1)!"
            @select="handleSelectBook"
            @edit="handleEditBook"
          />

          <!-- Empty Slot Placeholder / Click to place book -->
          <button
            v-else
            type="button"
            class="h-44 w-10 sm:w-12 rounded-t-sm border border-dashed border-stone-700/30 hover:border-amber-400/70 hover:bg-amber-400/10 transition-all duration-200 flex flex-col items-center justify-center text-stone-600 hover:text-amber-300 opacity-0 hover:opacity-100 group/slot cursor-pointer"
            :title="`Slot ${slotIndex}: Click to add or drop a book here`"
            @click="handleAddBookAtSlot(slotIndex - 1)"
          >
            <span class="text-lg font-light group-hover/slot:scale-125 transition-transform">+</span>
            <span class="text-[8px] font-mono uppercase tracking-tight text-stone-400 mt-0.5">Slot {{ slotIndex }}</span>
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

const totalSlots = 12 // 12 spatial spots along the shelf
const dragOverSlot = ref<number | null>(null)

const books = computed(() => store.getBooksForShelf(props.shelf.id))

function getBookAtSlot(slotIdx: number): Book | undefined {
  // First look for exact slot match
  const match = books.value.find(b => b.slotIndex === slotIdx)
  if (match) return match

  // Fallback for unindexed books
  const unassigned = books.value.filter(b => b.slotIndex === undefined || b.slotIndex < 0)
  return unassigned[slotIdx]
}

function handleDragOver(slotIdx: number) {
  dragOverSlot.value = slotIdx
}

function handleDragLeave(slotIdx: number) {
  if (dragOverSlot.value === slotIdx) {
    dragOverSlot.value = null
  }
}

async function handleDrop(slotIdx: number) {
  dragOverSlot.value = null
  const event = window.event as DragEvent
  if (!event || !event.dataTransfer) return

  const bookId = event.dataTransfer.getData('text/plain')
  if (bookId) {
    await store.moveBookToSlot(bookId, props.shelf.id, slotIdx)
  }
}

function handleSelectBook(book: Book) {
  store.openBook(book.id)
}

function handleEditBook(book: Book) {
  store.openBookCustomizer(book)
}

function handleAddBookAtSlot(slotIdx: number) {
  store.targetShelfIdForNewBook = props.shelf.id
  store.editingBook = null
  store.isBookCustomizerOpen = true
  // Store target slot in customizer
  sessionStorage.setItem('target_new_book_slot', String(slotIdx))
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
