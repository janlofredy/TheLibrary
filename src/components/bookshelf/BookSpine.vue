<template>
  <div
    class="relative select-none cursor-pointer group transition-all duration-300 ease-out flex-shrink-0"
    :style="containerStyle"
    @click="handleClick"
    @contextmenu.prevent="handleRightClick"
  >
    <!-- 3D Book Spine Body -->
    <div
      class="relative h-full w-full rounded-t-sm flex flex-col justify-between items-center py-3 px-1 overflow-hidden spine-3d-lighting transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-[1.02]"
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

    <!-- Hanging Bookmark Ribbon -->
    <div
      v-if="book.hasRibbon"
      class="absolute left-1/2 -bottom-3.5 -translate-x-1/2 w-2.5 h-4 ribbon-tail shadow-md z-30 transition-transform duration-300 group-hover:translate-y-1"
      :style="{ backgroundColor: book.ribbonColor || '#d4af37' }"
    ></div>

    <!-- Book Base Shadow on Shelf Floor -->
    <div class="absolute -bottom-1 inset-x-1 h-2 bg-black/60 rounded-full blur-[2px] -z-10"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '@/types/journal'
import { getBookSizing } from '@/utils/bookSizing'

const props = defineProps<{
  book: Book
}>()

const emit = defineEmits<{
  (e: 'select', book: Book): void
  (e: 'edit', book: Book): void
}>()

const sizing = computed(() => getBookSizing(props.book))

const containerStyle = computed(() => {
  const { width, height, rotationDeg } = sizing.value
  let transform = ''
  
  if (props.book.layerMode === 'leaning-left' || props.book.layerMode === 'leaning-right') {
    transform = `rotate(${rotationDeg}deg) translateY(4px)`
  }

  return {
    width: `${width}px`,
    height: `${height}px`,
    transform,
    transformOrigin: props.book.layerMode === 'leaning-left' ? 'bottom left' : 'bottom right',
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
  // If spine is wide enough, allow normal text; otherwise vertical writing mode
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

function handleClick() {
  emit('select', props.book)
}

function handleRightClick() {
  emit('edit', props.book)
}
</script>
