'use client'

import { useRef, useMemo, useSyncExternalStore } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// --- Logo shape constants ---
const NUM_RAYS = 7
const PARTICLES_PER_RAY = 14
const CENTER_PARTICLES = 10
const PARTICLE_COUNT = CENTER_PARTICLES + NUM_RAYS * PARTICLES_PER_RAY // 108
const LOGO_RADIUS = 2.8
const RAY_TWIST = 0.5 // radians of curve per ray
const CONNECTION_DISTANCE = 0.5

// --- KNN attraction constants (up to K=3 nearest neighbors within radius) ---
const RAMP_UP_SPEED = 3.0
const RAMP_DOWN_SPEED = 1.5
const ATTRACTION_STRENGTH = 0.8
const MAX_ATTRACT_RADIUS_SQ = 2.5 * 2.5

// --- Module-level mouse state (avoids re-renders) ---
let _isMouseOverHero = false
let _mouseClientX = 0
let _mouseClientY = 0

export function setMouseOverHero(over: boolean) {
  _isMouseOverHero = over
}

export function setMousePosition(clientX: number, clientY: number) {
  _mouseClientX = clientX
  _mouseClientY = clientY
}

// Scratch objects reused every frame (zero allocation)
const _mouseWorld = new THREE.Vector3()
const _mouseLocal = new THREE.Vector3()
const _rayDir = new THREE.Vector3()
const _invMatrix = new THREE.Matrix4()

// Generate logo-shaped particle layout
function generateParticleData() {
  const targets = new Float32Array(PARTICLE_COUNT * 3)
  const pos = new Float32Array(PARTICLE_COUNT * 3)

  let idx = 0

  // Center cluster — tight ring at the hub
  for (let i = 0; i < CENTER_PARTICLES; i++) {
    const angle = (2 * Math.PI * i) / CENTER_PARTICLES
    const r = 0.15
    targets[idx * 3] = Math.cos(angle) * r
    targets[idx * 3 + 1] = Math.sin(angle) * r
    targets[idx * 3 + 2] = 0
    idx++
  }

  // Curved rays — particles distributed along arcs from center outward
  for (let ray = 0; ray < NUM_RAYS; ray++) {
    const baseAngle = (2 * Math.PI * ray) / NUM_RAYS - Math.PI / 2 // start from top
    const rayZOffset = Math.sin(ray * 0.9) * 0.12 // slight z stagger per ray for 3D depth

    for (let p = 0; p < PARTICLES_PER_RAY; p++) {
      const t = (p + 1) / (PARTICLES_PER_RAY + 1) // 0→1, evenly spaced
      const radius = t * LOGO_RADIUS
      const angle = baseAngle + t * RAY_TWIST // curve increases with distance

      targets[idx * 3] = Math.cos(angle) * radius
      targets[idx * 3 + 1] = Math.sin(angle) * radius
      targets[idx * 3 + 2] = Math.sin(t * Math.PI) * 0.2 + rayZOffset
      idx++
    }
  }

  // Initialize positions at targets
  pos.set(targets)

  return { positions: pos, targets }
}

const INITIAL_DATA = generateParticleData()

