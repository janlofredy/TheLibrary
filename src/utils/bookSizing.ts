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
 * 2. Thick Volume Stability: Spine width > 45px always stands upright (0 deg).
 * 3. Wall Support & Packed Upright:
 *    - Sandwiched between 2 books -> stands upright (0 deg).
 *    - Beside left wall with a right neighbor -> stands upright (0 deg).
 *    - Beside right wall with a left neighbor -> stands upright (0 deg).
 * 4. Outer Edge Leaning: Outer books at edge of a stack/wall fall flat outward into open space.
 * 5. Dynamic Leaning to Next Support: Leans at the exact angle to touch the next support (neighbor, arch, wall).
 * 6. Fall-to-Flat Rule: When no support exists within reach (gap >= H), falls flat on the floor in the open space.
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

  const posX = book.positionX ?? 0
  const isBesideLeftWall = Boolean(book.positionX !== undefined && posX <= 8)

  const distToRightWall = shelfWidth !== undefined && book.positionX !== undefined 
    ? Math.max(0, shelfWidth - (posX + W)) 
    : Infinity
  const isBesideRightWall = Boolean(distToRightWall <= 8)

  // 3. Packed Books & Wall-Sandwiched Books -> Stand Upright
  const hasTightLeft = Boolean(neighbors?.left && neighbors.left.distance <= 16 && !neighbors.left.isFlat)
  const hasTightRight = Boolean(neighbors?.right && neighbors.right.distance <= 16 && !neighbors.right.isFlat)

  if ((hasTightLeft && hasTightRight) || (isBesideLeftWall && hasTightRight) || (isBesideRightWall && hasTightLeft)) {
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

  const distToLeftWall = posX
  const isWallReachLeft = distToLeftWall > 0 && distToLeftWall < H
  const isWallReachRight = distToRightWall > 0 && distToRightWall < H

  const hasLeftNeighbor = Boolean(neighbors?.left && neighbors.left.distance < H)
  const hasRightNeighbor = Boolean(neighbors?.right && neighbors.right.distance < H)

  // 4. Physical Lean Direction Determination:
  let leanDir: 'left' | 'right'
  if (book.layerMode === 'leaning-left') {
    leanDir = 'left'
  } else if (book.layerMode === 'leaning-right') {
    leanDir = 'right'
  } else if (hasTightLeft && !hasTightRight) {
    leanDir = 'right'
  } else if (hasTightRight && !hasTightLeft) {
    leanDir = 'left'
  } else if (hasLeftNeighbor && !hasRightNeighbor) {
    leanDir = 'left'
  } else if (hasRightNeighbor && !hasLeftNeighbor) {
    leanDir = 'right'
  } else if (hasLeftNeighbor && hasRightNeighbor) {
    leanDir = neighbors!.left!.distance <= neighbors!.right!.distance ? 'left' : 'right'
  } else if (isWallReachLeft && !isWallReachRight) {
    leanDir = 'left'
  } else if (isWallReachRight && !isWallReachLeft) {
    leanDir = 'right'
  } else if (distToRightWall < 60 && posX > 60) {
    leanDir = 'left'
  } else if (posX < 60 && distToRightWall > 60) {
    leanDir = 'right'
  } else {
    leanDir = getNaturalLeanDirection(book.id)
  }

  const neighbor = leanDir === 'right' ? neighbors?.right : neighbors?.left
  const distToWallInDir = leanDir === 'left' ? distToLeftWall : distToRightWall

  // 5. Shelf Wall Leaning (when wall is the next support in that direction)
  if ((!neighbor || neighbor.distance >= H) && distToWallInDir > 0 && distToWallInDir < H * 0.55) {
    const sinTheta = Math.min(0.55, distToWallInDir / H)
    const angleRad = Math.asin(sinTheta)
    const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(1))
    const sign = leanDir === 'right' ? 1 : -1
    return {
      width: W,
      height: H,
      rotationDeg: sign * angleDeg,
      floorLift: Math.ceil(W * Math.sin(angleRad)) + 1,
      canTilt: true,
      isFlat: false,
      topEdgeDetail: false,
    }
  }

  // 6. Unsupported Open Space (no neighbor or wall within reach) -> Fall Flat
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

  // 7. Flat Book Contact (Flat book on floor)
  const isNeighborFlatVolume = neighbor.isFlat || (neighbor.width > 60 && neighbor.height <= 45)
  if (isNeighborFlatVolume) {
    if (neighbor.distance <= 12) {
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

  // 8. Height-Aware Mutual Lean / A-Frame Apex Contact
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
      const H_contact = Math.max(160, H_neighbor)
      const remainingReach = gap * (H / (H + H_neighbor))
      const sinVal = Math.min(0.68, remainingReach / H_contact)
      angleRad = Math.asin(sinVal)
    } else {
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

  // 9. Height-Aware Dynamic Gap-Spanning Lean & Cascading Domino Touch
  const isNeighborTiltedSameDir = neighbor.rotationDeg && Math.sign(neighbor.rotationDeg) === (leanDir === 'right' ? 1 : -1)
  const neighborTopOffset = isNeighborTiltedSameDir ? neighbor.height * Math.sin((Math.abs(neighbor.rotationDeg!) * Math.PI) / 180) : 0
  const totalGap = Math.max(0, neighbor.distance) + neighborTopOffset

  if (totalGap <= 8) {
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
