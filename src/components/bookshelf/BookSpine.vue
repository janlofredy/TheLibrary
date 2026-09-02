<template>
  <div
    class="relative select-none cursor-grab active:cursor-grabbing group transition-all duration-300 ease-out flex-shrink-0"
    :class="isGhost ? 'opacity-70 pointer-events-none filter drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]' : ''"
    :style="containerWrapperStyle"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
    @contextmenu.prevent="handleRightClick"
  >
    <!-- 1. Horizontal Flat Book (Lying on Shelf Floor) -->
    <template v-if="sizing.isFlat">
      <div
        class="relative h-full w-full rounded-sm flex items-center justify-between px-3 py-1 overflow-hidden spine-3d-lighting transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.01] shadow-lg border-b border-black/60"
        :class="[finishClass, `font-${book.titleFont}-book`]"
        :style="spineStyle"
      >
        <!-- Top Paper Edge Stratification (Exposed top edge of flat book) -->
        <div
          class="absolute top-0 inset-x-0 h-1 bg-[#e8e2ce] border-b border-[#3b2a1a] opacity-90 shadow-inner"
          style="background-image: repeating-linear-gradient(90deg, #d6cdb2 0px, #d6cdb2 1px, #f5f0dc 1px, #f5f0dc 3px);"
        ></div>

        <!-- Left Spine Cap / Gold Foil Line -->
        <div 
          v-if="book.spineStyle === 'gold-foil' || book.spineStyle === 'ribbed-leather'"
          class="w-1 h-full opacity-70"
          :class="book.titleColor === 'gold' ? 'bg-amber-300' : 'bg-stone-300'"
        ></div>

        <!-- Horizontal Book Title -->
        <div class="flex-1 flex items-center justify-center px-2 overflow-hidden">
          <span
            class="font-semibold tracking-wider uppercase text-[11px] sm:text-[12px] truncate leading-none"
            :class="titleFoilClass"
            :title="book.title"
          >
            {{ book.title }}
          </span>
        </div>

        <!-- Right Side Badge & Ribbon -->
        <div class="flex items-center gap-1.5 z-10">
          <span v-if="book.pageCount > 0" class="text-[9px] font-mono opacity-70" :class="titleFoilClass">
            {{ book.pageCount }}p
          </span>
          <div
            v-if="book.hasRibbon"
            class="w-2 h-2 rounded-full"
            :style="{ backgroundColor: book.ribbonColor || '#d4af37' }"
          ></div>
        </div>
      </div>

      <!-- Base Shadow of Flat Book on Shelf Plank -->
      <div class="absolute -bottom-0.5 inset-x-2 h-2 bg-black/80 rounded-full blur-[2px] -z-10"></div>
    </template>

    <!-- 2. Standing & Leaning Vertical Book Spine -->
    <template v-else>
      <div
        class="relative h-full w-full rounded-t-sm flex flex-col justify-between items-center py-3 px-1 overflow-hidden spine-3d-lighting transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-[1.02]"
        :class="[finishClass, `font-${book.titleFont}-book`]"
        :style="spineStyle"
      >
        <!-- Top Paper Edge Stratification (for thick books) -->
        <div
          v-if="sizing.topEdgeDetail"
          class="absolute top-0 inset-x-0 h-1.5 bg-[#e8e2ce] border-b border-[#3b2a1a] shadow-inner opacity-90"
          style="background-image: repeating-linear-gradient(90deg, #d6cdb2 0px, #d6cdb2 1px, #f5f0dc 1px, #f5f0dc 3px);"
        ></div>

        <!-- Top Spine Ornament / Volume Number -->
        <div class="z-10 flex flex-col items-center">
          <div 
            v-if="book.spineStyle === 'gold-foil' || book.spineStyle === 'ribbed-leather'"
            class="w-3 h-0.5 mb-1 opacity-70"
            :class="book.titleColor === 'gold' ? 'bg-amber-300' : 'bg-stone-300'"
          ></div>
          <span 
            v-if="book.pageCount > 0" 
            class="text-[9px] tracking-widest opacity-60 uppercase font-mono"
            :class="titleFoilClass"
          >
            {{ book.pageCount }}p
          </span>
        </div>

        <!-- Vertical Book Title -->
        <div class="z-10 flex-1 flex items-center justify-center my-2 max-h-[85%] overflow-hidden">
          <span
            class="font-semibold tracking-wide text-center uppercase text-[11px] sm:text-[12px] leading-tight select-none line-clamp-2"
            :class="titleFoilClass"
            :style="titleWritingStyle"
            :title="book.title"
          >
            {{ book.title }}
          </span>
        </div>

        <!-- Bottom Subtitle / Monogram -->
        <div class="z-10 flex flex-col items-center">
          <div
            v-if="book.hasRibbon"
            class="w-1.5 h-1.5 rounded-full mb-0.5"
            :style="{ backgroundColor: book.ribbonColor || '#d4af37' }"
          ></div>
          <div 
            v-if="book.spineStyle === 'gold-foil' || book.spineStyle === 'ribbed-leather'"
            class="w-3 h-0.5 mt-1 opacity-70"
            :class="book.titleColor === 'gold' ? 'bg-amber-300' : 'bg-stone-300'"
          ></div>
        </div>

        <!-- Favorite Star Badge -->
        <div 
          v-if="book.isFavorite"
          class="absolute top-2 right-1 z-20 text-amber-300 drop-shadow-sm text-[10px]"
        >
          ★
        </div>
      </div>

      <!-- Hanging Bookmark Ribbon Tail -->
      <div
        v-if="book.hasRibbon"
        class="absolute left-1/2 -bottom-2 -translate-x-1/2 w-2.5 h-3 ribbon-tail shadow-md z-30 transition-transform duration-300 group-hover:translate-y-0.5"
        :style="{ backgroundColor: book.ribbonColor || '#d4af37' }"
      ></div>

      <!-- Book Base Shadow on Shelf Floor -->
      <div class="absolute -bottom-0.5 inset-x-1 h-1.5 bg-black/70 rounded-full blur-[1.5px] -z-10"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '@/types/journal'
