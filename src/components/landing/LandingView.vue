<template>
  <div class="relative min-h-screen w-full bg-[#0d0906] text-stone-200 overflow-x-hidden select-none flex flex-col justify-between">
    <!-- Atmospheric Ambient Background & Light Fog Layer -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(217,119,6,0.18)_0%,rgba(15,10,6,0.95)_75%,#080503_100%)] pointer-events-none -z-20"></div>

    <!-- Floating Dust Motes Particles -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-40">
      <div
        v-for="i in 18"
        :key="i"
        class="absolute rounded-full bg-amber-200/60 blur-[0.5px] animate-float-particle"
        :style="getParticleStyle(i)"
      ></div>
    </div>

    <!-- Top Navigation Header -->
    <header class="w-full px-6 sm:px-12 py-6 flex items-center justify-between z-30">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-xl shadow-lg shadow-amber-950/50">
          📚
        </div>
        <div>
          <span class="font-serif-book font-bold text-lg sm:text-xl tracking-wider text-amber-100 block">
            The Journal Library
          </span>
          <span class="text-[10px] font-mono tracking-widest text-amber-400/80 uppercase">
            Sovereign Digital Sanctuary
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="px-4 py-2 text-xs font-mono tracking-wider rounded-lg border border-stone-700 bg-stone-900/60 hover:bg-stone-850 hover:border-amber-500/60 text-stone-300 hover:text-amber-200 transition cursor-pointer flex items-center gap-2"
          @click="store.enterGuestDemo()"
        >
          <span>👁️</span>
          <span>Explore Demo</span>
        </button>

        <button
          type="button"
          class="px-4 py-2 text-xs font-serif-book font-bold tracking-wider uppercase rounded-lg bg-amber-600 hover:bg-amber-500 text-amber-950 hover:text-black transition shadow-lg shadow-amber-950/40 cursor-pointer flex items-center gap-2"
          @click="store.openAuthModal()"
        >
          <span>Sign In</span>
          <span>→</span>
        </button>
      </div>
    </header>

    <!-- Hero Section: Grand Library Aisle 3D Perspective View -->
    <main class="relative flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 flex flex-col items-center justify-center text-center z-20">
      
      <!-- Center Plaque & Title -->
      <div class="relative max-w-3xl mx-auto mb-8 sm:mb-12">
        <!-- Brass Archway Crest -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#24170e]/90 border border-amber-600/40 text-amber-300 text-xs font-mono uppercase tracking-widest mb-4 shadow-md backdrop-blur-xs">
          <span>✨</span>
          <span>Tactile • Offline-First • Git-Backed Vaults</span>
        </div>

        <h1 class="text-4xl sm:text-6xl lg:text-7xl font-serif-book font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500/80 leading-[1.1] drop-shadow-md">
          Your Sovereign Sanctuary of Thought
        </h1>

        <p class="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-stone-300 font-serif leading-relaxed max-w-2xl mx-auto drop-shadow">
          Step into a warm, skeuomorphic personal library. Write daily reflections, sketch creative manuscripts, and organize volumes on physical wooden shelves — stored 100% privately in your browser and synced to your private Git vault.
        </p>

        <!-- CTA Action Hub -->
        <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
          <!-- Primary GitHub Auth Button -->
          <button
            type="button"
            class="px-6 py-3.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-serif-book font-bold text-sm sm:text-base tracking-wider uppercase transition shadow-xl shadow-amber-950/60 flex items-center gap-3 cursor-pointer group hover:scale-[1.02] active:scale-[0.98] border border-amber-300/40"
            @click="store.openAuthModal('github')"
          >
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span>Sign In with GitHub</span>
            <span class="text-xs opacity-75 font-mono">PAT</span>
          </button>

          <!-- Google SSO / Link Button -->
          <button
            type="button"
            class="px-5 py-3.5 rounded-xl bg-[#1c1612] hover:bg-[#251e19] text-stone-200 hover:text-amber-100 font-serif-book font-medium text-sm tracking-wider transition shadow-lg border border-stone-700 hover:border-amber-500/60 flex items-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            @click="store.openAuthModal('google')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
            </svg>
            <span>Sign In with Google</span>
          </button>

          <!-- Explore Demo Button -->
          <button
            type="button"
            class="px-5 py-3.5 rounded-xl bg-black/40 hover:bg-black/70 text-amber-200/90 hover:text-amber-100 font-mono text-xs tracking-wider uppercase transition border border-dashed border-amber-700/50 hover:border-amber-500 flex items-center gap-2 cursor-pointer"
            @click="store.enterGuestDemo()"
          >
            <span>🏛️</span>
            <span>Explore Demo Archive</span>
          </button>
        </div>
      </div>

      <!-- 3D Perspective Grand Library Aisle Corridor Scene -->
      <div class="relative w-full max-w-5xl my-4 py-8 sm:py-12 flex flex-col items-center">
        <!-- Aisle Corridor Container with 3D Depth -->
        <div class="relative w-full h-[280px] sm:h-[340px] rounded-2xl overflow-hidden border border-amber-900/40 shadow-2xl bg-[#140e0a] flex items-end justify-center">
          
          <!-- Vanishing Point Ceiling & Archway Perspective -->
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(245,158,11,0.25)_0%,rgba(20,13,8,0.95)_70%,#0a0704_100%)] pointer-events-none"></div>

          <!-- Distant Library Aisle Vanishing Archway -->
          <div class="absolute top-4 inset-x-1/4 h-24 border-t-2 border-x border-amber-600/20 rounded-t-full pointer-events-none opacity-40"></div>
          <div class="absolute top-10 inset-x-1/3 h-16 border-t border-x border-amber-500/20 rounded-t-full pointer-events-none opacity-30"></div>

          <!-- Left Wall Bookshelf Receding Wall -->
          <div class="absolute left-0 top-0 bottom-0 w-1/4 sm:w-1/3 bg-gradient-to-r from-[#1b120c] to-transparent pointer-events-none flex flex-col justify-around py-4 pl-4 opacity-80">
            <!-- Glowing Wall Sconces -->
            <div class="flex items-center gap-2">
              <div class="w-3 h-5 rounded-full bg-amber-400/90 shadow-[0_0_20px_#f59e0b] animate-pulse"></div>
              <div class="h-0.5 w-12 bg-amber-700/40"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-4 rounded-full bg-amber-400/80 shadow-[0_0_15px_#f59e0b] animate-pulse"></div>
              <div class="h-0.5 w-8 bg-amber-700/30"></div>
            </div>
          </div>

          <!-- Right Wall Bookshelf Receding Wall -->
          <div class="absolute right-0 top-0 bottom-0 w-1/4 sm:w-1/3 bg-gradient-to-l from-[#1b120c] to-transparent pointer-events-none flex flex-col justify-around py-4 pr-4 items-end opacity-80">
            <!-- Glowing Wall Sconces -->
            <div class="flex items-center gap-2">
              <div class="h-0.5 w-12 bg-amber-700/40"></div>
              <div class="w-3 h-5 rounded-full bg-amber-400/90 shadow-[0_0_20px_#f59e0b] animate-pulse"></div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-0.5 w-8 bg-amber-700/30"></div>
              <div class="w-2.5 h-4 rounded-full bg-amber-400/80 shadow-[0_0_15px_#f59e0b] animate-pulse"></div>
            </div>
          </div>

          <!-- Center Floor Runner Carpet (Burgundy Velvet with Gold Trim) -->
          <div class="absolute inset-x-1/4 bottom-0 h-40 bg-gradient-to-t from-[#5a1217] via-[#3d0d10] to-transparent border-x-2 border-amber-500/40 opacity-70 pointer-events-none transform origin-bottom [transform:perspective(500px)_rotateX(40deg)]">
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(217,119,6,0.3)_0%,transparent_80%)]"></div>
          </div>

          <!-- Foreground Interactive Showcase Shelf Plank -->
          <div class="relative w-full z-10 flex flex-col items-center">
            <!-- Three Tactile Showcase Books on Ledge -->
            <div class="flex items-end justify-center gap-4 sm:gap-8 mb-[-2px]">
              
              <!-- Book 1: Meditations (Burgundy Leather) -->
              <div
                class="group/b1 relative cursor-pointer transition-transform duration-300 hover:-translate-y-3 hover:rotate-[-2deg]"
                @click="store.enterGuestDemo()"
              >
                <div
                  class="w-12 sm:w-16 h-[180px] sm:h-[220px] rounded-t-sm shadow-2xl flex flex-col justify-between py-4 px-1.5 border-l border-t border-amber-300/30 spine-3d-lighting spine-finish-ribbed-leather"
                  style="background-color: #5c1b1b;"
                >
                  <div class="w-full h-1 bg-amber-400/40 rounded-full"></div>
                  <div class="font-serif-book font-bold text-[11px] sm:text-xs text-center text-amber-300 title-foil-gold [writing-mode:vertical-rl] rotate-180 truncate mx-auto tracking-widest uppercase">
                    Daily Reflections
                  </div>
                  <div class="text-[10px] text-center text-amber-400/60 font-mono">✦</div>
                </div>
                <!-- Tooltip on hover -->
                <div class="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-black/90 border border-amber-500/40 text-[10px] font-mono text-amber-200 opacity-0 group-hover/b1:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg">
                  Ribbed Leather & Gold Foil
                </div>
              </div>

              <!-- Book 2: Center Manuscript (Midnight Blue / Gold Filigree) -->
              <div
                class="group/b2 relative cursor-pointer transition-transform duration-300 hover:-translate-y-4 hover:scale-105"
                @click="store.enterGuestDemo()"
              >
                <div
                  class="w-14 sm:w-20 h-[200px] sm:h-[250px] rounded-t-sm shadow-2xl flex flex-col justify-between py-5 px-2 border-l border-t border-amber-200/40 spine-3d-lighting spine-finish-gold-foil"
                  style="background-color: #1a233a;"
                >
                  <div class="flex items-center justify-center text-amber-300 text-xs">🏛️</div>
                  <div class="font-serif-book font-bold text-xs sm:text-sm text-center text-amber-200 title-foil-gold [writing-mode:vertical-rl] rotate-180 truncate mx-auto tracking-wider uppercase">
                    Grand Archive
                  </div>
                  <div class="w-full h-1 bg-amber-400/40 rounded-full"></div>
                </div>
                <div class="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-black/90 border border-amber-500/40 text-[10px] font-mono text-amber-200 opacity-0 group-hover/b2:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg">
                  Gold Filigree Manuscript
                </div>
              </div>

              <!-- Book 3: Sketches & Musings (Forest Linen) -->
              <div
                class="group/b3 relative cursor-pointer transition-transform duration-300 hover:-translate-y-3 hover:rotate-[2deg]"
                @click="store.enterGuestDemo()"
              >
                <div
                  class="w-12 sm:w-16 h-[175px] sm:h-[210px] rounded-t-sm shadow-2xl flex flex-col justify-between py-4 px-1.5 border-l border-t border-emerald-300/30 spine-3d-lighting spine-finish-woven-cloth"
                  style="background-color: #1e382b;"
                >
                  <div class="w-full h-1 bg-emerald-400/30 rounded-full"></div>
                  <div class="font-serif-book font-bold text-[11px] sm:text-xs text-center text-emerald-100 title-foil-silver [writing-mode:vertical-rl] rotate-180 truncate mx-auto tracking-widest uppercase">
                    Creative Ideas
                  </div>
                  <div class="text-[10px] text-center text-emerald-300/60 font-mono">✦</div>
                </div>
                <div class="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-black/90 border border-amber-500/40 text-[10px] font-mono text-amber-200 opacity-0 group-hover/b3:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg">
                  Woven Linen & Silver
                </div>
              </div>

            </div>

            <!-- Foreground Wooden Shelf Lip & Brass Nameplate -->
            <div class="w-full h-8 sm:h-10 wood-walnut shelf-plank flex items-center justify-center px-4">
              <div class="px-6 py-0.5 rounded-sm plate-brass flex items-center gap-2 shadow-lg">
                <div class="w-1 h-1 rounded-full bg-black/40"></div>
                <span class="text-[10px] sm:text-xs font-serif-book font-bold tracking-widest uppercase">
                  Featured Vault Collections
                </span>
                <div class="w-1 h-1 rounded-full bg-black/40"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Grid Cards -->
      <div class="w-full max-w-5xl mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        <!-- Feature 1 -->
        <div class="p-4 sm:p-5 rounded-xl bg-[#18120d]/80 border border-stone-800/80 hover:border-amber-600/40 transition-colors shadow-lg">
          <div class="text-2xl mb-2">🏺</div>
          <h3 class="font-serif-book font-bold text-amber-100 text-sm mb-1">
            Tactile Skeuomorphism
          </h3>
          <p class="text-xs text-stone-400 leading-relaxed font-serif">
            Spine embossing, leather textures, metallic foil stamping, and natural 2D leaning book physics.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="p-4 sm:p-5 rounded-xl bg-[#18120d]/80 border border-stone-800/80 hover:border-amber-600/40 transition-colors shadow-lg">
          <div class="text-2xl mb-2">🔒</div>
          <h3 class="font-serif-book font-bold text-amber-100 text-sm mb-1">
            100% Offline-First
          </h3>
          <p class="text-xs text-stone-400 leading-relaxed font-serif">
            Stored directly in IndexedDB. Fully functional offline with zero trackers and zero telemetry.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="p-4 sm:p-5 rounded-xl bg-[#18120d]/80 border border-stone-800/80 hover:border-amber-600/40 transition-colors shadow-lg">
          <div class="text-2xl mb-2">🐙</div>
          <h3 class="font-serif-book font-bold text-amber-100 text-sm mb-1">
            Git-Backed Vault
          </h3>
          <p class="text-xs text-stone-400 leading-relaxed font-serif">
            Free forever multi-device sync with your private GitHub repository as your sovereign backend.
          </p>
        </div>

        <!-- Feature 4 -->
        <div class="p-4 sm:p-5 rounded-xl bg-[#18120d]/80 border border-stone-800/80 hover:border-amber-600/40 transition-colors shadow-lg">
          <div class="text-2xl mb-2">📜</div>
          <h3 class="font-serif-book font-bold text-amber-100 text-sm mb-1">
            Distraction-Free Desk
          </h3>
          <p class="text-xs text-stone-400 leading-relaxed font-serif">
            Tactile page turning, sepia parchment styles, markdown editing, and 1-click public sharing.
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="w-full py-6 text-center text-[11px] font-mono text-stone-500 border-t border-stone-900 z-20">
      <p>The Journal Library • Sovereign Digital Sanctuary • Open Source & Free Forever</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useLibraryStore } from '@/stores/libraryStore'

const store = useLibraryStore()

function getParticleStyle(index: number) {
  const left = ((index * 37) % 100)
  const top = ((index * 53) % 95)
  const size = 2 + (index % 4)
  const duration = 6 + (index % 7)
  const delay = (index % 5) * 0.7

  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  }
}
</script>

<style scoped>
@keyframes float-particle {
  0%, 100% {
    transform: translateY(0px) translateX(0px);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-25px) translateX(15px);
    opacity: 0.8;
  }
}

.animate-float-particle {
  animation: float-particle ease-in-out infinite;
}
</style>
