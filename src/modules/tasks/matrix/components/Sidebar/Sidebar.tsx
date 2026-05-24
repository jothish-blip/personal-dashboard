import React, { useMemo, useState, useEffect } from 'react'

interface SidebarProps {
  overallDiff: number
  consistencyScore: number
  validDays: {
    date: string
    label: string
    count: number
  }[]
  chartMaxCount: number
  bestGlobalStreak: number
  globalWeekStats: {
    best: any
    worst: any
  }
  compareCurrentWeek: {
    date: string
    label: string
    dayNum: string
    count: number
  }[]
  comparePrevWeek: {
    date: string
    count: number
  }[]
  weekOffset: number
  setWeekOffset: React.Dispatch<React.SetStateAction<number>>
  totalCurrent: number
  actualToday: string
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))

function buildLinePath(points: { x: number; y: number }[]) {
  if (!points.length) return ''
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const cur = points[i]
    const cx = (prev.x + cur.x) / 2
    const cy = (prev.y + cur.y) / 2
    d += ` Q ${prev.x} ${prev.y} ${cx} ${cy}`
  }

  const last = points[points.length - 1]
  d += ` T ${last.x} ${last.y}`
  return d
}

function buildAreaPath(points: { x: number; y: number }[], baseline = 156) {
  if (!points.length) return ''
  const line = buildLinePath(points)
  const first = points[0]
  const last = points[points.length - 1]
  return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
}

