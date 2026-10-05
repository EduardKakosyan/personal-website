'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { type GuideMood } from '@/components/providers/guide-provider'
import { useWebLLMContext } from '@/components/providers/webllm-provider'

export function Cadence({ animated }: { animated: boolean }) {
  const { invalidate } = useThree()
  useEffect(() => {
    invalidate()
    if (!animated) return
    let timer: ReturnType<typeof setInterval> | undefined
    const update = () => {
      if (timer) clearInterval(timer)
      if (!document.hidden) {
        invalidate()
        timer = setInterval(invalidate, 1000 / 24)
      }
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => {
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [animated, invalidate])
  return null
}
export function Character({
  mood,
  pointing,
  direction,
  still,
}: {
  mood: GuideMood
  pointing: boolean
  direction: -1 | 1
  still: boolean
}) {
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const eye = useRef<THREE.Group>(null)
  const moodTiming = useRef({ mood, start: 0 })
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const orange =
    mood === 'presenting'
      ? '#c1f17f'
      : mood === 'listening'
        ? '#93dfed'
        : mood === 'thinking'
          ? '#b6b0ff'
          : '#ff9862'
  const happy = mood === 'presenting'
  const thinking = mood === 'thinking'
  const confused = mood === 'confused'
  useFrame(({ clock, pointer }, delta) => {
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.06)
    if (moodTiming.current.mood !== mood) moodTiming.current = { mood, start: t }
    const elapsed = t - moodTiming.current.start
    const move = (from: number, to: number, speed = 6) =>
      still ? to : THREE.MathUtils.damp(from, to, speed, dt)
    const greeting = mood === 'ready' && elapsed < 2.8
    if (body.current) {
      body.current.position.y = still ? 0 : Math.sin(t * 1.7) * (happy ? 0.075 : 0.045)
      body.current.rotation.y = move(
        body.current.rotation.y,
        pointing ? direction * 0.22 : pointer.x * 0.1,
      )
      body.current.rotation.z = move(
        body.current.rotation.z,
        mood === 'navigating' ? -direction * 0.16 : 0,
      )
    }
    if (head.current) {
      const tilt = thinking
        ? -0.15
        : confused
          ? 0.2
          : mood === 'listening'
            ? -0.08
            : greeting
              ? 0.08
              : 0
      head.current.rotation.z = move(head.current.rotation.z, tilt)
      head.current.rotation.y = move(
        head.current.rotation.y,
        pointing ? direction * 0.25 : pointer.x * 0.13,
      )
      head.current.rotation.x = move(
        head.current.rotation.x,
        happy && elapsed < 1.8 && !still
          ? Math.sin(elapsed * 9) * 0.1
          : mood === 'listening'
            ? 0.08
            : -pointer.y * 0.07,
      )
    }
    if (eye.current) {
      const blink = t % 4.6
      const shape = thinking ? 0.48 : mood === 'listening' ? 1.2 : 1
      eye.current.scale.y =
        !still && blink < 0.15 ? 0.12 + (Math.abs(blink - 0.075) / 0.075) * 0.88 : shape
      eye.current.position.x = move(eye.current.position.x, thinking ? 0.045 : pointer.x * 0.025)
    }
    for (const [side, ref] of [
      [-1, leftArm],
      [1, rightArm],
    ] as const) {
      if (!ref.current) continue
      const angle =
        pointing && side === direction
          ? side * 1.8
          : thinking && side === 1
            ? 2.85
            : greeting && side === 1
              ? 2.4 + (still ? 0 : Math.sin(elapsed * 12) * 0.3)
              : happy
                ? side * 0.65
                : confused
                  ? side * 1.05
                  : side * 0.14
      ref.current.rotation.z = move(ref.current.rotation.z, angle)
    }
  })
  return (
    <group ref={body}>
      <group ref={head}>
        <RoundedBox args={[1.48, 1.03, 0.88]} radius={0.26} smoothness={5} position={[0, 0.4, 0]}>
          <meshPhysicalMaterial color="#d9d9d4" metalness={0.8} roughness={0.22} clearcoat={1} />
        </RoundedBox>
        <RoundedBox
          args={[1.25, 0.66, 0.38]}
          radius={0.15}
          smoothness={5}
          position={[0, 0.36, 0.36]}
        >
          <meshPhysicalMaterial color="#15171b" metalness={0.25} roughness={0.3} clearcoat={1} />
        </RoundedBox>
        <group ref={eye} position={[0, 0.4, 0.565]}>
          {[-0.25, 0.25].map((x) => (
            <mesh
              key={x}
              position={[x, 0, 0]}
              rotation={[0, 0, confused ? (x < 0 ? -0.2 : 0.2) : 0]}
            >
              {happy ? (
                <torusGeometry args={[0.065, 0.018, 8, 24, Math.PI]} />
              ) : (
                <capsuleGeometry args={[0.035, 0.13, 6, 16]} />
              )}
              <meshBasicMaterial color={orange} />
            </mesh>
          ))}
        </group>
        {(thinking || confused || mood === 'listening') &&
          [-0.25, 0.25].map((x) => (
            <mesh
              key={`brow-${x}`}
              position={[x, 0.57, 0.565]}
              rotation={[0, 0, confused ? (x < 0 ? -0.25 : 0.25) : thinking ? -0.16 : 0]}
            >
              <boxGeometry args={[0.12, 0.014, 0.012]} />
              <meshBasicMaterial color={orange} />
            </mesh>
          ))}
        <mesh
          position={[0, 0.19, 0.57]}
          rotation={[0, 0, thinking || confused ? (confused ? -0.18 : 0) : Math.PI]}
        >
          {thinking || confused ? (
            <boxGeometry args={[0.1, 0.014, 0.01]} />
          ) : (
            <torusGeometry args={[happy ? 0.09 : 0.07, 0.012, 8, 24, Math.PI]} />
          )}
          <meshBasicMaterial color={orange} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.79, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.18, 0.18, 0.12, 24]} />
              <meshStandardMaterial color="#4f5555" metalness={0.95} roughness={0.25} />
            </mesh>
            <mesh position={[0, side * 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.105, 0.016, 8, 32]} />
              <meshBasicMaterial color={orange} />
            </mesh>
          </group>
        ))}
        <mesh position={[0.3, 1.04, 0]}>
          <capsuleGeometry args={[0.022, 0.17, 4, 12]} />
          <meshStandardMaterial color="#9c9e99" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[0.3, 1.17, 0]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshBasicMaterial color={orange} />
        </mesh>
      </group>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.13, 0.14, 0.18, 20]} />
        <meshStandardMaterial color="#575d59" metalness={1} roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.85, 0.63, 0.62]} radius={0.2} smoothness={5} position={[0, -0.53, 0]}>
        <meshPhysicalMaterial color="#c6c9c3" metalness={0.7} roughness={0.25} clearcoat={1} />
      </RoundedBox>
      <mesh position={[0, -0.5, 0.327]}>
        <torusGeometry args={[0.1, 0.025, 12, 40]} />
        <meshBasicMaterial color={orange} />
      </mesh>
      <mesh position={[0, -0.5, 0.326]}>
        <circleGeometry args={[0.072, 32]} />
        <meshStandardMaterial color="#252b26" metalness={0.6} roughness={0.3} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} ref={side === -1 ? leftArm : rightArm} position={[side * 0.53, -0.35, 0]}>
          <mesh>
            <sphereGeometry args={[0.105, 16, 12]} />
            <meshStandardMaterial color="#444e49" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.085, 0.2, 6, 16]} />
            <meshPhysicalMaterial color="#d5d8d1" metalness={0.65} roughness={0.23} />
          </mesh>
          <mesh position={[0, -0.4, 0.03]}>
            <sphereGeometry args={[0.105, 16, 12]} />
            <meshStandardMaterial color="#dadbd5" metalness={0.65} roughness={0.25} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.9, 0]}>
        <coneGeometry args={[0.19, 0.2, 32]} />
        <meshPhysicalMaterial
          color={orange}
          transparent
          opacity={0.65}
          emissive={orange}
          emissiveIntensity={0.7}
        />
      </mesh>
      <mesh position={[0, -1.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.24, 40]} />
        <meshBasicMaterial color={orange} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
