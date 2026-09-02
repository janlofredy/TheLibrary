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

/**
 * Seeds the database with rich initial sample journals and shelves for instant interactive testing.
 */
export async function seedInitialData(): Promise<void> {
  const libraryCount = await db.libraries.count()
  if (libraryCount > 0) return

  const now = new Date().toISOString()
  const defaultLibraryId = 'lib_grand_archive_01'

  const defaultLibrary: Library = {
    id: defaultLibraryId,
    name: 'The Grand Archive',
    description: 'A curated sanctum of personal thoughts, philosophy, and creative records.',
    woodMaterial: 'walnut',
    createdAt: now,
    updatedAt: now,
  }

  const shelves: Shelf[] = [
    {
      id: 'shelf_daily_01',
      libraryId: defaultLibraryId,
      name: 'Daily Chronicles & Reflections',
      nameplateStyle: 'brass',
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'shelf_creative_02',
      libraryId: defaultLibraryId,
      name: 'Creative Manuscripts & Fiction',
      nameplateStyle: 'bronze',
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'shelf_engineering_03',
      libraryId: defaultLibraryId,
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
      id: 'bk_2026_reflections_a8f9',
      shelfId: 'shelf_daily_01',
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
      pageCount: 38, // Thick book
      isFavorite: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'bk_morning_pages_c3d2',
      shelfId: 'shelf_daily_01',
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
      pageCount: 16, // Medium book
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'bk_stoic_notes_e4f1',
      shelfId: 'shelf_daily_01',
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
      pageCount: 62, // Very thick book
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'bk_gratitude_log_b7a5',
      shelfId: 'shelf_daily_01',
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
      pageCount: 6, // Slim fresh volume
      createdAt: now,
      updatedAt: now,
    },

    // Shelf 2: Creative Manuscripts
    {
      id: 'bk_novel_drafts_9f81',
      shelfId: 'shelf_creative_02',
      title: 'The Silent Atlas',
      subtitle: 'Novel Draft - Book One',
      spineColor: '#2b1d3a', // Royal Purple / Dark Plum
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
      id: 'bk_poetry_collection_4a2c',
      shelfId: 'shelf_creative_02',
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
      id: 'bk_worldbuilding_d8e0',
      shelfId: 'shelf_creative_02',
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
      id: 'bk_system_architecture_11f4',
      shelfId: 'shelf_engineering_03',
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
      id: 'bk_algo_notebook_7b9a',
      shelfId: 'shelf_engineering_03',
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

  const samplePages: Page[] = [
    {
      id: 'pg_reflections_001',
      bookId: 'bk_2026_reflections_a8f9',
      pageNumber: 1,
      title: 'Setting Up The Library Sanctuary',
      entryDate: now,
      paperStyle: 'lined',
      mood: 'great',
      tags: ['library', 'journaling', 'clarity'],
      wordCount: 260,
      content: 'Today marks the first day of journaling in The Journal Library. The physical bookshelf feel brings a grounded warmth back to digital writing.',
      createdAt: now,
      updatedAt: now,
    },
  ]

  await db.libraries.add(defaultLibrary)
  await db.shelves.bulkAdd(shelves)
  await db.books.bulkAdd(books)
  await db.pages.bulkAdd(samplePages)
}
