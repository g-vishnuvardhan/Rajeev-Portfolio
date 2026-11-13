import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { layouts, layoutZ } from './layouts'

const { lerp } = THREE.MathUtils

const getLayoutTarget = (layout, index, count) => {
  if (!count || count <= 0) return { rx: 0, ry: 0, px: 0, py: 0, pz: layoutZ[layout] || 0 }
  const idx = Math.max(0, Math.min(index, count - 1))

  switch (layout) {
    case 'ring': {
      const a = (idx / count) * Math.PI * 2
      return { rx: 0, ry: -a, px: 0, py: 0, pz: layoutZ.ring }
    }
    case 'helix': {
      const a = idx * 0.78
      const y = (idx - (count - 1) / 2) * 1.35
      return { rx: 0, ry: -a, px: 0, py: -y, pz: layoutZ.helix }
    }
    case 'tunnel': {
      const pz = idx * 3.2
      const px = -Math.sin(idx * 1.3) * 2.8
      const py = -Math.cos(idx * 1.7) * 1.3
      const ry = Math.sin(idx * 1.3) * 0.3
      return { rx: 0, ry, px, py, pz: layoutZ.tunnel + pz }
    }
    case 'arc': {
      const t = idx - (count - 1) / 2
      const px = -t * 2.4
      const py = -Math.sin(idx * 0.9) * 0.28
      const ry = t * 0.14
      return { rx: 0, ry, px, py, pz: layoutZ.arc + Math.abs(t) * 0.45 }
    }
    case 'wall': {
      const cols = count > 8 ? 5 : (count > 4 ? 4 : Math.max(count, 1))
      const c = idx % cols
      const r = Math.floor(idx / cols)
      const totalRows = Math.ceil(count / cols)
      const x = (c - (cols - 1) / 2) * (cols > 4 ? 2.8 : 3.3)
      const y = ((totalRows - 1) / 2 - r) * 3.1
      return { rx: 0, ry: 0, px: -x * 0.5, py: -y * 0.5, pz: layoutZ.wall + 0.3 }
    }
    case 'scatter': {
      const rand = (i, s) => {
        const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
        return x - Math.floor(x)
      }
      const sx = (rand(idx, 1) - 0.5) * 10.5
      const sy = (rand(idx, 2) - 0.5) * 5.4
      const sz = (rand(idx, 3) - 0.5) * 6
      return { rx: 0, ry: 0, px: -sx * 0.6, py: -sy * 0.6, pz: layoutZ.scatter - sz * 0.5 }
    }
    default:
      return { rx: 0, ry: 0, px: 0, py: 0, pz: layoutZ[layout] || 0 }
  }
}

function Photo({ item, index, count, layout, activeIndex, mobile, onOpen, onHover }) {
  const tex = useTexture(item.url)
  const mesh = useRef()
  const mat = useRef()
  const hovered = useRef(false)
  const born = useRef(null)
  const { p, r } = useMemo(() => layouts[layout](index, count), [layout, index, count])
  const h = mobile ? 2.5 : 2.85
  const w = Math.min(h * item.ratio, mobile ? 3.9 : 4.4)

  const isActive = index === activeIndex

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (born.current === null) born.current = t
    const k = Math.min(1, Math.max(0, (t - born.current - index * 0.07) / 0.9))
    const ease = 1 - Math.pow(1 - k, 3)
    const scaleFactor = hovered.current ? 1.12 : (isActive ? 1.07 : 0.96)
    const target = scaleFactor * ease
    mesh.current.scale.setScalar(lerp(mesh.current.scale.x, Math.max(target, 0.001), 0.12))
    mesh.current.position.y = p[1] + Math.sin(t * 0.6 + index) * 0.05
    const targetZ = p[2] + (isActive ? 0.35 : 0)
    mesh.current.position.z = lerp(mesh.current.position.z, targetZ, 0.1)
    const targetBrightness = hovered.current || isActive ? 1.0 : 0.68
    const c = lerp(mat.current.color.r, targetBrightness, 0.12)
    mat.current.color.setScalar(c)
  })

  return (
    <mesh
      ref={mesh}
      position={p}
      rotation={r}
      scale={0.001}
      onClick={(e) => {
        e.stopPropagation()
        onOpen(index)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        hovered.current = true
        document.body.style.cursor = 'pointer'
        onHover(index)
      }}
      onPointerOut={() => {
        hovered.current = false
        document.body.style.cursor = ''
        onHover(null)
      }}
    >
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={mat} map={tex} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Rig({ layout, activeIndex, count, children }) {
  const g = useRef()
  const currentRy = useRef(0)

  useFrame(({ pointer }) => {
    if (!g.current) return
    const target = getLayoutTarget(layout, activeIndex, count)

    // Shortest angular difference for seamless forward carousel wrap
    let dy = target.ry - currentRy.current
    dy = Math.atan2(Math.sin(dy), Math.cos(dy))
    currentRy.current += dy * 0.075

    g.current.rotation.y = currentRy.current + pointer.x * 0.12
    g.current.rotation.x = lerp(g.current.rotation.x, target.rx - pointer.y * 0.08, 0.075)
    g.current.position.x = lerp(g.current.position.x, target.px, 0.075)
    g.current.position.y = lerp(g.current.position.y, target.py, 0.075)
    g.current.position.z = lerp(g.current.position.z, target.pz, 0.075)
  })

  return <group ref={g}>{children}</group>
}

export default function GalleryScene({ items, layout, activeIndex, visible, mobile, onOpen, onHover }) {
  return (
    <div className="stage-canvas">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, mobile ? 1.5 : 2]}
        camera={{ position: [0, 0, mobile ? 12 : 8.2], fov: 45 }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
        aria-hidden="true"
      >
        <fog attach="fog" args={['#040407', 9, 23]} />
        <Rig key={layout} layout={layout} activeIndex={activeIndex} count={items.length}>
          {items.map((item, i) => (
            <Photo
              key={`${layout}-${item.url}-${i}`}
              item={item}
              index={i}
              count={items.length}
              layout={layout}
              activeIndex={activeIndex}
              mobile={mobile}
              onOpen={onOpen}
              onHover={onHover}
            />
          ))}
        </Rig>
      </Canvas>
    </div>
  )
}
