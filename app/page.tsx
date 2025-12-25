"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import styles from "./qase.module.css"

// ====== Σ : SYMBOL SPACE ======
const Σ = {
  K: Symbol(),
  A: Symbol(),
  I: Symbol(),
  N: Symbol(),
  R: Symbol(),
  Q: Symbol(),
  Θ: Symbol(),
}

// ====== Ω : OPERATORS ======
const Ω: Record<symbol, (v: number, t?: number) => number> = {
  [Σ.K]: (v) => ((v << 1) ^ 0x9e3779b9) >>> 0,
  [Σ.A]: (v) => (v + ((v & 15) + 1)) >>> 0,
  [Σ.I]: (v) => (v ^ 0xa5a5a5a5) >>> 0,
  [Σ.N]: (v) => ~v >>> 0,
  [Σ.R]: (v, t = 1) => ((v * (t + 7)) % 2147483647) >>> 0,
  [Σ.Q]: (v) => ((v >>> 5) | (v << 27)) >>> 0,
  [Σ.Θ]: (v) => ((v ^ (v >>> 16)) * 0x45d9f3b) >>> 0,
}

// ====== Δ : INTERPRETER ======
function Δ(chain: symbol[], seed: number, t = 1) {
  let v = seed >>> 0
  for (const g of chain) v = (Ω[g]?.(v, t) ?? v) >>> 0
  return v >>> 0
}

// ====== Ψ : ENTROPY ======
function Ψ() {
  const u = new Uint32Array(4)
  crypto.getRandomValues(u)
  return Array.from(u).reduce((a, b) => a ^ b, Date.now() >>> 0) >>> 0
}

