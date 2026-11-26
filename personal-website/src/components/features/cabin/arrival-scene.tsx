'use client'

import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SpeechBubble, type BubbleLink, type Speaker } from './speech-bubble'
import {
  PixelPass,
  configureLook,
  cutaway,
  makeArrowTexture,
  makeGroundMaterial,
  makeSparkleTexture,
  isSmoothLook,
  registerFigure,
  registerHighlight,
  toFadeable,
  toOwnFade,
  toToon,
  unregisterFigure,
  unregisterHighlight,
} from './pixel-look'
import { InteractPrompt, type PromptInput } from './interact-prompt'
import {
  createEduard,
  eduardPose,
  layAmount,
  marshmallow,
  seatAtFire,
  updateEduard,
  type Greeting,
} from './eduard'
import { NameTag } from './name-tag'
import { HugoAskMarker } from './hugo-ask-marker'
import { hugoStopAt, type HugoStop } from './hugo-stops'
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
import {
  BROOK_LEAD_PATH,
  brookLeadIndex,
  BROOK_REACHED,
  CAST_SPOT,
  FISHING_HOLE,
  JUG_TOP_Y,
  ROD_PROP,
  STAIRS_TOP,
  TAP,
  TAP_SPOT,
  belowBank,
  brookTap,
  brookView,
  readyForBrook,
} from './brook'
import { createTapStream, makeWaterMaterial, waterUniforms } from './brook-water'
import { applyDaylight, eveningAt, EVENING_NIGHT, EVENING_SUNSET, nightAmount } from './daylight'
import {
  FIRE,
  FIRE_LEAD_PATH,
  FIRE_REACHED,
  FIRE_SEATS,
  HUGO_FIRE_SPOT,
  NIGHT_START,
  RUSTY_FIRE_BED,
  SEAT_Y,
  YAHTZEE,
  YAHTZEE_SPOT,
  backFromStairs,
  fireLeadIndex,
  nightfall,
  readyForFire,
  seatStand,
} from './fire'
import { RESUME_SPOTS, type CheckpointAt } from './checkpoint'
import { cameraReach } from './forest-edge'
import { holdCamera, letGo, newFraming, yawFacing } from './camera-framing'
import { createNightFx, createToastingStick } from './fire-fx'
import { createTeleportFx } from './hugo-teleport'
import { FairyTrail } from './fairy-trail'
import {
  arriveAtHole,
  castPose,
  castStance,
  createFishing,
  fishingActive,
  holdsRod,
  press as pressFishing,
  startFishing,
  stopFishing,
  updateFishing,
} from './fishing'
import { createFishingGear, updateFishingGear } from './fishing-gear'
import { KNEEL, legDrop } from './legs'
import type { FishingHudState } from './fishing-hud'
import styles from './cabin.module.css'
import {
  PET_REACH,
  canRubBelly,
  canSeeTag,
  canPet,
  callToBed,
  canThrow,
  createRusty,
  holdsStill,
  lookUp,
  petRusty,
  rubBelly,
  settleInBed,
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
  /** Cast, strike or reel (the fishing HUD's button), and stop fishing. */
  fish: () => void
  stopFishing: () => void
  /** Get the guest up out of their seat ("Get up", by the fire). */
  getUp: () => void
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
  /** The guest looked at one of the easter eggs (in the cabin, or the Yahtzee set on the picnic table). */
  onLook: (id: 'basket' | 'rod' | 'tackle' | 'yahtzee') => void
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
  /** HUGO leads the guest from the woodshed to the brook (until they get there). */
  brookLead: boolean
  /** The guest's done at the woodshed: time for HUGO to lead them on to the brook. */
  onBrookReady: () => void
  /** The guest comes up to the brook for the first time. */
  onReachBrook: () => void
  /** Casting a line at the fishing hole started or stopped, and each frame of it, for the HUD. */
  onFishing: (active: boolean) => void
  onFishingFrame: (s: FishingHudState) => void
  /** Each frame of the splitting game, for the HUD. */
  onSplitFrame: (s: {
    marker: number
    ready: boolean
    count: number
    event: null | 'crack' | 'perfect' | 'thunk' | 'done'
  }) => void
  // HUGO's questions (A48; hugo-stops.ts, hugo-ask.tsx)
  /** The guest moved to another stop of the tour. */
  onStop?: (stop: HugoStop) => void
  /** The guest tapped HUGO (or the "Ask" prompt over him). */
  onTapHugo?: () => void
  /** Show the "Ask" prompt over HUGO. */
  hugoAskMarker?: boolean
  /** HUGO is answering on his card (his antennas go, he looks at the guest). */
  hugoTalking?: boolean
  /** HUGO's card is open (on a portrait phone the view lifts so the guest and HUGO stay above it). */
  hugoAskOpen?: boolean
  /** A reading panel, a project note or the checklist is up over the scene (the fairy trail waits). */
  panelOpen?: boolean
  /** HUGO's answer to the guest's question: said in a bubble over his head, not on the card. */
  hugoSaying?: { key: number; text: string; status: string | null; links?: BubbleLink[] } | null
  /**
   * HUGO floats over to something and points it out while he talks about it:
   * the project boxes on the workbench, or the résumé on the table in the cabin.
   */
  hugoPointsAt?: 'bench' | 'resume' | null
  /**
   * HUGO was left behind somewhere and has just teleported back to the guest:
   * time to say where the tour goes next.
   */
  onHugoCatchUp?: () => void
  // The fire (scene 7; fire.ts)
  /** ?night=1: start by the fire, at night (for looking at scene 7 without the walk round). */
  startAtNight?: boolean
  /**
   * Coming back to the visit's last checkpoint (checkpoint.ts): start there,
   * with the tour up to it done. The fire's is a night start.
   */
  resumeAt?: CheckpointAt | null
  /** A link under something said was clicked: true if it opened a note instead of the page. */
  onLink?: (link: BubbleLink) => boolean
  /** HUGO has called the guest back to the fire: night falls, Eduard lights it and sits down. */
  fireLead?: boolean
  /** The guest's done at the brook: time for HUGO to call them back. */
  onFireReady?: () => void
  /** The guest comes up to the fire, at night. */
  onReachFire?: () => void
  /** The guest sat down in the chair by the fire, or got up again. */
  onFireSeat?: (seated: boolean) => void
  /**
   * The talk by the fire (fire-talk.tsx): what's being said right now, over
   * the head of whoever's saying it. The guest's question first, then
   * Eduard's answer a paragraph at a time.
   */
  fireSpeech?: FireSpeech | null
  /** The choices for what to ask are up (a portrait phone aims lower, so they sit above them). */
  fireChoosing?: boolean
  /** Eduard's in the middle of an answer (he turns to the guest and talks with his free hand). */
  eduardTalking?: boolean
  /**
   * HUGO has just called the guest back: the camera cuts away to the fire
   * for a few seconds (Eduard by it, toasting a marshmallow), then back.
   */
  onFireCut?: (showing: boolean) => void
}

/** A line of the talk by the fire, for the speech bubble over the speaker. */
export type FireSpeech = {
  who: 'guest' | 'eduard'
  /** Changes with every new line (the bubble types it out afresh). */
  key: number
  text: string
  /** Show all of it at once (the guest pressed on while it was typing). */
  instant?: boolean
  /** Not Eduard's own words yet: the bubble carries a "Draft" stamp. */
  draft?: boolean
  /** There's more to come: the bubble shows a little "go on" mark. */
  more?: boolean
  links?: BubbleLink[]
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
  | 'fish'
  | 'tap'
  | 'sit-fire'
  | 'yahtzee'
  | ReadableId
/** The guests' build (guest_model.py): hip height, hip to shoulder, shoulder out from the middle, shoulder to palm. */
const HIP_Y = 0.4
const SPINE = 0.34
const SHOULDER_OUT = 0.26
const ARM_LENGTH = 0.32
/** Petting Rusty: knees bent a little, his head this far from the guest's middle, and no deeper a bow than this. */
const PET_CROUCH = 0.12
const PET_HEAD_AT = 0.4
const PET_BOW_MAX = 0.3
/** The middle of a laid deck board, above the ground (DeckBoard_k in cabin-parts.glb: 0.257..0.303). */
const DECK_BOARD_Y = 0.28
/**
 * Rubbing his belly: the guest kneels this far from the line down the middle
 * of him, and bends forward (or sits back) at the hips within these limits so
 * both hands are on his belly.
 */
const RUB_GAP = 0.38
const RUB_BOW = { min: -0.1, max: 0.45 }

/** Where the guest kneels to rub his belly: at his side (the side they're on), level with the middle of his belly. */
function rubSpot(dog: { pos: Vec2; yaw: number }, guest: Vec2): Vec2 {
  const c = Math.cos(dog.yaw)
  const sn = Math.sin(dog.yaw)
  const side = Math.sign((guest.x - dog.pos.x) * c - (guest.z - dog.pos.z) * sn) || 1
  return {
    x: dog.pos.x + c * RUB_GAP * side + sn * 0.075,
    z: dog.pos.z - sn * RUB_GAP * side + c * 0.075,
  }
}

/**
 * The arm angles that put a guest's palm on `target` (world): `x` swings the
 * arm forwards (negative) from hanging straight down, `z` out to the side
 * (+ towards their left). The guest's hip is at `at`, `hipY` up, turned `yaw`
 * and bent forward `bow`; `side` is +1 for the left shoulder. `reach` is how
 * far the target is from the shoulder (the arm is ARM_LENGTH).
 */
function armTo(
  target: THREE.Vector3,
  at: Vec2,
  hipY: number,
  yaw: number,
  bow: number,
  side: number,
) {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cb = Math.cos(bow)
  const sb = Math.sin(bow)
  // the shoulder: up the spine from the hip, and out to the side
  const lx = side * SHOULDER_OUT
  const ly = SPINE * cb
  const lz = SPINE * sb
  const dx = target.x - (at.x + lx * cy + lz * sy)
  const dy = target.y - (hipY + ly)
  const dz = target.z - (at.z - lx * sy + lz * cy)
  // into the guest's own frame: turned, then bent forward
  const fz = dx * sy + dz * cy
  const mx = dx * cy - dz * sy
  const my = dy * cb + fz * sb
  const mz = -dy * sb + fz * cb
  const reach = Math.hypot(mx, my, mz) || 1
  return { x: Math.atan2(-mz, -my), z: Math.asin(Math.max(-1, Math.min(1, mx / reach))), reach }
}

/** How fast HUGO glides between pieces and to the woodshed (m/s). */
const HUGO_GLIDE = 2.6
/** ... and the fastest he floats along with the guest or ahead of them (they walk at 3.1). */
const HUGO_FLOAT = 5
/** Leading the way, he keeps this far ahead of the guest, never further. */
const LEAD_AHEAD = 3
/** Left further behind than this, he teleports to the guest instead of floating all the way. */
const TELEPORT_FROM = 7.5
/** How long he takes to vanish, and to appear again. */
const TELEPORT_OUT = 0.3
const TELEPORT_IN = 0.45
/** How many joints HUGO's hose has. */
const HOSE_POINTS = 13

/** At the workbench: a click this close to a box or its tag (on screen) opens it. */
const BENCH_MISS_PX = 56
/** The bench as the click guard sees it: half its length, its height with the tool board, a margin on screen. */
const BENCH_HALF_LENGTH = 1.0
const BENCH_TOP_Y = 1.8
const BENCH_MARGIN_PX = 28
/** How far the woodshed's back runs on from the middle of the boxes, along the bench's line. */
const SHED_BEHIND_ALONG = 4.4
/** ... and how far the other way counts as behind the bench. */
const BENCH_BEHIND_ALONG = 2.1
/** The bench takes up at least this much of the screen: it's all there is to tap (a phone). */
const BENCH_FILLS_SCREEN = 0.4
/** A tap on the grass in front of the bench walks the guest at least this far out from it. */
const BENCH_LEAVE_OUT = 2.5
/** With the visitor's own camera, the bench's click rules only see to clicks landing this close to it. */
const BENCH_NEAR = 3.5

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
  fish: 'Cast',
  tap: 'Get water',
  'sit-fire': 'Sit',
  yahtzee: 'Look',
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
  rod: { x: -0.9, z: 0.8 },
  tackle: { x: -0.85, z: -0.75 },
}
/** The easter eggs: they sparkle until they're found. */
const EGGS: {
  id: 'basket' | 'rod' | 'tackle' | 'yahtzee'
  at: { x: number; y: number; z: number }
}[] = [
  { id: 'basket', at: READABLES.basket },
  { id: 'rod', at: READABLES.rod },
  { id: 'tackle', at: READABLES.tackle },
  // (out on the picnic table)
  { id: 'yahtzee', at: YAHTZEE },
]
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
let waterMaterial: THREE.Material | null = null

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
      const matName = (mesh.material as THREE.Material).name
      // (the brook's channel is a strip of ground of its own, in the ground's
      // paint; the compressor may merge it under another name)
      const isGround = named('Ground') || matName === 'GroundPaint'
      const isWater = matName === 'water'
      const flat = isGround || isWater || named('StringLights') || named('Brook')
      mesh.castShadow = opts.shadows !== false && !flat
      mesh.receiveShadow = true
      if (isWater) {
        mesh.material = waterMaterial ??= makeWaterMaterial(isSmoothLook())
        mesh.userData.noOutline = true
      } else if (isGround) mesh.material = groundMaterial ??= makeGroundMaterial()
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

/**
 * A joint that turns about the point it turned about in Blender. The model
 * compressor moves a leaf node's origin to the middle of its mesh (see
 * pivotWrap), so turning the node itself turned the guest's left arm about
 * its elbow, the shins about the middle of the shin, Rusty's legs about their
 * knees and his tail about its middle: the far end came away from the body
 * (his legs sank into the ground when he lay down, his tail's root swung out
 * of his rump). This puts a group at `pivot` (in the parent's frame) carrying
 * the node's own rest turn, and the scene turns the group instead.
 */
function jointAt(root: THREE.Object3D, name: string, pivot: THREE.Vector3): Joint {
  const found = root.getObjectByName(name)
  const parent = found?.parent
  if (!found || !parent) throw new Error(`missing node ${name}`)
  // (already wrapped: the rig is rebuilt when the guest changes)
  if (parent.name === `${name}_Joint`) return { obj: parent, base: parent.rotation.clone() }
  const w = new THREE.Group()
  w.name = `${name}_Joint`
  w.position.copy(pivot)
  w.quaternion.copy(found.quaternion)
  parent.add(w)
  found.position.sub(pivot).applyQuaternion(found.quaternion.clone().invert())
  found.quaternion.identity()
  w.add(found)
  return { obj: w, base: w.rotation.clone() }
}

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

type Groups = Record<'hiker' | 'eduard' | 'rusty' | 'cow' | 'hugo', THREE.Object3D>

