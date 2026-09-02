<template>
  <div class="relative w-full mb-8 sm:mb-12 flex flex-col group/shelf">
    <!-- Shelf Top Ambient Occlusion Cavity (Continuous Wooden Shelf Canvas) -->
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

      <!-- Live Ghost Drag Preview (Full-Width Ghost Book Silhouette with Glowing Box) -->
      <div
        v-if="dragIndicatorX !== null && store.activeDraggingBook"
        class="absolute bottom-0 z-40 pointer-events-none transition-all duration-75 scale-[1.02]"
        :style="{ left: `${dragIndicatorX}px` }"
      >
        <!-- Full-Width Glowing Target Box Preview -->
        <div
          class="relative rounded border-2 border-dashed border-amber-300 bg-amber-400/25 shadow-[0_0_16px_rgba(251,191,36,0.6)] backdrop-blur-[1px] flex flex-col items-center justify-between p-2"
          :style="{ width: `${dragGhostDimensions.width}px`, height: `${dragGhostDimensions.height}px` }"
        >
          <!-- Top Ornament -->
          <div class="text-[9px] font-mono uppercase text-amber-200 tracking-wider font-bold">
            Drop
          </div>

          <!-- Vertical / Horizontal Title -->
          <div class="flex-1 flex items-center justify-center overflow-hidden my-1">
            <span
              class="font-serif-book font-bold text-[11px] text-amber-100 uppercase tracking-widest leading-none truncate"
              :class="dragGhostDimensions.width < 60 ? 'rotate-90' : ''"
            >
              {{ store.activeDraggingBook.title }}
            </span>
          </div>

          <!-- Bottom Dimensions Badge -->
          <div class="text-[8px] font-mono text-amber-300/80">
            {{ dragGhostDimensions.width }}px
          </div>
        </div>
      </div>

      <!-- Continuous Shelf Floor Canvas -->
      <div
        class="relative min-h-[265px] flex items-end z-10 pb-0.5"
        :style="{ width: `${shelfContentWidth}px`, minWidth: '100%' }"
      >
        <!-- Books Rendered at their Computed Coordinate Positions -->
        <div
          v-for="item in positionedBooks"
          :key="item.book.id"
          class="absolute bottom-0 flex items-end transition-all duration-300"
          :class="store.activeDraggingBook?.id === item.book.id ? 'opacity-25 scale-95' : ''"
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
import { calculateSpineWidth, calculateBookHeight, type NeighborInfo } from '@/utils/bookSizing'
import BookSpine from './BookSpine.vue'

const props = defineProps<{
  shelf: Shelf
}>()

const store = useLibraryStore()
const shelfTrack = ref<HTMLElement | null>(null)
const dragIndicatorX = ref<number | null>(null)

const books = computed(() => store.getBooksForShelf(props.shelf.id))

const dragGhostDimensions = computed(() => {
  if (!store.activeDraggingBook) return { width: 34, height: 220 }
  const isFlat = store.activeDraggingBook.layerMode === 'horizontal-stack'
  const spineW = calculateSpineWidth(store.activeDraggingBook.pageCount || 0)
  const bookH = calculateBookHeight(store.activeDraggingBook.id)
  const flatLength = Math.min(210, Math.max(170, Math.round(bookH * 0.82)))

  if (isFlat) {
    return { width: flatLength, height: spineW }
  }
  return { width: spineW, height: bookH }
})

interface PositionedBook {
  book: Book
  x: number
  width: number
  isFlat: boolean
  leftNeighbor: NeighborInfo | null
  rightNeighbor: NeighborInfo | null
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

  // Calculate base coordinates and dimensions respecting full book footprints
  let currentFlowX = 24
  const calculatedItems: { book: Book; x: number; width: number; height: number; isFlat: boolean }[] = []

  for (const book of sorted) {
    const isExplicitFlat = book.layerMode === 'horizontal-stack'
    const spineW = calculateSpineWidth(book.pageCount || 0)
    const bookH = calculateBookHeight(book.id)
    const flatLength = Math.min(210, Math.max(170, Math.round(bookH * 0.82)))
    const bookWidth = isExplicitFlat ? flatLength : spineW
    const bookHeight = isExplicitFlat ? spineW : bookH

    let x = book.positionX
    if (x === undefined || x < 0) {
      x = currentFlowX
    }

    calculatedItems.push({
      book,
      x,
      width: bookWidth,
      height: bookHeight,
      isFlat: isExplicitFlat,
    })

    // Advance floor flow coordinate with snug 6px separation
    currentFlowX = Math.max(currentFlowX, x + bookWidth + 6)
  }

  // Determine physical neighbor contact information
  const result: PositionedBook[] = []
  for (let i = 0; i < calculatedItems.length; i++) {
    const current = calculatedItems[i]
    let leftNeighbor: NeighborInfo | null = null
    let rightNeighbor: NeighborInfo | null = null

    // Check left neighbor
    if (i > 0) {
      const prev = calculatedItems[i - 1]
      const distance = Math.max(0, current.x - (prev.x + prev.width))
      leftNeighbor = {
        book: prev.book,
        distance,
        isFlat: prev.isFlat,
        height: prev.height,
        width: prev.width,
      }
    }

    // Check right neighbor
    if (i < calculatedItems.length - 1) {
      const next = calculatedItems[i + 1]
      const distance = Math.max(0, next.x - (current.x + current.width))
      rightNeighbor = {
        book: next.book,
        distance,
        isFlat: next.isFlat,
        height: next.height,
        width: next.width,
      }
    }

    result.push({
      book: current.book,
      x: current.x,
      width: current.width,
      isFlat: current.isFlat,
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
  const rawX = Math.max(0, e.clientX - rect.left + scrollLeft - Math.round(dragGhostDimensions.value.width / 2))
  
  const ghostW = dragGhostDimensions.value.width

  // Magnetic Snapping: when within 18px of an adjacent book, snap cleanly with 2px gap
  let targetX = rawX
  for (const item of positionedBooks.value) {
    if (store.activeDraggingBook && item.book.id === store.activeDraggingBook.id) continue

    // Snap to right side of item
    if (Math.abs(rawX - (item.x + item.width)) < 18) {
      targetX = item.x + item.width + 2
      break
    }
    // Snap to left side of item
    if (Math.abs(rawX - (item.x - ghostW)) < 18) {
      targetX = Math.max(0, item.x - ghostW - 2)
      break
    }
  }

  dragIndicatorX.value = targetX
}

function handleTrackDragLeave() {
  dragIndicatorX.value = null
}

async function handleTrackDrop(e: DragEvent) {
  const targetX = dragIndicatorX.value
  dragIndicatorX.value = null
  const activeBook = store.activeDraggingBook
  store.activeDraggingBook = null

  if (!shelfTrack.value || !e.dataTransfer) return

  const bookId = e.dataTransfer.getData('text/plain') || activeBook?.id
  if (bookId && targetX !== null) {
    await store.moveBookToPosition(bookId, props.shelf.id, targetX)
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
