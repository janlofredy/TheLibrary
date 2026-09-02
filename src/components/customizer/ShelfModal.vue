<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="handleClose"
  >
    <div class="relative w-full max-w-md bg-[#1c1612] border border-amber-900/40 rounded-xl shadow-2xl p-6">
      <div class="flex items-center justify-between pb-3 border-b border-stone-800 mb-5">
        <h2 class="text-lg font-serif-book font-bold text-amber-100">
          {{ isEditing ? 'Edit Shelf Nameplate' : 'Build New Shelf' }}
        </h2>
        <button class="text-stone-400 hover:text-stone-200 text-lg p-1" @click="handleClose">
          ✕
        </button>
      </div>

      <div class="space-y-4">
        <!-- Shelf Name -->
        <div>
          <label class="block text-xs font-mono uppercase text-stone-400 mb-1">Shelf Name</label>
          <input
            v-model="name"
            type="text"
            placeholder="e.g. Daily Reflections"
            class="w-full px-3 py-2 bg-black/40 border border-stone-700 rounded text-amber-100 text-sm focus:border-amber-500 focus:outline-none"
            autofocus
          />
        </div>

        <!-- Metallic Nameplate Style -->
        <div>
          <label class="block text-xs font-mono uppercase text-stone-400 mb-2">Metallic Nameplate Material</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="style in nameplateStyles"
              :key="style.id"
              type="button"
              class="p-2.5 rounded border text-center transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              :class="[
                `plate-${style.id}`,
                nameplateStyle === style.id ? 'ring-2 ring-amber-400 font-bold scale-[1.02]' : 'opacity-80 hover:opacity-100'
              ]"
              @click="nameplateStyle = style.id"
            >
              <span class="text-xs tracking-wider uppercase font-serif-book">{{ style.name }}</span>
            </button>
          </div>
        </div>

        <!-- Nameplate Live Preview -->
        <div class="pt-2">
          <span class="block text-[10px] font-mono uppercase text-stone-500 mb-1 text-center">Nameplate Preview</span>
          <div class="flex justify-center p-3 bg-black/40 rounded border border-stone-800">
            <div
              class="px-5 py-1 rounded-sm flex items-center gap-2 shadow-md"
              :class="`plate-${nameplateStyle}`"
            >
              <div class="w-1.5 h-1.5 rounded-full bg-black/40 shadow-inner"></div>
              <span class="text-xs font-serif-book font-bold tracking-widest uppercase">
                {{ name || 'Shelf Name' }}
              </span>
              <div class="w-1.5 h-1.5 rounded-full bg-black/40 shadow-inner"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-5 border-t border-stone-800 mt-6">
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
          Save Shelf
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import type { NameplateStyle } from '@/types/journal'

const store = useLibraryStore()

const isOpen = computed(() => store.isShelfModalOpen)
const isEditing = computed(() => !!store.editingShelf)

const nameplateStyles: { id: NameplateStyle; name: string }[] = [
  { id: 'brass', name: 'Brushed Brass' },
  { id: 'silver', name: 'Sterling Silver' },
  { id: 'bronze', name: 'Antique Bronze' },
  { id: 'matte-black', name: 'Matte Black' },
]

const name = ref('My Bookshelf')
const nameplateStyle = ref<NameplateStyle>('brass')

watch(
  () => store.editingShelf,
  (shelf) => {
    if (shelf) {
      name.value = shelf.name
      nameplateStyle.value = shelf.nameplateStyle
    } else {
      name.value = 'New Shelf'
      nameplateStyle.value = 'brass'
    }
  },
  { immediate: true }
)

function handleClose() {
  store.closeShelfModal()
}

async function handleSave() {
  if (!name.value.trim()) return

  if (isEditing.value && store.editingShelf) {
    await store.updateShelf(store.editingShelf.id, {
      name: name.value.trim(),
      nameplateStyle: nameplateStyle.value,
    })
  } else if (store.currentLibraryId) {
    await store.createShelf(store.currentLibraryId, name.value.trim(), nameplateStyle.value)
  }
  store.closeShelfModal()
}
</script>