import { getBookSizing, type NeighborInfo } from '@/utils/bookSizing'
import { useLibraryStore } from '@/stores/libraryStore'

export interface PhysicsOverride {
  width?: number
  height?: number
  angleDeg?: number
  isFlat?: boolean
}

const props = defineProps<{
  book: Book
  leftNeighbor?: NeighborInfo | null
  rightNeighbor?: NeighborInfo | null
  isGhost?: boolean
  physicsTransform?: PhysicsOverride | null
}>()

const emit = defineEmits<{
  (e: 'select', book: Book): void
  (e: 'edit', book: Book): void
}>()

const store = useLibraryStore()

const fallbackSizing = computed(() => getBookSizing(props.book, { left: props.leftNeighbor, right: props.rightNeighbor }))

const isFlat = computed(() => {
  if (props.physicsTransform?.isFlat !== undefined) return props.physicsTransform.isFlat
  return fallbackSizing.value.isFlat
})

const width = computed(() => {
  if (props.physicsTransform?.width !== undefined) return props.physicsTransform.width
  return fallbackSizing.value.width
})

const height = computed(() => {
  if (props.physicsTransform?.height !== undefined) return props.physicsTransform.height
  return fallbackSizing.value.height
})

const rotationDeg = computed(() => {
  if (props.physicsTransform?.angleDeg !== undefined) return props.physicsTransform.angleDeg
  return fallbackSizing.value.rotationDeg
})

const sizing = computed(() => ({
  width: width.value,
  height: height.value,
  rotationDeg: rotationDeg.value,
  isFlat: isFlat.value,
  topEdgeDetail: fallbackSizing.value.topEdgeDetail,
}))

const containerWrapperStyle = computed(() => {
  const w = width.value
  const h = height.value
  const rot = rotationDeg.value

  if (isFlat.value) {
    return {
      width: `${w}px`,
      height: `${h}px`,
      transform: 'none',
      zIndex: 10,
    }
  }

  let transform = ''
  let transformOrigin = 'bottom center'
  let zIndex = 10

  if (rot !== 0) {
    const rad = (Math.abs(rot) * Math.PI) / 180
    const floorLift = Math.ceil(w * Math.sin(rad)) + 1
    transform = `translateY(-${floorLift}px) rotate(${rot}deg)`
    transformOrigin = rot > 0 ? 'bottom left' : 'bottom right'
    zIndex = 20
  }

  return {
    width: `${w}px`,
    height: `${h}px`,
    transform,
    transformOrigin,
    zIndex,
  }
})

const spineStyle = computed(() => ({
  backgroundColor: props.book.spineColor,
}))

const finishClass = computed(() => {
  switch (props.book.spineStyle) {
    case 'ribbed-leather': return 'spine-finish-ribbed-leather'
    case 'gold-foil': return 'spine-finish-gold-foil'
    case 'woven-cloth': return 'spine-finish-woven-cloth'
    case 'modern-matte': return 'spine-finish-modern-matte'
    case 'vintage-parchment': return 'spine-finish-vintage-parchment'
    default: return 'spine-finish-ribbed-leather'
  }
})

const titleFoilClass = computed(() => {
  switch (props.book.titleColor) {
    case 'gold': return 'title-foil-gold'
    case 'silver': return 'title-foil-silver'
    case 'copper': return 'title-foil-copper'
    case 'white': return 'title-foil-white'
    case 'black': return 'title-foil-black'
    default: return 'title-foil-gold'
  }
})

const titleWritingStyle = computed(() => {
  if (sizing.value.width >= 75) {
    return {
      writingMode: 'horizontal-tb' as const,
    }
  }
  return {
    writingMode: 'vertical-rl' as const,
    textOrientation: 'mixed' as const,
    letterSpacing: '0.08em',
  }
})

function handleDragStart(e: DragEvent) {
  store.activeDraggingBook = props.book
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', props.book.id)
    e.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragEnd() {
  store.activeDraggingBook = null
}

function handleClick() {
  emit('select', props.book)
}

function handleRightClick() {
  emit('edit', props.book)
}
</script>
