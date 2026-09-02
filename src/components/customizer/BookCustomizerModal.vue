<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="handleClose"
  >
    <div class="relative w-full max-w-4xl bg-[#1c1612] border border-amber-900/40 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
      <!-- Left Column: Live 3D Spine Preview Desk -->
      <div class="w-full md:w-5/12 bg-[#120d09] p-6 border-b md:border-b-0 md:border-r border-stone-800 flex flex-col items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 bg-radial from-amber-950/20 via-transparent to-black/60 pointer-events-none"></div>

        <span class="text-[10px] tracking-widest uppercase font-mono text-stone-500 mb-6">Live Spine Preview</span>

        <!-- Preview Bookshelf Display -->
        <div class="relative w-full flex flex-col items-center justify-end min-h-[300px] pb-6">
          <BookSpine :book="previewBook" />
          
          <!-- Sample Wooden Shelf Plank under preview -->
          <div class="w-4/5 h-4 shelf-plank mt-0.5 rounded-sm"></div>
        </div>

        <!-- Thickness & Height Metrics Readout -->
        <div class="mt-4 flex items-center gap-4 text-xs text-stone-400 font-mono bg-black/40 px-3 py-1.5 rounded-md border border-stone-800">
          <span>Width: <strong class="text-amber-300">{{ previewSizing.width }}px</strong></span>
          <span>•</span>
          <span>Height: <strong class="text-amber-300">{{ previewSizing.height }}px</strong></span>
        </div>
      </div>

      <!-- Right Column: Customization Controls -->
      <div class="w-full md:w-7/12 p-6 overflow-y-auto max-h-[calc(90vh-2rem)] flex flex-col justify-between">
        <div>
          <!-- Header -->
          <div class="flex items-center justify-between pb-4 border-b border-stone-800 mb-5">
            <h2 class="text-lg font-serif-book font-bold text-amber-100">
              {{ isEditing ? 'Customize Book Volume' : 'New Journal Volume' }}
            </h2>
            <button
              class="text-stone-400 hover:text-stone-200 text-lg p-1"
              @click="handleClose"
            >
              ✕
            </button>
          </div>

          <div class="space-y-4">
            <!-- Title & Subtitle -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-mono uppercase text-stone-400 mb-1">Journal Title</label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="e.g. Daily Reflections"
                  class="w-full px-3 py-2 bg-black/40 border border-stone-700 rounded text-amber-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-mono uppercase text-stone-400 mb-1">Subtitle / Volume</label>
                <input
                  v-model="form.subtitle"
                  type="text"
                  placeholder="e.g. Volume I"
                  class="w-full px-3 py-2 bg-black/40 border border-stone-700 rounded text-amber-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <!-- Page Count Slider (Dynamic Thickness Testing) -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-mono uppercase text-stone-400">Written Pages (Dynamic Thickness)</label>
                <span class="text-xs font-mono text-amber-300 font-bold">{{ form.pageCount }} pages</span>
              </div>
              <input
                v-model.number="form.pageCount"
                type="range"
                min="1"
                max="100"
                class="w-full accent-amber-500 cursor-pointer"
              />
              <p class="text-[11px] text-stone-500 italic mt-0.5">
                Spine dynamically expands on the shelf as pages are written.
              </p>
            </div>

            <!-- Spine Colors (Swatches + Custom Picker) -->
            <div>
              <label class="block text-xs font-mono uppercase text-stone-400 mb-2">Spine Color</label>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-for="color in curatedColors"
                  :key="color.hex"
                  type="button"
                  class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer relative"
                  :class="form.spineColor === color.hex ? 'border-amber-300 scale-110 shadow-lg' : 'border-black/50'"
                  :style="{ backgroundColor: color.hex }"
                  :title="color.name"
                  @click="form.spineColor = color.hex"
                />
                <!-- Custom Hex Input -->
                <input
                  v-model="form.spineColor"
                  type="color"
                  class="w-7 h-7 rounded-full border-0 p-0 cursor-pointer bg-transparent"
                  title="Custom color picker"
                />
              </div>
            </div>

            <!-- Spine Style Finishes -->
            <div>
              <label class="block text-xs font-mono uppercase text-stone-400 mb-2">Spine Finish & Texture</label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="style in spineStyles"
                  :key="style.id"
                  type="button"
                  class="px-2.5 py-1.5 text-xs rounded border text-left transition cursor-pointer"
                  :class="form.spineStyle === style.id ? 'border-amber-400 bg-amber-950/40 text-amber-200' : 'border-stone-800 bg-black/30 text-stone-400 hover:border-stone-600'"
                  @click="form.spineStyle = style.id"
                >
                  {{ style.name }}
                </button>
              </div>
            </div>

            <!-- Title Foil Color & Typography -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-mono uppercase text-stone-400 mb-1">Title Foil Color</label>
                <select
                  v-model="form.titleColor"
                  class="w-full px-3 py-2 bg-black/40 border border-stone-700 rounded text-amber-100 text-xs focus:border-amber-500 focus:outline-none"
                >
                  <option value="gold">Gold Foil</option>
                  <option value="silver">Silver Foil</option>
                  <option value="copper">Copper Bronze</option>
                  <option value="white">Ivory White</option>
                  <option value="black">Blind Stamp Black</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-mono uppercase text-stone-400 mb-1">Title Typography</label>
                <select
                  v-model="form.titleFont"
                  class="w-full px-3 py-2 bg-black/40 border border-stone-700 rounded text-amber-100 text-xs focus:border-amber-500 focus:outline-none"
                >
                  <option value="serif">Playfair Serif</option>
                  <option value="roman">Cinzel Roman</option>
                  <option value="typewriter">Special Typewriter</option>
                  <option value="calligraphy">Caveat Script</option>
                  <option value="sans">Inter Modern</option>
                </select>
              </div>
            </div>

            <!-- Layer Mode & Orientation -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-mono uppercase text-stone-400">Shelf Orientation / Layer</label>
                <span v-if="!previewSizing.canTilt" class="text-[10px] text-amber-400 font-mono">
                  (Thick volume: Stands upright)
                </span>
              </div>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 py-1.5 text-xs rounded border transition cursor-pointer"
                  :class="form.layerMode === 'standing' ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold' : 'border-stone-800 bg-black/30 text-stone-400'"
                  @click="form.layerMode = 'standing'"
                >
                  Upright
                </button>
                <button
                  type="button"
                  class="flex-1 py-1.5 text-xs rounded border transition cursor-pointer"
                  :disabled="!previewSizing.canTilt"
                  :class="[
                    !previewSizing.canTilt ? 'opacity-30 cursor-not-allowed border-stone-800 text-stone-600' :
                    form.layerMode === 'leaning-left' ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold' : 'border-stone-800 bg-black/30 text-stone-400 hover:border-stone-600'
                  ]"
                  @click="previewSizing.canTilt && (form.layerMode = 'leaning-left')"
                >
                  Lean Left
                </button>
                <button
                  type="button"
                  class="flex-1 py-1.5 text-xs rounded border transition cursor-pointer"
                  :disabled="!previewSizing.canTilt"
                  :class="[
                    !previewSizing.canTilt ? 'opacity-30 cursor-not-allowed border-stone-800 text-stone-600' :
                    form.layerMode === 'leaning-right' ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold' : 'border-stone-800 bg-black/30 text-stone-400 hover:border-stone-600'
                  ]"
                  @click="previewSizing.canTilt && (form.layerMode = 'leaning-right')"
                >
                  Lean Right
                </button>
              </div>
            </div>

            <!-- Shelf Slot Position (Left, Center, Right, Slot 0-11) -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-mono uppercase text-stone-400">Shelf Placement (Slot {{ form.slotIndex + 1 }} of 12)</label>
                <span class="text-xs font-mono text-amber-300 font-bold">
                  {{ form.slotIndex <= 2 ? 'Left' : form.slotIndex <= 7 ? 'Middle' : 'Right' }}
                </span>
              </div>
              <div class="flex gap-1.5 mb-2">
                <button
                  type="button"
                  class="flex-1 py-1 text-[11px] font-mono rounded border transition cursor-pointer"
                  :class="form.slotIndex === 0 ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold' : 'border-stone-800 bg-black/30 text-stone-400'"
                  @click="form.slotIndex = 0"
                >
                  Far Left
                </button>
                <button
                  type="button"
                  class="flex-1 py-1 text-[11px] font-mono rounded border transition cursor-pointer"
                  :class="form.slotIndex === 3 ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold' : 'border-stone-800 bg-black/30 text-stone-400'"
                  @click="form.slotIndex = 3"
                >
                  Mid-Left
                </button>
                <button
                  type="button"
                  class="flex-1 py-1 text-[11px] font-mono rounded border transition cursor-pointer"
                  :class="form.slotIndex === 6 ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold' : 'border-stone-800 bg-black/30 text-stone-400'"
                  @click="form.slotIndex = 6"
                >
                  Center
                </button>
                <button
                  type="button"
                  class="flex-1 py-1 text-[11px] font-mono rounded border transition cursor-pointer"
                  :class="form.slotIndex === 9 ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold' : 'border-stone-800 bg-black/30 text-stone-400'"
                  @click="form.slotIndex = 9"
                >
                  Mid-Right
                </button>
                <button
                  type="button"
                  class="flex-1 py-1 text-[11px] font-mono rounded border transition cursor-pointer"
                  :class="form.slotIndex === 11 ? 'border-amber-400 bg-amber-950/40 text-amber-200 font-bold' : 'border-stone-800 bg-black/30 text-stone-400'"
                  @click="form.slotIndex = 11"
                >
                  Far Right
                </button>
              </div>
              <input
                v-model.number="form.slotIndex"
                type="range"
                min="0"
                max="11"
                class="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <!-- Bookmark Ribbon Toggle -->
            <div class="flex items-center justify-between p-3 bg-black/30 rounded border border-stone-800">
              <div>
                <span class="text-xs font-mono uppercase text-stone-300">Silk Bookmark Ribbon</span>
                <p class="text-[11px] text-stone-500">Dangles beneath the shelf ledge</p>
              </div>
              <div class="flex items-center gap-3">
                <input
                  v-if="form.hasRibbon"
                  v-model="form.ribbonColor"
                  type="color"
                  class="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                />
                <input
                  v-model="form.hasRibbon"
                  type="checkbox"
                  class="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-between pt-5 border-t border-stone-800 mt-6">
          <div class="flex items-center gap-3">
            <button
              v-if="isEditing"
              type="button"
              class="text-xs text-rose-400 hover:text-rose-300 underline font-mono cursor-pointer"
              @click="handleDelete"
            >
              Delete Book
            </button>
            <button
              v-if="isEditing && store.editingBook"
              type="button"
              class="px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800 text-amber-200 text-xs font-mono hover:bg-amber-900 transition cursor-pointer"
              @click="store.openShareModal('book', store.editingBook.id)"
            >
              ✨ Share / Export
            </button>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="px-4 py-2 text-xs rounded text-stone-400 hover:text-stone-200 font-mono"
              @click="handleClose"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-5 py-2 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-amber-100 tracking-wider uppercase font-serif-book shadow-lg transition"
              @click="handleSave"
            >
              Save Journal
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import type { Book, SpineStyle, TitleColor, TitleFont, LayerMode } from '@/types/journal'
import { getBookSizing } from '@/utils/bookSizing'
import BookSpine from '../bookshelf/BookSpine.vue'

