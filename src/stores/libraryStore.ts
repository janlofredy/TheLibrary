import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, seedInitialData } from '@/db'
import type { Library, Shelf, Book, WoodMaterial, NameplateStyle, SpineStyle, TitleColor, TitleFont, LayerMode } from '@/types/journal'

export const useLibraryStore = defineStore('library', () => {
  const isLoading = ref(true)
  const libraries = ref<Library[]>([])
  const currentLibraryId = ref<string>('')
  const shelves = ref<Shelf[]>([])
  const books = ref<Book[]>([])

  // UI Modals state
  const isBookCustomizerOpen = ref(false)
  const isShelfModalOpen = ref(false)
  const isLibraryModalOpen = ref(false)
  
  const editingBook = ref<Book | null>(null)
  const targetShelfIdForNewBook = ref<string | null>(null)
  const editingShelf = ref<Shelf | null>(null)
  const activeOpenedBookId = ref<string | null>(null)

  // Getters
  const currentLibrary = computed(() => {
    return libraries.value.find(lib => lib.id === currentLibraryId.value) || libraries.value[0] || null
  })

  const currentShelves = computed(() => {
    if (!currentLibrary.value) return []
    return shelves.value
      .filter(s => s.libraryId === currentLibrary.value.id)
      .sort((a, b) => a.order - b.order)
  })

  const getBooksForShelf = (shelfId: string) => {
    return books.value
      .filter(b => b.shelfId === shelfId)
      .sort((a, b) => a.slotIndex - b.slotIndex || a.stackOrder - b.stackOrder)
  }

  const libraryStats = computed(() => {
    const shelfIds = new Set(currentShelves.value.map(s => s.id))
    const libraryBooks = books.value.filter(b => shelfIds.has(b.shelfId))
    const totalPages = libraryBooks.reduce((acc, b) => acc + (b.pageCount || 0), 0)
    
    return {
      shelvesCount: currentShelves.value.length,
      booksCount: libraryBooks.length,
      pagesCount: totalPages,
    }
  })

  // Actions
  async function init() {
    isLoading.value = true
    try {
      await seedInitialData()
      await loadAll()
      if (libraries.value.length > 0 && !currentLibraryId.value) {
        currentLibraryId.value = libraries.value[0].id
      }
    } finally {
      isLoading.value = false
    }
  }

  async function loadAll() {
    libraries.value = await db.libraries.toArray()
    shelves.value = await db.shelves.toArray()
    books.value = await db.books.toArray()
  }

  function setLibrary(id: string) {
    currentLibraryId.value = id
  }

  async function createLibrary(data: { name: string; description?: string; woodMaterial: WoodMaterial }) {
    const now = new Date().toISOString()
    const newLib: Library = {
      id: `lib_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      description: data.description,
      woodMaterial: data.woodMaterial,
      createdAt: now,
      updatedAt: now,
    }

    await db.libraries.add(newLib)
    libraries.value.push(newLib)
    currentLibraryId.value = newLib.id

    // Create a starter shelf
    await createShelf(newLib.id, 'My First Shelf', 'brass')
    return newLib
  }

  async function updateLibrary(id: string, updates: Partial<Library>) {
    const now = new Date().toISOString()
    await db.libraries.update(id, { ...updates, updatedAt: now })
    const index = libraries.value.findIndex(l => l.id === id)
    if (index !== -1) {
      libraries.value[index] = { ...libraries.value[index], ...updates, updatedAt: now }
    }
  }

  async function deleteLibrary(id: string) {
    if (libraries.value.length <= 1) return // Keep at least one

    const libraryShelves = shelves.value.filter(s => s.libraryId === id)
    for (const shelf of libraryShelves) {
      await deleteShelf(shelf.id)
    }

    await db.libraries.delete(id)
    libraries.value = libraries.value.filter(l => l.id !== id)
    if (currentLibraryId.value === id && libraries.value.length > 0) {
      currentLibraryId.value = libraries.value[0].id
    }
  }

  async function createShelf(libraryId: string, name: string, nameplateStyle: NameplateStyle = 'brass') {
    const now = new Date().toISOString()
    const shelfCount = shelves.value.filter(s => s.libraryId === libraryId).length
    const newShelf: Shelf = {
      id: `shelf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      libraryId,
      name,
      nameplateStyle,
      order: shelfCount,
      createdAt: now,
      updatedAt: now,
    }

    await db.shelves.add(newShelf)
    shelves.value.push(newShelf)
    return newShelf
  }

  async function updateShelf(id: string, updates: Partial<Shelf>) {
    const now = new Date().toISOString()
    await db.shelves.update(id, { ...updates, updatedAt: now })
    const index = shelves.value.findIndex(s => s.id === id)
    if (index !== -1) {
      shelves.value[index] = { ...shelves.value[index], ...updates, updatedAt: now }
    }
  }

  async function deleteShelf(id: string) {
    const shelfBooks = books.value.filter(b => b.shelfId === id)
    for (const book of shelfBooks) {
      await deleteBook(book.id)
    }

    await db.shelves.delete(id)
    shelves.value = shelves.value.filter(s => s.id !== id)
  }

  async function createBook(bookData: {
    shelfId: string
    title: string
    subtitle?: string
    spineColor: string
    spineStyle: SpineStyle
    titleColor: TitleColor
    titleFont: TitleFont
    ribbonColor: string
    hasRibbon: boolean
    layerMode: LayerMode
    slotIndex?: number
  }) {
    const now = new Date().toISOString()
    const shelfBooks = getBooksForShelf(bookData.shelfId)
    const slotIndex = bookData.slotIndex !== undefined ? bookData.slotIndex : shelfBooks.length

    const newBook: Book = {
      id: `bk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      shelfId: bookData.shelfId,
      title: bookData.title,
      subtitle: bookData.subtitle,
      spineColor: bookData.spineColor,
      spineStyle: bookData.spineStyle,
      titleColor: bookData.titleColor,
      titleFont: bookData.titleFont,
      ribbonColor: bookData.ribbonColor,
      hasRibbon: bookData.hasRibbon,
      slotIndex,
      layerMode: bookData.layerMode,
      stackOrder: 0,
      pageCount: 1,
      createdAt: now,
      updatedAt: now,
    }

    await db.books.add(newBook)
    books.value.push(newBook)
    return newBook
  }

  async function updateBook(id: string, updates: Partial<Book>) {
    const now = new Date().toISOString()
    await db.books.update(id, { ...updates, updatedAt: now })
    const index = books.value.findIndex(b => b.id === id)
    if (index !== -1) {
      books.value[index] = { ...books.value[index], ...updates, updatedAt: now }
    }
  }

  async function deleteBook(id: string) {
    await db.pages.where('bookId').equals(id).delete()
    await db.books.delete(id)
    books.value = books.value.filter(b => b.id !== id)
  }

  // Modal helpers
  function openBookCustomizer(book: Book) {
    editingBook.value = { ...book }
    targetShelfIdForNewBook.value = null
    isBookCustomizerOpen.value = true
  }

  function openNewBookModal(shelfId: string) {
    targetShelfIdForNewBook.value = shelfId
    editingBook.value = null
    isBookCustomizerOpen.value = true
  }

  function closeBookCustomizer() {
    isBookCustomizerOpen.value = false
    editingBook.value = null
    targetShelfIdForNewBook.value = null
  }

  function openShelfModal(shelf?: Shelf) {
    editingShelf.value = shelf ? { ...shelf } : null
    isShelfModalOpen.value = true
  }

  function closeShelfModal() {
    isShelfModalOpen.value = false
    editingShelf.value = null
  }

  function openLibraryModal() {
    isLibraryModalOpen.value = true
  }

  function closeLibraryModal() {
    isLibraryModalOpen.value = false
  }

  function openBook(bookId: string) {
    activeOpenedBookId.value = bookId
  }

  function closeBook() {
    activeOpenedBookId.value = null
  }

  return {
    isLoading,
    libraries,
    currentLibraryId,
    shelves,
    books,
    currentLibrary,
    currentShelves,
    libraryStats,
    isBookCustomizerOpen,
    isShelfModalOpen,
    isLibraryModalOpen,
    editingBook,
    targetShelfIdForNewBook,
    editingShelf,
    activeOpenedBookId,
    getBooksForShelf,
    init,
    setLibrary,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    createShelf,
    updateShelf,
    deleteShelf,
    createBook,
    updateBook,
    deleteBook,
    openBookCustomizer,
    openNewBookModal,
    closeBookCustomizer,
    openShelfModal,
    closeShelfModal,
    openLibraryModal,
    closeLibraryModal,
    openBook,
    closeBook,
  }
})
