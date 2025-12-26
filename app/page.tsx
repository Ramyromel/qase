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
  trail: Array<{ x: number; y: number }>
}

const createParticle = (centerX: number, centerY: number, entropy: number): Particle => {
  const angle = Math.random() * Math.PI * 2
  const velocity = Math.random() * 4 + 2
  const hues = [200, 240, 280, 320, 0]
  return {
    x: centerX,
    y: centerY,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity - 1.5,
    life: 1,
    size: Math.random() * 5 + 2,
    hue: hues[Math.floor(Math.random() * hues.length)],
    glow: Math.random() * 1 + 0.6,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    trail: [],
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
  let transitions = 0
  for (let i = 0; i < 31; i++) {
    if (binary[i] !== binary[i + 1]) transitions++
  }
  const runs = binary.match(/0+|1+/g) || []
  const avgRunLength = runs.length > 0 ? 32 / runs.length : 0
  return { ones, zeros, transitions, avgRunLength, runs: runs.length }
}

const getHammingMetrics = (value: number) => {
  const weight = ((value >>> 0).toString(2).match(/1/g) || []).length
  return {
    hammingWeight: weight,
    hammingDistance: 32 - weight,
    density: (weight / 32) * 100,
  }
}

export default function QASE() {
  const [v, setV] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])
  const [showInfo, setShowInfo] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [mode, setMode] = useState<"hex" | "decimal" | "binary">("hex")
  const [autoGenerate, setAutoGenerate] = useState(false)
  const [stats, setStats] = useState(getStatistics(0))
  const [hamming, setHamming] = useState(getHammingMetrics(0))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const autoGenerateRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const initialValue = awaken()
    setV(initialValue)
    setStats(getStatistics(initialValue))
    setHamming(getHammingMetrics(initialValue))
  }, [])

  useEffect(() => {
    const canvas = particleCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const animate = () => {
      ctx.fillStyle = "rgba(5, 10, 20, 0.06)"
      ctx.fillRect(0, 0, width, height)

      setParticles((prev) => {
        const updated = prev
          .map((p) => {
            const newTrail = [...p.trail, { x: p.x, y: p.y }].slice(-8)
            return {
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vx: p.vx * 0.98,
              vy: p.vy * 0.98 + 0.12,
              life: p.life - 0.015,
              rotation: p.rotation + p.rotationSpeed,
              glow: p.life > 0.5 ? p.glow : p.glow * 0.85,
              trail: newTrail,
            }
          })
          .filter((p) => p.life > 0 && p.y < height + 100)

        updated.forEach((p) => {
          const opacity = Math.pow(p.life, 1.1) * 0.8

          // Trail rendering
          if (p.trail.length > 1) {
            ctx.strokeStyle = `hsla(${p.hue}, 100%, 50%, ${opacity * 0.2})`
            ctx.lineWidth = p.size * 0.4
            ctx.lineCap = "round"
            ctx.lineJoin = "round"
            ctx.beginPath()
            ctx.moveTo(p.trail[0].x, p.trail[0].y)
            for (let i = 1; i < p.trail.length; i++) {
              ctx.lineTo(p.trail[i].x, p.trail[i].y)
            }
            ctx.stroke()
          }

          // Main particle with glow rings
          ctx.fillStyle = `hsla(${p.hue}, 100%, ${55 + p.life * 15}%, ${opacity})`
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.fill()

          // Outer glow
          ctx.strokeStyle = `hsla(${p.hue}, 100%, 65%, ${opacity * p.glow * 0.5})`
          ctx.lineWidth = p.size * 1.2
          ctx.beginPath()
          ctx.arc(0, 0, p.size + 1.5, 0, Math.PI * 2)
          ctx.stroke()

          // Inner core
          ctx.fillStyle = `hsla(${p.hue + 60}, 100%, 70%, ${opacity * 0.4})`
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2)
          ctx.fill()

          ctx.restore()

          // Aura effect
          ctx.strokeStyle = `hsla(${p.hue + 180}, 100%, 50%, ${opacity * 0.15})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size + 6, 0, Math.PI * 2)
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

  useEffect(() => {
    if (autoGenerate) {
      autoGenerateRef.current = setInterval(() => {
        const newValue = awaken()
        setV(newValue)
        setStats(getStatistics(newValue))
        setHamming(getHammingMetrics(newValue))
        setHistory((prev) => [newValue, ...prev.slice(0, 19)])

        const canvas = particleCanvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          setParticles((p) => [
            ...p,
            ...Array.from({ length: 15 }, () =>
              createParticle(rect.width / 2, rect.height / 2, computeEntropy(newValue)),
            ),
          ])
        }
      }, 2000)
    } else {
      if (autoGenerateRef.current) clearInterval(autoGenerateRef.current)
    }

    return () => {
      if (autoGenerateRef.current) clearInterval(autoGenerateRef.current)
    }
  }, [autoGenerate])

  const handleClick = useCallback(async () => {
    setIsGenerating(true)
    await new Promise((resolve) => setTimeout(resolve, 150))

    const newValue = awaken()
    setV(newValue)
    setStats(getStatistics(newValue))
    setHamming(getHammingMetrics(newValue))
    setHistory((prev) => [newValue, ...prev.slice(0, 19)])

    const canvas = particleCanvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const entropy = computeEntropy(newValue)

      setParticles((prev) => [...prev, ...Array.from({ length: 25 }, () => createParticle(centerX, centerY, entropy))])
    }

    setIsGenerating(false)
  }, [])

  const handleCopy = useCallback(async () => {
    const displayValue =
      mode === "hex"
        ? v.toString(16).slice(0, 8).toUpperCase()
        : mode === "decimal"
          ? v.toString()
          : v.toString(2).padStart(32, "0")

    try {
      await navigator.clipboard.writeText(displayValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy")
    }
  }, [v, mode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault()
        handleClick()
      }
      if (e.ctrlKey && e.code === "KeyC") {
        e.preventDefault()
        handleCopy()
      }
      if (e.code === "KeyH") {
        setMode((prev) => (prev === "hex" ? "decimal" : prev === "decimal" ? "binary" : "hex"))
      }
      if (e.code === "KeyI") {
        setShowInfo((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleClick, handleCopy])

  const hexValue = useMemo(() => v.toString(16).slice(0, 8).toUpperCase(), [v])
  const decimalValue = useMemo(() => v.toString(), [v])
  const binaryValue = useMemo(() => v.toString(2).padStart(32, "0"), [v])
  const entropy = useMemo(() => computeEntropy(v), [v])
  const glow = useMemo(() => ((v & 255) / 255) * 0.8 + 0.2, [v])

  return (
    <main className={styles.container}>
      <canvas ref={particleCanvasRef} className={styles.particleCanvas} />

      <div className={styles.gridBackground} />

      <div
        className={styles.backdrop}
        style={{
          opacity: glow,
          background: `radial-gradient(circle at center, hsla(${entropy > 50 ? 280 : 200}, 100%, ${30 + entropy * 0.3}%, ${glow * 0.9}), transparent 70%)`,
        }}
      />

      <div className={styles.content}>
        <div
          className={`${styles.coreContainer} ${isGenerating ? styles.generating : ""}`}
          onClick={!isGenerating ? handleClick : undefined}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.code === "Enter" || e.code === "Space") handleClick()
          }}
          aria-label="Generate new quantum value"
        >
          <div className={styles.coreGlowOuter} />
          <div className={styles.coreGlowInner} />

          <div className={styles.core}>
            <div className={styles.label}>QASE ∴</div>
            <div className={styles.title}>QUANTUM ASSERTION</div>
            <div className={styles.subtitle}>of Stable Existence</div>
            <div className={styles.value}>
              {mode === "hex" ? hexValue : mode === "decimal" ? decimalValue : binaryValue.slice(0, 8)}
            </div>
            <div className={styles.hint}>{isGenerating ? "Σ Generating..." : "Space / Click"}</div>
          </div>

          <div className={styles.quantumIndicator}>
            <div className={styles.quantumPulse} />
            <span>Quantum State Active</span>
          </div>
        </div>

        <div className={styles.controlPanel}>
          <button
            className={styles.controlBtn}
            onClick={() => setAutoGenerate(!autoGenerate)}
            title="Toggle auto-generation (Ctrl+A)"
            aria-label={autoGenerate ? "Disable auto-generation" : "Enable auto-generation"}
          >
            {autoGenerate ? "⏸" : "▶"}
          </button>
          <button
            className={styles.controlBtn}
            onClick={() => setMode((prev) => (prev === "hex" ? "decimal" : prev === "decimal" ? "binary" : "hex"))}
            title="Cycle display mode (H)"
            aria-label={`Current mode: ${mode}`}
          >
            {mode === "hex" ? "HEX" : mode === "decimal" ? "DEC" : "BIN"}
          </button>
          <button
            className={styles.controlBtn}
            onClick={() => setShowInfo(!showInfo)}
            title="Toggle information panel (I)"
            aria-label={showInfo ? "Hide information" : "Show information"}
          >
            {showInfo ? "▼" : "▶"}
          </button>
        </div>

        <div className={`${styles.infoPanel} ${showInfo ? styles.visible : ""}`}>
          {showInfo && (
            <div className={styles.infoContent}>
              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Core Values</h3>
                <div className={styles.infoRow}>
                  <span className={styles.label}>HEX</span>
                  <span className={styles.value}>{hexValue}</span>
                  <button
                    className={styles.copyBtn}
                    onClick={handleCopy}
                    aria-label="Copy hex value"
                    title="Copy to clipboard (Ctrl+C)"
                  >
                    {copied ? "✓" : "⎘"}
                  </button>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>DEC</span>
                  <span className={styles.mono}>{decimalValue}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>BIN</span>
                  <span className={styles.mono}>{binaryValue.slice(0, 16)}...</span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Quantum Entropy</h3>
                <div className={styles.metricsGrid}>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Entropy Score</div>
                    <div className={styles.metricValue}>{entropy.toFixed(1)}%</div>
                    <div className={styles.metricBar}>
                      <div className={styles.metricFill} style={{ width: `${entropy}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Bit Analysis</h3>
                <div className={styles.metricsGrid}>
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
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Runs</div>
                    <div className={styles.metricValue}>{stats.runs}</div>
                  </div>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Hamming Metrics</h3>
                <div className={styles.metricsGrid}>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Weight</div>
                    <div className={styles.metricValue}>{hamming.hammingWeight}</div>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Distance</div>
                    <div className={styles.metricValue}>{hamming.hammingDistance}</div>
                  </div>
                  <div className={styles.metric}>
                    <div className={styles.metricLabel}>Density</div>
                    <div className={styles.metricValue}>{hamming.density.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              <div className={styles.divider} />

              {history.length > 0 && (
                <div className={styles.infoSection}>
                  <h3 className={styles.sectionTitle}>Generation History</h3>
                  <div className={styles.historyList}>
                    {history.slice(0, 10).map((val, idx) => (
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

      <div className={styles.footer}>
        <span className={styles.footerText}>Quantum Assertion of Stable Existence</span>
        <span className={styles.footerDivider}>∴</span>
        <span className={styles.footerHint}>Space: Generate • H: Mode • I: Info • Ctrl+C: Copy</span>
      </div>
    </main>
  )
}
