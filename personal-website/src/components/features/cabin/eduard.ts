// Eduard on the deck (A7, A76). Plain simulation, no three.js or React: the
// scene reads the pose each frame and moves the model.
//
// He's building the deck, so mostly he hammers, in bouts, stopping to set the
// next nail. In between he wipes his brow, looks around (at the guest, Rusty or
// the field), stretches, and now and then gets up, fetches a board from the
// lumber pile and lays it down. Waving at the guest (the welcome) overrides it.

import {
  boardSpot,
  DECK_BOARDS,
  EDUARD_SPOT,
  facing,
  groundHeight,
  turnTowards,
  type Vec2,
} from './world'

type Activity =
  | 'hammer'
  | 'wipe'
  | 'look'
  | 'stretch'
  | 'stand'
  | 'toPile'
  | 'pickup'
  | 'back'
  | 'kneel'
  | 'place'
  /** The deck's done: up on his feet, both arms in the air (A110). */
  | 'cheer'

/** What he does, over and over (a board trip is stand → toPile → … → place). */
const ROUTINE: Activity[] = [
  'hammer',
  'wipe',
  'hammer',
  'look',
  'hammer',
  'stretch',
  'hammer',
  'look',
  'stand',
]
const BOARD_TRIP: Activity[] = ['toPile', 'pickup', 'back', 'kneel', 'place']

/** Where he stands to take a board off the lumber pile (north-east of the deck). */
const PILE = { x: 4.45, z: -0.5, yaw: Math.PI }
const SPOT: Vec2 = { x: EDUARD_SPOT.x, z: EDUARD_SPOT.z }
const WALK_SPEED = 1.3

/** Seconds for the activities that aren't walks. */
function duration(a: Activity) {
  switch (a) {
    case 'hammer':
      return 5 + Math.random() * 4
    case 'wipe':
      return 2.4
    case 'look':
      return 2.8
    case 'stretch':
      return 2.2
    case 'stand':
    case 'kneel':
      return 0.7
    case 'pickup':
      return 1.2
    case 'place':
      return 1.4
    case 'cheer':
      return 2.8
    default:
      return Infinity // walks end when he gets there
  }
}

export function createEduard() {
  return {
    activity: 'hammer' as Activity,
    timer: 0,
    length: duration('hammer'),
    step: 0,
    trip: -1,
    pos: { ...SPOT },
    yaw: EDUARD_SPOT.facing,
    /** 0 kneeling .. 1 standing */
    stand: 0,
    walkPhase: 0,
    walking: false,
    carrying: false,
    /** Head turn (radians, + is his left). */
    headTurn: 0,
    /** Deck boards laid so far (A110); they stay down. */
    placed: 0,
    /** Someone's sitting watching: he gets on with it, board after board. */
    rush: false,
    /** Go straight into another board trip after this (watched). */
    nextTrip: false,
    cheered: false,
  }
}

export type Eduard = ReturnType<typeof createEduard>

const damp = (dt: number, rate: number) => 1 - Math.exp(-rate * dt)

