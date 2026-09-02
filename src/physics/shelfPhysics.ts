import Matter from 'matter-js'
import type { Book } from '@/types/journal'
import { calculateSpineWidth, calculateBookHeight, getNaturalLeanDirection } from '@/utils/bookSizing'

const { Engine, World, Bodies, Body, Composite } = Matter

export interface PhysicalBookTransform {
  bookId: string
  x: number // Top-left X on canvas
  y: number // Top-left Y on canvas
  centerX: number
  centerY: number
  width: number
  height: number
  angleDeg: number
  angleRad: number
  isFlat: boolean
}

export interface ShelfPhysicsInstance {
  engine: Matter.Engine
  world: Matter.World
  floorBody: Matter.Body
  leftWallBody: Matter.Body
  rightWallBody: Matter.Body
  bookBodies: Map<string, Matter.Body>
  updateDimensions: (shelfWidth: number, shelfHeight: number) => void
  syncBooks: (books: Book[], shelfWidth: number, shelfHeight: number) => Map<string, PhysicalBookTransform>
  settle: (maxTicks?: number) => Map<string, PhysicalBookTransform>
  getTransforms: () => Map<string, PhysicalBookTransform>
  destroy: () => void
}

/**
 * Creates a physical 2D Matter.js simulation instance tailored for a single shelf.
 */
