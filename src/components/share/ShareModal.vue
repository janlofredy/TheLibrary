<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="handleClose"
  >
    <div class="relative w-full max-w-md bg-[#1c1612] border border-amber-900/40 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
        <div class="flex items-center gap-2">
          <span class="text-xl">✨</span>
          <h2 class="text-base font-serif-book font-bold text-amber-100">
            Share & Export {{ targetTitle }}
          </h2>
        </div>
        <button class="text-stone-400 hover:text-stone-200 text-lg p-1 cursor-pointer" @click="handleClose">
          ✕
        </button>
      </div>

      <!-- Option 1: Shareable Cloud Link via Gist -->
      <div class="space-y-4 mb-6">
        <div class="p-4 bg-black/40 rounded-lg border border-stone-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase text-stone-300 font-semibold">Shareable Link (Gist Cloud)</span>
            <span class="text-[10px] font-mono text-amber-400">Zero-Backend</span>
          </div>
          
          <p class="text-xs text-stone-400">
            Creates a sovereign, unlisted snapshot anyone can read or import into their own bookshelf.
          </p>

          <!-- Generated Link State -->
          <div v-if="shareUrl" class="space-y-2 pt-1">
            <div class="flex items-center gap-2">
              <input
                type="text"
                readonly
                :value="shareUrl"
                class="flex-1 px-3 py-1.5 bg-black/60 border border-amber-700/60 rounded text-amber-200 text-xs font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                class="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-amber-100 text-xs font-mono transition cursor-pointer"
                @click="copyShareUrl"
              >
                {{ copied ? 'Copied ✓' : 'Copy' }}
              </button>
            </div>
            <p class="text-[10px] text-emerald-400 font-mono">
              ✓ Ready to share! Anyone with this link can read and import this journal.
            </p>
          </div>

          <!-- Generate Button -->
          <div v-else>
            <button
              type="button"
              class="w-full py-2 rounded bg-amber-700/80 hover:bg-amber-600 text-amber-100 text-xs font-serif-book font-bold tracking-wider uppercase transition shadow cursor-pointer flex items-center justify-center gap-2"
              :disabled="isGenerating"
              @click="generateShareLink"
            >
              <span v-if="isGenerating" class="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              <span>{{ isGenerating ? 'Publishing Snapshot...' : '🔗 Generate Shareable Link' }}</span>
            </button>
          </div>
        </div>

        <!-- Option 2: Download as Formatted Markdown -->
        <div class="p-4 bg-black/40 rounded-lg border border-stone-800 flex items-center justify-between">
          <div>
            <div class="text-xs font-mono uppercase text-stone-300 font-semibold">Export Markdown (.md)</div>
            <div class="text-[11px] text-stone-500">Formatted journal text with dates and moods</div>
          </div>
          <button
            type="button"
            class="px-3.5 py-1.5 rounded border border-stone-700 hover:border-amber-500 text-xs font-mono text-stone-200 hover:text-amber-200 transition bg-black/30 cursor-pointer"
            @click="handleExportMarkdown"
          >
            Download .md
          </button>
        </div>

        <!-- Option 3: Download as JSON Vault Backup -->
        <div class="p-4 bg-black/40 rounded-lg border border-stone-800 flex items-center justify-between">
          <div>
            <div class="text-xs font-mono uppercase text-stone-300 font-semibold">JSON Vault Backup</div>
            <div class="text-[11px] text-stone-500">Full structured backup with styles and metadata</div>
          </div>
          <button
            type="button"
            class="px-3.5 py-1.5 rounded border border-stone-700 hover:border-amber-500 text-xs font-mono text-stone-200 hover:text-amber-200 transition bg-black/30 cursor-pointer"
            @click="handleExportJSON"
          >
            Download .json
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-2 text-right">
        <button
          type="button"
          class="px-4 py-2 text-xs rounded text-stone-400 hover:text-stone-200 font-mono cursor-pointer"
          @click="handleClose"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import {
  exportBookAsMarkdown,
  buildSharedPayload,
  publishToGist,
  downloadFile,
} from '@/services/shareService'

const store = useLibraryStore()

const isOpen = computed(() => store.isShareModalOpen)
const target = computed(() => store.shareTarget)

const isGenerating = ref(false)
const shareUrl = ref<string | null>(null)
const copied = ref(false)

const targetTitle = computed(() => {
  if (!target.value) return 'Journal'
  if (target.value.type === 'book') {
    const b = store.books.find(b => b.id === target.value?.id)
    return b ? `"${b.title}"` : 'Book'
  }
  if (target.value.type === 'shelf') {
    const s = store.shelves.find(s => s.id === target.value?.id)
    return s ? `Shelf "${s.name}"` : 'Shelf'
  }
  return 'Library'
})

function handleClose() {
  store.closeShareModal()
  shareUrl.value = null
  copied.value = false
}

async function generateShareLink() {
  if (!target.value) return
  isGenerating.value = true

  try {
    const payload = await buildSharedPayload(target.value.type, target.value.id)
    const { gistId } = await publishToGist(payload, false)

    const baseUrl = window.location.origin + window.location.pathname
    shareUrl.value = `${baseUrl}?share_gist=${gistId}`
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'Sharing failed')
  } finally {
    isGenerating.value = false
  }
}

async function copyShareUrl() {
  if (shareUrl.value) {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2500)
  }
}

async function handleExportMarkdown() {
  if (!target.value || target.value.type !== 'book') {
    alert('Markdown export is available for individual books.')
    return
  }

  const md = await exportBookAsMarkdown(target.value.id)
  const book = store.books.find(b => b.id === target.value?.id)
  const filename = `${(book?.title || 'journal').toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`
  downloadFile(md, filename, 'text/markdown')
}

async function handleExportJSON() {
  if (!target.value) return
  const payload = await buildSharedPayload(target.value.type, target.value.id)
  const filename = `vault-backup-${target.value.type}-${Date.now()}.json`
  downloadFile(JSON.stringify(payload, null, 2), filename, 'application/json')
}
</script>
