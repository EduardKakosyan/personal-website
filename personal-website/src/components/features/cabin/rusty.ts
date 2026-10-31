// Rusty and his plush cow (A8, A17, A46). Plain simulation, no three.js or React:
// the scene reads the pose each frame and moves the models.
//
// What Rusty does: trots over with the cow, stops, lowers his head and drops it
// at the guest's feet, then waits, tail going. Throw the cow and he chases it,
// picks it up and brings it back. If the guest wanders off from the cow, he
// fetches it and brings it to them again. After the second throw, or if the
// guest walks off after the first, he's had enough: he takes the cow back to
// his spot by the deck and lies down with it (Eduard).

import {
  RUSTY_START,
  blocked,
  clampToWalkable,
  facing,
  landingSpot,
  turnTowards,
  type Vec2,
} from './world'

type DogState =
  | 'home'
  | 'approach'
  | 'drop'
  | 'waiting'
  | 'chase'
  | 'pickup'
  | 'return'
  | 'toBed'
  | 'lying'
type CowState = 'carried' | 'air' | 'ground'

const GRAVITY = 14
const COW_REST_Y = 0
/** How close the guest must be to the cow to throw it. */
export const THROW_REACH = 3.6
/** Throws before Rusty goes to lie down. */
const THROWS_BEFORE_REST = 2
/** His spot: by the deck, facing the yard. */
const BED = { ...RUSTY_START, yaw: 0 }

