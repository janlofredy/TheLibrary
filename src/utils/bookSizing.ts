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
 * Computes full sizing, rotational lean, floor anti-clipping lift, and tilt eligibility for a book.
 */
export function getBookSizing(book: Book): BookSizing {
  const width = calculateSpineWidth(book.pageCount || 0)
  const height = calculateBookHeight(book.id)

  // Only slim/medium books (<= 48px width) can physically tilt on the shelf
  const canTilt = width <= 48

  let rotationDeg = 0
  let floorLift = 0

  if (canTilt && (book.layerMode === 'leaning-left' || book.layerMode === 'leaning-right')) {
    const seed = hashString(book.id + '-lean')
    const baseAngle = 4.8 + ((seed % 15) / 10) // 4.8deg - 6.2deg natural lean

    if (book.layerMode === 'leaning-left') {
      rotationDeg = -baseAngle
    } else {
      rotationDeg = baseAngle
    }

    // Floor anti-clipping compensation:
    // When rotated by theta, the bottom corner dips downward by width * sin(|theta|).
    // Raising the element upward by floorLift keeps the lowest corner flush on the shelf floor!
    const rad = Math.abs(rotationDeg) * (Math.PI / 180)
    floorLift = Math.ceil(width * Math.sin(rad)) + 1
  }

  const topEdgeDetail = width >= 48

  return {
    width,
    height,
    rotationDeg,
    floorLift,
    canTilt,
    topEdgeDetail,
  }
}