/** Find the animated parts by the names the Blender script gives them. */
function buildRig(g: Groups, guest: string) {
  return {
    hiker: {
      legL: node(g.hiker, `${guest}_LegL`),
      legR: node(g.hiker, `${guest}_LegR`),
      // (the knee, the shoulder: guest_model.py)
      shinL: jointAt(g.hiker, `${guest}_ShinL`, v3(0, -0.2, 0)),
      shinR: jointAt(g.hiker, `${guest}_ShinR`, v3(0, -0.2, 0)),
      armL: jointAt(g.hiker, `${guest}_ArmL`, v3(0.26, 0.74, 0)),
      armR: node(g.hiker, `${guest}_ArmR`),
      head: node(g.hiker, `${guest}_Head`),
      // the right hand: open, or a fist round the axe's handle
      handR: node(g.hiker, `${guest}_HandR`),
      fistR: node(g.hiker, `${guest}_FistR`),
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
      // (his knees: eduard_model.py)
      shinL: jointAt(g.eduard, 'Eduard_ShinL', v3(0, -0.2, 0)),
      shinR: jointAt(g.eduard, 'Eduard_ShinR', v3(0, -0.2, 0)),
      board: node(g.eduard, 'Eduard_Board'),
      // the hammer turns in his fist (the wrist), like the guest's axe
      hammer: {
        obj: pivotWrap(node(g.eduard, 'Eduard_Hammer').obj, new THREE.Vector3(0, -0.31, 0.02)),
        base: new THREE.Euler(),
      },
    },
    rusty: {
      // (the tops of his legs and the root of his tail: rusty_model.py)
      fl: jointAt(g.rusty, 'Rusty_LegFL', v3(0.1, 0.31, 0.24)),
      fr: jointAt(g.rusty, 'Rusty_LegFR', v3(-0.1, 0.31, 0.24)),
      bl: jointAt(g.rusty, 'Rusty_LegBL', v3(0.1, 0.31, -0.24)),
      br: jointAt(g.rusty, 'Rusty_LegBR', v3(-0.1, 0.31, -0.24)),
      head: node(g.rusty, 'Rusty_Head'),
      body: node(g.rusty, 'Rusty_Body'),
      tail: jointAt(g.rusty, 'Rusty_Tail', v3(0, 0.5, -0.33)),
      mouth: node(g.rusty, 'Rusty_Mouth'),
      tag: node(g.rusty, 'Rusty_Tag'),
    },
    hugo: {
      head: node(g.hugo, 'Hugo_Head'),
      // (where each antenna stands on his head: build_arrival.py)
      antL: jointAt(g.hugo, 'Hugo_AntennaL', v3(0.1, 0.27, 0)),
      antR: jointAt(g.hugo, 'Hugo_AntennaR', v3(-0.1, 0.27, 0)),
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
  /** The brook's tap, and the rod leaning on the handrail at the foot of the stairs. */
  tap: THREE.Object3D
  rod: THREE.Object3D
  /** Camp Yahtzee on the picnic table (A51). */
  yahtzee: THREE.Object3D
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
const tmpC = new THREE.Vector3()
const tmpD = new THREE.Vector3()
const tmpE = new THREE.Vector3()
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

/** How long the camera stays on the fire when HUGO calls the guest back to it. */
const FIRE_CUT_SECONDS = 5.2
/** Eduard in his chair with the fire lit, and Rusty lying by it (the night start). */
function eduardAtFire() {
  const e = createEduard()
  seatAtFire(e)
  return e
}
function rustyAtFire() {
  const r = createRusty(RUSTY_FIRE_BED, RUSTY_FIRE_BED.yaw)
  settleInBed(r, RUSTY_FIRE_BED)
  return r
}
/**
 * Rusty for a visit picked up again by day (checkpoint.ts). Back at the cabin
 * he comes running with the cow again (as he did when the guest first came
 * up the driveway); further round, the guest has been in the cabin, so he's
 * lying at his spot by the deck with it, the way he settles once they go in.
 */
function rustyResumed(at: CheckpointAt) {
  const r = createRusty(RUSTY_START, Math.PI * 0.85)
  if (at === 'cabin') startApproach(r)
  else settleInBed(r, { ...RUSTY_START, yaw: 0 })
  return r
}
/** Where the guest sits: the end of the picnic bench (A110), or their camp chair by the fire. */
type SeatAt = 'bench' | 'fire'
const GUEST_FIRE_STAND = seatStand(FIRE_SEATS.guest)
function sitSpots(at: SeatAt) {
  return at === 'fire'
    ? { stand: GUEST_FIRE_STAND, seat: FIRE_SEATS.guest as Vec2, y: SEAT_Y }
    : { stand: BENCH_STAND, seat: BENCH_SEAT as Vec2, y: BENCH_SEAT.y }
}

// ------------------------------------------------------------------ the world
function World(props: Omit<ArrivalSceneProps, 'dpr'>) {
  const { look, lofi, face, guest, bubble, eduardGreeting, startNearCabin } = props
  // (the fire's checkpoint is a night start, by the fire; the others are by day)
  const startAtNight = Boolean(props.startAtNight) || props.resumeAt === 'fire'
  const [resumeAt] = useState(() =>
    props.resumeAt && props.resumeAt !== 'fire' ? props.resumeAt : null,
  )
  const resumeSpot = resumeAt ? RESUME_SPOTS[resumeAt] : null
  /** Past the woodshed: the guest has been round the cabin and the workbench already. */
  const pastShed = resumeAt === 'brook'
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
    // The hose is a chain of short lengths with a rib at each joint, laid
    // along a curve each frame (it bends, and a lump can travel through it);
    // a flared nozzle with a white rim; white O-rings that run along it; a
    // ring of puff when a piece pops out; and a few streaks of air going in.
    const hose = new THREE.Group()
    const lengthGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 8, 1)
    lengthGeo.translate(0, 0.5, 0) // (from its start, along +Y)
    const lengths = Array.from({ length: HOSE_POINTS - 1 }, () => new THREE.Mesh(lengthGeo, dark))
    const ribGeo = new THREE.TorusGeometry(0.034, 0.011, 5, 12)
    ribGeo.rotateX(Math.PI / 2) // (lying round the hose)
    const ribs = Array.from({ length: HOSE_POINTS }, () => new THREE.Mesh(ribGeo, dark))
    const nozzle = new THREE.Group()
    const coneMat = dark.clone()
    coneMat.side = THREE.DoubleSide
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.036, 0.1, 12, 1, true), coneMat)
    cone.position.y = 0.05
    const rimGeo = new THREE.TorusGeometry(0.077, 0.014, 6, 16)
    rimGeo.rotateX(Math.PI / 2)
    const rim = new THREE.Mesh(rimGeo, white)
    rim.position.y = 0.1
    nozzle.add(cone, rim)
    const ringGeo = new THREE.TorusGeometry(0.05, 0.013, 6, 16)
    ringGeo.rotateX(Math.PI / 2)
    const rings = Array.from({ length: 3 }, () => new THREE.Mesh(ringGeo, white))
    const puffGeo = new THREE.TorusGeometry(0.07, 0.016, 6, 18)
    puffGeo.rotateX(Math.PI / 2)
    const puff = new THREE.Mesh(
      puffGeo,
      new THREE.MeshBasicMaterial({ color: '#fffaf0', transparent: true, depthWrite: false }),
    )
    puff.userData.noOutline = true
    const streakGeo = new THREE.SphereGeometry(0.016, 6, 4)
    const streakMat = new THREE.MeshBasicMaterial({ color: '#fffaf0' })
    const streaks = Array.from({ length: 6 }, () => {
      const m = new THREE.Mesh(streakGeo, streakMat)
      m.userData.noOutline = true
      return m
    })
    hose.add(...lengths, ...ribs, nozzle, ...rings)
    hose.visible = false
    const extras = new THREE.Group()
    extras.add(puff, ...streaks)
    for (const g of [hose, extras])
      g.traverse((o) => {
        ;(o as THREE.Mesh).raycast = noRaycast
        o.castShadow = g === hose
      })
    const stack = new THREE.Group()
    return {
      hose,
      lengths,
      ribs,
      nozzle,
      rings,
      puff,
      streaks,
      extras,
      stack,
      /** where the nozzle's mouth is (the scene's pieces go to it and come from it) */
      tip: new THREE.Vector3(),
      points: Array.from({ length: HOSE_POINTS }, () => new THREE.Vector3()),
    }
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
  // the arrow that bobs over the résumé until the guest has read it
  const arrowTexture = useMemo(() => makeArrowTexture(), [])
  const resumeArrow = useRef<THREE.Sprite>(null)
  const tpFx = useMemo(() => createTeleportFx(), [])

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
      tap: find('BrookTap'),
      rod: find('BrookRod'),
      yahtzee: find('CampYahtzee'),
      log,
      halves,
      crates,
    }
  }, [propsModel])

  // Mutable simulation state (kept out of React so the frame loop stays cheap).
  const sim = useRef({
    guest: {
      ...(startAtNight
        ? NIGHT_START
        : resumeSpot
          ? resumeSpot.at
          : startNearCabin
            ? GUEST_SKIP
            : GUEST_START),
    } as Vec2,
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
    // (coming back to the woodshed or further, the cabin's been seen; coming
    // back to the woodshed itself, getting there again plays its line again)
    enteredCabin: resumeAt === 'woodshed' || pastShed,
    reachedWoodshed: pastShed,
    showerFound: false,
    /** Whether the guest has stepped to the end of the workbench this visit. */
    benchStepped: false,
    /**
     * Which of CAMERA_SPOTS the camera is turned round for (-1: none), and
     * whether that view and the bench's have let go of it (camera-framing.ts).
     */
    ...newFraming(),
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
    /** 0..1, how far the guest has knelt down beside Rusty (rubbing his belly). */
    kneel: 0,
    /** Petting Rusty: 0..1 how far the hand is on his head, how far the guest bends, which hand (+1 right). */
    petK: 0,
    bow: 0,
    petSide: 1,
    /** 0..1, how far both hands are on Rusty's belly. */
    rubK: 0,
    guestYaw: startAtNight
      ? facing(NIGHT_START, FIRE)
      : resumeSpot
        ? facing(resumeSpot.at, resumeSpot.facing)
        : Math.PI,
    walkPhase: 0,
    moved: false,
    guestStuck: 0,
    keysWalking: false,
    idleSince: 0,
    welcomed: startAtNight || resumeAt !== null,
    // Rusty first (A76): unless starting by the cabin, he's already running
    // down the driveway with the cow when the site opens.
    // (He waits there, sitting, until HUGO introduces him.)
    dog: startAtNight
      ? rustyAtFire()
      : resumeAt
        ? rustyResumed(resumeAt)
        : startNearCabin
          ? createRusty(RUSTY_START, Math.PI * 0.85)
          : { ...createRusty(RUSTY_RUN_START, 0), homeSit: true },
    rustySent: startAtNight || resumeAt !== null,
    /** Eduard on the deck (eduard.ts). */
    ed: startAtNight ? eduardAtFire() : createEduard(),
    edLean: 0,
    edY: EDUARD_SPOT.y,
    /** Where the mouse points on the ground (for aiming a throw). */
    aim: null as Vec2 | null,
    hugo: startAtNight
      ? new THREE.Vector3(HUGO_FIRE_SPOT.x, HUGO_FIRE_SPOT.y, HUGO_FIRE_SPOT.z)
      : resumeSpot
        ? new THREE.Vector3(resumeSpot.at.x + 0.9, 1.0, resumeSpot.at.z - 0.2)
        : new THREE.Vector3(GUEST_START.x + 0.9, 1.0, GUEST_START.z - 0.2),
    zoom: startNearCabin || startAtNight || resumeAt !== null ? 1 : 0.72,
    hugoYaw: Math.PI,
    /** Tidying up: how fast he's gliding, how far he leans into it, his head down over a piece. */
    hugoSpeed: 0,
    hugoLean: 0,
    hugoNod: 0,
    /** His teleport back to the guest: vanishing where he was, then appearing beside them. */
    tp: { phase: 'none' as 'none' | 'out' | 'in', t: 0, rest: 0, from: new THREE.Vector3() },
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
    /** 0..1: the view lifted above HUGO's card (a portrait phone). */
    askLift: 0,
    /** The visitor's own turn of the camera (drag), tilt and zoom (wheel, pinch) (A109). */
    camYaw: 0,
    camPitch: 0,
    userZoom: 1,
    /** One of the moments with a camera of its own (they take over from the visitor's). */
    setMoment: false,
    /** The woodshed's or the shower's view, or the bench's, holds the camera (a turn takes it over). */
    framed: false,
    /** The visitor has just taken the camera from one of those: carry on facing the same way. */
    camTake: false,
    /** Sitting on the bench to watch Eduard finish the deck (A110); k is 0 standing .. 1 seated. */
    sit: {
      phase: 'off' as 'off' | 'walking' | 'sitting' | 'seated' | 'rising',
      t: 0,
      k: 0,
      /** ... or in their camp chair by the fire (scene 7). */
      at: 'bench' as SeatAt,
    },
    splitWas: false,
    /** Casting a line at the fishing hole (fishing.ts). */
    fish: createFishing(),
    fishWas: false,
    /** The brook (scene 6): reached yet, HUGO asked to lead there, his point on the way, time free at the woodshed. */
    brook: {
      reached: false,
      asked: pastShed,
      didShed: pastShed,
      /** Had a go with the axe at the chopping block (the woodshed's second stop). */
      triedBlock: pastShed,
      leadIndex: 0,
      freeFor: 0,
    },
    /** How far the camera has come round to the brook's view (brook.ts, brookView). */
    brookK: 0,
    /** The tap: seconds since the guest turned it on (-1: off). */
    tapRun: -1,
    /** How far into the evening the light is (daylight.ts): 0 afternoon, 1 golden, 2 sunset, 3 night. */
    evening: startAtNight ? EVENING_NIGHT : 0,
    /** The fire (scene 7, fire.ts). */
    fire: {
      /** HUGO has been asked to call the guest back; Eduard and Rusty have been sent to it. */
      asked: startAtNight,
      called: startAtNight,
      /** The guest has come up to it, and is sitting by it now. */
      reached: false,
      seated: false,
      /** Night falling, 0 sunset .. 1 night (it never lifts), and the fire catching, 0..1. */
      night: startAtNight ? 1 : 0,
      lit: startAtNight ? 1 : 0,
      /** HUGO's point on the way back, and what the guest has done at the brook. */
      leadIndex: 0,
      didBrook: false,
      atBrookFor: 0,
      freeFor: 0,
      /** The cut to the fire when HUGO calls: seconds into it (-1: not showing), and "snap back now". */
      cut: -1,
      // (picking a visit up again, the camera starts where it belongs, by the
      // guest, rather than flying in from the road)
      cutOver: resumeAt !== null || props.resumeAt === 'fire',
    },
    clock: 0,
  })
  const gear = useMemo(() => createFishingGear(), [])
  // the fire, the night's lamps and the stars (fire-fx.ts)
  const nightFx = useMemo(() => {
    const fx = createNightFx(look === 'smooth')
    fx.adopt(set, cabinParts)
    return fx
  }, [look, set, cabinParts])
  const tapStream = useMemo(() => createTapStream(TAP, JUG_TOP_Y), [])
  const hemi = useRef<THREE.HemisphereLight>(null)

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
  /** The camera's away at the fire (the cut when HUGO calls): the prompt and the bubbles wait. */
  const [cutting, setCutting] = useState(false)
  const guestAnchor = useRef<THREE.Group>(null)
  // Eduard's toasting stick (it goes in his right hand, where the hammer was)
  const toastStick = useMemo(() => createToastingStick(), [])
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
  /** Starts a press for the camera's drag (the box tags are on top of the scene, not in it). */
  const pressDown = useRef<null | ((e: PointerEvent) => void)>(null)
  /** The loose halves and logs lying about the block: a mesh per chunk, made from the props' templates. */
  const chunkMeshes = useRef(new Map<Chunk, THREE.Object3D>())

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
      p3.tap,
      p3.rod,
      p3.yahtzee,
      ...p3.crates.map((c) => c.root),
    ]
    const door = cabinParts.getObjectByName('Cabin_Door')
    if (door) things.push(door)
    if (rustyG.current) things.push(rustyG.current)
    if (cowG.current) things.push(cowG.current)
    things.forEach(registerHighlight)
    return () => things.forEach(unregisterHighlight)
  }, [p3, cabinParts])

  // The characters, outlined all the way round (pixel-look.tsx).
  useEffect(() => {
    const figures = [eduard, hikerOne, hikerTwo, rusty, hugo]
    figures.forEach(registerFigure)
    return () => figures.forEach(unregisterFigure)
  }, [eduard, hikerOne, hikerTwo, rusty, hugo])

  // The overlay's direct requests (the HUD's Swing and Done buttons).
  useEffect(() => {
    const api: SceneApi = {
      swing: () => {
        swingAxe(sim.current.split)
      },
      stopSplit: () => {
        stopSplit(sim.current.split)
      },
      fish: () => {
        pressFishing(sim.current.fish)
      },
      stopFishing: () => {
        stopFishing(sim.current.fish)
      },
      getUp: () => {
        const st = sim.current.sit
        if (st.phase === 'walking') st.phase = 'off'
        if (st.phase === 'sitting' || st.phase === 'seated') {
          st.phase = 'rising'
          st.t = 0
        }
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
    if (fishingActive(s.fish)) stopFishing(s.fish)
    s.tapRun = -1
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

  /** While splitting: does a click's ray pass by the chopping block, the log on it or the guest? */
  const clickAtBlock = (ray: THREE.Ray) => {
    const s = sim.current
    return (
      ray.distanceToPoint(tmp.set(CHOPPING_BLOCK.x, 0.6, CHOPPING_BLOCK.z)) < SPLIT_CLICK_REACH ||
      ray.distanceToPoint(tmp.set(s.guest.x, 0.8, s.guest.z)) < 1
    )
  }

  /** Casting a line: the rod's in hand (not on the way to the landing, not being put back). */
  const rodInHand = () => {
    const f = sim.current.fish
    return holdsRod(f) && f.phase !== 'putaway'
  }
  /** ... and does a click's ray pass by the fishing hole, the landing or the guest? */
  const clickAtHole = (ray: THREE.Ray) => {
    const s = sim.current
    return (
      ray.distanceToPoint(tmp.set(FISHING_HOLE.x, -0.4, FISHING_HOLE.z)) < FISHING_HOLE.r + 1.1 ||
      ray.distanceToPoint(tmp.set(CAST_SPOT.x, 0.3, CAST_SPOT.z)) < 1.3 ||
      ray.distanceToPoint(tmp.set(s.guest.x, s.guestY + 0.8, s.guest.z)) < 1
    )
  }

  const onGroundDown = (e: ThreeEvent<PointerEvent>) => {
    // Only the main button (or a tap) walks; right-click uses the prompt.
    if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
    e.stopPropagation()
    const s = sim.current
    // (the camera's away at the fire: a click isn't a walk to wherever it's looking)
    if (s.fire.cut >= 0) return
    // While splitting, a click at the block is a swing; a click further off
    // puts the axe back and walks there (clicking towards the woodshed used
    // to swing instead of leaving).
    // (Eduard: "Click doesn't work for splitting the wood". The splitting
    // camera is low and side-on, so a click on the log, the axe or the guest
    // lands on the ground metres behind them and counted as walking away:
    // what matters is how close the click passes to the block and the guest,
    // not where its ray ends up on the ground.)
    if (splitActive(s.split) && clickAtBlock(e.ray)) {
      // (the swing is a timing game: it goes the moment the button does)
      if (s.split.phase === 'ready') swingAxe(s.split)
      return
    }
    // Casting a line: a click on the water by the hole casts, strikes or
    // reels (straight away: the bite is a timing game); further off, the rod
    // goes away and the guest walks there. A tap on the water by the hole
    // when not fishing walks to the landing and casts; a tap on the landing
    // or the stairs walks there (they're below the field, under the ground
    // that takes the taps).
    // (Eduard: "click to cast the fishing rod doesn't work either". Only a
    // click whose ray met the water inside the little circle of the hole
    // counted; the casting camera is low and side-on, so a click on the
    // guest, the rod, the bobber or the landing fell outside it, and put the
    // rod away. Like the axe, it goes by how close the click passes.)
    const onBrook = brookTap(e.ray.origin, e.ray.direction)
    if (rodInHand() && (onBrook?.hole || clickAtHole(e.ray))) {
      pressFishing(s.fish)
      return
    }
    if (onBrook && !insideCabin(s.guest)) {
      tap.current = () => {
        leaveActivities()
        if (onBrook.hole) walkAndUse('fish', CAST_SPOT, CAST_SPOT, 0.5)
        else walkTo(onBrook.at)
      }
      return
    }
    // At the workbench (the camera is on the boxes) a click that just misses a
    // box or its tag must not send the guest off round the back of the bench
    // (Eduard: "if you miss the click by literal pixel your character just
    // starts walking behind the wood shed"). The nearest box takes a near
    // miss. No click sends them round the back: on a desktop a click on the
    // bench does nothing; a click behind it (or, on a phone, anywhere that
    // isn't a box) steps them back out in front of it. A click in the yard
    // walks there as usual. (Once the visitor has turned the camera there, the
    // bench is small on the screen and this only sees to clicks that land by
    // it: from some sides the chopping block shows just past the bench, and a
    // click on it did nothing.)
    const ownView = !s.framed && !s.setMoment
    const byTheBench =
      Math.hypot(e.point.x - BOXES_CENTRE.x, e.point.z - BOXES_CENTRE.z) < BENCH_NEAR
    if (
      (s.prompt === 'workbench' || s.box.want >= 0) &&
      !insideCabin(s.guest) &&
      (!ownView || byTheBench)
    ) {
      const rect = gl.domElement.getBoundingClientRect()
      const px = e.nativeEvent.clientX - rect.left
      const py = e.nativeEvent.clientY - rect.top
      let nearest = -1
      let nearestPx = BENCH_MISS_PX
      CRATES.forEach((c, i) => {
        for (const p of [c, BOX_TAGS[i]]) {
          tmp.set(p.x, p.y, p.z).project(camera)
          const d = Math.hypot(
            ((tmp.x + 1) / 2) * rect.width - px,
            ((1 - tmp.y) / 2) * rect.height - py,
          )
          if (d < nearestPx) {
            nearestPx = d
            nearest = i
          }
        }
      })
      if (nearest >= 0) {
        tap.current = () => callbacks.current.onOpenBox(nearest)
        return
      }
      // on the bench as the camera sees it (its outline on screen, with a margin) ...
      let x0 = Infinity
      let x1 = -Infinity
      let y0 = Infinity
      let y1 = -Infinity
      for (const a of [-BENCH_HALF_LENGTH, BENCH_HALF_LENGTH])
        for (const o of [-0.4, 0.36])
          for (const y of [0, BENCH_TOP_Y]) {
            tmp
              .set(
                BOXES_CENTRE.x - BENCH_FRONT.z * a + BENCH_FRONT.x * o,
                y,
                BOXES_CENTRE.z + BENCH_FRONT.x * a + BENCH_FRONT.z * o,
              )
              .project(camera)
            const sx = ((tmp.x + 1) / 2) * rect.width
            const sy = ((1 - tmp.y) / 2) * rect.height
            x0 = Math.min(x0, sx)
            x1 = Math.max(x1, sx)
            y0 = Math.min(y0, sy)
            y1 = Math.max(y1, sy)
          }
      // (Below the bench on screen is the grass on the guest's side: that
      // always walks them away from it, far enough to leave the bench. On a
      // phone the bench fills the screen and that strip is all there is.
      // Once the visitor has turned the camera, below the bench can be the
      // ground behind it, or off past the woodshed: that's for the rules below.)
      const out0 =
        (e.point.x - BOXES_CENTRE.x) * BENCH_FRONT.x + (e.point.z - BOXES_CENTRE.z) * BENCH_FRONT.z
      if (py > y1 && out0 >= 0) {
        const push = Math.max(0, BENCH_LEAVE_OUT - out0)
        const away = { x: e.point.x + BENCH_FRONT.x * push, z: e.point.z + BENCH_FRONT.z * push }
        tap.current = () => {
          leaveActivities()
          walkTo(away)
        }
        return
      }
      const onBench =
        px > x0 - BENCH_MARGIN_PX &&
        px < x1 + BENCH_MARGIN_PX &&
        py > y0 - BENCH_MARGIN_PX &&
        py < y1 + BENCH_MARGIN_PX
      // (how much of the screen the bench takes up: nearly all of it on a phone)
      const covers =
        (Math.max(0, Math.min(rect.width, x1) - Math.max(0, x0)) *
          Math.max(0, Math.min(rect.height, y1) - Math.max(0, y0))) /
        (rect.width * rect.height)
      const out =
        (e.point.x - BOXES_CENTRE.x) * BENCH_FRONT.x + (e.point.z - BOXES_CENTRE.z) * BENCH_FRONT.z
      const along =
        (e.point.x - BOXES_CENTRE.x) * -BENCH_FRONT.z + (e.point.z - BOXES_CENTRE.z) * BENCH_FRONT.x
      // (behind the bench, or behind the woodshed beside it: the shed runs on
      // from the bench's far end)
      const behind = out < 0.45 && along > -SHED_BEHIND_ALONG && along < BENCH_BEHIND_ALONG
      // On the bench itself, where there's other ground to click (a desktop):
      // nothing happens (it puts an open box back).
      if (onBench && covers < BENCH_FILLS_SCREEN) {
        tap.current = () => {
          if (s.box.want >= 0) callbacks.current.onCloseBox()
        }
        return
      }
      // On the bench where it fills the screen (a phone), or on the ground
      // behind it: the guest steps back out in front of the bench instead of
      // walking round the back. (Doing nothing here left a phone with no way
      // to walk away: Eduard, "you broke exiting the shed".)
      if (onBench || behind) {
        const a = Math.max(-1.6, Math.min(1.6, along))
        const away = {
          x: BOXES_CENTRE.x + BENCH_FRONT.x * BENCH_LEAVE_OUT - BENCH_FRONT.z * a,
          z: BOXES_CENTRE.z + BENCH_FRONT.z * BENCH_LEAVE_OUT + BENCH_FRONT.x * a,
        }
        tap.current = () => {
          leaveActivities()
          walkTo(away)
        }
        return
      }
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
        walkTo(rubSpot(s.dog, s.guest))
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
        s.sit.at = 'bench'
        break
      case 'sit-fire':
        // round to the front of the camp chair, then sit back into it, facing the fire
        walkTo(GUEST_FIRE_STAND, true)
        s.marker.life = 0
        s.sit.phase = 'walking'
        s.sit.at = 'fire'
        break
      case 'yahtzee':
        s.guestYaw = facing(s.guest, YAHTZEE)
        callbacks.current.onLook('yahtzee')
        callbacks.current.onGoal('yahtzee')
        break
      case 'getup':
        standUp()
        break
      case 'fish':
        // down to the landing, take the rod off the rail, then cast
        if (!fishingActive(s.fish)) {
          startFishing(s.fish)
          walkTo(castStance().at, true)
          s.marker.life = 0
        }
        break
      case 'tap':
        // turn the tap on: the water runs into the jug for a moment
        s.guestYaw = facing(s.guest, TAP)
        s.tapRun = 0
        s.fire.didBrook = true
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
    // (splitting wood, a click near the block is a swing even with Rusty in
    // the way; and casting a line, a click by the hole is a cast)
    if (splitActive(s.split) && clickAtBlock(e.ray)) return
    if (rodInHand() && clickAtHole(e.ray)) return
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
    if (splitActive(s.split) && clickAtBlock(e.ray)) return
    if (rodInHand() && clickAtHole(e.ray)) return
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
      // In the middle of the splitting game a click on the block is a swing
      // (it used to put the axe back and start the game again).
      // ... and with the rod in hand, a click on the rail where it leant (or
      // on the tap beside the stairs) is a cast, a strike or a turn of the reel.
      if ((id === 'fish' || id === 'tap') && rodInHand() && clickAtHole(e.ray)) {
        e.stopPropagation()
        pressFishing(s.fish)
        return
      }
      if (id === 'split' && splitActive(s.split) && s.split.phase !== 'walking') {
        e.stopPropagation()
        if (s.split.phase === 'ready') swingAxe(s.split)
        return
      }
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

  // The fire, at night: a tap on the guest's chair (or on Eduard in his) walks
  // the guest round and sits them down; once they're sitting, a tap on Eduard
  // brings his questions up. By day the chairs are just chairs.
  const onFireSeatDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
    const s = sim.current
    if (s.fire.night < 0.5 || insideCabin(s.guest)) return
    e.stopPropagation()
    tap.current = () => {
      // (already sitting: the choices are up; a click on the chairs does nothing more)
      if (s.sit.at === 'fire' && (s.sit.phase === 'sitting' || s.sit.phase === 'seated')) return
      leaveActivities()
      act('sit-fire')
    }
  }

  // Tapping HUGO opens his questions (A48). Like every tap it runs when the
  // pointer comes up, and only if it didn't drag (A109); it never walks.
  const hugoStop = useRef<HugoStop | null>(null)
  const onHugoDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
    // (while splitting, a click is a swing; HUGO isn't asked then)
    if (splitActive(sim.current.split) || !callbacks.current.onTapHugo) return
    // (nor with the rod in hand: he floats right by the fishing hole, and a click there is a cast)
    if (rodInHand() && clickAtHole(e.ray)) return
    e.stopPropagation()
    tap.current = () => callbacks.current.onTapHugo?.()
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
  // the pointer comes up. The moments with a camera of their own (a box, the
  // chopping block, inside the cabin) take over, and the visitor's turn starts
  // afresh after them. The woodshed's, the shower's and the bench's views hand
  // the camera over as soon as the visitor turns or zooms it there (Eduard, on
  // a phone: "you can't control where your camera looks in there").
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
    const take = () => {
      const s = sim.current
      if (!s.framed) return
      letGo(s)
      s.framed = false
      s.camTake = true
    }
    const turn = (dx: number, dy: number) => {
      const s = sim.current
      if (s.setMoment) return
      take()
      // (a screen's width is about a full turn, A109: on a phone too, where at
      // a computer's rate a swipe across it turned only a third of the way)
      s.camYaw -= dx * Math.max(0.005, (Math.PI * 2) / Math.max(1, el.clientWidth))
      s.camPitch = Math.max(-0.35, Math.min(0.42, s.camPitch + dy * 0.004))
    }
    const zoomTo = (z: number) => {
      const s = sim.current
      if (s.setMoment) return
      take()
      s.userZoom = Math.max(0.55, Math.min(1.7, z))
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
    pressDown.current = down
    return () => {
      pressDown.current = null
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
    // (during the cut to the fire, E, Esc or a walking key just ends it)
    const inCut = s.fire.cut >= 0
    const skipCut = inCut && (k.escape || k.use)
    if (inCut) {
      k.escape = false
      k.use = false
    }
    if (k.escape) {
      k.escape = false
      leaveActivities()
    }
    if (k.use) {
      k.use = false
      if (sp.phase === 'ready') swingAxe(sp)
      else if (!(holdsRod(s.fish) && pressFishing(s.fish))) runPrompt(null)
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
      if (
        bx.want >= 0 ||
        (splitActive(sp) && sp.phase !== 'walking') ||
        (fishingActive(s.fish) && s.fish.phase !== 'walking') ||
        s.tapRun >= 0
      )
        leaveActivities()
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
    const seatSpots = sitSpots(st.at)
    if (st.phase === 'walking' && !s.target) {
      if (dist(seatSpots.stand) < 0.35) {
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
      // back onto the end of the bench, facing the deck (and Eduard); or back
      // into the camp chair, facing the fire
      const kk = st.k * st.k * (3 - 2 * st.k)
      s.guest = {
        x: seatSpots.stand.x + (seatSpots.seat.x - seatSpots.stand.x) * kk,
        z: seatSpots.stand.z + (seatSpots.seat.z - seatSpots.stand.z) * kk,
      }
      s.guestYaw = turnTowards(
        s.guestYaw,
        st.at === 'fire' ? FIRE_SEATS.guest.yaw : facing(s.guest, s.ed.pos),
        6 * dt,
      )
    } else st.k = 0
    // by the fire: the overlay puts the questions for Eduard up while they sit
    const fireSeated = st.at === 'fire' && st.phase === 'seated'
    if (fireSeated !== s.fire.seated) {
      s.fire.seated = fireSeated
      callbacks.current.onFireSeat?.(fireSeated)
    }

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
      dr.state === 'reaching' || (s.tapRun >= 0 && s.tapRun < 2.4)
        ? 1
        : dr.state === 'opening'
          ? Math.max(0, 1 - dr.t / 0.45)
          : 0
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
    // ---------------------------------------------------------- casting a line (fishing.ts)
    const fi = s.fish
    if (fi.phase === 'walking' && !s.target) {
      if (dist(castStance().at) < 0.4) arriveAtHole(fi)
      else stopFishing(fi)
    }
    const fishing = fishingActive(fi)
    if (fishing && fi.phase !== 'walking')
      s.guestYaw = turnTowards(s.guestYaw, castStance().yaw, 8 * dt)
    updateFishing(fi, dt)
    if (fi.event === 'caught') callbacks.current.onGoal('fish')
    if (fishing !== s.fishWas) {
      s.fishWas = fishing
      // (a go at the fishing hole, caught or not, counts as having done something at the brook)
      if (!fishing) s.fire.didBrook = true
      callbacks.current.onFishing(fishing)
    }
    if (fishing)
      callbacks.current.onFishingFrame({
        phase: fi.phase,
        reel: fi.reel,
        caught: fi.caught,
        event: fi.event,
        gold: fi.gold,
      })
    const rodHeld = holdsRod(fi)
    p3.rod.visible = !rodHeld
    // the rod goes in the right hand, where the axe would be
    const hand = joints.hiker.axe.obj
    if (gear.rod.parent !== hand.parent && hand.parent) {
      hand.parent.add(gear.rod)
      gear.rod.position.copy(hand.position)
    }
    // the tap: the water runs into the jug for a moment, then it's off
    if (s.tapRun >= 0) {
      s.tapRun += dt
      s.guestYaw = turnTowards(s.guestYaw, facing(s.guest, TAP), 8 * dt)
      if (s.tapRun > 2.9 || dist(TAP_SPOT) > 0.9) s.tapRun = -1
    }
    tapStream.visible = s.tapRun > 0.45 && s.tapRun < 2.5
    if (tapStream.visible) tapStream.scale.x = tapStream.scale.z = 0.85 + Math.sin(t * 40) * 0.15

    const axeHeld = holdsAxe(sp)
    p3.blockAxe.visible = !axeHeld
    joints.hiker.axe.obj.visible = axeHeld
    joints.hiker.fistR.obj.visible = axeHeld || rodHeld
    joints.hiker.handR.obj.visible = !axeHeld && !rodHeld
    // the log on the block pops up, and the chunks that came off it lie about
    p3.log.visible = sp.logIn > 0.02
    if (p3.log.visible) {
      const pop = Math.min(1, sp.logIn * 1.1)
      p3.log.position.set(CHOPPING_BLOCK.x, LOG_Y, CHOPPING_BLOCK.z)
      p3.log.scale.set(0.6 + 0.4 * pop, pop, 0.6 + 0.4 * pop)
    }
    // ---------------------------------------------------------- HUGO tidies up (vacuum.ts)
    const vac = s.vac
    if (splitActive(sp) && vac.phase !== 'idle' && vac.phase !== 'toShed' && vac.phase !== 'drop') {
      vac.phase = vac.carried.length ? 'toShed' : 'idle'
      if (vac.chunk) vac.chunk.suck = 0
      vac.chunk = null
    }
    if (
      vac.phase === 'idle' &&
      !(callbacks.current.hugoLead && !s.reachedWoodshed) &&
      !(callbacks.current.brookLead && !s.brook.reached) &&
      readyToTidy(sp, insideCabin(s.guest))
    ) {
      vac.phase = 'toChunk'
      vac.t = 0
    }
    const vacGoal = updateVacuum(vac, sp, s.hugo, dt)
    const vp = vacParts
    {
      // The hose: out of the bottom of his body, straight down at first, then
      // bending to wherever the nozzle is. It pays out towards the place the
      // nozzle is reaching for, trembles while the suction's on and kicks
      // back when a piece pops out.
      const reach = vac.reach
      vp.hose.visible = vac.hose > 0.03 && reach !== null
      vp.puff.visible = false
      vp.streaks.forEach((m) => (m.visible = false))
      if (vp.hose.visible && reach) {
        const from = tmpA.set(s.hugo.x, s.hugo.y + 0.02, s.hugo.z)
        const tip = vp.tip
          .set(reach.x, reach.y, reach.z)
          .sub(from)
          .multiplyScalar(vac.hose)
          .add(from)
        const dangling = 1 - Math.min(1, vac.hose)
        tip.x += Math.sin(t * 7.3) * 0.04 * dangling + Math.sin(t * 41) * 0.006 * vac.suction
        tip.z += Math.cos(t * 6.1) * 0.04 * dangling + Math.cos(t * 37) * 0.006 * vac.suction
        const along = tmpB.copy(tip).sub(from)
        const len = Math.max(0.05, along.length())
        along.divideScalar(len)
        // (the kick: back towards him and up)
        const kick = Math.sin(vac.puff * Math.PI) * 0.09
        tip.addScaledVector(along, -kick)
        tip.y += kick * 0.6
        // the bend's middle: below him, pulled a little towards the nozzle, swaying
        const mid = tmpC
          .copy(from)
          .addScaledVector(along, len * 0.25)
          .setY(from.y - Math.max(0.12, (from.y - tip.y) * 0.62 + len * 0.22))
        mid.x += Math.sin(t * 2.3) * 0.02
        mid.z += Math.cos(t * 1.9) * 0.02
        const pts = vp.points
        const last = pts.length - 1
        for (let i = 0; i <= last; i++) {
          const u = i / last
          const a = (1 - u) * (1 - u)
          const m = 2 * u * (1 - u)
          const c = u * u
          pts[i].set(
            from.x * a + mid.x * m + tip.x * c,
            from.y * a + mid.y * m + tip.y * c,
            from.z * a + mid.z * m + tip.z * c,
          )
        }
        // the lump: a piece on its way through
        const fat = (u: number) =>
          vac.lump < 0 ? 0 : 1.15 * Math.exp(-(((u - vac.lump) / 0.13) ** 2))
        for (let i = 0; i <= last; i++) {
          const u = i / last
          const dir = tmpD
            .copy(pts[Math.min(last, i + 1)])
            .sub(pts[Math.max(0, i - 1)])
            .normalize()
          const rib = vp.ribs[i]
          rib.position.copy(pts[i])
          rib.quaternion.setFromUnitVectors(AXIS_Y, dir)
          const wide = 1 + fat(u)
          rib.scale.set(wide, 1, wide)
          if (i < last) {
            const piece = vp.lengths[i]
            const d = tmpD.copy(pts[i + 1]).sub(pts[i])
            const l = d.length()
            piece.position.copy(pts[i])
            piece.quaternion.setFromUnitVectors(AXIS_Y, d.divideScalar(l || 1))
            const w = 1 + fat(u + 0.5 / last)
            piece.scale.set(w, l, w)
          }
        }
        const mouth = tmpD
          .copy(pts[last])
          .sub(pts[last - 1])
          .normalize()
        vp.nozzle.position.copy(tip)
        vp.nozzle.quaternion.setFromUnitVectors(AXIS_Y, mouth)
        const flare =
          1 + vac.suction * (0.12 + 0.08 * Math.sin(t * 30)) + Math.sin(vac.puff * Math.PI) * 0.35
        vp.nozzle.scale.set(flare, 1, flare)
        // (the mouth of the nozzle, for the pieces)
        tip.addScaledVector(mouth, 0.1)
        // white O-rings running along it: up into him, or down to the nozzle
        vp.rings.forEach((r, k) => {
          const f = (((vac.ringT + k / vp.rings.length) % 1) + 1) % 1
          r.visible = vac.flow !== 0
          if (!r.visible) return
          const u = vac.flow > 0 ? 1 - f : f
          const at = u * last
          const i = Math.min(last - 1, Math.floor(at))
          r.position.copy(pts[i]).lerp(pts[i + 1], at - i)
          r.quaternion.setFromUnitVectors(
            AXIS_Y,
            tmpE
              .copy(pts[i + 1])
              .sub(pts[i])
              .normalize(),
          )
          const swell = (0.75 + Math.sin(f * Math.PI) * 0.55) * (1 + fat(u) * 0.6)
          r.scale.set(swell, 1, swell)
        })
        // the puff as a piece pops out: a white ring that widens and thins away
        if (vac.puff > 0.02) {
          const gone = 1 - vac.puff
          vp.puff.visible = true
          vp.puff.position.copy(tip).addScaledVector(mouth, 0.04 + gone * 0.22)
          vp.puff.quaternion.setFromUnitVectors(AXIS_Y, mouth)
          const wide = 1 + gone * 2.4
          vp.puff.scale.set(wide, 1 - gone * 0.5, wide)
          ;(vp.puff.material as THREE.MeshBasicMaterial).opacity = vac.puff
        }
        // streaks of air drawn in from round the piece
        if (vac.suction > 0) {
          vp.streaks.forEach((m, k) => {
            const f = (((t * 2.6 + k / vp.streaks.length) % 1) + 1) % 1
            const a = k * 2.4 + t * 5
            const r = 0.34 * (1 - f) * (1 - f)
            m.visible = true
            m.position.set(
              tip.x + Math.sin(a) * r,
              reach.y - 0.28 + (tip.y - reach.y + 0.28) * (f * f),
              tip.z + Math.cos(a) * r,
            )
            m.scale.setScalar(1.3 - f)
          })
        }
      }
      // The pieces he's laid on the stack, lying front to back like the rest.
      // Each one pops out of the nozzle small, flies the last bit in a little
      // arc, and lands at full size.
      while (vp.stack.children.length < vac.placed.length) {
        const n = vp.stack.children.length
        const kind = vac.placed[n]
        const m = (kind === 2 ? p3.log : p3.halves[kind]).clone(true)
        m.visible = true
        const spot = stackSpot(n)
        const base = shedPoint(spot.lx, -0.86, spot.at.y)
        const back = shedPoint(spot.lx, 0.26, spot.at.y)
        m.quaternion.setFromUnitVectors(
          AXIS_Y,
          tmpA.set(back.x - base.x, 0, back.z - base.z).normalize(),
        )
        m.rotateY(n * 1.9) // (each one turned a little differently, like split wood)
        m.userData.rest = new THREE.Vector3(base.x, base.y, base.z)
        m.userData.from = vp.tip.clone()
        m.userData.flying = true
        vp.stack.add(m)
      }
      const newest = vp.stack.children[vp.stack.children.length - 1]
      for (const m of vp.stack.children) {
        if (!m.userData.flying) continue
        const rest = m.userData.rest as THREE.Vector3
        const k = m === newest ? vac.fly : 1
        if (k >= 1) {
          m.userData.flying = false
          m.position.copy(rest)
          m.scale.set(1, 1, 1)
          continue
        }
        const e = 1 - (1 - k) * (1 - k)
        m.position.copy(m.userData.from as THREE.Vector3).lerp(rest, e)
        m.position.y += Math.sin(k * Math.PI) * 0.1
        const back = k - 1
        m.scale.setScalar(0.3 + 0.7 * (1 + back * back * (2.8 * back + 1.8)))
      }
    }

    // ---------------------------------------------------------- the split pieces
    if (chunksG.current) {
      const g = chunksG.current
      const meshes = chunkMeshes.current
      for (const c of sp.chunks) {
        if (meshes.has(c)) continue
        const template = c.kind === 2 ? p3.log : p3.halves[c.kind]
        const m = template.clone(true)
        m.visible = true
        m.scale.set(1, 1, 1)
        g.add(m)
        meshes.set(c, m)
      }
      for (const [c, m] of meshes) {
        if (sp.chunks.includes(c)) continue
        g.remove(m)
        meshes.delete(c)
      }
      for (const [c, m] of meshes) {
        // Going up HUGO's hose: the suction rattles it, it stands up on end
        // under the nozzle, then it's drawn up into it, stretching thin.
        const up = c.suck ?? 0
        const stand = easeInOut(clamp01(up / 0.4))
        const rise = clamp01((up - 0.4) / 0.6)
        const rattle = up > 0 ? (1 - rise) * Math.min(1, up * 6) : 0
        const fall = c.tip * c.tip * (3 - 2 * c.tip) * (1 - stand)
        m.position.set(
          c.pos.x + Math.sin(t * 47) * 0.012 * rattle,
          c.pos.y + fall * 0.11 + Math.abs(Math.sin(t * 31)) * 0.035 * rattle,
          c.pos.z + Math.cos(t * 43) * 0.012 * rattle,
        )
        // tips over sideways about its base, turned the way it was flung
        tmpQ.setFromAxisAngle(AXIS_Y, c.yaw + Math.sin(t * 39) * 0.2 * rattle + rise * rise * 5)
        tmpQ2.setFromAxisAngle(AXIS_Z, -c.side * fall * (Math.PI / 2))
        m.quaternion.copy(tmpQ).multiply(tmpQ2)
        // a half lies flat side down once it's settled; a whole log just rolls a little
        if (c.kind !== 2)
          m.quaternion.multiply(tmpQ2.setFromAxisAngle(AXIS_Y, (c.kind ? 1 : -1) * fall * 1.2))
        if (rise > 0) {
          const k = rise * rise
          // (its top end leads into the nozzle)
          m.position.lerp(tmpA.copy(vp.tip).setY(vp.tip.y - LOG_H * 0.55 * (1 - k)), k)
          const thin = 1 - 0.72 * k
          m.scale.set(thin, (1 + 0.3 * Math.sin(rise * Math.PI)) * (1 - 0.5 * k * k), thin)
        } else m.scale.set(1, 1, 1)
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
    // Rubbing his belly: kneeling beside him with both hands on it (they used
    // to rub the air by his front paws, 20 to 30 cm off him). The hands stay on
    // until he rolls back over, and the guest gets up once he's settled.
    const besideDog = dog.state === 'lying' && toDog < 1.4 && !s.target
    const onBelly = besideDog && (dog.rubbing > 0 || (s.rubK > 0.05 && dog.roll > 0.6))
    s.rubK += ((onBelly ? 1 : 0) - s.rubK) * damp(dt, onBelly ? 5 : 9)
    const rubbing = besideDog && (dog.rubbing > 0 || dog.roll > 0.15)
    if (rubbing && s.kneel < 0.98) {
      // (going down on their knees, the guest shuffles the last few
      // centimetres in: the walk stops a little short of the spot)
      const spot = rubSpot(dog, s.guest)
      if (Math.hypot(spot.x - s.guest.x, spot.z - s.guest.z) < 0.3) {
        s.guest.x += (spot.x - s.guest.x) * damp(dt, 6)
        s.guest.z += (spot.z - s.guest.z) * damp(dt, 6)
      }
    }
    const petting = dog.petting > 0 && toDog < 2 && !s.target
    // Petting: the hand goes to the top of his head, wherever that is this
    // frame (Eduard: "petting animation seems to be offset, I am not touching
    // him"). The guest turns so that shoulder is in line with his head, bends
    // forward at the hips just far enough to reach, and strokes back from his
    // brow towards his ears, lifting the hand a little on the way forward.
    const petOn = petting && dog.sit > 0.5
    s.petK += ((petOn ? 1 : 0) - s.petK) * damp(dt, petOn ? 7 : 9)
    let petYaw: number | null = null
    let petArm = 0
    let bowGoal = 0
    if (petting) {
      const stroke = 0.5 + 0.5 * Math.sin(t * 5)
      const top = joints.rusty.head.obj.localToWorld(
        tmpA.set(0, 0.222 + 0.01 * stroke, 0.05 - 0.09 * stroke),
      )
      const d = Math.max(0.3, Math.hypot(top.x - s.guest.x, top.z - s.guest.z))
      const yawTo = Math.atan2(top.x - s.guest.x, top.z - s.guest.z)
      // (sat down, he shuffles the last few centimetres so his head is at arm's length)
      if (petOn && dog.petSettled) {
        const shuffle = Math.max(-0.3, Math.min(0.3, d - PET_HEAD_AT)) * damp(dt, 4)
        dog.pos.x -= Math.sin(yawTo) * shuffle
        dog.pos.z -= Math.cos(yawTo) * shuffle
      }
      // the hand on the side his nose points past, so his muzzle (and the cow) is clear of that arm
      if (!petOn || s.petK < 0.05) {
        const noseRight = Math.sin(dog.yaw) * -Math.cos(yawTo) + Math.cos(dog.yaw) * Math.sin(yawTo)
        s.petSide = noseRight >= 0 ? 1 : -1
      }
      petYaw = yawTo + s.petSide * Math.asin(Math.min(0.95, SHOULDER_OUT / d))
      // in the upright plane through that shoulder: how far ahead and how high his head is
      const ahead = Math.sqrt(Math.max(0.0004, d * d - SHOULDER_OUT * SHOULDER_OUT))
      const high = top.y - s.guestY + legDrop(-PET_CROUCH * 1.1, PET_CROUCH * 1.9)
      let b = 0
      for (; b < PET_BOW_MAX; b += 0.025)
        if (
          Math.hypot(ahead - SPINE * Math.sin(b), high - HIP_Y - SPINE * Math.cos(b)) <= ARM_LENGTH
        )
          break
      bowGoal = b
      const lift = Math.max(0, -Math.cos(t * 5)) * 0.1
      // (the arm's angle from hanging straight down, forwards)
      petArm = Math.atan2(ahead - SPINE * Math.sin(b), HIP_Y + SPINE * Math.cos(b) - high) + lift
    }
    if (rubbing) {
      // (square on to the middle of his belly, so both hands reach it)
      const mid = joints.rusty.body.obj.localToWorld(tmpA.set(0, -0.17, 0.075))
      s.guestYaw = turnTowards(s.guestYaw, facing(s.guest, mid), 8 * dt)
    } else if (petYaw !== null) s.guestYaw = turnTowards(s.guestYaw, petYaw, 8 * dt)
    s.crouch += ((petting ? PET_CROUCH : bx.hold * shelfCrouch) - s.crouch) * damp(dt, 7)
    s.kneel += ((rubbing ? 1 : 0) - s.kneel) * damp(dt, 6)
    // Crouching (thighs forward, shins back) or kneeling (legs.ts), the body
    // comes down until the knees or boots meet the ground: a fixed drop put
    // the boots 15 cm into the ground once the knees bent at the knee.
    const crouchThigh = -s.crouch * 1.1 + s.kneel * KNEEL.thigh
    const crouchShin = s.crouch * 1.9 + s.kneel * KNEEL.shin
    const drop = legDrop(crouchThigh, crouchShin)
    // Both hands on his belly, wherever it is this frame (he squirms), each
    // going round in small circles, one towards his chest and one towards his
    // hips; the guest bends at the hips just as far as it takes to reach.
    let rubArmL = { x: 0, z: 0 }
    let rubArmR = { x: 0, z: 0 }
    let rubBow = 0
    if (s.rubK > 0.001) {
      const body = joints.rusty.body.obj
      const ph = t * 7
      // (just off his belly's surface, which rises towards his waist: rusty_model.py)
      const chest = body.localToWorld(
        tmpA.set(Math.cos(ph) * 0.035, -0.19, 0.15 + Math.sin(ph) * 0.035),
      )
      const hips = body.localToWorld(tmpB.set(-Math.cos(ph) * 0.035, -0.165, -Math.sin(ph) * 0.035))
      // (whichever is on the guest's left takes their left hand)
      const leftOf = (p: THREE.Vector3) =>
        (p.x - s.guest.x) * Math.cos(s.guestYaw) - (p.z - s.guest.z) * Math.sin(s.guestYaw)
      const [toL, toR] = leftOf(chest) > leftOf(hips) ? [chest, hips] : [hips, chest]
      const hipY = s.guestY - drop + HIP_Y
      let best = Infinity
      for (let b = RUB_BOW.min; b <= RUB_BOW.max; b += 0.025) {
        const l = armTo(toL, s.guest, hipY, s.guestYaw, b, 1)
        const r = armTo(toR, s.guest, hipY, s.guestYaw, b, -1)
        const miss = Math.abs(l.reach - ARM_LENGTH) + Math.abs(r.reach - ARM_LENGTH)
        if (miss < best) {
          best = miss
          rubBow = b
        }
      }
      rubArmL = armTo(toL, s.guest, hipY, s.guestYaw, s.bow, 1)
      rubArmR = armTo(toR, s.guest, hipY, s.guestYaw, s.bow, -1)
    }
    const bowWant = s.rubK > 0.001 ? rubBow * s.rubK : bowGoal * s.petK
    s.bow += (bowWant - s.bow) * damp(dt, 8)
    const bow = s.bow
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
    // crouching: thighs forward, shins back (the hands are on his belly: above)
    // sitting on the bench: thighs out over the end of it, shins hanging, hands on knees
    const seat = s.sit.k * s.sit.k * (3 - 2 * s.sit.k)
    // (going down or getting up, the legs keep up with the body: lagging
    // behind it, the boots dipped into the ground on the way down)
    const legRate = s.kneel > 0.005 || s.crouch > 0.005 ? snap : relax
    lerpRot(j.legL, 'x', swing * 0.6 + crouchThigh - seat * 1.5 - bow, legRate)
    lerpRot(j.legR, 'x', -swing * 0.6 + crouchThigh - seat * 1.5 - bow, legRate)
    lerpRot(
      j.shinL,
      'x',
      (walking ? Math.max(0, -Math.cos(s.walkPhase)) * 0.6 : 0) + crouchShin + seat * 1.5,
      legRate,
    )
    lerpRot(
      j.shinR,
      'x',
      (walking ? Math.max(0, Math.cos(s.walkPhase)) * 0.6 : 0) + crouchShin + seat * 1.5,
      legRate,
    )
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
    } else if (rodHeld) {
      // Casting a line, with the guest's own arms (fishing.ts): the rod back
      // over the shoulder, whipped forward, held out over the water, wound in,
      // and the catch held up on the line.
      const cp = castPose(fi, t)
      const fast = fi.phase === 'cast' || fi.phase === 'windup' ? damp(dt, 22) : damp(dt, 10)
      lerpRot(j.armR, 'x', cp.armR, fast)
      lerpRot(j.armL, 'x', cp.armL, fast)
      lerpRot(j.armR, 'z', cp.armRz, fast)
      lerpRot(j.armL, 'z', cp.armLz, fast)
      lerpRot(j.axe, 'x', 0)
      lerpRot(j.head, 'x', cp.head)
      // the rod turns in the hand so it points `pitch` above level, whatever the arm's doing
      const armNow = j.armR.obj.rotation.x - j.armR.base.x
      gear.rod.rotation.set(-cp.pitch - armNow + Math.sin(t * 31) * cp.shake, 0, 0)
    } else {
      // (bent forward to pet him, the arms hang straight down unless one is on his head)
      const petL = s.petSide < 0 ? s.petK : 0
      const petR = s.petSide > 0 ? s.petK : 0
      const restL = -swing * 0.5 - hold * 1.05 - s.reach * 0.2 - seat * 0.55 - bow
      const restR = swing * 0.5 - hold * 1.05 - s.reach * 1.25 - seat * 0.55 - bow
      const rubK = s.rubK
      // (on his belly or his head the hand keeps up with him: snappier)
      const fastL = petL > 0.5 || rubK > 0.5 ? snap : relax
      const fastR = petR > 0.5 || rubK > 0.5 ? snap : relax
      const armLx = restL + (-(petArm + bow) - restL) * petL
      const armRx = restR + (-(petArm + bow) - restR) * petR
      lerpRot(j.armL, 'x', armLx + (rubArmL.x - armLx) * rubK, fastL)
      lerpRot(j.armR, 'x', armRx + (rubArmR.x - armRx) * rubK, fastR)
      const armLz = hold * 0.3 * (1 - petL)
      const armRz = (-hold * 0.3 - s.reach * 0.1) * (1 - petR)
      lerpRot(j.armL, 'z', armLz + (rubArmL.z - armLz) * rubK, fastL)
      lerpRot(j.armR, 'z', armRz + (rubArmR.z - armRz) * rubK, fastR)
      lerpRot(j.axe, 'x', 0)
      lerpRot(j.head, 'x', hold * 0.3 - s.reach * 0.05 + s.petK * 0.12)
    }
    // by the fire, the guest looks over at Eduard while he's talking to them
    let toEduard = 0
    if (s.sit.at === 'fire' && seat > 0.5 && (props.eduardTalking || eduardGreeting === 'guest')) {
      toEduard = facing(s.guest, s.ed.pos) - s.guestYaw
      while (toEduard > Math.PI) toEduard -= Math.PI * 2
      while (toEduard < -Math.PI) toEduard += Math.PI * 2
      toEduard = Math.max(-1.1, Math.min(1.1, toEduard))
    }
    lerpRot(j.head, 'y', toEduard, damp(dt, 5))
    // (bending forward turns the whole model about its feet; the legs are
    // swung back upright above, so shift it to keep the feet where they were)
    const hipBack = HIP_Y * Math.sin(bow)
    G.hiker.position.set(
      s.guest.x - Math.sin(s.guestYaw) * hipBack,
      s.guestY +
        (walking ? Math.abs(Math.sin(s.walkPhase)) * 0.05 : Math.sin(t * 2) * 0.006) -
        drop +
        HIP_Y * (1 - Math.cos(bow)) +
        seat * (seatSpots.y - 0.4 + 0.03),
      s.guest.z - Math.cos(s.guestYaw) * hipBack,
    )
    G.hiker.rotation.set(bow, s.guestYaw, 0, 'YXZ')

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
    // HUGO's questions (A48): which stop of the tour the guest is at
    const stopNow = hugoStopAt(s.guest, inside, hugoStop.current, { night: s.fire.night > 0.5 })
    if (stopNow !== hugoStop.current) {
      hugoStop.current = stopNow
      callbacks.current.onStop?.(stopNow)
    }
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

    // ---------------------------------------------------------- the brook (scene 6)
    const bk = s.brook
    if (!bk.reached && (dist(STAIRS_TOP) < BROOK_REACHED || belowBank(s.guest))) {
      bk.reached = true
      callbacks.current.onReachBrook()
    }
    // After the woodshed, HUGO leads the guest on to the brook (brook.ts,
    // readyForBrook): once they've looked in a box and had a go at splitting
    // (the boxes, then the block, one after the other: the fairy trail leads
    // to each, trail.ts) and are free again, or once they've walked off from
    // the woodshed.
    bk.triedBlock ||= holdsAxe(sp)
    bk.didShed ||= bk.triedBlock && bx.opened.some(Boolean)
    const shedBusy =
      splitting || bx.want >= 0 || s.vac.phase !== 'idle' || inside || s.sit.phase !== 'off'
    bk.freeFor = shedBusy || s.target ? 0 : bk.freeFor + dt
    if (
      !bk.asked &&
      readyForBrook({
        reachedWoodshed: s.reachedWoodshed,
        reachedBrook: bk.reached,
        didSomethingAtShed: bk.didShed,
        busy: shedBusy,
        freeFor: bk.freeFor,
        fromWoodshed: dist(WOODSHED),
        eastOfWoodshed: s.guest.x - WOODSHED.x,
      })
    ) {
      bk.asked = true
      callbacks.current.onBrookReady()
    }

    // ---------------------------------------------------------- the fire (scene 7, fire.ts)
    // Once the guest has done something at the brook (or been there a while,
    // or started back), HUGO calls them back: "Looks like the fire's going."
    const fr = s.fire
    if (bk.reached) fr.atBrookFor += dt
    const brookBusy = fishing || s.tapRun >= 0 || Boolean(props.hugoAskOpen)
    fr.freeFor = brookBusy || s.target || s.keysWalking ? 0 : fr.freeFor + dt
    if (
      !fr.asked &&
      readyForFire({
        reachedBrook: bk.reached,
        busy: brookBusy,
        didSomethingAtBrook: fr.didBrook,
        freeFor: fr.freeFor,
        atBrookFor: fr.atBrookFor,
        backFromStairs: backFromStairs(s.guest),
      })
    ) {
      fr.asked = true
      callbacks.current.onFireReady?.()
    }
    // From then on night falls (it never lifts), Eduard leaves the deck to
    // light the fire and sit by it, and Rusty takes the cow over to lie there.
    const nightOn = startAtNight || Boolean(callbacks.current.fireLead)
    if (nightOn) {
      fr.night = startAtNight ? 1 : nightfall(fr.night, s.guest, dt)
      if (!fr.called) {
        fr.called = true
        // Eduard's in his chair with the fire going, a marshmallow over it;
        // the camera cuts there for a few seconds so the guest sees what
        // HUGO means (Eduard: "the camera doesn't actually show the fire").
        seatAtFire(s.ed)
        callToBed(dog, RUSTY_FIRE_BED)
        fr.cut = 0
        setCutting(true)
        callbacks.current.onFireCut?.(true)
      }
      if (!fr.reached && fr.night > 0.5 && !inside && dist(FIRE) < FIRE_REACHED) {
        fr.reached = true
        callbacks.current.onReachFire?.()
      }
    }
    // (it's burning already when the camera cuts to it)
    fr.lit =
      fr.cut >= 0 && fr.cut < 0.2 ? 1 : fr.lit + ((s.ed.lit ? 1 : 0) - fr.lit) * damp(dt, 1.3)
    if (fr.cut >= 0) {
      fr.cut += dt
      // (any key gets on with it)
      if (fr.cut > FIRE_CUT_SECONDS || (fr.cut > 0.6 && (k.moving() || skipCut))) {
        fr.cut = -1
        fr.cutOver = true
        setCutting(false)
        callbacks.current.onFireCut?.(false)
      }
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
    // (lying, the back legs fold forward along his sides, flat on the ground:
    // at -1.25 they went 7 cm into it)
    const frontLeg = -1.45 * lie * (1 - rollK) - 1.0 * rollK + 0.5 * sit
    const backLeg = -1.5 * lie * (1 - rollK) - 0.45 * rollK - 0.95 * sit
    // the leg on the guest's side kicks (it's the one nearest the hand)
    const kickL = dog.rollSide > 0 ? kick : 0
    const kickR = dog.rollSide > 0 ? 0 : kick
    rx(r.fl, gait + frontLeg + paddle)
    rx(r.fr, -gait + frontLeg - paddle)
    rx(r.bl, -gait + backLeg + kickL)
    rx(r.br, gait + backLeg + kickR)
    // splay the legs outwards on his back (+z swings a leg towards his left);
    // only once he's most of the way over, or the legs underneath swung out
    // through the ground as he rolled
    // (and half-way over, the legs on the side he's rolling across tuck in
    // under him, or they went 9 cm into the ground as he rolled back)
    const splay = rollK * rollK
    const tuck = Math.sin(Math.PI * rollK) * 0.7
    const tuckL = dog.rollSide < 0 ? -tuck : 0
    const tuckR = dog.rollSide > 0 ? tuck : 0
    rz(r.fl, 0.35 * splay + tuckL)
    rz(r.fr, -0.35 * splay + tuckR)
    rz(r.bl, 0.55 * splay + tuckL)
    rz(r.br, -0.55 * splay + tuckR)
    const wag = 9 + dog.excitement * 9 + rollK * 6
    r.tail.obj.rotation.y = r.tail.base.y + Math.sin(t * wag) * 0.6 * dog.excitement
    r.head.obj.rotation.x =
      r.head.base.x +
      dog.headDown * 0.75 +
      (pose.moving
        ? Math.sin(dog.gait * 2) * 0.05 * pose.stride
        : Math.sin(t * 1.6) * 0.05 - 0.04) +
      0.3 * rollK
    // On his back his head rolls back the other way, onto its side, and lolls
    // from side to side while he squirms (upside down with the rest of him,
    // the top of his head went 8 cm into the ground).
    r.head.obj.rotation.z =
      r.head.base.z + (-dog.rollSide * 1.0 + Math.sin(t * 2.6 + 1) * 0.2) * rollK
    // Rolling onto his back turns him about his body, not his feet: shift the
    // model so the middle of his body stays put (it sits 0.42 up in the model).
    const squirm = Math.sin(t * 5.2) * 0.14 * rollK
    const roll = dog.rollSide * 2.5 * rollK + squirm
    const bodyY = 0.42 - 0.24 * lie + 0.1 * rollK - 0.06 * sit
    const sideways = 0.42 * Math.sin(roll)
    // (dipping his front to pick the cow up or drop it turns him about his
    // middle: lift him by as much, or his front paws went 4 cm into the ground)
    const dip = dog.headDown * 0.12 * (1 - rollK)
    G.rusty.position.set(
      dog.pos.x + Math.cos(dog.yaw) * sideways,
      Math.abs(Math.sin(dog.gait)) * 0.06 * pose.stride +
        bodyY -
        0.42 * Math.cos(roll) +
        Math.abs(Math.sin(dip)) * 0.26,
      dog.pos.z - Math.sin(dog.yaw) * sideways,
    )
    // lean into turns a little, dip the front when lowering the head, sit back
    // on his haunches, and wriggle a little on his back
    G.rusty.rotation.set(dip - 0.5 * sit, dog.yaw + Math.sin(t * 2.6) * 0.12 * rollK, roll, 'YZX')

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
      fishing ||
      s.tapRun >= 0 ||
      bx.want >= 0 ||
      dr.state === 'reaching' ||
      dr.state === 'opening' ||
      routeUsesDoor ||
      s.pendingUse !== null
    if (s.sit.at === 'fire' && (s.sit.phase === 'sitting' || s.sit.phase === 'seated')) {
      // by the fire: the things to ask Eduard are up on the screen (fire-talk.tsx);
      // "Get up" there, walking off, or Esc gets them up
    } else if (s.sit.phase === 'sitting' || s.sit.phase === 'seated') {
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
      // (the door is one more thing to use: standing at it, "Go out" wins
      // over something to look at further off across the room)
      if (dist(DOOR.inside) < 1.4 && dist(DOOR.inside) < best) {
        next = 'door-out'
        at = DOOR.prompt
      }
    } else if (s.tagAsked && canSeeTag(dog, s.guest)) {
      next = 'tag'
      at = overRusty
    } else if (dist(CAST_SPOT) < 1.25) {
      // on the landing by the fishing hole: cast a line (A50)
      next = 'fish'
      at = { x: FISHING_HOLE.x, y: 0.25, z: FISHING_HOLE.z }
    } else if (dist(TAP_SPOT) < 0.9) {
      // at the tap at the top of the stairs (A21)
      next = 'tap'
      at = { x: TAP.x, y: 1.05, z: TAP.z }
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
    } else if (nightOn && dist(FIRE_SEATS.guest) < 1.7) {
      // the camp chair by the fire (scene 7): sit down with Eduard
      next = 'sit-fire'
      at = { x: FIRE_SEATS.guest.x, y: 1.15, z: FIRE_SEATS.guest.z }
    } else if (dist(YAHTZEE) < 1.5) {
      // Camp Yahtzee, out on the picnic table (A51)
      next = 'yahtzee'
      at = { x: YAHTZEE.x, y: YAHTZEE.y + 0.4, z: YAHTZEE.z }
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
    const found = callbacks.current.found
    for (const id of Object.keys(READABLES) as ReadableId[]) {
      const on = inside && !busy ? nearness(dist(READABLES[id]), 2.2, 4.5) : 0
      glow(p3.readables[id], on * pulse * promptOn(id))
    }
    // The résumé is what the visit is for (Eduard: "its the whole point of the
    // website"): until it's been read it glows from anywhere in the cabin
    // and a little arrow bobs over it.
    const resumeWaiting = !found.resume && (inside || s.cut > 0.3)
    if (resumeWaiting && inside && !busy) glow(p3.readables.resume, Math.max(0.55, pulse))
    if (resumeArrow.current) {
      resumeArrow.current.visible = resumeWaiting && s.prompt !== 'resume'
      resumeArrow.current.position.y =
        READABLES.resume.y + 0.42 + Math.abs(Math.sin(t * 3.2)) * 0.12
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
    const tapGlow = !inside && !busy ? nearness(dist(TAP_SPOT), 0.9, 4.5) : 0
    glow(p3.tap, tapGlow * pulse * promptOn('tap'))
    const rodGlow = !inside && !busy && !rodHeld ? nearness(dist(CAST_SPOT), 1.25, 6) : 0
    glow(p3.rod, rodGlow * pulse * promptOn('fish'))
    // (while HUGO points them out, the boxes glow from wherever the guest is)
    const pointing = props.hugoPointsAt === 'bench' && !inside && bx.want < 0
    const benchGlow = pointing
      ? 1
      : !inside && bx.want < 0 && !busy
        ? nearness(dist(WORKBENCH), 1.8, 5)
        : 0
    p3.crates.forEach((cr, i) => glow(cr.root, bx.open === i ? 0 : benchGlow * pulse * 0.85))
    const yahtzeeGlow = !inside && !busy ? nearness(dist(YAHTZEE), 1.5, 4.5) : 0
    glow(p3.yahtzee, yahtzeeGlow * pulse * promptOn('yahtzee'))
    glow(G.cow, s.prompt === 'throw' ? pulse : 0)
    const rustyOn = s.prompt === 'pet' || s.prompt === 'rub' || s.prompt === 'tag'
    glow(
      G.rusty,
      rustyOn && dog.rubbing <= 0 && dog.petting <= 0 && s.tagShow <= 0 ? pulse * 0.8 : 0,
    )
    EGGS.forEach(({ id, at }, i) => {
      const sprite = sparkles.current[i]
      if (!sprite) return
      const show = !found[id] && (id === 'yahtzee' ? !inside : inside || s.cut > 0.3)
      sprite.visible = show
      if (!show) return
      const tw = 0.5 + 0.5 * Math.sin(t * 5.2 + i * 2.1)
      const sz = 0.11 + 0.09 * tw
      sprite.scale.set(sz, sz, 1)
      sprite.material.opacity = 0.55 + 0.45 * tw
      sprite.material.rotation = Math.floor(t * 3 + i) % 2 ? Math.PI / 4 : 0
      sprite.position.y = at.y + 0.18 + Math.sin(t * 1.7 + i) * 0.03
    })

    // ---------------------------------------------------------- Eduard (eduard.ts)
    const ed = s.ed
    updateEduard(ed, dt, {
      watching: s.sit.phase === 'seated' && s.sit.at === 'bench',
      guest: s.guest,
      dog: dog.pos,
      hugo: { x: s.hugo.x, z: s.hugo.z },
      greeting: eduardGreeting,
      talking: Boolean(props.eduardTalking) || (ed.fire && eduardGreeting === 'guest'),
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
    follow(e.hammer, 'x', ep.wrist, ep.snap)
    // the wave
    e.armL.obj.rotation.y =
      eduardGreeting === 'guest'
        ? Math.sin(t * 9) * 0.35
        : e.armL.obj.rotation.y * (1 - damp(dt, 6))
    follow(e.head, 'x', ep.head, 6)
    follow(e.head, 'y', ep.headTurn, 8)
    // He bends at the hips: the legs swing back against the lean, so his
    // knees and boots stay down (the whole of him used to tip over stiff
    // about his feet, lifting his boots off the boards).
    s.edLean += (ep.lean - s.edLean) * damp(dt, 6)
    follow(e.legL, 'x', ep.thighL - s.edLean, 12)
    follow(e.legR, 'x', ep.thighR - s.edLean, 12)
    follow(e.shinL, 'x', ep.shinL, 12)
    follow(e.shinR, 'x', ep.shinR, 12)
    e.board.obj.visible = ed.carrying
    // (he's put the hammer down for the night, and has a marshmallow on a stick instead)
    e.hammer.obj.visible = !ed.fire
    const fist = e.hammer.obj
    if (toastStick.group.parent !== fist.parent && fist.parent) {
      fist.parent.add(toastStick.group)
      toastStick.group.position.copy(fist.position)
    }
    toastStick.group.visible = ed.fire
    if (ed.fire) {
      const m = marshmallow(ed)
      toastStick.update(m)
      // out over the flames, tipped down a little, turning; up on end in
      // front of his face when it's done (whatever the arm's doing)
      const pitch = 0.22 - 1.5 * m.out
      toastStick.group.rotation.set(pitch - e.armR.obj.rotation.x, 0, m.out > 0.1 ? 0 : t * 1.4)
    }
    e.torso.obj.rotation.x = e.torso.base.x + Math.sin(t * 1.4) * 0.015
    s.edY += (ep.y - s.edY) * damp(dt, 10)
    // lean in his own frame (turn first, then pitch), about his hips
    const hipBackEd = HIP_Y * Math.sin(s.edLean)
    G.eduard.position.set(
      ed.pos.x - Math.sin(ed.yaw) * hipBackEd,
      s.edY + HIP_Y * (1 - Math.cos(s.edLean)),
      ed.pos.z - Math.cos(ed.yaw) * hipBackEd,
    )
    G.eduard.rotation.set(s.edLean, ed.yaw, 0, 'YXZ')
    // Laying a board: it goes from under his arm down into its row, turning
    // to lie along it, and becomes the deck's own board there (it used to
    // vanish from his side and appear in its row, up to a metre away).
    const board = e.board.obj
    const home = (board.userData.home ??= {
      p: board.position.clone(),
      q: board.quaternion.clone(),
      s: board.scale.clone(),
    }) as { p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3 }
    const lay = layAmount(ed)
    if (lay > 0 && board.parent) {
      const row = DECK_BOARDS[Math.min(ed.placed, DECK_BOARDS.length - 1)]
      G.eduard.updateMatrixWorld(true)
      const to = board.parent.worldToLocal(tmpC.set(row.x, DECK_BOARD_Y, row.z))
      board.position.lerpVectors(home.p, to, lay)
      // (lying along the row, whichever way he's turned or leaning)
      board.quaternion.slerpQuaternions(home.q, board.parent.getWorldQuaternion(tmpQ).invert(), lay)
      // (and the size of the deck's boards: a little wider, thicker and shorter)
      board.scale.set(
        home.s.x * (1 + 0.36 * lay),
        home.s.y * (1 + 0.3 * lay),
        home.s.z * (1 - 0.15 * lay),
      )
    } else {
      board.position.copy(home.p)
      board.quaternion.copy(home.q)
      board.scale.copy(home.s)
    }
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
    const turned = s.viewSpot >= 0 && !s.spotLetGo ? CAMERA_SPOTS[s.viewSpot].from : null
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
    // (He used to wait at the next point of the way, which could be a long
    // way off and out of sight: Eduard, "its hard to get it". Now he keeps
    // just ahead of the guest, towards it, wherever they are.)
    const ahead = (wp: Vec2): Vec2 => {
      const dx = wp.x - s.guest.x
      const dz = wp.z - s.guest.z
      const d = Math.hypot(dx, dz)
      return d <= LEAD_AHEAD
        ? wp
        : { x: s.guest.x + (dx / d) * LEAD_AHEAD, z: s.guest.z + (dz / d) * LEAD_AHEAD }
    }
    const leadShed = !leading
      ? null
      : inside
        ? // (back inside during the walk: he waits on the deck, north of Eduard)
          { x: DOOR.out.x + 0.2, z: DOOR.out.z - 0.4 }
        : ahead(LEAD_PATH[s.leadIndex])
    // ... and on from the woodshed to the brook, the same way (A48)
    const leadingBrook = !leading && callbacks.current.brookLead && !s.brook.reached
    if (leadingBrook && !inside) s.brook.leadIndex = brookLeadIndex(s.brook.leadIndex, s.guest)
    // ... and back from the brook to the fire as night falls (A50)
    const leadingFire = nightOn && !fr.reached && !startAtNight && !inside
    if (leadingFire) fr.leadIndex = fireLeadIndex(fr.leadIndex, s.guest)
    // At the fire he floats over the third chair, while the guest is there.
    const hugoAtFire = nightOn && !leadingFire && stopNow === 'fire'
    const leadTo =
      leadShed ??
      (leadingFire
        ? ahead(FIRE_LEAD_PATH[fr.leadIndex])
        : !leadingBrook
          ? null
          : inside
            ? { x: DOOR.out.x + 0.2, z: DOOR.out.z - 0.4 }
            : ahead(BROOK_LEAD_PATH[s.brook.leadIndex]))
    // Beside the guest, on whichever side is clear of walls, things and Eduard.
    const hugoSpot = (): Vec2 => {
      if (hugoAtFire) return HUGO_FIRE_SPOT
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
    // Pointing the workbench out (Eduard: "make HUGO point out the workbench
    // where they can see my past projects"): he floats over above the boxes
    // and looks down at them while he says so.
    const benchPoint =
      pointing && !vacGoal
        ? {
            x: BOXES_CENTRE.x + BENCH_FRONT.x * 0.55,
            z: BOXES_CENTRE.z + BENCH_FRONT.z * 0.55,
          }
        : null
    // ... and the résumé on the table in the cabin, the same way (Eduard:
    // "let's make my resume easier to find, its the whole point of the website")
    const resumePoint =
      props.hugoPointsAt === 'resume' && inside
        ? { x: READABLES.resume.x + 0.42, z: READABLES.resume.z + 0.3 }
        : null
    const pointAt = benchPoint ? BOXES_CENTRE : resumePoint ? READABLES.resume : null
    const hugoAt = vacGoal ?? benchPoint ?? resumePoint ?? leadTo ?? hugoSpot()
    const hugoGoal = vacGoal
      ? tmp.set(vacGoal.x, vacGoal.y, vacGoal.z)
      : tmp.set(
          hugoAt.x,
          (benchPoint
            ? 1.85
            : resumePoint
              ? 1.72
              : leadTo
                ? 1.1
                : hugoAtFire
                  ? HUGO_FIRE_SPOT.y
                  : s.guestY + 0.8) +
            Math.sin(t * 2.1) * 0.07,
          hugoAt.z,
        )
    // He glides everywhere: picks up speed, then eases in over the spot. (He
    // used to jump most of the way to wherever he was going in one frame or
    // two: Eduard, "looks like he is just teleporting from place to place".)
    // And when he really is left a long way behind (the guest walked off
    // while he was tidying the wood or pointing something out), he teleports
    // to them, properly: he spins up into a streak of light and a ring where
    // he was, and pops out of another beside the guest.
    const tp = s.tp
    tp.rest = Math.max(0, tp.rest - dt)
    {
      const to = tmp2.copy(hugoGoal).sub(s.hugo)
      const dist = to.length()
      const busyElsewhere = Boolean(vacGoal) || pointAt !== null
      if (tp.phase === 'none' && !busyElsewhere && tp.rest <= 0 && dist > TELEPORT_FROM) {
        tp.phase = 'out'
        tp.t = 0
        tp.from.copy(s.hugo)
      }
      if (tp.phase === 'out') {
        tp.t += dt
        if (tp.t >= TELEPORT_OUT) {
          // (gone: now he's beside the guest)
          s.hugo.copy(hugoGoal)
          s.hugoSpeed = 0
          tp.phase = 'in'
          tp.t = 0
        }
      } else if (tp.phase === 'in') {
        tp.t += dt
        s.hugo.lerp(hugoGoal, damp(dt, 8))
        if (tp.t >= TELEPORT_IN) {
          tp.phase = 'none'
          tp.rest = 5
          callbacks.current.onHugoCatchUp?.()
        }
      } else {
        const top = vacGoal ? HUGO_GLIDE : HUGO_FLOAT
        const wanted = Math.min(top, dist * 3.4)
        s.hugoSpeed += Math.max(-14 * dt, Math.min((vacGoal ? 5 : 9) * dt, wanted - s.hugoSpeed))
        if (dist > 1e-4) s.hugo.addScaledVector(to, Math.min(1, (s.hugoSpeed * dt) / dist))
      }
    }
    // never inside Eduard, even on the way past him
    const fromEd = Math.hypot(s.hugo.x - ed.pos.x, s.hugo.z - ed.pos.z)
    if (fromEd < HUGO_FROM_EDUARD) {
      const k = HUGO_FROM_EDUARD / Math.max(fromEd, 1e-3)
      s.hugo.x = ed.pos.x + (s.hugo.x - ed.pos.x) * k
      s.hugo.z = ed.pos.z + (s.hugo.z - ed.pos.z) * k
    }
    G.hugo.position.copy(s.hugo)
    // Swallowing a piece (or swelling to blow one out): a squash, a stretch
    // and a little hop. Pulling at one, he's drawn down a touch.
    const gulped = 1 - vac.gulp
    const squash = vac.gulp > 0 ? Math.sin(gulped * Math.PI * 2) * vac.gulp * 0.2 : 0
    // Teleporting: he draws up into a thin streak and is gone; then out of a
    // streak again, with a little bounce.
    const tpOut = tp.phase === 'out' ? easeInCubic(clamp01(tp.t / TELEPORT_OUT)) : 0
    const tpIn = tp.phase === 'in' ? 1 - easeOutBack(clamp01(tp.t / TELEPORT_IN)) : 0
    const thin = Math.max(0.02, 1 - tpOut - tpIn)
    const tall = 1 + (tpOut + Math.max(0, tpIn)) * 1.4
    G.hugo.scale.set((1 + squash * 0.7) * thin, (1 - squash) * tall, (1 + squash * 0.7) * thin)
    tpFx.update(
      tp.phase,
      tp.phase === 'out' ? tp.t / TELEPORT_OUT : tp.t / TELEPORT_IN,
      tp.from,
      s.hugo,
    )
    G.hugo.position.y +=
      (vac.gulp > 0 ? Math.sin(gulped * Math.PI) * 0.05 : 0) -
      0.03 * vac.suction * (vac.chunk?.suck ?? 0)
    const talking = bubble?.speaker === 'HUGO' || Boolean(props.hugoTalking)
    const hosing = vac.phase === 'suck' || vac.phase === 'drop'
    const lookTarget = talking
      ? { x: camera.position.x, z: camera.position.z }
      : vacGoal && vac.phase === 'drop' && vac.reach
        ? { x: vac.reach.x, z: vac.reach.z }
        : vacGoal && Math.hypot(vacGoal.x - s.hugo.x, vacGoal.z - s.hugo.z) > 0.25
          ? { x: vacGoal.x, z: vacGoal.z }
          : vacGoal
            ? // (over a piece: he stays as he is)
              { x: s.hugo.x + Math.sin(s.hugoYaw), z: s.hugo.z + Math.cos(s.hugoYaw) }
            : hugoAtFire && props.eduardTalking
              ? // (he listens too)
                { x: ed.pos.x, z: ed.pos.z }
              : leading || leadingBrook || leadingFire
                ? { x: s.guest.x, z: s.guest.z }
                : walking
                  ? {
                      x: s.guest.x + Math.sin(s.guestYaw) * 4,
                      z: s.guest.z + Math.cos(s.guestYaw) * 4,
                    }
                  : { x: s.guest.x, z: s.guest.z }
    s.hugoYaw = turnTowards(
      s.hugoYaw,
      // (pointing the boxes out, he faces them)
      facing({ x: s.hugo.x, z: s.hugo.z }, pointAt ?? lookTarget),
      4 * dt,
    )
    // He leans the way he's gliding; and when the last piece is stacked, a
    // quick spin on the spot.
    const glide = vacGoal ? Math.min(1, s.hugoSpeed / HUGO_GLIDE) : 0
    s.hugoLean += (glide * 0.3 - s.hugoLean) * damp(dt, 5)
    const spin =
      (vac.proud > 0 ? easeInOut(clamp01((1.4 - vac.proud) / 0.8)) * Math.PI * 2 : 0) +
      // (teleporting: a fast spin as he goes and as he comes)
      (tpOut + Math.max(0, tpIn)) * Math.PI * 3
    G.hugo.rotation.set(s.hugoLean, s.hugoYaw + spin, 0, 'YXZ')
    const h = joints.hugo
    h.head.obj.rotation.z = h.head.base.z + Math.sin(t * 0.8) * (talking ? 0.18 : 0.1)
    // (he looks down at the piece he's picking up)
    s.hugoNod += ((vac.phase === 'suck' || pointAt ? 0.4 : 0) - s.hugoNod) * damp(dt, 6)
    h.head.obj.rotation.x = h.head.base.x + Math.sin(t * 1.3) * 0.06 + s.hugoNod
    const lively = talking || vac.gulp > 0 || vac.proud > 0
    const wiggle = lively ? 0.32 : hosing ? 0.16 : 0.08
    const speed = lively ? 13 : hosing ? 6 : 2
    h.antL.obj.rotation.x = h.antL.base.x + Math.sin(t * speed) * wiggle
    h.antR.obj.rotation.x = h.antR.base.x + Math.sin(t * speed + 1.7) * wiggle
    h.antL.obj.rotation.y = h.antL.base.y + (talking ? Math.sin(t * 7) * 0.12 : 0)
    h.antR.obj.rotation.y = h.antR.base.y - (talking ? Math.sin(t * 7) * 0.12 : 0)

    // ---------------------------------------------------------- bubble anchors
    hugoAnchor.current?.position.set(s.hugo.x, s.hugo.y + 0.95, s.hugo.z)
    guestAnchor.current?.position.set(s.guest.x, G.hiker.position.y + 1.42, s.guest.z)
    eduardAnchor.current?.position.set(ed.pos.x, 1.6 + 0.13 * ed.stand + 0.05 * ed.sit, ed.pos.z)

    // ---------------------------------------------------------- camera and sun follow the guest
    // Looking down from above and behind, like a little diorama. Tall phone
    // screens show less sideways, so pull back a little. During the welcome the
    // camera eases in so the faces are readable.
    const far = size.height > size.width ? 1.3 : 1
    const welcoming = s.welcomed && bubble !== null && !inside
    // reading his tag, rubbing his belly or petting him: ease in on Rusty
    const withRusty = !inside && (s.tagShow > 0 || dog.rubbing > 0 || dog.petting > 0)
    // the opening: a little closer while Rusty runs down the driveway to the guest
    const rustyRunning = !startNearCabin && !resumeAt && !dog.firstDropDone
    // standing at the workbench (the camera looks at its front, below), or looking in a box
    const byBench = s.prompt === 'workbench' && !s.target
    const atBox = bx.open >= 0 && bx.phase !== 'walking'
    const chopping = splitting && sp.phase !== 'walking'
    const castingCam = fishing && fi.phase !== 'walking'
    // by the woodshed or the shower, the camera turns round to show it (CAMERA_SPOTS)
    // (splitting and the boxes have their own cameras; the woodshed spot is right beside both)
    // sitting on the bench: from behind the guest, over their shoulder to the deck
    const sittingNow = s.sit.phase === 'sitting' || s.sit.phase === 'seated'
    const watchingDeck = sittingNow && s.sit.at === 'bench'
    // sitting by the fire: from the south-east (clear of the woodshed), over
    // the guest's shoulder and across the flames to Eduard, with the cabin's
    // lights behind him (photo 02)
    const byFire = sittingNow && s.sit.at === 'fire'
    // HUGO's call back to the fire: a cut to it for a few seconds
    const fireCut = fr.cut >= 0
    const ownCamera = inside || chopping || atBox || watchingDeck || castingCam || byFire || fireCut
    // The woodshed's and the shower's views and the bench's hold the camera
    // until the visitor turns it there, or walks off from the bench; then it's
    // theirs until the guest walks out of range (camera-framing.ts).
    const held = holdCamera(s, s.guest, { own: ownCamera, atBench: byBench, atBox: bx.want >= 0 })
    const atBench = held.bench
    const spot = held.spot >= 0 ? CAMERA_SPOTS[held.spot] : null
    // the moments with a camera of their own take over (and the visitor's
    // turn starts afresh after them); a turn takes the set views over
    s.setMoment = ownCamera
    s.framed = atBench || spot !== null
    if (s.setMoment || s.framed) {
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
          : chopping || castingCam
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
    // At the brook the camera comes down lower and round to the south-west,
    // looking up it past the landing (brook.ts, brookView); the visitor's
    // turn and zoom still apply on top.
    const bv = brookView(s.guest, far > 1)
    s.brookK += (bv.k - s.brookK) * damp(dt, 1.4)
    const bvk = s.brookK
    offX += (bv.off.x - offX) * bvk
    offY += (bv.off.y - offY) * bvk
    offZ += (bv.off.z - offZ) * bvk
    // (where it looks, ahead of the guest: north usually, over the water at the brook)
    const aheadX = bv.ahead.x * bvk
    const aheadZ = -5 + (bv.ahead.z + 5) * bvk
    // (just taken over from a set view: the everyday camera carries on facing
    // the way that view faced, and the visitor's turn goes on from there)
    if (s.camTake) {
      s.camTake = false
      if (!s.setMoment)
        s.camYaw += yawFacing(camera.position, lookAt.current, {
          x: aheadX - offX,
          z: aheadZ - offZ,
        })
    }
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
    // visitor has turned it; the everyday view is as it was.) The clearing
    // is the forest's own edge less the reach of its crowns (forest-edge.ts):
    // the walkable area's edge, which this used, runs under the spruces
    // north of the grass field.
    let edgeK = 1
    if (Math.abs(s.camYaw) > 0.01) {
      edgeK = cameraReach(s.guest, { x: camOff.x * kz, z: camOff.z * kz })
      camOff.x *= edgeK
      camOff.z *= edgeK
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
          : welcoming && dist(ed.pos) < 9
            ? // (only near him: with HUGO talking out at the brook this aimed
              // the camera half-way back to the deck, and the guest was off the screen)
              { x: s.guest.x * 0.55 + ed.pos.x * 0.45, z: s.guest.z * 0.55 + ed.pos.z * 0.45 }
            : {
                x: s.guest.x + (aheadX * yc + aheadZ * ys) * kz * edgeK,
                z: s.guest.z + (-aheadX * ys + aheadZ * yc) * kz * edgeK,
              }
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
    // casting: from the south-west of the landing, low, so the cast reads side-on
    const castFar = far > 1 ? 1.4 : 1
    // (The card with Eduard's answers takes the right third of a computer
    // screen, and the bottom half of a phone's: the camera stands far enough
    // back that the cabin's lights, Eduard, the fire, the guest and HUGO all
    // fit in what's left, and aims off to the side so they sit there.)
    const fireFar = far > 1 ? 1.2 : Math.min(1.3, Math.max(1, 1.6 / (size.width / size.height)))
    const camGoal = castingCam
      ? tmp.set(CAST_SPOT.x - 1.9 * castFar, 2.9 * castFar, CAST_SPOT.z + 5.4 * castFar)
      : byFire
        ? tmp.set(FIRE.x + 6.2 * fireFar, 0.9 + 3.4 * fireFar, FIRE.z + 8.0 * fireFar)
        : watchingDeck
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
                  tmp.set(
                    s.guest.x + spot.from.x * 7 * kz,
                    6 * kz,
                    s.guest.z + spot.from.z * 7 * kz,
                  )
                : inside
                  ? // Inside, the camera looks in through the missing south wall
                    // from the room's middle, leaning to the side away from the
                    // guest: standing by the west wall (the rod, the tackle box)
                    // it looks at that wall's inside from the east, and the other
                    // way round by the counter and the door. (It used to sit west
                    // of the guest, so the west wall hid whatever was on it.)
                    tmp.set(-s.guest.x * 0.45, offY * kz, s.guest.z + camOff.z * kz)
                  : tmp.set(chopBase.x + camOff.x * kz, offY * kz, chopBase.z + camOff.z * kz)
    // A spot's camera is kept over the clearing too, like a turned one,
    // whichever way it looks from and however far out a phone's screen puts
    // it. (The shower's used to stand among the spruces north of the grass
    // field, the screen all branches, and the guest couldn't be seen to walk
    // away.) It comes in towards the guest and looks down more steeply.
    if (spot && !atBench) {
      const k = cameraReach(s.guest, { x: camGoal.x - s.guest.x, z: camGoal.z - s.guest.z })
      camGoal.x = s.guest.x + (camGoal.x - s.guest.x) * k
      camGoal.z = s.guest.z + (camGoal.z - s.guest.z) * k
    }
    // (coming back from the cut to the fire, the camera is put straight back
    // where it belongs: it doesn't fly across the field)
    const snapBack = fr.cutOver
    fr.cutOver = false
    camera.position.lerp(camGoal, snapBack ? 1 : damp(dt, 2.2))
    lookAt.current.lerp(
      castingCam
        ? tmp.set(
            CAST_SPOT.x * 0.45 + FISHING_HOLE.x * 0.55,
            -0.15,
            CAST_SPOT.z * 0.45 + FISHING_HOLE.z * 0.55,
          )
        : byFire
          ? far > 1
            ? // (a portrait phone: the things to ask cover the bottom of the screen
              // while they're up, so aim low and the fire sits above them)
              tmp.set(FIRE.x - 0.45, props.fireChoosing ? -1.5 : 0.2, FIRE.z - 1.0)
            : // (room over their heads for what they say, and under the fire for the things to ask)
              // (while the things to ask are up, along the bottom, the view
              // lifts so the fire sits above them)
              tmp.set(FIRE.x - 0.6, props.fireChoosing ? -0.75 : 1.15, FIRE.z - 0.9)
          : watchingDeck
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
      snapBack ? 1 : damp(dt, 3),
    )
    if (fireCut) {
      // The cut to the fire: low, from the south-east, drifting in on Eduard
      // in his chair with the marshmallow over the flames. It starts there
      // (a cut, not a flight from the brook) and eases in from then on.
      const k = easeInOut(clamp01(fr.cut / FIRE_CUT_SECONDS))
      const wide = far > 1 ? 1.5 : 1
      tmp.set(
        FIRE.x + (3.3 - 1.0 * k) * wide,
        (1.75 - 0.4 * k) * wide,
        FIRE.z + (3.6 - 0.9 * k) * wide,
      )
      if (fr.cut < 0.05) camera.position.copy(tmp)
      else camera.position.lerp(tmp, damp(dt, 6))
      lookAt.current.set(FIRE.x - 0.85, 0.72, FIRE.z - 0.2)
    }
    // HUGO's card covers the bottom half of a portrait phone: look lower, so
    // the guest and HUGO come up into the part of the screen that's left
    s.askLift += ((props.hugoAskOpen && far > 1 ? 1 : 0) - s.askLift) * damp(dt, 4)
    if (s.askLift > 0.001) {
      const reach = camera.position.distanceTo(lookAt.current)
      const halfFov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2)
      tmp.copy(lookAt.current)
      tmp.y -= reach * Math.tan(halfFov) * 0.95 * easeInOut(s.askLift)
      camera.lookAt(tmp)
    } else camera.lookAt(lookAt.current)
    // ---------------------------------------------------------- the light (A39, daylight.ts)
    // A summer afternoon on arrival, golden by the woodshed, sunset at the
    // brook (the sun sinks in the west), following where the guest is.
    // (window.__cabinEvening pins it, for comparing the light in a test browser; dev only)
    const devEvening =
      process.env.NODE_ENV !== 'production'
        ? (window as Window & { __cabinEvening?: number }).__cabinEvening
        : undefined
    // Once HUGO has called the guest back, it's sunset turning to night
    // wherever they are, and it stays night (fire.ts, nightfall).
    const eveningNow = nightOn ? EVENING_SUNSET + fr.night : eveningAt(s.guest)
    s.evening += ((devEvening ?? eveningNow) - s.evening) * damp(dt, 1.2)
    if (sun.current && hemi.current && scene.background instanceof THREE.Color)
      applyDaylight(
        {
          sun: sun.current,
          hemi: hemi.current,
          background: scene.background,
          fog: scene.fog instanceof THREE.Fog ? scene.fog : null,
          glint: waterUniforms.uGlint.value,
          sheen: waterUniforms.uSheen.value,
          waterSky: waterUniforms.uSky.value,
          waterOverhead: waterUniforms.uOverhead.value,
          waterLeaves: waterUniforms.uLeaves.value,
        },
        s.evening,
        s.guest,
      )
    waterUniforms.uTime.value = t
    // the fire, the lamps and the stars
    nightFx.update({ t, dt, night: nightAmount(s.evening), lit: fr.lit, camera: camera.position })
    // the rod, the line and the catch, where the guest's hands are now
    G.hiker.updateMatrixWorld(true)
    const holdX = s.guest.x + Math.sin(s.guestYaw) * 0.45
    const holdZ = s.guest.z + Math.cos(s.guestYaw) * 0.45
    updateFishingGear(gear, fi, dt, t, {
      x: holdX,
      y: s.guestY + 0.98,
      z: holdZ,
      // side-on to the camera
      yaw: Math.atan2(holdX - camera.position.x, holdZ - camera.position.z) + Math.PI / 2,
    })
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
      <hemisphereLight ref={hemi} args={['#b9cdf5', '#7c8f55', 1.55]} />
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
        {/* tap HUGO to ask him something (A48): an invisible ball just round
            his head and body (no bigger: he often floats in front of the door
            or a thing, and a click beside him should reach it) */}
        <mesh
          position={[0, 0.4, 0]}
          onPointerDown={onHugoDown}
          userData={{ noOutline: true, noGlow: true }}
        >
          <sphereGeometry args={[0.3, 8, 6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>
      <primitive object={vacParts.hose} />
      <primitive object={vacParts.extras} />
      <primitive object={vacParts.stack} />
      <primitive object={gear.world} />
      <primitive object={tapStream} />
      <primitive object={nightFx.world} />
      <primitive object={tpFx.group} />
      <sprite
        ref={resumeArrow}
        position={[READABLES.resume.x, READABLES.resume.y + 0.45, READABLES.resume.z]}
        scale={[0.2, 0.18, 1]}
        visible={false}
        userData={{ noOutline: true }}
      >
        <spriteMaterial map={arrowTexture} transparent depthWrite={false} />
      </sprite>
      <primitive object={nightFx.sky} />
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
      {/* the brook: the tap, and the rod on the rail (casts at the hole) */}
      {tapArea(
        'tap',
        { x: TAP.x + 0.1, y: 0.45, z: TAP.z },
        0.3,
        onThingDown('tap', TAP_SPOT, TAP_SPOT, 0.5),
      )}
      {tapArea('rod', ROD_PROP, 0.3, onThingDown('fish', CAST_SPOT, CAST_SPOT, 0.5))}
      {/* the fire (scene 7): the guest's camp chair, Eduard in his, and the Yahtzee set on the table */}
      {tapArea(
        'fire-seat',
        { x: FIRE_SEATS.guest.x, y: 0.5, z: FIRE_SEATS.guest.z },
        0.42,
        onFireSeatDown,
      )}
      {tapArea(
        'fire-eduard',
        { x: FIRE_SEATS.eduard.x, y: 0.75, z: FIRE_SEATS.eduard.z },
        0.5,
        onFireSeatDown,
      )}
      {tapArea(
        'yahtzee',
        { x: YAHTZEE.x, y: YAHTZEE.y, z: YAHTZEE.z },
        0.3,
        onThingDown('yahtzee', YAHTZEE_SPOT, YAHTZEE, 1.5),
      )}
      {CRATES.map((cr, i) =>
        tapArea(`crate-${i}`, { x: cr.x, y: cr.y + 0.08, z: cr.z }, 0.17, onCrateDown(i)),
      )}

      {/* the fairy trail to the next place on the tour (trail.ts, fairy-trail.tsx) */}
      <FairyTrail sim={sim} scene={callbacks} look={look} />
      {/* the sparkles over the easter eggs */}
      {EGGS.map(({ id, at }, i) => (
        <sprite
          key={id}
          ref={(el) => {
            sparkles.current[i] = el
          }}
          position={[at.x, at.y + 0.2, at.z]}
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
            {/* (the tag is drawn up and to the left of its anchor, and the box
            it's drawn from took every press where the tag isn't: on a phone, a
            dead patch of the bench where a drag didn't turn and a tap did nothing) */}
            <Html zIndexRange={[28, 0]} style={{ pointerEvents: 'none' }}>
              <button
                type="button"
                className={`${styles.boxTag} ${styles.pixel} ${props.wantBox === i ? styles.boxTagOpen : ''}`}
                // (pointer down, like the prompt, so the tap doesn't also walk
                // the guest; the box opens as the pointer comes up, like every
                // tap (A109), so on a phone, where the tags cover the bench, a
                // drag that starts on one turns the camera instead)
                onPointerDown={(e) => {
                  e.stopPropagation()
                  if (e.button !== 0) return
                  if (!pressDown.current) return callbacks.current.onOpenBox(i)
                  pressDown.current(e.nativeEvent)
                  tap.current = () => callbacks.current.onOpenBox(i)
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
        {prompt && !cutting && (
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
        {/* his answer to a question from his card wins over a line of the tour */}
        {cutting ? null : props.hugoSaying ? (
          <Html zIndexRange={[45, 30]} style={{ pointerEvents: 'none' }}>
            <SpeechBubble
              key={props.hugoSaying.key}
              speaker="HUGO"
              text={props.hugoSaying.text}
              status={props.hugoSaying.status}
              links={props.hugoSaying.links ?? []}
              onLink={(l) => callbacks.current.onLink?.(l) ?? false}
            />
          </Html>
        ) : (
          bubble?.speaker === 'HUGO' && (
            <Html zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
              <SpeechBubble speaker="HUGO" text={bubble.text} />
            </Html>
          )
        )}
        {/* (one prompt at a time: it gives way to the door's, the résumé's and so on) */}
        {props.hugoAskMarker && !bubble && !prompt && (
          <Html zIndexRange={[22, 0]} style={{ pointerEvents: 'none' }}>
            <HugoAskMarker input={input} onPress={() => callbacks.current.onTapHugo?.()} />
          </Html>
        )}
      </group>
      <group ref={eduardAnchor}>
        {/* by the fire his answers are said here, over his head, a paragraph at a time */}
        {props.fireSpeech?.who === 'eduard' ? (
          <Html zIndexRange={[45, 30]} style={{ pointerEvents: 'none' }}>
            <SpeechBubble
              key={props.fireSpeech.key}
              speaker="Eduard"
              text={props.fireSpeech.text}
              instant={props.fireSpeech.instant}
              stamp={props.fireSpeech.draft ? 'Draft' : undefined}
              more={props.fireSpeech.more}
              links={props.fireSpeech.links}
              onLink={(l) => callbacks.current.onLink?.(l) ?? false}
              wide
            />
          </Html>
        ) : (
          bubble?.speaker === 'Eduard' &&
          !cutting && (
            <Html zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
              <SpeechBubble speaker="Eduard" text={bubble.text} />
            </Html>
          )
        )}
      </group>
      {/* ... and what the guest asks, over theirs */}
      <group ref={guestAnchor}>
        {props.fireSpeech?.who === 'guest' && (
          <Html zIndexRange={[45, 30]} style={{ pointerEvents: 'none' }}>
            <SpeechBubble
              key={props.fireSpeech.key}
              speaker="You"
              text={props.fireSpeech.text}
              instant={props.fireSpeech.instant}
            />
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