// ====== Ϟ : SEAL ======
function Ϟ(bytes: Uint8Array) {
  let h = 2166136261 >>> 0
  for (const b of bytes) {
    h ^= b
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return h >>> 0
}

// ====== Λ : LICENSE CORE ======
const Λ = (() => {
  const ghost = new TextEncoder().encode(
    String.fromCharCode(
      73,
      98,
      114,
      97,
      104,
      105,
      109,
      32,
      78,
      97,
      105,
      102,
      101,
      32,
      73,
      98,
      114,
      97,
      104,
      105,
      109,
      32,
      72,
      97,
      115,
      115,
      97,
      110,
      32,
      71,
      104,
      111,
      110,
      101,
      109,
      124,
      69,
      76,
      84,
      72,
      51,
      76,
      65,
      66,
      95,
      95,
      64,
      104,
      111,
      116,
      109,
      97,
      105,
      108,
      46,
      99,
      111,
      109,
    ),
  )
  return Ϟ(ghost)
})()

// ====== ☍ : WATERMARK ======
function watermark(v: number) {
  return ((v ^ Λ) * 0x27d4eb2d) >>> 0
}

// ====== ✶ : AWAKEN ======
function awaken() {
  const seed = Ψ()
  const t = Math.floor(performance.now())
  const chain = [Σ.K, Σ.A, Σ.I, Σ.R, Σ.Q, Σ.Θ]
  const core = Δ(chain, seed, t)
  return watermark(core)
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  hue: number
  glow: number
  rotation: number
  rotationSpeed: number
}

const createParticle = (centerX: number, centerY: number): Particle => {
  const angle = Math.random() * Math.PI * 2
  const velocity = Math.random() * 3 + 2
  return {
    x: centerX,
    y: centerY,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity - 1,
    life: 1,
    size: Math.random() * 4 + 1.5,
    hue: Math.random() * 120 + 180,
    glow: Math.random() * 0.8 + 0.4,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.1,
  }
}

const computeEntropy = (value: number): number => {
  let ones = 0
  let v = value
  while (v) {
    ones += v & 1
    v >>= 1
  }
  return (ones / 32) * 100
}

const getStatistics = (value: number) => {
  const binary = value.toString(2).padStart(32, "0")
  const ones = binary.split("1").length - 1
  const zeros = 32 - ones
  const transitions = binary.split("").filter((_, i) => binary[i] !== binary[i + 1]).length
  return { ones, zeros, transitions }
}

export default function QASE() {
  const [v, setV] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])
  const [showInfo, setShowInfo] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    setV(awaken())
  }, [])

  useEffect(() => {
    const canvas = particleCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const animate = () => {
      // Semi-transparent background for trail effect
      ctx.fillStyle = "rgba(5, 10, 20, 0.08)"
      ctx.fillRect(0, 0, width, height)

      setParticles((prev) => {
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.985,
            vy: p.vy * 0.985 + 0.08,
            life: p.life - 0.012,
            rotation: p.rotation + p.rotationSpeed,
            glow: p.life > 0.7 ? p.glow : p.glow * 0.9,
          }))
          .filter((p) => p.life > 0 && p.y < height + 100)

        // Render particles with advanced effects
        updated.forEach((p) => {
          const opacity = Math.pow(p.life, 1.2) * 0.7

          // Main particle
          ctx.fillStyle = `hsla(${p.hue}, 100%, ${50 + p.life * 20}%, ${opacity})`
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()

          // Outer glow ring
          ctx.strokeStyle = `hsla(${p.hue}, 100%, 60%, ${opacity * p.glow * 0.6})`
          ctx.lineWidth = p.size * 0.8
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size + 2, 0, Math.PI * 2)
          ctx.stroke()

          // Secondary glow
          ctx.strokeStyle = `hsla(${p.hue + 30}, 100%, 50%, ${opacity * 0.3})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size + 5, 0, Math.PI * 2)
          ctx.stroke()
        })

        return updated
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const handleClick = useCallback(async () => {
    setIsGenerating(true)

    // Simulate quantum processing delay for immersion
    await new Promise((resolve) => setTimeout(resolve, 100))

    const newValue = awaken()
    setV(newValue)
    setHistory((prev) => [newValue, ...prev.slice(0, 9)])

    const canvas = particleCanvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // Create multiple bursts for dramatic effect
      setParticles((prev) => [...prev, ...Array.from({ length: 20 }, () => createParticle(centerX, centerY))])
    }

    setIsGenerating(false)
  }, [])

  const handleCopy = useCallback(async () => {
    const hexValue = v.toString(16).slice(0, 8).toUpperCase()
    try {
      await navigator.clipboard.writeText(hexValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy")
    }
  }, [v])

  const hexValue = useMemo(() => v.toString(16).slice(0, 8).toUpperCase(), [v])
  const decimalValue = useMemo(() => v.toString(), [v])
  const binaryValue = useMemo(() => v.toString(2).padStart(32, "0"), [v])
  const entropy = useMemo(() => computeEntropy(v), [v])
  const stats = useMemo(() => getStatistics(v), [v])
  const glow = useMemo(() => ((v & 255) / 255) * 0.8 + 0.2, [v])

  return (
    <main className={styles.container}>
      <canvas ref={particleCanvasRef} className={styles.particleCanvas} />

      <div className={styles.gridBackground} />

      <div
        className={styles.backdrop}
        style={{
          opacity: glow,
          background: `radial-gradient(circle at center, hsla(200, 100%, ${30 + entropy * 0.3}%, ${glow * 0.9}), transparent 70%)`,
        }}
      />

      <div className={styles.content}>
        <div
          className={`${styles.coreContainer} ${isGenerating ? styles.generating : ""}`}
          onClick={!isGenerating ? handleClick : undefined}
        >
          <div className={styles.coreGlowOuter} />
          <div className={styles.coreGlowInner} />

          <div className={styles.core}>
            <div className={styles.label}>QASE ∴</div>
            <div className={styles.title}>QUANTUM ASSERTION</div>
            <div className={styles.subtitle}>of Stable Existence</div>
            <div className={styles.value}>{hexValue}</div>
            <div className={styles.hint}>{isGenerating ? "Generating..." : "Click to regenerate"}</div>
          </div>

          <div className={styles.quantumIndicator}>
            <div className={styles.quantumPulse} />
            <span>Quantum State Active</span>
          </div>
        </div>

        <div className={`${styles.infoPanel} ${showInfo ? styles.visible : ""}`}>
          <button
            className={styles.infoToggle}
            onClick={() => setShowInfo(!showInfo)}
            aria-label="Toggle information panel"
          >
            <span className={styles.toggleIcon}>{showInfo ? "▼" : "▶"}</span>
          </button>

          {showInfo && (
            <div className={styles.infoContent}>
              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Core Values</h3>
                <div className={styles.infoRow}>
                  <span className={styles.label}>HEX</span>
                  <span className={styles.value}>{hexValue}</span>
                  <button className={styles.copyBtn} onClick={handleCopy} aria-label="Copy hex value">
                    {copied ? "✓" : "⎘"}
                  </button>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>DEC</span>
                  <span className={styles.mono}>{decimalValue}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>BIN</span>
                  <span className={styles.mono}>{binaryValue}</span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Quantum Metrics</h3>
                <div className={styles.metricsGrid}>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Entropy</div>
                    <div className={styles.metricValue}>{entropy.toFixed(1)}%</div>
                    <div className={styles.metricBar}>
                      <div className={styles.metricFill} style={{ width: `${entropy}%` }} />
                    </div>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Ones</div>
                    <div className={styles.metricValue}>{stats.ones}/32</div>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Zeros</div>
                    <div className={styles.metricValue}>{stats.zeros}/32</div>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Transitions</div>
                    <div className={styles.metricValue}>{stats.transitions}</div>
                  </div>
                </div>
              </div>

              <div className={styles.divider} />

              {history.length > 0 && (
                <div className={styles.infoSection}>
                  <h3 className={styles.sectionTitle}>Generation History</h3>
                  <div className={styles.historyList}>
                    {history.map((val, idx) => (
                      <div key={idx} className={styles.historyItem}>
                        <span className={styles.historyIndex}>#{idx + 1}</span>
                        <span className={styles.historyValue}>{val.toString(16).slice(0, 8).toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
