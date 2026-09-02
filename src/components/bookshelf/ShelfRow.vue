<template>
  <div class="relative w-full mb-8 sm:mb-12 flex flex-col group/shelf">
    <!-- Shelf Top Ambient Occlusion Cavity (Spatial Shelf Track) -->
    <div class="relative min-h-[300px] w-full flex items-end px-4 sm:px-8 pt-8 pb-1.5 overflow-x-auto overflow-y-hidden">
      <!-- Back Wall Ambient Shadow -->
      <div class="absolute inset-0 shelf-depth-shadow pointer-events-none -z-10"></div>
      
      <!-- 12-Slot Spatial Shelf Track (Allows placing books on Left, Center, Right, or anywhere) -->
      <div class="flex items-end gap-1.5 sm:gap-2 z-10 w-full min-w-[720px] pb-0.5 justify-between">
        <div
          v-for="slotIdx in totalSlots"
          :key="slotIdx - 1"
          class="relative flex-1 flex items-end justify-center min-h-[265px] transition-all duration-200 rounded-t"
          :class="dragOverSlot === (slotIdx - 1) ? 'bg-amber-400/20 border-2 border-dashed border-amber-400 scale-[1.02] z-30' : ''"
          @dragover.prevent="handleDragOver($event, slotIdx - 1)"
          @dragleave="handleDragLeave($event, slotIdx - 1)"
          @drop.prevent="handleDrop($event, slotIdx - 1)"
        >
          <!-- Book Spine at this specific spatial slot -->
          <BookSpine
            v-if="getBookAtSlot(slotIdx - 1)"
            :book="getBookAtSlot(slotIdx - 1)!"
            :left-neighbor="getNeighbor(slotIdx - 1, -1)"
            :right-neighbor="getNeighbor(slotIdx - 1, 1)"
            @select="handleSelectBook"
            @edit="handleEditBook"
          />

          <!-- Empty Slot Placeholder / Drop Target / Quick Add -->
          <button
            v-else
            type="button"
            class="h-44 w-full border border-dashed border-stone-800/30 hover:border-amber-400/60 hover:bg-amber-400/10 rounded-t flex flex-col items-center justify-center text-stone-600 hover:text-amber-300 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group/empty"
            :title="`Slot ${slotIdx} (${getSlotLabel(slotIdx - 1)}): Click to add a book or drop a journal here`"
            @click="handleAddBookAtSlot(slotIdx - 1)"
          >
            <span class="text-base font-light group-hover/empty:scale-125 transition-transform">+</span>
            <span class="text-[8px] font-mono text-stone-400 mt-0.5">{{ getSlotLabel(slotIdx - 1) }}</span>
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
const totalSlots = 12
const dragOverSlot = ref<number | null>(null)

const books = computed(() => store.getBooksForShelf(props.shelf.id))

function getBookAtSlot(slotIdx: number): Book | undefined {
  return books.value.find(b => (b.slotIndex ?? 0) === slotIdx)
}

function getNeighbor(slotIdx: number, direction: -1 | 1): Book | null {
  // Look for immediate adjacent neighbor first, or next occupied neighbor
  const targetSlot = slotIdx + direction
  const directNeighbor = getBookAtSlot(targetSlot)
  if (directNeighbor) return directNeighbor

  // Look for next closest neighbor within 2 slots
  const secondarySlot = slotIdx + direction * 2
  return getBookAtSlot(secondarySlot) || null
}

function getSlotLabel(slotIdx: number): string {
  if (slotIdx <= 2) return `Left ${slotIdx + 1}`
  if (slotIdx <= 7) return `Mid ${slotIdx + 1}`
  return `Right ${slotIdx + 1}`
}

function handleDragOver(e: DragEvent, slotIdx: number) {
  e.dataTransfer!.dropEffect = 'move'
  dragOverSlot.value = slotIdx
}

function handleDragLeave(_e: DragEvent, slotIdx: number) {
  if (dragOverSlot.value === slotIdx) {
    dragOverSlot.value = null
  }
}

async function handleDrop(e: DragEvent, targetSlotIdx: number) {
  dragOverSlot.value = null
  if (!e.dataTransfer) return

  const bookId = e.dataTransfer.getData('text/plain')
  if (bookId) {
    await store.moveBookToSlot(bookId, props.shelf.id, targetSlotIdx)
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
