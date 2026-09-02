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
 * Computes individual book sizing according to the unified master physical specification:
 * 1. Explicit Flat Mode: width = H, height = W, isFlat = true.
 * 2. Thick Volume Stability: Spine width > 45px always stands upright.
 * 3. Packed Books (gap <= 12px on both sides): stands firmly upright without lean (0 deg).
 * 4. Left Wall Leaning: Books at shelf edge (X <= 8px) lean against the vertical frame (-5.5 deg).
 * 5. Mutual Lean / A-Frame: When 2 books lean toward each other, their tops meet at a mutual apex: sin(theta) = gap / (H1 + H2).
 * 6. Dynamic Gap-Spanning Angle: Rotates across the gap (sin(theta) = totalGap / H) until touching the adjacent book.
 * 7. Cascading Domino Support: Spans neighbor's shifted top surface when neighbor is tilted in same direction.
 * 8. Flat Book Contact: Rests against flat book's raised corner at 6.0 deg.
 * 9. Fall-to-Flat Rule: When unsupported (gap >= H or no neighbor), falls flat on the shelf floor.
 */
export function getBookSizing(
  book: Book,
  neighbors?: { left?: NeighborInfo | null; right?: NeighborInfo | null }
): BookSizing {
  const W = calculateSpineWidth(book.pageCount || 0)
  const H = calculateBookHeight(book.id)

  // 1. Explicit Flat Mode
  if (book.layerMode === 'horizontal-stack') {
    return {
      width: H,
      height: W,
      rotationDeg: 0,
      floorLift: 0,
      canTilt: false,
      isFlat: true,
      topEdgeDetail: true,
    }
  }

  // 2. Thick Volume Stability (W > 45px)
  const canTilt = W <= 45
  if (!canTilt) {
    return {
      width: W,
      height: H,
      rotationDeg: 0,
      floorLift: 0,
      canTilt: false,
      isFlat: false,
      topEdgeDetail: true,
    }
  }

  // 3. Packed Books (gap <= 12px on both sides) -> Stand Upright
  const hasTightLeft = Boolean(neighbors?.left && neighbors.left.distance <= 12 && !neighbors.left.isFlat)
  const hasTightRight = Boolean(neighbors?.right && neighbors.right.distance <= 12 && !neighbors.right.isFlat)
  if (hasTightLeft && hasTightRight) {
    return {
      width: W,
      height: H,
      rotationDeg: 0,
      floorLift: 0,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // 4. Determine Lean Direction from UUID / preference
  const leanDir = book.layerMode === 'leaning-left' 
    ? 'left' 
    : book.layerMode === 'leaning-right' 
      ? 'right' 
      : getNaturalLeanDirection(book.id)

  const isAgainstLeftWall = Boolean(book.positionX !== undefined && book.positionX <= 8)
  const neighbor = leanDir === 'right' ? neighbors?.right : neighbors?.left

  // 5. Left Shelf Wall Contact
  if (leanDir === 'left' && isAgainstLeftWall) {
    const rad = (5.5 * Math.PI) / 180
    return {
      width: W,
      height: H,
      rotationDeg: -5.5,
      floorLift: Math.ceil(W * Math.sin(rad)) + 1,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // 6. Unsupported Open Space (gap >= H or no neighbor) -> Fall Flat
  if (!neighbor || neighbor.distance >= H) {
    return {
      width: H,
      height: W,
      rotationDeg: 0,
      floorLift: 0,
      canTilt: true,
      isFlat: true,
      topEdgeDetail: true,
    }
  }

  // 7. Flat Book Contact
  if (neighbor.isFlat) {
    const angleRad = (6.0 * Math.PI) / 180
    const sign = leanDir === 'right' ? 1 : -1
    return {
      width: W,
      height: H,
      rotationDeg: sign * 6.0,
      floorLift: Math.ceil(W * Math.sin(angleRad)) + 1,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // 8. Mutual Lean / A-Frame Apex Contact (when 2 adjacent books lean towards each other)
  const isNeighborSlim = neighbor.width <= 45
  const isNeighborLeaningTowardsUs = isNeighborSlim && (neighbor.rotationDeg !== undefined
    ? Math.sign(neighbor.rotationDeg) === (leanDir === 'right' ? -1 : 1)
    : getNaturalLeanDirection(neighbor.book.id) === (leanDir === 'right' ? 'left' : 'right'))

  if (isNeighborLeaningTowardsUs) {
    const sharedApexSin = Math.min(0.65, Math.max(0, neighbor.distance) / (H + neighbor.height))
    const angleRad = Math.asin(sharedApexSin)
    const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1))
    const sign = leanDir === 'right' ? 1 : -1
    const floorLift = Math.ceil(W * Math.sin(angleRad)) + 1
    return {
      width: W,
      height: H,
      rotationDeg: sign * angleDeg,
      floorLift,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // 9. Dynamic Gap-Spanning Lean & Cascading Domino Touch (same direction or leaning on upright volume)
  const isNeighborTiltedSameDir = neighbor.rotationDeg && Math.sign(neighbor.rotationDeg) === (leanDir === 'right' ? 1 : -1)
  const neighborTopOffset = isNeighborTiltedSameDir ? neighbor.height * Math.sin((Math.abs(neighbor.rotationDeg!) * Math.PI) / 180) : 0
  const totalGap = Math.max(0, neighbor.distance) + neighborTopOffset

  if (totalGap <= 8) {
    // Packed flush against a neighbor
    const angleDeg = neighbor.rotationDeg ?? 0
    const rad = (Math.abs(angleDeg) * Math.PI) / 180
    return {
      width: W,
      height: H,
      rotationDeg: angleDeg,
      floorLift: Math.ceil(W * Math.sin(rad)) + 1,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // Dynamic span across the gap: sin(theta) = totalGap / H
  const sinTheta = Math.min(0.65, totalGap / H)
  const angleRad = Math.asin(sinTheta)
  const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1))
  const sign = leanDir === 'right' ? 1 : -1
  const floorLift = Math.ceil(W * Math.sin(angleRad)) + 1

  return {
    width: W,
    height: H,
    rotationDeg: sign * angleDeg,
    floorLift,
    canTilt: true,
    isFlat: false,
    topEdgeDetail: false,
  }
}
