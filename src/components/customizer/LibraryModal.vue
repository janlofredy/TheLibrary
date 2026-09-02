<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="handleClose"
  >
    <div class="relative w-full max-w-lg bg-[#1c1612] border border-amber-900/40 rounded-xl shadow-2xl p-6">
      <div class="flex items-center justify-between pb-3 border-b border-stone-800 mb-5">
        <h2 class="text-lg font-serif-book font-bold text-amber-100">
          Library Management
        </h2>
        <button class="text-stone-400 hover:text-stone-200 text-lg p-1" @click="handleClose">
          ✕
        </button>
      </div>

      <!-- Library Switcher List -->
      <div class="mb-6">
        <label class="block text-xs font-mono uppercase text-stone-400 mb-2">Switch Library</label>
        <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
          <div
            v-for="lib in libraries"
            :key="lib.id"
            class="flex items-center justify-between p-3 rounded-lg border transition cursor-pointer"
            :class="lib.id === currentLibraryId ? 'border-amber-500/80 bg-amber-950/40 text-amber-100' : 'border-stone-800 bg-black/30 text-stone-300 hover:border-stone-700'"
            @click="handleSelectLibrary(lib.id)"
          >
            <div>
              <div class="font-serif-book font-semibold text-sm">{{ lib.name }}</div>
              <div class="text-[11px] text-stone-500 font-mono capitalize">Wood: {{ lib.woodMaterial }}</div>
            </div>
            <span v-if="lib.id === currentLibraryId" class="text-xs text-amber-400 font-mono">Active ✓</span>
          </div>
        </div>
      </div>

      <hr class="border-stone-800 my-4" />

      <!-- Create / Edit Library Form -->
      <div class="space-y-4">
        <h3 class="text-xs font-mono uppercase text-stone-400 tracking-wider">
          {{ isCreatingNew ? 'Create New Library Vault' : 'Edit Active Library' }}
        </h3>

        <!-- Library Name & Description -->
        <div>
          <label class="block text-xs font-mono text-stone-400 mb-1">Library Name</label>
          <input
            v-model="name"
            type="text"
            placeholder="e.g. Work & Engineering Sanctuary"
            class="w-full px-3 py-2 bg-black/40 border border-stone-700 rounded text-amber-100 text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-mono text-stone-400 mb-1">Description (Optional)</label>
          <input
            v-model="description"
            type="text"
            placeholder="e.g. A dedicated room for code architecture and tech logs"
            class="w-full px-3 py-2 bg-black/40 border border-stone-700 rounded text-amber-100 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <!-- Wood Material Theme -->
        <div>
          <label class="block text-xs font-mono uppercase text-stone-400 mb-2">Wood Finish Theme</label>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <button
              v-for="mat in woodMaterials"
              :key="mat.id"
              type="button"
              class="h-16 rounded border text-center transition flex flex-col items-center justify-end pb-1.5 shadow-md cursor-pointer relative overflow-hidden"
              :class="[
                `wood-${mat.id}`,
                woodMaterial === mat.id ? 'ring-2 ring-amber-400 scale-105' : 'opacity-80 hover:opacity-100'
              ]"
              @click="woodMaterial = mat.id"
            >
              <div class="absolute inset-0 bg-black/30"></div>
              <span class="relative z-10 text-[10px] font-mono text-amber-100 uppercase tracking-tight">{{ mat.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-between pt-5 border-t border-stone-800 mt-6">
        <div>
          <button
            v-if="!isCreatingNew"
            type="button"
            class="text-xs text-amber-400 hover:text-amber-300 font-mono underline"
            @click="startCreatingNew"
          >
            + Create New Library
          </button>
          <button
            v-else
            type="button"
            class="text-xs text-stone-400 hover:text-stone-300 font-mono underline"
            @click="cancelCreatingNew"
          >
            ← Back to Editing Active
          </button>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-4 py-2 text-xs rounded text-stone-400 hover:text-stone-200 font-mono"
            @click="handleClose"
          >
            Close
          </button>
          <button
            type="button"
            class="px-5 py-2 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-amber-100 tracking-wider uppercase font-serif-book shadow-lg transition"
            @click="handleSave"
          >
            {{ isCreatingNew ? 'Create Library' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import type { WoodMaterial } from '@/types/journal'

const store = useLibraryStore()

const isOpen = computed(() => store.isLibraryModalOpen)
const libraries = computed(() => store.libraries)
const currentLibraryId = computed(() => store.currentLibraryId)
const currentLibrary = computed(() => store.currentLibrary)

const woodMaterials: { id: WoodMaterial; name: string }[] = [
  { id: 'walnut', name: 'Walnut' },
  { id: 'oak', name: 'Oak' },
  { id: 'mahogany', name: 'Mahogany' },
  { id: 'birch', name: 'Birch' },
  { id: 'midnight', name: 'Midnight' },
]

const isCreatingNew = ref(false)
const name = ref('')
const description = ref('')
const woodMaterial = ref<WoodMaterial>('walnut')

watch(
  [() => store.currentLibrary, isCreatingNew],
  ([lib, creating]) => {
    if (creating) {
      name.value = ''
      description.value = ''
      woodMaterial.value = 'walnut'
    } else if (lib) {
      name.value = lib.name
      description.value = lib.description || ''
      woodMaterial.value = lib.woodMaterial
    }
  },
  { immediate: true }
)

function handleClose() {
  store.closeLibraryModal()
  isCreatingNew.value = false
}

function handleSelectLibrary(id: string) {
  store.setLibrary(id)
  isCreatingNew.value = false
}

function startCreatingNew() {
  isCreatingNew.value = true
}

function cancelCreatingNew() {
  isCreatingNew.value = false
}

async function handleSave() {
  if (!name.value.trim()) return

  if (isCreatingNew.value) {
    await store.createLibrary({
      name: name.value.trim(),
      description: description.value.trim(),
      woodMaterial: woodMaterial.value,
    })
    isCreatingNew.value = false
  } else if (currentLibrary.value) {
    await store.updateLibrary(currentLibrary.value.id, {
      name: name.value.trim(),
      description: description.value.trim(),
      woodMaterial: woodMaterial.value,
    })
  }
  store.closeLibraryModal()
}
</script>
