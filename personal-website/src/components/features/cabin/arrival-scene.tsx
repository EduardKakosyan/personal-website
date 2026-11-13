'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SpeechBubble, type Speaker } from './speech-bubble'
import {
  PixelPass,
  configureLook,
  cutaway,
  makeGroundMaterial,
  toFadeable,
  toToon,
} from './pixel-look'
import { InteractPrompt, type PromptInput } from './interact-prompt'
import { createEduard, eduardPose, updateEduard } from './eduard'
import { NameTag } from './name-tag'
import {
  PET_REACH,
  canRubBelly,
  canSeeTag,
  canPet,
  canThrow,
  createRusty,
  holdsStill,
  lookUp,
  petRusty,
  rubBelly,
  startApproach,
  throwCow,
  updateRusty,
} from './rusty'
import {
  DOOR,
  EDUARD_BLOCK,
  EDUARD_SPOT,
  READABLES,
  GUEST_SKIP,
  GUEST_START,
  MODELS,
  RUSTY_RUN_START,
  RUSTY_START,
  SKY,
  WELCOME_DISTANCE,
  WELCOME_POINT,
  CABIN_FLOOR_Y,
  clampInsideCabin,
  clampToWalkable,
  facing,
  groundHeight,
  insideCabin,
  step,
  turnTowards,
  type Look,
  type ReadableId,
  type Vec2,
} from './world'

export type Bubble = { speaker: Speaker; text: string } | null

/** Eduard's face: the two options for A54. */
export type Face = 'beard' | 'mustache'

export type ArrivalSceneProps = {
  dpr: number
  look: Look
  lofi: boolean
  face: Face
  bubble: Bubble
  eduardGreeting: boolean
  startNearCabin: boolean
  onReady: () => void
  onFirstMove: () => void
  onGuestNear: () => void
  onCowDropped: () => void
  /** HUGO has introduced Rusty: he runs down the driveway to the guest. */
  rustyGo: boolean
  /** Rusty has set off down the driveway (HUGO points him out). */
  onRustyComing: () => void
  /** The first time the guest steps into the cabin. */
  onEnterCabin: () => void
  /** The guest picked up the résumé or looked at the to-do list. */
  onRead: (id: ReadableId) => void
}

/** What the prompt over the nearest usable thing does. */
type PromptId = 'throw' | 'pet' | 'rub' | 'tag' | 'door-in' | 'door-out' | ReadableId
const PROMPT_LABELS: Record<PromptId, string> = {
  throw: 'Throw',
  pet: 'Pet',
  rub: 'Rub belly',
  tag: 'Name tag',
  'door-in': 'Go in',
  'door-out': 'Go out',
  resume: 'Read',
  todo: 'Read',
}
/** The roof, south wall and string lights fade when the guest is inside. */
const CUTAWAY_PARTS = ['Cabin_Roof', 'Cabin_SouthWall', 'StringLights']
/** How long Rusty's name tag stays up, in seconds. */
const TAG_TIME = 6

Object.values(MODELS).forEach((url) => useGLTF.preload(url))

// ------------------------------------------------------------------ helpers
const noRaycast = () => {}

let groundMaterial: THREE.Material | null = null

function useModel(
  url: string,
  opts: { shadows?: boolean; raycast?: boolean; fade?: boolean } = {},
) {
  const gltf = useGLTF(url)
  return useMemo(() => {
    const scene = gltf.scene.clone(true)
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const named = (prefix: string) =>
        o.name.startsWith(prefix) || Boolean(o.parent?.name.startsWith(prefix))
      const isGround = named('Ground')
      const flat = isGround || named('StringLights') || named('Brook')
      mesh.castShadow = opts.shadows !== false && !flat
      mesh.receiveShadow = true
      if (isGround) mesh.material = groundMaterial ??= makeGroundMaterial()
      else if (opts.fade && !named('Cabin_Door'))
        mesh.material = toFadeable(mesh.material as THREE.Material)
      else mesh.material = toToon(mesh.material as THREE.Material)
      if (!opts.raycast) mesh.raycast = noRaycast
    })
    return scene
  }, [gltf, opts.shadows, opts.raycast, opts.fade])
}

function node(root: THREE.Object3D, name: string) {
  const found = root.getObjectByName(name)
  if (!found) throw new Error(`missing node ${name}`)
  return { obj: found, base: found.rotation.clone() }
}

type Joint = ReturnType<typeof node>

type Groups = Record<'hiker' | 'eduard' | 'rusty' | 'cow' | 'hugo', THREE.Object3D>

