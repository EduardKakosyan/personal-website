// Eduard on the deck (A7, A76). Plain simulation, no three.js or React: the
// scene reads the pose each frame and moves the model.
//
// He's building the deck, so mostly he hammers, in bouts, stopping to set the
// next nail. In between he wipes his brow, looks around (at the guest, Rusty or
// the field), stretches, and now and then gets up, fetches a board from the
// lumber pile and lays it down. Waving at the guest (the welcome) overrides it.
//
// At night (scene 7, A22) he's in his camp chair by the fire, toasting a
// marshmallow, where the guest can ask him things (A26, A30). (When HUGO calls
// the guest back from the brook the camera cuts to him there, so he doesn't
// walk over: he's already sitting with the fire going.)

import { FIRE_SEATS, SEAT_Y } from './fire'
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
  // the night (scene 7): in his chair by the fire
  | 'fireside'

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
    /** The night: he's done with the deck and is sitting by the fire. */
    fire: false,
    /** The fire's lit (the scene starts the flames). */
    lit: false,
    /** 0 standing .. 1 sitting in his camp chair. */
    sit: 0,
    /** Answering the guest: he turns to them and talks with his hands. */
    talking: false,
    /**
     * The marshmallow on his stick: seconds since it went over the fire. It
     * browns, he takes it off and eats it, and a new one goes on.
     */
    toast: 0,
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

/** How long a marshmallow toasts, and how long he takes over eating it. */
export const TOAST_TIME = 17
const EAT_TIME = 4.2

/**
 * What the marshmallow is doing: `brown` 0 white .. 1 golden; `out` 0 held
 * over the fire .. 1 brought up to his mouth; `gone` while there's none on
 * the stick (he's just eaten it).
 */
export function marshmallow(e: Eduard) {
  const t = e.toast
  if (t < TOAST_TIME) return { brown: Math.min(1, t / (TOAST_TIME - 2)), out: 0, gone: false }
  const k = (t - TOAST_TIME) / EAT_TIME
  // up to look at it and blow on it, a bite, the stick back down
  const out = k < 0.25 ? k / 0.25 : k < 0.7 ? 1 : Math.max(0, 1 - (k - 0.7) / 0.3)
  return { brown: 1, out, gone: k > 0.55 }
}

/**
 * Night's coming on (HUGO has called the guest back from the brook): he's in
 * his camp chair with the fire going, a marshmallow on a stick over it.
 */
export function seatAtFire(e: Eduard) {
  const seat = FIRE_SEATS.eduard
  e.fire = true
  e.trip = -1
  e.nextTrip = false
  e.carrying = false
  e.rush = false
  e.walking = false
  e.lit = true
  e.pos = { x: seat.x, z: seat.z }
  e.yaw = seat.yaw
  e.stand = 1
  e.sit = 1
  e.toast = 4
  begin(e, 'fireside')
}

const ease = (k: number) => k * k * (3 - 2 * k)

/** By the fire: he toasts his marshmallow, and turns to the guest when they talk. */
function updateAtFire(e: Eduard, dt: number, ctx: { guest: Vec2; talking?: boolean }) {
  const seat = FIRE_SEATS.eduard
  e.timer += dt
  e.talking = Boolean(ctx.talking)
  e.walking = false
  e.sit = 1
  e.stand = 1
  e.pos = { x: seat.x, z: seat.z }
  e.yaw = seat.yaw
  // (a marshmallow that's ready waits while he's talking: he doesn't eat mid-sentence)
  if (!(e.talking && e.toast >= TOAST_TIME - 0.5 && e.toast < TOAST_TIME + 0.2)) e.toast += dt
  if (e.toast > TOAST_TIME + EAT_TIME) e.toast = 0
  // He watches the marshmallow; he looks over at the guest when they're
  // talking, and now and then when they're near.
  let turnGoal = 0
  const near = Math.hypot(ctx.guest.x - e.pos.x, ctx.guest.z - e.pos.z) < 4.5
  const glance = near && Math.sin(e.timer * 0.45) > 0.35
  if (e.talking || glance)
    turnGoal = Math.max(-1.25, Math.min(1.25, angleDiff(facing(e.pos, ctx.guest), e.yaw)))
  e.headTurn += (turnGoal - e.headTurn) * damp(dt, 4)
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
  ctx: {
    guest: Vec2
    dog: Vec2
    hugo: Vec2
    greeting: Greeting
    watching?: boolean
    /** At the fire: he's answering the guest. */
    talking?: boolean
  },
) {
  if (e.fire) return updateAtFire(e, dt, ctx)
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
  /** The hammer in his fist: + swings its head down past the hand. */
  wrist: number
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
    wrist: 0,
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
  if (e.fire) return firePose(p, e, t, greeting)
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
        // Each strike lands on the board in front of his knees: he leans in
        // over it, the arm comes down and the wrist flicks the head onto the
        // nail; then up again, the wrist cocked back. (He used to swing at
        // the air beside him.) The other hand steadies the board.
        const cycle = (bout * 1.25) % 1
        const lift = cycle < 0.7 ? cycle / 0.7 : 1 - (cycle - 0.7) / 0.3
        const up = lift * lift * (3 - 2 * lift)
        p.armR = 0.67 - up * 1.45
        p.wrist = 1.05 - up * 1.5
        p.lean = 0.3 - up * 0.18
        p.armL = -0.7
        p.head = 0.28 - up * 0.1
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

/**
 * By the fire: sitting in his camp chair, the stick with the marshmallow held
 * out over the flames in his right hand (turning it; up to his mouth when
 * it's done), his left hand on his knee, or talking with it when he answers,
 * or waving the guest off when they go.
 */
function firePose(p: EduardPose, e: Eduard, t: number, greeting: Greeting): EduardPose {
  const sit = ease(e.sit)
  // sitting: thighs out along the seat, shins hanging, up on the chair
  p.thighL = -1.5 * sit
  p.thighR = -1.5 * sit
  p.shinL += 1.5 * sit
  p.shinR += 1.5 * sit
  p.y += sit * (SEAT_Y - 0.4 + 0.03)
  // (his arms hang at 0.8 and 0: the model's own pose has the hammer arm up)
  const m = marshmallow(e)
  // the stick arm: out towards the fire, a little lower while he's talking,
  // and up to his face to eat
  const reach = e.talking ? 0.5 : 0.95
  p.armR = 0.8 - reach - 1.15 * m.out + Math.sin(t * 0.9) * 0.03
  p.armRz = 0.12 * m.out
  p.armL = -0.55
  p.lean = 0.1 - 0.14 * m.out
  p.head = 0.2 - 0.12 * m.out
  if (greeting === 'guest') {
    // "Come back anytime": a wave from his chair (the scene waggles the hand)
    p.armL = -2.5
    p.head = 0.05
    p.lean = 0
  } else if (e.talking) {
    // talking with his free hand
    p.armL = -1.0 + Math.sin(t * 2.6) * 0.22 + Math.sin(t * 4.3) * 0.08
    p.armLz = 0.25 + Math.sin(t * 1.9) * 0.12
    p.head = 0.08 + Math.sin(t * 3.1) * 0.04
    p.lean = 0.02
  }
  return p
}
