'use client'

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import { useReducedMotion } from 'motion/react'
import * as THREE from 'three'
import { Cadence, Character } from './agent-scene'
import { useGuide } from '@/components/providers/guide-provider'
import { useWebLLMContext } from '@/components/providers/webllm-provider'

// An authored, stylized Spark enclosure. All geometry is local; no external model download.
function Spark() {
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
        <meshStandardMaterial color="#3b4137" metalness={0.7} roughness={0.5} />
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

function Installation({ still }: { still: boolean }) {
  const { mood, openGuide } = useGuide()
  const [hovered, setHovered] = useState(false)
  const rig = useRef<THREE.Group>(null)
  useFrame(({ pointer }, delta) => {
    if (!rig.current || still) return
    rig.current.rotation.y = THREE.MathUtils.damp(
      rig.current.rotation.y,
      pointer.x * 0.16,
      3,
      Math.min(delta, 0.06),
    )
    rig.current.rotation.x = THREE.MathUtils.damp(
      rig.current.rotation.x,
      pointer.y * -0.04,
      3,
      Math.min(delta, 0.06),
    )
  })
  return (
    <>
      {/* One stationary hitbox keeps crossings between animated body parts from retriggering hover. */}
      <mesh
        position={[0, 0.92, 0]}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(event) => {
          event.stopPropagation()
          openGuide()
        }}
      >
        <boxGeometry args={[1.6, 1.9, 1.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      <group ref={rig}>
        <group position={[0, 0.85, 0]} scale={0.67} rotation={[0, -0.13, 0]}>
          <Character
            mood={hovered && mood === 'idle' ? 'ready' : mood}
            pointing={false}
            direction={1}
            still={still}
          />
        </group>
        <group position={[0, -0.95, 0]}>
          <Spark />
        </group>
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
        {[0.42, 0.62, 0.82].map((radius, index) => (
          <mesh
            key={radius}
            position={[0, -0.52 + index * 0.12, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[radius, radius + 0.007, 64]} />
            <meshBasicMaterial
              color="#8de1ca"
              transparent
              opacity={0.3 - index * 0.07}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </>
  )
}

export function WorkshopScene() {
  const reducedMotion = useReducedMotion()
  const { isGenerating, isInitializing } = useWebLLMContext()
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [lost, setLost] = useState(false)
  const [supported] = useState(() => {
    const context = document.createElement('canvas').getContext('webgl2')
    const available = !!context
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return available
  })
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    if (container.current) observer.observe(container.current)
    return () => observer.disconnect()
  }, [])
  const animated = visible && !reducedMotion && !isGenerating && !isInitializing
  return (
    <div ref={container} className="workshop-canvas" aria-hidden="true">
      {supported && !lost ? (
        <Canvas
          dpr={[1, 1.75]}
          frameloop="demand"
          camera={{ position: [0, 1.6, 7.6], fov: 36 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          onCreated={({ gl }) =>
            gl.domElement.addEventListener('webglcontextlost', () => setLost(true), { once: true })
          }
        >
          <Suspense fallback={null}>
            <Cadence animated={animated} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[2, 5, 4]} color="#ffdec5" intensity={3.5} />
            <directionalLight position={[-4, 2, 1]} color="#77cfcd" intensity={3} />
            <pointLight position={[0, 0.2, 1]} color="#99eacb" intensity={1.5} />
            <Installation still={!animated} />
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
          </Suspense>
        </Canvas>
      ) : (
        <div className="workshop-static">
          <div className="static-agent">
            <i />
            <i />
          </div>
          <div className="static-spark">
            <span>DGX SPARK</span>
          </div>
        </div>
      )}
    </div>
  )
}
