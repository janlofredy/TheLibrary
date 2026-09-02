<template>
  <div class="relative w-full mb-8 sm:mb-12 flex flex-col group/shelf">
    <!-- Shelf Top Ambient Occlusion Cavity -->
    <div class="relative min-h-[300px] w-full flex items-end px-6 sm:px-12 pt-8 pb-1.5 overflow-x-auto overflow-y-hidden">
      <!-- Back Wall Ambient Shadow -->
      <div class="absolute inset-0 shelf-depth-shadow pointer-events-none -z-10"></div>
      
      <!-- Free Placement Spatial Zones across the Wooden Shelf (Left, Center, Right) -->
      <div class="flex items-end justify-between w-full min-w-[700px] pb-0.5 z-10">
        <!-- 1. LEFT ZONE (Slots 0 to 3) -->
        <div
          class="flex items-end gap-1 sm:gap-1.5 min-h-[265px] min-w-[120px] transition-all duration-200 rounded-t p-1"
          :class="dragOverZone === 'left' ? 'bg-amber-400/20 border-2 border-dashed border-amber-400/80 rounded-t' : ''"
          @dragover.prevent="handleDragOverZone($event, 'left', 0)"
          @dragleave="handleDragLeaveZone($event, 'left')"
          @drop.prevent="handleDropZone($event, 'left', 0)"
        >
          <template v-if="leftZoneBooks.length > 0">
            <div
              v-for="(book, idx) in leftZoneBooks"
              :key="book.id"
              class="relative flex items-end"
              @dragover.prevent.stop="handleDragOverZone($event, 'left', idx)"
              @drop.prevent.stop="handleDropZone($event, 'left', idx)"
            >
              <BookSpine
                :book="book"
                :left-neighbor="idx > 0 ? leftZoneBooks[idx - 1] : null"
                :right-neighbor="idx < leftZoneBooks.length - 1 ? leftZoneBooks[idx + 1] : null"
                @select="handleSelectBook"
                @edit="handleEditBook"
              />
            </div>
          </template>

          <!-- Empty Left Zone Drop Target -->
          <button
            v-else
            type="button"
            class="h-44 w-24 border border-dashed border-stone-800/30 hover:border-amber-400/60 hover:bg-amber-400/10 rounded-t flex flex-col items-center justify-center text-stone-600 hover:text-amber-300 opacity-40 hover:opacity-100 transition-all cursor-pointer"
            title="Place books on Left shelf area"
            @click="handleAddBookInZone(0)"
          >
            <span class="text-base font-light">+</span>
            <span class="text-[9px] font-mono text-stone-400 mt-1">Left Shelf</span>
          </button>
        </div>

        <!-- 2. CENTER ZONE (Slots 4 to 7) -->
        <div
          class="flex items-end gap-1 sm:gap-1.5 min-h-[265px] min-w-[120px] transition-all duration-200 rounded-t p-1"
          :class="dragOverZone === 'center' ? 'bg-amber-400/20 border-2 border-dashed border-amber-400/80 rounded-t' : ''"
          @dragover.prevent="handleDragOverZone($event, 'center', 5)"
          @dragleave="handleDragLeaveZone($event, 'center')"
          @drop.prevent="handleDropZone($event, 'center', 5)"
        >
          <template v-if="centerZoneBooks.length > 0">
            <div
              v-for="(book, idx) in centerZoneBooks"
              :key="book.id"
              class="relative flex items-end"
              @dragover.prevent.stop="handleDragOverZone($event, 'center', idx + 4)"
              @drop.prevent.stop="handleDropZone($event, 'center', idx + 4)"
            >
              <BookSpine
                :book="book"
                :left-neighbor="idx > 0 ? centerZoneBooks[idx - 1] : null"
                :right-neighbor="idx < centerZoneBooks.length - 1 ? centerZoneBooks[idx + 1] : null"
                @select="handleSelectBook"
                @edit="handleEditBook"
              />
            </div>
          </template>

          <!-- Empty Center Zone Drop Target -->
          <button
            v-else
            type="button"
            class="h-44 w-24 border border-dashed border-stone-800/30 hover:border-amber-400/60 hover:bg-amber-400/10 rounded-t flex flex-col items-center justify-center text-stone-600 hover:text-amber-300 opacity-20 hover:opacity-100 transition-all cursor-pointer"
            title="Place books in Center shelf area"
            @click="handleAddBookInZone(5)"
          >
            <span class="text-base font-light">+</span>
            <span class="text-[9px] font-mono text-stone-400 mt-1">Center Shelf</span>
          </button>
        </div>

        <!-- 3. RIGHT ZONE (Slots 8 to 11) -->
        <div
          class="flex items-end gap-1 sm:gap-1.5 min-h-[265px] min-w-[120px] transition-all duration-200 rounded-t p-1"
          :class="dragOverZone === 'right' ? 'bg-amber-400/20 border-2 border-dashed border-amber-400/80 rounded-t' : ''"
          @dragover.prevent="handleDragOverZone($event, 'right', 10)"
          @dragleave="handleDragLeaveZone($event, 'right')"
          @drop.prevent="handleDropZone($event, 'right', 10)"
        >
          <template v-if="rightZoneBooks.length > 0">
            <div
              v-for="(book, idx) in rightZoneBooks"
              :key="book.id"
              class="relative flex items-end"
              @dragover.prevent.stop="handleDragOverZone($event, 'right', idx + 8)"
              @drop.prevent.stop="handleDropZone($event, 'right', idx + 8)"
            >
              <BookSpine
                :book="book"
                :left-neighbor="idx > 0 ? rightZoneBooks[idx - 1] : null"
                :right-neighbor="idx < rightZoneBooks.length - 1 ? rightZoneBooks[idx + 1] : null"
                @select="handleSelectBook"
                @edit="handleEditBook"
              />
            </div>
          </template>

          <!-- Empty Right Zone Drop Target -->
          <button
            v-else
            type="button"
            class="h-44 w-24 border border-dashed border-stone-800/30 hover:border-amber-400/60 hover:bg-amber-400/10 rounded-t flex flex-col items-center justify-center text-stone-600 hover:text-amber-300 opacity-20 hover:opacity-100 transition-all cursor-pointer"
            title="Place books on Right shelf area"
            @click="handleAddBookInZone(10)"
          >
            <span class="text-base font-light">+</span>
            <span class="text-[9px] font-mono text-stone-400 mt-1">Right Shelf</span>
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
const dragOverZone = ref<'left' | 'center' | 'right' | null>(null)