function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)

  const positions = INITIAL_DATA.positions
  const targets = INITIAL_DATA.targets

  // Natural positions (where particles would be without attraction)
  const naturalPositions = useRef<Float32Array | null>(null)
  // Per-particle blend factor: 0 = natural, 1 = fully attracted
  const attractionFactors = useRef<Float32Array | null>(null)

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

  useFrame((state, delta) => {
    if (!particlesRef.current || !linesRef.current) return

    const dt = Math.min(delta, 0.1)
    const time = state.clock.elapsedTime
    const posAttr = particlesRef.current.geometry.attributes.position
    const posArray = posAttr.array as Float32Array

    // Initialize refs on first frame
    if (!naturalPositions.current) {
      naturalPositions.current = new Float32Array(posArray.length)
      naturalPositions.current.set(posArray)
    }
    if (!attractionFactors.current) {
      attractionFactors.current = new Float32Array(PARTICLE_COUNT)
    }

    const natPos = naturalPositions.current
    const factors = attractionFactors.current

    // Gentle breathing — whole logo pulses slightly
    const breathe = 1.0 + Math.sin(time * 0.6) * 0.02

    // Update natural positions: oscillate around logo targets
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const phase = i * 2.399 // irrational spread for organic feel

      // Multi-frequency oscillation for organic movement
      const ox = Math.sin(time * 0.4 + phase) * 0.08 + Math.sin(time * 0.17 + phase * 2.3) * 0.04
      const oy =
        Math.cos(time * 0.35 + phase * 1.1) * 0.08 + Math.cos(time * 0.19 + phase * 1.7) * 0.04
      const oz = Math.sin(time * 0.5 + phase * 0.8) * 0.05

      natPos[i3] = targets[i3] * breathe + ox
      natPos[i3 + 1] = targets[i3 + 1] * breathe + oy
      natPos[i3 + 2] = targets[i3 + 2] + oz
    }

    // --- Mouse attraction logic ---
    let mouseActive = false
    let mlx = 0,
      mly = 0,
      mlz = 0

    if (_isMouseOverHero && groupRef.current) {
      const rect = state.gl.domElement.getBoundingClientRect()
      const ndcX = ((_mouseClientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((_mouseClientY - rect.top) / rect.height) * 2 + 1

      const { camera } = state
      _mouseWorld.set(ndcX, ndcY, 0.5).unproject(camera)
      _rayDir.copy(_mouseWorld).sub(camera.position).normalize()

      const t = -camera.position.z / _rayDir.z
      if (t > 0) {
        _mouseWorld.copy(camera.position).add(_rayDir.multiplyScalar(t))
        _invMatrix.copy(groupRef.current.matrixWorld).invert()
        _mouseLocal.copy(_mouseWorld).applyMatrix4(_invMatrix)

        mlx = _mouseLocal.x
        mly = _mouseLocal.y
        mlz = _mouseLocal.z
        mouseActive = true
      }
    }

    // KNN search: find up to 3 nearest particles within attraction radius
    let best0 = Infinity,
      best1 = Infinity,
      best2 = Infinity
    let idx0 = -1,
      idx1 = -1,
      idx2 = -1

    if (mouseActive) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3
        const dx = natPos[i3] - mlx
        const dy = natPos[i3 + 1] - mly
        const dz = natPos[i3 + 2] - mlz
        const distSq = dx * dx + dy * dy + dz * dz

        if (distSq > MAX_ATTRACT_RADIUS_SQ) continue

        if (distSq < best0) {
          best2 = best1
          idx2 = idx1
          best1 = best0
          idx1 = idx0
          best0 = distSq
          idx0 = i
        } else if (distSq < best1) {
          best2 = best1
          idx2 = idx1
          best1 = distSq
          idx1 = i
        } else if (distSq < best2) {
          best2 = distSq
          idx2 = i
        }
      }
    }

    // Attraction blending
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const isAttracted = i === idx0 || i === idx1 || i === idx2

      if (isAttracted) {
        factors[i] = Math.min(1.0, factors[i] + dt * RAMP_UP_SPEED)
      } else {
        factors[i] = Math.max(0.0, factors[i] - dt * RAMP_DOWN_SPEED)
      }

      const f = factors[i] * ATTRACTION_STRENGTH
      posArray[i3] = natPos[i3] + (mlx - natPos[i3]) * f
      posArray[i3 + 1] = natPos[i3 + 1] + (mly - natPos[i3 + 1]) * f
      posArray[i3 + 2] = natPos[i3 + 2] + (mlz - natPos[i3 + 2]) * f
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

          // Electric cyan with distance fade
          const r = 0.25 * alpha
          const g = 0.7 * alpha
          const b = 0.9 * alpha
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

    // Slow rotation to show 3D depth while keeping logo readable
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.03
      groupRef.current.rotation.x = Math.sin(time * 0.025) * 0.06
    }
  })

  return (
    <Float speed={1.0} rotationIntensity={0.1} floatIntensity={0.15}>
      <group ref={groupRef}>
        <points ref={particlesRef} geometry={particleGeometry}>
          <pointsMaterial
            size={0.055}
            color="#4dd9e8"
            transparent
            opacity={0.9}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
        <lineSegments ref={linesRef} geometry={lineGeometry}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.3}
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
