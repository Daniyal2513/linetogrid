import { useState, useEffect, useRef, useCallback } from 'react'
import Scene3D from './Scene3D'
import logo from './assets/LINETO BRAND LOGO.png'

/* ─── Data ───────────────────────────────────────────────────── */
const NAV_LINKS = ['Home', 'About Us', 'Our Services', 'Portfolio', 'Contact Us']
const SERVICES = [
  { category: 'Design', items: ['Social Media Creatives', 'CSR Campaigns', 'Branding & Brand Guidelines', 'Packaging Design', 'UI/UX', 'Immersive 3D Web Systems'], icon: '◈', span: 'large' },
  { category: 'Marketing', items: ['Performance Marketing', 'Strategic Visual Campaigns', 'Digital Growth Systems', 'Content Strategy'], icon: '◉', span: 'small' },
  { category: 'Video Production', items: ['Cinematic Editing', 'Post-Production', 'Motion Graphics', 'Visual Storytelling'], icon: '◎', span: 'small' },
]
const PORTFOLIO = [
  { title: 'Monolith Brand Identity', tag: 'Branding', year: '2025', desc: 'Complete visual identity for a Berlin-based architecture firm.' },
  { title: 'Apex UI System', tag: 'UI/UX', year: '2025', desc: 'Design system and digital product for a fintech startup.' },
  { title: 'Forma Campaign', tag: 'Marketing', year: '2024', desc: 'Integrated visual campaign reaching 4.2M impressions.' },
  { title: 'Cipher Motion Reel', tag: 'Video', year: '2024', desc: 'Award-winning motion graphics for a global tech launch.' },
  { title: 'Stratum Packaging', tag: 'Packaging', year: '2024', desc: 'Luxury packaging for a premium skincare collection.' },
  { title: 'Volumen 3D Web', tag: '3D Web', year: '2025', desc: 'Immersive WebGL experience for an art collective.' },
]
const STATS = [
  { value: '240+', label: 'Projects Delivered' },
  { value: '98%', label: 'Client Retention' },
  { value: '12', label: 'Years of Practice' },
  { value: '3', label: 'Global Studios' },
]

/* ─── Scroll-reveal hook ─────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [wasVisible, setWasVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); setWasVisible(true) }
        else if (wasVisible) setVisible(false)
      },
      { threshold: 0.12, rootMargin: '-40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [wasVisible])

  return { ref, visible }
}

/* ─── 3D tilt card ───────────────────────────────────────────── */
function useTilt(ref: React.RefObject<HTMLDivElement | null>) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 50, gy: 50 })
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width
    const y = (e.clientY - top) / height
    setTilt({ x: (y - 0.5) * -18, y: (x - 0.5) * 18, gx: x * 100, gy: y * 100 })
  }, [ref])
  const onLeave = useCallback(() => setTilt({ x: 0, y: 0, gx: 50, gy: 50 }), [])
  return { tilt, onMove, onLeave }
}

