'use client'

import { useRef, useMemo, useSyncExternalStore } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

const PARTICLE_COUNT = 80
const CONNECTION_DISTANCE = 2.2

// Generate initial particle data outside of component (module-level, runs once)
function generateParticleData() {
  const pos = new Float32Array(PARTICLE_COUNT * 3)
  const vel = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3
    // Use seeded-style deterministic values based on index for purity
    const seed1 = Math.sin(i * 127.1 + 311.7) * 43758.5453
    const seed2 = Math.sin(i * 269.5 + 183.3) * 43758.5453
    const seed3 = Math.sin(i * 419.2 + 371.9) * 43758.5453
    const seed4 = Math.sin(i * 547.3 + 127.1) * 43758.5453
    const seed5 = Math.sin(i * 631.7 + 269.5) * 43758.5453
    const seed6 = Math.sin(i * 773.1 + 419.2) * 43758.5453
    pos[i3] = (seed1 - Math.floor(seed1) - 0.5) * 8
    pos[i3 + 1] = (seed2 - Math.floor(seed2) - 0.5) * 8
    pos[i3 + 2] = (seed3 - Math.floor(seed3) - 0.5) * 4
    vel[i3] = (seed4 - Math.floor(seed4) - 0.5) * 0.003
    vel[i3 + 1] = (seed5 - Math.floor(seed5) - 0.5) * 0.003
    vel[i3 + 2] = (seed6 - Math.floor(seed6) - 0.5) * 0.002
  }
  return { positions: pos, velocities: vel }
}

const INITIAL_PARTICLE_DATA = generateParticleData()

function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)

  const positions = INITIAL_PARTICLE_DATA.positions
  const velocities = INITIAL_PARTICLE_DATA.velocities

  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [positions])

  // Pre-allocate line geometry
  const maxConnections = PARTICLE_COUNT * PARTICLE_COUNT
  const linePositions = useMemo(() => new Float32Array(maxConnections * 6), [maxConnections])
  const lineColors = useMemo(() => new Float32Array(maxConnections * 6), [maxConnections])
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3))
    return geo
  }, [linePositions, lineColors])

  useFrame((state) => {
    if (!particlesRef.current || !linesRef.current) return

    const time = state.clock.elapsedTime
    const posAttr = particlesRef.current.geometry.attributes.position
    const posArray = posAttr.array as Float32Array

    // Update particle positions with sine-wave displacement
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      posArray[i3] += velocities[i3] + Math.sin(time * 0.3 + i) * 0.001
      posArray[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.2 + i) * 0.001
      posArray[i3 + 2] += velocities[i3 + 2]

      // Boundary wrapping
      for (let j = 0; j < 3; j++) {
        const limit = j === 2 ? 2 : 4
        if (posArray[i3 + j] > limit) posArray[i3 + j] = -limit
        if (posArray[i3 + j] < -limit) posArray[i3 + j] = limit
      }
    }
    posAttr.needsUpdate = true

    // Update connections
    let lineIndex = 0
    const linePos = linesRef.current.geometry.attributes.position.array as Float32Array
    const lineCol = linesRef.current.geometry.attributes.color.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const dx = posArray[i * 3] - posArray[j * 3]
        const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1]
        const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (dist < CONNECTION_DISTANCE) {
          const alpha = 1 - dist / CONNECTION_DISTANCE
          const i6 = lineIndex * 6

          linePos[i6] = posArray[i * 3]
          linePos[i6 + 1] = posArray[i * 3 + 1]
          linePos[i6 + 2] = posArray[i * 3 + 2]
          linePos[i6 + 3] = posArray[j * 3]
          linePos[i6 + 4] = posArray[j * 3 + 1]
          linePos[i6 + 5] = posArray[j * 3 + 2]

          // Electric cyan color with distance-based fade
          const r = 0.3 * alpha
          const g = 0.85 * alpha
          const b = 1.0 * alpha
          lineCol[i6] = r
          lineCol[i6 + 1] = g
          lineCol[i6 + 2] = b
          lineCol[i6 + 3] = r
          lineCol[i6 + 4] = g
          lineCol[i6 + 5] = b

          lineIndex++
        }
      }
    }

    // Zero out unused line vertices
    for (let i = lineIndex * 6; i < linePos.length; i++) {
      linePos[i] = 0
      lineCol[i] = 0
    }

    linesRef.current.geometry.attributes.position.needsUpdate = true
    linesRef.current.geometry.attributes.color.needsUpdate = true
    linesRef.current.geometry.setDrawRange(0, lineIndex * 2)

    // Gentle rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.05
      groupRef.current.rotation.x = Math.sin(time * 0.03) * 0.1
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={groupRef}>
        <points ref={particlesRef} geometry={particleGeometry}>
          <pointsMaterial
            size={0.08}
            color="#4dd9e8"
            transparent
            opacity={1}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
        <lineSegments ref={linesRef} geometry={lineGeometry}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>
    </Float>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <NeuralNetwork />
    </>
  )
}

function GradientFallback() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-neon)]/5 via-transparent to-primary/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--accent-neon)]/5 blur-[120px] animate-pulse" />
    </div>
  )
}

function subscribeToNothing(_callback: () => void) {
  return () => {}
}

function getCanRender3DSnapshot() {
  const isMobile = window.innerWidth < 768
  const isLowPower = navigator.hardwareConcurrency < 4
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return !isMobile && !isLowPower && !prefersReducedMotion
}

function getServerSnapshot() {
  return false
}

export function HeroScene() {
  const shouldRender3D = useSyncExternalStore(
    subscribeToNothing,
    getCanRender3DSnapshot,
    getServerSnapshot,
  )

  if (!shouldRender3D) {
    return <GradientFallback />
  }

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: 'none' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
