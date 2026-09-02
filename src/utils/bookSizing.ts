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
 * 1. Natural Leaning: Slim books lean at a visible, tactile angle (5.5 deg to 18 deg) touching adjacent books, flat books, or shelf walls.
 * 2. Cascading Domino Stacks: Consecutive leaning books share parallel tilt angles for snug domino cascades.
 * 3. Wall Leaning: Books at the shelf edge (X <= 8px) lean against the vertical shelf wall.
 * 4. Open Space: Books with no support on the lean side (gap >= full height) lie flat on the floor.
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

  // Thick Volume Check (Spine width > 48px stands firmly upright)
  const canTilt = spineThickness <= 48
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

  // Determine Lean Direction
  let leanDir: 'left' | 'right'
  if (book.layerMode === 'leaning-left') {
    leanDir = 'left'
  } else if (book.layerMode === 'leaning-right') {
    leanDir = 'right'
  } else {
    leanDir = getNaturalLeanDirection(book.id)
  }

  const BASE_ANGLE = 6.0

  if (leanDir === 'right') {
    const neighbor = neighbors?.right

    // If completely open with no neighbor on the right and no shelf bounds -> falls flat
    if (!neighbor) {
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

    // Leaning on a flat book
    if (neighbor.isFlat) {
      const angleRad = (BASE_ANGLE * Math.PI) / 180
      const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1
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

    // Leaning on a standing or tilted neighbor
    const neighborAngle = neighbor.rotationDeg ?? 0

    // Domino cascade if neighbor is also leaning right
    if (neighborAngle > 0) {
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

    // Dynamic contact angle spanning the gap to touch neighbor
    const gap = neighbor.distance
    const reach = Math.max(12, Math.min(gap, fullBookHeight * 0.35))
    const angleRad = Math.asin(reach / fullBookHeight)
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
    const isAgainstLeftWall = Boolean(book.positionX !== undefined && book.positionX <= 12)

    if (isAgainstLeftWall) {
      const angleRad = (BASE_ANGLE * Math.PI) / 180
      const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1
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

    if (!neighbor) {
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

    // Leaning on a flat book
    if (neighbor.isFlat) {
      const angleRad = (BASE_ANGLE * Math.PI) / 180
      const floorLift = Math.ceil(spineThickness * Math.sin(angleRad)) + 1
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

    // Domino cascade if neighbor is also leaning left
    const neighborAngle = neighbor.rotationDeg ?? 0
    if (neighborAngle < 0) {
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

    // Dynamic contact angle spanning gap to touch left neighbor
    const gap = neighbor.distance
    const reach = Math.max(12, Math.min(gap, fullBookHeight * 0.35))
    const angleRad = Math.asin(reach / fullBookHeight)
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