const books = computed(() => store.getBooksForShelf(props.shelf.id))

// Left Zone Books (Slots 0 to 3)
const leftZoneBooks = computed(() => {
  return books.value
    .filter(b => (b.slotIndex ?? 0) <= 3)
    .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))
})

// Center Zone Books (Slots 4 to 7)
const centerZoneBooks = computed(() => {
  return books.value
    .filter(b => (b.slotIndex ?? 0) >= 4 && (b.slotIndex ?? 0) <= 7)
    .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))
})

// Right Zone Books (Slots 8 to 11)
const rightZoneBooks = computed(() => {
  return books.value
    .filter(b => (b.slotIndex ?? 0) >= 8)
    .sort((a, b) => (a.slotIndex ?? 0) - (b.slotIndex ?? 0))
})

function handleDragOverZone(e: DragEvent, zone: 'left' | 'center' | 'right', _targetIdx: number) {
  e.dataTransfer!.dropEffect = 'move'
  dragOverZone.value = zone
}

function handleDragLeaveZone(_e: DragEvent, zone: 'left' | 'center' | 'right') {
  if (dragOverZone.value === zone) {
    dragOverZone.value = null
  }
}

async function handleDropZone(e: DragEvent, _zone: 'left' | 'center' | 'right', targetSlotIdx: number) {
  dragOverZone.value = null
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

function handleAddBookInZone(slotIdx: number) {
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