/** The difference between two angles, the short way round (-π..π). */
function angleDiff(a: number, b: number) {
  let d = a - b
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

function begin(e: Eduard, a: Activity) {
  e.activity = a
  e.timer = 0
  e.length = duration(a)
}

const deckDone = (e: Eduard) => e.placed >= DECK_BOARDS.length

function nextActivity(e: Eduard) {
  if (e.nextTrip && !deckDone(e)) {
    e.nextTrip = false
    e.trip = 0
    return begin(e, BOARD_TRIP[0])
  }
  e.nextTrip = false
  if (e.trip >= 0) {
    e.trip += 1
    if (e.trip < BOARD_TRIP.length) return begin(e, BOARD_TRIP[e.trip])
    e.trip = -1
    // the last board's down: on his feet, arms up
    if (deckDone(e) && !e.cheered) {
      e.cheered = true
      return begin(e, 'cheer')
    }
    // watched: a few strikes to nail it down, then the next board
    if (e.rush && !deckDone(e)) {
      begin(e, 'hammer')
      e.length = 2.2
      e.nextTrip = true
      return
    }
  } else if (e.activity === 'stand' && !deckDone(e)) {
    e.trip = 0
    return begin(e, BOARD_TRIP[0])
  }
  e.step = (e.step + 1) % ROUTINE.length
  begin(e, ROUTINE[e.step])
}

/** How close he'll walk up to the guest before stopping to let them by. */
const GIVE_WAY = 0.85

/**
 * Walk towards a point; returns true when there. If the guest is in his way
 * he stops and waits for them (he used to walk straight into them).
 */
function walk(e: Eduard, to: Vec2, dt: number, guest: Vec2) {
  const dx = to.x - e.pos.x
  const dz = to.z - e.pos.z
  const d = Math.hypot(dx, dz)
  if (d < 0.05) {
    e.walking = false
    return true
  }
  const stepLen = Math.min(d, WALK_SPEED * dt)
  const next = { x: e.pos.x + (dx / d) * stepLen, z: e.pos.z + (dz / d) * stepLen }
  const gNow = Math.hypot(e.pos.x - guest.x, e.pos.z - guest.z)
  const gNext = Math.hypot(next.x - guest.x, next.z - guest.z)
  if (gNext < GIVE_WAY && gNext < gNow) {
    e.walking = false
    e.yaw = turnTowards(e.yaw, facing(e.pos, guest), 4 * dt)
    return false
  }
  e.yaw = turnTowards(e.yaw, Math.atan2(dx, dz), 6 * dt)
  e.pos = next
  e.walking = true
  e.walkPhase += dt * 9
  return false
}

/**
 * The welcome: first he greets the guest (stands up, turns to them, waves),
 * then he turns to HUGO to hand them over.
 */
export type Greeting = false | 'guest' | 'hugo'

export function updateEduard(
  e: Eduard,
  dt: number,
  ctx: { guest: Vec2; dog: Vec2; hugo: Vec2; greeting: Greeting; watching?: boolean },
) {
  e.rush = Boolean(ctx.watching)
  // Someone sat down to watch in the middle of his routine: wrap it up and
  // go for the next board.
  const routine = e.trip < 0 && !['cheer', 'stand'].includes(e.activity)
  if (e.rush && routine && !deckDone(e) && !e.nextTrip && e.timer > 1.2) {
    e.nextTrip = true
    nextActivity(e)
  }
  // Greeting the guest: stop where he is, stand up and turn to them; then
  // look over at HUGO when he asks him to show them round.
  if (ctx.greeting) {
    e.walking = false
    e.yaw = turnTowards(e.yaw, facing(e.pos, ctx.guest), 4 * dt)
    e.stand += (1 - e.stand) * damp(dt, 5)
    const turnGoal =
      ctx.greeting === 'hugo'
        ? Math.max(-1.2, Math.min(1.2, angleDiff(facing(e.pos, ctx.hugo), e.yaw)))
        : 0
    e.headTurn += (turnGoal - e.headTurn) * damp(dt, 6)
    return
  }

  e.timer += dt
  let turnGoal = 0
  switch (e.activity) {
    case 'toPile':
      if (walk(e, PILE, dt, ctx.guest)) {
        e.yaw = turnTowards(e.yaw, PILE.yaw, 5 * dt)
        if (Math.abs(angleDiff(e.yaw, PILE.yaw)) < 0.1) nextActivity(e)
      }
      break
    case 'back':
      // to the next board's spot (beside it on the finished boards)
      if (walk(e, deckDone(e) ? SPOT : boardSpot(e.placed), dt, ctx.guest)) {
        e.yaw = turnTowards(e.yaw, EDUARD_SPOT.facing, 5 * dt)
        if (Math.abs(angleDiff(e.yaw, EDUARD_SPOT.facing)) < 0.1) nextActivity(e)
      }
      break
    case 'look': {
      // the guest if they're about, else Rusty, else out over the field
      const near = (p: Vec2, r: number) => Math.hypot(p.x - e.pos.x, p.z - e.pos.z) < r
      const at = near(ctx.guest, 14) ? ctx.guest : near(ctx.dog, 10) ? ctx.dog : { x: 18, z: 2 }
      const rel = angleDiff(facing(e.pos, at), e.yaw)
      turnGoal = Math.max(-1.1, Math.min(1.1, rel))
      break
    }
    default:
      e.walking = false
  }
  if (e.activity === 'pickup' && e.timer > 0.55) e.carrying = true
  if (e.activity === 'place' && e.timer > 0.75 && e.carrying) {
    // the board leaves his hands and stays down on the deck
    e.carrying = false
    e.placed = Math.min(DECK_BOARDS.length, e.placed + 1)
  }
  if (e.activity === 'cheer') {
    // turn to whoever's watching
    e.yaw = turnTowards(e.yaw, facing(e.pos, ctx.guest), 4 * dt)
  }
  const standing = ['stand', 'toPile', 'pickup', 'back', 'cheer'].includes(e.activity)
  e.stand += ((standing ? 1 : 0) - e.stand) * damp(dt, 7)
  e.headTurn += (turnGoal - e.headTurn) * damp(dt, 4)
  if (e.timer >= e.length) nextActivity(e)
}

/** Joint angles, as offsets from the model's kneeling pose (radians). */
export type EduardPose = {
  armR: number
  armL: number
  /** Arm swing sideways (z), + towards his left. */
  armLz: number
  armRz: number
  head: number
  headTurn: number
  /** Whole-body pitch: + leans forward. */
  lean: number
  thighL: number
  thighR: number
  shinL: number
  shinR: number
  /** How quickly joints follow (hammer strikes need to be snappy). */
  snap: number
  /** Height of his feet/knees off the ground he's on. */
  y: number
}

const HALF_PI = Math.PI / 2

export function eduardPose(e: Eduard, t: number, greeting: Greeting): EduardPose {
  const p: EduardPose = {
    armR: 0.35,
    armL: -0.5,
    armLz: 0,
    armRz: 0,
    head: 0,
    headTurn: e.headTurn,
    lean: 0,
    thighL: 0,
    thighR: 0,
    // standing up unfolds the shins from flat-behind to straight down
    shinL: -HALF_PI * e.stand,
    shinR: -HALF_PI * e.stand,
    snap: 10,
    y: groundHeight(e.pos) - 0.13 * (1 - e.stand),
  }
  if (greeting === 'guest') {
    // standing, waving with the free hand (the right one holds the hammer)
    p.armR = 0.9
    p.armL = -2.6
    p.head = 0.15
    return p
  }
  if (greeting === 'hugo') {
    // hammer hand down, the free hand out towards HUGO ("show them around")
    p.armR = 0.8
    p.armL = -1.1
    p.armLz = 0.55
    p.head = 0.1
    return p
  }
  const k = e.timer
  switch (e.activity) {
    case 'hammer': {
      // bouts of strikes (a slow lift, a quick hit), then setting the next nail
      const bout = k % 4.6
      if (bout < 3.4) {
        const cycle = (bout * 1.25) % 1
        const lift = cycle < 0.7 ? cycle / 0.7 : 1 - (cycle - 0.7) / 0.3
        p.armR = 0.35 - lift * 0.9
        p.snap = 22
      } else {
        p.armR = 0.55
        p.armL = -0.95 + Math.sin(t * 10) * 0.06
        p.lean = 0.12
        p.head = 0.15
      }
      break
    }
    case 'wipe': {
      // sit back, rest the hammer, wipe the brow with the forearm
      p.lean = -0.1
      p.armR = 0.75
      const swipe = Math.min(1, Math.max(0, (k - 0.4) / 1.2))
      p.armL = -2.35
      p.armLz = -0.55 + swipe * 0.7
      p.head = -0.05 + Math.sin(swipe * Math.PI) * -0.1
      break
    }
    case 'look':
      p.armR = 0.7
      p.armL = -0.3
      p.head = 0.22
      break
    case 'stretch': {
      // both arms up, arch back, then down again
      const up = Math.sin(Math.min(1, k / e.length) * Math.PI)
      p.armR = 0.35 - 2.0 * up
      p.armL = -0.5 - 2.3 * up
      p.armLz = 0.25 * up
      p.armRz = -0.25 * up
      p.lean = -0.18 * up
      p.head = 0.3 * up
      break
    }
    case 'stand':
    case 'kneel':
      p.armR = 0.6
      p.armL = -0.2
      p.lean = 0.15 * Math.sin(Math.min(1, k / 0.7) * Math.PI)
      break
    case 'toPile':
    case 'back': {
      const swing = e.walking ? Math.sin(e.walkPhase) : 0
      p.thighL = swing * 0.55
      p.thighR = -swing * 0.55
      p.shinL += e.walking ? Math.max(0, -Math.cos(e.walkPhase)) * 0.6 : 0
      p.shinR += e.walking ? Math.max(0, Math.cos(e.walkPhase)) * 0.6 : 0
      p.armR = 0.8 + swing * 0.35
      p.armL = e.carrying ? -0.25 : -swing * 0.4
      p.head = 0.15
      break
    }
    case 'pickup': {
      // bend down, take a board, straighten up
      const bend = Math.sin(Math.min(1, k / e.length) * Math.PI)
      p.lean = 0.55 * bend
      p.armR = 0.6
      p.armL = -0.25 - 0.6 * bend
      break
    }
    case 'cheer': {
      // up on his feet, both arms in the air (hammer and all), a little bounce
      const up =
        Math.sin(Math.min(1, k / 0.5) * HALF_PI) *
        (k > e.length - 0.5 ? Math.max(0, (e.length - k) / 0.5) : 1)
      p.armR = 0.35 - 2.9 * up
      p.armL = -0.5 - 2.5 * up
      p.armLz = 0.3 * up
      p.armRz = -0.3 * up
      p.lean = -0.08 * up
      p.head = -0.1 * up
      p.y += Math.abs(Math.sin(k * 7)) * 0.04 * up
      break
    }
    case 'place': {
      // lean forward and lay the board down
      const bend = Math.sin(Math.min(1, k / e.length) * Math.PI)
      p.lean = 0.4 * bend
      p.armL = -0.25 - 0.9 * bend
      p.armR = 0.5
      p.head = 0.2
      break
    }
  }
  return p
}
