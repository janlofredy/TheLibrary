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
 * Computes full sizing according to the formal physics specification:
 * 1. Pivots on bottom-right when leaning right; pivots on bottom-left when leaning left.
 * 2. Flat Books: Leaning against a flat book calculates exact corner contact: theta = arctan(gap / H_flat).
 * 3. Standing Books: Leaning against a standing book calculates exact top contact: theta = arcsin(gap / H).
 * 4. Cascading Domino Physics: Adopts neighbor's lean angle for parallel stacks or spans total gap.
 * 5. Open spaces (gap >= flatBookLength or > 28px for flat neighbor) safely fall flat on the shelf floor.
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

  // 5. Evaluate Support & Height on the Lean Side
  if (leanDir === 'right') {
    const neighbor = neighbors?.right
    
    // If no neighbor on the right or gap is wider than the book's full height -> falls flat cleanly
    if (!neighbor || neighbor.distance >= flatBookLength) {
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
      const H_flat = Math.max(26, neighbor.height)
      const gap = Math.max(0, neighbor.distance)

      // If gap is too large to lean on the thin flat book's corner (> 28px), it falls flat
      if (gap > 28) {
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

      // Exact corner contact angle: tan(theta) = gap / H_flat
      const angleRad = gap < 2 
        ? 0.12 // ~7deg gentle resting contact when flush
        : Math.min(0.68, Math.atan2(gap, H_flat))
      const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1))

      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: angleDeg,
        floorLift: 0,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }

    // Standing or Leaning neighbor on the right
    const neighborAngle = neighbor.rotationDeg ?? 0

    if (neighborAngle > 0) {
      // Neighbor is ALSO leaning to the right! (Cascading domino stack)
      if (neighbor.distance <= 8) {
        return {
          width: spineThickness,
          height: fullBookHeight,
          rotationDeg: neighborAngle,
          floorLift: 0,
          canTilt: true,
          isFlat: false,
          topEdgeDetail: false,
        }
      }

      const neighborTopShift = neighbor.height * Math.sin((neighborAngle * Math.PI) / 180)
      const totalGap = neighbor.distance + neighborTopShift
      const sinTheta = Math.min(0.92, totalGap / fullBookHeight)
      const angleDeg = Number(((Math.asin(sinTheta) * 180) / Math.PI).toFixed(1))

      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: angleDeg,
        floorLift: 0,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }

    // Standing upright neighbor on right
    const gap = neighbor.distance
    if (gap < 2) {
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

    const sinTheta = Math.min(0.92, gap / fullBookHeight)
    const angleDeg = Number(((Math.asin(sinTheta) * 180) / Math.PI).toFixed(1))

    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: angleDeg,
      floorLift: 0,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  } else {
    // Leaning Left
    const neighbor = neighbors?.left
    const isAgainstLeftWall = Boolean(book.positionX !== undefined && book.positionX <= 8)
    
    if (isAgainstLeftWall) {
      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: -6.5,
        floorLift: 0,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }
    
    if (!neighbor || neighbor.distance >= flatBookLength) {
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
      const H_flat = Math.max(26, neighbor.height)
      const gap = Math.max(0, neighbor.distance)

      if (gap > 28) {
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

      const angleRad = gap < 2 
        ? 0.12 
        : Math.min(0.68, Math.atan2(gap, H_flat))
      const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1))

      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: -angleDeg,
        floorLift: 0,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }

    // Standing or Leaning neighbor on the left
    const neighborAngle = neighbor.rotationDeg ?? 0

    if (neighborAngle < 0) {
      // Neighbor is ALSO leaning to the left! (Cascading domino stack)
      if (neighbor.distance <= 8) {
        return {
          width: spineThickness,
          height: fullBookHeight,
          rotationDeg: neighborAngle,
          floorLift: 0,
          canTilt: true,
          isFlat: false,
          topEdgeDetail: false,
        }
      }

      const neighborTopShift = neighbor.height * Math.sin((Math.abs(neighborAngle) * Math.PI) / 180)
      const totalGap = neighbor.distance + neighborTopShift
      const sinTheta = Math.min(0.92, totalGap / fullBookHeight)
      const angleDeg = Number(((Math.asin(sinTheta) * 180) / Math.PI).toFixed(1))

      return {
        width: spineThickness,
        height: fullBookHeight,
        rotationDeg: -angleDeg,
        floorLift: 0,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    }

    const gap = neighbor.distance
    if (gap < 2) {
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

    const sinTheta = Math.min(0.92, gap / fullBookHeight)
    const angleDeg = Number(((Math.asin(sinTheta) * 180) / Math.PI).toFixed(1))

    return {
      width: spineThickness,
      height: fullBookHeight,
      rotationDeg: -angleDeg,
      floorLift: 0,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }
}
