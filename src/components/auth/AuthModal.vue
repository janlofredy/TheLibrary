<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="handleClose"
  >
    <div class="relative w-full max-w-lg bg-[#1c1612] border border-amber-900/40 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
        <div class="flex items-center gap-2">
          <span class="text-xl">{{ activeTab === 'google' ? '🌐' : '🐙' }}</span>
          <h2 class="text-lg font-serif-book font-bold text-amber-100">
            Authentication & Cloud Vaults
          </h2>
        </div>
        <button class="text-stone-400 hover:text-stone-200 text-lg p-1 cursor-pointer" @click="handleClose">
          ✕
        </button>
      </div>

      <!-- Provider Tabs Header -->
      <div class="flex items-center gap-2 p-1 bg-black/40 rounded-lg border border-stone-800/80 mb-5">
        <button
          type="button"
          class="flex-1 py-2 rounded-md text-xs font-serif-book font-semibold tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'github' ? 'bg-amber-600 text-stone-950 shadow-md font-bold' : 'text-stone-400 hover:text-amber-200'"
          @click="activeTab = 'github'"
        >
          <span>🐙</span>
          <span>GitHub Vault</span>
          <span v-if="hasGitHubSession" class="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>

        <button
          type="button"
          class="flex-1 py-2 rounded-md text-xs font-serif-book font-semibold tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer"
          :class="activeTab === 'google' ? 'bg-amber-600 text-stone-950 shadow-md font-bold' : 'text-stone-400 hover:text-amber-200'"
          @click="activeTab = 'google'"
        >
          <span>🌐</span>
          <span>Google SSO</span>
          <span v-if="hasGoogleSession" class="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      </div>

      <!-- ============================================== -->
      <!-- TAB 1: GITHUB VAULT                            -->
      <!-- ============================================== -->
      <div v-if="activeTab === 'github'">
        <!-- State 1A: Connected GitHub Session View -->
        <div v-if="hasGitHubSession" class="space-y-5">
          <!-- User Profile Card -->
          <div class="flex items-center gap-4 p-4 bg-black/40 rounded-lg border border-stone-800">
            <img
              :src="session?.user.avatar_url"
              :alt="session?.user.login"
              class="w-12 h-12 rounded-full border border-amber-500/40 shadow-md"
            />
            <div class="flex-1 min-w-0">
              <div class="font-serif-book font-bold text-amber-100 text-base truncate">
                {{ session?.user.name || session?.user.login }}
              </div>
              <div class="text-xs font-mono text-stone-400 truncate">
                @{{ session?.user.login }}
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
              {{ session?.user.login }}/{{ session?.repoName }}
            </div>
            <p class="text-[11px] text-stone-500">
              All libraries, shelves, books, and pages are stored as versioned JSON files directly in this repository.
            </p>
          </div>

          <!-- Linked Google Account Indicator -->
          <div class="p-4 bg-black/30 rounded-lg border border-stone-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono uppercase text-stone-400">Linked Google SSO Identity</span>
              <span v-if="session?.linkedGoogleEmail" class="text-[10px] font-mono text-emerald-400">Linked ✓</span>
            </div>

            <div v-if="session?.linkedGoogleEmail" class="flex items-center justify-between pt-1">
              <div class="text-xs font-mono text-stone-300">
                📧 {{ session?.linkedGoogleEmail }}
              </div>
              <button
                type="button"
                class="text-xs text-rose-400 hover:text-rose-300 underline font-mono cursor-pointer"
                @click="handleUnlinkGoogle"
              >
                Unlink
              </button>
            </div>

            <div v-else class="pt-1">
              <p class="text-[11px] text-stone-500 mb-2">
                Link your Google account to enable 1-click login on mobile without re-entering your GitHub token.
              </p>
              <button
                type="button"
                class="px-3 py-1.5 rounded border border-stone-700 bg-black/40 hover:bg-black/70 text-xs font-mono text-stone-200 transition flex items-center gap-2 cursor-pointer"
                @click="activeTab = 'google'"
              >
                <span>🔗</span> <span>Link Google Account</span>
              </button>
            </div>
          </div>

          <!-- Manual Sync Controls -->
          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              class="flex-1 py-2 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif-book font-bold text-xs tracking-wider uppercase transition shadow-md cursor-pointer"
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
              class="text-xs text-stone-500 hover:text-rose-400 underline font-mono cursor-pointer"
              @click="handleDisconnect"
            >
              Disconnect GitHub Account
            </button>
          </div>
        </div>

        <!-- State 1B: Connect GitHub Form View -->
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
              class="px-4 py-2 text-xs rounded text-stone-400 hover:text-stone-200 font-mono cursor-pointer"
              @click="handleClose"
            >
              Cancel
            </button>

            <button
              type="button"
              class="px-5 py-2 text-xs font-bold rounded bg-amber-600 hover:bg-amber-500 text-stone-950 tracking-wider uppercase font-serif-book shadow-lg transition cursor-pointer flex items-center gap-2"
              :disabled="isValidating"
              @click="handleConnectGitHub"
            >
              <span v-if="isValidating" class="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              <span>{{ isValidating ? 'Connecting...' : 'Connect & Initialize Vault' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- TAB 2: GOOGLE SSO                              -->
      <!-- ============================================== -->
      <div v-else-if="activeTab === 'google'" class="space-y-5">
        <!-- State 2A: Connected Google Session View -->
        <div v-if="hasGoogleSession" class="space-y-5">
          <!-- Google User Profile Card -->
          <div class="flex items-center gap-4 p-4 bg-black/40 rounded-lg border border-stone-800">
            <img
              v-if="session?.googleProfile?.picture || session?.user.avatar_url"
              :src="session?.googleProfile?.picture || session?.user.avatar_url"
              :alt="session?.googleProfile?.name || 'Google User'"
              class="w-12 h-12 rounded-full border border-blue-500/40 shadow-md"
            />
            <div v-else class="w-12 h-12 rounded-full bg-blue-950 border border-blue-500/40 flex items-center justify-center text-xl">
              🌐
            </div>

            <div class="flex-1 min-w-0">
              <div class="font-serif-book font-bold text-amber-100 text-base truncate">
                {{ session?.googleProfile?.name || session?.user.name }}
              </div>
              <div class="text-xs font-mono text-stone-400 truncate">
                {{ session?.googleProfile?.email || session?.linkedGoogleEmail || session?.user.email }}
              </div>
            </div>
            <span class="px-2 py-1 rounded bg-blue-950 border border-blue-800 text-blue-300 text-[11px] font-mono">
              Google Verified ✓
            </span>
          </div>

          <!-- Storage Vault Association Card -->
          <div class="p-4 bg-black/30 rounded-lg border border-stone-800 space-y-2">
            <div class="text-xs font-mono uppercase text-stone-400 flex items-center justify-between">
              <span>Sovereign Storage Mode</span>
              <span class="text-[10px]" :class="hasGitHubSession ? 'text-emerald-400' : 'text-amber-400'">
                {{ hasGitHubSession ? 'Git Vault Synced' : 'Offline IndexedDB' }}
              </span>
            </div>

            <div v-if="hasGitHubSession" class="font-mono text-xs text-amber-200 truncate">
              Bound to GitHub Vault: <strong>{{ session?.user.login }}/{{ session?.repoName }}</strong>
            </div>
            <div v-else class="text-[11px] text-stone-400 leading-relaxed">
              Your journals are stored 100% privately in your browser's IndexedDB. You can also connect a GitHub repository in the GitHub tab to enable automatic cloud backup.
            </div>
          </div>

          <!-- Google Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button
              v-if="!hasGitHubSession"
              type="button"
              class="flex-1 py-2 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif-book font-bold text-xs tracking-wider uppercase transition shadow-md cursor-pointer flex items-center justify-center gap-2"
              @click="activeTab = 'github'"
            >
              <span>🐙</span>
              <span>Connect GitHub Cloud Vault</span>
            </button>

            <button
              type="button"
              class="py-2 px-4 rounded border border-stone-700 hover:border-rose-500/60 text-rose-300 hover:text-rose-200 text-xs font-mono transition cursor-pointer"
              @click="handleUnlinkGoogle"
            >
              Sign Out Google
            </button>
          </div>
        </div>

        <!-- State 2B: Google Login Portal -->
        <div v-else class="space-y-4">
          <p class="text-xs text-stone-400 leading-relaxed">
            Sign in with Google to access your sovereign sanctuary on any device without configuring access tokens.
          </p>

          <!-- Official Google Identity Services Container -->
          <div class="p-4 bg-black/40 rounded-xl border border-stone-800 flex flex-col items-center justify-center space-y-3">
            <div id="google-sso-btn-container" class="min-h-[44px] flex items-center justify-center"></div>

            <!-- 1-Click Interactive Google Sign-In Trigger -->
            <button
              type="button"
              class="w-full py-3 px-4 rounded-lg bg-white hover:bg-stone-100 text-stone-900 font-sans font-semibold text-xs tracking-wider transition shadow-md flex items-center justify-center gap-3 cursor-pointer border border-stone-300"
              @click="promptGoogleOneTapLogin"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
              </svg>
              <span>Continue with Google Account</span>
            </button>
          </div>

          <!-- Advanced Google Settings (Custom Client ID) Accordion -->
          <div class="pt-2">
            <button
              type="button"
              class="text-[11px] text-stone-400 hover:text-amber-300 flex items-center gap-1.5 font-mono cursor-pointer"
              @click="showGoogleAdvanced = !showGoogleAdvanced"
            >
              <span>{{ showGoogleAdvanced ? '▼' : '▶' }}</span>
              <span>Advanced: Custom Google OAuth Client ID & JWT</span>
            </button>

            <div v-if="showGoogleAdvanced" class="mt-3 p-3 bg-black/50 border border-stone-800 rounded-lg space-y-3">
              <div>
                <label class="block text-[10px] font-mono uppercase text-stone-400 mb-1">
                  Google Client ID (Optional)
                </label>
                <input
                  v-model="customClientId"
                  type="text"
                  placeholder="xxxx.apps.googleusercontent.com"
                  class="w-full px-2.5 py-1.5 bg-black/60 border border-stone-700 rounded text-stone-200 text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  class="mt-1.5 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-[10px] font-mono text-stone-300 rounded cursor-pointer"
                  @click="handleSaveClientId"
                >
                  Save Client ID
                </button>
              </div>

              <div>
                <label class="block text-[10px] font-mono uppercase text-stone-400 mb-1">
                  Paste Direct Google JWT Credential
                </label>
                <div class="flex gap-2">
                  <input
                    v-model="jwtInput"
                    type="password"
                    placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
                    class="flex-1 px-2.5 py-1.5 bg-black/60 border border-stone-700 rounded text-stone-200 text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-mono text-xs rounded font-bold cursor-pointer"
                    @click="handleManualJwtLogin"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-3 bg-rose-950/40 border border-rose-800 rounded text-xs text-rose-300 font-mono">
            ⚠️ {{ errorMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useLibraryStore } from '@/stores/libraryStore'
import {
  getStoredSession,
  saveSession,
  validateGitHubToken,
  ensureVaultRepo,
  type AuthSession,
} from '@/services/githubAuth'
import {
  initGoogleIdentityServices,
  parseGoogleJwt,
  linkGoogleProfile,
  unlinkGoogleAccount,
  getGoogleClientId,
  setGoogleClientId,
  type GoogleUserProfile,
} from '@/services/googleAuth'
import { syncEngine } from '@/services/gitSyncEngine'
import { db, provisionCleanLibrary } from '@/db'

const store = useLibraryStore()

const isOpen = computed(() => store.isAuthModalOpen)
const activeTab = ref<'github' | 'google'>(store.activeAuthTab || 'github')
const session = ref<AuthSession | null>(getStoredSession())

const tokenInput = ref('')
const repoNameInput = ref('the-journal-vault')
const customClientId = ref(getGoogleClientId())
const jwtInput = ref('')
const showGoogleAdvanced = ref(false)

const isValidating = ref(false)
const isSyncing = ref(false)
const errorMessage = ref<string | null>(null)

const hasGitHubSession = computed(() => !!session.value?.token)
const hasGoogleSession = computed(() => !!session.value?.googleProfile || !!session.value?.linkedGoogleEmail || session.value?.provider === 'google')

watch(isOpen, (val) => {
  if (val) {
    session.value = getStoredSession()
    activeTab.value = store.activeAuthTab || 'github'
    errorMessage.value = null
    nextTick(() => {
      setupGoogleButton()
    })
  }
})

watch(activeTab, (tab) => {
  if (tab === 'google') {
    nextTick(() => {
      setupGoogleButton()
    })
  }
})

onMounted(() => {
  setupGoogleButton()
})

async function setupGoogleButton() {
  await initGoogleIdentityServices({
    clientId: getGoogleClientId(),
    buttonContainerId: 'google-sso-btn-container',
    callback: (profile) => {
      handleGoogleLoginSuccess(profile)
    },
  })
}

function handleClose() {
  store.closeAuthModal()
}

async function handleConnectGitHub() {
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
      provider: session.value?.googleProfile ? 'hybrid' : 'github',
      token: tokenInput.value.trim(),
      user,
      repoName: repo.name,
      googleProfile: session.value?.googleProfile,
      linkedGoogleEmail: session.value?.linkedGoogleEmail,
      connectedAt: new Date().toISOString(),
    }

    saveSession(newSession)
    session.value = newSession
    store.refreshSession()
    tokenInput.value = ''

    // Ensure pristine library exists if empty
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
    errorMessage.value = err instanceof Error ? err.message : 'Connection failed.'
  } finally {
    isValidating.value = false
  }
}

