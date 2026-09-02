<template>
  <div class="flex items-center gap-2">
    <!-- Sync Status Pill Trigger -->
    <button
      type="button"
      class="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full text-xs font-mono transition-all duration-200 border cursor-pointer shadow-sm"
      :class="pillClass"
      :title="tooltipTitle"
      @click="handleClick"
    >
      <!-- Status Icon / Spinner -->
      <span v-if="syncStatus.state === 'syncing'" class="w-2 h-2 rounded-full border-2 border-amber-300 border-t-transparent animate-spin"></span>
      <span v-else class="w-2 h-2 rounded-full" :class="dotClass"></span>

      <!-- Label text -->
      <span class="truncate max-w-[120px] sm:max-w-[160px]">
        {{ labelText }}
      </span>

      <!-- Manual Sync Button (Only if connected) -->
      <span
        v-if="isConnected && syncStatus.state !== 'syncing'"
        class="opacity-60 hover:opacity-100 text-[10px] ml-0.5"
        title="Sync to GitHub now"
        @click.stop="triggerManualSync"
      >
        ↻
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { syncEngine, type SyncStatus } from '@/services/gitSyncEngine'
import { getStoredSession } from '@/services/githubAuth'
import { useLibraryStore } from '@/stores/libraryStore'

const store = useLibraryStore()

const syncStatus = ref<SyncStatus>(syncEngine.getStatus())
const isConnected = ref(!!getStoredSession())

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = syncEngine.subscribe((status) => {
    syncStatus.value = status
    isConnected.value = !!getStoredSession()
  })
})

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
})

const pillClass = computed(() => {
  if (!isConnected.value) {
    return 'bg-rose-950/40 border-rose-800/60 text-rose-200 hover:bg-rose-900/60'
  }
  switch (syncStatus.value.state) {
    case 'syncing':
      return 'bg-amber-950/50 border-amber-600/70 text-amber-200 animate-pulse'
    case 'synced':
      return 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200 hover:bg-emerald-900/50'
    case 'error':
      return 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
    case 'offline':
      return 'bg-stone-900/60 border-stone-700/60 text-stone-300'
    default:
      return 'bg-stone-900/60 border-stone-700/60 text-stone-300 hover:border-amber-500/60'
  }
})

const dotClass = computed(() => {
  if (!isConnected.value) return 'bg-rose-400'
  switch (syncStatus.value.state) {
    case 'synced': return 'bg-emerald-400'
    case 'error': return 'bg-rose-400'
    case 'offline': return 'bg-stone-500'
    default: return 'bg-amber-400'
  }
})

const labelText = computed(() => {
  if (!isConnected.value) return 'Connect Cloud'
  if (syncStatus.value.state === 'syncing') return 'Syncing to Git...'
  if (syncStatus.value.state === 'error') return 'Sync Issue'
  if (syncStatus.value.state === 'offline') return 'Local (Offline)'
  if (syncStatus.value.pendingEdits > 0) return `${syncStatus.value.pendingEdits} pending`
  if (syncStatus.value.lastSyncedAt) return 'Cloud Synced ✓'
  return 'Cloud Connected'
})

const tooltipTitle = computed(() => {
  if (!isConnected.value) return 'Click to connect GitHub account and repository vault'
  if (syncStatus.value.errorMessage) return `Error: ${syncStatus.value.errorMessage}`
  if (syncStatus.value.lastSyncedAt) return `Last synced: ${syncStatus.value.lastSyncedAt.toLocaleTimeString()}`
  return 'GitHub Storage Vault Connected'
})

function handleClick() {
  store.openAuthModal()
}

async function triggerManualSync() {
  await syncEngine.sync()
}
</script>
