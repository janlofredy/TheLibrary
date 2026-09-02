<template>
  <div class="relative w-full mb-8 sm:mb-12 flex flex-col group/shelf">
    <!-- Shelf Top Ambient Occlusion Cavity (Infinite Free Placement Wooden Canvas) -->
    <div
      ref="shelfTrack"
      class="relative min-h-[300px] w-full flex items-end px-6 sm:px-12 pt-8 pb-1.5 overflow-x-auto overflow-y-hidden select-none cursor-crosshair"
      @dragover.prevent="handleTrackDragOver"
      @dragleave="handleTrackDragLeave"
      @drop.prevent="handleTrackDrop"
      @click="handleShelfTrackClick"
    >
      <!-- Back Wall Ambient Shadow -->
      <div class="absolute inset-0 shelf-depth-shadow pointer-events-none -z-10"></div>

      <!-- Dragging Drop Indicator Marker -->
      <div
        v-if="dragIndicatorX !== null"
        class="absolute bottom-1 w-1 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.9)] z-40 pointer-events-none transition-all duration-75"
        :style="{ left: `${dragIndicatorX}px`, height: '220px' }"
      ></div>

      <!-- Continuous Shelf Floor Canvas (Dynamic infinite width based on book positions) -->
      <div
        class="relative min-h-[265px] flex items-end z-10 pb-0.5"
        :style="{ width: `${shelfContentWidth}px`, minWidth: '100%' }"
      >
        <!-- Books Rendered at their Free Coordinate Positions -->
        <div
          v-for="item in positionedBooks"
          :key="item.book.id"
          class="absolute bottom-0 flex items-end transition-transform duration-300"
          :style="{ left: `${item.x}px` }"
          @click.stop
        >
          <BookSpine
            :book="item.book"
            :left-neighbor="item.leftNeighbor"
            :right-neighbor="item.rightNeighbor"
            @select="handleSelectBook"
            @edit="handleEditBook"
          />
        </div>

        <!-- Add Book Button at trailing edge -->
        <div
          class="absolute bottom-0 flex items-end"
          :style="{ left: `${trailingButtonX}px` }"
          @click.stop
        >
          <button
            type="button"
            class="h-[210px] w-12 rounded-t-sm border border-dashed border-stone-600/30 hover:border-amber-400/80 hover:bg-amber-400/10 transition-all duration-200 flex flex-col items-center justify-center text-stone-500 hover:text-amber-300 group/add cursor-pointer flex-shrink-0"
            title="Add new Journal here"
            @click="handleAddBookAt(trailingButtonX)"
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
import { calculateSpineWidth } from '@/utils/bookSizing'
import BookSpine from './BookSpine.vue'

const props = defineProps<{
  shelf: Shelf
}>()

const store = useLibraryStore()
const shelfTrack = ref<HTMLElement | null>(null)
const dragIndicatorX = ref<number | null>(null)

const books = computed(() => store.getBooksForShelf(props.shelf.id))

interface PositionedBook {
  book: Book
  x: number
  width: number
  leftNeighbor: Book | null
  rightNeighbor: Book | null
}

const positionedBooks = computed<PositionedBook[]>(() => {
  if (books.value.length === 0) return []

  // Assign computed x coordinates based on positionX or ordered spine widths
  const sorted = [...books.value].sort((a, b) => {
    if (a.positionX !== undefined && b.positionX !== undefined) {
      return a.positionX - b.positionX
    }
    return (a.slotIndex ?? 0) - (b.slotIndex ?? 0)
  })

  // Calculate coordinates
  let currentFlowX = 24
  const calculatedItems: { book: Book; x: number; width: number }[] = []

  for (const book of sorted) {
    const isFlat = book.layerMode === 'horizontal-stack'
    const spineW = calculateSpineWidth(book.pageCount || 0)
    const bookWidth = isFlat ? 190 : spineW

    let x = book.positionX
    if (x === undefined || x < 0) {
      x = currentFlowX
    }

    calculatedItems.push({
      book,
      x,
      width: bookWidth,
    })

    currentFlowX = Math.max(currentFlowX, x + bookWidth + 4)
  }

  // Determine neighbors based on physical proximity (within 55px contact range)
  const result: PositionedBook[] = []
  for (let i = 0; i < calculatedItems.length; i++) {
    const current = calculatedItems[i]
    let leftNeighbor: Book | null = null
    let rightNeighbor: Book | null = null

    // Check left neighbor
    if (i > 0) {
      const prev = calculatedItems[i - 1]
      const distance = current.x - (prev.x + prev.width)
      if (distance <= 55) {
        leftNeighbor = prev.book
      }
    }

    // Check right neighbor
    if (i < calculatedItems.length - 1) {
      const next = calculatedItems[i + 1]
      const distance = next.x - (current.x + current.width)
      if (distance <= 55) {
        rightNeighbor = next.book
      }
    }

    result.push({
      book: current.book,
      x: current.x,
      width: current.width,
      leftNeighbor,
      rightNeighbor,
    })
  }

  return result
})

const trailingButtonX = computed(() => {
  if (positionedBooks.value.length === 0) return 24
  const maxRight = Math.max(...positionedBooks.value.map(p => p.x + p.width))
  return maxRight + 16
})

const shelfContentWidth = computed(() => {
  return trailingButtonX.value + 120
})

function handleTrackDragOver(e: DragEvent) {
  if (!shelfTrack.value) return
  e.dataTransfer!.dropEffect = 'move'
  const rect = shelfTrack.value.getBoundingClientRect()
  const scrollLeft = shelfTrack.value.scrollLeft
  dragIndicatorX.value = Math.max(0, e.clientX - rect.left + scrollLeft)
}

function handleTrackDragLeave() {
  dragIndicatorX.value = null
}

async function handleTrackDrop(e: DragEvent) {
  dragIndicatorX.value = null
  if (!shelfTrack.value || !e.dataTransfer) return

  const bookId = e.dataTransfer.getData('text/plain')
  if (bookId) {
    const rect = shelfTrack.value.getBoundingClientRect()
    const scrollLeft = shelfTrack.value.scrollLeft
    const dropX = Math.max(0, Math.round(e.clientX - rect.left + scrollLeft - 18))
    await store.moveBookToPosition(bookId, props.shelf.id, dropX)
  }
}

function handleShelfTrackClick(e: MouseEvent) {
  if (!shelfTrack.value) return
  const rect = shelfTrack.value.getBoundingClientRect()
  const scrollLeft = shelfTrack.value.scrollLeft
  const clickX = Math.max(0, Math.round(e.clientX - rect.left + scrollLeft - 18))
  handleAddBookAt(clickX)
}

function handleSelectBook(book: Book) {
  store.openBook(book.id)
}

function handleEditBook(book: Book) {
  store.openBookCustomizer(book)
}

function handleAddBookAt(positionX: number) {
  store.targetShelfIdForNewBook = props.shelf.id
  store.editingBook = null
  store.isBookCustomizerOpen = true
  sessionStorage.setItem('target_new_book_positionX', String(positionX))
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
