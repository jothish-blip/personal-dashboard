"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";

// 🔹 Your specific imports
import { getSupabaseClient } from "@/lib/supabase";
import { useFocusSystem } from "@/modules/focus/engine/useFocusSystem";
import ThemeToggle from "@/theme/ThemeToggle";
import { useTheme } from "@/theme/ThemeProvider";
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
  ChevronLeft,
  Palette
} from "lucide-react";

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

type ThemeKey = keyof typeof THEMES;

// =========================
// ✨ ANIMATION SYSTEM (CLEANED)
// =========================
const ANIMATIONS = {
  none: "",
  breathe: "animated-n-breathe",
  "soft-glow": "animated-n-soft-glow",
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
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationKey>("soft-glow");
  
  // 🔥 State for the living indicator system
  const [indicatorMode, setIndicatorMode] = useState<IndicatorMode>("smart");
  const [showStreakIndicator, setShowStreakIndicator] = useState(false);
  // 🔹 Refs
const rootRef =
  useRef<HTMLDivElement>(
    null
  );

const pressStart =
  useRef(0);

const dragging =
  useRef(false);

const offset =
  useRef({
    x: 0,
    y: 0,
  });

const longPressTimer =
  useRef<
    NodeJS.Timeout | null
  >(null);

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
  const handleClick = (
    e: MouseEvent
  ) => {
    const target =
      e.target as Node;

    // clicked inside hub
    if (
      rootRef.current?.contains(
        target
      )
    ) {
      return;
    }

    // outside click
    setOpen(false);
    setIsCustomizing(
      false
    );
  };

  window.addEventListener(
    "mousedown",
    handleClick
  );

  return () =>
    window.removeEventListener(
      "mousedown",
      handleClick
    );
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

  // ✅ AFTER ALL HOOKS - Safe route hiding logic
  const hiddenRoutes = [
    "/login",
    "/register",
    "/auth/callback",
  ];

  const shouldHideHub = hiddenRoutes.includes(pathname);

  if (shouldHideHub) return null;
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
  const PANEL_WIDTH = 340;
  const PANEL_HEIGHT = 420; 

  const isNearRight = position.x + PANEL_WIDTH > window.innerWidth;
  const isNearBottom = position.y + PANEL_HEIGHT > window.innerHeight;

  const currentTheme = THEMES[selectedTheme];
  const baseAnimation = ANIMATIONS[selectedAnimation];
  
  // Clean fallback state animations to match the new premium minimal feel
  const stateAnimation = open && selectedAnimation === "none" ? "animated-n-soft-glow" : "";

  // 🔥 DETERMINE WHAT TO SHOW (Force 'N' if streak is 0)
  const shouldShowStreak = (indicatorMode === "streak" || (indicatorMode === "smart" && showStreakIndicator)) && currentStreak > 0;
  const displayText = shouldShowStreak ? `🔥${currentStreak}` : "N";

  // 🔥 DYNAMIC NAVIGATION TITLE
  const navTitle = pathname === "/focus" ? "Focus Tools" : pathname === "/Planner" ? "Plan Faster" : "Quick Access";

  // 🔹 Helper Components for Clean UI Rendering
  const ThemeButton = ({ themeKey }: { themeKey: string }) => (
    <button
      onClick={() => setSelectedTheme(themeKey as ThemeKey)}
      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none ${
        selectedTheme === themeKey 
          ? `scale-110 shadow-lg border-2 ${isDarkMode ? 'border-white' : 'border-zinc-900'}` 
          : "hover:scale-105 border-2 border-transparent"
      }`}
      aria-label={THEMES[themeKey as ThemeKey].name}
      title={THEMES[themeKey as ThemeKey].name}
    >
      <div className={`w-full h-full rounded-full bg-gradient-to-br ${THEMES[themeKey as ThemeKey].gradient}`} />
    </button>
  );

  const AnimationButton = ({ animKey }: { animKey: string }) => (
    <button
      onClick={() => setSelectedAnimation(animKey as AnimationKey)}
      className={`px-4 py-2 rounded-xl ${UI_TEXT.label} capitalize transition-all duration-200 ${
        selectedAnimation === animKey
          ? `bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md border border-transparent`
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
      className={`px-4 py-2 rounded-xl flex-1 ${UI_TEXT.label} transition-all duration-200 ${
        indicatorMode === mode
          ? `bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md border border-transparent`
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
        /* 🌟 SOFT GLOW */
        .animated-n-soft-glow { animation: softGlow 4s ease-in-out infinite; }
        @keyframes softGlow { 0%,100% { text-shadow: 0 0 4px rgba(255,255,255,0.3); } 50% { text-shadow: 0 0 12px rgba(255,255,255,0.8); } }
        /* 🌬️ BREATHE */
        .animated-n-breathe { animation: breathe 4s ease-in-out infinite; display: inline-block; }
        @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
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
          className={`w-[54px] h-[54px] rounded-full bg-gradient-to-br ${currentTheme.gradient} flex items-center justify-center text-white cursor-pointer touch-none select-none transition-all duration-300 ease-out ${isDragging ? "scale-105 opacity-90" : "hover:scale-105 active:scale-95"}`}
          style={{ 
            boxShadow: shouldShowStreak
              ? `0 0 30px rgba(249,115,22,0.45)` 
              : (open && !isDragging) || isDragging 
              ? `0 10px 30px rgba(0,0,0,0.35), 0 0 16px ${currentTheme.glow}` 
              : `0 8px 20px rgba(0,0,0,0.15), 0 0 10px ${currentTheme.glow.replace('0.5', '0.2')}` 
          }}
        >
          <span 
            className={`
              ${baseAnimation} 
              ${stateAnimation} 
              transition-all duration-500 ease-out tracking-wide 
              flex items-center justify-center font-bold text-[18px]
            `}
            style={{ 
              transform: shouldShowStreak ? "scale(1.05)" : "scale(1)",
            }}
          >
            {displayText}
          </span>
        </div>

        {/* 🔥 COMMAND CENTER PANEL */}
        {open && (
          <div
            className={`absolute w-[340px] backdrop-blur-2xl border rounded-[28px] p-4 overflow-visible animate-in fade-in zoom-in-95 duration-200 ease-out transition-colors ${
              isDarkMode 
                ? "bg-[#050505]/95 border-white/[0.06] shadow-[0_24px_80px_rgba(0,0,0,0.65)]" 
                : "bg-white/90 border-zinc-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
            }`}
            style={{
              maxHeight: "85vh",
              maxWidth: "calc(100vw - 24px)",
              marginRight: "12px",
              marginBottom: "12px",
              top: isNearBottom ? "auto" : "70px", 
              bottom: isNearBottom ? "70px" : "auto",
              left: isNearRight ? "auto" : "0", 
              right: isNearRight ? "0" : "auto",
            }}
          >
            {/* 1️⃣ TOP BAR */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span className={`uppercase flex items-center gap-1.5 ${UI_TEXT.label} ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                {isCustomizing ? (
                  <button
                  onClick={(e) => {
                  e.stopPropagation();
                  setIsCustomizing(false);
                  }} className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                    <ChevronLeft size={14} /> Hub
                  </button>
                ) : (
                  navTitle
                )}
              </span>

              <div className="flex items-center gap-1.5">
                {!isCustomizing && (
                  <>
                    <div className="cursor-pointer transition hover:scale-105 active:scale-95">
                      <ThemeToggle />
                    </div>
                    <button onClick={() => go("/settings")} className={`p-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${isDarkMode ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-600"}`}>
                      <Settings size={14} />
                    </button>
                    <Tooltip text="Logout">
                      <button onClick={async () => { setOpen(false); if (supabase) { await supabase.auth.signOut(); window.location.href = "/login"; } }} className={`p-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${isDarkMode ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-50 text-red-500"}`}>
                        <LogOut size={14} />
                      </button>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>

            <div className={`h-px w-full mb-3 ${isDarkMode ? "bg-white/[0.05]" : "bg-zinc-200"}`} />

            {/* 2️⃣ DYNAMIC CONTENT AREA */}
            <div className="relative w-full overflow-hidden">
              <div className="overflow-y-auto max-h-[420px] custom-scrollbar scroll-smooth p-1 -mx-1">
                
                {/* 🟢 DEFAULT MODE */}
                {!isCustomizing ? (
                  <>
                    <div className="space-y-1">
                      {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.path || (item.path !== "/" && pathname?.startsWith(item.path));
                        return (
                          <Item 
                            key={item.label} 
                            icon={item.icon} 
                            label={item.label} 
                            isActive={isActive} 
                            onClick={() => go(item.path)} 
                            isDarkMode={isDarkMode} 
                          />
                        );
                      })}
                    </div>

                    {/* 🔥 SETTINGS / PROFILE AREA */}
                    <div className={`mt-5 pt-5 border-t ${isDarkMode ? "border-white/[0.05]" : "border-zinc-200"}`}>
                      
                      {/* Customize Hub Button */}
                    <button
                   onClick={(e) => {
                   e.stopPropagation();
                   setIsCustomizing(true);
                  }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-3 transition-all duration-300 hover:translate-x-[2px] ${
                          isDarkMode 
                            ? "text-white/70 hover:bg-white/[0.04] hover:text-white" 
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                      >
                        <div className={`flex items-center justify-center ${isDarkMode ? "text-zinc-400" : "text-zinc-400"}`}>
                          <Palette size={16} />
                        </div>
                        <span className={UI_TEXT.item}>Customize Hub</span>
                      </button>

                      <div className="flex items-center gap-3 px-3 py-2 rounded-2xl cursor-default transition-colors">
                        
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
                          <span className={`mt-0.5 truncate ${UI_TEXT.meta}`}>{userProfile?.email || "Personal workspace"}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* 🟣 CUSTOMIZE MODE */
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="space-y-8 animate-in slide-in-from-right-4 duration-300 ease-out py-2 px-1"
                  >
                    
                    {/* 🎛️ HUB INDICATOR */}
                    <div>
                      <p className={`${UI_TEXT.section} ${isDarkMode ? "text-zinc-300" : "text-zinc-700"} mb-3`}>Hub</p>
                      <div className="flex gap-2">
                        <IndicatorButton mode="logo" label="Logo" />
                        <IndicatorButton mode="streak" label="Streak" />
                        <IndicatorButton mode="smart" label="Smart" />
                      </div>
                    </div>

                    {/* 🎨 APPEARANCE */}
                    <div>
                      <p className={`${UI_TEXT.section} ${isDarkMode ? "text-zinc-300" : "text-zinc-700"} mb-3`}>Appearance</p>
                      <div className="flex flex-wrap gap-3">
                        {(Object.keys(THEMES) as ThemeKey[]).map((key) => <ThemeButton key={key} themeKey={key} />)}
                      </div>
                    </div>

                    {/* ✨ MOTION */}
                    <div>
                      <p className={`${UI_TEXT.section} ${isDarkMode ? "text-zinc-300" : "text-zinc-700"} mb-3`}>Motion</p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(ANIMATIONS) as AnimationKey[]).map((anim) => <AnimationButton key={anim} animKey={anim} />)}
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

// 🔹 ITEM COMPONENT (UPDATED FOR PURE DARK MODE & GLOW BAR)
function Item({ 
  icon, 
  label, 
  isActive, 
  onClick, 
  isDarkMode 
}: { 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  onClick: () => void; 
  isDarkMode: boolean; 
}) {
  return (
    <div 
      onClick={onClick} 
      className={`relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:translate-x-[2px] border ${
        isActive 
          ? (isDarkMode ? "bg-white/[0.06] text-white border-white/[0.06] shadow-sm" : "bg-zinc-100 text-zinc-900 font-semibold border-transparent shadow-sm")
          : (isDarkMode ? "text-white/50 hover:bg-white/[0.04] hover:text-white border-transparent" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border-transparent")
      }`}
    >
      {isActive && isDarkMode && (
        <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-white/80" />
      )}
      <div className={`flex items-center justify-center ${isActive ? (isDarkMode ? "text-zinc-200" : "text-zinc-800") : (isDarkMode ? "text-zinc-500" : "text-zinc-400")}`}>
        {icon}
      </div>
      <span className={UI_TEXT.item}>{label}</span>
    </div>
  );
}

// 🔹 TOOLTIP COMPONENT (NO CHANGES NEEDED, USAGE REFINED ABOVE)
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
        className={`absolute z-[99999] max-w-[200px] px-2.5 py-1.5 rounded-xl ${UI_TEXT.label} whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 ease-out shadow-xl ${
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