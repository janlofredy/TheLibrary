<template>
  <div class="relative w-full mb-8 sm:mb-12 flex flex-col group/shelf">
    <!-- Shelf Top Ambient Occlusion Cavity (Snug & Realistic Bookshelf Layout) -->
    <div class="relative min-h-[300px] w-full flex items-end px-6 sm:px-12 pt-8 pb-1.5 overflow-x-auto overflow-y-hidden">
      <!-- Back Wall Ambient Shadow -->
      <div class="absolute inset-0 shelf-depth-shadow pointer-events-none -z-10"></div>
      
      <!-- Bookshelf Floor Row (Snug Tight-Packed Spines with Natural Spacing) -->
      <div class="flex items-end gap-1 sm:gap-1.5 z-10 min-w-full pb-0.5">
        <!-- Render shelf items (Books + Natural Gap Spacers) -->
        <template v-for="(item, idx) in shelfDisplayItems" :key="item.type === 'book' ? item.book.id : `spacer-${idx}`">
          <!-- Book Spine -->
          <div
            v-if="item.type === 'book'"
            class="relative flex items-end"
            @dragover.prevent="handleDragOver(item.slotIndex)"
            @dragleave="handleDragLeave(item.slotIndex)"
            @drop="handleDrop(item.slotIndex)"
          >
            <BookSpine
              :book="item.book"
              @select="handleSelectBook"
              @edit="handleEditBook"
            />
          </div>

          <!-- Natural Spacer Gap (When user left empty slots between books) -->
          <div
            v-else-if="item.type === 'spacer'"
            class="relative h-44 flex items-end justify-center transition-all duration-200 rounded-t"
            :style="{ width: `${item.width}px` }"
            :class="dragOverSlot === item.slotIndex ? 'bg-amber-400/20 border-2 border-dashed border-amber-400/80 scale-[1.02]' : ''"
            @dragover.prevent="handleDragOver(item.slotIndex)"
            @dragleave="handleDragLeave(item.slotIndex)"
            @drop="handleDrop(item.slotIndex)"
          >
            <button
              type="button"
              class="w-full h-full rounded-t-sm border border-dashed border-stone-700/20 hover:border-amber-400/60 hover:bg-amber-400/10 transition-all duration-200 flex flex-col items-center justify-center text-stone-600 hover:text-amber-300 opacity-0 hover:opacity-100 cursor-pointer"
              title="Click or drop a book in this space"
              @click="handleAddBookAtSlot(item.slotIndex)"
            >
              <span class="text-base font-light">+</span>
              <span class="text-[8px] font-mono text-stone-400 mt-0.5">Space</span>
            </button>
          </div>
        </template>

        <!-- Drop target at end of shelf books -->
        <div
          class="relative h-44 w-12 flex items-end justify-center transition-all duration-200 ml-1"
          :class="dragOverSlot === nextAvailableSlot ? 'bg-amber-400/20 border-2 border-dashed border-amber-400/80 scale-[1.02]' : ''"
          @dragover.prevent="handleDragOver(nextAvailableSlot)"
          @dragleave="handleDragLeave(nextAvailableSlot)"
          @drop="handleDrop(nextAvailableSlot)"
        >
          <!-- Add Book Bookend Button -->
          <button
            type="button"
            class="h-[210px] w-12 rounded-t-sm border border-dashed border-stone-600/30 hover:border-amber-400/80 hover:bg-amber-400/10 transition-all duration-200 flex flex-col items-center justify-center text-stone-500 hover:text-amber-300 group/add cursor-pointer flex-shrink-0"
            title="Add new Journal to this shelf"
            @click="handleAddBookAtSlot(nextAvailableSlot)"
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
const dragOverSlot = ref<number | null>(null)

const books = computed(() => store.getBooksForShelf(props.shelf.id))

type ShelfDisplayItem = 
  | { type: 'book'; book: Book; slotIndex: number }
  | { type: 'spacer'; width: number; slotIndex: number }

const shelfDisplayItems = computed<ShelfDisplayItem[]>(() => {
  const items: ShelfDisplayItem[] = []
  if (books.value.length === 0) return items

  // Sort books by slotIndex
  const sorted = [...books.value].sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))

  let lastSlot = -1

  for (const book of sorted) {
    const currentSlot = book.slotIndex ?? (lastSlot + 1)
    
    // If there is an intentional gap between slots (e.g. slot 0 and slot 3)
    if (lastSlot !== -1 && currentSlot > lastSlot + 1) {
      const gapSlots = currentSlot - (lastSlot + 1)
      items.push({
        type: 'spacer',
        width: Math.min(gapSlots * 24, 72), // subtle realistic space
        slotIndex: lastSlot + 1,
      })
    }

    items.push({
      type: 'book',
      book,
      slotIndex: currentSlot,
    })

    lastSlot = currentSlot
  }

  return items
})

const nextAvailableSlot = computed(() => {
  if (books.value.length === 0) return 0
  const maxSlot = Math.max(...books.value.map(b => b.slotIndex ?? 0))
  return maxSlot + 1
})

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
