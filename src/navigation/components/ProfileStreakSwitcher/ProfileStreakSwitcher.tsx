"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileStreakSwitcherProps {
  userProfile?: any;
  currentStreak: number;
  isDarkMode: boolean;
}

export default function ProfileStreakSwitcher({ userProfile, currentStreak, isDarkMode }: ProfileStreakSwitcherProps) {
  const [showStreak, setShowStreak] = useState(false);

  useEffect(() => {
    // If there is no active streak, always show the profile avatar
    if (currentStreak <= 0) {
      setShowStreak(false);
      return;
    }

    let timeout: NodeJS.Timeout;

    const switchView = (isStreakCurrentlyShowing: boolean) => {
      timeout = setTimeout(() => {
        setShowStreak(!isStreakCurrentlyShowing);
        // Recursively call with the NEXT state to set the appropriate delay
        switchView(!isStreakCurrentlyShowing);
      }, isStreakCurrentlyShowing ? 3500 : 9000); // 3.5s for Streak, 9s for Profile
    };

    // Initial delay before the very first switch to Streak I have set to 6 seconds to give users a chance to see their profile avatar before switching to the streak view
    timeout = setTimeout(() => {
      setShowStreak(true);
      switchView(true);
    }, 6000);

    return () => clearTimeout(timeout);
  }, [currentStreak]);

  return (
    <div className="relative w-8 h-8 flex items-center justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        {showStreak && currentStreak > 0 ? (
          <motion.div
            key="streak"
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 w-8 h-8 rounded-full bg-orange-500/15 border border-orange-400/30 flex items-center justify-center text-[10px] tracking-tighter font-black text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
          >
            <span className="mr-[1px] text-[11px] leading-none">🔥</span>
            {currentStreak}
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`absolute inset-0 w-8 h-8 rounded-full shadow-sm border overflow-hidden ${
              isDarkMode ? "bg-[#111111] border-gray-800" : "bg-gray-100 border-gray-200"
            }`}
          >
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-sm font-bold uppercase ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {userProfile?.full_name?.[0] || "U"}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}