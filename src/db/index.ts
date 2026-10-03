import Dexie, { type Table } from 'dexie'
import type { Library, Shelf, Book, Page } from '@/types/journal'

export class JournalLibraryDB extends Dexie {
  libraries!: Table<Library, string>
  shelves!: Table<Shelf, string>
  books!: Table<Book, string>
  pages!: Table<Page, string>

  constructor() {
    super('JournalLibraryDB')
    this.version(1).stores({
      libraries: 'id, name, woodMaterial, createdAt, updatedAt',
      shelves: 'id, libraryId, name, order, createdAt, updatedAt',
      books: 'id, shelfId, title, slotIndex, layerMode, isFavorite, createdAt, updatedAt',
      pages: 'id, bookId, pageNumber, entryDate, createdAt, updatedAt',
    })
  }
}

export const db = new JournalLibraryDB()

export const DEMO_LIBRARY_ID = 'lib_grand_archive_demo'

/**
 * Provisions a pristine, empty personal library for newly starting users.
 * Contains 1 clean shelf and strictly 0 mock books.
 */
export async function provisionCleanLibrary(): Promise<Library> {
  const now = new Date().toISOString()
  const defaultLibraryId = `lib_${Date.now()}_personal`

  const defaultLibrary: Library = {
    id: defaultLibraryId,
    name: 'Personal Sanctuary',
    description: 'A private sanctum of personal reflections, journals, and thoughts.',
    woodMaterial: 'walnut',
    createdAt: now,
    updatedAt: now,
  }

  const defaultShelf: Shelf = {
    id: `shelf_${Date.now()}_main`,
    libraryId: defaultLibraryId,
    name: 'Main Shelf',
    nameplateStyle: 'brass',
    order: 0,
    createdAt: now,
    updatedAt: now,
  }

  await db.libraries.add(defaultLibrary)
  await db.shelves.add(defaultShelf)
  return defaultLibrary
}

/**
 * Seeds the Demo Archive library with 3 rich shelves, 9 distinct volumes, and populated pages.
 * Works seamlessly whether a local user library exists or not.
 */
