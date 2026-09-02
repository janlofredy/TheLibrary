import { db } from '@/db'
import type { Book, Page, Shelf, Library } from '@/types/journal'
import { getStoredSession } from './githubAuth'

export interface SharedPayload {
  version: '1.0'
  type: 'book' | 'shelf' | 'library'
  exportedAt: string
  library?: Library
  shelf?: Shelf
  book?: Book
  books?: Book[]
  pages?: Page[]
}

/**
 * Exports a book and all its pages as formatted Markdown.
 */
export async function exportBookAsMarkdown(bookId: string): Promise<string> {
  const book = await db.books.get(bookId)
  if (!book) throw new Error('Book not found')

  const pages = await db.pages.where('bookId').equals(bookId).sortBy('pageNumber')

  let md = `# ${book.title}\n`
  if (book.subtitle) {
    md += `*${book.subtitle}*\n\n`
  }
  md += `**Total Pages**: ${pages.length} | **Exported from The Journal Library**\n\n---\n\n`

  for (const page of pages) {
    const dateStr = new Date(page.entryDate).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const moodEmoji = page.mood ? `[Mood: ${page.mood}] ` : ''
    const tagsStr = page.tags.length > 0 ? ` [Tags: ${page.tags.join(', ')}]` : ''

    md += `## Page ${page.pageNumber}: ${page.title || 'Untitled'}\n`
    md += `*${dateStr}* ${moodEmoji}${tagsStr}\n\n`
    
    // Extract plain text / html to markdown format
    if (typeof page.content === 'string') {
      const cleanContent = page.content
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '### $1\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '#### $1\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
        .replace(/<hr\s*\/?>/gi, '---\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '') // strip remaining tags
      md += `${cleanContent.trim()}\n\n---\n\n`
    }
  }

  return md
}

/**
 * Downloads text as a file in the browser.
 */
export function downloadFile(content: string, filename: string, type = 'text/markdown') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Builds a complete SharedPayload for a book, shelf, or library.
 */
export async function buildSharedPayload(type: 'book' | 'shelf' | 'library', id: string): Promise<SharedPayload> {
  const now = new Date().toISOString()

  if (type === 'book') {
    const book = await db.books.get(id)
    if (!book) throw new Error('Book not found')
    const pages = await db.pages.where('bookId').equals(id).sortBy('pageNumber')
    return {
      version: '1.0',
      type: 'book',
      exportedAt: now,
      book,
      pages,
    }
  }

  if (type === 'shelf') {
    const shelf = await db.shelves.get(id)
    if (!shelf) throw new Error('Shelf not found')
    const books = await db.books.where('shelfId').equals(id).toArray()
    const bookIds = books.map(b => b.id)
    const pages = await db.pages.where('bookId').anyOf(bookIds).toArray()
    return {
      version: '1.0',
      type: 'shelf',
      exportedAt: now,
      shelf,
      books,
      pages,
    }
  }

  const library = await db.libraries.get(id)
  if (!library) throw new Error('Library not found')
  const shelves = await db.shelves.where('libraryId').equals(id).toArray()
  const shelfIds = shelves.map(s => s.id)
  const books = await db.books.where('shelfId').anyOf(shelfIds).toArray()
  const bookIds = books.map(b => b.id)
  const pages = await db.pages.where('bookId').anyOf(bookIds).toArray()

  return {
    version: '1.0',
    type: 'library',
    exportedAt: now,
    library,
    books,
    pages,
  }
}

/**
 * Publishes a SharedPayload to a GitHub Gist (Secret or Public).
 */
export async function publishToGist(
  payload: SharedPayload,
  isPublic = false
): Promise<{ gistId: string; htmlUrl: string }> {
  const session = getStoredSession()
  const token = session?.token

  const title = payload.book?.title || payload.shelf?.name || payload.library?.name || 'Shared Journal'
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`

  const files: Record<string, { content: string }> = {
    [filename]: {
      content: JSON.stringify(payload, null, 2),
    },
    'README.md': {
      content: `# ${title}\n\nShared from [The Journal Library](https://janlofredy.github.io/TheLibrary/).\nTotal Pages: ${payload.pages?.length || 0}`,
    },
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      description: `The Journal Library - ${title}`,
      public: isPublic,
      files,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to create GitHub Gist.')
  }

  const gist = await res.json()
  return {
    gistId: gist.id,
    htmlUrl: gist.html_url,
  }
}

/**
 * Fetches a SharedPayload from a GitHub Gist ID.
 */
export async function fetchSharedGist(gistId: string): Promise<SharedPayload> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!res.ok) {
    throw new Error('Could not fetch shared Gist.')
  }

  const gist = await res.json()
  // Find the json file
  const jsonFile = Object.values(gist.files).find((f: any) => f.filename.endsWith('.json')) as any
  if (!jsonFile || !jsonFile.content) {
    throw new Error('Invalid journal format in Gist.')
  }

  return JSON.parse(jsonFile.content) as SharedPayload
}

/**
 * Imports a SharedPayload into the user's local database.
 */
export async function importSharedPayload(
  payload: SharedPayload,
  targetShelfId: string
): Promise<{ booksCount: number; pagesCount: number }> {
  const now = new Date().toISOString()

  if (payload.type === 'book' && payload.book) {
    const newBookId = `bk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
    const importedBook: Book = {
      ...payload.book,
      id: newBookId,
      shelfId: targetShelfId,
      createdAt: now,
      updatedAt: now,
    }

    await db.books.add(importedBook)

    if (payload.pages) {
      for (const page of payload.pages) {
        const newPageId = `pg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        await db.pages.add({
          ...page,
          id: newPageId,
          bookId: newBookId,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    return { booksCount: 1, pagesCount: payload.pages?.length || 0 }
  }

  if (payload.type === 'shelf' && payload.books) {
    for (const book of payload.books) {
      const newBookId = `bk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
      await db.books.add({
        ...book,
        id: newBookId,
        shelfId: targetShelfId,
        createdAt: now,
        updatedAt: now,
      })

      const bookPages = (payload.pages || []).filter(p => p.bookId === book.id)
      for (const page of bookPages) {
        const newPageId = `pg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
        await db.pages.add({
          ...page,
          id: newPageId,
          bookId: newBookId,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    return { booksCount: payload.books.length, pagesCount: payload.pages?.length || 0 }
  }

  return { booksCount: 0, pagesCount: 0 }
}
