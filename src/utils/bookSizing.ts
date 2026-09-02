import type { Book, BookSizing } from '@/types/journal'

/**
 * Computes a fast, deterministic 32-bit integer hash from a string UUID.
 */
export function hashString(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0)
}

/**
 * Calculates dynamic book spine thickness (width in pixels) based on page count.
 * Minimum: 28px (readable title)
 * Base: 32px
 * Maximum: 110px
 */
export function calculateSpineWidth(pageCount: number): number {
  const MIN_WIDTH = 28
  const MAX_WIDTH = 110
  const BASE_WIDTH = 32

  if (pageCount <= 0) return MIN_WIDTH

  // Linear growth up to ~25 pages, then gentle logarithmic curve to realistic max
  if (pageCount <= 25) {
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(BASE_WIDTH + pageCount * 1.6)))
  }

  const extendedWidth = BASE_WIDTH + 25 * 1.6 + Math.log10(pageCount - 24) * 28
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(extendedWidth)))
}

/**
 * Procedurally computes a deterministic height (195px - 265px) using the book's UUID seed.
 * Ensures consistent visual height on all devices without storing extra database fields.
 */
export function calculateBookHeight(bookId: string): number {
  const MIN_HEIGHT = 195
  const MAX_HEIGHT = 265
  const hash = hashString(bookId || 'default-book-seed')
  const factor = (hash % 1000) / 1000 // 0.000 to 0.999
  
  return Math.round(MIN_HEIGHT + factor * (MAX_HEIGHT - MIN_HEIGHT))
}

/**
 * Computes full sizing, rotational lean, and anti-clipping spatial offset metrics for a book spine.
 */
export function getBookSizing(book: Book): BookSizing {
  const width = calculateSpineWidth(book.pageCount || 0)
  const height = calculateBookHeight(book.id)

  let rotationDeg = 0
  let leanOffset = 0

  if (book.layerMode === 'leaning-left') {
    // Subtle realistic angle between -4.5deg and -6.5deg
    const seed = hashString(book.id + '-lean')
    rotationDeg = -4.5 - ((seed % 20) / 10)
    // Lateral displacement = sin(|theta|) * height
    const rad = Math.abs(rotationDeg) * (Math.PI / 180)
    leanOffset = Math.ceil(Math.sin(rad) * height)
  } else if (book.layerMode === 'leaning-right') {
    // Subtle realistic angle between 4.5deg and 6.5deg
    const seed = hashString(book.id + '-lean')
    rotationDeg = 4.5 + ((seed % 20) / 10)
    const rad = Math.abs(rotationDeg) * (Math.PI / 180)
    leanOffset = Math.ceil(Math.sin(rad) * height)
  }

  const topEdgeDetail = width >= 48

  return {
    width,
    height,
    rotationDeg,
    leanOffset,
    topEdgeDetail,
  }
}