const store = useLibraryStore()

const isOpen = computed(() => store.isBookCustomizerOpen)
const isEditing = computed(() => !!store.editingBook)

const curatedColors = [
  { name: 'Crimson Burgundy', hex: '#7a1c2f' },
  { name: 'Forest Emerald', hex: '#1e3d2f' },
  { name: 'Midnight Navy', hex: '#1b2a47' },
  { name: 'Warm Ochre', hex: '#a66a38' },
  { name: 'Royal Plum', hex: '#2b1d3a' },
  { name: 'Terracotta', hex: '#8a4b27' },
  { name: 'Charcoal Slate', hex: '#2d3748' },
  { name: 'Deep Cobalt', hex: '#1a365d' },
  { name: 'Dark Teal', hex: '#234e52' },
]

const spineStyles: { id: SpineStyle; name: string }[] = [
  { id: 'ribbed-leather', name: 'Ribbed Leather' },
  { id: 'gold-foil', name: 'Gold Foil' },
  { id: 'woven-cloth', name: 'Woven Cloth' },
  { id: 'modern-matte', name: 'Modern Matte' },
  { id: 'vintage-parchment', name: 'Vintage Paper' },
]

const form = ref<{
  title: string
  subtitle: string
  spineColor: string
  spineStyle: SpineStyle
  titleColor: TitleColor
  titleFont: TitleFont
  ribbonColor: string
  hasRibbon: boolean
  layerMode: LayerMode
  slotIndex: number
  pageCount: number
}>({
  title: 'Untitled Journal',
  subtitle: '',
  spineColor: '#7a1c2f',
  spineStyle: 'ribbed-leather',
  titleColor: 'gold',
  titleFont: 'serif',
  ribbonColor: '#d4af37',
  hasRibbon: true,
  layerMode: 'standing',
  slotIndex: 0,
  pageCount: 14,
})

