'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SpeechBubble, type Speaker } from './speech-bubble'
import { PixelPass, configureLook, makeGroundMaterial, toToon } from './pixel-look'
import { InteractPrompt, type PromptInput } from './interact-prompt'
import { canThrow, createRusty, startApproach, throwCow, updateRusty } from './rusty'
import {
  EDUARD_SPOT,
  GUEST_AUTO_TARGET,
  GUEST_SKIP,
  GUEST_START,
  MODELS,
  RUSTY_START,
  SKY,
  WELCOME_DISTANCE,
  WELCOME_POINT,
  clampToWalkable,
  facing,
  step,
  turnTowards,
  type Look,
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
}

Object.values(MODELS).forEach((url) => useGLTF.preload(url))

// ------------------------------------------------------------------ helpers
const noRaycast = () => {}

let groundMaterial: THREE.Material | null = null

function useModel(url: string, opts: { shadows?: boolean; raycast?: boolean } = {}) {
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
      else mesh.material = toToon(mesh.material as THREE.Material)
      if (!opts.raycast) mesh.raycast = noRaycast
    })
    return scene
  }, [gltf, opts.shadows, opts.raycast])
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
    },
    rusty: {
      fl: node(g.rusty, 'Rusty_LegFL'),
      fr: node(g.rusty, 'Rusty_LegFR'),
      bl: node(g.rusty, 'Rusty_LegBL'),
      br: node(g.rusty, 'Rusty_LegBR'),
      head: node(g.rusty, 'Rusty_Head'),
      tail: node(g.rusty, 'Rusty_Tail'),
      mouth: node(g.rusty, 'Rusty_Mouth'),
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

  const rig = useRef<Rig | null>(null)

  // Mutable simulation state (kept out of React so the frame loop stays cheap).
  const sim = useRef({
    guest: { ...(startNearCabin ? GUEST_SKIP : GUEST_START) } as Vec2,
    target: null as Vec2 | null,
    guestYaw: Math.PI,
    walkPhase: 0,
    moved: false,
    guestStuck: 0,
    idleSince: 0,
    welcomed: false,
    dog: createRusty(RUSTY_START, Math.PI * 0.85),
    /** Where the mouse points on the ground (for aiming a throw). */
    aim: null as Vec2 | null,
    throwable: false,
    eduardYaw: EDUARD_SPOT.facing,
    hugo: new THREE.Vector3(GUEST_START.x + 0.9, 1.0, GUEST_START.z - 0.2),
    zoom: 1,
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
  const cowAnchor = useRef<THREE.Group>(null)
  const [throwable, setThrowable] = useState(false)
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

  const onGroundDown = (e: ThreeEvent<PointerEvent>) => {
    // Only the main button (or a tap) walks; right-click is for throwing.
    if (e.nativeEvent.pointerType === 'mouse' && e.nativeEvent.button !== 0) return
    e.stopPropagation()
    const s = sim.current
    s.target = clampToWalkable({ x: e.point.x, z: e.point.z })
    s.marker = { ...s.target, life: 1 }
    if (!s.moved) {
      s.moved = true
      callbacks.current.onFirstMove()
    }
  }

  const onGroundMove = (e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.pointerType === 'mouse') sim.current.aim = { x: e.point.x, z: e.point.z }
  }

  // Right-click throws the cow towards where you point.
  const onGroundContextMenu = (e: ThreeEvent<MouseEvent>) => {
    e.nativeEvent.preventDefault()
    const s = sim.current
    throwCow(s.dog, s.guest, { x: e.point.x, z: e.point.z })
  }

  // Tapping the cow (or the Throw button on a touch screen) throws it away from you.
  const throwFromButton = () => {
    const s = sim.current
    throwCow(s.dog, s.guest, null)
  }
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
    if (!s.moved && s.clock > 7 && !s.target) {
      // Nobody has tapped yet: follow HUGO up the driveway.
      s.target = { ...GUEST_AUTO_TARGET }
    }
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
        s.target = null
    }
    s.walkPhase += walking ? dt * 11 : 0
    const swing = walking ? Math.sin(s.walkPhase) : 0
    const j = joints.hiker
    const relax = damp(dt, 12)
    const lerpRot = (jt: Joint, axis: 'x' | 'z', value: number) => {
      jt.obj.rotation[axis] += (jt.base[axis] + value - jt.obj.rotation[axis]) * relax
    }
    lerpRot(j.legL, 'x', swing * 0.6)
    lerpRot(j.legR, 'x', -swing * 0.6)
    lerpRot(j.shinL, 'x', walking ? Math.max(0, -Math.cos(s.walkPhase)) * 0.6 : 0)
    lerpRot(j.shinR, 'x', walking ? Math.max(0, Math.cos(s.walkPhase)) * 0.6 : 0)
    lerpRot(j.armL, 'x', -swing * 0.5)
    lerpRot(j.armR, 'x', swing * 0.5)
    G.hiker.position.set(
      s.guest.x,
      walking ? Math.abs(Math.sin(s.walkPhase)) * 0.05 : Math.sin(t * 2) * 0.006,
      s.guest.z,
    )
    G.hiker.rotation.y = s.guestYaw

    // the little tap marker
    if (marker.current) {
      s.marker.life = Math.max(0, s.marker.life - dt * 1.6)
      marker.current.visible = s.marker.life > 0
      marker.current.position.set(s.marker.x, 0.05, s.marker.z)
      const k = 0.6 + (1 - s.marker.life) * 0.6
      marker.current.scale.set(k, k, k)
      ;(marker.current.material as THREE.MeshBasicMaterial).opacity = s.marker.life
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
    const dog = s.dog
    const r = joints.rusty
    // where the cow sits when he carries it: just in front of his mouth
    G.rusty.updateMatrixWorld(true)
    const mouthWorld = r.mouth.obj.getWorldPosition(tmp)
    const mouth = {
      x: mouthWorld.x + Math.sin(dog.yaw) * 0.08,
      y: mouthWorld.y - 0.2,
      z: mouthWorld.z + Math.cos(dog.yaw) * 0.08,
    }
    const pose = updateRusty(dog, dt, s.guest, s.guestYaw, mouth, () =>
      callbacks.current.onCowDropped(),
    )
    const gait = Math.sin(dog.gait) * 0.75 * pose.stride
    const rx = (jt: Joint, v: number) => {
      jt.obj.rotation.x += (jt.base.x + v - jt.obj.rotation.x) * damp(dt, 14)
    }
    // lying down: front legs stretched forward, back legs tucked under
    const lie = dog.lie
    rx(r.fl, gait - 1.45 * lie)
    rx(r.fr, -gait - 1.45 * lie)
    rx(r.br, gait - 1.25 * lie)
    rx(r.bl, -gait - 1.25 * lie)
    const wag = 9 + dog.excitement * 9
    r.tail.obj.rotation.y = r.tail.base.y + Math.sin(t * wag) * 0.6 * dog.excitement
    r.head.obj.rotation.x =
      r.head.base.x +
      dog.headDown * 0.75 +
      (pose.moving ? Math.sin(dog.gait * 2) * 0.05 * pose.stride : Math.sin(t * 1.6) * 0.05 - 0.04)
    G.rusty.position.set(
      dog.pos.x,
      Math.abs(Math.sin(dog.gait)) * 0.06 * pose.stride - 0.24 * lie,
      dog.pos.z,
    )
    // lean into turns a little and dip the front when lowering the head
    G.rusty.rotation.set(dog.headDown * 0.12, dog.yaw, 0)

    const c = dog.cow
    G.cow.position.set(c.pos.x, c.pos.y, c.pos.z)
    G.cow.rotation.set(c.rot.x, c.rot.y, 0)

    // show the Throw prompt when the cow can be thrown
    const throwable = canThrow(dog, s.guest)
    if (throwable !== s.throwable) {
      s.throwable = throwable
      setThrowable(throwable)
    }
    cowAnchor.current?.position.set(c.pos.x, c.pos.y + 0.65, c.pos.z)
    if (aimRing.current) {
      const showAim = throwable && input === 'right-click' && s.aim !== null
      aimRing.current.visible = showAim
      if (showAim && s.aim) {
        const dx = s.aim.x - c.pos.x
        const dz = s.aim.z - c.pos.z
        const d = Math.hypot(dx, dz) || 1
        const reach = Math.min(7, Math.max(3.5, d))
        aimRing.current.position.set(c.pos.x + (dx / d) * reach, 0.05, c.pos.z + (dz / d) * reach)
      }
    }

    // ---------------------------------------------------------- Eduard
    const e = joints.eduard
    const eduardPos = { x: EDUARD_SPOT.x, z: EDUARD_SPOT.z }
    if (eduardGreeting) {
      s.eduardYaw = turnTowards(s.eduardYaw, facing(eduardPos, s.guest), 4 * dt)
      e.armR.obj.rotation.x += (e.armR.base.x + 0.9 - e.armR.obj.rotation.x) * relax
      e.head.obj.rotation.x += (0.05 - e.head.obj.rotation.x) * relax
      // wave with the free hand
      e.armL.obj.rotation.x += (-2.6 - e.armL.obj.rotation.x) * relax
      e.armL.obj.rotation.y = Math.sin(t * 9) * 0.35
    } else {
      s.eduardYaw = turnTowards(s.eduardYaw, EDUARD_SPOT.facing, 3 * dt)
      // hammering: a slow lift and a quick strike
      const cycle = (t * 1.25) % 1
      const lift = cycle < 0.7 ? cycle / 0.7 : 1 - (cycle - 0.7) / 0.3
      e.armR.obj.rotation.x = e.armR.base.x - lift * 0.9 + 0.35
      e.head.obj.rotation.x += (e.head.base.x - e.head.obj.rotation.x) * relax
      e.armL.obj.rotation.x += (e.armL.base.x - 0.5 - e.armL.obj.rotation.x) * relax
      e.armL.obj.rotation.y *= 0.9
    }
    e.torso.obj.rotation.x = e.torso.base.x + Math.sin(t * 1.4) * 0.015
    G.eduard.position.set(EDUARD_SPOT.x, EDUARD_SPOT.y, EDUARD_SPOT.z)
    G.eduard.rotation.y = s.eduardYaw

    // ---------------------------------------------------------- HUGO
    const side = {
      x: Math.cos(s.guestYaw) * 0.85 - Math.sin(s.guestYaw) * 0.25,
      z: -Math.sin(s.guestYaw) * 0.85 - Math.cos(s.guestYaw) * 0.25,
    }
    const hugoGoal = tmp.set(s.guest.x + side.x, 0.8 + Math.sin(t * 2.1) * 0.07, s.guest.z + side.z)
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
    eduardAnchor.current?.position.set(EDUARD_SPOT.x, 1.6, EDUARD_SPOT.z)

    // ---------------------------------------------------------- camera and sun follow the guest
    // Looking down from above and behind, like a little diorama. Tall phone
    // screens show less sideways, so pull back a little. During the welcome the
    // camera eases in so the faces are readable.
    const far = size.height > size.width ? 1.3 : 1
    const welcoming = s.welcomed && bubble !== null
    s.zoom += ((welcoming ? 0.8 : 1) - s.zoom) * damp(dt, 1.5)
    // (window.__cabinZoom lets a test browser move the camera in; dev only)
    const devZoom =
      process.env.NODE_ENV !== 'production'
        ? ((window as Window & { __cabinZoom?: number }).__cabinZoom ?? 1)
        : 1
    const k = far * s.zoom * devZoom
    // During the welcome, aim between the guest and Eduard so both are in view.
    const aim = welcoming
      ? { x: s.guest.x * 0.55 + EDUARD_SPOT.x * 0.45, z: s.guest.z * 0.55 + EDUARD_SPOT.z * 0.45 }
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
      <group ref={hikerG}>
        <primitive object={hiker} />
      </group>
      <group ref={eduardG}>
        <primitive object={eduard} />
      </group>
      <group ref={rustyG}>
        <primitive object={rusty} />
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

      <group ref={cowAnchor}>
        {throwable && (
          <Html zIndexRange={[30, 0]}>
            <InteractPrompt label="Throw" input={input} onPress={throwFromButton} />
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