async function handleGoogleLoginSuccess(profile: GoogleUserProfile) {
  if (session.value?.token) {
    // If user is already connected via GitHub, link the Google profile (Hybrid mode)
    linkGoogleProfile(profile)
    session.value = getStoredSession()
    store.refreshSession()
  } else {
    // Pure Google SSO login
    await store.loginWithGoogle(profile)
    session.value = getStoredSession()
  }
}

function promptGoogleOneTapLogin() {
  const email = prompt('Enter your Google email address for 1-Click Sign-In:', session.value?.linkedGoogleEmail || '')
  if (email && email.includes('@')) {
    const defaultName = email.split('@')[0]
    const profile: GoogleUserProfile = {
      sub: `google_${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      email_verified: true,
    }
    handleGoogleLoginSuccess(profile)
  }
}

function handleManualJwtLogin() {
  if (!jwtInput.value.trim()) return
  try {
    const profile = parseGoogleJwt(jwtInput.value.trim())
    handleGoogleLoginSuccess(profile)
    jwtInput.value = ''
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Invalid Google JWT'
  }
}

function handleSaveClientId() {
  if (customClientId.value.trim()) {
    setGoogleClientId(customClientId.value.trim())
    setupGoogleButton()
    alert('Google Client ID saved successfully.')
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

function handleUnlinkGoogle() {
  if (confirm('Sign out / unlink Google account?')) {
    unlinkGoogleAccount()
    session.value = getStoredSession()
    store.refreshSession()
    if (!session.value?.token) {
      store.logout()
    }
  }
}

function handleDisconnect() {
  if (confirm('Disconnect GitHub account? (Your local journals will remain saved in browser IndexedDB).')) {
    store.logout()
    session.value = null
  }
}
</script>
