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
  height: number
  width: number
  rotationDeg?: number
}

/**
 * Computes individual book sizing given its calculated cluster rotation.
 */
export function getBookSizing(
  book: Book,
  neighbors?: { left?: NeighborInfo | null; right?: NeighborInfo | null }
): BookSizing {
  const spineThickness = calculateSpineWidth(book.pageCount || 0)
  const fullBookHeight = calculateBookHeight(book.id)
  const flatBookLength = fullBookHeight

  // Explicit Horizontal Flat Book Mode
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

  // Thick Volume Check (Spine width > 45px stands firmly upright)
  const canTilt = spineThickness <= 45
  if (!canTilt) {
    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: 0,
      floorLift: 0,
      canTilt: false,
      isFlat: false,
      topEdgeDetail: true,
    }
  }

  // If rotationDeg is explicitly resolved by the cluster solver
  const BASE_ANGLE = 5.5
  const angleRad = (BASE_ANGLE * Math.PI) / 180
  const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1

  // Check left wall
  const isAgainstLeftWall = Boolean(book.positionX !== undefined && book.positionX <= 12)
  const hasLeftNeighbor = Boolean(neighbors?.left && neighbors.left.distance <= 20)
  const hasRightNeighbor = Boolean(neighbors?.right && neighbors.right.distance <= 20)

  // Sandwiched between two books -> stands upright
  if ((isAgainstLeftWall || hasLeftNeighbor) && hasRightNeighbor) {
    // If neighbor to the right is also leaning left, lean left together
    if (neighbors?.right?.rotationDeg && neighbors.right.rotationDeg < 0) {
      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: -BASE_ANGLE,
        floorLift,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }
    // If neighbor to the left is leaning right, lean right together
    if (neighbors?.left?.rotationDeg && neighbors.left.rotationDeg > 0) {
      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: BASE_ANGLE,
        floorLift,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }
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

  // Supported on left (wall or book)
  if (isAgainstLeftWall || hasLeftNeighbor) {
    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: -BASE_ANGLE,
      floorLift,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // Supported on right
  if (hasRightNeighbor) {
    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: BASE_ANGLE,
      floorLift,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // Unsupported isolated volume -> falls flat
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
