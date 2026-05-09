"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";

// 🔹 Your specific imports
import { getSupabaseClient } from "@/lib/supabase";
import { useFocusSystem } from "@/modules/focus/engine/useFocusSystem";
import { ThemeProvider } from "@/theme/ThemeProvider";
import ThemeToggle from "@/theme/ThemeToggle";
import { useNexCore } from "@/modules/tasks/engine/useNexCore";

import {
  LayoutGrid,
  Brain,
  CalendarDays,
  BookOpen,
  ListTodo,
  Settings,
  LogOut,
  Camera,
  Pencil,
  ChevronLeft
} from "lucide-react";
import { useTheme } from "../ThemeProvider_BackupFile";

// =========================
// 🔠 TYPOGRAPHY SYSTEM (STRICT)
// =========================
const UI_TEXT = {
  label: "text-[11px] font-medium tracking-wide",
  section: "text-[12px] font-semibold tracking-wide",
  item: "text-[13px] font-medium",
  meta: "text-[11px] text-zinc-500 dark:text-zinc-400"
};

// =========================
// 🎨 THEME SYSTEM
// =========================
const THEMES = {
  monochrome: { name: "Carbon", gradient: "from-zinc-600 to-zinc-900 dark:from-zinc-200 dark:to-zinc-500", glow: "rgba(113,113,122,0.4)" },
  orange: { name: "Sunset", gradient: "from-orange-500 to-red-600", glow: "rgba(249,115,22,0.5)" },
  blue: { name: "Ocean", gradient: "from-blue-500 to-indigo-600", glow: "rgba(59,130,246,0.5)" },
  emerald: { name: "Emerald", gradient: "from-emerald-400 to-teal-600", glow: "rgba(16,185,129,0.5)" },
  purple: { name: "Amethyst", gradient: "from-purple-500 to-fuchsia-600", glow: "rgba(168,85,247,0.5)" },
  "neon-red": { name: "Neon Red", gradient: "from-red-500 to-rose-600", glow: "rgba(225,29,72,0.6)" },
  "cyber-yellow": { name: "Cyber", gradient: "from-yellow-400 to-orange-500", glow: "rgba(250,204,21,0.6)" },
  "electric-blue": { name: "Electric", gradient: "from-cyan-400 to-blue-600", glow: "rgba(6,182,212,0.6)" },
  "toxic-green": { name: "Toxic", gradient: "from-lime-400 to-green-600", glow: "rgba(132,204,22,0.6)" },
  "ultra-pink": { name: "Ultra", gradient: "from-pink-500 to-rose-600", glow: "rgba(236,72,153,0.6)" }
};

const THEME_GROUPS = {
  minimal: ["monochrome"],
  standard: ["orange", "blue", "emerald", "purple"],
  aggressive: ["neon-red", "cyber-yellow", "electric-blue", "toxic-green", "ultra-pink"]
};

type ThemeKey = keyof typeof THEMES;

// =========================
// ✨ ANIMATION SYSTEM
// =========================
const ANIMATIONS = {
  none: "",
  fade: "animated-n-fade",
  "soft-glow": "animated-n-soft-glow",
  breathe: "animated-n-breathe",
  flow: "animated-n-flow",
  rotate: "animated-n-rotate",
  wave: "animated-n-wave",
  slide: "animated-n-slide",
  zoom: "animated-n-zoom",
  float: "animated-n-float",
  pulse: "animated-n-pulse",
  neon: "animated-n-neon",
  shine: "animated-n-shine",
  glitch: "animated-n-glitch",
  spark: "animated-n-spark",
  flicker: "animated-n-flicker",
  electric: "animated-n-electric",
};

const ANIMATION_GROUPS = {
  minimal: ["none", "fade", "soft-glow", "breathe"],
  standard: ["flow", "rotate", "wave", "slide", "zoom", "float"],
  expressive: ["pulse", "neon", "shine", "glitch", "spark", "flicker", "electric"]
};

type AnimationKey = keyof typeof ANIMATIONS;

// 🔥 New Type for the Smart Indicator Mode
type IndicatorMode = "logo" | "streak" | "smart";

