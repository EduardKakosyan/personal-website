'use client'

import { Suspense, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { type ChapterId } from '@/content/story'
import { type GuideMood } from '@/components/providers/guide-provider'
import { keyframes, stageRig, storyPosition } from '@/lib/stage-rig'
import { Cadence, Character } from '@/components/features/agent-scene'

// An authored, stylized Spark enclosure. All geometry is local; no external model download.
function Spark({ glow }: { glow: RefObject<THREE.MeshBasicMaterial | null> }) {
  const vents = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < 46; i++) {
      matrix.makeTranslation(-1.04 + i * 0.046, -0.015, 0.885)
      vents.current?.setMatrixAt(i, matrix)
    }
    if (vents.current) vents.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group rotation={[0, -0.38, 0]}>
      <RoundedBox args={[2.45, 0.62, 1.85]} radius={0.13} smoothness={4}>
        <meshPhysicalMaterial color="#a99b80" metalness={0.85} roughness={0.29} clearcoat={0.3} />
      </RoundedBox>
      <RoundedBox args={[2.22, 0.43, 0.035]} radius={0.06} position={[0, -0.015, 0.92]}>
        <meshStandardMaterial color="#101b1b" roughness={0.75} metalness={0.3} />
      </RoundedBox>
      <instancedMesh ref={vents} args={[undefined, undefined, 46]}>
        <boxGeometry args={[0.014, 0.36, 0.14]} />
        <meshStandardMaterial color="#a09179" metalness={0.8} roughness={0.4} />
      </instancedMesh>
      <mesh position={[0.93, 0.03, 0.957]}>
        <sphereGeometry args={[0.022, 12, 8]} />
        <meshBasicMaterial color="#adffcf" />
      </mesh>
      <mesh position={[0, 0.315, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.105, 0.125, 40]} />
        <meshBasicMaterial ref={glow} color="#8de1ca" transparent opacity={0.4} />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, -0.35, 0.2]}>
          <boxGeometry args={[0.26, 0.09, 0.95]} />
          <meshStandardMaterial color="#131d1c" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

const damp = THREE.MathUtils.damp
const goal = new THREE.Vector3()
const goalTarget = new THREE.Vector3()

// Reads the reading position from the DOM and eases the camera, EK—01 and the Spark toward
// the pure stageRig() pose. Scrolling only invalidates; all motion happens in the frame.
function Rig({ order, mood, active }: { order: ChapterId[]; mood: GuideMood; active: boolean }) {
  const { camera, invalidate } = useThree()
  const position = useRef({ index: 0, progress: 0 })
  const target = useRef(new THREE.Vector3(...keyframes[order[0]!].target))
  const body = useRef<THREE.Group>(null)
  const glow = useRef<THREE.MeshBasicMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const first = useRef(true)
  const [character, setCharacter] = useState(() => {
    const rig = stageRig(order[0]!, 0, mood, order[1])
    return { mood: rig.character.mood, pointing: rig.character.pose.pointing }
  })

  useEffect(() => {
    const measure = () => {
      position.current = storyPosition(
        order.map((id) => document.getElementById(id)?.getBoundingClientRect() ?? null),
        window.innerHeight * 0.5,
      )
      if (active) invalidate()
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [order, active, invalidate])

  useFrame((_, delta) => {
    const { index, progress } = position.current
    const rig = stageRig(order[index]!, progress, mood, order[index + 1])
    const dt = first.current ? 1 : Math.min(delta, 0.06)
    const speed = first.current ? 1000 : 4
    first.current = false
    const [x, y, z] = rig.camera.position
    camera.position.set(
      damp(camera.position.x, x, speed, dt),
      damp(camera.position.y, y, speed, dt),
      damp(camera.position.z, z, speed, dt),
    )
    const [tx, ty, tz] = rig.camera.target
    target.current.set(
      damp(target.current.x, tx, speed, dt),
      damp(target.current.y, ty, speed, dt),
      damp(target.current.z, tz, speed, dt),
    )
    camera.lookAt(target.current)
    if (body.current)
      body.current.rotation.y = damp(body.current.rotation.y, rig.character.pose.turn, speed, dt)
    if (glow.current) glow.current.opacity = 0.25 + rig.spark.glow * 0.6
    if (light.current) light.current.intensity = 0.6 + rig.spark.glow * 1.8
    if (rig.character.mood !== character.mood || rig.character.pose.pointing !== character.pointing)
      setCharacter({ mood: rig.character.mood, pointing: rig.character.pose.pointing })
    // Keep easing after the scroll stops, even when the idle cadence is paused.
    const settled =
      camera.position.distanceToSquared(goal.set(x, y, z)) < 1e-5 &&
      target.current.distanceToSquared(goalTarget.set(tx, ty, tz)) < 1e-5
    if (active && !settled) invalidate()
  })

  return (
    <group>
      <group ref={body} position={[0, 0.85, 0]} scale={0.67}>
        <Character
          mood={character.mood}
          pointing={character.pointing}
          direction={1}
          still={!active}
        />
      </group>
      <group position={[0, -0.95, 0]}>
        <Spark glow={glow} />
      </group>
      <pointLight ref={light} position={[0, 0.2, 1]} color="#99eacb" intensity={1.5} />
      <mesh position={[0, -1.48, 0]}>
        <cylinderGeometry args={[2.02, 2.08, 0.18, 96]} />
        <meshStandardMaterial color="#182d2c" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, -1.382, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.91, 1.925, 96]} />
        <meshBasicMaterial color="#86cfc1" transparent opacity={0.65} />
      </mesh>
      <mesh position={[0, -1.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.3, 96]} />
        <meshBasicMaterial color="#060f11" transparent opacity={0.65} />
      </mesh>
    </group>
  )
}

// Tells the stage to hide the still only after the first frame has been drawn.
function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    requestAnimationFrame(onReady)
  })
  return null
}

export function StoryCanvas({
  order,
  mood,
  onReady,
  onLost,
}: {
  order: ChapterId[]
  mood: GuideMood
  onReady: () => void
  onLost: () => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting))
    if (container.current) observer.observe(container.current)
    return () => observer.disconnect()
  }, [])
  const start = keyframes[order[0]!]
  return (
    <div ref={container} className="story-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        frameloop="demand"
        camera={{ position: start.camera, fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) =>
          gl.domElement.addEventListener('webglcontextlost', onLost, { once: true })
        }
      >
        <Suspense fallback={null}>
          {/* 24 fps while on screen; Cadence also stops in a background tab. */}
          <Cadence animated={visible} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 5, 4]} color="#ffdec5" intensity={3.5} />
          <directionalLight position={[-4, 2, 1]} color="#77cfcd" intensity={3} />
          <Rig order={order} mood={mood} active={visible} />
          <Environment frames={1} resolution={128}>
            <Lightformer
              position={[0, 5, 2]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[5, 3, 1]}
              intensity={3}
            />
            <Lightformer
              position={[-4, 1, 3]}
              rotation={[0, Math.PI / 3, 0]}
              scale={[2, 5, 1]}
              intensity={4}
              color="#b8eeed"
            />
            <Lightformer
              position={[4, 2, 1]}
              rotation={[0, -Math.PI / 3, 0]}
              scale={[2, 4, 1]}
              intensity={4}
              color="#ffe0c1"
            />
          </Environment>
          <FirstFrame onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  )
}
