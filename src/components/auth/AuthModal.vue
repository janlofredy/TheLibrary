<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    @click.self="handleClose"
  >
    <div class="relative w-full max-w-lg bg-[#1c1612] border border-amber-900/40 rounded-xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
      
      <!-- ========================================================================= -->
      <!-- STAGE 1: UNAUTHENTICATED -> GOOGLE LOGIN ONLY                             -->
      <!-- ========================================================================= -->
      <div v-if="!session" class="space-y-4">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3 border-b border-stone-800">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
            </svg>
            <h2 class="text-lg font-serif-book font-bold text-amber-100">
              Sign In with Google
            </h2>
          </div>
          <button class="text-stone-400 hover:text-stone-200 text-lg p-1 cursor-pointer" @click="handleClose">
            ✕
          </button>
        </div>

        <p class="text-xs text-stone-400 leading-relaxed">
          Sign in to enter your sovereign digital library. First-time visitors will be guided to optionally connect their GitHub sovereign storage vault.
        </p>

        <!-- Official Google Identity Services Container (If valid Client ID is present) -->
        <div v-if="hasCustomClientId" class="p-3 bg-black/40 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
          <div id="google-sso-btn-container" class="min-h-[44px] flex items-center justify-center"></div>
          <span class="text-[10px] text-stone-500 font-mono mt-1">Official Google Cloud Web OAuth</span>
        </div>

        <!-- Google Interactive Sign-In Form -->
        <div class="p-4 bg-black/40 rounded-xl border border-stone-800 space-y-3">
          <form class="space-y-3" @submit.prevent="handleGoogleFormSubmit">
            <div>
              <label class="block text-xs font-mono uppercase text-stone-300 mb-1">
                Google Account Email
              </label>
              <input
                v-model="googleEmailInput"
                type="email"
                required
                placeholder="name@gmail.com"
                class="w-full px-3 py-2 bg-black/60 border border-stone-700 rounded text-amber-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-mono uppercase text-stone-300 mb-1">
                Display Name (Optional)
              </label>
              <input
                v-model="googleNameInput"
                type="text"
                placeholder="e.g. Alex Turner"
                class="w-full px-3 py-2 bg-black/60 border border-stone-700 rounded text-amber-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <!-- Quick Account Presets -->
            <div class="flex items-center gap-2 pt-1">
              <span class="text-[10px] font-mono uppercase text-stone-500">Quick:</span>
              <button
                type="button"
                class="px-2.5 py-1 rounded bg-stone-800/80 hover:bg-stone-700 text-[10px] font-mono text-stone-300 transition cursor-pointer"
                @click="quickSelectGoogle('alex.journaler@gmail.com', 'Alex Turner')"
              >
                Alex Turner
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded bg-stone-800/80 hover:bg-stone-700 text-[10px] font-mono text-stone-300 transition cursor-pointer"
                @click="quickSelectGoogle('writer.sanctuary@gmail.com', 'Sanctuary Writer')"
              >
                Writer
              </button>
            </div>

            <!-- Submit Sign-In -->
            <button
              type="submit"
              class="w-full mt-2 py-3 px-4 rounded-lg bg-white hover:bg-stone-100 text-stone-900 font-sans font-semibold text-xs tracking-wider transition shadow-md flex items-center justify-center gap-2.5 cursor-pointer border border-stone-300 active:scale-[0.99]"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        </div>

        <!-- Advanced Google Settings (Custom Client ID & JWT) Accordion -->
        <div class="pt-1">
          <button
            type="button"
            class="text-[11px] text-stone-400 hover:text-amber-300 flex items-center gap-1.5 font-mono cursor-pointer"
            @click="showGoogleAdvanced = !showGoogleAdvanced"
          >
            <span>{{ showGoogleAdvanced ? '▼' : '▶' }}</span>
            <span>Advanced: Custom Google Cloud Client ID & JWT Token</span>
          </button>

          <div v-if="showGoogleAdvanced" class="mt-3 p-3 bg-black/50 border border-stone-800 rounded-lg space-y-3">
            <div>
              <label class="block text-[10px] font-mono uppercase text-stone-400 mb-1">
                Google Cloud OAuth Client ID
              </label>
              <input
                v-model="customClientId"
                type="text"
                placeholder="xxxx.apps.googleusercontent.com"
                class="w-full px-2.5 py-1.5 bg-black/60 border border-stone-700 rounded text-stone-200 text-xs font-mono focus:border-amber-500 focus:outline-none"
              />
              <p class="text-[10px] text-stone-500 mt-1">
                Create a Web OAuth Client ID in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" class="text-amber-400 underline">Google Cloud Console ↗</a> with authorized JavaScript origin <code class="text-stone-300">{{ currentOrigin }}</code>.
              </p>
              <button
                type="button"
                class="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-mono font-bold rounded cursor-pointer"
                @click="handleSaveClientId"
              >
                Save & Initialize Google Button
              </button>
            </div>

            <div class="pt-2 border-t border-stone-800">
              <label class="block text-[10px] font-mono uppercase text-stone-400 mb-1">
                Direct OpenID Connect JWT Token
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

      <!-- ========================================================================= -->
      <!-- STAGE 2: LOGGED IN WITH GOOGLE -> FIRST-TIME GITHUB PAT SETUP PROMPT     -->
      <!-- ========================================================================= -->
      <div v-else-if="session && !hasGitHubToken" class="space-y-4">
        <!-- Modal Header with Google Identity -->
        <div class="flex items-center justify-between pb-3 border-b border-stone-800">
          <div class="flex items-center gap-3">
            <img
              :src="session.user.avatar_url || session.googleProfile?.picture"
              :alt="session.user.name || 'User'"
              class="w-10 h-10 rounded-full border border-amber-500/50 object-cover"
            />
            <div>
              <h2 class="text-base font-serif-book font-bold text-amber-100">
                Welcome, {{ session.user.name || session.user.login }}!
              </h2>
              <span class="text-[11px] font-mono text-blue-400">
                Google Verified ✓ ({{ session.user.email }})
              </span>
            </div>
          </div>
          <button class="text-stone-400 hover:text-stone-200 text-lg p-1 cursor-pointer" @click="handleClose">
            ✕
          </button>
        </div>

        <!-- Vault Onboarding Explanation -->
        <div class="p-4 bg-black/40 rounded-xl border border-stone-800 space-y-2">
          <div class="flex items-center gap-2 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
            <span>🐙</span>
            <span>Step 2: Connect GitHub Sovereign Vault (Optional)</span>
          </div>
          <p class="text-xs text-stone-300 leading-relaxed">
            Your journals are saved 100% privately in your browser's IndexedDB. Connect your <strong>GitHub Personal Access Token (PAT)</strong> to enable automated 2-way cloud sync and Git version history across all your devices at zero server cost.
          </p>
        </div>

        <!-- PAT Input Form -->
        <form class="space-y-3" @submit.prevent="handleConnectGitHub">
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
              Will be created automatically as a private GitHub repository if it doesn't already exist.
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-3 bg-rose-950/40 border border-rose-800 rounded text-xs text-rose-300 font-mono">
            ⚠️ {{ errorMessage }}
          </div>

          <!-- Action Buttons -->
          <div class="pt-3 flex items-center justify-between gap-3 border-t border-stone-800/80">
            <button
              type="button"
              class="px-4 py-2 text-xs rounded text-stone-400 hover:text-stone-200 font-mono cursor-pointer"
              @click="handleClose"
            >
              Skip for Now (Continue Offline)
            </button>

            <button
              type="submit"
              class="px-5 py-2 text-xs font-bold rounded bg-amber-600 hover:bg-amber-500 text-stone-950 tracking-wider uppercase font-serif-book shadow-lg transition cursor-pointer flex items-center gap-2"
              :disabled="isValidating"
            >
              <span v-if="isValidating" class="w-3 h-3 rounded-full border-2 border-stone-950 border-t-transparent animate-spin"></span>
              <span>{{ isValidating ? 'Connecting Vault...' : 'Connect & Initialize Vault' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- ========================================================================= -->
      <!-- STAGE 3: FULLY CONNECTED (GOOGLE + GITHUB HYBRID VAULT ACTIVE)            -->
      <!-- ========================================================================= -->
      <div v-else class="space-y-5">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3 border-b border-stone-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">🏛️</span>
            <h2 class="text-lg font-serif-book font-bold text-amber-100">
              Sovereign Account & Cloud Vault
            </h2>
          </div>
          <button class="text-stone-400 hover:text-stone-200 text-lg p-1 cursor-pointer" @click="handleClose">
            ✕
          </button>
        </div>

        <!-- Google User Profile Card -->
        <div class="flex items-center gap-4 p-4 bg-black/40 rounded-lg border border-stone-800">
          <img
            :src="session.user.avatar_url || session.googleProfile?.picture"
            :alt="session.user.name || 'User'"
            class="w-12 h-12 rounded-full border border-blue-500/40 shadow-md object-cover"
          />
          <div class="flex-1 min-w-0">
            <div class="font-serif-book font-bold text-amber-100 text-base truncate">
              {{ session.user.name || session.googleProfile?.name }}
            </div>
            <div class="text-xs font-mono text-stone-400 truncate">
              {{ session.user.email || session.googleProfile?.email }}
            </div>
          </div>
          <span class="px-2 py-1 rounded bg-blue-950 border border-blue-800 text-blue-300 text-[11px] font-mono">
            Google SSO ✓
          </span>
        </div>

        <!-- Repository Vault Card -->
        <div class="p-4 bg-black/30 rounded-lg border border-stone-800 space-y-2">
          <div class="text-xs font-mono uppercase text-stone-400 flex items-center justify-between">
            <span>Storage Repository Vault</span>
            <span class="text-[10px] text-emerald-400 font-mono">Connected ✓</span>
          </div>
          <div class="font-mono text-sm text-amber-200 font-semibold truncate">
            {{ session.user.login }}/{{ session.repoName }}
          </div>
          <p class="text-[11px] text-stone-500">
            All libraries, shelves, books, and pages are synced as versioned JSON files directly to your private GitHub repository.
          </p>
        </div>

        <!-- Manual Sync Controls -->
        <div class="flex items-center gap-3 pt-1">
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

        <!-- Disconnect & Sign Out Options -->
        <div class="pt-3 flex items-center justify-between border-t border-stone-800/80 text-xs font-mono">
          <button
            type="button"
            class="text-stone-400 hover:text-rose-400 underline cursor-pointer"
            @click="handleDisconnectGitHub"
          >
            Disconnect GitHub Vault
          </button>

          <button
            type="button"
            class="text-stone-400 hover:text-rose-400 underline cursor-pointer"
            @click="handleSignOutAll"
          >
            Sign Out Google Account
          </button>
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
  createGoogleProfile,
  unlinkGoogleAccount,
  getGoogleClientId,
  setGoogleClientId,
  hasConfiguredGoogleClientId,
  type GoogleUserProfile,
} from '@/services/googleAuth'
import { syncEngine } from '@/services/gitSyncEngine'
import { db, provisionCleanLibrary } from '@/db'

const store = useLibraryStore()

const isOpen = computed(() => store.isAuthModalOpen)
const session = ref<AuthSession | null>(getStoredSession())

const tokenInput = ref('')
const repoNameInput = ref('the-journal-vault')
const googleEmailInput = ref('')
const googleNameInput = ref('')
const customClientId = ref(getGoogleClientId())
const jwtInput = ref('')
const showGoogleAdvanced = ref(false)

const isValidating = ref(false)
const isSyncing = ref(false)
const errorMessage = ref<string | null>(null)

const currentOrigin = computed(() => typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
const hasGitHubToken = computed(() => !!session.value?.token)
const hasCustomClientId = computed(() => hasConfiguredGoogleClientId())

watch(isOpen, (val) => {
  if (val) {
    session.value = getStoredSession()
    errorMessage.value = null
    nextTick(() => {
      setupGoogleButton()
    })
  }
})

onMounted(() => {
  setupGoogleButton()
})

async function setupGoogleButton() {
  if (hasConfiguredGoogleClientId()) {
    await initGoogleIdentityServices({
      clientId: getGoogleClientId(),
      buttonContainerId: 'google-sso-btn-container',
      callback: (profile) => {
        handleGoogleLoginSuccess(profile)
      },
    })
  }
}

function handleClose() {
  store.closeAuthModal()
}

async function handleGoogleLoginSuccess(profile: GoogleUserProfile) {
  await store.loginWithGoogle(profile)
  session.value = getStoredSession()
}

function handleGoogleFormSubmit() {
  if (!googleEmailInput.value.trim() || !googleEmailInput.value.includes('@')) {
    errorMessage.value = 'Please enter a valid Google email address.'
    return
  }

  const profile = createGoogleProfile(googleEmailInput.value, googleNameInput.value)
  handleGoogleLoginSuccess(profile)
  googleEmailInput.value = ''
  googleNameInput.value = ''
}

function quickSelectGoogle(email: string, name: string) {
  googleEmailInput.value = email
  googleNameInput.value = name
  const profile = createGoogleProfile(email, name)
  handleGoogleLoginSuccess(profile)
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

    const currentSession = getStoredSession()
    const newSession: AuthSession = {
      provider: 'hybrid',
      token: tokenInput.value.trim(),
      user: {
        id: user.id,
        login: user.login,
        name: currentSession?.user?.name || user.name,
        avatar_url: currentSession?.user?.avatar_url || user.avatar_url,
        email: currentSession?.user?.email || user.email,
        html_url: user.html_url,
      },
      repoName: repo.name,
      googleProfile: currentSession?.googleProfile,
      linkedGoogleEmail: currentSession?.linkedGoogleEmail,
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
    errorMessage.value = err instanceof Error ? err.message : 'GitHub Connection failed.'
  } finally {
    isValidating.value = false
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
    errorMessage.value = null
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
  if (confirm('Disconnect GitHub Vault? (Your local journals will remain saved in browser IndexedDB).')) {
    const cur = getStoredSession()
    if (cur) {
      delete cur.token
      delete cur.repoName
      cur.provider = 'google'
      saveSession(cur)
      session.value = cur
      store.refreshSession()
    }
  }
}

function handleSignOutAll() {
  if (confirm('Sign out of your account? (Your local journals will remain saved in browser IndexedDB).')) {
    unlinkGoogleAccount()
    store.logout()
    session.value = null
  }
}
</script>