export default function Sidebar(props: SidebarProps) {
  const {
    validDays,
    compareCurrentWeek,
    comparePrevWeek,
    totalCurrent,
    actualToday,
  } = props

  const todayCompleted = useMemo(() => {
    const found = compareCurrentWeek.find((d) => d.date === actualToday)
    if (found) return found.count

    const last =
      validDays.find((d) => d.date === actualToday) ||
      validDays[validDays.length - 1]

    return last ? last.count : 0
  }, [compareCurrentWeek, validDays, actualToday])

  const totalTasks = Math.max(1, totalCurrent || 1)
  const heroPct = clamp(todayCompleted / totalTasks)

  const heroMessage = useMemo(() => {
    const p = heroPct * 100

    if (todayCompleted === 0) {
      return {
        title: 'Start with one meaningful task.',
        subtitle: 'Momentum starts small.',
      }
    }

    if (p > 0 && p <= 40) {
      return {
        title: 'You started moving today.',
        subtitle: 'Keep building.',
      }
    }

    if (p > 40 && p <= 70) {
      return {
        title: 'Good progress today.',
        subtitle: "You're moving forward.",
      }
    }

    if (p > 70 && p < 100) {
      return {
        title: 'Strong execution today.',
        subtitle: 'Almost complete.',
      }
    }

    return {
      title: 'Everything completed.',
      subtitle: 'Today was valuable.',
    }
  }, [heroPct, todayCompleted])

  const { months, maxCount } = useMemo(() => {
    const days = validDays || []
    const max = Math.max(1, ...days.map((d) => d.count))
    return { months: days, maxCount: max }
  }, [validDays])

  const weekSum = (arr: { date: string; count: number }[]) =>
    arr.reduce((s, x) => s + (x.count || 0), 0)

  const currentWeekTotal = weekSum(compareCurrentWeek)
  const prevWeekTotal = weekSum(comparePrevWeek)
  const weekDiff = currentWeekTotal - prevWeekTotal

  const weekInsight = useMemo(() => {
    if (weekDiff > 0) return 'Your spikes improved this week.'
    if (weekDiff === 0) return "You're maintaining steady momentum."
    return 'Slightly lower than last week.'
  }, [weekDiff])

  const heatmap = useMemo(() => {
    const last = validDays.slice(-28)
    const cells = Array.from({ length: 28 }, (_, i) => {
      const item = last[i]
      return {
        date: item?.date || '',
        count: item?.count || 0,
      }
    })

    return cells
  }, [validDays])

  const [animatedPct, setAnimatedPct] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(heroPct), 80)
    return () => clearTimeout(t)
  }, [heroPct])

  return (
    <aside className="w-full md:w-96 p-4 md:p-6 space-y-5 text-[var(--foreground)]">
      <div className="relative overflow-hidden rounded-[28px] bg-[var(--surface)] border border-[var(--border)] p-5 md:p-6 shadow-lg transition-all duration-300 hover:-translate-y-[2px]">
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/45 to-transparent" />

        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.18em] text-orange-400">
              TODAY IMPACT
            </p>

            <div className="mt-4">
              <div className="text-3xl font-semibold leading-tight text-[var(--foreground)]">
                {todayCompleted} meaningful actions
              </div>
              <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                {Math.round(animatedPct * 100)}% complete
              </div>
            </div>
          </div>

          <div className="relative grid h-24 w-24 shrink-0 place-items-center">
            <svg viewBox="0 0 120 120" className="h-24 w-24 -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="rgba(255,122,89,0.12)"
                strokeWidth="11"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="url(#todayImpactGradient)"
                strokeWidth="11"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${2 * Math.PI * 48 * (1 - animatedPct)}`}
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="todayImpactGradient" x1="0" x2="1">
                  <stop offset="0%" stopColor="#ffb86b" />
                  <stop offset="100%" stopColor="#ff7a59" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute text-center">
              <div className="text-lg font-semibold text-[var(--foreground)]">
                {todayCompleted}
              </div>
              <div className="text-[10px] text-[var(--muted-foreground)]">
                / {totalTasks}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {heroMessage.title}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {heroMessage.subtitle}
          </p>
        </div>
      </div>

      <div className="rounded-[28px] bg-[var(--surface)] border border-[var(--border)] p-5 shadow-lg transition-all duration-300 hover:-translate-y-[2px]">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)]">
            MONTHLY MOVEMENT
          </h4>
          <div className="text-xs text-[var(--muted-foreground)]">
            {months.length} days
          </div>
        </div>

        <div className="mt-4 h-48 w-full overflow-hidden">
          <svg viewBox="0 0 640 190" className="h-full w-full">
            <defs>
              <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffb86b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ff7a59" stopOpacity="0.35" />
              </linearGradient>

              <linearGradient id="lineGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="#ffd29a" />
                <stop offset="100%" stopColor="#ff7a59" />
              </linearGradient>

              <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ff8a5c" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#ff8a5c" stopOpacity="0" />
              </linearGradient>

              <filter id="orangeGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="1 0 0 0 1  0 0.45 0 0 0.42  0 0 0.2 0 0.12  0 0 0 1 0"
                />
              </filter>
            </defs>

            {(() => {
              const width = 600
              const startX = 20
              const baseline = 156
              const available = Math.max(1, months.length - 1)
              const step = width / available

              const pts = months.map((d, i) => {
                const x = startX + i * step
                const h = (d.count / Math.max(1, maxCount)) * 112
                const y = baseline - h
                return { x, y }
              })

              const areaPath = buildAreaPath(pts, baseline)
              const linePath = buildLinePath(pts)

              return (
                <>
                  <path d={areaPath} fill="url(#areaGrad)" />

                  {months.map((d, i) => {
                    const x = startX + i * step
                    const isToday = d.date === actualToday
                    const barWidth = isToday ? 9 : 6
                    const h = Math.max(
                      4,
                      (d.count / Math.max(1, maxCount)) * 104
                    )
                    const y = baseline - h

                    return (
                      <rect
                        key={d.date || i}
                        x={x - barWidth / 2}
                        y={y}
                        width={barWidth}
                        height={h}
                        rx={barWidth / 2}
                        fill={isToday ? '#ff7a59' : 'url(#barGrad)'}
                        opacity={isToday ? 1 : 0.72}
                        className="transition-all duration-300"
                      />
                    )
                  })}

                  <path
                    d={linePath}
                    fill="none"
                    stroke="#ff7a59"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.16"
                    filter="url(#orangeGlow)"
                  />

                  <path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {pts.map((p, i) => {
                    const isToday = months[i]?.date === actualToday

                    if (!isToday) {
                      return (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r="2.5"
                          fill="#fff"
                          opacity="0.55"
                        />
                      )
                    }

                    return (
                      <g key={i}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="12"
                          fill="#ff7a59"
                          opacity="0.14"
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="5"
                          fill="#ff7a59"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                        <text
                          x={p.x + 12}
                          y={p.y - 10}
                          fontSize="11"
                          fill="#ff7a59"
                          fontWeight="600"
                        >
                          Today
                        </text>
                      </g>
                    )
                  })}
                </>
              )
            })()}
          </svg>
        </div>

        <p className="mt-3 text-sm text-[var(--muted-foreground)]">
          {weekInsight}
        </p>
      </div>

      <div className="rounded-[28px] bg-[var(--surface)] border border-[var(--border)] p-5 shadow-lg transition-all duration-300 hover:-translate-y-[2px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h5 className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)]">
              THIS WEEK
            </h5>
            <div className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              {currentWeekTotal}
            </div>
            <div className="mt-1 text-sm text-[var(--muted-foreground)]">
              completions
            </div>
          </div>

          <div className="text-right">
            <div
              className={`text-sm font-semibold ${
                weekDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {weekDiff >= 0 ? `↑ +${weekDiff}` : `↓ ${weekDiff}`}
            </div>
            <div className="mt-1 text-xs text-[var(--muted-foreground)]">
              vs last week
            </div>
          </div>
        </div>

        <div className="mt-5 flex h-20 items-end gap-2">
          {(compareCurrentWeek || []).map((d) => {
            const weekMax = Math.max(
              1,
              ...compareCurrentWeek.map((x) => x.count || 0)
            )
            const h = clamp((d.count || 0) / weekMax, 0.12, 1)

            return (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className="w-full rounded-full bg-gradient-to-t from-orange-500/45 to-orange-300/85 transition-all duration-300"
                  style={{ height: `${h * 64}px` }}
                  title={`${d.label}: ${d.count}`}
                />
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {d.dayNum}
                </span>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          {weekDiff >= 0
            ? "You're building momentum."
            : "You're still in motion."}
        </p>
      </div>

      <div className="rounded-[28px] bg-[var(--surface)] border border-[var(--border)] p-5 shadow-lg transition-all duration-300 hover:-translate-y-[2px]">
        <div className="flex items-center justify-between">
          <h6 className="text-xs font-semibold tracking-[0.18em] text-[var(--muted-foreground)]">
            ACTIVITY
          </h6>
          <div className="text-xs text-[var(--muted-foreground)]">
            Last 28 days
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {heatmap.map((cell, i) => {
            const v = clamp(cell.count / Math.max(1, maxCount))
            const alpha = 0.08 + v * 0.72
            const bg = `rgba(255,122,89,${alpha})`
            const isToday = cell.date === actualToday

            return (
              <div
                key={`${cell.date}-${i}`}
                title={`${cell.date}: ${cell.count}`}
                className={`h-3.5 w-3.5 rounded-[4px] ${
                  isToday ? 'ring-1 ring-orange-400/50 ring-offset-1' : ''
                }`}
                style={{
                  background: cell.count
                    ? bg
                    : 'color-mix(in srgb, var(--foreground) 6%, transparent)',
                }}
              />
            )
          })}
        </div>
      </div>
    </aside>
  )
}