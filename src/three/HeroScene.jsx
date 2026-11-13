import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { heroFrames } from '../data/content'
import { resolveSrc } from '../lib/placeholder'

function Frame({ frame, url }) {
  const tex = useTexture(url)
  const ref = useRef()
  const h = 2.4
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ref.current.position.y = frame.pos[1] + Math.sin(t * frame.speed + frame.pos[0]) * 0.18
    ref.current.rotation.z = frame.rot[2] + Math.sin(t * frame.speed * 0.7) * 0.015
  })
  return (
    <mesh ref={ref} position={frame.pos} rotation={frame.rot}>
      <planeGeometry args={[h * frame.ratio, h]} />
      <meshBasicMaterial map={tex} toneMapped={false} transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Dust({ count }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 18
      a[i * 3 + 1] = (Math.random() - 0.5) * 10
      a[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2
    }
    return a
  }, [count])
  useFrame(({ clock }, dt) => {
    ref.current.rotation.y += dt * 0.012
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.12) * 0.25
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.028} color="#eadfcb" transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function Rig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.9, 0.04)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.5, 0.04)
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Frames({ mobile }) {
  const list = mobile ? heroFrames.slice(0, 4) : heroFrames
  const urls = list.map((f, i) => resolveSrc(f.src, i, f.ratio, 'Hero frame placeholder'))
  const textures = useTexture(urls)
  return list.map((f, i) => <Frame key={i} frame={f} url={urls[i]} tex={textures[i]} />)
}

export default function HeroScene({ mobile, visible }) {
  return (
    <Canvas
      className="hero-canvas"
      frameloop={visible ? 'always' : 'never'}
      dpr={[1, mobile ? 1.5 : 2]}
      camera={{ position: [0, 0, mobile ? 11 : 8], fov: 45 }}
      gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <fog attach="fog" args={['#050505', 7, 17]} />
      <Frames mobile={mobile} />
      <Dust count={mobile ? 120 : 320} />
      <Rig />
    </Canvas>
  )
}