export function AgentVisual({
  mood,
  pointing = false,
  direction = -1,
  attentive = false,
}: {
  mood: GuideMood
  pointing?: boolean
  direction?: -1 | 1
  attentive?: boolean
}) {
  const reducedMotion = useReducedMotion()
  const { isGenerating, isInitializing } = useWebLLMContext()
  const visualMood = isInitializing ? 'thinking' : attentive && mood === 'idle' ? 'ready' : mood
  const animated = !reducedMotion && !isGenerating && !isInitializing
  const [lost, setLost] = useState(false)
  const [supported] = useState(() => {
    if (typeof document === 'undefined') return false
    const context = document.createElement('canvas').getContext('webgl2')
    const available = !!context
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return available
  })
  if (!supported || lost)
    return (
      <span className="companion-fallback" data-mood={visualMood} aria-hidden="true">
        <i />
        <i />
        <em className="fallback-mouth" />
        <b />
      </span>
    )
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop="demand"
      camera={{ position: [0, 0.08, 4.4], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={({ gl }) =>
        gl.domElement.addEventListener('webglcontextlost', () => setLost(true), { once: true })
      }
    >
      <Suspense fallback={null}>
        <Cadence animated={animated} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 4, 4]} intensity={3} />
        <directionalLight position={[-3, -1, 2]} color="#ffc39c" intensity={2} />
        <Character mood={visualMood} pointing={pointing} direction={direction} still={!animated} />
        <Environment frames={1} resolution={128}>
          <Lightformer
            intensity={4}
            scale={[3, 5, 1]}
            position={[3, 2, 3]}
            rotation={[0, -Math.PI / 4, 0]}
          />
          <Lightformer
            intensity={3}
            scale={[3, 5, 1]}
            position={[-4, 1, 2]}
            rotation={[0, Math.PI / 3, 0]}
          />
        </Environment>
      </Suspense>
    </Canvas>
  )
}
