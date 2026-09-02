<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="handleClose"
  >
    <div class="relative w-full max-w-lg bg-[#1c1612] border border-amber-900/40 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-stone-800 mb-5">
        <div class="flex items-center gap-2">
          <span class="text-xl">🐙</span>
          <h2 class="text-lg font-serif-book font-bold text-amber-100">
            GitHub as Database & Cloud Sync
          </h2>
        </div>
        <button class="text-stone-400 hover:text-stone-200 text-lg p-1" @click="handleClose">
          ✕
        </button>
      </div>

      <!-- State 1: Connected Session View -->
      <div v-if="session" class="space-y-5">
        <!-- User Profile Card -->
        <div class="flex items-center gap-4 p-4 bg-black/40 rounded-lg border border-stone-800">
          <img
            :src="session.user.avatar_url"
            :alt="session.user.login"
            class="w-12 h-12 rounded-full border border-amber-500/40 shadow-md"
          />
          <div class="flex-1 min-w-0">
            <div class="font-serif-book font-bold text-amber-100 text-base truncate">
              {{ session.user.name || session.user.login }}
            </div>
            <div class="text-xs font-mono text-stone-400 truncate">
              @{{ session.user.login }}
            </div>
          </div>
          <span class="px-2 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[11px] font-mono">
            Connected ✓
          </span>
        </div>

        <!-- Repository Vault Card -->
        <div class="p-4 bg-black/30 rounded-lg border border-stone-800 space-y-2">
          <div class="text-xs font-mono uppercase text-stone-400 flex items-center justify-between">
            <span>Storage Repository Vault</span>
            <span class="text-[10px] text-amber-400">Private</span>
          </div>
          <div class="font-mono text-sm text-amber-200 font-semibold truncate">
            {{ session.user.login }}/{{ session.repoName }}
          </div>
          <p class="text-[11px] text-stone-500">
            All libraries, shelves, books, and pages are stored as versioned JSON files directly in this repository.
          </p>
        </div>

        <!-- Linked Google Account Card -->
        <div class="p-4 bg-black/30 rounded-lg border border-stone-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase text-stone-400">Linked Google Account</span>
            <span v-if="session.linkedGoogleEmail" class="text-[10px] font-mono text-emerald-400">Linked ✓</span>
          </div>

          <div v-if="session.linkedGoogleEmail" class="flex items-center justify-between pt-1">
            <div class="text-xs font-mono text-stone-300">
              📧 {{ session.linkedGoogleEmail }}
            </div>
            <button
              type="button"
              class="text-xs text-rose-400 hover:text-rose-300 underline font-mono"
              @click="handleUnlinkGoogle"
            >
              Unlink
            </button>
          </div>

          <div v-else class="pt-1">
            <p class="text-[11px] text-stone-500 mb-2">
              Link your Google email to enable 1-click "Sign in with Google" on any device.
            </p>
            <button
              type="button"
              class="px-3 py-1.5 rounded border border-stone-700 bg-black/40 hover:bg-black/70 text-xs font-mono text-stone-200 transition flex items-center gap-2 cursor-pointer"
              @click="promptLinkGoogle"
            >
              <span>🔗</span> <span>Link Google Account</span>
            </button>
          </div>
        </div>

        <!-- Manual Sync Controls -->
        <div class="flex items-center gap-3 pt-2">
          <button
            type="button"
            class="flex-1 py-2 rounded bg-amber-600 hover:bg-amber-500 text-amber-100 font-serif-book font-bold text-xs tracking-wider uppercase transition shadow-md cursor-pointer"
            :disabled="isSyncing"
            @click="handleManualSync"
          >
            {{ isSyncing ? 'Syncing...' : '↻ Sync to GitHub Now' }}
          </button>

          <button
            type="button"
            class="py-2 px-4 rounded border border-stone-700 hover:border-stone-500 text-stone-300 text-xs font-mono transition cursor-pointer"
            :disabled="isSyncing"
            @click="handlePullFromGitHub"
          >
            Pull Remote
          </button>
        </div>

        <!-- Disconnect Button -->
        <div class="pt-3 text-center">
          <button
            type="button"
            class="text-xs text-stone-500 hover:text-rose-400 underline font-mono"
            @click="handleDisconnect"
          >
            Disconnect GitHub Account
          </button>
        </div>
      </div>

      <!-- State 2: Connect Form View -->
      <div v-else class="space-y-4">
        <p class="text-xs text-stone-400 leading-relaxed">
          Connect your GitHub account to store all your journals in a private repository. Your data remains 100% sovereign, free forever, with Git version control.
        </p>

        <!-- Personal Access Token Input -->
        <div>
          <label class="block text-xs font-mono uppercase text-stone-300 mb-1">
            GitHub Personal Access Token (PAT)
          </label>
          <input
            v-model="tokenInput"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            class="w-full px-3 py-2 bg-black/50 border border-stone-700 rounded text-amber-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
          />
          <div class="flex justify-between items-center mt-1 text-[11px]">
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=TheJournalLibrary"
              target="_blank"
              rel="noopener noreferrer"
              class="text-amber-400 hover:underline font-mono"
            >
              + Generate Token on GitHub (requires 'repo' scope) ↗
            </a>
          </div>
        </div>

        <!-- Repository Name Input -->
        <div>
          <label class="block text-xs font-mono uppercase text-stone-300 mb-1">
            Private Vault Repository Name
          </label>
          <input
            v-model="repoNameInput"
            type="text"
            placeholder="the-journal-vault"
            class="w-full px-3 py-2 bg-black/50 border border-stone-700 rounded text-amber-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
          />
          <p class="text-[11px] text-stone-500 mt-1">
            Will be created automatically as a private repository if it doesn't already exist.
          </p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-3 bg-rose-950/40 border border-rose-800 rounded text-xs text-rose-300 font-mono">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- Connect Action -->
        <div class="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-xs rounded text-stone-400 hover:text-stone-200 font-mono"
            @click="handleClose"
          >
            Cancel
          </button>

          <button
            type="button"
            class="px-5 py-2 text-xs font-bold rounded bg-amber-600 hover:bg-amber-500 text-amber-100 tracking-wider uppercase font-serif-book shadow-lg transition cursor-pointer flex items-center gap-2"
            :disabled="isValidating"
            @click="handleConnect"
          >
            <span v-if="isValidating" class="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            <span>{{ isValidating ? 'Connecting...' : 'Connect & Initialize Vault' }}</span>
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
  clearSession,
  validateGitHubToken,
  ensureVaultRepo,
  type AuthSession,
} from '@/services/githubAuth'
import { linkGoogleAccount, unlinkGoogleAccount } from '@/services/googleAuth'
import { syncEngine } from '@/services/gitSyncEngine'

