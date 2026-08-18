import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

class Timer {
  private _elapsed = 0
  private _last = performance.now()
  update() {
    const now = performance.now()
    this._elapsed += (now - this._last) / 1000
    this._last = now
  }
  getElapsed() { return this._elapsed }
  reset() { this._last = performance.now() }
}

interface Scene3DProps {
  scrollY: number
  mouseX: number
  mouseY: number
}

// CSS fallback when WebGL is unavailable
function FallbackAtmosphere() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: '#0D0D0D' }}>
      {[
        { w: 320, h: 320, top: '8%', left: '70%', op: 0.06, delay: '0s', dur: '12s' },
        { w: 180, h: 180, top: '55%', left: '5%', op: 0.04, delay: '2s', dur: '9s' },
        { w: 240, h: 240, top: '30%', left: '40%', op: 0.03, delay: '4s', dur: '15s' },
        { w: 120, h: 120, top: '80%', left: '75%', op: 0.05, delay: '1s', dur: '11s' },
        { w: 200, h: 200, top: '15%', left: '20%', op: 0.04, delay: '3s', dur: '13s' },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute', width: s.w, height: s.h, top: s.top, left: s.left,
          border: `1px solid rgba(245,245,247,${s.op * 2})`,
          background: `rgba(245,245,247,${s.op})`,
          backdropFilter: 'blur(4px)',
          borderRadius: i % 2 === 0 ? '50%' : '0',
          animation: `cssFloat${i % 3} ${s.dur} ease-in-out infinite`,
          animationDelay: s.delay,
        }} />
      ))}
      <style>{`
        @keyframes cssFloat0{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-18px) rotate(4deg)}}
        @keyframes cssFloat1{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-24px) rotate(-3deg)}}
        @keyframes cssFloat2{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(6deg)}}
      `}</style>
    </div>
  )
}

