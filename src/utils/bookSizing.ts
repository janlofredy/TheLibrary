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
 * Deterministic natural lean direction based on the book's UUID.
 */
export function getNaturalLeanDirection(bookId: string): 'left' | 'right' {
  const hash = hashString(bookId || 'default-seed')
  return (hash % 2 === 0) ? 'left' : 'right'
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

  if (pageCount <= 25) {
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(BASE_WIDTH + pageCount * 1.6)))
  }

  const extendedWidth = BASE_WIDTH + 25 * 1.6 + Math.log10(pageCount - 24) * 28
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(extendedWidth)))
}

/**
 * Procedurally computes a deterministic height (195px - 265px) using the book's UUID seed.
 */
export function calculateBookHeight(bookId: string): number {
  const MIN_HEIGHT = 195
  const MAX_HEIGHT = 265
  const hash = hashString(bookId || 'default-book-seed')
  const factor = (hash % 1000) / 1000
  
  return Math.round(MIN_HEIGHT + factor * (MAX_HEIGHT - MIN_HEIGHT))
}

export interface NeighborInfo {
  book: Book
  distance: number
  isFlat: boolean
}

/**
 * Computes full sizing according to the formal physics specification:
 * 1. Deterministic UUID lean direction.
 * 2. Automatic leaning for slim books (width <= 45px).
 * 3. Sandwiched between two books -> stands upright.
 * 4. Unsupported on lean side -> falls over & lies flat.
 * 5. Supported on lean side -> dynamically calculates lean angle bounded by neighbor gap (ZERO CLIPPING).
 */
export function getBookSizing(
  book: Book,
  neighbors?: { left?: NeighborInfo | null; right?: NeighborInfo | null }
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

  // 2. Thick Volume Check (Spine width > 45px stands firmly upright)
  const canTilt = spineThickness <= 45
  if (!canTilt) {
    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: 0,
      floorLift: 0,
      canTilt: false,
      isFlat: false,
      topEdgeDetail: spineThickness >= 48,
    }
  }

  // 3. Sandwiched Condition: If book has tight non-flat neighbors on both left and right (distance <= 8px), it stands upright!
  const hasTightLeft = Boolean(neighbors?.left && neighbors.left.distance <= 8 && !neighbors.left.isFlat)
  const hasTightRight = Boolean(neighbors?.right && neighbors.right.distance <= 8 && !neighbors.right.isFlat)

  if (hasTightLeft && hasTightRight) {
    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: 0,
      floorLift: 0,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // 4. Determine Lean Direction (Explicit preference or automatic deterministic UUID direction)
  let leanDir: 'left' | 'right'
  if (book.layerMode === 'leaning-left') {
    leanDir = 'left'
  } else if (book.layerMode === 'leaning-right') {
    leanDir = 'right'
  } else {
    leanDir = getNaturalLeanDirection(book.id)
  }

  // 5. Evaluate Support on the Lean Side
  if (leanDir === 'right') {
    const neighbor = neighbors?.right
    const hasRightSupport = Boolean(neighbor && neighbor.distance <= 50)
    
    if (!hasRightSupport) {
      // Unsupported on the right: falls over and lies flat on the shelf floor!
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

    // Supported on the right: compute exact tilt angle based on gap to prevent side clipping!
    const availableGap = neighbor ? neighbor.distance : 18
    if (availableGap < 2) {
      // Too tight to lean -> stands upright
      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: 0,
        floorLift: 0,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }

    const reachX = Math.min(availableGap, 22)
    const angleRad = Math.asin(Math.min(0.25, reachX / fullBookHeight))
    const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1))
    const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1

    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: angleDeg,
      floorLift,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  } else {
    // Leaning Left
    const neighbor = neighbors?.left
    const hasLeftSupport = Boolean(neighbor && neighbor.distance <= 50)
    
    if (!hasLeftSupport) {
      // Unsupported on the left: falls over and lies flat on the shelf floor!
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

    // Supported on the left: compute exact tilt angle based on gap to prevent side clipping!
    const availableGap = neighbor ? neighbor.distance : 18
    if (availableGap < 2) {
      // Too tight to lean -> stands upright
      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: 0,
        floorLift: 0,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }

    const reachX = Math.min(availableGap, 22)
    const angleRad = Math.asin(Math.min(0.25, reachX / fullBookHeight))
    const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1))
    const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1

    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: -angleDeg,
      floorLift,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }
}
