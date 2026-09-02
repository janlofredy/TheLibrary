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
 * 1. Computes neighbor height and distance on the lean side.
 * 2. If a neighbor is on the lean side, calculates exact lean angle bounded by neighbor height and gap (ZERO CLIPPING).
 * 3. If neighbor is a flat book, leans and rests on top of the flat book's raised edge.
 * 4. Only falls completely flat if there is sufficient clearance without colliding into a neighbor.
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

  // 5. Evaluate Support & Height on the Lean Side
  if (leanDir === 'right') {
    const neighbor = neighbors?.right
    
    // Check if there is a neighbor on the right within potential collision / support range
    if (!neighbor || neighbor.distance >= flatBookLength) {
      // Completely unsupported with plenty of open space -> falls flat on the shelf floor
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

    // A neighbor exists within reach on the right!
    // Compute lean angle based on neighbor distance and neighbor height
    if (neighbor.isFlat) {
      // Leaning on a flat lying book: rests against the top edge of the flat volume
      const flatH = Math.max(28, neighbor.height)
      const gap = Math.max(0, neighbor.distance)
      const angleRad = Math.min(0.22, Math.atan2(gap + 8, flatH + 80))
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

    // Standing neighbor on right
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

    // Leaning against standing neighbor: swing top by at most gap (max 22px)
    const reachX = Math.min(gap, 22)
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
    
    // Check if there is a neighbor on the left within potential collision / support range
    if (!neighbor || neighbor.distance >= flatBookLength) {
      // Completely unsupported with plenty of open space -> falls flat on the shelf floor
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

    // A neighbor exists within reach on the left!
    if (neighbor.isFlat) {
      // Leaning on a flat lying book to the left
      const flatH = Math.max(28, neighbor.height)
      const gap = Math.max(0, neighbor.distance)
      const angleRad = Math.min(0.22, Math.atan2(gap + 8, flatH + 80))
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

    // Standing neighbor on left
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

    // Leaning against standing neighbor
    const reachX = Math.min(gap, 22)
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