export function createRusty(start: Vec2, yaw: number) {
  return {
    state: 'home' as DogState,
    pos: { ...start },
    yaw,
    speed: 0,
    stuck: 0,
    gait: 0,
    /** 0..1, how far the head is lowered (dropping or picking up). */
    headDown: 0,
    /** Time spent in the current state. */
    timer: 0,
    excitement: 0.4,
    firstDropDone: false,
    throws: 0,
    /** Set when he's decided to stop playing and lie down. */
    tired: false,
    /** 0..1, how far he has lain down. */
    lie: 0,
    cow: {
      state: 'carried' as CowState,
      pos: { x: 0, y: 0, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      spin: { x: 0, y: 0 },
      rot: { x: 0, y: 0 },
      settled: 0,
    },
  }
}

export type Rusty = ReturnType<typeof createRusty>

const damp = (dt: number, rate: number) => 1 - Math.exp(-rate * dt)

/** Where Rusty stands to give the guest the cow: beside them on the right, so the camera (behind the guest) sees it. */
function guestFront(guest: Vec2, guestYaw: number): Vec2 {
  return clampToWalkable({
    x: guest.x + Math.sin(guestYaw) * 0.55 - Math.cos(guestYaw) * 1.25,
    z: guest.z + Math.cos(guestYaw) * 0.55 + Math.sin(guestYaw) * 1.25,
  })
}

/**
 * Steer towards a goal: speed up and slow down smoothly, turn gradually, and
 * curve around things in the way. Returns the distance left.
 */
function steer(r: Rusty, goal: Vec2, maxSpeed: number, dt: number) {
  const dx = goal.x - r.pos.x
  const dz = goal.z - r.pos.z
  const dist = Math.hypot(dx, dz)
  // arrive: ease off over the last stretch
  const wanted = dist < 0.15 ? 0 : maxSpeed * Math.min(1, dist / 1.6)
  const accel = wanted > r.speed ? 7 : 10
  r.speed += Math.max(-accel * dt, Math.min(accel * dt, wanted - r.speed))
  if (dist > 0.15) r.yaw = turnTowards(r.yaw, Math.atan2(dx, dz), (3 + r.speed * 1.2) * dt)

  if (r.speed > 0.01) {
    const stepLen = r.speed * dt
    // try straight ahead, then gradually wider detours
    for (const off of [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4]) {
      const a = r.yaw + off
      const next = { x: r.pos.x + Math.sin(a) * stepLen, z: r.pos.z + Math.cos(a) * stepLen }
      if (!blocked(next, 0.22)) {
        r.pos = next
        if (off !== 0) r.yaw = turnTowards(r.yaw, a, 4 * dt)
        r.stuck = 0
        return dist
      }
    }
    r.speed *= 0.5
    r.stuck += dt
  }
  return dist
}

function enter(r: Rusty, state: DogState) {
  r.state = state
  r.timer = 0
}

/** Let go of the cow: it tumbles out of his mouth onto the ground. */
function dropCow(r: Rusty) {
  const c = r.cow
  c.state = 'air'
  c.vel = { x: Math.sin(r.yaw) * 0.35, y: 0.5, z: Math.cos(r.yaw) * 0.35 }
  c.spin = { x: 3, y: 1.5 }
  c.settled = 0
}

/** Throw the cow towards a point (clamped to a sensible distance). Returns false if it can't be thrown now. */
export function throwCow(r: Rusty, guest: Vec2, toward: Vec2 | null) {
  const c = r.cow
  if (!canThrow(r, guest)) return false
  const from = { x: c.pos.x, z: c.pos.z }
  // Without an aim, throw it away from the guest.
  const aim = toward ?? {
    x: from.x + (from.x - guest.x) * 4 + 0.01,
    z: from.z + (from.z - guest.z) * 4,
  }
  const reach = Math.min(7, Math.max(3.5, Math.hypot(aim.x - from.x, aim.z - from.z)))
  const to = landingSpot(from, aim, reach)
  const T = 0.75 + reach * 0.04
  c.state = 'air'
  c.pos.y = 0.45
  c.vel = {
    x: (to.x - from.x) / T,
    y: (-c.pos.y + 0.5 * GRAVITY * T * T) / T,
    z: (to.z - from.z) / T,
  }
  c.spin = { x: 9 + Math.random() * 4, y: 3 }
  c.settled = 0
  r.excitement = 1
  r.throws += 1
  if (r.throws >= THROWS_BEFORE_REST) r.tired = true
  enter(r, 'chase')
  return true
}

export function canThrow(r: Rusty, guest: Vec2) {
  const c = r.cow
  return (
    c.state === 'ground' &&
    c.settled > 0.25 &&
    r.state === 'waiting' &&
    Math.hypot(c.pos.x - guest.x, c.pos.z - guest.z) < THROW_REACH
  )
}

export function startApproach(r: Rusty) {
  if (r.state === 'home') {
    r.excitement = 1
    enter(r, 'approach')
  }
}

/** The cow's physics: a throw arc, a couple of bounces, a short roll. */
function updateCow(r: Rusty, dt: number, mouth: { x: number; y: number; z: number }) {
  const c = r.cow
  if (c.state === 'carried') {
    // Ease into the mouth, so picking it up doesn't snap.
    const k = damp(dt, 18)
    c.pos.x += (mouth.x - c.pos.x) * k
    c.pos.y += (mouth.y - c.pos.y) * k
    c.pos.z += (mouth.z - c.pos.z) * k
    c.rot.x += (0.15 - c.rot.x) * k
    c.rot.y = r.yaw
    return
  }
  if (c.state === 'air') {
    c.vel.y -= GRAVITY * dt
    c.pos.x += c.vel.x * dt
    c.pos.y += c.vel.y * dt
    c.pos.z += c.vel.z * dt
    c.rot.x += c.spin.x * dt
    c.rot.y += c.spin.y * dt
    if (c.pos.y <= COW_REST_Y) {
      c.pos.y = COW_REST_Y
      if (Math.abs(c.vel.y) > 2) {
        // bounce
        c.vel.y = -c.vel.y * 0.35
        c.vel.x *= 0.55
        c.vel.z *= 0.55
        c.spin.x *= 0.5
      } else {
        c.state = 'ground'
        c.vel.y = 0
      }
    }
    return
  }
  // on the ground: roll to a stop and settle upright
  const k = damp(dt, 4)
  const next = { x: c.pos.x + c.vel.x * dt, z: c.pos.z + c.vel.z * dt }
  if (!blocked(next, 0.15)) {
    c.pos.x = next.x
    c.pos.z = next.z
  }
  c.vel.x -= c.vel.x * k
  c.vel.z -= c.vel.z * k
  c.rot.x += (Math.round(c.rot.x / (Math.PI * 2)) * Math.PI * 2 - c.rot.x) * damp(dt, 6)
  c.settled += dt
}

export type RustyPose = {
  moving: boolean
  /** 0..1, used to scale the legs and the bounce. */
  stride: number
}

/**
 * One frame. `mouth` is where the cow sits when carried (from the model).
 * Returns what the scene needs to animate the legs.
 */
export function updateRusty(
  r: Rusty,
  dt: number,
  guest: Vec2,
  guestYaw: number,
  mouth: { x: number; y: number; z: number },
  onFirstDrop: () => void,
): RustyPose {
  r.timer += dt
  const c = r.cow
  const front = guestFront(guest, guestYaw)
  let target: Vec2 | null = null
  let maxSpeed = 0
  let headGoal = 0

  switch (r.state) {
    case 'home':
      r.yaw = turnTowards(r.yaw, facing(r.pos, guest), 2 * dt)
      break
    case 'approach':
    case 'return': {
      if (r.state === 'return' && Math.hypot(guest.x - r.pos.x, guest.z - r.pos.z) > 7) {
        // the guest walked away from him while he was bringing it back
        r.tired = true
        enter(r, 'toBed')
        break
      }
      target = front
      maxSpeed = r.state === 'approach' ? 3.6 : 4.2
      const left = steer(r, target, maxSpeed, dt)
      if ((left < 0.3 && r.speed < 0.5) || r.stuck > 0.6) enter(r, 'drop')
      break
    }
    case 'drop': {
      // stop, look at the guest, lower the head, let go, look up
      r.speed = Math.max(0, r.speed - 8 * dt)
      r.yaw = turnTowards(r.yaw, facing(r.pos, guest), 4 * dt)
      headGoal = r.timer < 0.55 ? 1 : 0
      if (c.state === 'carried' && r.timer > 0.4) {
        dropCow(r)
        if (!r.firstDropDone) {
          r.firstDropDone = true
          onFirstDrop()
        }
      }
      if (r.timer > 0.85) enter(r, 'waiting')
      break
    }
    case 'waiting': {
      // stay close; glance between the cow and the guest
      const toGuest = Math.hypot(guest.x - r.pos.x, guest.z - r.pos.z)
      const cowFromGuest = Math.hypot(c.pos.x - guest.x, c.pos.z - guest.z)
      if (c.state === 'ground' && cowFromGuest > 4.5) {
        // The guest walked off. Before any throw he brings the cow again;
        // after a throw he takes it and goes to lie down.
        if (r.throws > 0) r.tired = true
        enter(r, 'chase')
        break
      }
      if (toGuest > 2.6) steer(r, front, 3, dt)
      else {
        steer(r, r.pos, 0, dt)
        const look = Math.sin(r.timer * 0.9) > 0.2 && c.state === 'ground' ? c.pos : guest
        r.yaw = turnTowards(r.yaw, facing(r.pos, look), 3 * dt)
      }
      r.excitement += (0.75 - r.excitement) * damp(dt, 1)
      break
    }
    case 'chase': {
      // run to where the cow is going (a little ahead of it while it flies)
      const lead = c.state === 'air' ? 0.35 : 0
      target = { x: c.pos.x + c.vel.x * lead, z: c.pos.z + c.vel.z * lead }
      const left = steer(r, target, 5.2, dt)
      if (c.state === 'ground' && ((left < 0.45 && r.speed < 1.2) || r.stuck > 0.6))
        enter(r, 'pickup')
      break
    }
    case 'pickup': {
      r.speed = Math.max(0, r.speed - 8 * dt)
      r.yaw = turnTowards(r.yaw, facing(r.pos, c.pos), 5 * dt)
      headGoal = r.timer < 0.45 ? 1 : 0
      if (c.state !== 'carried' && r.timer > 0.3) c.state = 'carried'
      if (r.timer > 0.6) enter(r, r.tired ? 'toBed' : 'return')
      break
    }
    case 'toBed': {
      // an easy trot back to his spot
      const left = steer(r, BED, 2.3, dt)
      r.excitement += (0.35 - r.excitement) * damp(dt, 1)
      if ((left < 0.25 && r.speed < 0.4) || r.stuck > 0.8) enter(r, 'lying')
      break
    }
    case 'lying': {
      // turn round, lie down, put the cow down between his paws
      r.speed = Math.max(0, r.speed - 6 * dt)
      r.yaw = turnTowards(r.yaw, BED.yaw, 3 * dt)
      if (r.timer > 0.5) r.lie += (1 - r.lie) * damp(dt, 4)
      if (c.state === 'carried' && r.lie > 0.7) {
        dropCow(r)
        c.vel.x *= 0.6
        c.vel.z *= 0.6
      }
      headGoal = c.state === 'carried' ? 0.4 : 0.15 + Math.max(0, Math.sin(r.timer * 0.5)) * 0.1
      r.excitement += (0.2 - r.excitement) * damp(dt, 0.8)
      break
    }
  }

  r.headDown += (headGoal - r.headDown) * damp(dt, 10)
  if (r.state !== 'waiting' && r.state !== 'home' && r.state !== 'toBed' && r.state !== 'lying')
    r.excitement += (1 - r.excitement) * damp(dt, 2)
  updateCow(r, dt, mouth)

  const stride = Math.min(1, r.speed / 3)
  r.gait += dt * (5 + r.speed * 2.8) * (r.speed > 0.05 ? 1 : 0)
  return { moving: r.speed > 0.05, stride }
}
