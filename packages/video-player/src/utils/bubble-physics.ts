export interface Position {
  x: number
  y: number
}

export interface Velocity {
  x: number
  y: number
}

export interface BubblePhysics {
  position: Position
  velocity: Velocity
  isMoving: boolean
}

export const PHYSICS_CONFIG = {
  FRICTION: 0.92,
  BOUNCE_DAMPENING: 0.7,
  MIN_VELOCITY: 0.3,
  GRAVITY: 0.3,
  MAX_VELOCITY: 25
}

export function calculateFlickVelocity(
  startPos: Position,
  endPos: Position,
  timeDelta: number
): Velocity {
  const deltaX = endPos.x - startPos.x
  const deltaY = endPos.y - startPos.y
  const time = Math.max(timeDelta, 16) // Minimum 16ms to avoid division by very small numbers
  
  let velocityX = (deltaX / time) * 16 // Scale to 60fps
  let velocityY = (deltaY / time) * 16
  
  // Cap maximum velocity
  const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY)
  if (magnitude > PHYSICS_CONFIG.MAX_VELOCITY) {
    const scale = PHYSICS_CONFIG.MAX_VELOCITY / magnitude
    velocityX *= scale
    velocityY *= scale
  }
  
  return { x: velocityX, y: velocityY }
}

export function updateBubblePosition(
  bubble: BubblePhysics,
  bubbleSize: number,
  screenWidth: number,
  screenHeight: number
): BubblePhysics {
  if (!bubble.isMoving) return bubble

  const radius = bubbleSize / 2
  let newVelocityX = bubble.velocity.x * PHYSICS_CONFIG.FRICTION
  let newVelocityY = bubble.velocity.y * PHYSICS_CONFIG.FRICTION
  
  let newX = bubble.position.x + newVelocityX
  let newY = bubble.position.y + newVelocityY

  // Check horizontal bounds and bounce
  if (newX - radius < 0) {
    newX = radius
    newVelocityX = -newVelocityX * PHYSICS_CONFIG.BOUNCE_DAMPENING
  } else if (newX + radius > screenWidth) {
    newX = screenWidth - radius
    newVelocityX = -newVelocityX * PHYSICS_CONFIG.BOUNCE_DAMPENING
  }

  // Check vertical bounds and bounce
  if (newY - radius < 0) {
    newY = radius
    newVelocityY = -newVelocityY * PHYSICS_CONFIG.BOUNCE_DAMPENING
  } else if (newY + radius > screenHeight) {
    newY = screenHeight - radius
    newVelocityY = -newVelocityY * PHYSICS_CONFIG.BOUNCE_DAMPENING
  }

  // Check if bubble should stop moving
  const speed = Math.sqrt(newVelocityX * newVelocityX + newVelocityY * newVelocityY)
  const isStillMoving = speed > PHYSICS_CONFIG.MIN_VELOCITY

  return {
    position: { x: newX, y: newY },
    velocity: { x: newVelocityX, y: newVelocityY },
    isMoving: isStillMoving
  }
}

export function checkCircleCollision(
  pos1: Position,
  radius1: number,
  pos2: Position,
  radius2: number
): boolean {
  const dx = pos1.x - pos2.x
  const dy = pos1.y - pos2.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < (radius1 + radius2)
}

export function generateRandomPosition(
  bubbleSize: number,
  screenWidth: number,
  screenHeight: number,
  avoidAreas: { x: number, y: number, radius: number }[] = []
): Position {
  const radius = bubbleSize / 2
  const maxAttempts = 50
  
  for (let i = 0; i < maxAttempts; i++) {
    const x = radius + Math.random() * (screenWidth - bubbleSize)
    const y = radius + Math.random() * (screenHeight - bubbleSize)
    
    // Check if position overlaps with avoid areas
    const overlaps = avoidAreas.some(area => 
      checkCircleCollision({ x, y }, radius, { x: area.x, y: area.y }, area.radius)
    )
    
    if (!overlaps) {
      return { x, y }
    }
  }
  
  // Fallback position if no valid position found
  return {
    x: radius + Math.random() * (screenWidth - bubbleSize),
    y: radius + Math.random() * (screenHeight - bubbleSize)
  }
}

export function generateStatementPosition(
  bubbleSize: number,
  screenWidth: number
): Position {
  const radius = bubbleSize / 2
  const minY = 60
  const maxY = 100
  
  return {
    x: radius + Math.random() * (screenWidth - bubbleSize),
    y: minY + Math.random() * (maxY - minY)
  }
}