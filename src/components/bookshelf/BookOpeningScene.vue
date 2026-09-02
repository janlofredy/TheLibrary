<template>
  <div
    v-if="book"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm perspective-stage overflow-hidden select-none"
  >
    <!-- 3D Book Object in Mid-Air -->
    <div
      class="relative transition-all duration-700 ease-out preserve-3d"
      :style="book3DTransform"
    >
      <!-- Closed Book Back Cover & Page Stack -->
      <div
        class="absolute inset-0 rounded-lg shadow-2xl preserve-3d"
        :style="{ backgroundColor: book.spineColor }"
      >
        <!-- Gold Trim / Embossing on Back Cover -->
        <div class="absolute inset-2 border border-amber-300/20 rounded pointer-events-none"></div>

        <!-- Simulated Paper Stack Thickness (Right & Bottom Edges) -->
        <div
          class="absolute right-0 top-1 bottom-1 w-4 bg-[#e8e2ce] rounded-r border-r border-[#3b2a1a] shadow-inner"
          style="background-image: repeating-linear-gradient(180deg, #d6cdb2 0px, #d6cdb2 1px, #f5f0dc 1px, #f5f0dc 3px);"
        ></div>
        <div
          class="absolute bottom-0 left-1 right-1 h-3 bg-[#e8e2ce] rounded-b border-b border-[#3b2a1a] shadow-inner"
          style="background-image: repeating-linear-gradient(90deg, #d6cdb2 0px, #d6cdb2 1px, #f5f0dc 1px, #f5f0dc 3px);"
        ></div>
      </div>

      <!-- Exposed Right-Side Paper Sheet (Inside Book) -->
      <div
        class="absolute inset-2 rounded paper-lined p-6 flex flex-col justify-between shadow-inner transition-opacity duration-300"
        :class="animStep === 'opening' || animStep === 'opened' ? 'opacity-100' : 'opacity-0'"
      >
        <div class="border-b border-black/10 pb-2">
          <h3 class="font-serif-book font-bold text-stone-800 text-lg sm:text-xl truncate">
            {{ book.title }}
          </h3>
          <span class="text-xs font-mono text-stone-500">Opening Journal...</span>
        </div>

        <div class="space-y-3 opacity-60">
          <div class="h-2 bg-stone-300/50 rounded w-5/6"></div>
          <div class="h-2 bg-stone-300/50 rounded w-4/6"></div>
          <div class="h-2 bg-stone-300/50 rounded w-full"></div>
          <div class="h-2 bg-stone-300/50 rounded w-3/4"></div>
        </div>

        <div class="text-center font-serif text-xs text-stone-400">
          — Page 1 —
        </div>
      </div>

      <!-- 3D Front Leather Cover (Flips Open to the Left) -->
      <div
        class="absolute inset-0 rounded-lg p-6 flex flex-col justify-between items-center shadow-2xl book-cover-unfold preserve-3d"
        :class="[finishClass, `font-${book.titleFont}-book`]"
        :style="frontCoverStyle"
      >
        <!-- Gold Trim Border -->
        <div class="absolute inset-2 border-2 border-amber-400/40 rounded-md pointer-events-none"></div>
        <div class="absolute inset-3 border border-amber-400/20 rounded pointer-events-none"></div>

        <!-- Top Monogram -->
        <div class="z-10 pt-4 flex flex-col items-center">
          <span class="text-2xl text-amber-300 opacity-80">✦</span>
          <span class="text-[10px] tracking-widest uppercase font-mono mt-1 opacity-70" :class="titleFoilClass">
            Volume {{ book.pageCount }} Pages
          </span>
        </div>

        <!-- Center Front Cover Title -->
        <div class="z-10 text-center px-4 my-auto">
          <h2
            class="text-xl sm:text-2xl font-bold tracking-widest uppercase mb-1 leading-tight drop-shadow-md"
            :class="titleFoilClass"
          >
            {{ book.title }}
          </h2>
          <p v-if="book.subtitle" class="text-xs italic tracking-wider opacity-80" :class="titleFoilClass">
            {{ book.subtitle }}
          </p>
        </div>

        <!-- Bookmark Ribbon dangling from front cover -->
        <div
          v-if="book.hasRibbon"
          class="absolute left-8 -bottom-6 w-4 h-12 ribbon-tail shadow-lg z-30"
          :style="{ backgroundColor: book.ribbonColor || '#d4af37' }"
        ></div>

        <!-- Bottom Ornament -->
        <div class="z-10 pb-4">
          <div class="w-12 h-0.5 opacity-60" :class="book.titleColor === 'gold' ? 'bg-amber-300' : 'bg-stone-300'"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Book } from '@/types/journal'

const props = defineProps<{
  book: Book
  mode: 'opening' | 'closing'
}>()

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const animStep = ref<'pulling' | 'rotating' | 'opening' | 'opened'>('pulling')

onMounted(() => {
  if (props.mode === 'opening') {
    // Step 1: Pull from shelf (0ms)
    animStep.value = 'pulling'

    // Step 2: Rotate to front (250ms)
    setTimeout(() => {
      animStep.value = 'rotating'
    }, 250)

    // Step 3: Unfold cover (600ms)
    setTimeout(() => {
      animStep.value = 'opening'
    }, 600)

    // Step 4: Complete transition to desk (1150ms)
    setTimeout(() => {
      animStep.value = 'opened'
      emit('complete')
    }, 1150)
  }
})

const book3DTransform = computed(() => {
  const width = 320
  const height = 440

  let transform = 'translate3d(0, 0, 0) scale(1)'

  if (animStep.value === 'pulling') {
    // Elevating and sliding forward
    transform = 'translate3d(0, -40px, 150px) rotateY(-80deg) rotateX(15deg) scale(0.85)'
  } else if (animStep.value === 'rotating') {
    // Turning to face viewer
    transform = 'translate3d(0, 0, 80px) rotateY(-15deg) rotateX(8deg) scale(0.95)'
  } else if (animStep.value === 'opening' || animStep.value === 'opened') {
    // Centered and open
    transform = 'translate3d(0, 0, 0) rotateY(0deg) rotateX(0deg) scale(1.05)'
  }

  return {
    width: `${width}px`,
    height: `${height}px`,
    transform,
  }
})

const frontCoverStyle = computed(() => {
  const isCoverOpen = animStep.value === 'opening' || animStep.value === 'opened'
  return {
    backgroundColor: props.book.spineColor,
    transform: isCoverOpen ? 'rotateY(-180deg)' : 'rotateY(0deg)',
  }
})

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
</script>