export default function Scene3D({ scrollY, mouseX, mouseY }: Scene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [webglFailed, setWebglFailed] = useState(false)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    shapes: THREE.Mesh[]
    particles: THREE.Points
    fragments: THREE.Mesh[]
    frameId: number
    timer: Timer
    destroyed: boolean
  } | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Check WebGL support before attempting
    const testCanvas = document.createElement('canvas')
    const testCtx = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl')
    if (!testCtx) {
      setWebglFailed(true)
      return
    }
    // Release the test context immediately
    const ext = (testCtx as WebGLRenderingContext).getExtension('WEBGL_lose_context')
    if (ext) ext.loseContext()

    const W = window.innerWidth
    const H = window.innerHeight

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      setWebglFailed(true)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = false

    const canvas = renderer.domElement
    mountRef.current.appendChild(canvas)

    // Handle context loss gracefully
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      setWebglFailed(true)
      const ref = sceneRef.current
      if (ref) { ref.destroyed = true; cancelAnimationFrame(ref.frameId) }
    })

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200)
    camera.position.set(0, 0, 12)

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.18))
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.1)
    dir1.position.set(8, 12, 6)
    scene.add(dir1)
    const dir2 = new THREE.DirectionalLight(0xaaaaaa, 0.35)
    dir2.position.set(-6, -4, 4)
    scene.add(dir2)
    const pt = new THREE.PointLight(0xffffff, 0.7, 40)
    pt.position.set(0, 0, 8)
    scene.add(pt)

    // Shared materials
    const matte = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85, metalness: 0.1 })
    const chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.05, metalness: 0.95 })
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.05, metalness: 0, ior: 1.5, thickness: 0.4, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    const wire = new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true })

    // Fragment assembly shapes
    const fragments: THREE.Mesh[] = []
    const addFrag = (geo: THREE.BufferGeometry, mat: THREE.Material, start: THREE.Vector3, end: THREE.Vector3, rot = new THREE.Euler()) => {
      const m = new THREE.Mesh(geo, mat)
      m.rotation.copy(rot)
      m.userData = { startPos: start, finalPos: end }
      m.position.copy(start)
      scene.add(m)
      fragments.push(m)
    }

    addFrag(new THREE.BoxGeometry(2.2, 2.2, 2.2), matte, new THREE.Vector3(-20, 6, -5), new THREE.Vector3(0, 0, 0), new THREE.Euler(0.3, 0.5, 0.1))
    addFrag(new THREE.SphereGeometry(1.4, 48, 48), glass, new THREE.Vector3(22, -8, -3), new THREE.Vector3(1.2, 0.8, 0.5))
    addFrag(new THREE.TorusGeometry(1.8, 0.18, 24, 80), chrome, new THREE.Vector3(0, 18, -6), new THREE.Vector3(0, 0, 1), new THREE.Euler(1.2, 0.3, 0))
    addFrag(new THREE.OctahedronGeometry(1.6), wire, new THREE.Vector3(-18, -12, -4), new THREE.Vector3(-0.4, -0.5, 0.3))

    // Ambient floating shapes
    const shapes: THREE.Mesh[] = []
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2
      const r = 6 + Math.random() * 5
      const x = Math.cos(angle) * r + (Math.random() - 0.5) * 3
      const y = (Math.random() - 0.5) * 11
      const z = -2 - Math.random() * 7
      const geoms = [
        new THREE.BoxGeometry(0.2 + Math.random() * 0.45, 0.2 + Math.random() * 0.45, 0.2 + Math.random() * 0.45),
        new THREE.SphereGeometry(0.1 + Math.random() * 0.28, 12, 12),
        new THREE.TorusGeometry(0.14 + Math.random() * 0.22, 0.05, 8, 32),
        new THREE.OctahedronGeometry(0.14 + Math.random() * 0.28),
      ]
      const mat = [matte, chrome, glass][i % 3]
      const mesh = new THREE.Mesh(geoms[i % 4], (mat as THREE.Material).clone())
      mesh.position.set(x, y, z)
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      mesh.userData = {
        rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 0.008, (Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.006),
        floatSpeed: 0.3 + Math.random() * 0.6,
        floatOffset: Math.random() * Math.PI * 2,
        floatAmp: 0.07 + Math.random() * 0.16,
        baseY: y,
      }
      scene.add(mesh)
      shapes.push(mesh)
    }

    // Particles
    const pCount = 1200
    const pos = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 48
      pos[i * 3 + 1] = (Math.random() - 0.5) * 38
      pos[i * 3 + 2] = -5 - Math.random() * 18
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x777777, size: 0.045, sizeAttenuation: true, transparent: true, opacity: 0.45 }))
    scene.add(particles)

    const gridHelper = new THREE.GridHelper(60, 50, 0x1e1e1e, 0x181818)
    gridHelper.position.y = -8;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.25
    scene.add(gridHelper)

    const timer = new Timer()

    sceneRef.current = { renderer, scene, camera, shapes, particles, fragments, frameId: 0, timer, destroyed: false }

    function animate() {
      const ref = sceneRef.current
      if (!ref || ref.destroyed) return
      ref.frameId = requestAnimationFrame(animate)
      ref.timer.update()
      const t = ref.timer.getElapsed()

      ref.shapes.forEach(m => {
        const d = m.userData
        m.rotation.x += d.rotSpeed.x
        m.rotation.y += d.rotSpeed.y
        m.rotation.z += d.rotSpeed.z
        m.position.y = d.baseY + Math.sin(t * d.floatSpeed + d.floatOffset) * d.floatAmp
      })
      ref.particles.rotation.y = t * 0.007
      ref.particles.rotation.x = t * 0.003
      ref.fragments.forEach(m => { m.rotation.y += 0.003; m.rotation.x += 0.001 })
      gridHelper.position.y = -8 + Math.sin(t * 0.2) * 0.08

      try { ref.renderer.render(ref.scene, ref.camera) } catch { ref.destroyed = true }
    }

    animate()

    const onResize = () => {
      const ref = sceneRef.current
      if (!ref || ref.destroyed) return
      const W = window.innerWidth, H = window.innerHeight
      ref.camera.aspect = W / H
      ref.camera.updateProjectionMatrix()
      ref.renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      const ref = sceneRef.current
      if (!ref) return
      ref.destroyed = true
      cancelAnimationFrame(ref.frameId)
      try { ref.renderer.dispose() } catch { /* ignore */ }
      if (mountRef.current && canvas.parentNode === mountRef.current) {
        mountRef.current.removeChild(canvas)
      }
      sceneRef.current = null
    }
  }, [])

  // Camera response to scroll + mouse
  useEffect(() => {
    const ref = sceneRef.current
    if (!ref || ref.destroyed) return
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const t = maxScroll > 0 ? scrollY / maxScroll : 0
    ref.camera.position.y = -scrollY * 0.003
    ref.camera.position.z = 12 - scrollY * 0.002
    ref.camera.position.x = mouseX * 0.007
    ref.camera.lookAt(mouseX * 0.002, -scrollY * 0.003 + mouseY * 0.004, 0)
    const assembleT = Math.min(t * 4, 1)
    ref.fragments.forEach(m => {
      if (m.userData.startPos && m.userData.finalPos)
        m.position.lerpVectors(m.userData.startPos, m.userData.finalPos, assembleT)
    })
  }, [scrollY, mouseX, mouseY])

  if (webglFailed) return <FallbackAtmosphere />

  return (
    <div
      ref={mountRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
