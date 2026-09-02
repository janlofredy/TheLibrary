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
 * Computes full sizing, realistic contact tilt angle, unsupported fallback to lying flat, and floor anti-clipping lift.
 */
export function getBookSizing(
  book: Book,
  neighbors?: { left?: Book | null; right?: Book | null }
): BookSizing {
  const spineThickness = calculateSpineWidth(book.pageCount || 0)
  const fullBookHeight = calculateBookHeight(book.id)
  const flatBookLength = Math.min(210, Math.max(170, Math.round(fullBookHeight * 0.82)))

  // 1. Explicit Horizontal Flat Book Mode
  if (book.layerMode === 'horizontal-stack') {
    return {
      width: flatBookLength,
      height: spineThickness,
      rotationDeg: 0,
      floorLift: 0,
      canTilt: false,
      isFlat: true,
      topEdgeDetail: true,
    }
  }

  // 2. Leaning Physics: If tilted with NO supporting neighbor on that side, it falls and lies flat!
  if (book.layerMode === 'leaning-right' && !neighbors?.right) {
    return {
      width: flatBookLength,
      height: spineThickness,
      rotationDeg: 0,
      floorLift: 0,
      canTilt: true,
      isFlat: true,
      topEdgeDetail: true,
    }
  }

  if (book.layerMode === 'leaning-left' && !neighbors?.left) {
    return {
      width: flatBookLength,
      height: spineThickness,
      rotationDeg: 0,
      floorLift: 0,
      canTilt: true,
      isFlat: true,
      topEdgeDetail: true,
    }
  }

  // 3. Standing or Supported Leaning Mode
  const width = spineThickness
  const height = fullBookHeight

  // Only slim/medium books (<= 48px width) can physically lean against a neighbor
  const canTilt = width <= 48

  let rotationDeg = 0
  let floorLift = 0

  if (canTilt && (book.layerMode === 'leaning-left' || book.layerMode === 'leaning-right')) {
    const seed = hashString(book.id + '-lean')
    // Distinct physical lean angle (5.0deg - 5.8deg) so the upper corner reaches over and hits the adjacent neighbor
    let baseAngle = 5.0 + ((seed % 9) / 10)

    if (book.layerMode === 'leaning-right') {
      const right = neighbors?.right
      if (right && right.layerMode === 'standing') {
        baseAngle = 5.4 // Hits upright standing neighbor firmly
      } else if (right && right.layerMode === 'leaning-right') {
        baseAngle = 5.2 // Parallel domino cascade
      } else if (right && right.layerMode === 'leaning-left') {
        baseAngle = 4.2 // Apex tent touch
      }
      rotationDeg = baseAngle
    } else if (book.layerMode === 'leaning-left') {
      const left = neighbors?.left
      if (left && left.layerMode === 'standing') {
        baseAngle = 5.4 // Hits upright standing neighbor firmly
      } else if (left && left.layerMode === 'leaning-left') {
        baseAngle = 5.2 // Parallel domino cascade
      } else if (left && left.layerMode === 'leaning-right') {
        baseAngle = 4.2 // Apex tent touch
      }
      rotationDeg = -baseAngle
    }

    // Floor anti-clipping upward compensation
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
    isFlat: false,
    topEdgeDetail,
  }
}