export function createShelfPhysics(
  initialWidth: number = 900,
  initialHeight: number = 300
): ShelfPhysicsInstance {
  const engine = Engine.create({
    gravity: { x: 0, y: 1.8, scale: 0.001 },
    constraintIterations: 4,
    positionIterations: 8,
    velocityIterations: 8,
  })

  const world = engine.world

  const FLOOR_THICKNESS = 40
  const WALL_THICKNESS = 40
  const FLOOR_Y = initialHeight - 4 // Shelf plank surface

  // Static Boundaries
  const floorBody = Bodies.rectangle(
    initialWidth / 2,
    FLOOR_Y + FLOOR_THICKNESS / 2,
    initialWidth * 2,
    FLOOR_THICKNESS,
    {
      isStatic: true,
      friction: 0.95,
      frictionStatic: 1.2,
      restitution: 0.0,
      label: 'shelf-floor',
    }
  )

  const leftWallBody = Bodies.rectangle(
    -WALL_THICKNESS / 2,
    initialHeight / 2,
    WALL_THICKNESS,
    initialHeight * 3,
    {
      isStatic: true,
      friction: 0.9,
      frictionStatic: 1.0,
      restitution: 0.0,
      label: 'shelf-left-wall',
    }
  )

  const rightWallBody = Bodies.rectangle(
    initialWidth + WALL_THICKNESS / 2,
    initialHeight / 2,
    WALL_THICKNESS,
    initialHeight * 3,
    {
      isStatic: true,
      friction: 0.9,
      frictionStatic: 1.0,
      restitution: 0.0,
      label: 'shelf-right-wall',
    }
  )

  World.add(world, [floorBody, leftWallBody, rightWallBody])

  const bookBodies = new Map<string, Matter.Body>()

  function updateDimensions(shelfWidth: number, shelfHeight: number) {
    const floorY = shelfHeight - 4
    Body.setPosition(floorBody, { x: shelfWidth / 2, y: floorY + FLOOR_THICKNESS / 2 })
    Body.setPosition(leftWallBody, { x: -WALL_THICKNESS / 2, y: shelfHeight / 2 })
    Body.setPosition(rightWallBody, { x: shelfWidth + WALL_THICKNESS / 2, y: shelfHeight / 2 })
  }

  function getTransforms(): Map<string, PhysicalBookTransform> {
    const transforms = new Map<string, PhysicalBookTransform>()

    bookBodies.forEach((body, bookId) => {
      const customData = (body as any).bookData as { width: number; height: number; isExplicitFlat: boolean }
      const width = customData.width
      const height = customData.height
      const angleRad = body.angle
      const angleDeg = Number(((angleRad * 180) / Math.PI).toFixed(2))

      // Determine if fallen flat (> 45 deg tilt)
      const isFallenFlat = Math.abs(angleDeg) > 40
      const isFlat = customData.isExplicitFlat || isFallenFlat

      transforms.set(bookId, {
        bookId,
        x: body.position.x - width / 2,
        y: body.position.y - height / 2,
        centerX: body.position.x,
        centerY: body.position.y,
        width,
        height,
        angleDeg,
        angleRad,
        isFlat,
      })
    })

    return transforms
  }

  function syncBooks(books: Book[], shelfWidth: number, shelfHeight: number): Map<string, PhysicalBookTransform> {
    updateDimensions(shelfWidth, shelfHeight)
    const floorY = shelfHeight - 4

    const activeBookIds = new Set(books.map(b => b.id))

    // Remove obsolete bodies
    bookBodies.forEach((body, id) => {
      if (!activeBookIds.has(id)) {
        Composite.remove(world, body)
        bookBodies.delete(id)
      }
    })

    // Sort books from left to right for stable initial placement
    const sorted = [...books].sort((a, b) => (a.positionX ?? 0) - (b.positionX ?? 0))
    let currentFlowX = 0

    for (const book of sorted) {
      const spineW = calculateSpineWidth(book.pageCount || 0)
      const bookH = calculateBookHeight(book.id)
      const isExplicitFlat = book.layerMode === 'horizontal-stack'

      const width = isExplicitFlat ? bookH : spineW
      const height = isExplicitFlat ? spineW : bookH

      let targetX = book.positionX
      if (targetX === undefined || targetX < 0) {
        targetX = currentFlowX
      }

      // Initial lean nudge based on layerMode or UUID seed
      let initialAngle = 0
      if (book.layerMode === 'leaning-left') {
        initialAngle = -0.09
      } else if (book.layerMode === 'leaning-right') {
        initialAngle = 0.09
      } else if (!isExplicitFlat && spineW <= 45) {
        const dir = getNaturalLeanDirection(book.id)
        initialAngle = dir === 'left' ? -0.06 : 0.06
      }

      let body = bookBodies.get(book.id)
      const centerX = Math.max(width / 2, Math.min(shelfWidth - width / 2, targetX + width / 2))
      const centerY = floorY - height / 2

      if (!body) {
        body = Bodies.rectangle(centerX, centerY, width, height, {
          friction: 0.85,
          frictionStatic: 1.0,
          frictionAir: 0.06,
          restitution: 0.02,
          density: 0.002,
          chamfer: { radius: 2 },
          label: `book-${book.id}`,
        })
        ;(body as any).bookData = { width, height, isExplicitFlat }
        Body.setAngle(body, initialAngle)
        World.add(world, body)
        bookBodies.set(book.id, body)
      } else {
        // Update dimensions if changed
        ;(body as any).bookData = { width, height, isExplicitFlat }
        // If position deviated significantly from target, smoothly reposition
        if (Math.abs(body.position.x - centerX) > 30 || Math.abs(body.position.y - centerY) > 40) {
          Body.setPosition(body, { x: centerX, y: centerY })
          Body.setVelocity(body, { x: 0, y: 0 })
          Body.setAngularVelocity(body, 0)
          Body.setAngle(body, initialAngle)
        }
      }

      currentFlowX = Math.max(currentFlowX, targetX + width + 4)
    }

    // Settle simulation into equilibrium
    return settle(80)
  }

  function settle(maxTicks: number = 80): Map<string, PhysicalBookTransform> {
    const DT = 1000 / 60
    for (let i = 0; i < maxTicks; i++) {
      Engine.update(engine, DT)

      // Early break if all bodies are at rest
      let allSettled = true
      bookBodies.forEach(body => {
        const speedSq = body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y
        const angSpeed = Math.abs(body.angularVelocity)
        if (speedSq > 0.005 || angSpeed > 0.002) {
          allSettled = false
        }
      })
      if (allSettled && i > 25) break
    }

    return getTransforms()
  }

  function destroy() {
    World.clear(world, false)
    Engine.clear(engine)
    bookBodies.clear()
  }

  return {
    engine,
    world,
    floorBody,
    leftWallBody,
    rightWallBody,
    bookBodies,
    updateDimensions,
    syncBooks,
    settle,
    getTransforms,
    destroy,
  }
}