export async function seedDemoArchive(): Promise<string> {
  const existing = await db.libraries.get(DEMO_LIBRARY_ID)
  if (existing) {
    const shelfCount = await db.shelves.where('libraryId').equals(DEMO_LIBRARY_ID).count()
    if (shelfCount >= 3) {
      return DEMO_LIBRARY_ID
    }
  }

  const now = new Date().toISOString()

  const demoLibrary: Library = {
    id: DEMO_LIBRARY_ID,
    name: 'The Grand Archive',
    description: 'A curated showcase of daily chronicles, creative manuscripts, and engineering codices.',
    woodMaterial: 'walnut',
    createdAt: now,
    updatedAt: now,
  }

  const shelves: Shelf[] = [
    {
      id: 'shelf_demo_daily_01',
      libraryId: DEMO_LIBRARY_ID,
      name: 'Daily Chronicles & Reflections',
      nameplateStyle: 'brass',
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'shelf_demo_creative_02',
      libraryId: DEMO_LIBRARY_ID,
      name: 'Creative Manuscripts & Fiction',
      nameplateStyle: 'bronze',
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'shelf_demo_engineering_03',
      libraryId: DEMO_LIBRARY_ID,
      name: 'Architecture & Engineering Log',
      nameplateStyle: 'silver',
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
  ]

  const books: Book[] = [
    // Shelf 1: Daily Reflections
    {
      id: 'bk_demo_2026_reflections',
      shelfId: 'shelf_demo_daily_01',
      title: '2026 Daily Reflections',
      subtitle: 'Volume I: Winter to Spring',
      spineColor: '#7a1c2f', // Crimson Burgundy
      spineStyle: 'ribbed-leather',
      titleColor: 'gold',
      titleFont: 'serif',
      ribbonColor: '#d4af37',
      hasRibbon: true,
      slotIndex: 0,
      layerMode: 'standing',
      stackOrder: 0,
      pageCount: 38,
      isFavorite: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'bk_demo_morning_pages',
      shelfId: 'shelf_demo_daily_01',
      title: 'Morning Pages & Meditations',
      subtitle: 'Stream of Consciousness',
      spineColor: '#1e3d2f', // Forest Green
      spineStyle: 'woven-cloth',
      titleColor: 'copper',
      titleFont: 'typewriter',
      ribbonColor: '#cd7f32',
      hasRibbon: false,
      slotIndex: 1,
      layerMode: 'standing',
      stackOrder: 0,
      pageCount: 16,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'bk_demo_stoic_notes',
      shelfId: 'shelf_demo_daily_01',
      title: 'Stoic Principles',
      subtitle: 'Daily Maxims',
      spineColor: '#1b2a47', // Deep Navy
      spineStyle: 'gold-foil',
      titleColor: 'gold',
      titleFont: 'roman',
      ribbonColor: '#e0e0e0',
      hasRibbon: true,
      slotIndex: 2,
      layerMode: 'leaning-right',
      stackOrder: 0,
      pageCount: 62,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'bk_demo_gratitude_log',
      shelfId: 'shelf_demo_daily_01',
      title: 'Gratitude & Joy',
      subtitle: 'Small Wonders',
      spineColor: '#a66a38', // Warm Ochre
      spineStyle: 'vintage-parchment',
      titleColor: 'black',
      titleFont: 'calligraphy',
      ribbonColor: '#8b4513',
      hasRibbon: false,
      slotIndex: 4,
      layerMode: 'standing',
      stackOrder: 0,
      pageCount: 6,
      createdAt: now,
      updatedAt: now,
    },

    // Shelf 2: Creative Manuscripts
    {
      id: 'bk_demo_novel_drafts',
      shelfId: 'shelf_demo_creative_02',
      title: 'The Silent Atlas',
      subtitle: 'Novel Draft - Book One',
      spineColor: '#2b1d3a', // Royal Purple
      spineStyle: 'gold-foil',
      titleColor: 'silver',
      titleFont: 'roman',
      ribbonColor: '#9370db',
      hasRibbon: true,
      slotIndex: 0,
      layerMode: 'standing',
      stackOrder: 0,
      pageCount: 45,
      isFavorite: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'bk_demo_poetry_collection',
      shelfId: 'shelf_demo_creative_02',
      title: 'Whispers in Amber',
      subtitle: 'Poems & Fragments',
      spineColor: '#8a4b27', // Terracotta
      spineStyle: 'woven-cloth',
      titleColor: 'white',
      titleFont: 'calligraphy',
      ribbonColor: '#e6c280',
      hasRibbon: false,
      slotIndex: 1,
      layerMode: 'leaning-left',
      stackOrder: 0,
      pageCount: 12,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'bk_demo_worldbuilding',
      shelfId: 'shelf_demo_creative_02',
      title: 'Codex Terranova',
      subtitle: 'Worldbuilding & Lore',
      spineColor: '#2d3748', // Charcoal Slate
      spineStyle: 'ribbed-leather',
      titleColor: 'copper',
      titleFont: 'serif',
      ribbonColor: '#c53030',
      hasRibbon: true,
      slotIndex: 3,
      layerMode: 'standing',
      stackOrder: 0,
      pageCount: 75,
      createdAt: now,
      updatedAt: now,
    },

    // Shelf 3: Engineering Log
    {
      id: 'bk_demo_system_architecture',
      shelfId: 'shelf_demo_engineering_03',
      title: 'System Architecture Codex',
      subtitle: 'Distributed Protocols',
      spineColor: '#1a365d', // Deep Cobalt
      spineStyle: 'modern-matte',
      titleColor: 'white',
      titleFont: 'typewriter',
      ribbonColor: '#3182ce',
      hasRibbon: true,
      slotIndex: 0,
      layerMode: 'standing',
      stackOrder: 0,
      pageCount: 28,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'bk_demo_algo_notebook',
      shelfId: 'shelf_demo_engineering_03',
      title: 'Algorithms & Data Models',
      subtitle: 'Research Logbook',
      spineColor: '#234e52', // Dark Teal
      spineStyle: 'modern-matte',
      titleColor: 'gold',
      titleFont: 'sans',
      ribbonColor: '#38b2ac',
      hasRibbon: false,
      slotIndex: 1,
      layerMode: 'standing',
      stackOrder: 0,
      pageCount: 20,
      createdAt: now,
      updatedAt: now,
    },
  ]

  const pages: Page[] = [
    // bk_demo_2026_reflections
    {
      id: 'pg_demo_reflections_01',
      bookId: 'bk_demo_2026_reflections',
      pageNumber: 1,
      title: 'The Sanctuary of Solitude',
      entryDate: now,
      paperStyle: 'lined',
      mood: 'great',
      tags: ['sanctuary', 'clarity', 'journaling'],
      wordCount: 142,
      content: `<h2>The Sanctuary of Solitude</h2><p>Today marks the first day of journaling in <strong>The Journal Library</strong>. In an era dominated by transient feeds and noisy notifications, stepping into this quiet room of walnut shelves feels like an exhale.</p><blockquote>"To write is to create an island of calm amid the ocean of chaos."</blockquote><p>I want to dedicate this volume to daily observations, creative clarity, and documenting small shifts in perspective over the coming year.</p>`,
      plainText: 'Today marks the first day of journaling in The Journal Library...',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pg_demo_reflections_02',
      bookId: 'bk_demo_2026_reflections',
      pageNumber: 2,
      title: 'Embers of Focus',
      entryDate: now,
      paperStyle: 'lined',
      mood: 'good',
      tags: ['deepwork', 'habits'],
      wordCount: 118,
      content: `<h2>Embers of Focus</h2><p>Spent three undisturbed hours this morning working with the ambient soundscapes on. Key realizations:</p><ul><li>Physical gestures like page turning create mental landmarks for remembering thoughts.</li><li>Writing without backspace friction unlocks associative thinking.</li></ul><p>Tomorrow: review the quarterly creative milestones.</p>`,
      plainText: 'Spent three undisturbed hours this morning working...',
      createdAt: now,
      updatedAt: now,
    },

    // bk_demo_morning_pages
    {
      id: 'pg_demo_morning_01',
      bookId: 'bk_demo_morning_pages',
      pageNumber: 1,
      title: 'Dawn Clarity & Stream of Consciousness',
      entryDate: now,
      paperStyle: 'dotted',
      mood: 'good',
      tags: ['morning', 'coffee', 'flow'],
      wordCount: 125,
      content: `<h2>Morning Light & Fresh Steam</h2><p>6:15 AM. The city is still sleeping beneath a blanket of dawn fog. Coffee is dark and hot in the ceramic mug.</p><p>Today's intention is simple: <em>execute without rushing, listen before deciding</em>. Clearing mental cobwebs before checking any external messages.</p>`,
      plainText: '6:15 AM. The city is still sleeping beneath a blanket of dawn fog...',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pg_demo_morning_02',
      bookId: 'bk_demo_morning_pages',
      pageNumber: 2,
      title: 'Mindful Breathing',
      entryDate: now,
      paperStyle: 'dotted',
      mood: 'great',
      tags: ['mindfulness', 'habits'],
      wordCount: 84,
      content: `<h2>Five Minutes of Stillness</h2><p>Inhale for four counts, hold for four, exhale for six. Notice how tension leaves the shoulders and jaw. The mind settles into a calm, steady rhythm.</p>`,
      plainText: 'Five Minutes of Stillness: Inhale for four counts...',
      createdAt: now,
      updatedAt: now,
    },

    // bk_demo_stoic_notes
    {
      id: 'pg_demo_stoic_01',
      bookId: 'bk_demo_stoic_notes',
      pageNumber: 1,
      title: 'Amor Fati - Embracing What Comes',
      entryDate: now,
      paperStyle: 'parchment',
      mood: 'neutral',
      tags: ['stoicism', 'philosophy', 'marcus-aurelius'],
      wordCount: 154,
      content: `<h2>The Principle of Amor Fati</h2><p>Marcus Aurelius wrote in his private notebooks:</p><blockquote>"A blazing fire makes flame and brightness out of everything that is thrown into it."</blockquote><p>Whatever obstacle presents itself during today's tasks is not a detour from the path — it is the material out of which patience and character are forged.</p>`,
      plainText: 'Marcus Aurelius wrote in his private notebooks...',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pg_demo_stoic_02',
      bookId: 'bk_demo_stoic_notes',
      pageNumber: 2,
      title: 'The Dichotomy of Control',
      entryDate: now,
      paperStyle: 'parchment',
      mood: 'good',
      tags: ['epictetus', 'stoicism'],
      wordCount: 110,
      content: `<h2>Within Our Power vs Beyond Our Power</h2><p>Epictetus reminds us that things in our control are our opinions, impulses, desires, and aversions. Everything else — reputation, outcomes, other people's choices — are externals.</p>`,
      plainText: 'Epictetus reminds us that things in our control...',
      createdAt: now,
      updatedAt: now,
    },

    // bk_demo_gratitude_log
    {
      id: 'pg_demo_gratitude_01',
      bookId: 'bk_demo_gratitude_log',
      pageNumber: 1,
      title: 'Three Daily Joys',
      entryDate: now,
      paperStyle: 'lined',
      mood: 'great',
      tags: ['gratitude', 'joy'],
      wordCount: 95,
      content: `<h2>Small Wonders</h2><ol><li>Warm sunlight casting amber squares across the wooden desk floor.</li><li>The satisfying mechanical click of fountain pen on textured paper.</li><li>A thoughtful message from an old friend across the globe.</li></ol>`,
      plainText: 'Small Wonders: Warm sunlight, mechanical click...',
      createdAt: now,
      updatedAt: now,
    },

    // bk_demo_novel_drafts
    {
      id: 'pg_demo_novel_01',
      bookId: 'bk_demo_novel_drafts',
      pageNumber: 1,
      title: 'Chapter I: The Clockwork Observatory',
      entryDate: now,
      paperStyle: 'parchment',
      mood: 'great',
      tags: ['fiction', 'chapter-1', 'worldbuilding'],
      wordCount: 180,
      content: `<h2>Chapter I: The Clockwork Observatory</h2><p>The astrolabe in the high tower groaned as the brass gears shifted into alignment with the midnight star. Elian dusted the silver caliper against his apron and adjusted the velvet telescope hood.</p><p>For seven centuries, the cartographers of the Northern Verge had believed the ocean ended where the azure mists began. But tonight, beneath three moons, an uncharted archipelago shone clearly in the lenses.</p>`,
      plainText: 'The astrolabe in the high tower groaned as the brass gears shifted...',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pg_demo_novel_02',
      bookId: 'bk_demo_novel_drafts',
      pageNumber: 2,
      title: 'Chapter II: Isle of Whispering Pines',
      entryDate: now,
      paperStyle: 'parchment',
      mood: 'good',
      tags: ['fiction', 'chapter-2'],
      wordCount: 140,
      content: `<h2>Chapter II: Isle of Whispering Pines</h2><p>The skiff scraped gently against the black volcanic pebble shore. Overhead, the canopy hummed with resonance, every needle vibrating like the string of an ancient cello in the coastal wind.</p>`,
      plainText: 'The skiff scraped gently against the black volcanic pebble shore...',
      createdAt: now,
      updatedAt: now,
    },

    // bk_demo_poetry_collection
    {
      id: 'pg_demo_poetry_01',
      bookId: 'bk_demo_poetry_collection',
      pageNumber: 1,
      title: 'Cobblestones in Amber',
      entryDate: now,
      paperStyle: 'parchment',
      mood: 'good',
      tags: ['poetry', 'autumn'],
      wordCount: 88,
      content: `<h2>Autumn in the Library</h2><p><em>Leaves of copper, rain on glass,<br>Shadows lengthen as hours pass.<br>Between the leather and the spine,<br>A universe of yours and mine.</em></p>`,
      plainText: 'Leaves of copper, rain on glass...',
      createdAt: now,
      updatedAt: now,
    },

    // bk_demo_worldbuilding
    {
      id: 'pg_demo_worldbuilding_01',
      bookId: 'bk_demo_worldbuilding',
      pageNumber: 1,
      title: 'Geography of the Sunken Provinces',
      entryDate: now,
      paperStyle: 'slate',
      mood: 'neutral',
      tags: ['lore', 'geography'],
      wordCount: 135,
      content: `<h2>The Sunken Provinces</h2><p>The continent of <strong>Terranova</strong> is bifurcated by the Great Obsidian Ridge. High-altitude trade winds allow glider caravans to travel between the sky-ports of Val-Doran and the lower salt plains in under four days.</p>`,
      plainText: 'The continent of Terranova is bifurcated by...',
      createdAt: now,
      updatedAt: now,
    },

    // bk_demo_system_architecture
    {
      id: 'pg_demo_system_01',
      bookId: 'bk_demo_system_architecture',
      pageNumber: 1,
      title: 'Local-First Sovereign Storage Model',
      entryDate: now,
      paperStyle: 'lined',
      mood: 'great',
      tags: ['architecture', 'git', 'offline-first'],
      wordCount: 165,
      content: `<h2>Local-First Offline Distributed Topology</h2><p>The core storage principle of <strong>The Journal Library</strong> combines <em>IndexedDB</em> for instant 0ms local mutation with <em>GitHub Trees API</em> for sovereign Git version history.</p><h3>Key Attributes:</h3><ul><li><strong>Zero Third-Party Vendor Lock-in</strong>: User retains 100% cryptographic sovereignty over their files.</li><li><strong>CRDT / Hybrid Resolution</strong>: Seamless multi-device synchronization without centralized lock engines.</li></ul>`,
      plainText: 'The core storage principle of The Journal Library...',
      createdAt: now,
      updatedAt: now,
    },

    // bk_demo_algo_notebook
    {
      id: 'pg_demo_algo_01',
      bookId: 'bk_demo_algo_notebook',
      pageNumber: 1,
      title: 'Physics & Sizing Calculations for Books',
      entryDate: now,
      paperStyle: 'dotted',
      mood: 'good',
      tags: ['math', 'algorithms'],
      wordCount: 120,
      content: `<h2>Tactile Book Spine Geometry</h2><p>Dynamic spine thickness is computed as a logarithmic function of page count:</p><pre><code>width = minSpine + log(pageCount + 1) * spineScaleFactor</code></pre><p>This ensures books with 5 pages look slender and fresh, while 80-page journals look majestic and authoritative on the shelf.</p>`,
      plainText: 'Dynamic spine thickness is computed as a logarithmic function...',
      createdAt: now,
      updatedAt: now,
    },
  ]

  await db.libraries.put(demoLibrary)
  await db.shelves.bulkPut(shelves)
  await db.books.bulkPut(books)
  await db.pages.bulkPut(pages)

  return DEMO_LIBRARY_ID
}

/**
 * Legacy compatibility alias for seedDemoArchive
 */
export async function seedInitialData(): Promise<void> {
  await seedDemoArchive()
}
