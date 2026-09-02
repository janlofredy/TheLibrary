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
}

/**
 * Computes full sizing according to the formal physics specification:
 * 1. Computes lean angle dynamically spanning the exact gap so the book leans until physically hitting the next book.
 * 2. If neighbor is a flat book, leans until resting against the top corner of the flat book.
 * 3. If gap is too wide (> 85px) or unsupported, the book falls over and lies flat on the shelf floor.
 * 4. Floor lift keeps the bottom vertex tangent to the floor with zero piercing.
 */
export function getBookSizing(
  book: Book,
  neighbors?: { left?: NeighborInfo | null; right?: NeighborInfo | null }
): BookSizing {
  const spineThickness = calculateSpineWidth(book.pageCount || 0)
  const fullBookHeight = calculateBookHeight(book.id)
  const flatBookLength = fullBookHeight

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

  const MAX_SUPPORT_GAP = 85 // Max gap (px) that a leaning volume can physically span before falling flat

  // 5. Evaluate Support & Height on the Lean Side
  if (leanDir === 'right') {
    const neighbor = neighbors?.right
    
    // If no neighbor on the right or gap is too wide to support leaning -> falls flat
    if (!neighbor || neighbor.distance > MAX_SUPPORT_GAP) {
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

    // Leaning on a flat book to the right
    if (neighbor.isFlat) {
      const flatH = Math.max(28, neighbor.height)
      const gap = Math.max(0, neighbor.distance)
      const effectiveHeight = Math.max(80, fullBookHeight - flatH)
      const sinTheta = Math.min(0.42, Math.max(0.08, gap / effectiveHeight))
      const angleRad = Math.asin(sinTheta)
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
    }

    // Leaning on a standing neighbor to the right
    const gap = neighbor.distance
    if (gap < 2) {
      // Flush against neighbor -> stands upright
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

    // Leans all the way across the gap to hit the standing neighbor!
    const sinTheta = Math.min(0.45, gap / fullBookHeight)
    const angleRad = Math.asin(sinTheta)
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
    const isAgainstLeftWall = Boolean(book.positionX !== undefined && book.positionX <= 8)
    
    if (isAgainstLeftWall) {
      // Leaning against the left shelf vertical frame wall
      const baseAngle = 6.5
      const rad = baseAngle * (Math.PI / 180)
      const floorLift = Math.ceil(spineThickness * Math.sin(rad)) + 1

      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: -baseAngle,
        floorLift,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }
    
    // If no neighbor on the left or gap is too wide to support leaning -> falls flat
    if (!neighbor || neighbor.distance > MAX_SUPPORT_GAP) {
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

    // Leaning on a flat book to the left
    if (neighbor.isFlat) {
      const flatH = Math.max(28, neighbor.height)
      const gap = Math.max(0, neighbor.distance)
      const effectiveHeight = Math.max(80, fullBookHeight - flatH)
      const sinTheta = Math.min(0.42, Math.max(0.08, gap / effectiveHeight))
      const angleRad = Math.asin(sinTheta)
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

    // Leaning on a standing neighbor to the left
    const gap = neighbor.distance
    if (gap < 2) {
      // Flush against neighbor -> stands upright
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

    // Leans all the way across the gap to hit the standing neighbor!
    const sinTheta = Math.min(0.45, gap / fullBookHeight)
    const angleRad = Math.asin(sinTheta)
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
