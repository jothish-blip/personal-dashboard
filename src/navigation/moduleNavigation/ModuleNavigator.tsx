"use client";

import { MotionValue, motion, useTransform } from "framer-motion";
import { MODULES } from "./config";
import { useTheme } from "@/theme/ThemeProvider";

interface Props {
  dragX: MotionValue<number>;
  currentIndex: number;
}

export default function ModuleNavigator({ dragX, currentIndex }: Props) {
  const { isDarkMode } = useTheme();

  // FIX: Immediately abort if on an unsupported route (e.g. /login) or if index is invalid
  if (currentIndex === -1 || !Number.isFinite(currentIndex)) {
    return null;
  }

  const safeIndex = Math.max(0, currentIndex);
  const prevModule = MODULES[safeIndex - 1];
  const nextModule = MODULES[safeIndex + 1];

  // TRANSFORMS: Extracted, clamped, and bounded to prevent NaN interpolation errors
  const bgOpacity = useTransform(dragX, [-200, -50, 0, 50, 200], [1, 0.5, 0, 0.5, 1], { clamp: true });
  const bgScale = useTransform(dragX, [-300, 0, 300], [1, 0.95, 1], { clamp: true });
  
  const textOffset = useTransform(dragX, [-200, 0, 200], [-20, 0, 20], { clamp: true });
  
  const revealNextOpacity = useTransform(dragX, [-200, -50, 0], [1, 0.5, 0], { clamp: true });
  const revealPrevOpacity = useTransform(dragX, [0, 50, 200], [0, 0.5, 1], { clamp: true });

  return (
    <motion.div 
      style={{ opacity: bgOpacity, scale: bgScale }}
      className={`absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none transition-colors duration-300 ${
        isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#fafafa] text-black"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        
        {/* Dynamic Context Text */}
        <motion.div 
          className={`text-2xl font-medium tracking-tight relative flex justify-center ${
            isDarkMode ? "text-zinc-400" : "text-zinc-600"
          }`}
          style={{ x: textOffset }}
        >
          <motion.span style={{ opacity: revealNextOpacity }}>
            {nextModule ? `${nextModule.name} →` : "End of Workspace"}
          </motion.span>
          
          <motion.span 
            className="absolute left-0 right-0 text-center" 
            style={{ opacity: revealPrevOpacity }}
          >
            {prevModule ? `← ${prevModule.name}` : "Start of Workspace"}
          </motion.span>
        </motion.div>

        {/* Floating Module Dots Indicator */}
        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border ${
          isDarkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-white/80 border-gray-200 shadow-sm"
        }`}>
          {MODULES.map((m, i) => (
            <div 
              key={m.path} 
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i === safeIndex 
                  ? "bg-orange-500 scale-125 shadow-[0_0_8px_rgba(249,115,22,0.5)]" 
                  : isDarkMode 
                    ? "bg-zinc-700" 
                    : "bg-gray-300"
              }`}
            />
          ))}
        </div>

      </div>
    </motion.div>
  );
}