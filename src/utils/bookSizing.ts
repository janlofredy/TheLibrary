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
 * Computes full sizing according to the formal first-principles physics specification:
 * Mode 1: Tip-to-Side Contact (Standing neighbor).
 * Mode 2: Surface-to-Surface Contact (Parallel domino cascade).
 * Mode 3: Side-to-Tip Contact (Flat book neighbor).
 * Mode 4: Tip-to-Wall Contact (Left shelf wall).
 * Mode 5: Open Void -> Fall-to-Flat.
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
      topEdgeDetail: spineThickness >= 48,
    }
  }

  // Sandwich Compression Check: Flanked tightly on both sides (distance <= 8px with non-flat books)
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

  // Determine Lean Direction (explicit preference or deterministic UUID seed)
  let leanDir: 'left' | 'right'
  if (book.layerMode === 'leaning-left') {
    leanDir = 'left'
  } else if (book.layerMode === 'leaning-right') {
    leanDir = 'right'
  } else {
    leanDir = getNaturalLeanDirection(book.id)
  }

  const BASE_NATURAL_ANGLE = 5.4

  // Evaluate Contact Modes on the Lean Side
  if (leanDir === 'right') {
    const neighbor = neighbors?.right

    // Mode 5: Open Void / Unsupported on the right (no neighbor or distance > 45px) -> Fall-to-Flat
    if (!neighbor || neighbor.distance > 45) {
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

    // Mode 3: Side-to-Tip Contact with Flat Book Neighbor (distance <= 45px)
    if (neighbor.isFlat) {
      const angleRad = BASE_NATURAL_ANGLE * (Math.PI / 180)
      const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1
      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: BASE_NATURAL_ANGLE,
        floorLift,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }

    // Mode 2: Surface-to-Surface Domino Cascade (tight neighbor distance <= 8px also leaning right)
    const neighborAngle = neighbor.rotationDeg ?? 0
    if (neighborAngle > 0 && neighbor.distance <= 8) {
      const angleDeg = neighborAngle
      const angleRad = (angleDeg * Math.PI) / 180
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
    }

    // Mode 1: Tip-to-Side Contact (Standing neighbor within 45px)
    if (neighbor.distance < 2) {
      // Flush against upright neighbor -> stands upright
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

    const angleRad = BASE_NATURAL_ANGLE * (Math.PI / 180)
    const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1
    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: BASE_NATURAL_ANGLE,
      floorLift,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  } else {
    // Leaning Left
    const neighbor = neighbors?.left
    const isAgainstLeftWall = Boolean(book.positionX !== undefined && book.positionX <= 8)

    // Mode 4: Tip-to-Wall Contact (Vertical Shelf Frame)
    if (isAgainstLeftWall) {
      const angleRad = BASE_NATURAL_ANGLE * (Math.PI / 180)
      const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1
      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: -BASE_NATURAL_ANGLE,
        floorLift,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }

    // Mode 5: Open Void / Unsupported on the left (no neighbor or distance > 45px) -> Fall-to-Flat
    if (!neighbor || neighbor.distance > 45) {
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

    // Mode 3: Side-to-Tip Contact with Flat Book Neighbor (distance <= 45px)
    if (neighbor.isFlat) {
      const angleRad = BASE_NATURAL_ANGLE * (Math.PI / 180)
      const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1
      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: -BASE_NATURAL_ANGLE,
        floorLift,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }

    // Mode 2: Surface-to-Surface Domino Cascade (tight neighbor distance <= 8px also leaning left)
    const neighborAngle = neighbor.rotationDeg ?? 0
    if (neighborAngle < 0 && neighbor.distance <= 8) {
      const angleDeg = neighborAngle
      const angleRad = (Math.abs(angleDeg) * Math.PI) / 180
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
    }

    // Mode 1: Tip-to-Side Contact (Standing neighbor within 45px)
    if (neighbor.distance < 2) {
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

    const angleRad = BASE_NATURAL_ANGLE * (Math.PI / 180)
    const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1
    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: -BASE_NATURAL_ANGLE,
      floorLift,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }
}
