"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Square, Play, Minimize, Check, Sparkles } from "lucide-react";
import { useFocusSystem } from "../../engine/useFocusSystem";

interface FocusFullscreenProps {
  onExit: () => void;
}

export default function FocusFullscreen({ onExit }: FocusFullscreenProps) {
  const {
    timeRemaining,
    initialSessionTime,
    isActive,
    isPaused,
    mode,
    currentSession,
    extraTime,
    activeTaskId,
    distractions,
    pauseSession,
    resumeSession,
    stopSession,
    getRemainingTime,
    getElapsedTime,
  } = useFocusSystem();

  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<"pause" | "endNormal" | "endExtra" | null>(null);
  
  // Anti-spam locks
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Immersion states
  const [isIdle, setIsIdle] = useState(false);
  const [showGoalReached, setShowGoalReached] = useState(false);

  const lastTimeRef = useRef(initialSessionTime);
  const isExtraMode = !!currentSession?.completedAt;
  const previousExtraModeRef = useRef(isExtraMode);

  // 1. Initial Mount & Lock
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // 2. Goal Reached Transition Detection
  useEffect(() => {
    if (!previousExtraModeRef.current && isExtraMode) {
      setShowGoalReached(true);
      const t = setTimeout(() => setShowGoalReached(false), 3000);
      return () => clearTimeout(t);
    }
    previousExtraModeRef.current = isExtraMode;
  }, [isExtraMode]);

  // 3. Smart Idle Detection (Hides UI)
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const resetIdle = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      // Only hide if not paused and no modal is open
      if (!isPaused && !activeModal) {
        idleTimer = setTimeout(() => setIsIdle(true), 3000);
      }
    };

    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);
    window.addEventListener("touchstart", resetIdle);
    
    resetIdle();
    
    return () => {
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
      clearTimeout(idleTimer);
    };
  }, [isPaused, activeModal]);

  // 4. Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (activeModal) return; 

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          if (isExtraMode) return;
          if (isPaused) handleResume();
          else handleModalOpen("pause");
          break;
        case "e":
          e.preventDefault();
          handleModalOpen(isExtraMode ? "endExtra" : "endNormal");
          break;
        case "escape":
          e.preventDefault();
          if (!activeModal) exitFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, isPaused, isExtraMode, activeModal]);

  // 5. Display Time Logic (Syncs with strictly evaluated elapsed time)
  const displayTime = useMemo(() => {
    let time;
    if (!isActive && !isPaused && !isExtraMode) {
      time = initialSessionTime;
    } else if (currentSession?.completedAt) {
      time = extraTime;
    } else if (currentSession) {
      time = getRemainingTime();
    } else {
      time = timeRemaining;
    }

    if (activeModal && !isActive && !isPaused && !isExtraMode) {
      return lastTimeRef.current;
    }

    lastTimeRef.current = time;
    return time;
  }, [isActive, isPaused, isExtraMode, currentSession, extraTime, getRemainingTime, timeRemaining, initialSessionTime, activeModal]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  // Actions
  const handleModalOpen = (type: "pause" | "endNormal" | "endExtra") => {
    if (isProcessing) return;
    if (isActive && !isPaused && type !== "endExtra") {
      pauseSession();
    }
    setActiveModal(type);
    setIsIdle(false);
  };

  const handleResume = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      resumeSession();
      setActiveModal(null);
    } finally {
      setTimeout(() => setIsProcessing(false), 300);
    }
  };

  const confirmEnd = (saveExtra: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    setIsProcessing(true);
    
    stopSession(saveExtra);
    setActiveModal(null);
    
    // Slight delay to allow local state to clear before exit
    setTimeout(() => {
      setIsProcessing(false);
      onExit();
    }, 100);
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    onExit();
  };

  const taskName = currentSession?.taskTitle || activeTaskId || "Focus Session";
  const modeLabel = mode === "pomodoro" ? "POMODORO" : "DEEP WORK";
  const durationLabel = `${Math.floor(initialSessionTime / 60)} MIN`;
  const isCritical = isActive && displayTime < 120 && !isExtraMode && !isPaused;

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-between p-8 md:p-12 bg-black text-white overflow-hidden select-none"
    >
      {/* AMBIENT BACKGROUND GLOW */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute w-[600px] h-[600px] md:w-[1000px] md:h-[1000px] rounded-full blur-[120px] md:blur-[200px] transition-colors duration-1000 ${
            isExtraMode ? "bg-purple-600/15" : isCritical ? "bg-red-600/15" : "bg-emerald-500/10"
          }`} 
        />
      </div>

      {/* TOP: Task Info & Stats Strip */}
      <div className="w-full flex justify-between items-start z-10">
        <div className="flex-1" /> {/* Spacer */}
        
        <div className="flex flex-col items-center mt-6 md:mt-10 text-center space-y-2 flex-shrink-0">
          <h1 className="text-xl font-[400] tracking-[-0.02em] text-white/85">
            {taskName}
          </h1>
          <div className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-white/30 uppercase">
            {modeLabel} • {durationLabel}
          </div>
        </div>

        <div className="flex-1 flex justify-end">
          <AnimatePresence>
            {!isIdle && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-right text-[10px] md:text-xs text-white/30 font-medium tracking-wide space-y-1 mt-6"
              >
                <div>FOCUSED: {Math.floor(getElapsedTime() / 60)}M</div>
                <div>DISTRACTIONS: {distractions.length}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CENTER: Giant Breathing Timer */}
      <div className="flex flex-col items-center justify-center flex-1 w-full relative z-10">
        <AnimatePresence mode="wait">
          {showGoalReached ? (
            <motion.div
              key="goal-reached"
              initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-6xl font-[300] tracking-tight text-white/90"
            >
              Goal Reached
            </motion.div>
          ) : (
            <motion.div
              key="timer"
              animate={{ scale: [1, 1.01, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <AnimatePresence>
                {isExtraMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-purple-400/80 font-medium tracking-[0.4em] uppercase text-xs md:text-sm mb-4 md:mb-8 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  >
                    Extra Focus
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={`text-[8rem] sm:text-[12rem] md:text-[16rem] lg:text-[18rem] font-[250] tracking-[-0.08em] leading-none tabular-nums transition-colors duration-1000 ${
                isExtraMode ? "text-purple-50/90" : isCritical ? "text-red-50/90" : "text-white/95"
              }`}>
                {formatTime(displayTime)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM: Floating Glass Controls */}
      <AnimatePresence>
        {!isIdle && !activeModal && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="z-20 mb-8"
          >
            <div className="flex items-center gap-2 p-2 rounded-full backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] shadow-2xl">
              {isExtraMode ? (
                <button
                  onClick={(e) => handleModalOpen("endExtra")}
                  disabled={isProcessing}
                  className="px-8 py-3.5 rounded-full bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 transition-colors font-medium flex items-center gap-2"
                >
                  <Check size={18} /> Complete Session
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={handleResume}
                      disabled={isProcessing}
                      className="px-8 py-3.5 rounded-full bg-white text-black hover:bg-gray-200 transition-colors font-semibold flex items-center gap-2"
                    >
                      <Play size={18} className="fill-current" /> Resume
                    </button>
                  ) : (
                    <button
                      onClick={() => handleModalOpen("pause")}
                      disabled={isProcessing}
                      className="px-8 py-3.5 rounded-full bg-transparent text-white/80 hover:bg-white/10 hover:text-white transition-colors font-medium flex items-center gap-2"
                    >
                      <Pause size={18} className="fill-current" /> Pause
                    </button>
                  )}
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button
                    onClick={() => handleModalOpen("endNormal")}
                    disabled={isProcessing}
                    className="px-6 py-3.5 rounded-full bg-transparent text-white/60 hover:bg-white/10 hover:text-white transition-colors font-medium flex items-center gap-2"
                  >
                    <Square size={16} className="fill-current" /> End
                  </button>
                </>
              )}
              
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button
                onClick={exitFullscreen}
                className="px-6 py-3.5 rounded-full bg-transparent text-white/50 hover:bg-white/10 hover:text-white transition-colors font-medium flex items-center gap-2"
                title="Exit Fullscreen (Esc)"
              >
                <Minimize size={18} />
              </button>
            </div>
            
            <div className="text-center mt-4 text-[10px] text-white/20 font-medium tracking-widest uppercase">
              Press Space to {isPaused ? "Resume" : "Pause"} • Esc to Exit
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMMERSIVE MODALS */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="flex flex-col items-center text-center p-8 max-w-md w-full"
            >
              {activeModal === "endExtra" ? (
                <>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-purple-500/10 text-purple-400">
                    <Sparkles size={28} className="fill-current" />
                  </div>
                  <h2 className="text-3xl font-[300] text-white mb-2 tracking-tight">Goal Reached</h2>
                  <p className="text-white/50 text-sm mb-8">You successfully pushed beyond your planned focus time.</p>

                  <div className="rounded-2xl p-5 w-full mb-8 flex flex-col gap-3 text-left bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-white/50">Target Goal:</span>
                      <span className="text-white/90">{Math.floor(initialSessionTime / 60)} min</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-purple-400/80">Extra Focus:</span>
                      <span className="text-purple-400/80">+{formatTime(extraTime)}</span>
                    </div>
                    <div className="h-px w-full my-1 bg-white/[0.05]"></div>
                    <div className="flex justify-between items-center text-base font-[400] tracking-wide">
                      <span className="text-white">Total Time:</span>
                      <span className="text-white">{formatTime(initialSessionTime + extraTime)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={(e) => confirmEnd(true, e)}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-xl bg-purple-500/20 text-purple-300 font-medium hover:bg-purple-500/30 border border-purple-500/30 transition-colors text-base"
                    >
                      Save Total Time & End
                    </button>
                    <button
                      onClick={(e) => confirmEnd(false, e)}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-xl bg-transparent text-white/50 font-medium hover:bg-white/5 hover:text-white transition-colors text-base"
                    >
                      Discard Extra Time
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-white/5 text-white/80">
                    {activeModal === "pause" ? <Pause size={28} className="fill-current" /> : <Square size={28} className="fill-current" />}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-[300] tracking-tight text-white mb-2">
                    {activeModal === "pause" ? "Paused" : "End Session?"}
                  </h2>
                  <p className="text-white/50 text-base mb-10 font-[400]">
                    Remaining: <span className="text-white/90 font-mono tracking-tight">{formatTime(displayTime)}</span>
                  </p>

                  <div className="flex flex-col gap-3 w-full">
                    <button
                      onClick={handleResume}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition-colors text-base"
                    >
                      {activeModal === "pause" ? "Resume Focus" : "Cancel & Continue"}
                    </button>
                    <button
                      onClick={(e) => confirmEnd(false, e)}
                      disabled={isProcessing}
                      className={`w-full py-4 rounded-xl font-medium transition-colors text-base ${
                        activeModal === "pause" 
                          ? "bg-transparent text-white/50 hover:bg-white/5 hover:text-white"
                          : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                      }`}
                    >
                      {activeModal === "pause" ? "End Session Early" : "Yes, End Session"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}