/** Find the animated parts by the names the Blender script gives them. */
function buildRig(g: Groups) {
  return {
    hiker: {
      legL: node(g.hiker, 'Hiker_LegL'),
      legR: node(g.hiker, 'Hiker_LegR'),
      shinL: node(g.hiker, 'Hiker_ShinL'),
      shinR: node(g.hiker, 'Hiker_ShinR'),
      armL: node(g.hiker, 'Hiker_ArmL'),
      armR: node(g.hiker, 'Hiker_ArmR'),
    },
    eduard: {
      armR: node(g.eduard, 'Eduard_ArmR'),
      armL: node(g.eduard, 'Eduard_ArmL'),
      head: node(g.eduard, 'Eduard_Head'),
      torso: node(g.eduard, 'Eduard_Torso'),
      legL: node(g.eduard, 'Eduard_LegL'),
      legR: node(g.eduard, 'Eduard_LegR'),
      shinL: node(g.eduard, 'Eduard_ShinL'),
      shinR: node(g.eduard, 'Eduard_ShinR'),
      board: node(g.eduard, 'Eduard_Board'),
    },
    rusty: {
      fl: node(g.rusty, 'Rusty_LegFL'),
      fr: node(g.rusty, 'Rusty_LegFR'),
      bl: node(g.rusty, 'Rusty_LegBL'),
      br: node(g.rusty, 'Rusty_LegBR'),
      head: node(g.rusty, 'Rusty_Head'),
      tail: node(g.rusty, 'Rusty_Tail'),
      mouth: node(g.rusty, 'Rusty_Mouth'),
      tag: node(g.rusty, 'Rusty_Tag'),
    },
    hugo: {
      head: node(g.hugo, 'Hugo_Head'),
      antL: node(g.hugo, 'Hugo_AntennaL'),
      antR: node(g.hugo, 'Hugo_AntennaR'),
    },
  }
}

type Rig = ReturnType<typeof buildRig>

const tmp = new THREE.Vector3()
const CAMERA_SIDE = -2.6
const damp = (dt: number, speed: number) => 1 - Math.exp(-speed * dt)

