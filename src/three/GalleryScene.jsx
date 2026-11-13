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
      const a = (idx / count) * Math.PI * 2
      const y = (idx - (count - 1) / 2) * 1.55
      return { rx: 0, ry: -a, px: 0, py: -y, pz: layoutZ.helix }
    }
    case 'tunnel': {
      const pz = idx * 3.4
      return { rx: 0, ry: 0, px: 0, py: 0, pz: layoutZ.tunnel + pz }
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
  const currentOpacity = useRef(1)
  const { p, r } = useMemo(() => layouts[layout](index, count), [layout, index, count])
  const h = mobile ? 2.25 : 2.5
  const w = Math.min(h * item.ratio, mobile ? 3.7 : 4.3)

  const isActive = index === activeIndex
  const isTunnel = layout === 'tunnel'

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (born.current === null) born.current = t
    const k = Math.min(1, Math.max(0, (t - born.current - index * 0.07) / 0.9))
    const ease = 1 - Math.pow(1 - k, 3)

    let targetX = p[0]
    let targetY = p[1]
    let targetZ = p[2]
    let targetRy = r[1]
    let targetOpacity = 1.0
    let scaleTarget = hovered.current ? 1.08 : (isActive ? 1.0 : 0.82)

    if (isTunnel) {
      const rel = index - activeIndex
      if (rel < 0) {
        // Frame has already passed: smoothly fade to 0 so it NEVER blocks camera or active frame
        targetOpacity = 0.0
        scaleTarget = 0.75
        targetX = p[0]
      } else if (rel === 0) {
        // Active frame: glide to dead-center, flat to camera, 100% opacity
        targetX = 0
        targetY = 0
        targetRy = 0
        targetZ = p[2] + 0.35
        targetOpacity = 1.0
        scaleTarget = hovered.current ? 1.08 : 1.0
      } else {
        // Future frames: wait on flanks, layered depth opacity
        targetX = p[0]
        targetOpacity = Math.max(0, 1.0 - rel * 0.28)
        scaleTarget = Math.max(0.7, 0.9 - rel * 0.05)
      }
      mesh.current.rotation.y = lerp(mesh.current.rotation.y, targetRy, 0.1)
    } else {
      // Helix / Arc / Ring
      targetZ = p[2] + (isActive ? 0.4 : 0)
      targetOpacity = isActive || hovered.current ? 1.0 : 0.65
    }

    const scale = scaleTarget * ease
    mesh.current.scale.setScalar(lerp(mesh.current.scale.x, Math.max(scale, 0.001), 0.12))

    const floatY = Math.sin(t * 0.6 + index) * 0.03
    mesh.current.position.x = lerp(mesh.current.position.x, targetX, 0.1)
    mesh.current.position.y = lerp(mesh.current.position.y, targetY + floatY, 0.1)
    mesh.current.position.z = lerp(mesh.current.position.z, targetZ, 0.1)

    currentOpacity.current = lerp(currentOpacity.current, targetOpacity, 0.12)
    mat.current.opacity = currentOpacity.current
    mesh.current.visible = currentOpacity.current > 0.01

    const targetBrightness = hovered.current || isActive ? 1.0 : 0.6
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
      <meshBasicMaterial ref={mat} map={tex} transparent toneMapped={false} side={THREE.DoubleSide} />
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

    const isTunnel = layout === 'tunnel'
    const pointerRy = isTunnel ? 0 : pointer.x * 0.12
    const pointerPx = isTunnel ? pointer.x * 0.35 : 0

    g.current.rotation.y = currentRy.current + pointerRy
    g.current.rotation.x = lerp(g.current.rotation.x, target.rx - (isTunnel ? 0 : pointer.y * 0.08), 0.075)
    g.current.position.x = lerp(g.current.position.x, target.px + pointerPx, 0.075)
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
        camera={{ position: [0, 0, mobile ? 12 : 9.0], fov: 45 }}
        gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
        aria-hidden="true"
      >
        <fog attach="fog" args={['#040407', 12, 42]} />
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
