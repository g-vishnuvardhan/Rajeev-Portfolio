import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { layouts, layoutZ } from './layouts'

const { lerp } = THREE.MathUtils

function Photo({ item, index, count, layout, drag, onOpen, onHover }) {
  const tex = useTexture(item.url)
  const mesh = useRef()
  const mat = useRef()
  const hovered = useRef(false)
  const born = useRef(null)
  const { p, r } = useMemo(() => layouts[layout](index, count), [layout, index, count])
  const h = 2.1
  const w = Math.min(h * item.ratio, 3.3)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (born.current === null) born.current = t
    const k = Math.min(1, Math.max(0, (t - born.current - index * 0.07) / 0.9))
    const ease = 1 - Math.pow(1 - k, 3)
    const target = (hovered.current ? 1.07 : 1) * ease
    mesh.current.scale.setScalar(lerp(mesh.current.scale.x, Math.max(target, 0.001), 0.14))
    mesh.current.position.y = p[1] + Math.sin(t * 0.6 + index) * 0.08
    const c = lerp(mat.current.color.r, hovered.current ? 1 : 0.72, 0.12)
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
        if (!drag.current.moved) onOpen(index)
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

function Rig({ layout, drag, children }) {
  const g = useRef()
  useFrame(({ pointer }) => {
    const d = drag.current
    g.current.rotation.y = lerp(g.current.rotation.y, d.y + pointer.x * 0.25, 0.06)
    g.current.rotation.x = lerp(g.current.rotation.x, -pointer.y * 0.12, 0.06)
    g.current.position.z = lerp(g.current.position.z, layoutZ[layout] + d.z, 0.06)
  })
  return <group ref={g}>{children}</group>
}

export default function GalleryScene({ items, layout, visible, mobile, onOpen, onHover }) {
  const drag = useRef({ down: false, moved: false, x: 0, y: 0, ry: 0, z: 0 })
  const state = drag.current
  // keep drag state in a stable shape: y = rotation, z = tunnel depth
  state.y = state.y || 0

  const down = (e) => {
    state.down = true
    state.moved = false
    state.x = e.clientX
    state.y0 = state.y
  }
  const move = (e) => {
    if (!state.down) return
    const dx = e.clientX - state.x
    if (Math.abs(dx) > 6) state.moved = true
    if (layout === 'tunnel') {
      const next = state.z - (e.clientX - (state.lx ?? e.clientX)) * 0.03
      state.z = Math.min(Math.max(next, 0), 3 * (items.length - 1))
    } else {
      state.y += (e.clientX - (state.lx ?? e.clientX)) * 0.005
    }
    state.lx = e.clientX
  }
  const up = () => {
    state.down = false
    state.lx = undefined
  }

  // reset depth when layout changes
  state.z = layout === 'tunnel' ? Math.min(state.z, 3 * (items.length - 1)) : 0

  return (
    <div className="stage-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, mobile ? 1.5 : 2]}
        camera={{ position: [0, 0, mobile ? 13 : 8], fov: 45 }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
        aria-hidden="true"
      >
        <fog attach="fog" args={['#050505', 9, 22]} />
        <Rig key={layout} layout={layout} drag={drag}>
          {items.map((item, i) => (
            <Photo
              key={`${layout}-${i}-${item.url.length}`}
              item={item}
              index={i}
              count={items.length}
              layout={layout}
              drag={drag}
              onOpen={onOpen}
              onHover={onHover}
            />
          ))}
        </Rig>
      </Canvas>
    </div>
  )
}