// 🔹 Extracted Config
const NAV_ITEMS = [
  { icon: <LayoutGrid size={16} />, label: "Tasks", path: "/" },
  { icon: <Brain size={16} />, label: "Focus", path: "/focus" },
  { icon: <CalendarDays size={16} />, label: "Planner", path: "/Planner" },
  { icon: <BookOpen size={16} />, label: "Diary", path: "/diary" },
  { icon: <ListTodo size={16} />, label: "Workspace", path: "/Workspace" },
];

export default function FloatingHub() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useTheme();

  // 🔥 Fetch live streak from NexCore
  const { currentStreak } = useNexCore(); 

  if (pathname === "/login" || pathname === "/register") return null;

  // 🔹 State
  const supabase = getSupabaseClient();
  const { currentUser } = useFocusSystem();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 120 });
  
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("orange");
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationKey>("flow");
  
  // 🔥 State for the living indicator system
  const [indicatorMode, setIndicatorMode] = useState<IndicatorMode>("smart");
  const [showStreakIndicator, setShowStreakIndicator] = useState(false);

  // 🔹 Refs
  const rootRef = useRef<HTMLDivElement>(null);
  const pressStart = useRef(0);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // 🟢 PERSISTENCE
  useEffect(() => {
    const savedTheme = localStorage.getItem("hub-theme") as ThemeKey;
    const savedAnimation = localStorage.getItem("hub-animation") as AnimationKey;
    const savedPos = localStorage.getItem("hub-position");
    const savedIndicator = localStorage.getItem("hub-indicator-mode") as IndicatorMode;

    if (savedTheme && THEMES[savedTheme]) setSelectedTheme(savedTheme);
    if (savedAnimation && ANIMATIONS[savedAnimation] !== undefined) setSelectedAnimation(savedAnimation);
    if (savedIndicator) setIndicatorMode(savedIndicator);
    if (savedPos) {
      try { setPosition(JSON.parse(savedPos)); } catch (e) { }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("hub-theme", selectedTheme);
  }, [selectedTheme, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem("hub-animation", selectedAnimation);
  }, [selectedAnimation, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem("hub-position", JSON.stringify(position));
  }, [position, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem("hub-indicator-mode", indicatorMode);
  }, [indicatorMode, mounted]);

  // 🟢 FETCH PROFILE
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!supabase || !currentUser?.id) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
      if (data && isMounted) setUserProfile(data);
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, [supabase, currentUser]);

  // 🔥 SMART SWITCHING LOGIC
  useEffect(() => {
    if (indicatorMode !== "smart") {
      setShowStreakIndicator(false);
      return;
    }

    let timeout: NodeJS.Timeout;

    const switchView = (isStreakCurrentlyShowing: boolean) => {
      timeout = setTimeout(() => {
        const nextState = !isStreakCurrentlyShowing;
        setShowStreakIndicator(nextState);
        switchView(nextState); // Recursively loop
      }, isStreakCurrentlyShowing ? 3200 : 8500); // Show streak for 3.2s, N for 8.5s
    };

    // Initial trigger
    timeout = setTimeout(() => {
      setShowStreakIndicator(true);
      switchView(true);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [indicatorMode]);

  // 🟢 EVENTS (Fixed UX)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && rootRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setIsCustomizing(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 🟢 DRAG LOGIC
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setPosition({
      x: Math.max(16, Math.min(e.clientX - offset.current.x, window.innerWidth - 86)),
      y: Math.max(80, Math.min(e.clientY - offset.current.y, window.innerHeight - 80)),
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragging.current) return;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    setPosition({
      x: Math.max(16, Math.min(touch.clientX - offset.current.x, window.innerWidth - 86)),
      y: Math.max(80, Math.min(touch.clientY - offset.current.y, window.innerHeight - 80)),
    });
  };

  const stopDragging = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    document.body.style.overflow = "";

    const middle = window.innerWidth / 2;
    setPosition((prev) => ({
      x: prev.x < middle ? 16 : window.innerWidth - 86,
      y: Math.max(80, Math.min(prev.y, window.innerHeight - 80)),
    }));
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", stopDragging);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDragging);
    };
  }, []);

  if (!mounted) return null;

  const go = (path: string) => {
    router.push(path);
    setOpen(false);
    setIsCustomizing(false);
  };

  // 🔹 Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDragging) return;
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id || !supabase) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${currentUser.id}/profile_avatar.${fileExt}`;
      await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", currentUser.id);
      setUserProfile((prev: any) => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (error) {
      console.error("Avatar upload error:", error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 🔥 UX Width and Height logic adjusted
  const PANEL_WIDTH = 300;
  const PANEL_HEIGHT = 420; 

  const isNearRight = position.x + PANEL_WIDTH > window.innerWidth;
  const isNearBottom = position.y + PANEL_HEIGHT > window.innerHeight;

  const currentTheme = THEMES[selectedTheme];
  const baseAnimation = ANIMATIONS[selectedAnimation];
  
  // Only use stateAnimation overrides if necessary, to let custom animations shine
  const stateAnimation = open && selectedAnimation === "none" ? "animated-n-neon" : isDragging && selectedAnimation === "none" ? "animated-n-pulse" : "";

  // 🔥 DETERMINE WHAT TO SHOW (Force 'N' if streak is 0)
  const shouldShowStreak = (indicatorMode === "streak" || (indicatorMode === "smart" && showStreakIndicator)) && currentStreak > 0;
  const displayText = shouldShowStreak ? `🔥${currentStreak}` : "N";

  // 🔹 Helper Components for Clean UI Rendering
  const ThemeButton = ({ themeKey }: { themeKey: string }) => (
    <Tooltip text={THEMES[themeKey as ThemeKey].name}>
      <button
        onClick={() => setSelectedTheme(themeKey as ThemeKey)}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none ${
          selectedTheme === themeKey 
            ? `scale-110 shadow-lg border-2 ${isDarkMode ? 'border-white' : 'border-zinc-900'}` 
            : "hover:scale-105 border-2 border-transparent"
        }`}
      >
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${THEMES[themeKey as ThemeKey].gradient}`} />
      </button>
    </Tooltip>
  );

  const AnimationButton = ({ animKey }: { animKey: string }) => (
    <button
      onClick={() => setSelectedAnimation(animKey as AnimationKey)}
      className={`px-3 py-1.5 rounded-md ${UI_TEXT.label} capitalize transition-all duration-200 ${
        selectedAnimation === animKey
          ? `bg-gradient-to-br ${currentTheme.gradient} text-white shadow-md border border-transparent`
          : isDarkMode
          ? "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-transparent"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-transparent"
      }`}
    >
      {animKey.replace('-', ' ')}
    </button>
  );

  const IndicatorButton = ({ mode, label }: { mode: IndicatorMode; label: string }) => (
    <button
      onClick={() => setIndicatorMode(mode)}
      className={`px-3 py-1.5 rounded-md ${UI_TEXT.label} transition-all duration-200 ${
        indicatorMode === mode
          ? `bg-gradient-to-br ${currentTheme.gradient} text-white shadow-md border border-transparent`
          : isDarkMode
          ? "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-transparent"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-transparent"
      }`}
    >
      {label}
    </button>
  );

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* 🧊 FADE */
        .animated-n-fade { animation: fadeInOut 2.5s ease-in-out infinite; }
        @keyframes fadeInOut { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        /* 🌟 SOFT GLOW */
        .animated-n-soft-glow { animation: softGlow 3s ease-in-out infinite; }
        @keyframes softGlow { 0%,100% { text-shadow: 0 0 2px rgba(255,255,255,0.2); } 50% { text-shadow: 0 0 8px rgba(255,255,255,0.6); } }
        /* 🌬️ BREATHE */
        .animated-n-breathe { animation: breathe 3s ease-in-out infinite; display: inline-block; }
        @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        
        /* ORIGINAL STANDARD */
        .animated-n-flow { font-weight: 700; background: linear-gradient(270deg, #ffffff, rgba(255,255,255,0.6), #ffffff); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: flowMove 4s ease infinite; }
        @keyframes flowMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animated-n-rotate { font-weight: 700; background: linear-gradient(90deg, #fff, rgba(255,255,255,0.2), #fff); background-size: 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: rotateText 3s linear infinite; }
        @keyframes rotateText { 0% { background-position: 0% } 100% { background-position: 200% } }
        
        /* 🌊 WAVE */
        .animated-n-wave { animation: waveMove 2s ease-in-out infinite; display: inline-block; }
        @keyframes waveMove { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        /* ↔️ SLIDE */
        .animated-n-slide { animation: slideMove 2s ease-in-out infinite; display: inline-block; }
        @keyframes slideMove { 0%,100% { transform: translateX(0); } 50% { transform: translateX(3px); } }
        /* 🔍 ZOOM */
        .animated-n-zoom { animation: zoomMove 1.5s ease-in-out infinite; display: inline-block; }
        @keyframes zoomMove { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        /* 🌀 FLOAT */
        .animated-n-float { animation: floatMove 3s ease-in-out infinite; display: inline-block; }
        @keyframes floatMove { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

        /* ORIGINAL EXPRESSIVE */
        .animated-n-pulse { font-weight: 700; color: #fff; animation: pulseGlow 2s ease-in-out infinite; }
        @keyframes pulseGlow { 0% { text-shadow: 0 0 5px rgba(255,255,255,0.4); transform: scale(1); } 50% { text-shadow: 0 0 20px rgba(255,255,255,0.9); transform: scale(1.05); } 100% { text-shadow: 0 0 5px rgba(255,255,255,0.4); transform: scale(1); } }
        .animated-n-neon { font-weight: 700; background: linear-gradient(90deg, #fff, rgba(255,255,255,0.3), #fff); background-size: 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: neonSweep 2s linear infinite; }
        @keyframes neonSweep { 0% { background-position: -100%; } 100% { background-position: 100%; } }
        .animated-n-shine { font-weight: 700; color: white; position: relative; overflow: hidden; display: inline-block; }
        .animated-n-shine::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.8), transparent); animation: shineMove 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes shineMove { 100% { left: 200%; } }

        /* ⚡ GLITCH */
        .animated-n-glitch { animation: glitch 0.8s infinite; display: inline-block; }
        @keyframes glitch { 0% { transform: translate(0); } 20% { transform: translate(-1px, 1px); } 40% { transform: translate(1px, -1px); } 60% { transform: translate(-1px, 0); } 80% { transform: translate(1px, 0); } 100% { transform: translate(0); } }
        /* ⚡ ELECTRIC */
        .animated-n-electric { animation: electric 0.5s infinite; }
        @keyframes electric { 0%,100% { text-shadow: 0 0 5px #fff; } 50% { text-shadow: 0 0 20px #fff, 0 0 30px #fff; } }
        /* ✨ SPARK */
        .animated-n-spark { animation: spark 1.5s infinite; }
        @keyframes spark { 0%,100% { opacity: 0.8; } 50% { opacity: 1; text-shadow: 0 0 15px #fff; } }
        /* 🕯️ FLICKER */
        .animated-n-flicker { animation: flickerText 3s infinite; }
        @keyframes flickerText { 0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; } 20%, 24%, 55% { opacity: 0.4; text-shadow: none; } }
      `}} />

      <div
        ref={rootRef}
        className="assistant-panel select-none"
        style={{
          position: "fixed", left: position.x, top: position.y, zIndex: 9999,
          transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* 🔥 LIVING FLOATING BUTTON */}
        <div
          onMouseDown={(e) => {
            pressStart.current = Date.now(); dragging.current = true; setIsDragging(true);
            offset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
          }}
          onTouchStart={(e) => {
            pressStart.current = Date.now(); dragging.current = true; setIsDragging(true);
            if (navigator.vibrate) navigator.vibrate(10);
            longPressTimer.current = setTimeout(() => { setOpen(true); setIsDragging(false); }, 500);
            offset.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
            document.body.style.overflow = "hidden";
          }}
          onClick={() => {
            if (Date.now() - pressStart.current < 200 && !isDragging) {
              setOpen((prev) => !prev);
              if (open) setIsCustomizing(false); 
            }
          }}
          className={`w-14 h-14 rounded-full bg-gradient-to-br ${currentTheme.gradient} flex items-center justify-center text-white cursor-pointer touch-none select-none transition-all duration-300 ease-out ${isDragging ? "scale-105 opacity-90" : "hover:scale-105 active:scale-95"}`}
          style={{ 
            boxShadow: shouldShowStreak
              ? `0 0 35px rgba(249,115,22,0.55)` 
              : (open && !isDragging) || isDragging 
              ? `0 0 30px ${currentTheme.glow}` 
              : `0 8px 20px rgba(0,0,0,0.15), 0 0 15px ${currentTheme.glow.replace('0.5', '0.2')}` 
          }}
        >
          <span 
            className={`
              ${baseAnimation} 
              ${stateAnimation} 
              transition-all duration-500 ease-out tracking-wide 
              flex items-center justify-center font-bold text-xl
            `}
            style={{ 
              transform: shouldShowStreak ? "scale(1.05)" : "scale(1)",
              animationDuration: open && selectedAnimation === "none" ? "1.2s" : "" 
            }}
          >
            {displayText}
          </span>
        </div>

        {/* 🔥 COMMAND CENTER PANEL */}
        {open && (
          <div
            className={`absolute w-[300px] backdrop-blur-2xl border rounded-2xl p-3 overflow-visible animate-in fade-in zoom-in-95 duration-200 ease-out transition-colors ${
              isDarkMode ? "bg-zinc-900/85 border-zinc-800/60 shadow-[0_12px_40px_rgba(0,0,0,0.8)]" : "bg-white/90 border-zinc-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
            }`}
            style={{
              maxHeight: "85vh",
              maxWidth: "calc(100vw - 24px)",
              marginRight: "12px",
              marginBottom: "12px",
              top: isNearBottom ? "auto" : "78px", 
              bottom: isNearBottom ? "78px" : "auto",
              left: isNearRight ? "auto" : "0", 
              right: isNearRight ? "0" : "auto",
            }}
          >
            {/* 1️⃣ TOP BAR */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className={`uppercase flex items-center gap-1.5 ${UI_TEXT.label} ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                {isCustomizing ? (
                  <button onClick={() => setIsCustomizing(false)} className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                    <ChevronLeft size={14} /> Back
                  </button>
                ) : (
                  "Quick Access"
                )}
              </span>

              <div className="flex items-center gap-1.5">
                {!isCustomizing && (
                  <>
                    <Tooltip text={isDarkMode ? "Light Mode" : "Dark Mode"}>
                      <div className="cursor-pointer transition hover:scale-105 active:scale-95"><ThemeToggle /></div>
                    </Tooltip>
                    <Tooltip text="Settings">
                      <button onClick={() => go("/settings")} className={`p-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${isDarkMode ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-600"}`}><Settings size={14} /></button>
                    </Tooltip>
                  </>
                )}
                <Tooltip text="Customize Hub">
                  <button onClick={() => setIsCustomizing((prev) => !prev)} className={`p-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${isCustomizing ? `bg-gradient-to-br ${currentTheme.gradient} text-white shadow-md` : isDarkMode ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-600"}`}><Pencil size={14} /></button>
                </Tooltip>
                {!isCustomizing && (
                  <Tooltip text="Logout">
                    <button onClick={async () => { setOpen(false); if (supabase) { await supabase.auth.signOut(); window.location.href = "/login"; } }} className={`p-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${isDarkMode ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-50 text-red-500"}`}><LogOut size={14} /></button>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className={`h-px w-full mb-2 ${isDarkMode ? "bg-zinc-800/60" : "bg-zinc-200"}`} />

            {/* 2️⃣ DYNAMIC CONTENT AREA */}
            <div className="relative w-full overflow-hidden">
              <div className="overflow-y-auto max-h-[420px] custom-scrollbar scroll-smooth p-1 -mx-1">
                
                {/* 🟢 DEFAULT MODE */}
                {!isCustomizing ? (
                  <>
                    <div className="space-y-0.5">
                      {NAV_ITEMS.map((item) => (
                        <Item key={item.label} icon={item.icon} label={item.label} onClick={() => go(item.path)} isDarkMode={isDarkMode} />
                      ))}
                    </div>

                    <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-zinc-800/60" : "border-zinc-200"}`}>
                      <div className="flex items-center gap-3 px-3 py-3 rounded-2xl cursor-default transition-colors">
                        
                        <Tooltip text="Change Avatar" position="right">
                          <label className="relative group cursor-pointer" onClick={(e) => isDragging && e.preventDefault()}>
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                            <div className={`w-10 h-10 rounded-full overflow-hidden shadow-sm relative ring-2 ring-transparent group-hover:ring-zinc-300 dark:group-hover:ring-zinc-600 transition-all ${isUploadingAvatar ? "opacity-50 animate-pulse" : ""}`}>
                              {userProfile?.avatar_url ? (
                                <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center font-semibold ${UI_TEXT.item} ${isDarkMode ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>{userProfile?.full_name?.[0] || "U"}</div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200"><Camera size={16} className="text-white drop-shadow-md" /></div>
                            </div>
                          </label>
                        </Tooltip>
                        
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className={`truncate ${UI_TEXT.item} ${isDarkMode ? "text-zinc-100" : "text-zinc-900"}`}>{userProfile?.full_name || "User Profile"}</span>
                          <span className={`mt-0.5 truncate ${UI_TEXT.meta}`}>{userProfile?.email || "Manage account"}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* 🟣 CUSTOMIZE MODE (Safely Prevent Accidental Close) */
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="space-y-6 animate-in slide-in-from-right-4 duration-300 ease-out py-2 px-1"
                  >
                    
                    {/* 🎛️ HUB INDICATOR */}
                    <div>
                      <p className={`${UI_TEXT.section} ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}>Hub Indicator</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <IndicatorButton mode="logo" label="Always N" />
                        <IndicatorButton mode="streak" label="Always Streak" />
                        <IndicatorButton mode="smart" label="Smart Switch" />
                      </div>
                    </div>

                    {/* 🧊 MINIMAL */}
                    <div>
                      <p className={`${UI_TEXT.section} ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}>Minimal</p>
                      <div className="flex gap-2 mt-2">
                        {THEME_GROUPS.minimal.map((key) => <ThemeButton key={key} themeKey={key} />)}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ANIMATION_GROUPS.minimal.map((anim) => <AnimationButton key={anim} animKey={anim} />)}
                      </div>
                    </div>

                    {/* 🎯 BALANCED */}
                    <div>
                      <p className={`${UI_TEXT.section} ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}>Balanced</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {THEME_GROUPS.standard.map((key) => <ThemeButton key={key} themeKey={key} />)}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ANIMATION_GROUPS.standard.map((anim) => <AnimationButton key={anim} animKey={anim} />)}
                      </div>
                    </div>

                    {/* ⚡ HIGH ENERGY */}
                    <div>
                      <p className={`${UI_TEXT.section} ${isDarkMode ? "text-zinc-300" : "text-zinc-700"}`}>High Energy</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {THEME_GROUPS.aggressive.map((key) => <ThemeButton key={key} themeKey={key} />)}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ANIMATION_GROUPS.expressive.map((anim) => <AnimationButton key={anim} animKey={anim} />)}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </>,
    document.body
  );
}

// 🔹 ITEM COMPONENT
function Item({ icon, label, onClick, isDarkMode }: { icon: React.ReactNode; label: string; onClick: () => void; isDarkMode: boolean; }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${isDarkMode ? "text-zinc-300 hover:bg-zinc-800/80 hover:text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}>
      <div className={`flex items-center justify-center ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>{icon}</div>
      <span className={UI_TEXT.item}>{label}</span>
    </div>
  );
}

// 🔹 TOOLTIP COMPONENT
function Tooltip({
  text,
  children,
  position = "top",
}: {
  text: string;
  children: React.ReactNode;
  position?: "top" | "right";
}) {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="relative group flex items-center justify-center">
      {children}
      <div
        className={`absolute z-[99999] max-w-[200px] px-2.5 py-1.5 rounded-md ${UI_TEXT.label} whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 ease-out shadow-xl ${
          position === "right"
            ? "left-[calc(100%+12px)] top-1/2 -translate-y-1/2 translate-x-[-4px] group-hover:translate-x-0"
            : "bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 translate-y-1 group-hover:translate-y-0"
        } ${
          isDarkMode
            ? "bg-zinc-800 text-zinc-200 border border-zinc-700/50"
            : "bg-zinc-900 text-white border border-zinc-800"
        }`}
      >
        {text}
        <div
          className={`absolute w-2 h-2 rotate-45 ${
            position === "right"
              ? "-left-1 top-1/2 -translate-y-1/2"
              : "-bottom-1 left-1/2 -translate-x-1/2"
          } ${
            isDarkMode
              ? `bg-zinc-800 border-zinc-700/50 ${position === 'right' ? 'border-l border-b' : 'border-b border-r'}`
              : "bg-zinc-900"
          }`}
        />
      </div>
    </div>
  );
}