<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="handleClose"
  >
    <div class="relative w-full max-w-lg bg-[#1c1612] border border-amber-900/50 rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
      
      <!-- ========================================================================= -->
      <!-- VIEW A: CONNECT GITHUB VAULT (UNLINKED)                                  -->
      <!-- ========================================================================= -->
      <div v-if="!hasGitHubToken" class="space-y-5">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3.5 border-b border-stone-800">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-600/40 flex items-center justify-center text-lg">
              🐙
            </div>
            <div>
              <h2 class="text-lg font-serif-book font-bold text-amber-100">
                Connect GitHub Sovereign Vault
              </h2>
              <p class="text-[11px] font-mono text-amber-400/80">
                Free Forever • Sovereign Cloud Backup & Sync
              </p>
            </div>
          </div>
          <button
            class="text-stone-400 hover:text-stone-200 text-lg p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition"
            @click="handleClose"
          >
            ✕
          </button>
        </div>

        <!-- Explanation Card -->
        <div class="p-4 bg-black/40 rounded-xl border border-stone-800 space-y-2.5">
          <div class="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
            <span>💾</span>
            <span>Local-First + Git Sovereign Backend</span>
          </div>
          <p class="text-xs text-stone-300 font-serif leading-relaxed">
            Your journals and shelves are currently saved locally in this browser's IndexedDB. Connect a <strong>GitHub Personal Access Token (PAT)</strong> to back up your library to a private GitHub repository (<code class="text-amber-200 font-mono text-[11px]">the-journal-vault</code>) for multi-device sync and Git version history.
          </p>
        </div>

        <!-- PAT Input Form -->
        <form class="space-y-4" @submit.prevent="handleConnectGitHub">
          <div>
            <label class="block text-xs font-mono uppercase text-stone-300 mb-1.5">
              GitHub Personal Access Token (PAT) <span class="text-rose-400">*</span>
            </label>
            <input
              v-model="tokenInput"
              type="password"
              required
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              class="w-full px-3.5 py-2.5 bg-black/60 border border-stone-700 rounded-lg text-amber-100 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-stone-600 shadow-inner"
            />
            <div class="flex justify-between items-center mt-1.5 text-[11px]">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=TheJournalLibrary"
                target="_blank"
                rel="noopener noreferrer"
                class="text-amber-400 hover:text-amber-300 underline font-mono flex items-center gap-1"
              >
                <span>+ Generate Token on GitHub (requires 'repo' scope)</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          <div>
            <label class="block text-xs font-mono uppercase text-stone-300 mb-1.5">
              Private Vault Repository Name
            </label>
            <input
              v-model="repoNameInput"
              type="text"
              placeholder="the-journal-vault"
              class="w-full px-3.5 py-2.5 bg-black/60 border border-stone-700 rounded-lg text-amber-100 text-xs font-mono focus:border-amber-500 focus:outline-none placeholder:text-stone-600 shadow-inner"
            />
            <p class="text-[11px] text-stone-500 font-serif mt-1">
              Will be automatically created as a <strong>private</strong> GitHub repository if it does not already exist.
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-xs text-rose-300 font-mono">
            ⚠️ {{ errorMessage }}
          </div>

          <!-- Action Buttons -->
          <div class="pt-3 flex items-center justify-between gap-3 border-t border-stone-800">
            <button
              type="button"
              class="px-4 py-2 text-xs rounded-lg text-stone-400 hover:text-stone-200 hover:bg-white/5 font-mono cursor-pointer transition"
              @click="handleClose"
            >
              Continue Offline
            </button>

            <button
              type="submit"
              class="px-6 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 tracking-wider uppercase font-serif-book shadow-lg transition cursor-pointer flex items-center gap-2 border border-amber-300/40 hover:scale-[1.02] active:scale-[0.98]"
              :disabled="isValidating"
            >
              <span v-if="isValidating" class="w-3.5 h-3.5 rounded-full border-2 border-stone-950 border-t-transparent animate-spin"></span>
              <span>{{ isValidating ? 'Connecting Vault...' : 'Connect & Sync Vault' }}</span>
            </button>
          </div>
        </form>

        <!-- Danger Zone: Reset & Clear Local Library -->
        <div v-if="hasLocalLibrary" class="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono">
          <span class="text-stone-500">Local Database:</span>
          <button
            type="button"
            class="text-stone-400 hover:text-rose-400 underline cursor-pointer transition flex items-center gap-1.5"
            @click="handleWipeAll"
          >
            <span>🗑️</span>
            <span>Reset & Clear Local Library</span>
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW B: GITHUB SOVEREIGN VAULT CONNECTED                                 -->
      <!-- ========================================================================= -->
      <div v-else class="space-y-5">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3.5 border-b border-stone-800">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-600/40 flex items-center justify-center text-lg">
              🐙
            </div>
            <div>
              <h2 class="text-lg font-serif-book font-bold text-amber-100">
                GitHub Sovereign Vault
              </h2>
              <span class="text-[11px] font-mono text-emerald-400">
                Active & Synced ✓
              </span>
            </div>
          </div>
          <button
            class="text-stone-400 hover:text-stone-200 text-lg p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition"
            @click="handleClose"
          >
            ✕
          </button>
        </div>

        <!-- GitHub Profile & Repository Info Card -->
        <div class="p-4 bg-black/40 rounded-xl border border-stone-800 space-y-3">
          <div class="flex items-center gap-3.5">
            <img
              v-if="session?.user?.avatar_url"
              :src="session.user.avatar_url"
              :alt="session.user.name || session.user.login"
              class="w-12 h-12 rounded-full border border-amber-500/50 shadow-md object-cover"
            />
            <div class="flex-1 min-w-0">
              <div class="font-serif-book font-bold text-amber-100 text-base truncate">
                {{ session?.user?.name || session?.user?.login }}
              </div>
              <div class="text-xs font-mono text-stone-400 truncate">
                @{{ session?.user?.login }}
              </div>
            </div>
            <a
              :href="`https://github.com/${session?.user?.login}/${session?.repoName || 'the-journal-vault'}`"
              target="_blank"
              rel="noopener noreferrer"
              class="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-mono flex items-center gap-1 transition"
            >
              <span>Repo</span>
              <span>↗</span>
            </a>
          </div>

          <div class="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono">
            <span class="text-stone-400">Private Git Vault:</span>
            <span class="text-amber-200 font-semibold">{{ session?.user?.login }}/{{ session?.repoName || 'the-journal-vault' }}</span>
          </div>
        </div>

        <!-- Manual Sync Controls -->
        <div class="p-4 bg-black/30 rounded-xl border border-stone-800 space-y-3">
          <div class="text-xs font-mono uppercase text-stone-400 flex items-center justify-between">
            <span>2-Way Cloud Synchronization</span>
            <span v-if="isSyncing" class="text-amber-300 font-mono text-[11px] animate-pulse">Syncing...</span>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif-book font-bold text-xs tracking-wider uppercase transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              :disabled="isSyncing"
              @click="handleManualSync"
            >
              <span>↻</span>
              <span>{{ isSyncing ? 'Syncing...' : 'Sync to GitHub' }}</span>
            </button>

            <button
              type="button"
              class="py-2.5 px-4 rounded-lg border border-stone-700 hover:border-stone-500 text-stone-300 text-xs font-mono transition cursor-pointer"
              :disabled="isSyncing"
              @click="handlePullFromGitHub"
            >
              Pull Remote
            </button>
          </div>
        </div>

        <!-- Disconnect & Danger Zone Options -->
        <div class="pt-3 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div class="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              class="text-stone-400 hover:text-stone-200 underline cursor-pointer transition"
              @click="handleDisconnectGitHub"
            >
              Disconnect Token Only
            </button>
            <span class="text-stone-600">•</span>
            <button
              type="button"
              class="text-rose-400/90 hover:text-rose-300 underline cursor-pointer transition flex items-center gap-1"
              @click="handleWipeAll"
            >
              <span>🗑️</span>
              <span>Logout & Wipe Local Data</span>
            </button>
          </div>

          <button
            type="button"
            class="px-3 py-1.5 rounded text-stone-300 hover:text-stone-100 hover:bg-white/5 font-mono cursor-pointer transition"
            @click="handleClose"
          >
            Close
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import {
  getStoredSession,
  saveSession,
  validateGitHubToken,
  ensureVaultRepo,
  type AuthSession,
} from '@/services/githubAuth'
import { syncEngine } from '@/services/gitSyncEngine'
import { db, provisionCleanLibrary } from '@/db'

