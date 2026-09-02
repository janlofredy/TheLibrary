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
 * Deterministic natural lean direction based on the book's UUID (used to break ties when both sides have support).
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
 * 4. Wall Hugging: A book placed flush against a wall (gap <= 8px) stands firmly upright without clipping through the wall.
 * 5. Shelf Wall Leaning: A book with a gap (8px < gap <= 35px) to a wall tilts to touch the wall frame with its top corner.
 * 6. Context-Aware Lean Direction: Leans toward the side where physical support (neighbor or shelf wall) exists.
 * 7. Flat Book Contact: Adjacent to a flat book (gap <= 12px) rests gently at 5.5 deg. If gap > 12px, falls flat on floor.
 * 8. Height-Aware Mutual Lean / A-Frame: When 2 books lean toward each other, the taller book leans more to meet the shorter book's top corner.
 * 9. Dynamic Height-Aware Gap-Spanning: Contact height is min(H, neighbor.height), so taller books lean more when resting on shorter neighbors.
 * 10. Cascading Domino Support: Spans neighbor's shifted top surface when neighbor is tilted in same direction.
 * 11. Fall-to-Flat Rule: When unsupported (gap >= H or no neighbor), falls flat on the shelf floor.
 */
export function getBookSizing(
  book: Book,
  neighbors?: { left?: NeighborInfo | null; right?: NeighborInfo | null },
  shelfWidth?: number
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

  const posX = book.positionX ?? 0
  const isFlushLeftWall = Boolean(book.positionX !== undefined && posX <= 8)
  const isGapLeftWall = Boolean(book.positionX !== undefined && posX > 8 && posX <= 35)

  const distToRightWall = shelfWidth !== undefined && book.positionX !== undefined 
    ? Math.max(0, shelfWidth - (posX + W)) 
    : Infinity
  const isFlushRightWall = Boolean(distToRightWall <= 8)
  const isGapRightWall = Boolean(distToRightWall > 8 && distToRightWall <= 35)

  // Wall hugging books stand upright (cannot lean through the wall)
  if (isFlushLeftWall && (!neighbors?.right || neighbors.right.distance > 12)) {
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
  if (isFlushRightWall && (!neighbors?.left || neighbors.left.distance > 12)) {
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

  const hasLeftSupport = isFlushLeftWall || isGapLeftWall || Boolean(neighbors?.left && neighbors.left.distance < H)
  const hasRightSupport = isFlushRightWall || isGapRightWall || Boolean(neighbors?.right && neighbors.right.distance < H)

  // 4. Context-Aware Lean Direction: Lean toward available support; randomize only when both sides are supported
  let leanDir: 'left' | 'right'
  if (book.layerMode === 'leaning-left') {
    leanDir = 'left'
  } else if (book.layerMode === 'leaning-right') {
    leanDir = 'right'
  } else if (hasLeftSupport && !hasRightSupport) {
    leanDir = 'left'
  } else if (hasRightSupport && !hasLeftSupport) {
    leanDir = 'right'
  } else {
    leanDir = getNaturalLeanDirection(book.id)
  }

  const neighbor = leanDir === 'right' ? neighbors?.right : neighbors?.left

  // 5. Left Shelf Wall Leaning (across gap)
  if (leanDir === 'left' && isGapLeftWall && (!neighbors?.left || neighbors.left.distance > 12)) {
    const sinTheta = Math.min(0.20, posX / H)
    const angleRad = Math.asin(sinTheta)
    const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1))
    return {
      width: W,
      height: H,
      rotationDeg: -angleDeg,
      floorLift: Math.ceil(W * Math.sin(angleRad)) + 1,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // 6. Right Shelf Wall Leaning (across gap)
  if (leanDir === 'right' && isGapRightWall && (!neighbors?.right || neighbors.right.distance > 12)) {
    const sinTheta = Math.min(0.20, distToRightWall / H)
    const angleRad = Math.asin(sinTheta)
    const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1))
    return {
      width: W,
      height: H,
      rotationDeg: angleDeg,
      floorLift: Math.ceil(W * Math.sin(angleRad)) + 1,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // 7. Unsupported Open Space (gap >= H or no neighbor) -> Fall Flat
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

  // 8. Flat Book Contact (Flat book on floor)
  const isNeighborFlatVolume = neighbor.isFlat || (neighbor.width > 60 && neighbor.height <= 45)
  if (isNeighborFlatVolume) {
    if (neighbor.distance <= 12) {
      // Adjacent to flat book -> gentle resting tilt against the raised corner
      const angleRad = (5.5 * Math.PI) / 180
      const sign = leanDir === 'right' ? 1 : -1
      return {
        width: W,
        height: H,
        rotationDeg: sign * 5.5,
        floorLift: Math.ceil(W * Math.sin(angleRad)) + 1,
        canTilt: true,
        isFlat: false,
        topEdgeDetail: false,
      }
    } else {
      // Open gap to flat book (> 12px) -> falls flat on shelf floor
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
  }

  // 9. Height-Aware Mutual Lean / A-Frame Apex Contact (when 2 adjacent books lean towards each other)
  const isNeighborSlim = neighbor.width <= 45
  const isNeighborLeaningTowardsUs = isNeighborSlim && (neighbor.rotationDeg !== undefined
    ? Math.sign(neighbor.rotationDeg) === (leanDir === 'right' ? -1 : 1)
    : getNaturalLeanDirection(neighbor.book.id) === (leanDir === 'right' ? 'left' : 'right'))

  if (isNeighborLeaningTowardsUs) {
    const gap = Math.max(0, neighbor.distance)
    const H_neighbor = neighbor.height
    const isThisBookTaller = H >= H_neighbor

    let angleRad: number
    if (isThisBookTaller) {
      // Taller book leans more to span down to shorter book's top corner
      const H_contact = Math.max(160, H_neighbor)
      const remainingReach = gap * (H / (H + H_neighbor))
      const sinVal = Math.min(0.68, remainingReach / H_contact)
      angleRad = Math.asin(sinVal)
    } else {
      // Shorter book tilts more gently
      const reach = gap * (H / (H + H_neighbor))
      const sinVal = Math.min(0.40, reach / H)
      angleRad = Math.asin(sinVal)
    }

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

  // 10. Height-Aware Dynamic Gap-Spanning Lean & Cascading Domino Touch
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

  // Contact height is min(H, neighbor.height) -> taller books leaning on shorter books lean further
  const contactHeight = Math.min(H, neighbor.height || H)
  const sinTheta = Math.min(0.65, totalGap / contactHeight)
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
