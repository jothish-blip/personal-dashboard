"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useTransition,
  useDeferredValue,
} from "react";
import {
  ChevronRight,
  TrendingUp,
  Activity,
  BarChart2,
  Zap,
  Flame,
  Target,
  Crosshair,
} from "lucide-react";
import { useNexCore } from "../../../engine/useNexCore";
import { useTheme } from "@/theme/ThemeProvider";

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const valueRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = valueRef.current;
    const to = value;
    const duration = 250;
    let startTime: number;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const animate = (time: number) => {
      if (!startTime) startTime = time;

      const progress = Math.min((time - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (to - from) * ease);

      setDisplayValue(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        valueRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return <>{displayValue}</>;
};

const MagneticCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left - rect.width / 2) / rect.width) * 4;
    const y = ((event.clientY - rect.top - rect.height / 2) / rect.height) * 4;

    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate3d(0, 0, 0)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transform-gpu will-change-transform transition-transform duration-200 ${className}`}
    >
      {children}
    </div>
  );
};

const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export default function Sidebar() {
  const { state, loading } = useNexCore();
  const { isDarkMode } = useTheme();

  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => setMounted(true), []);

  const today = useMemo(() => getLocalDate(), []);
  const tasks = state.tasks ?? [];

  const taskSignature = useMemo(
    () =>
      tasks
        .map((task: any) => {
          const history = task.history || {};
          const completedDates = Object.keys(history)
            .filter((date) => history[date])
            .sort()
            .join(",");

          return `${task.id}-${completedDates}`;
        })
        .join("|"),
    [tasks]
  );

  useEffect(() => {
    setIsSyncing(true);
    const timer = setTimeout(() => setIsSyncing(false), 300);
    return () => clearTimeout(timer);
  }, [taskSignature]);

  const coreStats = useMemo(() => {
    let todayCompleted = 0;
    let bestStreak = 0;
    const totalTasks = tasks.length;

    tasks.forEach((task: any) => {
      const history = task.history || {};
      if (history[today]) todayCompleted++;

      let localStreak = 0;
      let localBest = 0;
      const dates = Object.keys(history).sort();

      dates.forEach((date) => {
        if (history[date]) {
          localStreak++;
          localBest = Math.max(localBest, localStreak);
        } else {
          localStreak = 0;
        }
      });

      bestStreak = Math.max(bestStreak, localBest);
    });

    const completionPct =
      totalTasks === 0 ? 0 : Math.round((todayCompleted / totalTasks) * 100);

    return {
      todayCompleted,
      totalTasks,
      completionPct,
      bestStreak,
    };
  }, [taskSignature, today]);

  const trendStats = useMemo(() => {
    const trendMap: Record<string, number> = {};

    tasks.forEach((task: any) => {
      Object.keys(task.history || {}).forEach((date) => {
        if (task.history[date]) {
          trendMap[date] = (trendMap[date] || 0) + 1;
        }
      });
    });

    const pulseData = [];
    const velocityData = [];
    let thisWeek = 0;
    let lastWeek = 0;

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const val = trendMap[key] || 0;

      pulseData.push({
        date: key,
        completed: val,
      });

      if (i < 7) {
        thisWeek += val;
        velocityData.push(val);
      } else if (i < 14) {
        lastWeek += val;
      }
    }

    const trendImprovement =
      lastWeek === 0
        ? thisWeek > 0
          ? 100
          : 0
        : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

    const momentumScore = Math.min(
      100,
      Math.max(0, 50 + trendImprovement / 2)
    );

    return {
      pulseData,
      velocityData,
      trendImprovement,
      momentumScore,
    };
  }, [taskSignature]);

  const groupStats = useMemo(() => {
    const stats: Record<string, { possible: number; done: number }> = {};

    tasks.forEach((task: any) => {
      const groupName = task.group || "GENERAL";

      if (!stats[groupName]) {
        stats[groupName] = {
          possible: 0,
          done: 0,
        };
      }

      for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split("T")[0];

        stats[groupName].possible++;

        if (task.history?.[dStr]) {
          stats[groupName].done++;
        }
      }
    });

    const groupData = Object.entries(stats)
      .map(([name, data]) => ({
        name,
        pct:
          data.possible === 0
            ? 0
            : Math.round((data.done / data.possible) * 100),
      }))
      .filter((g) => g.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    const topFive = groupData.slice(0, 5);
    const strongestGroup = groupData.length > 0 ? groupData[0].name : "None";

    return {
      groupData: topFive,
      strongestGroup,
      activeGroups: groupData.length,
    };
  }, [taskSignature]);

  const heatmapStats = useMemo(() => {
    const trendMap: Record<string, number> = {};

    tasks.forEach((task: any) => {
      Object.keys(task.history || {}).forEach((date) => {
        if (task.history[date]) {
          trendMap[date] = (trendMap[date] || 0) + 1;
        }
      });
    });

    const heatmapData = [];
    const totalTasks = tasks.length;

    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const count = trendMap[key] || 0;
      const intensity = totalTasks > 0 ? count / totalTasks : 0;

      heatmapData.push({
        date: key,
        intensity,
        isToday: i === 0,
      });
    }

    return { heatmapData };
  }, [taskSignature]);

  const prevCompleted = useRef(coreStats.todayCompleted);

  useEffect(() => {
    if (coreStats.todayCompleted > prevCompleted.current) {
      startTransition(() => {
        setJustCompleted(true);
      });

      const timer = setTimeout(() => setJustCompleted(false), 500);
      prevCompleted.current = coreStats.todayCompleted;
      return () => clearTimeout(timer);
    }

    prevCompleted.current = coreStats.todayCompleted;
  }, [coreStats.todayCompleted, startTransition]);

  const deferredPulse = useDeferredValue(trendStats.pulseData);
  const deferredGroups = useDeferredValue(groupStats.groupData);

  const maxPulse = Math.max(1, ...deferredPulse.map((d) => d.completed));

  const smoothFillPath = useMemo(() => {
    if (deferredPulse.length === 0) return "";

    const points = deferredPulse.map((d, i) => ({
      x: (i / (deferredPulse.length - 1)) * 100,
      y: 100 - (d.completed / maxPulse) * 100,
    }));

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ` Q ${points[i].x},${points[i].y} ${xc},${yc}`;
    }

    if (points.length > 1) {
      path += ` Q ${points[points.length - 2].x},${
        points[points.length - 2].y
      } ${points[points.length - 1].x},${points[points.length - 1].y}`;
    }

    return path + ` L 100,100 L 0,100 Z`;
  }, [deferredPulse, maxPulse]);

  const smoothLinePath = useMemo(() => {
    if (deferredPulse.length === 0) return "";

    const points = deferredPulse.map((d, i) => ({
      x: (i / (deferredPulse.length - 1)) * 100,
      y: 100 - (d.completed / maxPulse) * 100,
    }));

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ` Q ${points[i].x},${points[i].y} ${xc},${yc}`;
    }

    if (points.length > 1) {
      path += ` Q ${points[points.length - 2].x},${
        points[points.length - 2].y
      } ${points[points.length - 1].x},${points[points.length - 1].y}`;
    }

    return path;
  }, [deferredPulse, maxPulse]);

  const radarPath = useMemo(() => {
    const data = deferredGroups;
    if (data.length < 3) return "";

    const paddedData = [...data];

    while (paddedData.length < 5) {
      paddedData.push({
        name: "",
        pct: 0,
      });
    }

    const pointsToUse = paddedData.slice(0, 5);

    const angles = [
      -Math.PI / 2,
      -Math.PI / 2 + (2 * Math.PI) / 5,
      -Math.PI / 2 + (4 * Math.PI) / 5,
      -Math.PI / 2 + (6 * Math.PI) / 5,
      -Math.PI / 2 + (8 * Math.PI) / 5,
    ];

    const coords = pointsToUse.map((g, i) => {
      const r = (g.pct / 100) * 45;
      const cx = 50 + r * Math.cos(angles[i]);
      const cy = 50 + r * Math.sin(angles[i]);
      return `${cx},${cy}`;
    });

    return `M ${coords.join(" L ")} Z`;
  }, [deferredGroups]);

  const liquidY = 100 - coreStats.completionPct;

  let liquidColor = "#3b82f6";
  let glowClass = "";

  if (coreStats.completionPct >= 100) {
    liquidColor = "#22c55e";
    glowClass =
      "drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse";
  } else if (coreStats.completionPct >= 75) {
    liquidColor = "#06b6d4";
    glowClass = "drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]";
  } else if (coreStats.completionPct >= 50) {
    glowClass = "drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]";
  }

  const panelClass = isDarkMode
    ? "bg-[#0a0a0a] border-gray-800 shadow-none"
    : "bg-white border-gray-200 shadow-sm";

  const cardClass = isDarkMode
    ? "bg-[#0a0a0a] border-gray-800 shadow-none"
    : "bg-white border-gray-200 shadow-sm";

  const textPrimary = isDarkMode ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-300" : "text-gray-700";
  const textMuted = isDarkMode ? "text-gray-500" : "text-gray-400";
  const softTrack = isDarkMode ? "bg-gray-900" : "bg-gray-100";

  if (loading) {
    return (
      <aside className="w-full xl:w-[380px] 2xl:w-[420px] shrink-0 flex flex-col gap-4 max-xl:pb-4">
        <div
          className={`flex justify-center items-center min-h-[140px] xl:min-h-[160px] w-full border rounded-2xl animate-pulse ${panelClass}`}
        />
        <div
          className={`flex justify-center items-center min-h-[140px] xl:min-h-[160px] w-full border rounded-2xl animate-pulse ${panelClass}`}
        />
      </aside>
    );
  }

  return (
    <aside
      className={`w-full xl:w-[380px] 2xl:w-[420px] shrink-0 flex flex-col gap-4 max-xl:pb-4 transition-opacity duration-[120ms] ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <style>{`
        @keyframes liquid-drift {
          0% { transform: translateX(0) translateY(var(--liquid-y)); }
          100% { transform: translateX(-50%) translateY(var(--liquid-y)); }
        }
        .animate-liquid {
          animation: liquid-drift 4s linear infinite;
        }

        @keyframes mesh-drift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .bg-mesh-light {
          background: linear-gradient(120deg, #eff6ff 0%, #ffffff 25%, #f8fafc 50%, #eff6ff 75%, #ffffff 100%);
          background-size: 200% 200%;
          animation: mesh-drift 10s ease-in-out infinite;
        }
        .bg-mesh-dark {
          background: linear-gradient(120deg, #050505 0%, #0a0a0a 25%, #111827 50%, #0a0a0a 75%, #050505 100%);
          background-size: 200% 200%;
          animation: mesh-drift 10s ease-in-out infinite;
        }

        @keyframes subtle-drift {
          0%, 100% { transform: translateX(-1%) translateY(0); }
          50% { transform: translateX(1%) translateY(1%); }
        }
        .animate-wave { animation: subtle-drift 6s ease-in-out infinite; }

        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.45; }
          100% { transform: scale(1.12); opacity: 0; }
        }
        .animate-ripple {
          animation: ripple 220ms ease-out forwards;
        }

        @keyframes micro-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.025); }
        }
        .animate-bounce-trigger {
          animation: micro-bounce 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        @keyframes ring-burst {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-58px) scale(0.9);
            opacity: 0.95;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-86px) scale(0.1);
            opacity: 0;
          }
        }
        .ring-burst-dot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #f97316;
          animation: ring-burst 420ms ease-out forwards;
          box-shadow: 0 0 12px rgba(249,115,22,0.7);
        }

        @keyframes wave-glow {
          0%, 100% {
            filter: drop-shadow(0 4px 6px rgba(37,99,235,0.4));
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(37,99,235,0.85));
          }
        }
        .execution-glow-pulse {
          animation: wave-glow 500ms ease-out;
        }
      `}</style>

      <div className="flex flex-col gap-3 mb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className={`text-sm font-semibold flex items-center gap-2 ${textSecondary}`}>
              <Activity size={16} className="text-blue-500" />
              Performance Hub
            </h2>
            <div className={`text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>
              Live sync • real-time updates
            </div>
          </div>

          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
              isSyncing || isPending
                ? isDarkMode
                  ? "bg-blue-950/30 text-blue-400 border-blue-900/50"
                  : "bg-blue-50 text-blue-600 border-blue-100"
                : isDarkMode
                ? "bg-[#111111] text-gray-500 border-gray-800"
                : "bg-gray-50 text-gray-400 border-gray-100"
            }`}
          >
            {isSyncing || isPending ? "syncing..." : "Updated just now"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`flex items-center gap-1.5 text-[9px] font-bold uppercase px-2.5 py-1 rounded-full border shadow-sm ${
              isDarkMode
                ? "bg-green-950/30 border-green-900/50 text-green-400"
                : "bg-green-50 border-green-100 text-green-600"
            }`}
          >
            <TrendingUp size={10} />
            {trendStats.trendImprovement >= 0 ? "+" : ""}
            {trendStats.trendImprovement}% Momentum
          </span>

          <span
            className={`flex items-center gap-1 text-[9px] font-bold uppercase px-2.5 py-1 rounded-full border shadow-sm ${
              isDarkMode
                ? "bg-orange-950/30 border-orange-900/50 text-orange-400"
                : "bg-orange-50 border-orange-100 text-orange-600"
            }`}
          >
            <Flame size={10} /> Peak: {groupStats.strongestGroup}
          </span>

          <span
            className={`flex items-center gap-1 text-[9px] font-bold uppercase px-2.5 py-1 rounded-full border shadow-sm ${
              isDarkMode
                ? "bg-blue-950/30 border-blue-900/50 text-blue-400"
                : "bg-blue-50 border-blue-100 text-blue-600"
            }`}
          >
            <Zap size={10} /> {groupStats.activeGroups} Active Areas
          </span>
        </div>
      </div>

      <MagneticCard
        className={`border rounded-2xl p-6 min-h-[320px] relative ${cardClass} ${
          justCompleted ? "animate-bounce-trigger" : ""
        }`}
      >
        {justCompleted && (
          <div
            className={`absolute inset-0 rounded-2xl animate-ripple pointer-events-none z-0 ${
              isDarkMode ? "bg-blue-950/30" : "bg-blue-50/50"
            }`}
          />
        )}

        <div className="relative z-10 flex min-h-[268px] flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-4">
            <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${textMuted}`}>
              <Target size={14} className="text-blue-500" /> Execution Quality
            </div>

            {coreStats.completionPct === 100 && (
              <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider">
                Flawless
              </span>
            )}
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center">
            {justCompleted && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span
                    key={index}
                    className="ring-burst-dot"
                    style={
                      {
                        "--angle": `${index * 30}deg`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            )}

            <div
              className={`absolute inset-0 rounded-full border-4 shadow-inner ${
                isDarkMode ? "border-gray-800" : "border-gray-100"
              }`}
            />

            <svg
              viewBox="0 0 100 100"
              className={`absolute inset-0 w-full h-full rounded-full overflow-hidden ${glowClass} transition-all duration-[180ms]`}
            >
              <clipPath id="circleClip">
                <circle cx="50" cy="50" r="50" />
              </clipPath>

              <g clipPath="url(#circleClip)">
                <path
                  className="animate-liquid transition-transform duration-[250ms] ease-out"
                  style={
                    {
                      "--liquid-y": `${liquidY}%`,
                    } as React.CSSProperties
                  }
                  fill={liquidColor}
                  opacity="0.8"
                  d="M 0 50 Q 25 35 50 50 T 100 50 T 150 50 T 200 50 L 200 150 L 0 150 Z"
                />

                <path
                  className="animate-liquid transition-transform duration-[250ms] ease-out"
                  style={
                    {
                      "--liquid-y": `${liquidY}%`,
                      animationDirection: "reverse",
                      animationDuration: "6s",
                    } as React.CSSProperties
                  }
                  fill={liquidColor}
                  opacity="0.4"
                  d="M -50 50 Q -25 65 0 50 T 50 50 T 100 50 T 150 50 L 150 150 L -50 150 Z"
                />
              </g>
            </svg>

            <div className="z-10 flex flex-col items-center justify-center drop-shadow-md">
              <span
                className={`text-5xl font-extrabold tracking-tight leading-none ${
                  coreStats.completionPct > 50
                    ? "text-white"
                    : isDarkMode
                    ? "text-gray-100"
                    : "text-gray-900"
                }`}
              >
                <AnimatedNumber value={coreStats.completionPct} />%
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center mt-6 w-full opacity-80">
            <div className={`text-[8px] font-bold uppercase tracking-wider mb-1.5 ${textMuted}`}>
              Last 7 Days Velocity
            </div>

            <div className="flex items-end justify-center gap-1.5 h-7 w-full">
              {trendStats.velocityData.map((val, idx) => {
                const maxV = Math.max(...trendStats.velocityData, 1);
                const heightPct = (val / maxV) * 100;

                return (
                  <div
                    key={idx}
                    className={`w-2.5 rounded-t-[2px] transition-all duration-[120ms] ${
                      idx === trendStats.velocityData.length - 1 && justCompleted
                        ? "bg-blue-500 animate-pulse"
                        : isDarkMode
                        ? "bg-gray-700"
                        : "bg-gray-300"
                    }`}
                    style={{
                      height: `${Math.max(20, heightPct)}%`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </MagneticCard>

      <MagneticCard
        className={`${
          isDarkMode ? "bg-mesh-dark border-gray-800" : "bg-mesh-light border-blue-50"
        } rounded-2xl border p-5 min-h-[240px] shadow-sm relative overflow-hidden group`}
      >
        <div className="mb-6 flex items-center justify-between relative z-10">
          <div
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDarkMode ? "text-blue-300" : "text-blue-800"
            }`}
          >
            <TrendingUp size={14} className="text-blue-500" /> Execution Signal
          </div>

          <span
            className={`text-[9px] font-bold uppercase tracking-wider ${
              isDarkMode ? "text-blue-500" : "text-blue-400"
            }`}
          >
            30 Days
          </span>
        </div>

        <div className="absolute inset-0 top-[52px] bottom-5 flex flex-col justify-between pointer-events-none px-5 opacity-40">
          <div className={`border-b border-dashed w-full h-0 ${isDarkMode ? "border-blue-900" : "border-blue-200"}`} />
          <div className={`border-b border-dashed w-full h-0 ${isDarkMode ? "border-blue-900" : "border-blue-200"}`} />
        </div>

        <div className="relative h-[160px] xl:h-[170px] w-[110%] -ml-[5%] z-10">
          <svg
            className="h-full w-full overflow-visible animate-wave"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="waveGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <path
              d={smoothFillPath}
              fill="url(#waveGradient)"
              className="transition-all duration-[180ms]"
            />

            <path
              d={smoothLinePath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`drop-shadow-[0_4px_6px_rgba(37,99,235,0.4)] transition-all duration-[180ms] ${
                justCompleted ? "execution-glow-pulse" : ""
              }`}
            />
          </svg>
        </div>
      </MagneticCard>

      <div className="grid grid-cols-4 gap-2">
        {[
          ["Done", coreStats.todayCompleted],
          ["Peak", coreStats.bestStreak],
          ["Rate", coreStats.completionPct, "%"],
          ["Score", trendStats.momentumScore],
        ].map(([label, value, suffix], index) => (
          <div
            key={label as string}
            className={`border rounded-xl p-3 flex flex-col justify-between transform-gpu will-change-transform transition-transform duration-[120ms] ${
              index === 0 && justCompleted
                ? "scale-105 ring-1 ring-blue-300"
                : "hover:-translate-y-[1px]"
            } ${cardClass}`}
          >
            <span className={`text-[9px] font-bold uppercase tracking-wider ${textMuted}`}>
              {label}
            </span>
            <span className={`text-lg font-extrabold mt-1 ${textPrimary}`}>
              <AnimatedNumber value={value as number} />
              {suffix || ""}
            </span>
          </div>
        ))}
      </div>

      <MagneticCard className={`border rounded-2xl p-5 ${cardClass}`}>
        <div className="mb-5 flex items-center justify-between">
          <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${textMuted}`}>
            <BarChart2 size={14} className="text-blue-500" /> Category Velocity
          </div>

          <span className={`text-[9px] font-bold uppercase tracking-wider ${textMuted}`}>
            Live Race
          </span>
        </div>

        <div className="space-y-4">
          {groupStats.groupData.length > 0 ? (
            groupStats.groupData.map((g, i) => (
              <div key={g.name} className="flex flex-col gap-1.5 group">
                <div className={`flex justify-between text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>
                  <span className="truncate pr-2">{g.name}</span>
                  <span className="text-blue-500 group-hover:scale-110 transition-transform origin-right duration-[120ms]">
                    <AnimatedNumber value={g.pct} />%
                  </span>
                </div>

                <div className={`w-full h-2 rounded-full overflow-hidden shadow-inner ${softTrack}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-[250ms] ease-out ${
                      i === 0 ? "bg-orange-500" : "bg-blue-500"
                    }`}
                    style={{
                      width: `${g.pct}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className={`text-xs italic ${textMuted}`}>
              No category data racing yet.
            </div>
          )}
        </div>
      </MagneticCard>

      <div className={`md:hidden ${showMobileDetails ? "hidden" : "block"}`}>
        <button
          className={`w-full text-center text-xs font-semibold py-3 border rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm ${
            isDarkMode
              ? "bg-[#0a0a0a] text-gray-400 border-gray-800 hover:bg-[#111111]"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setShowMobileDetails(true)}
        >
          View Deep Analytics <ChevronRight size={14} />
        </button>
      </div>

      <div
        className={`flex flex-col gap-4 ${
          showMobileDetails
            ? "block animate-in fade-in slide-in-from-top-2 duration-200"
            : "hidden md:flex"
        }`}
      >
        {deferredGroups.length >= 3 && (
          <MagneticCard className={`border rounded-2xl p-5 ${cardClass}`}>
            <div className="mb-4 flex items-center justify-between">
              <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${textMuted}`}>
                <Crosshair size={14} className="text-blue-500" /> Focus Balance
              </div>
            </div>

            <div className="relative w-full h-[160px] flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full max-w-[160px] overflow-visible drop-shadow-sm"
              >
                <polygon
                  points="50,5 92.7,36 76.4,86 23.5,86 7.2,36"
                  fill="none"
                  stroke={isDarkMode ? "#1f2937" : "#f3f4f6"}
                  strokeWidth="1"
                />
                <polygon
                  points="50,16.25 82,39.5 69.8,77 30.2,77 18,39.5"
                  fill="none"
                  stroke={isDarkMode ? "#1f2937" : "#f3f4f6"}
                  strokeWidth="1"
                />
                <polygon
                  points="50,27.5 71.3,43 63.2,68 36.8,68 28.7,43"
                  fill="none"
                  stroke={isDarkMode ? "#1f2937" : "#f3f4f6"}
                  strokeWidth="1"
                />

                <line x1="50" y1="50" x2="50" y2="5" stroke={isDarkMode ? "#374151" : "#e5e7eb"} strokeWidth="1" />
                <line x1="50" y1="50" x2="92.7" y2="36" stroke={isDarkMode ? "#374151" : "#e5e7eb"} strokeWidth="1" />
                <line x1="50" y1="50" x2="76.4" y2="86" stroke={isDarkMode ? "#374151" : "#e5e7eb"} strokeWidth="1" />
                <line x1="50" y1="50" x2="23.5" y2="86" stroke={isDarkMode ? "#374151" : "#e5e7eb"} strokeWidth="1" />
                <line x1="50" y1="50" x2="7.2" y2="36" stroke={isDarkMode ? "#374151" : "#e5e7eb"} strokeWidth="1" />

                <polygon
                  points={radarPath}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  className="transition-all duration-[250ms] ease-out hover:fill-[rgba(59,130,246,0.3)]"
                />

                {radarPath
                  .split("M ")[1]
                  ?.split(" Z")[0]
                  .split(" L ")
                  .map((point, i) => {
                    if (!point) return null;

                    const [cx, cy] = point.split(",");

                    return (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r="2.5"
                        fill={isDarkMode ? "#0a0a0a" : "#fff"}
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                        className="transition-all duration-[250ms]"
                      />
                    );
                  })}
              </svg>
            </div>
          </MagneticCard>
        )}

        <MagneticCard className={`border rounded-2xl p-5 ${cardClass}`}>
          <div className={`mb-5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${textMuted}`}>
            <Activity size={14} className="text-green-500" /> Intensity Matrix
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-7 gap-1.5 sm:gap-2">
            {heatmapStats.heatmapData.map((day, idx) => {
              let colorClass = isDarkMode ? "bg-gray-900" : "bg-gray-100";

              if (day.intensity > 0) colorClass = "bg-green-200";
              if (day.intensity >= 0.33) colorClass = "bg-green-400";
              if (day.intensity >= 0.66) colorClass = "bg-green-500";
              if (day.intensity === 1) colorClass = "bg-green-600";

              const todayStyles = day.isToday
                ? `ring-2 ring-blue-400 relative z-10 ${
                    justCompleted
                      ? "bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)] scale-110"
                      : "shadow-[0_0_6px_rgba(59,130,246,0.5)] scale-105"
                  }`
                : "";

              return (
                <div
                  key={`${day.date}-${idx}`}
                  title={
                    day.date
                      ? `${day.date}: ${Math.round(day.intensity * 100)}%`
                      : ""
                  }
                  className={`aspect-square w-full rounded-md ${colorClass} ${todayStyles} hover:scale-110 hover:shadow-[0_0_8px_rgba(34,197,94,0.6)] transition-all cursor-help duration-[120ms]`}
                />
              );
            })}
          </div>

          <div className={`mt-5 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider ${textMuted}`}>
            <span>28 Days Lookback</span>

            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className={`w-2.5 h-2.5 rounded-[2px] ${isDarkMode ? "bg-gray-900" : "bg-gray-100"}`} />
              <div className="w-2.5 h-2.5 bg-green-200 rounded-[2px]" />
              <div className="w-2.5 h-2.5 bg-green-600 rounded-[2px]" />
              <span>More</span>
            </div>
          </div>
        </MagneticCard>
      </div>

      {showMobileDetails && (
        <button
          className={`md:hidden w-full text-center text-xs font-semibold py-3 mt-2 border rounded-xl transition-colors shadow-sm ${
            isDarkMode
              ? "bg-[#0a0a0a] text-gray-400 border-gray-800 hover:bg-[#111111]"
              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() => setShowMobileDetails(false)}
        >
          Hide Deep Analytics
        </button>
      )}
    </aside>
  );
}