const store = useLibraryStore()

const isOpen = computed(() => store.isAuthModalOpen)
const session = ref<AuthSession | null>(getStoredSession())
const hasLocalLibrary = computed(() => store.libraries.length > 0)

const tokenInput = ref('')
const repoNameInput = ref('the-journal-vault')

const isValidating = ref(false)
const isSyncing = ref(false)
const errorMessage = ref<string | null>(null)

const hasGitHubToken = computed(() => !!session.value?.token)

watch(isOpen, (val) => {
  if (val) {
    session.value = getStoredSession()
    errorMessage.value = null
  }
})

function handleClose() {
  store.closeAuthModal()
}

async function handleConnectGitHub() {
  if (!tokenInput.value.trim()) {
    errorMessage.value = 'Please enter your GitHub Personal Access Token.'
    return
  }

  isValidating.value = true
  errorMessage.value = null

  try {
    const user = await validateGitHubToken(tokenInput.value.trim())
    const repo = await ensureVaultRepo(tokenInput.value.trim(), repoNameInput.value.trim() || 'the-journal-vault')

    const newSession: AuthSession = {
      provider: 'github',
      token: tokenInput.value.trim(),
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.email,
        html_url: user.html_url,
      },
      repoName: repo.name,
      connectedAt: new Date().toISOString(),
    }

    saveSession(newSession)
    session.value = newSession
    store.refreshSession()
    tokenInput.value = ''

    // Ensure pristine clean library exists if empty
    const libCount = await db.libraries.count()
    if (libCount === 0) {
      await provisionCleanLibrary()
    }
    await store.loadAll()
    if (store.libraries.length > 0 && !store.currentLibraryId) {
      store.setLibrary(store.libraries[0].id)
    }

    // Initial sync
    await syncEngine.sync()
    store.closeAuthModal()
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'GitHub connection failed. Please check your token and scopes.'
  } finally {
    isValidating.value = false
  }
}

async function handleManualSync() {
  isSyncing.value = true
  try {
    await syncEngine.sync()
  } finally {
    isSyncing.value = false
  }
}

async function handlePullFromGitHub() {
  isSyncing.value = true
  try {
    await syncEngine.pullFromGitHub()
    await store.loadAll()
  } finally {
    isSyncing.value = false
  }
}

function handleDisconnectGitHub() {
  if (confirm('Disconnect GitHub Vault token? Your local journals and shelves will remain 100% intact in this browser.')) {
    store.logout()
    session.value = null
    store.closeAuthModal()
  }
}

async function handleWipeAll() {
  const confirmed = confirm(
    '⚠️ DANGER: Are you sure you want to completely wipe all local library data, shelves, books, and pages from this browser and sign out of GitHub? This action cannot be undone locally.'
  )
  if (confirmed) {
    await store.resetAndClearAll()
    session.value = null
  }
}
</script>
