"use client"

import { useRef, useEffect, useCallback } from "react"

export interface GrainyAnimatedBgProps {
  animationType?: "flow" | "mesh" | "waves" | "aurora" | "spiral" | "pulse"
  grainType?: "digital" | "plasma" | "scratches" | "paper" | "noise" | "dust"
  grainIntensity?: number
  colors?: string[]
  speed?: number
  className?: string
  children?: React.ReactNode
}

function hexToRgb(hex: string) {
  const v = parseInt(hex.replace("#", ""), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function clamp(v: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, v))
}

function hash(x: number, y: number) {
  let h = x * 374761393 + y * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return (h ^ (h >> 16)) & 0x7fffffff
}

function smoothNoise(x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const n00 = hash(ix, iy)
  const n10 = hash(ix + 1, iy)
  const n01 = hash(ix, iy + 1)
  const n11 = hash(ix + 1, iy + 1)
  const nx0 = lerp(n00, n10, sx)
  const nx1 = lerp(n01, n11, sx)
  return lerp(nx0, nx1, sy) / 0x7fffffff
}

export function AnimatedGrainyBg({
  animationType = "mesh",
  grainType = "paper",
  grainIntensity = 40,
  colors = ["#0d0d0d", "#1a1a1a", "#e85d2c", "#a4a4a4"],
  speed = 0.5,
  className = "",
  children,
}: GrainyAnimatedBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)
  const rafRef = useRef<number>(0)
  const rgbColors = useRef(colors.map(hexToRgb))

  useEffect(() => {
    rgbColors.current = colors.map(hexToRgb)
  }, [colors])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      if (!w || !h || w <= 0 || h <= 0) return
      const imageData = ctx.createImageData(w, h)
      const data = imageData.data
      const cols = rgbColors.current
      const c = cols.length

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const nx = x / w
          const ny = y / h
          const scale = 3

          let r = 0, g = 0, b = 0
          let totalWeight = 0

          if (animationType === "mesh") {
            for (let ci = 0; ci < c; ci++) {
              const angle = (ci / c) * Math.PI * 2 + t * speed * 0.15
              const cx = 0.5 + Math.cos(angle + ci * 1.5) * 0.4
              const cy = 0.5 + Math.sin(angle * 0.7 + ci * 1.2) * 0.4
              const dx = nx - cx
              const dy = ny - cy
              const dist = Math.sqrt(dx * dx + dy * dy)
              const weight = Math.max(0, 1 - dist * 1.8)
              r += cols[ci][0] * weight
              g += cols[ci][1] * weight
              b += cols[ci][2] * weight
              totalWeight += weight
            }
          } else if (animationType === "flow") {
            const dx = nx + t * speed * 0.05
            const dy = ny + t * speed * 0.03
            const noise1 = smoothNoise(dx * scale, dy * scale)
            const noise2 = smoothNoise(dx * scale + 5, dy * scale + 5)
            const noise3 = smoothNoise(dx * scale + 10, dy * scale + 10)
            for (let ci = 0; ci < c; ci++) {
              const phase = ci / c
              const weight = Math.max(0, 1 - Math.abs(noise1 - phase * 0.5) * 4) *
                             Math.max(0, 1 - Math.abs(noise2 - phase * 0.3) * 3)
              r += cols[ci][0] * weight
              g += cols[ci][1] * weight
              b += cols[ci][2] * weight
              totalWeight += weight
            }
          } else if (animationType === "waves") {
            const wave1 = Math.sin(nx * 8 + ny * 6 + t * speed * 0.8) * 0.5 + 0.5
            const wave2 = Math.sin(nx * 5 - ny * 7 + t * speed * 0.6) * 0.5 + 0.5
            const wave3 = Math.sin((nx + ny) * 4 + t * speed * 1.0) * 0.5 + 0.5
            const blend = (wave1 + wave2 + wave3) / 3
            for (let ci = 0; ci < c; ci++) {
              const phase = ci / c
              const weight = Math.max(0, 1 - Math.abs(blend - phase) * 3)
              r += cols[ci][0] * weight
              g += cols[ci][1] * weight
              b += cols[ci][2] * weight
              totalWeight += weight
            }
          } else if (animationType === "aurora") {
            const aurora1 = Math.sin(nx * 12 + t * speed * 0.4) * Math.exp(-Math.abs(ny - 0.5) * 5)
            const aurora2 = Math.sin(nx * 8 + ny * 3 + t * speed * 0.6) * Math.exp(-Math.abs(ny - 0.3) * 4)
            const aurora3 = Math.sin(nx * 15 - t * speed * 0.3 + ny * 2) * Math.exp(-Math.abs(ny - 0.7) * 5)
            const intensities = [aurora1, aurora2, aurora3]
            for (let ci = 0; ci < Math.min(c, 3); ci++) {
              const weight = Math.max(0, intensities[ci] * 0.7 + 0.3)
              r += cols[ci][0] * weight
              g += cols[ci][1] * weight
              b += cols[ci][2] * weight
              totalWeight += weight
            }
          } else if (animationType === "spiral") {
            const cx2 = nx - 0.5
            const cy2 = ny - 0.5
            const dist = Math.sqrt(cx2 * cx2 + cy2 * cy2)
            const angle = Math.atan2(cy2, cx2) + t * speed * 0.2 + dist * 6
            const spiral = (Math.sin(angle) + 1) / 2
            for (let ci = 0; ci < c; ci++) {
              const phase = ci / c
              const weight = Math.max(0, 1 - Math.abs(spiral - phase) * 3)
              r += cols[ci][0] * weight
              g += cols[ci][1] * weight
              b += cols[ci][2] * weight
              totalWeight += weight
            }
          } else {
            const pulse = Math.sin(t * speed * 0.5 + nx * 3 + ny * 3) * 0.5 + 0.5
            for (let ci = 0; ci < c; ci++) {
              const phase = ci / c
              const weight = Math.max(0, 1 - Math.abs(pulse - phase) * 3)
              r += cols[ci][0] * weight
              g += cols[ci][1] * weight
              b += cols[ci][2] * weight
              totalWeight += weight
            }
          }

          if (totalWeight > 0) {
            data[i] = clamp(r / totalWeight)
            data[i + 1] = clamp(g / totalWeight)
            data[i + 2] = clamp(b / totalWeight)
          } else {
            const last = cols[c - 1]
            data[i] = last[0]
            data[i + 1] = last[1]
            data[i + 2] = last[2]
          }
        }
      }

      // Grain overlay
      if (grainIntensity > 0) {
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4
            const noise = smoothNoise(x * 0.3 + t * 0.02, y * 0.3) * 2 - 1
            const grainAmount = grainIntensity / 100

            if (grainType === "plasma") {
              const plasma = Math.sin(x * 0.05 + y * 0.04 + t * 0.5) * 0.5 + 0.5
              const bleed = noise * grainAmount * plasma * 30
              data[i] = clamp(data[i] + bleed)
              data[i + 1] = clamp(data[i + 1] + bleed * 0.5)
            } else if (grainType === "scratches") {
              const scratch = Math.abs(noise) > 0.98 ? noise * grainAmount * 60 : 0
              data[i] = clamp(data[i] + scratch)
              data[i + 1] = clamp(data[i + 1] + scratch)
              data[i + 2] = clamp(data[i + 2] + scratch)
            } else if (grainType === "digital") {
              const blockX = Math.floor(x / 3)
              const blockY = Math.floor(y / 3)
              const bNoise = smoothNoise(blockX * 0.5 + t * 0.01, blockY * 0.5) * 2 - 1
              const bleed = bNoise * grainAmount * 25
              data[i] = clamp(data[i] + bleed)
              data[i + 1] = clamp(data[i + 1] + bleed)
              data[i + 2] = clamp(data[i + 2] + bleed)
            } else if (grainType === "dust") {
              const dust = Math.abs(noise) > 0.92 ? (Math.random() * 2 - 1) * grainAmount * 50 : 0
              data[i] = clamp(data[i] + dust)
              data[i + 1] = clamp(data[i + 1] + dust)
              data[i + 2] = clamp(data[i + 2] + dust)
            } else if (grainType === "noise") {
              const bleed = noise * grainAmount * 20
              data[i] = clamp(data[i] + bleed)
              data[i + 1] = clamp(data[i + 1] + bleed)
              data[i + 2] = clamp(data[i + 2] + bleed)
            } else {
              const paper = noise * grainAmount * 15
              data[i] = clamp(data[i] + paper)
              data[i + 1] = clamp(data[i + 1] + paper * 0.8)
              data[i + 2] = clamp(data[i + 2] + paper * 0.6)
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)
    },
    [animationType, grainType, grainIntensity, speed]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const animating = true

    let running = true

    function resize() {
      if (!canvas || !running) return
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1)
      const w = Math.round(rect.width * dpr)
      const h = Math.round(rect.height * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        if (w > 0) ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    function loop() {
      if (!running) return
      timeRef.current += 0.016
      const rect = canvas!.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      if (w > 0 && h > 0) {
        const drawW = Math.min(w, 480)
        const drawH = Math.round(drawW * (h / w))
        draw(ctx!, drawW, drawH, timeRef.current)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    function handleVisibility() {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(rafRef.current)
      } else {
        running = true
        resize()
        rafRef.current = requestAnimationFrame(loop)
      }
    }

    resize()
    window.addEventListener("resize", resize)
    document.addEventListener("visibilitychange", handleVisibility)
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [draw])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: grainType === "digital" ? "pixelated" : "auto" }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