// ------------------------------------------------------------------ the world
function World(props: Omit<ArrivalSceneProps, 'dpr'>) {
  const { look, lofi, face, bubble, eduardGreeting, startNearCabin } = props
  const callbacks = useRef(props)
  useEffect(() => {
    callbacks.current = props
  })

  const set = useModel(MODELS.set)
  const hiker = useModel(MODELS.hiker)
  const eduard = useModel(MODELS.eduard)
  const rusty = useModel(MODELS.rusty)
  const hugo = useModel(MODELS.hugo)
  const cow = useModel(MODELS.cow, { raycast: true })
  const cabinParts = useModel(MODELS.cabinParts, { fade: true })
  /** The door and the fading parts, found once the frame loop starts. */
  const parts = useRef<{ door: Joint; cut: THREE.Object3D[] } | null>(null)

  const rig = useRef<Rig | null>(null)

  // Mutable simulation state (kept out of React so the frame loop stays cheap).
  const sim = useRef({
    guest: { ...(startNearCabin ? GUEST_SKIP : GUEST_START) } as Vec2,
    target: null as Vec2 | null,
    /** Waypoints still to walk after the current target (e.g. through the door). */
    route: [] as Vec2[],
    guestY: 0,
    inside: false,
    enteredCabin: false,
    doorOpen: 0,
    cut: 0,
    prompt: null as PromptId | null,
    /** The guest clicked Rusty: offer his name tag once they're beside him. */
    tagAsked: false,
    /** Seconds left showing his name tag. */
    tagShow: 0,
    /** Walking over to rub his belly; starts when the guest gets there. */
    pendingRub: false,
    /** 0..1, how far the guest has crouched (rubbing Rusty's belly). */
    crouch: 0,
    guestYaw: Math.PI,
    walkPhase: 0,
    moved: false,
    guestStuck: 0,
    idleSince: 0,
    welcomed: false,
    // Rusty first (A76): unless starting by the cabin, he's already running
    // down the driveway with the cow when the site opens.
    // (He waits there, sitting, until HUGO introduces him.)
    dog: startNearCabin
      ? createRusty(RUSTY_START, Math.PI * 0.85)
      : { ...createRusty(RUSTY_RUN_START, 0), homeSit: true },
    rustySent: false,
    /** Eduard on the deck (eduard.ts). */
    ed: createEduard(),
    edLean: 0,
    edY: EDUARD_SPOT.y,
    /** Where the mouse points on the ground (for aiming a throw). */
    aim: null as Vec2 | null,
    hugo: new THREE.Vector3(GUEST_START.x + 0.9, 1.0, GUEST_START.z - 0.2),
    zoom: startNearCabin ? 1 : 0.72,
    hugoYaw: Math.PI,
    marker: { x: 0, z: 0, life: 0 },
    clock: 0,
  })

  const hikerG = useRef<THREE.Group>(null)
  const eduardG = useRef<THREE.Group>(null)
  const rustyG = useRef<THREE.Group>(null)
  const cowG = useRef<THREE.Group>(null)
  const hugoG = useRef<THREE.Group>(null)
  const marker = useRef<THREE.Mesh>(null)
  const aimRing = useRef<THREE.Mesh>(null)
  const promptAnchor = useRef<THREE.Group>(null)
  const [prompt, setPrompt] = useState<PromptId | null>(null)
  const [tagOpen, setTagOpen] = useState(false)
  const tagAnchor = useRef<THREE.Group>(null)
  // Computers get a right-click prompt; touch screens get a button to tap.
  const [input] = useState<PromptInput>(() =>
    window.matchMedia('(hover: none)').matches ? 'tap' : 'right-click',
  )
  const hugoAnchor = useRef<THREE.Group>(null)
  const eduardAnchor = useRef<THREE.Group>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const lookAt = useRef(new THREE.Vector3(GUEST_START.x, 0.5, GUEST_START.z - 5))
  const { camera, size } = useThree()

  useEffect(() => {
    callbacks.current.onReady()
  }, [])

  // Handy when checking the scene from a test browser; not exposed in production.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production')
      Object.assign(window, { __cabin: sim, __cabinCamera: camera, __cabinEduard: eduard })
  }, [camera, eduard])

  useEffect(() => {
    if (sun.current) sun.current.castShadow = !lofi
  }, [lofi])

  useEffect(() => {
    const beard = eduard.getObjectByName('Eduard_Beard')
    const mustache = eduard.getObjectByName('Eduard_Mustache')
    if (beard) beard.visible = face === 'beard'
    if (mustache) mustache.visible = face === 'mustache'
  }, [eduard, face])

  /** Walk somewhere; going in or out of the cabin goes through the door. */
  const walkTo = (to: Vec2) => {
    const s = sim.current
    const goal = clampToWalkable(to)
    const from = insideCabin(s.guest)
    const into = insideCabin(goal)
    s.route =
      from === into
        ? [goal]
        : into
          ? [DOOR.outside, DOOR.inside, goal]
          : [DOOR.inside, DOOR.outside, goal]
    s.target = s.route.shift() ?? null
    s.marker = { ...goal, life: 1 }
    s.pendingRub = false
    s.tagAsked = false
    if (!s.moved) {
      s.moved = true
      callbacks.current.onFirstMove()
    }
  }

  const onGroundDown = (e: ThreeEvent<PointerEvent>) => {
    // Only the main button (or a tap) walks; right-click uses the prompt.
    if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
    e.stopPropagation()
    if (insideCabin(sim.current.guest)) {
      // Inside, taps stay inside: aim at the floor (it sits above the yard)
      // and keep the spot within the walls.
      const k = (CABIN_FLOOR_Y - e.ray.origin.y) / e.ray.direction.y
      const onFloor = k > 0 ? e.ray.at(k, tmp) : e.point
      walkTo(clampInsideCabin({ x: onFloor.x, z: onFloor.z }))
      return
    }
    walkTo({ x: e.point.x, z: e.point.z })
  }

  const onGroundMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.pointerType === 'mouse') sim.current.aim = { x: e.point.x, z: e.point.z }
  }

  /** A spot beside Rusty, on the guest's side of him. */
  const besideRusty = (gap: number): Vec2 => {
    const s = sim.current
    const d = s.dog
    const dx = s.guest.x - d.pos.x
    const dz = s.guest.z - d.pos.z
    const len = Math.hypot(dx, dz) || 1
    return { x: d.pos.x + (dx / len) * gap, z: d.pos.z + (dz / len) * gap }
  }

  /** Do what the current prompt says. `aim` is where a right-click pointed. */
  const runPrompt = (aim: Vec2 | null) => {
    const s = sim.current
    switch (s.prompt) {
      case 'throw':
        throwCow(s.dog, s.guest, aim)
        break
      case 'rub': {
        // kneel down at his side, then rub
        const d = s.dog
        const side = Math.sign(
          (s.guest.x - d.pos.x) * Math.cos(d.yaw) - (s.guest.z - d.pos.z) * Math.sin(d.yaw),
        )
        walkTo({
          x: d.pos.x + Math.cos(d.yaw) * 0.52 * (side || 1),
          z: d.pos.z - Math.sin(d.yaw) * 0.52 * (side || 1),
        })
        s.marker.life = 0
        s.pendingRub = true
        break
      }
      case 'pet':
        // the guest crouches where they are; Rusty comes right up for it
        petRusty(s.dog)
        break
      case 'tag':
        s.tagAsked = false
        s.tagShow = TAG_TIME
        lookUp(s.dog, TAG_TIME)
        setTagOpen(true)
        break
      case 'door-in':
        walkTo({ x: 0.2, z: 0.6 })
        break
      case 'door-out':
        walkTo({ x: 2.7, z: 3.3 })
        break
      case 'resume':
      case 'todo':
        callbacks.current.onRead(s.prompt)
        break
    }
  }

  // Right-click anywhere uses the prompt (a throw goes towards where you point).
  const onGroundContextMenu = (e: ThreeEvent<MouseEvent>) => {
    e.nativeEvent.preventDefault()
    runPrompt({ x: e.point.x, z: e.point.z })
  }

  // Clicking Rusty offers his name tag (walking over to him first if needed).
  const onRustyDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
    const s = sim.current
    // from inside the cabin the tap is just a tap (it stays inside)
    if (insideCabin(s.guest)) return
    // the cow at his feet gets the tap when it can be thrown
    const onCow = e.intersections.some((i) => {
      let o: THREE.Object3D | null = i.object
      while (o && o !== cowG.current) o = o.parent
      return o !== null
    })
    if (onCow && canThrow(s.dog, s.guest)) return
    e.stopPropagation()
    if (Math.hypot(s.dog.pos.x - s.guest.x, s.dog.pos.z - s.guest.z) > PET_REACH - 0.3)
      walkTo(besideRusty(1.1))
    s.tagAsked = true
  }

  // Tapping the cow throws it away from you.
  const onCowDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
    const s = sim.current
    if (throwCow(s.dog, s.guest, null)) e.stopPropagation()
  }

  useFrame((_, rawDt) => {
    const G = {
      hiker: hikerG.current,
      eduard: eduardG.current,
      rusty: rustyG.current,
      cow: cowG.current,
      hugo: hugoG.current,
    }
    if (!G.hiker || !G.eduard || !G.rusty || !G.cow || !G.hugo) return
    const joints = (rig.current ??= buildRig(G as Groups))
    const dt = Math.min(rawDt, 0.05)
    if (dt < 1e-4) return
    const s = sim.current
    s.clock += dt
    const t = s.clock

    // ---------------------------------------------------------- guest
    let walking = false
    if (s.target) {
      const next = step(s.guest, s.target, 3.1 * dt)
      const moved = Math.hypot(next.x - s.guest.x, next.z - s.guest.z)
      if (moved > 1e-4) {
        s.guestYaw = turnTowards(s.guestYaw, facing(s.guest, next), 10 * dt)
        s.guest = next
        walking = true
      }
      // Stop when there, or when an obstacle has blocked us for a moment.
      s.guestStuck = moved < 1e-4 ? s.guestStuck + dt : 0
      if (Math.hypot(s.target.x - s.guest.x, s.target.z - s.guest.z) < 0.08 || s.guestStuck > 0.3)
        s.target = s.route.shift() ?? null
    }
    // walked over to rub Rusty's belly: start once beside him
    const dog = s.dog
    const toDog = Math.hypot(dog.pos.x - s.guest.x, dog.pos.z - s.guest.z)
    if (s.pendingRub && !s.target) {
      s.pendingRub = false
      if (toDog < 1.2) rubBelly(dog, s.guest)
    }
    const rubbing = dog.rubbing > 0 && toDog < 1.4 && !s.target
    const petting = dog.petting > 0 && toDog < 2 && !s.target
    if (rubbing || petting) s.guestYaw = turnTowards(s.guestYaw, facing(s.guest, dog.pos), 8 * dt)
    s.crouch += ((rubbing ? 1 : petting ? 0.55 : 0) - s.crouch) * damp(dt, 7)
    const crouch = s.crouch
    // patting his head: the right hand reaches out and pats
    const pat = petting ? 1 : 0
    // step up onto the deck and the cabin floor
    s.guestY += (groundHeight(s.guest) - s.guestY) * damp(dt, 14)
    s.walkPhase += walking ? dt * 11 : 0
    const swing = walking ? Math.sin(s.walkPhase) : 0
    const j = joints.hiker
    const relax = damp(dt, 12)
    const lerpRot = (jt: Joint, axis: 'x' | 'z', value: number) => {
      jt.obj.rotation[axis] += (jt.base[axis] + value - jt.obj.rotation[axis]) * relax
    }
    // crouching: thighs forward, shins back, both hands on his belly rubbing in circles
    const rubStroke = Math.sin(t * 7) * 0.18
    lerpRot(j.legL, 'x', swing * 0.6 - crouch * 1.1)
    lerpRot(j.legR, 'x', -swing * 0.6 - crouch * 1.1)
    lerpRot(j.shinL, 'x', (walking ? Math.max(0, -Math.cos(s.walkPhase)) * 0.6 : 0) + crouch * 1.9)
    lerpRot(j.shinR, 'x', (walking ? Math.max(0, Math.cos(s.walkPhase)) * 0.6 : 0) + crouch * 1.9)
    const rub = rubbing ? crouch : 0
    lerpRot(j.armL, 'x', -swing * 0.5 - rub * (0.8 - rubStroke))
    lerpRot(
      j.armR,
      'x',
      swing * 0.5 - rub * (0.8 + rubStroke) - pat * (1.25 + Math.max(0, Math.sin(t * 9)) * 0.3),
    )
    lerpRot(j.armL, 'z', rub * (0.12 - Math.cos(t * 7) * 0.15))
    lerpRot(j.armR, 'z', rub * (-0.12 + Math.cos(t * 7) * 0.15))
    G.hiker.position.set(
      s.guest.x,
      s.guestY +
        (walking ? Math.abs(Math.sin(s.walkPhase)) * 0.05 : Math.sin(t * 2) * 0.006) -
        crouch * 0.24,
      s.guest.z,
    )
    G.hiker.rotation.y = s.guestYaw

    // the little tap marker
    if (marker.current) {
      s.marker.life = Math.max(0, s.marker.life - dt * 1.6)
      marker.current.visible = s.marker.life > 0
      marker.current.position.set(s.marker.x, groundHeight(s.marker) + 0.05, s.marker.z)
      const k = 0.6 + (1 - s.marker.life) * 0.6
      marker.current.scale.set(k, k, k)
      ;(marker.current.material as THREE.MeshBasicMaterial).opacity = s.marker.life
    }

    // ---------------------------------------------------------- the cabin: door and cutaway
    const cab = (parts.current ??= {
      door: node(cabinParts, 'Cabin_Door'),
      cut: CUTAWAY_PARTS.map((n) => cabinParts.getObjectByName(n)).filter(
        (o): o is THREE.Object3D => Boolean(o),
      ),
    })
    const inside = insideCabin(s.guest)
    if (inside && !s.enteredCabin) {
      s.enteredCabin = true
      callbacks.current.onEnterCabin()
    }
    s.inside = inside
    // the door swings open when the guest comes up to it
    const nearDoor =
      Math.hypot(s.guest.x - 1.8, s.guest.z - DOOR.outside.z) < 1.6 ||
      s.route.some((p) => p === DOOR.outside || p === DOOR.inside)
    s.doorOpen += ((nearDoor ? 1 : 0) - s.doorOpen) * damp(dt, 5)
    cab.door.obj.rotation.y = cab.door.base.y - s.doorOpen * 1.75
    // roof, south wall and string lights dissolve while the guest is inside
    s.cut += ((inside ? 1 : 0) - s.cut) * damp(dt, 5)
    cutaway.value = s.cut < 0.01 ? 0 : s.cut
    for (const o of cab.cut) {
      o.visible = s.cut < 0.97
      o.userData.noOutline = s.cut > 0.02
    }

    // ---------------------------------------------------------- the welcome trigger
    if (
      !s.welcomed &&
      Math.hypot(s.guest.x - WELCOME_POINT.x, s.guest.z - WELCOME_POINT.z) < WELCOME_DISTANCE
    ) {
      s.welcomed = true
      startApproach(s.dog)
      callbacks.current.onGuestNear()
    }

    // ---------------------------------------------------------- Rusty and the cow (rusty.ts)
    // The opening: once HUGO has introduced him (or the guest walks right up to
    // him), Rusty runs down the driveway to them with the cow.
    if (!startNearCabin && !s.rustySent && (callbacks.current.rustyGo || toDog < 4)) {
      s.rustySent = true
      dog.homeSit = false
      startApproach(dog)
      callbacks.current.onRustyComing()
    }
    const r = joints.rusty
    // where the cow sits when he carries it: just in front of his mouth
    G.rusty.updateMatrixWorld(true)
    const mouthWorld = r.mouth.obj.getWorldPosition(tmp)
    const mouth = {
      x: mouthWorld.x + Math.sin(dog.yaw) * 0.08,
      y: mouthWorld.y - 0.2,
      z: mouthWorld.z + Math.cos(dog.yaw) * 0.08,
    }
    const pose = updateRusty(dog, dt, s.guest, s.guestYaw, inside, mouth, () =>
      callbacks.current.onCowDropped(),
    )
    const gait = Math.sin(dog.gait) * 0.75 * pose.stride
    const rx = (jt: Joint, v: number) => {
      jt.obj.rotation.x += (jt.base.x + v - jt.obj.rotation.x) * damp(dt, 14)
    }
    const rz = (jt: Joint, v: number) => {
      jt.obj.rotation.z += (jt.base.z + v - jt.obj.rotation.z) * damp(dt, 14)
    }
    // Lying down: front legs stretched forward, back legs tucked under.
    // Sitting (showing his tag): rear down, front legs straight, back legs folded.
    // On his back (belly rub): squirming side to side, paws up and splayed, and
    // a back leg that kicks away when the spot's just right.
    const lie = dog.lie
    const sit = dog.sit * dog.sit * (3 - 2 * dog.sit)
    const rollK = dog.roll * dog.roll * (3 - 2 * dog.roll)
    const paddle = Math.max(0, Math.sin(t * 3.1)) * Math.sin(t * 15) * 0.25 * rollK
    const kick = Math.max(0, Math.sin(t * 1.9) - 0.2) * Math.sin(t * 24) * 0.7 * rollK
    const frontLeg = -1.45 * lie * (1 - rollK) - 1.0 * rollK + 0.5 * sit
    const backLeg = -1.25 * lie * (1 - rollK) - 0.45 * rollK - 0.95 * sit
    // the leg on the guest's side kicks (it's the one nearest the hand)
    const kickL = dog.rollSide > 0 ? kick : 0
    const kickR = dog.rollSide > 0 ? 0 : kick
    rx(r.fl, gait + frontLeg + paddle)
    rx(r.fr, -gait + frontLeg - paddle)
    rx(r.bl, -gait + backLeg + kickL)
    rx(r.br, gait + backLeg + kickR)
    // splay the legs outwards on his back (+z swings a leg towards his left)
    rz(r.fl, 0.35 * rollK)
    rz(r.fr, -0.35 * rollK)
    rz(r.bl, 0.55 * rollK)
    rz(r.br, -0.55 * rollK)
    const wag = 9 + dog.excitement * 9 + rollK * 6
    r.tail.obj.rotation.y = r.tail.base.y + Math.sin(t * wag) * 0.6 * dog.excitement
    r.head.obj.rotation.x =
      r.head.base.x +
      dog.headDown * 0.75 +
      (pose.moving ? Math.sin(dog.gait * 2) * 0.05 * pose.stride : Math.sin(t * 1.6) * 0.05 - 0.04)
    // head lolls from side to side while he squirms
    r.head.obj.rotation.z = r.head.base.z + Math.sin(t * 2.6 + 1) * 0.3 * rollK
    // Rolling onto his back turns him about his body, not his feet: shift the
    // model so the middle of his body stays put (it sits 0.42 up in the model).
    const squirm = Math.sin(t * 5.2) * 0.14 * rollK
    const roll = dog.rollSide * 2.5 * rollK + squirm
    const bodyY = 0.42 - 0.24 * lie + 0.1 * rollK - 0.06 * sit
    const sideways = 0.42 * Math.sin(roll)
    G.rusty.position.set(
      dog.pos.x + Math.cos(dog.yaw) * sideways,
      Math.abs(Math.sin(dog.gait)) * 0.06 * pose.stride + bodyY - 0.42 * Math.cos(roll),
      dog.pos.z - Math.sin(dog.yaw) * sideways,
    )
    // lean into turns a little, dip the front when lowering the head, sit back
    // on his haunches, and wriggle a little on his back
    G.rusty.rotation.set(
      dog.headDown * 0.12 * (1 - rollK) - 0.5 * sit,
      dog.yaw + Math.sin(t * 2.6) * 0.12 * rollK,
      roll,
      'YZX',
    )

    const c = dog.cow
    G.cow.position.set(c.pos.x, c.pos.y, c.pos.z)
    G.cow.rotation.set(c.rot.x, c.rot.y, 0)

    // ---------------------------------------------------------- Rusty's name tag (A68)
    const overRusty = { x: dog.pos.x, y: 1.05 - 0.3 * lie, z: dog.pos.z }
    // the name tag hangs from his collar (where the model's tag is, under his chin)
    G.rusty.updateMatrixWorld(true)
    if (tagAnchor.current) r.tag.obj.getWorldPosition(tagAnchor.current.position)
    if (s.tagShow > 0) {
      s.tagShow -= dt
      // put it away when time's up, he runs off, or the guest walks away
      if (toDog > 3.2 || !holdsStill(dog)) s.tagShow = 0
      if (s.tagShow <= 0) {
        lookUp(dog, 0)
        setTagOpen(false)
      }
    }

    // ---------------------------------------------------------- the prompt (A63)
    // One prompt at a time, over the nearest thing the guest can use.
    let next: PromptId | null = null
    let at: { x: number; y: number; z: number } | null = null
    const dist = (p: { x: number; z: number }) => Math.hypot(p.x - s.guest.x, p.z - s.guest.z)
    const busyWithRusty = s.tagShow > 0 || s.pendingRub || dog.rubbing > 0 || dog.petting > 0
    if (busyWithRusty) {
      // nothing else to do while rubbing his belly or reading his tag
    } else if (inside) {
      let best = 2.2
      for (const id of Object.keys(READABLES) as ReadableId[]) {
        const d = dist(READABLES[id])
        if (d < best) {
          best = d
          next = id
          at = READABLES[id]
        }
      }
      if (!next && dist(DOOR.inside) < 1.4) {
        next = 'door-out'
        at = DOOR.prompt
      }
    } else if (s.tagAsked && canSeeTag(dog, s.guest)) {
      next = 'tag'
      at = overRusty
    } else if (s.welcomed && dist(DOOR.outside) < 1.3) {
      // at the door, going in wins over Rusty and the cow (his spot is right by the deck)
      next = 'door-in'
      at = DOOR.prompt
    } else if (dog.pets === 0 && canPet(dog, s.guest)) {
      // HUGO asked for a pet: offer that first, then the cow
      next = 'pet'
      at = overRusty
    } else if (canThrow(dog, s.guest)) {
      next = 'throw'
      at = { x: c.pos.x, y: c.pos.y + 0.65, z: c.pos.z }
    } else if (canRubBelly(dog, s.guest)) {
      next = 'rub'
      at = overRusty
    } else if (canPet(dog, s.guest)) {
      next = 'pet'
      at = overRusty
    } else if (canSeeTag(dog, s.guest)) {
      next = 'tag'
      at = overRusty
    } else if (s.welcomed && dist(DOOR.outside) < 2.6) {
      next = 'door-in'
      at = DOOR.prompt
    }
    if (next !== s.prompt) {
      s.prompt = next
      setPrompt(next)
    }
    if (at) promptAnchor.current?.position.set(at.x, at.y, at.z)
    if (aimRing.current) {
      const showAim = next === 'throw' && input === 'right-click' && s.aim !== null
      aimRing.current.visible = showAim
      if (showAim && s.aim) {
        const dx = s.aim.x - c.pos.x
        const dz = s.aim.z - c.pos.z
        const d = Math.hypot(dx, dz) || 1
        const reach = Math.min(7, Math.max(3.5, d))
        aimRing.current.position.set(c.pos.x + (dx / d) * reach, 0.05, c.pos.z + (dz / d) * reach)
      }
    }

    // ---------------------------------------------------------- Eduard (eduard.ts)
    const ed = s.ed
    updateEduard(ed, dt, { guest: s.guest, dog: dog.pos, greeting: eduardGreeting })
    const ep = eduardPose(ed, t, eduardGreeting)
    const e = joints.eduard
    const follow = (jt: Joint, axis: 'x' | 'y' | 'z', v: number, rate: number) => {
      jt.obj.rotation[axis] += (jt.base[axis] + v - jt.obj.rotation[axis]) * damp(dt, rate)
    }
    follow(e.armR, 'x', ep.armR, ep.snap)
    follow(e.armR, 'z', ep.armRz, 8)
    follow(e.armL, 'x', ep.armL, 8)
    follow(e.armL, 'z', ep.armLz, 8)
    // the wave
    e.armL.obj.rotation.y = eduardGreeting
      ? Math.sin(t * 9) * 0.35
      : e.armL.obj.rotation.y * (1 - damp(dt, 6))
    follow(e.head, 'x', ep.head, 6)
    follow(e.head, 'y', ep.headTurn, 8)
    follow(e.legL, 'x', ep.thighL, 12)
    follow(e.legR, 'x', ep.thighR, 12)
    follow(e.shinL, 'x', ep.shinL, 12)
    follow(e.shinR, 'x', ep.shinR, 12)
    e.board.obj.visible = ed.carrying
    e.torso.obj.rotation.x = e.torso.base.x + Math.sin(t * 1.4) * 0.015
    s.edLean += (ep.lean - s.edLean) * damp(dt, 6)
    s.edY += (ep.y - s.edY) * damp(dt, 10)
    G.eduard.position.set(ed.pos.x, s.edY, ed.pos.z)
    // lean in his own frame (turn first, then pitch)
    G.eduard.rotation.set(s.edLean, ed.yaw, 0, 'YXZ')
    EDUARD_BLOCK.x = ed.pos.x
    EDUARD_BLOCK.z = ed.pos.z

    // ---------------------------------------------------------- HUGO
    // HUGO keeps to the guest's left on screen, a little further from the
    // camera, so he never hides the guest or the room.
    const side = { x: -0.9, z: -0.35 }
    const hugoGoal = tmp.set(
      s.guest.x + side.x,
      s.guestY + 0.8 + Math.sin(t * 2.1) * 0.07,
      s.guest.z + side.z,
    )
    s.hugo.lerp(hugoGoal, damp(dt, 2.6))
    G.hugo.position.copy(s.hugo)
    const talking = bubble?.speaker === 'HUGO'
    const lookTarget = talking
      ? { x: camera.position.x, z: camera.position.z }
      : walking
        ? { x: s.guest.x + Math.sin(s.guestYaw) * 4, z: s.guest.z + Math.cos(s.guestYaw) * 4 }
        : { x: s.guest.x, z: s.guest.z }
    s.hugoYaw = turnTowards(s.hugoYaw, facing({ x: s.hugo.x, z: s.hugo.z }, lookTarget), 4 * dt)
    G.hugo.rotation.y = s.hugoYaw
    const h = joints.hugo
    h.head.obj.rotation.z = h.head.base.z + Math.sin(t * 0.8) * (talking ? 0.18 : 0.1)
    h.head.obj.rotation.x = h.head.base.x + Math.sin(t * 1.3) * 0.06
    const wiggle = talking ? 0.32 : 0.08
    const speed = talking ? 13 : 2
    h.antL.obj.rotation.x = h.antL.base.x + Math.sin(t * speed) * wiggle
    h.antR.obj.rotation.x = h.antR.base.x + Math.sin(t * speed + 1.7) * wiggle
    h.antL.obj.rotation.y = h.antL.base.y + (talking ? Math.sin(t * 7) * 0.12 : 0)
    h.antR.obj.rotation.y = h.antR.base.y - (talking ? Math.sin(t * 7) * 0.12 : 0)

    // ---------------------------------------------------------- bubble anchors
    hugoAnchor.current?.position.set(s.hugo.x, s.hugo.y + 0.95, s.hugo.z)
    eduardAnchor.current?.position.set(ed.pos.x, 1.6 + 0.13 * ed.stand, ed.pos.z)

    // ---------------------------------------------------------- camera and sun follow the guest
    // Looking down from above and behind, like a little diorama. Tall phone
    // screens show less sideways, so pull back a little. During the welcome the
    // camera eases in so the faces are readable.
    const far = size.height > size.width ? 1.3 : 1
    const welcoming = s.welcomed && bubble !== null && !inside
    // reading his tag, rubbing his belly or petting him: ease in on Rusty
    const withRusty = !inside && (s.tagShow > 0 || dog.rubbing > 0 || dog.petting > 0)
    // the opening: a little closer while Rusty runs down the driveway to the guest
    const rustyRunning = !startNearCabin && !dog.firstDropDone
    s.zoom +=
      ((inside
        ? 0.66
        : withRusty
          ? dog.petting > 0
            ? 0.6
            : 0.42
          : rustyRunning
            ? 0.72
            : welcoming
              ? 0.8
              : 1) -
        s.zoom) *
      damp(dt, 1.5)
    // (window.__cabinZoom lets a test browser move the camera in; dev only)
    const devZoom =
      process.env.NODE_ENV !== 'production'
        ? ((window as Window & { __cabinZoom?: number }).__cabinZoom ?? 1)
        : 1
    const k = far * s.zoom * devZoom
    // During the welcome, aim between the guest and Eduard so both are in view.
    // Inside, aim at the middle of the room so all of it is in view.
    const aim = inside
      ? { x: s.guest.x * 0.3, z: s.guest.z * 0.3 - 0.4 }
      : withRusty
        ? { x: s.guest.x * 0.3 + dog.pos.x * 0.7, z: s.guest.z * 0.3 + dog.pos.z * 0.7 }
        : welcoming
          ? { x: s.guest.x * 0.55 + ed.pos.x * 0.45, z: s.guest.z * 0.55 + ed.pos.z * 0.45 }
          : { x: s.guest.x, z: s.guest.z - 5 * k }
    // The camera sits a little west of the guest, so it looks past the stand of
    // trees by the woodshed towards the deck.
    const camGoal = tmp.set(s.guest.x + CAMERA_SIDE * k, 8.6 * k, s.guest.z + 12.5 * k)
    camera.position.lerp(camGoal, damp(dt, 2.2))
    lookAt.current.lerp(tmp.set(aim.x, 0.5, aim.z), damp(dt, 3))
    camera.lookAt(lookAt.current)
    if (sun.current) {
      // summer afternoon: the sun is low in the south-west
      sun.current.position.set(s.guest.x - 10, 12, s.guest.z + 5)
      sun.current.target.position.set(s.guest.x, 0, s.guest.z - 3)
      sun.current.target.updateMatrixWorld()
    }
  })

  return (
    <>
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 34, 80]} />
      {/* cool sky light fills the shadows; a warm low sun does the rest */}
      <hemisphereLight args={['#b9cdf5', '#7c8f55', 1.55]} />
      <directionalLight
        ref={sun}
        color="#ffe2a8"
        intensity={2.1}
        castShadow={!lofi}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      {look !== 'smooth' && <PixelPass outlines={!lofi} />}

      <primitive object={set} />
      <primitive object={cabinParts} />
      <group ref={hikerG}>
        <primitive object={hiker} />
      </group>
      <group ref={eduardG}>
        <primitive object={eduard} />
      </group>
      <group ref={rustyG}>
        <primitive object={rusty} />
        {/* a forgiving, invisible tap area: he's small on a phone */}
        <mesh position={[0, 0.4, 0]} onPointerDown={onRustyDown} userData={{ noOutline: true }}>
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>
      <group ref={hugoG}>
        <primitive object={hugo} />
      </group>
      <group ref={cowG} onPointerDown={onCowDown}>
        <primitive object={cow} />
      </group>

      {/* invisible ground for tap-to-walk */}
      <mesh
        rotation-x={-Math.PI / 2}
        position-y={0.02}
        onPointerDown={onGroundDown}
        onPointerMove={onGroundMove}
        onContextMenu={onGroundContextMenu}
        userData={{ noOutline: true }}
      >
        <planeGeometry args={[140, 140]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false} userData={{ noOutline: true }}>
        <ringGeometry args={[0.22, 0.32, 16]} />
        <meshBasicMaterial color="#fff7e6" transparent depthWrite={false} />
      </mesh>
      {/* where a right-click throw would land */}
      <mesh ref={aimRing} rotation-x={-Math.PI / 2} visible={false} userData={{ noOutline: true }}>
        <ringGeometry args={[0.32, 0.44, 20]} />
        <meshBasicMaterial color="#fec54f" transparent opacity={0.85} depthWrite={false} />
      </mesh>

      <group ref={promptAnchor}>
        {prompt && (
          // the wrapper ignores taps (it would cover Rusty); only the button takes them
          <Html zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
            <InteractPrompt
              key={prompt}
              label={PROMPT_LABELS[prompt]}
              input={input}
              onPress={() => runPrompt(null)}
            />
          </Html>
        )}
      </group>

      <group ref={tagAnchor}>
        {tagOpen && (
          <Html zIndexRange={[25, 0]} style={{ pointerEvents: 'none' }}>
            <NameTag />
          </Html>
        )}
      </group>

      <group ref={hugoAnchor}>
        {bubble?.speaker === 'HUGO' && (
          <Html zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <SpeechBubble speaker="HUGO" text={bubble.text} />
          </Html>
        )}
      </group>
      <group ref={eduardAnchor}>
        {bubble?.speaker === 'Eduard' && (
          <Html zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <SpeechBubble speaker="Eduard" text={bubble.text} />
          </Html>
        )}
      </group>
    </>
  )
}

export default function ArrivalScene({ dpr, ...props }: ArrivalSceneProps) {
  // Materials are made as the models load, so the look is set first.
  useState(() => configureLook(props.look))
  const smooth = props.look === 'smooth'
  return (
    <Canvas
      dpr={dpr}
      onContextMenu={(e) => e.preventDefault()}
      flat
      shadows={smooth ? 'soft' : 'basic'}
      gl={{ antialias: smooth, powerPreference: 'high-performance' }}
      camera={{
        fov: 32,
        near: 0.5,
        far: 140,
        position: [GUEST_START.x + CAMERA_SIDE, 8.6, GUEST_START.z + 12.5],
      }}
    >
      <Suspense fallback={null}>
        <World {...props} />
      </Suspense>
    </Canvas>
  )
}
