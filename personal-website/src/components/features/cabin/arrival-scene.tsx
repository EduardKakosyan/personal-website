'use client'

import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SpeechBubble, type Speaker } from './speech-bubble'
import {
  PixelPass,
  configureLook,
  cutaway,
  makeGroundMaterial,
  makeSparkleTexture,
  registerHighlight,
  toFadeable,
  toOwnFade,
  toToon,
  unregisterHighlight,
} from './pixel-look'
import { InteractPrompt, type PromptInput } from './interact-prompt'
import { createEduard, eduardPose, updateEduard, type Greeting } from './eduard'
import { NameTag } from './name-tag'
import { useKeys } from './use-keys'
import { findPath, GUEST_PAD, warmNav, type Waypoint } from './nav'
import { createVacuum, readyToTidy, shedPoint, stackSpot, updateVacuum } from './vacuum'
import {
  LOG_H,
  LOG_Y,
  arriveAtBlock,
  createSplit,
  holdsAxe,
  splitActive,
  splitStance,
  startSplit,
  stopSplit,
  swing as swingAxe,
  updateSplit,
  type Chunk,
} from './split'
import type { GoalId, Progress } from './checklist'
import styles from './cabin.module.css'
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
  BENCH_FRONT,
  BENCH_SPOT,
  BOX_TAGS,
  BOXES_CENTRE,
  CABIN_FLOOR_Y,
  CAMERA_SPOTS,
  CHOPPING_BLOCK,
  CRATE_D,
  CRATE_H,
  CRATES,
  DOOR,
  EDUARD_BLOCK,
  EDUARD_SPOT,
  GUEST_SKIP,
  GUEST_START,
  LEAD_PATH,
  MODELS,
  PANEL_READABLES,
  READABLE_NODES,
  READABLES,
  RUSTY_RUN_START,
  RUSTY_START,
  SHOWER_SPOT,
  SKY,
  SPLIT_REACH,
  WELCOME_DISTANCE,
  WELCOME_POINT,
  WOODSHED,
  WOODSHED_DISTANCE,
  WORKBENCH,
  clampInsideCabin,
  clampToWalkable,
  crateSpot,
  facing,
  groundHeight,
  insideCabin,
  blockedStatic,
  BOUNDS,
  BENCH_SEAT,
  BENCH_STAND,
  DECK_BOARDS,
  keyDirection,
  step,
  turnTowards,
  type Guest,
  type Look,
  type PanelId,
  type ReadableId,
  type Vec2,
} from './world'

export type Bubble = { speaker: Speaker; text: string } | null

/** Eduard's face: the two options for A54. */
export type Face = 'beard' | 'mustache'

/** What the overlay can ask the scene to do straight away. */
export type SceneApi = {
  /** Swing the axe (the HUD's button). */
  swing: () => void
  /** Put the axe back and stop splitting. */
  stopSplit: () => void
}

export type ArrivalSceneProps = {
  dpr: number
  look: Look
  lofi: boolean
  face: Face
  guest: Guest
  bubble: Bubble
  eduardGreeting: Greeting
  startNearCabin: boolean
  /** What the guest has found already (sparkles go out, nothing else changes). */
  found: Progress
  /** Which project box the guest is looking in (null: none). */
  wantBox: number | null
  api: MutableRefObject<SceneApi | null>
  onReady: () => void
  onFirstMove: () => void
  onGuestNear: () => void
  onCowDropped: () => void
  /** HUGO has introduced Rusty: he runs down the driveway to the guest. */
  rustyGo: boolean
  /** HUGO leads the guest from the cabin to the woodshed (until they get there). */
  hugoLead: boolean
  /** Rusty has set off down the driveway (HUGO points him out). */
  onRustyComing: () => void
  /** The first time the guest steps into the cabin. */
  onEnterCabin: () => void
  /** The guest walked back out of the cabin (HUGO leads them on from here). */
  onLeaveCabin: () => void
  /** The guest comes up to the woodshed for the first time. */
  onReachWoodshed: () => void
  /** The guest picked up the résumé, looked at the to-do list, or wants the workbench index. */
  onRead: (id: PanelId) => void
  /** The guest looked at one of the easter eggs in the cabin. */
  onLook: (id: 'basket' | 'rod' | 'tackle') => void
  /** The names on the project boxes, in BOX_TAGS order. */
  boxTags: { slug: string; tag: string }[]
  /** A box's tag was tapped, or the guest wants a different box: look in that one. */
  onOpenBox: (index: number) => void
  /** The guest walked off or closed the box. */
  onCloseBox: () => void
  /** The thing is out of the box (for the checklist). */
  onBoxOpened: (index: number) => void
  /** Something for the checklist happened. */
  onGoal: (id: GoalId) => void
  /** The splitting game started or stopped. */
  onSplit: (active: boolean) => void
  /** Each frame of the splitting game, for the HUD. */
  onSplitFrame: (s: {
    marker: number
    ready: boolean
    count: number
    event: null | 'crack' | 'perfect' | 'thunk' | 'done'
  }) => void
}

/** What the prompt over the nearest usable thing does. */
type PromptId =
  | 'throw'
  | 'pet'
  | 'rub'
  | 'tag'
  | 'door-in'
  | 'door-out'
  | 'workbench'
  | 'split'
  | 'sit'
  | 'getup'
  | ReadableId
const PROMPT_LABELS: Record<PromptId, string> = {
  throw: 'Throw',
  pet: 'Pet',
  rub: 'Rub belly',
  tag: 'Name tag',
  'door-in': 'Go in',
  'door-out': 'Go out',
  resume: 'Read',
  todo: 'Read',
  basket: 'Look',
  rod: 'Look',
  tackle: 'Look',
  workbench: 'Look',
  split: 'Split wood',
  sit: 'Sit',
  getup: 'Get up',
}
/** Where the guest stands to use each thing inside (a step back from it, into the room). */
/** While splitting, ground clicks this close to the block swing; further off, they walk away. */
const SPLIT_CLICK_REACH = 1.4

/** How close HUGO may float to Eduard (he used to hover right on his head). */
const HUGO_FROM_EDUARD = 1.1

const READABLE_SPOTS: Record<ReadableId, Vec2> = {
  resume: { x: -0.18, z: -1.0 },
  todo: { x: 0.85, z: -1.6 },
  basket: { x: 0.85, z: -1.03 },
  rod: { x: 1.05, z: 0.75 },
  tackle: { x: 0.95, z: 0.12 },
}
/** The easter eggs: they sparkle until they're found. */
const EGGS: ('basket' | 'rod' | 'tackle')[] = ['basket', 'rod', 'tackle']
/** The roof, south wall and string lights fade when the guest is inside. */
const CUTAWAY_PARTS = ['Cabin_Roof', 'Cabin_SouthWall', 'StringLights']
/** How long Rusty's name tag stays up, in seconds. */
const TAG_TIME = 6
/** How big the thing from a box is held up (bigger than life, so it reads). */
const ITEM_SCALE = 1.9

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

/** A tree or the woodshed: it fades out while it hides the guest. */
type FadingTree = {
  obj: THREE.Object3D
  x: number
  z: number
  height: number
  radius: number
  amount: { value: number }
}
/** How see-through a tree in the way gets (1 would be gone). */
const TREE_FADE = 0.85

/** The woodshed, the stand of trees by it and the saplings, each with its own fade. */
function useTrees() {
  const gltf = useGLTF(MODELS.seeThrough)
  return useMemo(() => {
    const scene = gltf.scene.clone(true)
    const trees: FadingTree[] = []
    const box = new THREE.Box3()
    const size = new THREE.Vector3()
    const centre = new THREE.Vector3()
    for (const obj of scene.children) {
      const amount = { value: 0 }
      obj.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.material = toOwnFade(mesh.material as THREE.Material, amount)
        mesh.raycast = noRaycast
      })
      box.setFromObject(obj)
      box.getSize(size)
      box.getCenter(centre)
      trees.push({
        obj,
        x: centre.x,
        z: centre.z,
        height: box.max.y,
        radius: Math.max(size.x, size.z) / 2,
        amount,
      })
    }
    return { scene, trees }
  }, [gltf])
}

/**
 * Whether a tree stands between the camera and the guest: the sight line
 * passes through its crown and the tree is nearer the camera than the guest.
 */
function treeInTheWay(t: FadingTree, cam: THREE.Vector3, guest: THREE.Vector3) {
  const dx = guest.x - cam.x
  const dz = guest.z - cam.z
  const len2 = dx * dx + dz * dz
  if (len2 < 1e-4) return false
  const along = ((t.x - cam.x) * dx + (t.z - cam.z) * dz) / len2
  // behind the guest, or right beside them, doesn't count
  if (along < 0 || along > 1 - (t.radius * 0.6) / Math.sqrt(len2)) return false
  const px = cam.x + dx * along - t.x
  const pz = cam.z + dz * along - t.z
  const lineY = cam.y + (guest.y - cam.y) * along
  return lineY < t.height + 0.3 && Math.hypot(px, pz) < t.radius + 0.6
}

function node(root: THREE.Object3D, name: string) {
  const found = root.getObjectByName(name)
  if (!found) throw new Error(`missing node ${name}`)
  return { obj: found, base: found.rotation.clone() }
}

type Joint = ReturnType<typeof node>

type Groups = Record<'hiker' | 'eduard' | 'rusty' | 'cow' | 'hugo', THREE.Object3D>

