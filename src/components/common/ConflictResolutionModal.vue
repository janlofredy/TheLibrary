<template>
  <div
    v-if="store.isConflictModalOpen && activeConflict"
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm select-none"
  >
    <div
      class="relative w-full max-w-5xl rounded-xl border border-amber-900/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] bg-[#1a120c] text-stone-200"
    >
      <!-- Antique Top Banner -->
      <header class="px-6 py-4 bg-gradient-to-r from-amber-950/80 via-[#24170e] to-amber-950/80 border-b border-amber-900/40 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚠️</span>
          <div>
            <h2 class="text-base sm:text-lg font-serif-book font-bold text-amber-200 tracking-wide">
              Sync Conflict Detected
            </h2>
            <p class="text-xs text-stone-400 font-mono">
              Journal: <span class="text-amber-300 font-semibold">{{ activeConflict.bookTitle }}</span> • Page {{ activeConflict.pageNumber }}
              <span v-if="store.conflictsList.length > 1" class="ml-2 px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-200 text-[10px]">
                {{ currentConflictIndex + 1 }} of {{ store.conflictsList.length }} conflicts
              </span>
            </p>
          </div>
        </div>

        <button
          class="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800/60 transition cursor-pointer text-sm"
          title="Close (Review Later)"
          @click="store.closeConflictModal"
        >
          ✕
        </button>
      </header>

      <!-- Subtitle Description -->
      <div class="px-6 py-2.5 bg-amber-950/30 border-b border-amber-900/20 text-xs text-amber-100/80 flex items-center justify-between">
        <span>Concurrent edits were made to this page on another device. Compare both versions below and choose how to resolve:</span>
        <span class="text-[10px] font-mono text-stone-400">Zero Data Loss Guarantee</span>
      </div>

      <!-- Main Dual-Pane Side-by-Side Comparison Workspace -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-[#140e08]">
        <!-- LEFT PANE: Local Version (This Device) -->
        <section class="flex flex-col rounded-lg border border-amber-800/40 overflow-hidden shadow-lg bg-[#20160f]">
          <header class="px-4 py-2.5 bg-amber-950/60 border-b border-amber-900/30 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                This Device (Local)
              </span>
              <span class="text-[11px] font-mono text-stone-400">
                {{ formatTimestamp(activeConflict.localPage.updatedAt) }}
              </span>
            </div>
            <span class="text-xs font-mono text-stone-400">
              {{ activeConflict.localPage.wordCount || 0 }} words
            </span>
          </header>

          <div class="p-4 sm:p-6 flex-1 flex flex-col justify-between paper-lined min-h-[320px] rounded-b-lg text-stone-900">
            <div>
              <h3 class="font-serif-book font-bold text-lg text-stone-900 border-b border-stone-300 pb-1 mb-3">
                {{ activeConflict.localPage.title || 'Untitled Page' }}
              </h3>
              <div
                v-if="typeof activeConflict.localPage.content === 'string'"
                class="prose prose-sm max-w-none text-stone-800 font-serif leading-relaxed text-sm overflow-y-auto max-h-[340px]"
                v-html="activeConflict.localPage.content"
              ></div>
              <div v-else class="text-sm font-serif text-stone-800 whitespace-pre-wrap max-h-[340px] overflow-y-auto">
                {{ activeConflict.localPage.plainText || '(No content)' }}
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-stone-300 flex items-center justify-between text-xs text-stone-500 font-mono">
              <span>Mood: {{ activeConflict.localPage.mood || 'neutral' }}</span>
              <span>Tags: {{ activeConflict.localPage.tags?.join(', ') || 'none' }}</span>
            </div>
          </div>
        </section>

        <!-- RIGHT PANE: Remote Version (Cloud) -->
        <section class="flex flex-col rounded-lg border border-amber-800/40 overflow-hidden shadow-lg bg-[#20160f]">
          <header class="px-4 py-2.5 bg-amber-950/60 border-b border-amber-900/30 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-sky-400 bg-sky-950/80 border border-sky-800/60 px-2 py-0.5 rounded">
                Cloud Version (GitHub)
              </span>
              <span class="text-[11px] font-mono text-stone-400">
                {{ formatTimestamp(activeConflict.remotePage.updatedAt) }}
              </span>
            </div>
            <span class="text-xs font-mono text-stone-400">
              {{ activeConflict.remotePage.wordCount || 0 }} words
            </span>
          </header>

          <div class="p-4 sm:p-6 flex-1 flex flex-col justify-between paper-lined min-h-[320px] rounded-b-lg text-stone-900">
            <div>
              <h3 class="font-serif-book font-bold text-lg text-stone-900 border-b border-stone-300 pb-1 mb-3">
                {{ activeConflict.remotePage.title || 'Untitled Page' }}
              </h3>
              <div
                v-if="typeof activeConflict.remotePage.content === 'string'"
                class="prose prose-sm max-w-none text-stone-800 font-serif leading-relaxed text-sm overflow-y-auto max-h-[340px]"
                v-html="activeConflict.remotePage.content"
              ></div>
              <div v-else class="text-sm font-serif text-stone-800 whitespace-pre-wrap max-h-[340px] overflow-y-auto">
                {{ activeConflict.remotePage.plainText || '(No content)' }}
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-stone-300 flex items-center justify-between text-xs text-stone-500 font-mono">
              <span>Mood: {{ activeConflict.remotePage.mood || 'neutral' }}</span>
              <span>Tags: {{ activeConflict.remotePage.tags?.join(', ') || 'none' }}</span>
            </div>
          </div>
        </section>
      </main>

      <!-- Bottom Resolution Action Bar -->
      <footer class="px-6 py-4 bg-gradient-to-r from-[#1f140c] via-[#2a1b10] to-[#1f140c] border-t border-amber-900/40 flex flex-wrap items-center justify-between gap-3">
        <div class="text-xs font-mono text-stone-400">
          Choose a resolution action:
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <!-- Action 1: Keep Local -->
          <button
            class="px-3.5 py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-200 text-xs font-serif-book font-semibold tracking-wide transition cursor-pointer shadow flex items-center gap-1.5"
            @click="resolve('keep-local')"
          >
            <span>🛡️</span> <span>Keep This Device</span>
          </button>

          <!-- Action 2: Keep Remote -->
          <button
            class="px-3.5 py-2 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-700/80 text-sky-200 text-xs font-serif-book font-semibold tracking-wide transition cursor-pointer shadow flex items-center gap-1.5"
            @click="resolve('keep-remote')"
          >
            <span>☁️</span> <span>Keep Cloud Version</span>
          </button>

          <!-- Action 3: Combine Both -->
          <button
            class="px-3.5 py-2 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-200 text-xs font-serif-book font-semibold tracking-wide transition cursor-pointer shadow flex items-center gap-1.5"
            title="Append cloud content beneath local content"
            @click="resolve('combine')"
          >
            <span>📜</span> <span>Combine Both</span>
          </button>

          <!-- Action 4: Keep Both as Separate Pages -->
          <button
            class="px-3.5 py-2 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-700/80 text-purple-200 text-xs font-serif-book font-semibold tracking-wide transition cursor-pointer shadow flex items-center gap-1.5"
            title="Keep both by inserting the cloud version as an extra page"
            @click="resolve('keep-both')"
          >
            <span>📑</span> <span>Keep as 2 Pages</span>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'

const store = useLibraryStore()

const activeConflict = computed(() => store.activeConflict)

const currentConflictIndex = computed(() => {
  if (!activeConflict.value) return 0
  return store.conflictsList.findIndex(c => c.id === activeConflict.value!.id)
})

function formatTimestamp(isoStr?: string): string {
  if (!isoStr) return 'Unknown'
  const d = new Date(isoStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
}

function resolve(choice: 'keep-local' | 'keep-remote' | 'combine' | 'keep-both') {
  if (!activeConflict.value) return
  store.resolveConflict(activeConflict.value.id, choice)
}
</script>