function TiltCard({ children, dark = true, style = {} }: { children: React.ReactNode; dark?: boolean; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const { tilt, onMove, onLeave } = useTilt(ref)
  const isResting = tilt.x === 0 && tilt.y === 0
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{
      transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
      transition: isResting ? 'transform 0.6s cubic-bezier(0.23,1,0.32,1)' : 'transform 0.1s ease-out',
      background: dark
        ? `radial-gradient(ellipse at ${tilt.gx}% ${tilt.gy}%, rgba(245,245,247,0.09) 0%, rgba(13,13,13,0.78) 70%)`
        : `radial-gradient(ellipse at ${tilt.gx}% ${tilt.gy}%, rgba(13,13,13,0.1) 0%, rgba(245,245,247,0.82) 70%)`,
      backdropFilter: 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      border: dark ? '1px solid rgba(245,245,247,0.13)' : '1px solid rgba(13,13,13,0.11)',
      boxShadow: dark
        ? `0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(245,245,247,0.07)`
        : `0 8px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.65)`,
      position: 'relative', overflow: 'hidden', willChange: 'transform', ...style,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '38%', background: dark ? 'linear-gradient(180deg,rgba(245,245,247,0.055) 0%,transparent 100%)' : 'linear-gradient(180deg,rgba(255,255,255,0.5) 0%,transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

/* ─── Floating 3D shapes layer ───────────────────────────────── */
type ShapeKind = 'square' | 'ring' | 'diamond' | 'cube' | 'bar'
interface FloatShape { kind: ShapeKind; size: number; top: string; left: string; delay: string; dur: string; opacity: number; rot: number; dark: boolean }

function FloatingShapes({ shapes }: { shapes: FloatShape[] }) {
  return (
    <>
      {shapes.map((s, i) => {
        const border = s.dark ? `1px solid rgba(245,245,247,${s.opacity * 2.2})` : `1px solid rgba(13,13,13,${s.opacity * 2})`
        const bg = s.dark ? `rgba(245,245,247,${s.opacity * 0.6})` : `rgba(13,13,13,${s.opacity * 0.5})`
        const anim = `floatShape${i % 4} ${s.dur} ease-in-out infinite`
        const base: React.CSSProperties = { position: 'absolute', top: s.top, left: s.left, animationDelay: s.delay, animation: anim, pointerEvents: 'none' }

        if (s.kind === 'square' || s.kind === 'cube') return (
          <div key={i} style={{ ...base, width: s.size, height: s.size, border, background: bg, backdropFilter: 'blur(3px)', transform: `rotate(${s.rot}deg)`, boxShadow: s.dark ? `inset 0 1px 0 rgba(245,245,247,0.15), 0 4px 20px rgba(0,0,0,0.3)` : `inset 0 1px 0 rgba(255,255,255,0.5)` }} />
        )
        if (s.kind === 'ring') return (
          <div key={i} style={{ ...base, width: s.size, height: s.size, borderRadius: '50%', border: s.dark ? `1.5px solid rgba(245,245,247,${s.opacity * 3})` : `1.5px solid rgba(13,13,13,${s.opacity * 2.5})`, background: 'transparent', boxShadow: s.dark ? `0 0 14px rgba(245,245,247,0.06), inset 0 0 14px rgba(245,245,247,0.04)` : `0 0 14px rgba(13,13,13,0.06)` }} />
        )
        if (s.kind === 'diamond') return (
          <div key={i} style={{ ...base, width: s.size, height: s.size, border, background: bg, backdropFilter: 'blur(2px)', transform: `rotate(${45 + s.rot}deg)` }} />
        )
        // bar
        return (
          <div key={i} style={{ ...base, width: s.size * 3.5, height: s.size * 0.22, border, background: bg, transform: `rotate(${s.rot}deg)` }} />
        )
      })}
    </>
  )
}

/* ─── Section reveal wrapper ─────────────────────────────────── */
function Reveal({ children, delay = 0, up = false }: { children: React.ReactNode; delay?: number; up?: boolean }) {
  const { ref, visible } = useReveal()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : up ? 'translateY(-32px) scale(0.98)' : 'translateY(36px) scale(0.98)',
      transition: `opacity 0.75s cubic-bezier(0.23,1,0.32,1) ${delay}ms, transform 0.75s cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

/* ─── Hero floating shapes config ───────────────────────────── */
const heroShapes: FloatShape[] = [
  { kind: 'square', size: 90, top: '14%', left: '78%', delay: '0s', dur: '9s', opacity: 0.055, rot: 12, dark: true },
  { kind: 'ring', size: 160, top: '22%', left: '82%', delay: '1.2s', dur: '13s', opacity: 0.06, rot: 0, dark: true },
  { kind: 'diamond', size: 48, top: '62%', left: '75%', delay: '0.5s', dur: '8s', opacity: 0.04, rot: 8, dark: true },
  { kind: 'ring', size: 72, top: '72%', left: '86%', delay: '2s', dur: '11s', opacity: 0.05, rot: 0, dark: true },
  { kind: 'cube', size: 38, top: '38%', left: '88%', delay: '0.8s', dur: '7s', opacity: 0.06, rot: -15, dark: true },
  { kind: 'bar', size: 22, top: '48%', left: '72%', delay: '1.5s', dur: '10s', opacity: 0.04, rot: -22, dark: true },
  { kind: 'square', size: 120, top: '10%', left: '8%', delay: '3s', dur: '14s', opacity: 0.03, rot: 6, dark: true },
  { kind: 'ring', size: 55, top: '55%', left: '3%', delay: '1s', dur: '9s', opacity: 0.04, rot: 0, dark: true },
  { kind: 'diamond', size: 30, top: '80%', left: '12%', delay: '0.4s', dur: '7.5s', opacity: 0.035, rot: 20, dark: true },
]
const servicesShapes: FloatShape[] = [
  { kind: 'ring', size: 200, top: '5%', left: '80%', delay: '0s', dur: '16s', opacity: 0.055, rot: 0, dark: true },
  { kind: 'square', size: 70, top: '15%', left: '88%', delay: '2s', dur: '10s', opacity: 0.05, rot: 22, dark: true },
  { kind: 'diamond', size: 45, top: '60%', left: '85%', delay: '1s', dur: '8s', opacity: 0.045, rot: 10, dark: true },
  { kind: 'ring', size: 90, top: '78%', left: '78%', delay: '0.5s', dur: '12s', opacity: 0.04, rot: 0, dark: true },
  { kind: 'bar', size: 28, top: '42%', left: '84%', delay: '1.8s', dur: '9s', opacity: 0.04, rot: 30, dark: true },
  { kind: 'cube', size: 55, top: '8%', left: '2%', delay: '0.3s', dur: '11s', opacity: 0.04, rot: -18, dark: true },
  { kind: 'ring', size: 120, top: '70%', left: '0%', delay: '2.5s', dur: '15s', opacity: 0.035, rot: 0, dark: true },
]
const contactShapes: FloatShape[] = [
  { kind: 'ring', size: 240, top: '5%', left: '75%', delay: '0s', dur: '18s', opacity: 0.05, rot: 0, dark: true },
  { kind: 'square', size: 80, top: '20%', left: '85%', delay: '1.5s', dur: '11s', opacity: 0.05, rot: 15, dark: true },
  { kind: 'diamond', size: 50, top: '55%', left: '88%', delay: '0.8s', dur: '9s', opacity: 0.045, rot: 5, dark: true },
  { kind: 'ring', size: 110, top: '80%', left: '80%', delay: '3s', dur: '13s', opacity: 0.04, rot: 0, dark: true },
  { kind: 'cube', size: 65, top: '10%', left: '3%', delay: '0.4s', dur: '12s', opacity: 0.04, rot: -20, dark: true },
  { kind: 'ring', size: 150, top: '65%', left: '-2%', delay: '2s', dur: '16s', opacity: 0.035, rot: 0, dark: true },
  { kind: 'bar', size: 24, top: '35%', left: '1%', delay: '1.2s', dur: '8s', opacity: 0.04, rot: -35, dark: true },
  { kind: 'diamond', size: 36, top: '88%', left: '8%', delay: '0.6s', dur: '10s', opacity: 0.035, rot: 25, dark: true },
]

/* ─── Main App ───────────────────────────────────────────────── */
export default function App() {
  const [scrollY, setScrollY] = useState(0)
  const [scrollDir, setScrollDir] = useState<'down' | 'up'>('down')
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrollDir(y > lastScrollY.current ? 'down' : 'up')
      lastScrollY.current = y
      setScrollY(y)
    }
    const onMouse = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth - 0.5) * 2)
      setMouseY((e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouse, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('mousemove', onMouse) }
  }, [])

  const navOpacity = Math.min(scrollY / 80, 1)
  const heroFade = Math.max(0, 1 - scrollY / 420)

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh', position: 'relative' }}>
      <Scene3D scrollY={scrollY} mouseX={mouseX} mouseY={mouseY} />

      {/* ─── Nav ─── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 3rem', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `rgba(13,13,13,${0.42 + navOpacity * 0.44})`, backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)', borderBottom: `1px solid rgba(245,245,247,${0.04 + navOpacity * 0.07})`, transition: 'background 0.4s' }}>
        <img src={logo} alt="" style={{ height: '48px', width: 'auto', display: 'block' }} />
        <div className="hidden md:flex" style={{ gap: '2.5rem', alignItems: 'center' }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} className="font-condensed"
              style={{ fontSize: '0.72rem', fontWeight: 400, letterSpacing: '0.14em', color: 'rgba(245,245,247,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F7')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,245,247,0.55)')}
            >{l.toUpperCase()}</a>
          ))}
        </div>
        <button className="hidden md:block font-condensed"
          style={{ fontSize: '0.68rem', letterSpacing: '0.16em', fontWeight: 500, color: '#0D0D0D', background: '#F5F5F7', border: 'none', padding: '0.55rem 1.4rem', cursor: 'pointer', transition: 'all 0.25s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#0D0D0D'; e.currentTarget.style.color = '#F5F5F7'; e.currentTarget.style.outline = '1px solid rgba(245,245,247,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F7'; e.currentTarget.style.color = '#0D0D0D'; e.currentTarget.style.outline = 'none' }}
        >GET IN TOUCH</button>
        <button className="md:hidden" style={{ background: 'none', border: 'none', color: '#F5F5F7', cursor: 'pointer', fontSize: '1.3rem' }} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '≡'}
        </button>
      </nav>
      {menuOpen && (
        <div style={{ position: 'fixed', top: '68px', left: 0, right: 0, zIndex: 99, background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(245,245,247,0.08)', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} onClick={() => setMenuOpen(false)} className="font-condensed"
              style={{ fontSize: '0.82rem', letterSpacing: '0.14em', color: 'rgba(245,245,247,0.7)', textDecoration: 'none', fontWeight: 500 }}
            >{l.toUpperCase()}</a>
          ))}
        </div>
      )}

      <main style={{ position: 'relative', zIndex: 10 }}>

        {/* ══ 1. HERO — DARK ══ */}
        <section id="home" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 4rem 5.5rem', position: 'relative', background: 'transparent', overflow: 'hidden' }}>
          {/* Floating 3D shapes layer */}
          <FloatingShapes shapes={heroShapes} />

          {/* Parallax depth rings behind hero text */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) translateX(${mouseX * 12}px) translateY(${mouseY * 8}px)`, pointerEvents: 'none', zIndex: 0 }}>
            {[300, 450, 600].map((sz, i) => (
              <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: sz, height: sz, borderRadius: '50%', border: `1px solid rgba(245,245,247,${0.035 - i * 0.008})`, animation: `spin${i % 2 === 0 ? 'CW' : 'CCW'} ${28 + i * 14}s linear infinite` }} />
            ))}
          </div>

          <div style={{ position: 'relative', zIndex: 2, opacity: heroFade, transform: `translateY(${scrollY * 0.18}px)` }}>
            <div className="font-condensed" style={{ fontSize: '0.68rem', letterSpacing: '0.38em', color: 'rgba(245,245,247,0.35)', marginBottom: '2rem' }}>
              LINETOGRID PRODUCTION — EST. 2013
            </div>
            <h1 className="font-condensed" style={{ fontSize: 'clamp(3.4rem, 7vw, 6.4rem)', fontWeight: 600, letterSpacing: '0.015em', lineHeight: 1.02, color: '#F5F5F7', margin: '0 0 1.8rem', maxWidth: '860px' }}>
              Organizing visual<br />elements into a unified,<br />high-impact whole.
            </h1>
            <p style={{ fontSize: '0.9rem', fontWeight: 300, lineHeight: 1.78, color: 'rgba(245,245,247,0.52)', maxWidth: '420px', margin: '0 0 2.6rem' }}>
              A design and production agency that transforms fragments into systems, ideas into identity, and strategy into sensation.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="font-condensed" style={{ fontSize: '0.7rem', letterSpacing: '0.18em', fontWeight: 500, color: '#0D0D0D', background: '#F5F5F7', border: 'none', padding: '0.9rem 2.2rem', cursor: 'pointer', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,245,247,0.85)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F7'; e.currentTarget.style.transform = 'translateY(0)' }}>VIEW PORTFOLIO</button>
              <button className="font-condensed" style={{ fontSize: '0.7rem', letterSpacing: '0.18em', fontWeight: 400, color: 'rgba(245,245,247,0.62)', background: 'transparent', border: '1px solid rgba(245,245,247,0.18)', padding: '0.9rem 2.2rem', cursor: 'pointer', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F7'; e.currentTarget.style.borderColor = 'rgba(245,245,247,0.42)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,245,247,0.62)'; e.currentTarget.style.borderColor = 'rgba(245,245,247,0.18)' }}>OUR PROCESS</button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={{ position: 'absolute', right: '4rem', bottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', opacity: heroFade * 0.45, transition: 'opacity 0.3s' }}>
            <span className="font-condensed" style={{ fontSize: '0.56rem', letterSpacing: '0.26em', color: 'rgba(245,245,247,0.4)', writingMode: 'vertical-rl' }}>SCROLL</span>
            <div style={{ width: '1px', height: '52px', background: 'linear-gradient(to bottom,rgba(245,245,247,0.38),transparent)', animation: 'pulseBar 2s ease-in-out infinite' }} />
          </div>
        </section>

        {/* Stats bar */}
        <div style={{ padding: '0 4rem', background: 'rgba(13,13,13,0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(245,245,247,0.07)', borderBottom: '1px solid rgba(245,245,247,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', maxWidth: '1200px', margin: '0 auto' }}>
            {STATS.map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ padding: '2rem', borderRight: i < 3 ? '1px solid rgba(245,245,247,0.07)' : 'none' }}>
                  <div className="font-condensed" style={{ fontSize: '2.4rem', fontWeight: 600, color: '#F5F5F7', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 300, letterSpacing: '0.1em', color: 'rgba(245,245,247,0.38)', marginTop: '0.45rem' }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ══ 2. ABOUT — LIGHT ══ */}
        <section id="about-us" style={{ padding: '9rem 4rem', position: 'relative', background: '#F5F5F7', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(228,228,232,0.92) 0%,rgba(245,245,247,0.98) 60%)', zIndex: 0 }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(13,13,13,0.07) 1px,transparent 1px)', backgroundSize: '28px 28px', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center' }}>
              <div>
                <Reveal><div className="font-condensed" style={{ fontSize: '0.65rem', letterSpacing: '0.35em', color: 'rgba(13,13,13,0.35)', marginBottom: '1.8rem' }}>01 — ABOUT US</div></Reveal>
                <Reveal delay={80}>
                  <h2 className="font-condensed" style={{ fontSize: 'clamp(2rem,3.2vw,3.2rem)', fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1.06, color: '#0D0D0D', margin: '0 0 1.8rem' }}>The LINETOGRID<br />Philosophy</h2>
                </Reveal>
                <Reveal delay={160}>
                  <p style={{ fontSize: '0.92rem', fontWeight: 300, lineHeight: 1.82, color: 'rgba(13,13,13,0.65)', margin: '0 0 1.2rem' }}>
                    Originating from the German word for "form" or "shape," LINETOGRID design arranges visual components so the human mind perceives a single, powerful whole rather than isolated fragments.
                  </p>
                  <p style={{ fontSize: '0.92rem', fontWeight: 300, lineHeight: 1.82, color: 'rgba(13,13,13,0.5)', margin: '0 0 2.6rem' }}>
                    We apply this principle to every project — proximity, closure, continuity, and visual unity working as one coherent system.
                  </p>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    {['Proximity', 'Closure', 'Unity', 'Continuity'].map(p => (
                      <div key={p}><div className="font-condensed" style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(13,13,13,0.3)', marginBottom: '0.35rem' }}>{p.toUpperCase()}</div><div style={{ width: '28px', height: '1px', background: 'rgba(13,13,13,0.22)' }} /></div>
                    ))}
                  </div>
                </Reveal>
              </div>
              <Reveal delay={120} up>
                <div style={{ position: 'relative', height: '380px' }}>
                  {[{ w: 110, h: 110, top: '8%', left: '4%', d: '0s', op: 0.22, i: 0 }, { w: 72, h: 72, top: '4%', left: '44%', d: '0.4s', op: 0.14, i: 1 }, { w: 150, h: 95, top: '38%', left: '22%', d: '0.8s', op: 0.28, i: 2 }, { w: 64, h: 64, top: '65%', left: '6%', d: '0.2s', op: 0.12, i: 0 }, { w: 85, h: 120, top: '32%', left: '63%', d: '0.6s', op: 0.2, i: 1 }, { w: 48, h: 48, top: '70%', left: '62%', d: '1s', op: 0.1, i: 2 }].map((b, idx) => (
                    <div key={idx} style={{ position: 'absolute', width: b.w, height: b.h, top: b.top, left: b.left, background: `rgba(13,13,13,${b.op * 0.22})`, border: `1px solid rgba(13,13,13,${b.op * 0.8})`, backdropFilter: 'blur(6px)', animation: `float${b.i} ${4 + idx * 0.3}s ease-in-out infinite`, animationDelay: b.d }} />
                  ))}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '88px', height: '88px', background: 'rgba(13,13,13,0.06)', border: '1px solid rgba(13,13,13,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(16px)' }}>
                    <span className="font-condensed" style={{ fontSize: '1.9rem', fontWeight: 600, color: 'rgba(13,13,13,0.85)' }}>L</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ 3. SERVICES — DARK ══ */}
        <section id="our-services" style={{ padding: '9rem 4rem', position: 'relative', background: '#0D0D0D', overflow: 'hidden' }}>
          <FloatingShapes shapes={servicesShapes} />
          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
              <Reveal>
                <div>
                  <div className="font-condensed" style={{ fontSize: '0.65rem', letterSpacing: '0.35em', color: 'rgba(245,245,247,0.3)', marginBottom: '1.2rem' }}>02 — OUR SERVICES</div>
                  <h2 className="font-condensed" style={{ fontSize: 'clamp(2rem,3.2vw,3.2rem)', fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1.06, color: '#F5F5F7', margin: 0 }}>Capabilities Built<br />for Impact</h2>
                </div>
              </Reveal>
              <Reveal delay={100} up>
                <p style={{ fontSize: '0.82rem', fontWeight: 300, lineHeight: 1.75, color: 'rgba(245,245,247,0.4)', maxWidth: '280px', margin: 0 }}>Every discipline unified under a single strategic vision — no silos, no fragmentation.</p>
              </Reveal>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: '16px' }}>
              {SERVICES.map((svc, i) => (
                <Reveal key={i} delay={i * 100}>
                  <TiltCard dark style={{ gridColumn: i === 0 ? '1' : undefined, gridRow: i === 0 ? '1 / 3' : undefined, padding: '2.8rem', cursor: 'default', height: '100%' }}>
                    <div className="font-condensed" style={{ fontSize: '1.5rem', color: 'rgba(245,245,247,0.18)', marginBottom: '1.8rem', lineHeight: 1 }}>{svc.icon}</div>
                    <div className="font-condensed" style={{ fontSize: '0.6rem', letterSpacing: '0.28em', color: 'rgba(245,245,247,0.28)', marginBottom: '0.6rem' }}>{svc.category.toUpperCase()}</div>
                    <h3 className="font-condensed" style={{ fontSize: i === 0 ? '1.7rem' : '1.35rem', fontWeight: 500, color: '#F5F5F7', margin: '0 0 1.8rem', lineHeight: 1.1 }}>{svc.category}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                      {svc.items.map(item => (
                        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '4px', height: '4px', background: 'rgba(245,245,247,0.22)', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.83rem', fontWeight: 300, color: 'rgba(245,245,247,0.58)' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    {i === 0 && <div style={{ marginTop: '3rem', display: 'flex', gap: '0.7rem', alignItems: 'flex-end' }}><div style={{ width: 30, height: 30, border: '1px solid rgba(245,245,247,0.12)' }} /><div style={{ width: 18, height: 18, border: '1px solid rgba(245,245,247,0.09)', marginBottom: '6px' }} /><div style={{ width: 38, height: 13, border: '1px solid rgba(245,245,247,0.1)', marginBottom: '9px' }} /></div>}
                  </TiltCard>
                </Reveal>
              ))}
              <div style={{ gridColumn: '2 / 4', background: 'rgba(245,245,247,0.03)', border: '1px solid rgba(245,245,247,0.07)', backdropFilter: 'blur(16px)', padding: '1.8rem 2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <span className="font-condensed" style={{ fontSize: '0.62rem', letterSpacing: '0.24em', color: 'rgba(245,245,247,0.28)' }}>FULL CAPABILITY DECK AVAILABLE ON REQUEST</span>
                <button className="font-condensed" style={{ fontSize: '0.62rem', letterSpacing: '0.18em', color: 'rgba(245,245,247,0.6)', background: 'transparent', border: '1px solid rgba(245,245,247,0.18)', padding: '0.52rem 1.2rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F7'; e.currentTarget.style.borderColor = 'rgba(245,245,247,0.45)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,245,247,0.6)'; e.currentTarget.style.borderColor = 'rgba(245,245,247,0.18)' }}>REQUEST DECK →</button>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 4. PORTFOLIO — LIGHT ══ */}
        <section id="portfolio" style={{ padding: '9rem 4rem', position: 'relative', background: '#F5F5F7', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(232,232,236,0.95) 0%,rgba(245,245,247,1) 60%)', zIndex: 0 }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(13,13,13,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(13,13,13,0.05) 1px,transparent 1px)', backgroundSize: '48px 48px', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
              <Reveal>
                <div>
                  <div className="font-condensed" style={{ fontSize: '0.65rem', letterSpacing: '0.35em', color: 'rgba(13,13,13,0.32)', marginBottom: '1.2rem' }}>03 — PORTFOLIO</div>
                  <h2 className="font-condensed" style={{ fontSize: 'clamp(2rem,3.2vw,3.2rem)', fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1.06, color: '#0D0D0D', margin: 0 }}>Selected Works</h2>
                </div>
              </Reveal>
              <Reveal delay={80} up><span style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(13,13,13,0.38)' }}>2024 — 2025</span></Reveal>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
              {PORTFOLIO.map((project, i) => (
                <Reveal key={i} delay={i * 70}>
                  <TiltCard dark={false} style={{ padding: 0, cursor: 'pointer' }}>
                    <div style={{ width: '100%', paddingBottom: '58%', position: 'relative', background: 'rgba(13,13,13,0.06)', borderBottom: '1px solid rgba(13,13,13,0.09)', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '52%', height: '62%', border: '1px solid rgba(13,13,13,0.12)', background: 'rgba(13,13,13,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="font-condensed" style={{ fontSize: '2.2rem', fontWeight: 600, color: 'rgba(13,13,13,0.07)' }}>{String(i + 1).padStart(2, '0')}</span>
                        </div>
                      </div>
                      <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem' }}>
                        <span className="font-condensed" style={{ fontSize: '0.57rem', letterSpacing: '0.18em', color: 'rgba(13,13,13,0.5)', background: 'rgba(245,245,247,0.75)', border: '1px solid rgba(13,13,13,0.1)', padding: '0.18rem 0.5rem', backdropFilter: 'blur(8px)' }}>{project.tag.toUpperCase()}</span>
                      </div>
                    </div>
                    <div style={{ padding: '1.8rem 2rem 2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.55rem' }}>
                        <h3 className="font-condensed" style={{ fontSize: '1.05rem', fontWeight: 500, letterSpacing: '0.03em', color: '#0D0D0D', margin: 0, lineHeight: 1.2 }}>{project.title}</h3>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(13,13,13,0.3)', fontWeight: 300, flexShrink: 0, marginLeft: '0.8rem' }}>{project.year}</span>
                      </div>
                      <p style={{ fontSize: '0.79rem', fontWeight: 300, color: 'rgba(13,13,13,0.52)', lineHeight: 1.65, margin: 0 }}>{project.desc}</p>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 5. CONTACT + FOOTER — DARK ══ */}
        <section id="contact-us" style={{ position: 'relative', background: '#0D0D0D', overflow: 'hidden' }}>
          <FloatingShapes shapes={contactShapes} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(245,245,247,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,245,247,0.04) 1px,transparent 1px)', backgroundSize: '56px 56px', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '900px', height: '450px', background: 'radial-gradient(ellipse,rgba(245,245,247,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '9rem 4rem 0' }}>
            <Reveal>
              <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                <div className="font-condensed" style={{ fontSize: '0.65rem', letterSpacing: '0.35em', color: 'rgba(245,245,247,0.3)', marginBottom: '1.6rem' }}>04 — CONTACT US</div>
                <h2 className="font-condensed" style={{ fontSize: 'clamp(2.4rem,4.8vw,4.2rem)', fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1.04, color: '#F5F5F7', margin: '0 0 1.6rem' }}>
                  Begin Something<br />Exceptional
                </h2>
                <p style={{ fontSize: '0.9rem', fontWeight: 300, lineHeight: 1.78, color: 'rgba(245,245,247,0.48)', maxWidth: '440px', margin: '0 auto' }}>
                  Whether you have a fully formed brief or a single raw idea — we assemble the vision from here.
                </p>
              </div>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '6rem', alignItems: 'start' }}>
              <Reveal delay={80}>
                <TiltCard dark style={{ padding: '2.8rem' }}>
                  <div className="font-condensed" style={{ fontSize: '0.62rem', letterSpacing: '0.28em', color: 'rgba(245,245,247,0.3)', marginBottom: '1.8rem' }}>SEND A BRIEF</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.6rem' }}>
                    {['Full Name', 'Email Address', 'Company / Project'].map(ph => (
                      <input key={ph} type={ph === 'Email Address' ? 'email' : 'text'} placeholder={ph}
                        style={{ background: 'rgba(245,245,247,0.04)', border: '1px solid rgba(245,245,247,0.1)', color: '#F5F5F7', padding: '0.85rem 1.1rem', fontSize: '0.82rem', fontWeight: 300, fontFamily: 'Barlow, sans-serif', outline: 'none', width: '100%', transition: 'border-color 0.2s' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,245,247,0.38)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,245,247,0.1)')} />
                    ))}
                    <textarea placeholder="Tell us about your project..." rows={4}
                      style={{ background: 'rgba(245,245,247,0.04)', border: '1px solid rgba(245,245,247,0.1)', color: '#F5F5F7', padding: '0.85rem 1.1rem', fontSize: '0.82rem', fontWeight: 300, fontFamily: 'Barlow, sans-serif', outline: 'none', width: '100%', resize: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,245,247,0.38)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,245,247,0.1)')} />
                  </div>
                  <button className="font-condensed" style={{ width: '100%', fontSize: '0.72rem', letterSpacing: '0.2em', fontWeight: 500, color: '#0D0D0D', background: '#F5F5F7', border: 'none', padding: '1rem', cursor: 'pointer', transition: 'all 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,245,247,0.85)'; e.currentTarget.style.letterSpacing = '0.26em' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F7'; e.currentTarget.style.letterSpacing = '0.2em' }}>SEND BRIEF →</button>
                </TiltCard>
              </Reveal>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Reveal delay={140}>
                  <TiltCard dark style={{ padding: '2.2rem' }}>
                    <div className="font-condensed" style={{ fontSize: '0.6rem', letterSpacing: '0.26em', color: 'rgba(245,245,247,0.28)', marginBottom: '1.2rem' }}>LOCATION</div>
                    <div style={{ width: '100%', height: '110px', position: 'relative', marginBottom: '1.2rem', background: 'rgba(245,245,247,0.03)', border: '1px solid rgba(245,245,247,0.07)', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(245,245,247,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(245,245,247,0.06) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
                      <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, height: '1px', background: 'rgba(245,245,247,0.15)' }} />
                      <div style={{ position: 'absolute', top: '70%', left: 0, right: 0, height: '1px', background: 'rgba(245,245,247,0.08)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '35%', width: '1px', background: 'rgba(245,245,247,0.12)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '65%', width: '1px', background: 'rgba(245,245,247,0.07)' }} />
                      <div style={{ position: 'absolute', top: '28%', left: '34%', transform: 'translate(-50%,-50%)' }}>
                        <div style={{ width: '10px', height: '10px', background: '#F5F5F7', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', boxShadow: '0 0 8px rgba(245,245,247,0.5)' }} />
                      </div>
                      <span className="font-condensed" style={{ position: 'absolute', bottom: '0.5rem', right: '0.6rem', fontSize: '0.52rem', letterSpacing: '0.18em', color: 'rgba(245,245,247,0.25)' }}>LINETOGRID HQ</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 300, color: 'rgba(245,245,247,0.65)', lineHeight: 1.6 }}>
                      Studio 4B, The Collective Building<br />
                      <span style={{ color: 'rgba(245,245,247,0.4)' }}>Mitte District, Berlin 10117, DE</span>
                    </div>
                  </TiltCard>
                </Reveal>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Reveal delay={180}>
                    <TiltCard dark style={{ padding: '1.8rem' }}>
                      <div style={{ width: '32px', height: '32px', border: '1px solid rgba(245,245,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(245,245,247,0.5)' }}>✆</span>
                      </div>
                      <div className="font-condensed" style={{ fontSize: '0.58rem', letterSpacing: '0.24em', color: 'rgba(245,245,247,0.28)', marginBottom: '0.5rem' }}>PHONE</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 300, color: 'rgba(245,245,247,0.72)', lineHeight: 1.6 }}>
                        +49 30 1234 5678<br /><span style={{ color: 'rgba(245,245,247,0.38)', fontSize: '0.75rem' }}>+49 30 8765 4321</span>
                      </div>
                    </TiltCard>
                  </Reveal>
                  <Reveal delay={220}>
                    <TiltCard dark style={{ padding: '1.8rem' }}>
                      <div style={{ width: '32px', height: '32px', border: '1px solid rgba(245,245,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(245,245,247,0.5)' }}>✉</span>
                      </div>
                      <div className="font-condensed" style={{ fontSize: '0.58rem', letterSpacing: '0.24em', color: 'rgba(245,245,247,0.28)', marginBottom: '0.5rem' }}>EMAIL</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 300, color: 'rgba(245,245,247,0.72)', lineHeight: 1.6 }}>
                        hello@gestalt.studio<br /><span style={{ color: 'rgba(245,245,247,0.38)', fontSize: '0.72rem' }}>press@gestalt.studio</span>
                      </div>
                    </TiltCard>
                  </Reveal>
                </div>
                <Reveal delay={260}>
                  <TiltCard dark style={{ padding: '1.8rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <div className="font-condensed" style={{ fontSize: '0.58rem', letterSpacing: '0.24em', color: 'rgba(245,245,247,0.28)', marginBottom: '0.8rem' }}>STUDIO HOURS</div>
                        {[['Mon – Fri', '09:00 – 19:00'], ['Saturday', '10:00 – 15:00'], ['Sunday', 'Closed']].map(([day, time]) => (
                          <div key={day} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 300, color: 'rgba(245,245,247,0.45)' }}>{day}</span>
                            <span style={{ fontSize: '0.76rem', fontWeight: 300, color: 'rgba(245,245,247,0.62)' }}>{time}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="font-condensed" style={{ fontSize: '0.58rem', letterSpacing: '0.24em', color: 'rgba(245,245,247,0.28)', marginBottom: '0.8rem' }}>FOLLOW US</div>
                        {['Instagram', 'Behance', 'LinkedIn', 'Dribbble'].map(s => (
                          <a key={s} href="#" style={{ display: 'block', fontSize: '0.76rem', fontWeight: 300, color: 'rgba(245,245,247,0.45)', textDecoration: 'none', marginBottom: '0.38rem', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F7')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,245,247,0.45)')}>↗ {s}</a>
                        ))}
                      </div>
                    </div>
                  </TiltCard>
                </Reveal>
              </div>
            </div>

            {/* Footer bottom */}
            <div style={{ borderTop: '1px solid rgba(245,245,247,0.08)', padding: '2.5rem 0 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.2rem' }}>
              <div>
                <div className="font-condensed" style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.28em', color: '#F5F5F7', marginBottom: '0.3rem' }}>
                  <img src={logo} alt="LineToGrid" style={{ height: '48px', width: 'auto', display: 'block' }} />
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 300, color: 'rgba(245,245,247,0.25)' }}>Design & Production Studio — Berlin</div>
              </div>
              <div style={{ display: 'flex', gap: '2.2rem', flexWrap: 'wrap' }}>
                {['Privacy Policy', 'Terms of Use', 'Cookie Settings', 'Imprint'].map(link => (
                  <a key={link} href="#" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(245,245,247,0.28)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(245,245,247,0.65)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,245,247,0.28)')}>{link}</a>
                ))}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 300, color: 'rgba(245,245,247,0.2)' }}>© 2025 LINETOGRID PRODUCTION. ALL RIGHTS RESERVED.</span>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Global keyframes ─── */}
      <style>{`
        @keyframes float0{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-9px) rotate(2deg)}}
        @keyframes float1{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-13px) rotate(-1.5deg)}}
        @keyframes float2{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-7px) rotate(2.5deg)}}
        @keyframes floatShape0{0%,100%{transform:translateY(0px) rotate(var(--r,0deg))}50%{transform:translateY(-16px) rotate(var(--r,0deg))}}
        @keyframes floatShape1{0%,100%{transform:translateY(0px)}50%{transform:translateY(-22px)}}
        @keyframes floatShape2{0%,100%{transform:translateY(0px)}33%{transform:translateY(-10px)}66%{transform:translateY(-18px)}}
        @keyframes floatShape3{0%,100%{transform:translateY(0px) scale(1)}50%{transform:translateY(-14px) scale(1.04)}}
        @keyframes spinCW{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes spinCCW{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(-360deg)}}
        @keyframes pulseBar{0%,100%{opacity:0.4;transform:scaleY(1)}50%{opacity:0.8;transform:scaleY(1.12)}}
        input::placeholder,textarea::placeholder{color:rgba(245,245,247,0.26);}
        @media(max-width:900px){
          section { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
        }
      `}</style>

      {/* Invisible: track scroll direction for potential future use */}
      <div style={{ display: 'none' }}>{scrollDir}</div>
    </div>
  )
}