const store = useLibraryStore()

const isOpen = computed(() => store.isAuthModalOpen)
const session = ref<AuthSession | null>(getStoredSession())

const tokenInput = ref('')
const repoNameInput = ref('the-journal-vault')
const isValidating = ref(false)
const isSyncing = ref(false)
const errorMessage = ref<string | null>(null)

watch(isOpen, (val) => {
  if (val) {
    session.value = getStoredSession()
    errorMessage.value = null
  }
})

function handleClose() {
  store.closeAuthModal()
}

async function handleConnect() {
  if (!tokenInput.value.trim()) {
    errorMessage.value = 'Please enter your GitHub token.'
    return
  }

  isValidating.value = true
  errorMessage.value = null

  try {
    const user = await validateGitHubToken(tokenInput.value.trim())
    const repo = await ensureVaultRepo(tokenInput.value.trim(), repoNameInput.value.trim() || 'the-journal-vault')

    const newSession: AuthSession = {
      token: tokenInput.value.trim(),
      user,
      repoName: repo.name,
      connectedAt: new Date().toISOString(),
    }

    saveSession(newSession)
    session.value = newSession
    tokenInput.value = ''

    // Initial sync
    await syncEngine.sync()
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Connection failed.'
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

function promptLinkGoogle() {
  const email = prompt('Enter your Google email address to link to this account:')
  if (email && email.includes('@')) {
    linkGoogleAccount(email.trim().toLowerCase())
    session.value = getStoredSession()
  }
}

function handleUnlinkGoogle() {
  if (confirm('Unlink Google account?')) {
    unlinkGoogleAccount()
    session.value = getStoredSession()
  }
}

function handleDisconnect() {
  if (confirm('Disconnect GitHub account? (Your local journals will remain saved in browser IndexedDB).')) {
    clearSession()
    session.value = null
  }
}
</script>