/** Find the animated parts by the names the Blender script gives them. */
function buildRig(g: Groups, guest: string) {
  return {
    hiker: {
      legL: node(g.hiker, `${guest}_LegL`),
      legR: node(g.hiker, `${guest}_LegR`),
      shinL: node(g.hiker, `${guest}_ShinL`),
      shinR: node(g.hiker, `${guest}_ShinR`),
      armL: node(g.hiker, `${guest}_ArmL`),
      armR: node(g.hiker, `${guest}_ArmR`),
      head: node(g.hiker, `${guest}_Head`),
      // the axe turns in the hand (its pivot), not about its own node origin
      axe: {
        obj: pivotWrap(node(g.hiker, `${guest}_Axe`).obj, new THREE.Vector3(0, -0.31, 0.02)),
        base: new THREE.Euler(),
      },
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

/**
 * The props the guest can use, found by name in props.glb. Anything the scene
 * moves is wrapped in a pivot group (see pivotWrap), so the node's own
 * transform, which carries the compressor's dequantisation, stays untouched.
 */
type Props3D = {
  readables: Record<ReadableId, THREE.Object3D>
  block: THREE.Object3D
  blockAxe: THREE.Object3D
  /** The log on the block, and its two halves (templates for the flung chunks): pivot at the base. */
  log: THREE.Group
  halves: [THREE.Group, THREE.Group]
  crates: {
    root: THREE.Object3D
    lid: THREE.Group
    item: THREE.Group
    home: THREE.Vector3
    yaw: number
  }[]
}

/**
 * Put a group between a node and its parent, with the group's origin at
 * `pivot` (in the parent's frame). Moving or turning the group moves the node
 * about that pivot. The compressed models fold a dequantisation offset and
 * scale into each leaf node's transform, so a node's position and scale can't
 * simply be overwritten, and its origin isn't where it was in Blender.
 */
function pivotWrap(node: THREE.Object3D, pivot: THREE.Vector3) {
  const parent = node.parent
  if (!parent) throw new Error(`${node.name} has no parent`)
  // (already wrapped: the rig is rebuilt when the guest changes)
  if (parent.name === `${node.name}_Pivot`) return parent as THREE.Group
  const w = new THREE.Group()
  w.name = `${node.name}_Pivot`
  w.position.copy(pivot)
  parent.add(w)
  node.position.sub(pivot)
  w.add(node)
  return w
}

const tmp = new THREE.Vector3()
const tmp2 = new THREE.Vector3()
const tmpQ = new THREE.Quaternion()
const tmpQ2 = new THREE.Quaternion()
const AXIS_Y = new THREE.Vector3(0, 1, 0)
const AXIS_Z = new THREE.Vector3(0, 0, 1)
const DOWN = new THREE.Vector3(0, -1, 0)
const tmpRay = new THREE.Ray()
/** The cabin with its roof and eaves, for "is it hiding the guest?". */
const CABIN_BOX = new THREE.Box3(
  new THREE.Vector3(-2.1, 0.3, -2.8),
  new THREE.Vector3(2.1, 3.8, 2.8),
)
const tmpA = new THREE.Vector3()
const tmpB = new THREE.Vector3()
const CAMERA_SIDE = -2.6
const damp = (dt: number, speed: number) => 1 - Math.exp(-speed * dt)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** Overshoots a little and settles, like a door swung open. */
const easeOutBack = (k: number) => {
  const c = 1.4
  const x = k - 1
  return 1 + (c + 1) * x * x * x + c * x * x
}
const easeInCubic = (k: number) => k * k * k
const easeInOut = (k: number) => k * k * (3 - 2 * k)

// ------------------------------------------------------------------ the world
function World(props: Omit<ArrivalSceneProps, 'dpr'>) {
  const { look, lofi, face, guest, bubble, eduardGreeting, startNearCabin } = props
  const callbacks = useRef(props)
  useEffect(() => {
    callbacks.current = props
  })

  const set = useModel(MODELS.set)
  const hikerOne = useModel(MODELS.hiker)
  const hikerTwo = useModel(MODELS.hiker2)
  const eduard = useModel(MODELS.eduard)
  const rusty = useModel(MODELS.rusty)
  const hugo = useModel(MODELS.hugo)
  // HUGO's vacuum (A106): a hose out of the bottom of his body with white
  // O-rings running along it, in his own materials so it looks like part of
  // him; and the pieces he lays on the woodshed's stack.
  const vacParts = useMemo(() => {
    const mats: Record<string, THREE.Material> = {}
    hugo.traverse((o) => {
      const m = (o as THREE.Mesh).material
      if (m) for (const mm of Array.isArray(m) ? m : [m]) mats[mm.name] = mm
    })
    const dark =
      mats.hugo_base ?? mats.metal_dark ?? new THREE.MeshToonMaterial({ color: '#2b2f36' })
    const white = mats.hugo_white ?? new THREE.MeshToonMaterial({ color: '#f3f1ec' })
    const hose = new THREE.Group()
    const tubeGeo = new THREE.CylinderGeometry(0.03, 0.038, 1, 10, 1)
    tubeGeo.translate(0, -0.5, 0) // (its top at the origin, so scaling Y pays it out downwards)
    const tube = new THREE.Mesh(tubeGeo, dark)
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.04, 0.07, 12), dark)
    const ringGeo = new THREE.TorusGeometry(0.047, 0.012, 6, 16)
    ringGeo.rotateX(Math.PI / 2) // (lying round the hose)
    const rings = Array.from({ length: 4 }, () => new THREE.Mesh(ringGeo, white))
    hose.add(tube, nozzle, ...rings)
    hose.visible = false
    hose.traverse((o) => {
      ;(o as THREE.Mesh).raycast = noRaycast
      o.castShadow = true
    })
    const stack = new THREE.Group()
    return { hose, tube, nozzle, rings, stack }
  }, [hugo])
  const cow = useModel(MODELS.cow, { raycast: true })
  const cabinParts = useModel(MODELS.cabinParts, { fade: true })
  const propsModel = useModel(MODELS.props)
  const trees = useTrees()
  /** The door (on its hinge) and the fading parts, found once the frame loop starts. */
  const parts = useRef<{
    doorNode: THREE.Object3D
    door: THREE.Group
    cut: THREE.Object3D[]
    /** The deck boards still to go down, and the loose one lying ready (A110). */
    boards: (THREE.Object3D | undefined)[]
    loose: THREE.Object3D | undefined
  } | null>(null)
  const sparkle = useMemo(() => makeSparkleTexture(), [])

  const rig = useRef<Rig | null>(null)
  useEffect(() => {
    rig.current = null
  }, [guest])

  // The usable props: the readables, the block and its axe, the log and its
  // halves (hidden until the game), and the six crates. Each crate's thing is
  // taken out of the crate's hierarchy so it can be lifted anywhere.
  const p3 = useMemo<Props3D>(() => {
    const find = (name: string) => {
      const o = propsModel.getObjectByName(name)
      if (!o) throw new Error(`missing prop ${name}`)
      return o
    }
    const readables = Object.fromEntries(
      (Object.keys(READABLE_NODES) as ReadableId[]).map((id) => [id, find(READABLE_NODES[id])]),
    ) as Record<ReadableId, THREE.Object3D>
    // the log and its halves stand on the block: pivot at the base, in the middle
    const logBase = new THREE.Vector3(CHOPPING_BLOCK.x, LOG_Y, CHOPPING_BLOCK.z)
    const log = pivotWrap(find('Log'), logBase)
    const halves: [THREE.Group, THREE.Group] = [
      pivotWrap(find('LogHalfA'), logBase),
      pivotWrap(find('LogHalfB'), logBase),
    ]
    log.visible = false
    halves.forEach((h) => (h.visible = false))
    const crates = CRATES.map((_, i) => {
      const root = find(`Crate_${i}`)
      // the lid turns on its hinge along the crate's back edge, at the top
      const lid = pivotWrap(find(`Crate_${i}_Lid`), new THREE.Vector3(0, CRATE_H, -CRATE_D / 2))
      // the thing inside sits on the crate's floor; it's lifted out in world space
      const item = pivotWrap(find(`Crate_${i}_Item`), new THREE.Vector3(0, 0.02, 0))
      propsModel.updateWorldMatrix(true, true)
      const home = item.getWorldPosition(new THREE.Vector3())
      const yaw = new THREE.Euler().setFromQuaternion(root.getWorldQuaternion(tmpQ), 'YXZ').y
      propsModel.attach(item)
      item.visible = false
      return { root, lid, item, home, yaw }
    })
    return {
      readables,
      block: find('ChoppingBlock'),
      blockAxe: find('BlockAxe'),
      log,
      halves,
      crates,
    }
  }, [propsModel])

  // Mutable simulation state (kept out of React so the frame loop stays cheap).
  const sim = useRef({
    guest: { ...(startNearCabin ? GUEST_SKIP : GUEST_START) } as Vec2,
    target: null as Waypoint | null,
    /** Waypoints still to walk after the current target (the planned way, and through the door). */
    route: [] as Waypoint[],
    /** How close the guest has got to the current target, and for how long that hasn't improved. */
    best: Infinity,
    noProgress: 0,
    /** Times the current leg has been planned again (something moved into the way). */
    replans: 0,
    guestY: 0,
    inside: false,
    enteredCabin: false,
    reachedWoodshed: false,
    showerFound: false,
    /** Whether the guest has stepped to the end of the workbench this visit. */
    benchStepped: false,
    /** Which of CAMERA_SPOTS the camera is turned round for (-1: none). */
    viewSpot: -1,
    /** Which point of LEAD_PATH HUGO is waiting at. */
    leadIndex: 0,
    /** The storm door: how far open (0..1) and what it's doing. */
    door: {
      state: 'closed' as 'closed' | 'reaching' | 'opening' | 'open' | 'closing',
      t: 0,
      open: 0,
    },
    /** 0..1, the guest's hand out to the door handle. */
    reach: 0,
    cut: 0,
    prompt: null as PromptId | null,
    /** Walk up to something, then use it (the guest tapped the thing itself). */
    pendingUse: null as null | { id: PromptId; at: Vec2; reach: number },
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
    keysWalking: false,
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
    /** The project boxes: which is wanted, which is open, and how far each lid and thing has moved. */
    box: {
      want: -1,
      open: -1,
      phase: 'none' as 'none' | 'walking' | 'opening' | 'holding' | 'closing',
      t: 0,
      lid: [0, 0, 0, 0, 0, 0],
      lift: [0, 0, 0, 0, 0, 0],
      /** 0..1, the arms out holding the thing. */
      hold: 0,
      opened: [false, false, false, false, false, false],
    },
    /** Splitting wood (split.ts). */
    split: createSplit(),
    /** HUGO tidying the split wood into the woodshed (vacuum.ts). */
    vac: createVacuum(),
    /** 0..1: the bench view eased back to show him at it. */
    tidyView: 0,
    /** The visitor's own turn of the camera (drag), tilt and zoom (wheel, pinch) (A109). */
    camYaw: 0,
    camPitch: 0,
    userZoom: 1,
    /** One of the moments with a camera of its own (they take over from the visitor's). */
    setMoment: false,
    /** Sitting on the bench to watch Eduard finish the deck (A110); k is 0 standing .. 1 seated. */
    sit: { phase: 'off' as 'off' | 'walking' | 'sitting' | 'seated' | 'rising', t: 0, k: 0 },
    splitWas: false,
    clock: 0,
  })

  const hikerG = useRef<THREE.Group>(null)
  const eduardG = useRef<THREE.Group>(null)
  const rustyG = useRef<THREE.Group>(null)
  const cowG = useRef<THREE.Group>(null)
  const hugoG = useRef<THREE.Group>(null)
  const chunksG = useRef<THREE.Group>(null)
  const marker = useRef<THREE.Mesh>(null)
  const aimRing = useRef<THREE.Mesh>(null)
  const promptAnchor = useRef<THREE.Group>(null)
  const sparkles = useRef<(THREE.Sprite | null)[]>([])
  const [prompt, setPrompt] = useState<PromptId | null>(null)
  const [tagOpen, setTagOpen] = useState(false)
  const tagAnchor = useRef<THREE.Group>(null)
  // Computers get a right-click prompt; touch screens get a button to tap.
  const [input] = useState<PromptInput>(() =>
    window.matchMedia('(hover: none)').matches ? 'tap' : 'right-click',
  )
  const keys = useKeys()
  const hugoAnchor = useRef<THREE.Group>(null)
  const eduardAnchor = useRef<THREE.Group>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const lookAt = useRef(new THREE.Vector3(GUEST_START.x, 0.5, GUEST_START.z - 5))
  const { camera, size, scene, gl } = useThree()
  /** What a press on the scene does if it turns out to be a tap, not a drag. */
  const tap = useRef<null | (() => void)>(null)
  /** The loose halves and logs lying about the block: a mesh per chunk, made from the props' templates. */
  const chunkMeshes = useRef<THREE.Object3D[]>([])

  useEffect(() => {
    callbacks.current.onReady()
    // build the walking grid now, not on the first tap (~40 ms once)
    const id = window.setTimeout(warmNav, 300)
    return () => window.clearTimeout(id)
  }, [])

  // Handy when checking the scene from a test browser; not exposed in production.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production')
      Object.assign(window, {
        __cabin: sim,
        __cabinCamera: camera,
        __cabinScene: scene,
        __cabinEduard: eduard,
      })
  }, [camera, scene, eduard])

  useEffect(() => {
    if (sun.current) sun.current.castShadow = !lofi
  }, [lofi])

  useEffect(() => {
    const beard = eduard.getObjectByName('Eduard_Beard')
    const mustache = eduard.getObjectByName('Eduard_Mustache')
    if (beard) beard.visible = face === 'beard'
    if (mustache) mustache.visible = face === 'mustache'
  }, [eduard, face])

  useEffect(() => {
    hikerOne.visible = guest === 'one'
    hikerTwo.visible = guest === 'two'
  }, [guest, hikerOne, hikerTwo])

  // Everything that can glow (pixel-look.tsx draws the glow round them).
  useEffect(() => {
    const things: THREE.Object3D[] = [
      ...Object.values(p3.readables),
      p3.block,
      p3.blockAxe,
      ...p3.crates.map((c) => c.root),
    ]
    const door = cabinParts.getObjectByName('Cabin_Door')
    if (door) things.push(door)
    if (rustyG.current) things.push(rustyG.current)
    if (cowG.current) things.push(cowG.current)
    things.forEach(registerHighlight)
    return () => things.forEach(unregisterHighlight)
  }, [p3, cabinParts])

  // The overlay's direct requests (the HUD's Swing and Done buttons).
  useEffect(() => {
    const api: SceneApi = {
      swing: () => {
        swingAxe(sim.current.split)
      },
      stopSplit: () => {
        stopSplit(sim.current.split)
      },
    }
    props.api.current = api
    return () => {
      props.api.current = null
    }
  }, [props.api])

  /**
   * Walk somewhere, round whatever's in the way (nav.ts). Going in or out of
   * the cabin goes through the door: to the door step on this side, open it,
   * through the doorway, then on. `exact` is for spots tight against the
   * thing they're for (the chopping block, a crate): a last small step onto it.
   */
  const walkTo = (to: Vec2, exact = false) => {
    const s = sim.current
    const goal = clampToWalkable(to)
    const from = insideCabin(s.guest)
    const into = insideCabin(goal)
    const leg = (a: Vec2, b: Vec2, ex: boolean): Waypoint[] => findPath(a, b, ex) ?? [b]
    // ending on a door waypoint itself (the door is worked out by which one it is)
    const toDoor = (a: Vec2, step: Vec2): Waypoint[] => [...leg(a, step, true).slice(0, -1), step]
    const doorOpen = s.door.state === 'open' || s.door.state === 'opening'
    s.route =
      from === into
        ? leg(s.guest, goal, exact)
        : into
          ? [
              ...(doorOpen
                ? toDoor(s.guest, DOOR.mouth)
                : [...toDoor(s.guest, DOOR.outside), DOOR.mouth]),
              DOOR.inside,
              ...leg(DOOR.inside, goal, exact),
            ]
          : [...toDoor(s.guest, DOOR.inside), DOOR.mouth, ...leg(DOOR.mouth, goal, exact)]
    s.target = s.route.shift() ?? null
    s.best = Infinity
    s.noProgress = 0
    s.replans = 0
    s.marker = { ...goal, life: 1 }
    s.pendingRub = false
    s.tagAsked = false
    s.pendingUse = null
    if (!s.moved) {
      s.moved = true
      callbacks.current.onFirstMove()
    }
  }

  /** Walk up to something and use it once there. */
  const walkAndUse = (id: PromptId, spot: Vec2, at: Vec2, reach: number) => {
    const s = sim.current
    const d = Math.hypot(at.x - s.guest.x, at.z - s.guest.z)
    if (d <= reach && !s.target) {
      act(id)
      return
    }
    walkTo(spot, true)
    s.marker.life = 0
    s.pendingUse = { id, at, reach }
  }

  /** Leave whatever the guest is in the middle of (a box, the splitting game). */
  const leaveActivities = () => {
    const s = sim.current
    if (s.box.want >= 0) callbacks.current.onCloseBox()
    if (splitActive(s.split)) stopSplit(s.split)
    standUp()
  }

  /** Get up off the bench (the walk, if any, starts once they're up). */
  const standUp = () => {
    const st = sim.current.sit
    if (st.phase === 'walking') st.phase = 'off'
    if (st.phase === 'sitting' || st.phase === 'seated') {
      st.phase = 'rising'
      st.t = 0
    }
  }

  const onGroundDown = (e: ThreeEvent<PointerEvent>) => {
    // Only the main button (or a tap) walks; right-click uses the prompt.
    if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
    e.stopPropagation()
    const s = sim.current
    // While splitting, a click at the block is a swing; a click further off
    // puts the axe back and walks there (clicking towards the woodshed used
    // to swing instead of leaving).
    if (
      splitActive(s.split) &&
      Math.hypot(e.point.x - CHOPPING_BLOCK.x, e.point.z - CHOPPING_BLOCK.z) < SPLIT_CLICK_REACH
    ) {
      // (the swing is a timing game: it goes the moment the button does)
      if (s.split.phase === 'ready') swingAxe(s.split)
      return
    }
    const point = e.point.clone()
    const ray = e.ray.clone()
    tap.current = () => {
      leaveActivities()
      if (insideCabin(s.guest)) {
        // Inside, taps stay inside: aim at the floor (it sits above the yard)
        // and keep the spot within the walls.
        const k = (CABIN_FLOOR_Y - ray.origin.y) / ray.direction.y
        const onFloor = k > 0 ? ray.at(k, tmp) : point
        walkTo(clampInsideCabin({ x: onFloor.x, z: onFloor.z }))
        return
      }
      walkTo({ x: point.x, z: point.z })
    }
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

  /** Do what a prompt says. `aim` is where a right-click pointed. */
  const act = (id: PromptId, aim: Vec2 | null = null) => {
    const s = sim.current
    switch (id) {
      case 'throw':
        if (throwCow(s.dog, s.guest, aim)) callbacks.current.onGoal('throw')
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
        if (petRusty(s.dog)) callbacks.current.onGoal('pet')
        break
      case 'tag':
        s.tagAsked = false
        s.tagShow = TAG_TIME
        lookUp(s.dog, TAG_TIME)
        setTagOpen(true)
        callbacks.current.onGoal('tag')
        break
      case 'door-in':
        walkTo({ x: 0.3, z: 0.7 })
        break
      case 'door-out':
        walkTo(DOOR.out)
        break
      case 'resume':
      case 'todo':
        s.guestYaw = facing(s.guest, READABLES[id])
        callbacks.current.onRead(id)
        callbacks.current.onGoal(id)
        break
      case 'basket':
      case 'rod':
      case 'tackle':
        s.guestYaw = facing(s.guest, READABLES[id])
        callbacks.current.onLook(id)
        callbacks.current.onGoal(id)
        break
      case 'workbench':
        callbacks.current.onRead('workbench')
        break
      case 'sit':
        // to the end of the bench, then sit back onto it facing the deck
        walkTo(BENCH_STAND, true)
        s.marker.life = 0
        s.sit.phase = 'walking'
        break
      case 'getup':
        standUp()
        break
      case 'split':
        if (!splitActive(s.split)) {
          startSplit(s.split)
          const stance = splitStance()
          walkTo(stance.at, true)
          s.marker.life = 0
        }
        break
    }
  }

  /** Do what the current prompt says (E, the prompt itself, or a right-click). */
  const runPrompt = (aim: Vec2 | null) => {
    const s = sim.current
    if (s.prompt) act(s.prompt, aim)
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
    tap.current = () => {
      leaveActivities()
      if (Math.hypot(s.dog.pos.x - s.guest.x, s.dog.pos.z - s.guest.z) > PET_REACH - 0.3)
        walkTo(besideRusty(1.1))
      s.tagAsked = true
    }
  }

  // Tapping the cow throws it away from you.
  const onCowDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
    const s = sim.current
    if (canThrow(s.dog, s.guest)) {
      e.stopPropagation()
      tap.current = () => {
        if (throwCow(s.dog, s.guest, null)) callbacks.current.onGoal('throw')
      }
    }
  }

  /** Tapping a thing walks the guest to it and uses it (Eduard: "click the thing"). */
  const onThingDown = (id: PromptId, spot: Vec2, at: Vec2, reach: number) => {
    return (e: ThreeEvent<PointerEvent>) => {
      if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
      const s = sim.current
      // inside, the readables; outside, the door and the block (the door from either side)
      const inside = insideCabin(s.guest)
      if (id !== 'door-in' && id !== 'door-out' && inside !== id in READABLES) return
      e.stopPropagation()
      tap.current = () => {
        leaveActivities()
        if (id === 'door-in' || id === 'door-out') {
          act(inside ? 'door-out' : 'door-in')
          return
        }
        walkAndUse(id, spot, at, reach)
      }
    }
  }

  const onCrateDown = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
    if (insideCabin(sim.current.guest)) return
    e.stopPropagation()
    tap.current = () => callbacks.current.onOpenBox(i)
  }

  // Turning the camera (Eduard, A109: "a way for the user to also control
  // the camera"). Drag anywhere to turn it round the guest (and tilt it a
  // little); the wheel or a pinch zooms. A press that doesn't move is a tap:
  // the scene's handlers above leave what it does in `tap`, and it runs when
  // the pointer comes up. The moments with a camera of their own (the
  // woodshed, the shower, the bench, a box, the chopping block, inside the
  // cabin) take over, and the visitor's turn starts afresh after them.
  useEffect(() => {
    const el = gl.domElement
    const pointers = new Map<number, { x: number; y: number }>()
    let start = { x: 0, y: 0 }
    let moved = false
    let pinch = 0
    let zoomAtPinch = 1
    const spread = () => {
      const [a, b] = [...pointers.values()]
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
    }
    const turn = (dx: number, dy: number) => {
      const s = sim.current
      if (s.setMoment) return
      s.camYaw -= dx * 0.005
      s.camPitch = Math.max(-0.35, Math.min(0.42, s.camPitch + dy * 0.004))
    }
    const zoomTo = (z: number) => {
      const s = sim.current
      if (!s.setMoment) s.userZoom = Math.max(0.55, Math.min(1.7, z))
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 1) {
        tap.current = null // (the scene's handler fills it in next, if this lands on something)
        start = { x: e.clientX, y: e.clientY }
        moved = false
      } else {
        // a second finger: pinching or turning, not a tap
        moved = true
        tap.current = null
        pinch = spread()
        zoomAtPinch = sim.current.userZoom
      }
    }
    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId)
      if (!p) return
      const dx = e.clientX - p.x
      const dy = e.clientY - p.y
      p.x = e.clientX
      p.y = e.clientY
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 7) {
        moved = true
        tap.current = null
      }
      if (!moved) return
      if (pointers.size >= 2) {
        if (pinch > 0) zoomTo(zoomAtPinch * (pinch / Math.max(1, spread())))
        turn(dx / pointers.size, dy / pointers.size)
      } else turn(dx, dy)
    }
    const up = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return
      if (pointers.size === 0) {
        const run = !moved ? tap.current : null
        tap.current = null
        run?.()
      } else pinch = spread()
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomTo(sim.current.userZoom * Math.exp(e.deltaY * 0.0012))
    }
    // (capture, so this sees the press before the scene's handlers fill in the tap)
    el.addEventListener('pointerdown', down, true)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down, true)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl])

  useFrame((_, rawDt) => {
    const G = {
      hiker: hikerG.current,
      eduard: eduardG.current,
      rusty: rustyG.current,
      cow: cowG.current,
      hugo: hugoG.current,
    }
    if (!G.hiker || !G.eduard || !G.rusty || !G.cow || !G.hugo) return
    const joints = (rig.current ??= buildRig(G as Groups, guest === 'two' ? 'Hiker2' : 'Hiker'))
    const dt = Math.min(rawDt, 0.05)
    if (dt < 1e-4) return
    const s = sim.current
    s.clock += dt
    const t = s.clock
    const dist = (p: { x: number; z: number }) => Math.hypot(p.x - s.guest.x, p.z - s.guest.z)
    const dr = s.door
    const sp = s.split
    const bx = s.box
    const doorNode = parts.current?.doorNode ?? node(cabinParts, 'Cabin_Door').obj
    const cab = (parts.current ??= {
      doorNode,
      door: pivotWrap(doorNode, new THREE.Vector3(DOOR.hinge.x, 0, DOOR.hinge.z)),
      cut: CUTAWAY_PARTS.map((n) => cabinParts.getObjectByName(n)).filter(
        (o): o is THREE.Object3D => Boolean(o),
      ),
      boards: DECK_BOARDS.map((_, k) => cabinParts.getObjectByName(`DeckBoard_${k}`)),
      loose: cabinParts.getObjectByName('DeckLooseBoard'),
    })

    // ---------------------------------------------------------- keys
    const k = keys.current
    if (k.escape) {
      k.escape = false
      leaveActivities()
    }
    if (k.use) {
      k.use = false
      if (sp.phase === 'ready') swingAxe(sp)
      else runPrompt(null)
    }
    // Through the door the walk is scripted (reach, swing, step through), so
    // the keys wait until the guest is through.
    const isDoorWay = (p: Vec2 | null) =>
      p === DOOR.outside || p === DOOR.mouth || p === DOOR.inside
    const routeUsesDoor = isDoorWay(s.target) || s.route.some(isDoorWay)
    const camForward = {
      x: lookAt.current.x - camera.position.x,
      z: lookAt.current.z - camera.position.z,
    }
    // sitting on the bench, the keys get them up first (then walk)
    const seatedNow =
      s.sit.phase === 'sitting' || s.sit.phase === 'seated' || s.sit.phase === 'rising'
    if (k.moving() && seatedNow) standUp()
    const keyDir = k.moving() && !routeUsesDoor && !seatedNow ? keyDirection(k, camForward) : null
    s.keysWalking = keyDir !== null

    // ---------------------------------------------------------- guest
    let walking = false
    const insideNow = insideCabin(s.guest)
    if (keyDir) {
      // walking by the keys: drop any tap target and whatever they were doing
      if (s.target || s.pendingUse || s.pendingRub || s.tagAsked) {
        s.target = null
        s.route = []
        s.pendingUse = null
        s.pendingRub = false
        s.tagAsked = false
        s.marker.life = 0
      }
      if (bx.want >= 0 || (splitActive(sp) && sp.phase !== 'walking')) leaveActivities()
      if (!s.moved) {
        s.moved = true
        callbacks.current.onFirstMove()
      }
      // Walking into the doorway opens the door and steps through (the keys
      // take over again on the other side).
      const atDoorOutside =
        !insideNow && s.guest.x > 1.9 && s.guest.x < 3.0 && s.guest.z > 0.3 && s.guest.z < 1.6
      const atDoorInside = insideNow && s.guest.x > 0.8 && s.guest.z > 0.45 && s.guest.z < 1.5
      if (s.welcomed && atDoorOutside && keyDir.x < -0.6) walkTo({ x: 0.3, z: 0.7 })
      else if (atDoorInside && keyDir.x > 0.6) walkTo(DOOR.out)
      else {
        let next = step(s.guest, { x: s.guest.x + keyDir.x, z: s.guest.z + keyDir.z }, 3.1 * dt)
        if (insideNow) next = clampInsideCabin(next)
        else next = clampToWalkable(next)
        const moved = Math.hypot(next.x - s.guest.x, next.z - s.guest.z)
        if (moved > 1e-4) {
          s.guestYaw = turnTowards(s.guestYaw, facing(s.guest, next), 12 * dt)
          s.guest = next
          walking = true
        }
      }
    }
    if (s.target && !seatedNow) {
      const doorBusy = dr.state === 'reaching' || dr.state === 'opening'
      const next = step(s.guest, s.target, 3.1 * dt, s.target.pad ?? GUEST_PAD)
      const moved = Math.hypot(next.x - s.guest.x, next.z - s.guest.z)
      if (moved > 1e-4) {
        s.guestYaw = turnTowards(s.guestYaw, facing(s.guest, next), 10 * dt)
        s.guest = next
        walking = true
      }
      // Getting closer? (Shaking on the spot doesn't count: that's stuck too.)
      const left = Math.hypot(s.target.x - s.guest.x, s.target.z - s.guest.z)
      if (left < s.best - 0.02) {
        s.best = left
        s.noProgress = 0
      } else if (!doorBusy) s.noProgress += dt
      s.guestStuck = moved < 1e-4 ? s.guestStuck + dt : 0
      let advance = left < 0.08
      if (!advance && s.noProgress > 0.5) {
        // Something moved into the way (Eduard with a board): plan this leg
        // again from here; if that keeps failing, stop rather than shake.
        s.noProgress = 0
        s.best = Infinity
        const way = s.replans < 2 ? findPath(s.guest, s.target, true) : null
        s.replans++
        if (left < 0.4) advance = true
        else if (way) {
          way[way.length - 1] = s.target // (keep a door waypoint itself)
          s.target = way.shift() ?? null
          s.route = [...way, ...s.route]
        } else {
          s.target = null
          s.route = []
        }
      }
      if (advance && s.target) {
        // At the door step with the door shut: open it first, then carry on
        // through the doorway (DOOR.mouth comes next).
        const atStep =
          (s.target === DOOR.outside || s.target === DOOR.inside) &&
          s.route[0] === DOOR.mouth &&
          dr.state !== 'open'
        if (atStep) {
          if (dr.state === 'closed') {
            dr.state = 'reaching'
            dr.t = 0
          }
          s.guestStuck = 0
          s.noProgress = 0
        } else {
          s.target = s.route.shift() ?? null
          s.best = Infinity
          s.noProgress = 0
          s.replans = 0
        }
      }
    }
    // ---------------------------------------------------------- sitting on the bench (A110)
    const st = s.sit
    if (st.phase === 'walking' && !s.target) {
      if (dist(BENCH_STAND) < 0.35) {
        st.phase = 'sitting'
        st.t = 0
      } else st.phase = 'off'
    }
    if (st.phase === 'sitting' || st.phase === 'seated' || st.phase === 'rising') {
      st.t += dt
      if (st.phase === 'sitting') {
        st.k = Math.min(1, st.t / 0.8)
        if (st.k >= 1) st.phase = 'seated'
      } else if (st.phase === 'rising') {
        st.k = Math.max(0, 1 - st.t / 0.55)
        if (st.k <= 0) st.phase = 'off'
      }
      // back onto the end of the bench, facing the deck (and Eduard)
      const kk = st.k * st.k * (3 - 2 * st.k)
      s.guest = {
        x: BENCH_STAND.x + (BENCH_SEAT.x - BENCH_STAND.x) * kk,
        z: BENCH_STAND.z + (BENCH_SEAT.z - BENCH_STAND.z) * kk,
      }
      s.guestYaw = turnTowards(s.guestYaw, facing(s.guest, s.ed.pos), 6 * dt)
    } else st.k = 0

    // reached the thing they tapped: use it
    if (s.pendingUse && !s.target) {
      const pu = s.pendingUse
      s.pendingUse = null
      if (dist(pu.at) <= pu.reach + 0.4) act(pu.id)
    }

    // ---------------------------------------------------------- the door
    dr.t += dt
    const doorHandle = { x: DOOR.hinge.x + 0.1, z: DOOR.hinge.z - DOOR.leaf + 0.15 }
    switch (dr.state) {
      case 'reaching':
        // face the handle and put a hand out
        s.guestYaw = turnTowards(s.guestYaw, facing(s.guest, doorHandle), 9 * dt)
        if (dr.t > 0.42) {
          dr.state = 'opening'
          dr.t = 0
        }
        break
      case 'opening': {
        const kk = clamp01(dr.t / 0.75)
        dr.open = easeOutBack(kk)
        if (dr.t > 0.55 && dr.t < 0.56) s.guestStuck = 0
        if (kk >= 1) {
          dr.state = 'open'
          dr.t = 0
          dr.open = 1
        }
        break
      }
      case 'open': {
        // the closer pulls it shut once the guest is through and clear of it
        const clear = Math.abs(s.guest.x - DOOR.centre.x) > 1.0 || dist(DOOR.centre) > 2.6
        if (clear && !routeUsesDoor && dr.t > 0.5) {
          dr.state = 'closing'
          dr.t = 0
        }
        break
      }
      case 'closing': {
        // slow at first, then it catches and shuts with a little bounce
        const kk = clamp01(dr.t / 1.4)
        dr.open =
          kk < 0.86 ? 1 - easeInCubic(kk / 0.86) : 0.035 * Math.sin(((kk - 0.86) / 0.14) * Math.PI)
        if (kk >= 1) {
          dr.state = 'closed'
          dr.open = 0
        }
        break
      }
    }
    cab.door.rotation.y = -dr.open * DOOR.swing
    const reachGoal =
      dr.state === 'reaching' ? 1 : dr.state === 'opening' ? Math.max(0, 1 - dr.t / 0.45) : 0
    s.reach += (reachGoal - s.reach) * damp(dt, 10)

    // ---------------------------------------------------------- splitting wood (split.ts)
    if (sp.phase === 'walking' && !s.target) {
      const stance = splitStance()
      if (dist(stance.at) < 0.35) arriveAtBlock(sp)
      else stopSplit(sp)
    }
    const splitting = splitActive(sp)
    if (splitting && sp.phase !== 'walking') {
      const stance = splitStance()
      s.guestYaw = turnTowards(s.guestYaw, stance.yaw, 8 * dt)
    }
    updateSplit(sp, dt, s.guestYaw)
    if (sp.event === 'done') callbacks.current.onGoal('split')
    if (splitting !== s.splitWas) {
      s.splitWas = splitting
      callbacks.current.onSplit(splitting)
    }
    if (splitting)
      callbacks.current.onSplitFrame({
        marker: sp.marker,
        ready: sp.phase === 'ready' && sp.log,
        count: sp.count,
        event: sp.event,
      })
    const axeHeld = holdsAxe(sp)
    p3.blockAxe.visible = !axeHeld
    joints.hiker.axe.obj.visible = axeHeld
    // the log on the block pops up, and the chunks that came off it lie about
    p3.log.visible = sp.logIn > 0.02
    if (p3.log.visible) {
      const pop = Math.min(1, sp.logIn * 1.1)
      p3.log.position.set(CHOPPING_BLOCK.x, LOG_Y, CHOPPING_BLOCK.z)
      p3.log.scale.set(0.6 + 0.4 * pop, pop, 0.6 + 0.4 * pop)
    }
    if (chunksG.current) {
      const g = chunksG.current
      const meshes = chunkMeshes.current
      while (meshes.length < sp.chunks.length) {
        const c = sp.chunks[meshes.length]
        const template = c.kind === 2 ? p3.log : p3.halves[c.kind]
        const m = template.clone(true)
        m.visible = true
        m.scale.set(1, 1, 1)
        g.add(m)
        meshes.push(m)
      }
      while (meshes.length > sp.chunks.length) {
        const m = meshes.shift()!
        g.remove(m)
      }
      sp.chunks.forEach((c: Chunk, i: number) => {
        const m = meshes[i]
        const fall = c.tip * c.tip * (3 - 2 * c.tip)
        m.position.set(c.pos.x, c.pos.y + fall * 0.11, c.pos.z)
        // tips over sideways about its base, turned the way it was flung
        tmpQ.setFromAxisAngle(AXIS_Y, c.yaw)
        tmpQ2.setFromAxisAngle(AXIS_Z, -c.side * fall * (Math.PI / 2))
        m.quaternion.copy(tmpQ).multiply(tmpQ2)
        // a half lies flat side down once it's settled; a whole log just rolls a little
        if (c.kind !== 2)
          m.quaternion.multiply(tmpQ2.setFromAxisAngle(AXIS_Y, (c.kind ? 1 : -1) * fall * 1.2))
        // going up HUGO's hose: rising, shrinking and turning into him
        const up = c.suck ?? 0
        if (up > 0) {
          const k = up * up
          m.position.lerp(tmpA.set(s.hugo.x, s.hugo.y, s.hugo.z), k)
          m.quaternion.multiply(tmpQ2.setFromAxisAngle(AXIS_Y, up * 7))
        }
        m.scale.setScalar(1 - 0.85 * up)
      })
    }

    // ---------------------------------------------------------- HUGO tidies up (vacuum.ts)
    const vac = s.vac
    if (splitActive(sp) && vac.phase !== 'idle' && vac.phase !== 'toShed' && vac.phase !== 'drop')
      vac.phase = vac.carried.length ? 'toShed' : 'idle'
    if (
      vac.phase === 'idle' &&
      !(callbacks.current.hugoLead && !s.reachedWoodshed) &&
      readyToTidy(sp, insideCabin(s.guest))
    ) {
      vac.phase = 'toChunk'
      vac.t = 0
    }
    const vacGoal = updateVacuum(vac, sp, s.hugo, dt)
    {
      const vp = vacParts
      const reach = vac.reach
      vp.hose.visible = vac.hose > 0.01 && reach !== null
      if (vp.hose.visible && reach) {
        const from = tmpA.set(s.hugo.x, s.hugo.y + 0.01, s.hugo.z)
        const way = tmpB.set(reach.x, reach.y, reach.z).sub(from)
        const len = Math.max(0.02, (way.length() - 0.03) * vac.hose)
        vp.hose.position.copy(from)
        vp.hose.quaternion.setFromUnitVectors(DOWN, way.normalize())
        vp.tube.scale.set(1, len, 1)
        vp.nozzle.position.set(0, -len, 0)
        vp.rings.forEach((r, k) => {
          const f = (((vac.ringT + k / vp.rings.length) % 1) + 1) % 1
          r.visible = vac.flow !== 0
          // sucking: from the nozzle up into him; laying a piece: down to the nozzle
          r.position.set(0, -(vac.flow > 0 ? 1 - f : f) * len, 0)
          const bulge = 1 + Math.sin(f * Math.PI) * 0.4
          r.scale.set(bulge, 1, bulge)
        })
      }
      // the pieces he's laid on the stack, lying front to back like the rest
      while (vp.stack.children.length < vac.placed.length) {
        const n = vp.stack.children.length
        const kind = vac.placed[n]
        const m = (kind === 2 ? p3.log : p3.halves[kind]).clone(true)
        m.visible = true
        m.scale.set(1, 1, 1)
        const spot = stackSpot(n)
        const base = shedPoint(spot.lx, -0.86, spot.at.y)
        const back = shedPoint(spot.lx, 0.26, spot.at.y)
        m.position.set(base.x, base.y, base.z)
        m.quaternion.setFromUnitVectors(
          AXIS_Y,
          tmpA.set(back.x - base.x, 0, back.z - base.z).normalize(),
        )
        m.rotateY(n * 1.9) // (each one turned a little differently, like split wood)
        vp.stack.add(m)
      }
    }

    // ---------------------------------------------------------- the project boxes
    // The overlay says which box is wanted; the guest walks to it, the lid
    // opens, the thing inside rises into their hands, and the card shows.
    const want = callbacks.current.wantBox ?? -1
    if (want !== bx.want) {
      bx.want = want
      if (want >= 0) {
        bx.phase = 'walking'
        bx.t = 0
        s.pendingUse = null
        s.pendingRub = false
        s.tagAsked = false
        if (splitActive(sp)) stopSplit(sp)
        if (dist(crateSpot(want)) > 0.25) {
          walkTo(crateSpot(want), true)
          s.marker.life = 0
        } else {
          s.target = null
          s.route = []
        }
      } else if (bx.open >= 0) {
        bx.phase = 'closing'
        bx.t = 0
      }
    }
    if (bx.phase === 'walking' && !s.target) {
      if (dist(crateSpot(bx.want)) < 0.75) {
        bx.open = bx.want
        bx.phase = 'opening'
        bx.t = 0
      } else callbacks.current.onCloseBox()
    }
    if (bx.phase !== 'none' && bx.phase !== 'walking' && bx.open >= 0) {
      const c = CRATES[bx.open]
      s.guestYaw = turnTowards(s.guestYaw, facing(s.guest, c), 8 * dt)
      bx.t += dt
      if (bx.phase === 'opening' && bx.t > 1.0) {
        bx.phase = 'holding'
        if (!bx.opened[bx.open]) {
          bx.opened[bx.open] = true
          callbacks.current.onBoxOpened(bx.open)
        }
      }
      if (bx.phase === 'closing' && bx.t > 0.7) {
        bx.open = -1
        bx.phase = 'none'
      }
    }
    for (let i = 0; i < 6; i++) {
      const c = p3.crates[i]
      const isOpen = bx.open === i && bx.phase !== 'closing'
      const lidGoal = isOpen ? 1 : 0
      const liftGoal = isOpen && bx.t > 0.3 ? 1 : 0
      bx.lid[i] += (lidGoal - bx.lid[i]) * damp(dt, bx.phase === 'closing' ? 6 : 7)
      bx.lift[i] += (liftGoal - bx.lift[i]) * damp(dt, bx.phase === 'closing' ? 9 : 5)
      c.lid.rotation.x = -easeInOut(bx.lid[i]) * 1.95
      const lift = bx.lift[i]
      c.item.visible = bx.lid[i] > 0.08 || lift > 0.01
      if (!c.item.visible) continue
      // from its place in the crate, up and out to just in front of the guest's hands
      const handY = s.guestY + (CRATES[i].shelf ? 0.62 : 0.78)
      const hx = s.guest.x + Math.sin(s.guestYaw) * 0.42
      const hz = s.guest.z + Math.cos(s.guestYaw) * 0.42
      const e = easeInOut(lift)
      const arc = Math.sin(lift * Math.PI) * (CRATES[i].shelf ? 0.1 : 0.22)
      c.item.position.set(
        c.home.x + (hx - c.home.x) * e,
        c.home.y + (handY - c.home.y) * e + arc + lift * Math.sin(t * 2.4) * 0.015,
        c.home.z + (hz - c.home.z) * e,
      )
      const sc = 1 + (ITEM_SCALE - 1) * e
      c.item.scale.set(sc, sc, sc)
      c.item.rotation.set(0, c.yaw + lift * t * 0.9, 0)
    }
    const holding = bx.open >= 0 && bx.phase !== 'closing' && bx.lift[bx.open] > 0.05
    bx.hold += ((holding ? 1 : 0) - bx.hold) * damp(dt, 8)
    const shelfCrouch = bx.open >= 0 && CRATES[bx.open].shelf ? 0.55 : 0

    // walked over to rub Rusty's belly: start once beside him
    const dog = s.dog
    const toDog = Math.hypot(dog.pos.x - s.guest.x, dog.pos.z - s.guest.z)
    if (s.pendingRub && !s.target) {
      s.pendingRub = false
      if (toDog < 1.2 && rubBelly(dog, s.guest)) callbacks.current.onGoal('rub')
    }
    const rubbing = dog.rubbing > 0 && toDog < 1.4 && !s.target
    const petting = dog.petting > 0 && toDog < 2 && !s.target
    if (rubbing || petting) s.guestYaw = turnTowards(s.guestYaw, facing(s.guest, dog.pos), 8 * dt)
    s.crouch += ((rubbing ? 1 : petting ? 0.55 : bx.hold * shelfCrouch) - s.crouch) * damp(dt, 7)
    const crouch = s.crouch
    // patting his head: the right hand reaches out and pats
    const pat = petting ? 1 : 0
    // step up onto the deck and the cabin floor
    s.guestY += (groundHeight(s.guest) - s.guestY) * damp(dt, 14)
    s.walkPhase += walking ? dt * 11 : 0
    const swing = walking ? Math.sin(s.walkPhase) : 0
    const j = joints.hiker
    const relax = damp(dt, 12)
    const snap = damp(dt, 30)
    const lerpRot = (jt: Joint, axis: 'x' | 'y' | 'z', value: number, rate = relax) => {
      jt.obj.rotation[axis] += (jt.base[axis] + value - jt.obj.rotation[axis]) * rate
    }
    // crouching: thighs forward, shins back, both hands on his belly rubbing in circles
    const rubStroke = Math.sin(t * 7) * 0.18
    // sitting on the bench: thighs out over the end of it, shins hanging, hands on knees
    const seat = s.sit.k * s.sit.k * (3 - 2 * s.sit.k)
    lerpRot(j.legL, 'x', swing * 0.6 - crouch * 1.1 - seat * 1.5)
    lerpRot(j.legR, 'x', -swing * 0.6 - crouch * 1.1 - seat * 1.5)
    lerpRot(
      j.shinL,
      'x',
      (walking ? Math.max(0, -Math.cos(s.walkPhase)) * 0.6 : 0) + crouch * 1.9 + seat * 1.5,
    )
    lerpRot(
      j.shinR,
      'x',
      (walking ? Math.max(0, Math.cos(s.walkPhase)) * 0.6 : 0) + crouch * 1.9 + seat * 1.5,
    )
    const rub = rubbing ? crouch : 0
    const hold = bx.hold
    if (axeHeld) {
      // both hands on the axe: low and ready, up over the head, then down hard
      const raise = sp.raise
      const arm = -0.95 - raise * 2.05
      const fast = sp.phase === 'chop' ? snap : damp(dt, 14)
      lerpRot(j.armR, 'x', arm, fast)
      lerpRot(j.armL, 'x', arm, fast)
      lerpRot(j.armR, 'z', -0.12, fast)
      lerpRot(j.armL, 'z', 0.12, fast)
      // the wrist: the handle swings on past the arm at the bottom of the chop
      lerpRot(j.axe, 'x', 1.25 - raise * 0.9 + (sp.phase === 'chop' ? -0.3 : 0), fast)
      lerpRot(j.head, 'x', raise * 0.25 + (sp.phase === 'chop' ? 0.4 : 0.15), fast)
    } else {
      lerpRot(
        j.armL,
        'x',
        -swing * 0.5 - rub * (0.8 - rubStroke) - hold * 1.05 - s.reach * 0.2 - seat * 0.55,
      )
      lerpRot(
        j.armR,
        'x',
        swing * 0.5 -
          rub * (0.8 + rubStroke) -
          pat * (1.25 + Math.max(0, Math.sin(t * 9)) * 0.3) -
          hold * 1.05 -
          s.reach * 1.25 -
          seat * 0.55,
      )
      lerpRot(j.armL, 'z', rub * (0.12 - Math.cos(t * 7) * 0.15) + hold * 0.3)
      lerpRot(j.armR, 'z', rub * (-0.12 + Math.cos(t * 7) * 0.15) - hold * 0.3 - s.reach * 0.1)
      lerpRot(j.axe, 'x', 0)
      lerpRot(j.head, 'x', hold * 0.3 - s.reach * 0.05)
    }
    G.hiker.position.set(
      s.guest.x,
      s.guestY +
        (walking ? Math.abs(Math.sin(s.walkPhase)) * 0.05 : Math.sin(t * 2) * 0.006) -
        crouch * 0.24 +
        seat * (BENCH_SEAT.y - 0.4 + 0.03),
      s.guest.z,
    )
    G.hiker.rotation.y = s.guestYaw

    // the little tap marker
    if (marker.current) {
      s.marker.life = Math.max(0, s.marker.life - dt * 1.6)
      marker.current.visible = s.marker.life > 0
      marker.current.position.set(s.marker.x, groundHeight(s.marker) + 0.05, s.marker.z)
      const kk = 0.6 + (1 - s.marker.life) * 0.6
      marker.current.scale.set(kk, kk, kk)
      ;(marker.current.material as THREE.MeshBasicMaterial).opacity = s.marker.life
    }

    // ---------------------------------------------------------- the cabin cutaway
    const inside = insideCabin(s.guest)
    if (!inside && s.inside && s.enteredCabin) callbacks.current.onLeaveCabin()
    if (inside && !s.enteredCabin) {
      s.enteredCabin = true
      callbacks.current.onEnterCabin()
    }
    s.inside = inside
    // Roof, south wall and string lights dissolve while the guest is inside,
    // and when the visitor has turned the camera so the cabin hides the
    // guest (A109; the trees and the woodshed do the same).
    tmpRay.origin.copy(camera.position)
    tmpRay.direction.set(s.guest.x, s.guestY + 0.9, s.guest.z).sub(camera.position)
    const toGuest = tmpRay.direction.length()
    tmpRay.direction.normalize()
    const hit = tmpRay.intersectBox(CABIN_BOX, tmpA)
    const cabinHides = !inside && hit !== null && hit.distanceTo(camera.position) < toGuest - 0.3
    s.cut += ((inside || cabinHides ? 1 : 0) - s.cut) * damp(dt, 5)
    cutaway.value = s.cut < 0.01 ? 0 : s.cut
    for (const o of cab.cut) {
      o.visible = s.cut < 0.97
      o.userData.noOutline = s.cut > 0.02
    }

    // ---------------------------------------------------------- trees in the way
    // A tree between the camera and the guest dissolves to a see-through dither
    // (the same pattern as the cabin cutaway), and comes back once they move on.
    const guestEye = tmp.set(s.guest.x, groundHeight(s.guest) + 0.9, s.guest.z)
    for (const tr of trees.trees) {
      const goal = treeInTheWay(tr, camera.position, guestEye) ? TREE_FADE : 0
      tr.amount.value += (goal - tr.amount.value) * damp(dt, 6)
      if (tr.amount.value < 0.01) tr.amount.value = 0
      tr.obj.userData.noOutline = tr.amount.value > 0.05
    }

    // ---------------------------------------------------------- the woodshed (scene 5), the shower
    if (
      !s.reachedWoodshed &&
      Math.hypot(s.guest.x - WOODSHED.x, s.guest.z - WOODSHED.z) < WOODSHED_DISTANCE
    ) {
      s.reachedWoodshed = true
      callbacks.current.onReachWoodshed()
    }
    if (!s.showerFound && !inside && dist(SHOWER_SPOT) < 2.3) {
      s.showerFound = true
      callbacks.current.onGoal('shower')
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
    const busyWithRusty = s.tagShow > 0 || s.pendingRub || dog.rubbing > 0 || dog.petting > 0
    const busy =
      busyWithRusty ||
      splitting ||
      bx.want >= 0 ||
      dr.state === 'reaching' ||
      dr.state === 'opening' ||
      routeUsesDoor ||
      s.pendingUse !== null
    if (s.sit.phase === 'sitting' || s.sit.phase === 'seated') {
      next = 'getup'
      at = { x: BENCH_SEAT.x, y: 1.45, z: BENCH_SEAT.z }
    } else if (busy || s.sit.phase === 'rising') {
      // nothing else to do while rubbing his belly, reading his tag, splitting, or holding a box
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
    } else if (dist(WORKBENCH) < 1.8) {
      // at the workbench, the project boxes win over Rusty and the cow
      next = 'workbench'
      at = WORKBENCH
    } else if (dist(CHOPPING_BLOCK) < SPLIT_REACH) {
      next = 'split'
      at = { x: CHOPPING_BLOCK.x, y: 1.25, z: CHOPPING_BLOCK.z }
    } else if (s.welcomed && dist(BENCH_STAND) < 0.9) {
      // the end of the picnic table's bench: sit and watch Eduard finish the deck
      next = 'sit'
      at = { x: BENCH_SEAT.x, y: 1.05, z: BENCH_SEAT.z }
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
    // Arriving at the workbench, the guest steps to its left end (once per
    // visit) so they don't stand in front of the boxes.
    if (next !== 'workbench') s.benchStepped = false
    else if (!s.target && !s.benchStepped && !s.keysWalking) {
      s.benchStepped = true
      if (dist(BENCH_SPOT) > 0.3) {
        s.route = []
        s.target = { ...BENCH_SPOT }
      }
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

    // ---------------------------------------------------------- glows and sparkles
    // Things the guest can use glow softly as they come near (the one the
    // prompt points at, brightest). The easter eggs twinkle until found.
    const pulse = 0.55 + 0.45 * Math.sin(t * 3.6)
    const nearness = (d: number, from: number, to: number) => clamp01((to - d) / (to - from))
    const glow = (o: THREE.Object3D, amount: number) => {
      o.userData.glow = amount
    }
    const promptOn = (id: PromptId) => (s.prompt === id ? 1 : 0.7)
    for (const id of Object.keys(READABLES) as ReadableId[]) {
      const on = inside && !busy ? nearness(dist(READABLES[id]), 2.2, 4.5) : 0
      glow(p3.readables[id], on * pulse * promptOn(id))
    }
    const doorGlow =
      dr.state === 'closed' && !busy
        ? inside
          ? nearness(dist(DOOR.inside), 1.4, 3)
          : s.welcomed
            ? nearness(dist(DOOR.outside), 2.6, 5)
            : 0
        : 0
    glow(cab.doorNode, doorGlow * pulse * promptOn(inside ? 'door-out' : 'door-in'))
    const blockGlow = !inside && !busy ? nearness(dist(CHOPPING_BLOCK), SPLIT_REACH, 5.5) : 0
    glow(p3.block, blockGlow * pulse * promptOn('split'))
    glow(p3.blockAxe, blockGlow * pulse * promptOn('split'))
    const benchGlow = !inside && bx.want < 0 && !busy ? nearness(dist(WORKBENCH), 1.8, 5) : 0
    p3.crates.forEach((cr, i) => glow(cr.root, bx.open === i ? 0 : benchGlow * pulse * 0.85))
    glow(G.cow, s.prompt === 'throw' ? pulse : 0)
    const rustyOn = s.prompt === 'pet' || s.prompt === 'rub' || s.prompt === 'tag'
    glow(
      G.rusty,
      rustyOn && dog.rubbing <= 0 && dog.petting <= 0 && s.tagShow <= 0 ? pulse * 0.8 : 0,
    )
    const found = callbacks.current.found
    EGGS.forEach((id, i) => {
      const sprite = sparkles.current[i]
      if (!sprite) return
      const show = !found[id] && (inside || s.cut > 0.3)
      sprite.visible = show
      if (!show) return
      const tw = 0.5 + 0.5 * Math.sin(t * 5.2 + i * 2.1)
      const sz = 0.11 + 0.09 * tw
      sprite.scale.set(sz, sz, 1)
      sprite.material.opacity = 0.55 + 0.45 * tw
      sprite.material.rotation = Math.floor(t * 3 + i) % 2 ? Math.PI / 4 : 0
      sprite.position.y = READABLES[id].y + 0.18 + Math.sin(t * 1.7 + i) * 0.03
    })

    // ---------------------------------------------------------- Eduard (eduard.ts)
    const ed = s.ed
    updateEduard(ed, dt, {
      watching: s.sit.phase === 'seated',
      guest: s.guest,
      dog: dog.pos,
      hugo: { x: s.hugo.x, z: s.hugo.z },
      greeting: eduardGreeting,
    })
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
    e.armL.obj.rotation.y =
      eduardGreeting === 'guest'
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
    // the boards he's laid stay down; the loose one goes with the first
    cab.boards.forEach((b, i) => {
      if (b) b.visible = i < ed.placed
    })
    if (cab.loose) cab.loose.visible = ed.placed === 0

    // ---------------------------------------------------------- HUGO
    // HUGO keeps to the guest's left on screen, a little further from the
    // camera, so he never hides the guest or the room. At the workbench he
    // floats off past the end of it, clear of the boxes; where the camera is
    // turned round (CAMERA_SPOTS), "left" is a different way.
    const turned = s.viewSpot >= 0 ? CAMERA_SPOTS[s.viewSpot].from : null
    const side =
      bx.want >= 0
        ? // looking in a box: off the guest's other side, out of the camera's line to the box
          {
            x: BENCH_FRONT.z * 1.1 + BENCH_FRONT.x * 0.2,
            z: -BENCH_FRONT.x * 1.1 + BENCH_FRONT.z * 0.2,
          }
        : s.prompt === 'workbench'
          ? { x: 0.68, z: 0.62 }
          : turned
            ? { x: turned.z * -0.9 - turned.x * 0.35, z: turned.x * 0.9 - turned.z * 0.35 }
            : { x: -0.9, z: -0.35 }
    // Leading the guest to the woodshed: HUGO waits at the next point of the
    // way (outside the door first, if they're still in the cabin) and moves on
    // once they've caught up, looking back at them.
    const leading = callbacks.current.hugoLead && !s.reachedWoodshed
    if (leading && !inside) {
      const wp = LEAD_PATH[s.leadIndex]
      if (
        Math.hypot(s.guest.x - wp.x, s.guest.z - wp.z) < 2.4 &&
        s.leadIndex < LEAD_PATH.length - 1
      )
        s.leadIndex++
    }
    const leadTo = !leading
      ? null
      : inside
        ? // (back inside during the walk: he waits on the deck, north of Eduard)
          { x: DOOR.out.x + 0.2, z: DOOR.out.z - 0.4 }
        : LEAD_PATH[s.leadIndex]
    // Beside the guest, on whichever side is clear of walls, things and Eduard.
    const hugoSpot = (): Vec2 => {
      // watching the deck: beside the bench, on the guest's left, out of the view
      if (s.sit.phase !== 'off' && s.sit.phase !== 'walking')
        return { x: BENCH_SEAT.x - 1.25, z: BENCH_SEAT.z + 0.45 }
      const sides = [
        side,
        { x: -side.x, z: -side.z },
        { x: side.z, z: -side.x },
        { x: -side.z, z: side.x },
      ]
      for (const o of sides) {
        const p = { x: s.guest.x + o.x, z: s.guest.z + o.z }
        const okInside = !inside || insideCabin(p)
        if (
          okInside &&
          !blockedStatic(p, 0.2) &&
          Math.hypot(p.x - ed.pos.x, p.z - ed.pos.z) > HUGO_FROM_EDUARD
        )
          return p
      }
      return { x: s.guest.x + side.x, z: s.guest.z + side.z }
    }
    const hugoAt = vacGoal ?? leadTo ?? hugoSpot()
    const hugoGoal = vacGoal
      ? tmp.set(vacGoal.x, vacGoal.y, vacGoal.z)
      : tmp.set(hugoAt.x, (leadTo ? 1.1 : s.guestY + 0.8) + Math.sin(t * 2.1) * 0.07, hugoAt.z)
    s.hugo.lerp(hugoGoal, damp(dt, vacGoal ? 4.5 : 2.6))
    // never inside Eduard, even on the way past him
    const fromEd = Math.hypot(s.hugo.x - ed.pos.x, s.hugo.z - ed.pos.z)
    if (fromEd < HUGO_FROM_EDUARD) {
      const k = HUGO_FROM_EDUARD / Math.max(fromEd, 1e-3)
      s.hugo.x = ed.pos.x + (s.hugo.x - ed.pos.x) * k
      s.hugo.z = ed.pos.z + (s.hugo.z - ed.pos.z) * k
    }
    G.hugo.position.copy(s.hugo)
    const talking = bubble?.speaker === 'HUGO'
    const lookTarget = talking
      ? { x: camera.position.x, z: camera.position.z }
      : vacGoal && vac.reach
        ? { x: vac.reach.x, z: vac.reach.z }
        : leading
          ? { x: s.guest.x, z: s.guest.z }
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
    // standing at the workbench (the camera looks at its front, below), or looking in a box
    const atBench = s.prompt === 'workbench' && !s.target
    const atBox = bx.open >= 0 && bx.phase !== 'walking'
    const chopping = splitting && sp.phase !== 'walking'
    // by the woodshed or the shower, the camera turns round to show it (CAMERA_SPOTS)
    const spotDist = (i: number) =>
      Math.hypot(s.guest.x - CAMERA_SPOTS[i].at.x, s.guest.z - CAMERA_SPOTS[i].at.z)
    // (splitting and the boxes have their own cameras; the woodshed spot is right beside both)
    // sitting on the bench: from behind the guest, over their shoulder to the deck
    const watchingDeck = s.sit.phase === 'sitting' || s.sit.phase === 'seated'
    const ownCamera = inside || chopping || atBox || watchingDeck
    if (ownCamera || (s.viewSpot >= 0 && spotDist(s.viewSpot) > CAMERA_SPOTS[s.viewSpot].leave))
      s.viewSpot = -1
    if (s.viewSpot < 0 && !ownCamera)
      s.viewSpot = CAMERA_SPOTS.findIndex((_, i) => spotDist(i) < CAMERA_SPOTS[i].enter)
    const spot = s.viewSpot >= 0 ? CAMERA_SPOTS[s.viewSpot] : null
    // the moments with a camera of their own take over (and the visitor's
    // turn starts afresh after them)
    s.setMoment = ownCamera || atBench || spot !== null
    if (s.setMoment) {
      s.camYaw = 0
      s.camPitch = 0
      s.userZoom = 1
    }
    s.zoom +=
      ((inside
        ? 0.66
        : withRusty
          ? dog.petting > 0
            ? 0.6
            : 0.42
          : chopping
            ? far > 1
              ? 0.8
              : 0.6
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
    const kz = far * s.zoom * devZoom * s.userZoom
    // the visitor's turn: the camera's offset from the guest goes round them,
    // and tilts up or down a little
    let offX = CAMERA_SIDE
    let offZ = 12.5
    let offY = 8.6
    if (s.camPitch) {
      const h = Math.hypot(offX, offZ)
      const dist = Math.hypot(h, offY)
      const a = Math.atan2(offY, h) + s.camPitch
      offX *= (dist * Math.cos(a)) / h
      offZ *= (dist * Math.cos(a)) / h
      offY = dist * Math.sin(a)
    }
    const yc = Math.cos(s.camYaw)
    const ys = Math.sin(s.camYaw)
    const camOff = { x: offX * yc + offZ * ys, z: -offX * ys + offZ * yc }
    // Turned round, the camera could end up out in the forest (behind the
    // cabin it sat inside a spruce): keep it over the clearing, coming in
    // closer and looking down more steeply at the edge. (Only once the
    // visitor has turned it; the everyday view is as it was.)
    let edgeK = 1
    if (Math.abs(s.camYaw) > 0.01) {
      const b = {
        x0: BOUNDS.x0 - 0.5,
        x1: BOUNDS.x1 + 0.5,
        z0: BOUNDS.z0 - 0.5,
        z1: BOUNDS.z1 + 0.5,
      }
      let k = 1
      const ox = camOff.x * kz
      const oz = camOff.z * kz
      if (s.guest.x + ox < b.x0) k = Math.min(k, (b.x0 - s.guest.x) / ox)
      if (s.guest.x + ox > b.x1) k = Math.min(k, (b.x1 - s.guest.x) / ox)
      if (s.guest.z + oz < b.z0) k = Math.min(k, (b.z0 - s.guest.z) / oz)
      if (s.guest.z + oz > b.z1) k = Math.min(k, (b.z1 - s.guest.z) / oz)
      k = Math.max(0.3, k)
      camOff.x *= k
      camOff.z *= k
      edgeK = k
    }
    // During the welcome, aim between the guest and Eduard so both are in view.
    // Inside, aim at the middle of the room so all of it is in view.
    const aim = inside
      ? { x: s.guest.x * 0.3, z: s.guest.z * 0.3 - 0.4 }
      : withRusty
        ? { x: s.guest.x * 0.3 + dog.pos.x * 0.7, z: s.guest.z * 0.3 + dog.pos.z * 0.7 }
        : chopping
          ? // (a portrait phone: further south, so the block sits above the HUD)
            {
              x: CHOPPING_BLOCK.x + (far > 1 ? 0.3 : -0.25),
              z: CHOPPING_BLOCK.z + (far > 1 ? 1.5 : 0.1),
            }
          : welcoming
            ? { x: s.guest.x * 0.55 + ed.pos.x * 0.45, z: s.guest.z * 0.55 + ed.pos.z * 0.45 }
            : { x: s.guest.x - 5 * kz * edgeK * ys, z: s.guest.z - 5 * kz * edgeK * yc }
    // The camera sits a little west of the guest, so it looks past the stand of
    // trees by the woodshed towards the deck.
    // At the workbench the camera swings round to look at its front from above,
    // so the project boxes sit side by side (seen from the usual camera, the
    // bench runs away from it and the boxes stack up behind one another).
    // (a portrait phone screen is narrow, so it comes in closer and frames just the boxes)
    // While HUGO is tidying the wood away, the bench view eases back and
    // turns a little towards the woodshed's front, so he's in the background.
    const tidying = s.vac.phase !== 'idle'
    s.tidyView += ((atBench && tidying ? 1 : 0) - s.tidyView) * damp(dt, 1.2)
    const tv = s.tidyView
    const benchDistance = (far > 1 ? 0.8 : 1) * (1 + 0.32 * tv)
    const benchAim = shedPoint(-0.7, -0.9)
    const benchLook = {
      x: BOXES_CENTRE.x + (benchAim.x - BOXES_CENTRE.x) * 0.38 * tv,
      z: BOXES_CENTRE.z + (benchAim.z - BOXES_CENTRE.z) * 0.38 * tv,
    }
    const boxC = atBox ? CRATES[bx.open] : null
    // Looking in a box: from in front of the bench and off to the side (along
    // it, away from the woodshed), above, so the guest doesn't hide the box
    // and the thing they lift out sits between them and the camera's eye.
    const boxSide = { x: -BENCH_FRONT.z, z: BENCH_FRONT.x }
    const boxFar = far > 1 ? 1.25 : 1
    // splitting: from the south, over the middle of guest and block, so the
    // swing reads side-on (a portrait phone keeps the block nearer the middle)
    const chopBase = chopping
      ? far > 1
        ? { x: CHOPPING_BLOCK.x + 0.5, z: CHOPPING_BLOCK.z }
        : { x: s.guest.x * 0.45 + CHOPPING_BLOCK.x * 0.55, z: CHOPPING_BLOCK.z }
      : s.guest
    // (from along the bench, off its end, a little in front and above: the
    // guest and the box are side-on, with the thing they lift out between them)
    const camGoal = watchingDeck
      ? tmp.set(
          BENCH_SEAT.x + 1.9 * (far > 1 ? 1.3 : 1),
          3.3 * (far > 1 ? 1.35 : 1),
          BENCH_SEAT.z + 2.9 * (far > 1 ? 1.3 : 1),
        )
      : boxC
        ? tmp.set(
            boxC.x + (BENCH_FRONT.x * 0.5 + boxSide.x * 3.0) * boxFar,
            (boxC.shelf ? 1.9 : 2.3) * boxFar,
            boxC.z + (BENCH_FRONT.z * 0.5 + boxSide.z * 3.0) * boxFar,
          )
        : atBench
          ? tmp.set(
              benchLook.x + BENCH_FRONT.x * 3.2 * benchDistance,
              4.6 * benchDistance,
              benchLook.z + BENCH_FRONT.z * 3.2 * benchDistance,
            )
          : spot
            ? // behind the guest, out along the spot's direction, looking back at it
              tmp.set(s.guest.x + spot.from.x * 7 * kz, 6 * kz, s.guest.z + spot.from.z * 7 * kz)
            : tmp.set(chopBase.x + camOff.x * kz, offY * kz, chopBase.z + camOff.z * kz)
    camera.position.lerp(camGoal, damp(dt, 2.2))
    lookAt.current.lerp(
      watchingDeck
        ? tmp.set(2.95, 0.5, 1.6)
        : boxC
          ? // (on a portrait phone the card covers the bottom half, so aim lower to lift the box up the screen)
            tmp.set(
              s.guest.x + Math.sin(s.guestYaw) * 0.3,
              (boxC.shelf ? 0.55 : 0.85) - (far > 1 ? 1.1 : 0),
              s.guest.z + Math.cos(s.guestYaw) * 0.3,
            )
          : atBench
            ? tmp.set(benchLook.x, 0.65 + 0.35 * tv, benchLook.z)
            : spot
              ? tmp.set(
                  s.guest.x * 0.45 + spot.at.x * 0.55,
                  0.8,
                  s.guest.z * 0.45 + spot.at.z * 0.55,
                )
              : tmp.set(aim.x, 0.5, aim.z),
      damp(dt, 3),
    )
    camera.lookAt(lookAt.current)
    if (sun.current) {
      // summer afternoon: the sun is low in the south-west
      sun.current.position.set(s.guest.x - 10, 12, s.guest.z + 5)
      sun.current.target.position.set(s.guest.x, 0, s.guest.z - 3)
      sun.current.target.updateMatrixWorld()
    }
  })

  const tapArea = (
    key: string,
    at: { x: number; y: number; z: number },
    r: number,
    onDown: (e: ThreeEvent<PointerEvent>) => void,
  ) => (
    <mesh
      key={key}
      position={[at.x, at.y, at.z]}
      onPointerDown={onDown}
      userData={{ noOutline: true, noGlow: true }}
    >
      <sphereGeometry args={[r, 8, 6]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  )

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
      <primitive object={propsModel} />
      <primitive object={trees.scene} />
      <group ref={chunksG} />
      <group ref={hikerG}>
        <primitive object={hikerOne} />
        <primitive object={hikerTwo} />
      </group>
      <group ref={eduardG}>
        <primitive object={eduard} />
      </group>
      <group ref={rustyG}>
        <primitive object={rusty} />
        {/* a forgiving, invisible tap area: he's small on a phone */}
        <mesh
          position={[0, 0.4, 0]}
          onPointerDown={onRustyDown}
          userData={{ noOutline: true, noGlow: true }}
        >
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>
      <group ref={hugoG}>
        <primitive object={hugo} />
      </group>
      <primitive object={vacParts.hose} />
      <primitive object={vacParts.stack} />
      <group ref={cowG} onPointerDown={onCowDown}>
        <primitive object={cow} />
      </group>

      {/* tap the thing itself to use it: the readables, the door, the block, the crates */}
      {(Object.keys(READABLES) as ReadableId[]).map((id) =>
        tapArea(
          id,
          { x: READABLES[id].x, y: READABLES[id].y - 0.25, z: READABLES[id].z },
          id === 'rod' ? 0.6 : 0.32,
          onThingDown(id, READABLE_SPOTS[id], READABLES[id], 2.2),
        ),
      )}
      {tapArea(
        'door',
        { x: DOOR.centre.x, y: 1.0, z: DOOR.centre.z },
        0.55,
        onThingDown('door-in', DOOR.outside, DOOR.outside, 1.3),
      )}
      {tapArea(
        'block',
        // (the block's own size: a bigger ball caught clicks on the ground
        // past it, which started the game again)
        { x: CHOPPING_BLOCK.x, y: 0.32, z: CHOPPING_BLOCK.z },
        0.36,
        onThingDown('split', splitStance().at, CHOPPING_BLOCK, SPLIT_REACH),
      )}
      {tapArea(
        'bench',
        // the end of the picnic table's bench: sit and watch Eduard finish the deck (A110)
        { x: BENCH_SEAT.x, y: 0.42, z: BENCH_SEAT.z + 0.1 },
        0.32,
        onThingDown('sit', BENCH_STAND, BENCH_STAND, 0.9),
      )}
      {CRATES.map((cr, i) =>
        tapArea(`crate-${i}`, { x: cr.x, y: cr.y + 0.08, z: cr.z }, 0.17, onCrateDown(i)),
      )}

      {/* the sparkles over the easter eggs */}
      {EGGS.map((id, i) => (
        <sprite
          key={id}
          ref={(el) => {
            sparkles.current[i] = el
          }}
          position={[READABLES[id].x, READABLES[id].y + 0.2, READABLES[id].z]}
          scale={[0.16, 0.16, 1]}
          visible={false}
          userData={{ noOutline: true }}
        >
          <spriteMaterial map={sparkle} transparent depthWrite={false} />
        </sprite>
      ))}

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

      {/* the project boxes' name tags, while the guest is at the workbench */}
      {(prompt === 'workbench' || props.wantBox !== null) &&
        props.boxTags.slice(0, BOX_TAGS.length).map((b, i) => (
          <group key={b.slug} position={[BOX_TAGS[i].x, BOX_TAGS[i].y, BOX_TAGS[i].z]}>
            <Html zIndexRange={[28, 0]}>
              <button
                type="button"
                className={`${styles.boxTag} ${styles.pixel} ${props.wantBox === i ? styles.boxTagOpen : ''}`}
                // (pointer down, like the prompt, so the tap doesn't also walk the guest)
                onPointerDown={(e) => {
                  e.stopPropagation()
                  if (e.button === 0) callbacks.current.onOpenBox(i)
                }}
                onClick={(e) => {
                  // keyboard (Enter or Space)
                  if (e.detail === 0) callbacks.current.onOpenBox(i)
                }}
              >
                {b.tag}
              </button>
            </Html>
          </group>
        ))}
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
