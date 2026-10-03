export interface EthicalAdConfig {
  /** 'ethicalads' (EthicalAds network) | 'carbon' (Carbon Ads) | 'house' (curated indie/reading house ads fallback) */
  provider: 'ethicalads' | 'carbon' | 'house'
  /** EthicalAds client publisher ID (e.g. 'the-journal-library' or 'ea') */
  ethicalAdsPublisherId?: string
  /** Carbon Ads serve/placement property if applicable */
  carbonServeId?: string
  carbonPlacement?: string
  /** Whether ads are enabled by user settings */
  enabled: boolean
  /** Whether user is a patron / ad-free supporter */
  isAdFreeSupporter: boolean
}

export interface HouseSponsor {
  id: string
  title: string
  tagline: string
  description: string
  url: string
  callToAction: string
  badge: string
  icon: string
  accentColor: string
}

export const HOUSE_SPONSORS: HouseSponsor[] = [
  {
    id: 'fountain-pens',
    title: 'The Scribe’s Atelier',
    tagline: 'Handmade Brass Pens & Archival Ink',
    description: 'Elevate your tactile writing ritual with heirloom pens precision-milled from solid brass and aged walnut.',
    url: 'https://github.com/sponsors',
    callToAction: 'Discover Instruments',
    badge: 'Stationery Sponsor',
    icon: '✒️',
    accentColor: '#d97706',
  },
  {
    id: 'ethical-reading',
    title: 'Standard Ebooks',
    tagline: 'Free, Typographically Curated Classics',
    description: 'Beautifully formatted, open source public domain books prepared for discerning readers and scholars.',
    url: 'https://standardebooks.org',
    callToAction: 'Explore Classics',
    badge: 'Curated Reading',
    icon: '📚',
    accentColor: '#10b981',
  },
  {
    id: 'privacy-tools',
    title: 'Sovereign Digital Tools',
    tagline: 'Private, Local-First Knowledge Software',
    description: 'Protect your cognitive autonomy with independent, zero-telemetry tools that put you in ownership of your data.',
    url: 'https://github.com/sponsors',
    callToAction: 'Learn More',
    badge: 'Privacy Supporter',
    icon: '🛡️',
    accentColor: '#38bdf8',
  },
  {
    id: 'bindery-leather',
    title: 'Artisan Bookbinders Guild',
    tagline: 'Full-Grain Leather Refills & Notebooks',
    description: 'Hand-stitched Italian leather journal folios crafted to age with a rich patina over decades of daily musings.',
    url: 'https://github.com/sponsors',
    callToAction: 'View Folios',
    badge: 'Guild Partner',
    icon: '📖',
    accentColor: '#fbbf24',
  },
]

const STORAGE_KEY = 'the_journal_library_ad_settings'

export function getStoredAdConfig(): EthicalAdConfig {
  if (typeof localStorage === 'undefined') {
    return {
      provider: 'ethicalads',
      ethicalAdsPublisherId: 'the-journal-library',
      enabled: true,
      isAdFreeSupporter: false,
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore json error
  }

  return {
    provider: 'ethicalads',
    ethicalAdsPublisherId: 'the-journal-library',
    enabled: true,
    isAdFreeSupporter: false,
  }
}

export function saveStoredAdConfig(config: EthicalAdConfig): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // ignore
  }
}

/**
 * Dynamically loads the EthicalAds client script once if not present.
 */
let ethicalAdsScriptLoaded = false
export function loadEthicalAdsScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (ethicalAdsScriptLoaded || document.getElementById('ethicalads-js')) {
    ethicalAdsScriptLoaded = true
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.id = 'ethicalads-js'
    script.async = true
    script.src = 'https://media.ethicalads.io/media/client/ethicalads.min.js'
    script.onload = () => {
      ethicalAdsScriptLoaded = true
      resolve()
    }
    script.onerror = () => {
      // Fallback gracefully (e.g. adblocker or offline)
      resolve()
    }
    document.head.appendChild(script)
  })
}