watch(
  () => store.editingBook,
  (book) => {
    if (book) {
      form.value = {
        title: book.title,
        subtitle: book.subtitle || '',
        spineColor: book.spineColor,
        spineStyle: book.spineStyle,
        titleColor: book.titleColor,
        titleFont: book.titleFont,
        ribbonColor: book.ribbonColor,
        hasRibbon: book.hasRibbon,
        layerMode: book.layerMode,
        slotIndex: book.slotIndex !== undefined ? book.slotIndex : 0,
        pageCount: book.pageCount,
      }
    } else {
      // Default for new book
      const targetSlot = Number(sessionStorage.getItem('target_new_book_slot') || '0')
      form.value = {
        title: 'New Journal',
        subtitle: '',
        spineColor: '#7a1c2f',
        spineStyle: 'ribbed-leather',
        titleColor: 'gold',
        titleFont: 'serif',
        ribbonColor: '#d4af37',
        hasRibbon: true,
        layerMode: 'standing',
        slotIndex: targetSlot,
        pageCount: 1,
      }
    }
  },
  { immediate: true }
)

const previewBook = computed<Book>(() => ({
  id: store.editingBook?.id || 'bk_preview_seed',
  shelfId: store.editingBook?.shelfId || store.targetShelfIdForNewBook || '',
  title: form.value.title || 'Untitled',
  subtitle: form.value.subtitle,
  spineColor: form.value.spineColor,
  spineStyle: form.value.spineStyle,
  titleColor: form.value.titleColor,
  titleFont: form.value.titleFont,
  ribbonColor: form.value.ribbonColor,
  hasRibbon: form.value.hasRibbon,
  slotIndex: form.value.slotIndex,
  layerMode: form.value.layerMode,
  stackOrder: 0,
  pageCount: form.value.pageCount,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

const previewSizing = computed(() => getBookSizing(previewBook.value))

function handleClose() {
  store.closeBookCustomizer()
}

async function handleSave() {
  if (isEditing.value && store.editingBook) {
    await store.updateBook(store.editingBook.id, {
      title: form.value.title,
      subtitle: form.value.subtitle,
      spineColor: form.value.spineColor,
      spineStyle: form.value.spineStyle,
      titleColor: form.value.titleColor,
      titleFont: form.value.titleFont,
      ribbonColor: form.value.ribbonColor,
      hasRibbon: form.value.hasRibbon,
      layerMode: form.value.layerMode,
      slotIndex: form.value.slotIndex,
      pageCount: form.value.pageCount,
    })
  } else if (store.targetShelfIdForNewBook) {
    await store.createBook({
      shelfId: store.targetShelfIdForNewBook,
      title: form.value.title,
      subtitle: form.value.subtitle,
      spineColor: form.value.spineColor,
      spineStyle: form.value.spineStyle,
      titleColor: form.value.titleColor,
      titleFont: form.value.titleFont,
      ribbonColor: form.value.ribbonColor,
      hasRibbon: form.value.hasRibbon,
      layerMode: form.value.layerMode,
      slotIndex: form.value.slotIndex,
    })
  }
  sessionStorage.removeItem('target_new_book_slot')
  store.closeBookCustomizer()
}

async function handleDelete() {
  if (store.editingBook && confirm(`Are you sure you want to delete "${store.editingBook.title}"?`)) {
    await store.deleteBook(store.editingBook.id)
    store.closeBookCustomizer()
  }
}
</script>
