"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Briefcase, BookOpen, Heart, Brain, DollarSign, User, Check, ChevronUp } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { TaskType, Priority, PlannerEvent } from "../../types/types";
import { useTheme } from "@/theme/ThemeProvider";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: Partial<PlannerEvent>;
  setFormData: (data: Partial<PlannerEvent>) => void;
  handleSave: () => void;
}

// ----------------------------------------------------------------------
// Time & Date Utilities
// ----------------------------------------------------------------------

const formatDisplayDate = (dateStr?: string) => {
  if (!dateStr) return "Unscheduled";
  const [year, month, day] = dateStr.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  
  const isToday = target.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = target.toDateString() === tomorrow.toDateString();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";
  return target.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatDisplayTime = (timeStr?: string) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
};

const getTimeDistance = (dateStr?: string, timeStr?: string) => {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const target = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();
  
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return null;

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours === 0) return `${diffMins} minutes`;
  if (diffHours < 24) return `${diffHours} hours`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days`;
};

const getDeadlineHealth = (dateStr?: string, timeStr?: string) => {
  if (!dateStr || !timeStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const target = new Date(year, month - 1, day, hours, minutes);
  const diffMs = target.getTime() - new Date().getTime();
  
  if (diffMs < 0) return "Already passed";
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours <= 4) return "Starting soon";
  if (diffHours <= 24) return "Plenty of preparation time";
  return "Scheduled ahead";
};

// ----------------------------------------------------------------------
// Animation Variants
// ----------------------------------------------------------------------

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.2 } },
};

const sheetVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } },
  exit: { opacity: 0, y: "100%", transition: { duration: 0.2 } },
};

export default function AddEventModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSave,
}: AddEventModalProps) {
  const { isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [isFocused, setIsFocused] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Mobile Sheet State
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!formData.id;

  const categories = [
    { id: "Work", icon: Briefcase },
    { id: "Study", icon: BookOpen },
    { id: "Health", icon: Heart },
    { id: "Deep Work", icon: Brain },
    { id: "Finance", icon: DollarSign },
    { id: "Personal", icon: User },
  ];
  
  const priorities = [
    { value: "low", label: "Optional" },
    { value: "medium", label: "Important" },
    { value: "high", label: "Critical" }
  ];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentTime(new Date());
      setToastMessage(null);
      setShowSuccess(false);
      setIsFocused(false);
      setIsMobileSheetOpen(false);

      if (!formData.date && !formData.time && !isEdit) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15);
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
        const hours = String(now.getHours()).padStart(2, "0");
        const mins = String(now.getMinutes()).padStart(2, "0");
        
        setFormData({
          ...formData,
          date: localDate,
          time: `${hours}:${mins}`,
          type: "Work",
          priority: "medium"
        });
      }

      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEdit]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          if (isMobileSheetOpen) setIsMobileSheetOpen(false);
          else onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose, isMobileSheetOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleValidatedSave = () => {
    if (!formData.title?.trim() || !formData.date || !formData.time) {
      showToast("Please complete the required fields.");
      return;
    }

    const selectedDateObj = new Date(`${formData.date}T${formData.time}`);
    if (selectedDateObj < new Date()) {
      showToast("This time has already passed. Please choose another time.");
      return; 
    }

    setShowSuccess(true);
    setTimeout(() => {
      handleSave();
      onClose();
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && formData.title?.trim() && !isFocused) {
      e.preventDefault();
      handleValidatedSave();
    }
  };

  const getButtonText = () => {
    if (isEdit) return "Update Event";
    if (!formData.title?.trim()) return "Create Event";
    const isTomorrow = formatDisplayDate(formData.date) === "Tomorrow";
    if (isTomorrow) return "Schedule for Tomorrow";
    const truncated = formData.title.length > 15 ? formData.title.slice(0, 15) + "..." : formData.title;
    return `Schedule "${truncated}"`;
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}
          onClick={() => {
            if (isMobileSheetOpen) setIsMobileSheetOpen(false);
            else onClose();
          }}
          className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6 md:px-8 md:py-8 transition-colors duration-300 ${
            isDarkMode ? "bg-[#000000]/92 backdrop-blur-[32px]" : "bg-black/30 backdrop-blur-2xl"
          }`}
        >
          {/* TOAST */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: -20, x: "-50%" }}
                className={`absolute top-10 left-1/2 z-[10000] px-6 py-3 rounded-full text-[13px] font-medium shadow-2xl backdrop-blur-md border tracking-wide transition-colors duration-300 ${
                  isDarkMode ? "bg-[#050505]/90 text-white border-white/[0.15]" : "bg-white/90 text-black border-gray-200"
                }`}
              >
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden rounded-[24px] p-6 md:p-12 font-sans transition-colors duration-300 border ${
              isDarkMode ? "bg-[#050505] text-white border-white/[0.15]" : "bg-white text-black border-gray-100 shadow-[0_40px_100px_rgba(0,0,0,0.12)]"
            }`}
          >
            {/* SUCCESS STATE */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-2xl transition-colors duration-300 ${
                    isDarkMode ? "bg-[#050505]/95" : "bg-white/90"
                  }`}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className={`h-16 w-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 shadow-sm ${
                      isDarkMode ? "bg-white/[0.08]" : "bg-gray-100"
                    }`}
                  >
                    <Check size={32} strokeWidth={3} className="text-[#FF5722]" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
                    <p className={`text-[11px] uppercase tracking-[0.25em] font-bold mb-3 transition-colors ${
                      isDarkMode ? "text-white/80" : "text-gray-400"
                    }`}>Scheduled</p>
                    <h3 className={`text-2xl md:text-3xl font-semibold tracking-tight mb-2 px-4 transition-colors ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>{formData.title}</h3>
                    <p className={`text-[15px] font-medium transition-colors ${
                      isDarkMode ? "text-white/85" : "text-gray-500"
                    }`}>
                      {formatDisplayDate(formData.date)} • {formatDisplayTime(formData.time)}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={onClose}
              className={`absolute top-6 right-6 transition-colors p-2 rounded-full z-50 ${
                isDarkMode ? "text-white/70 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-black hover:bg-gray-100"
              }`}
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* SCROLLABLE CONTENT */}
            <div className="overflow-y-auto pb-4 pt-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/[0.12] hover:[&::-webkit-scrollbar-thumb]:bg-white/[0.22] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent relative z-10">
              
              {/* SECTION 1: WHAT */}
              <div className="mb-12">
                <h3 className={`text-[11px] font-bold uppercase mb-4 transition-colors ${
                  isDarkMode ? "text-white/80 tracking-[0.25em]" : "text-gray-500 tracking-[0.2em]"
                }`}>
                  What do you want to make happen?
                </h3>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Complete Your Goal Now..."
                  className={`w-full bg-transparent outline-none font-semibold text-3xl md:text-4xl tracking-tight transition-colors duration-300 ${
                    isDarkMode ? "text-white placeholder-white/50" : "text-black placeholder-gray-300"
                  }`}
                />
              </div>

              {/* FOCUS WRAPPER */}
              <div className={`transition-opacity duration-500 ${isFocused ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                
                {/* SECTION 2: WHEN */}
                <div className="mb-10 flex flex-col items-center justify-center text-center">
                  <div className="relative group inline-block">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date || ""}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`w-full bg-transparent outline-none font-semibold text-3xl md:text-5xl tracking-tight text-center cursor-pointer transition-colors duration-300 ${
                        isDarkMode ? "text-white [color-scheme:dark] hover:text-white/90" : "text-black hover:text-gray-700"
                      }`}
                    />
                  </div>
                  <div className="relative group inline-block mt-2">
                    <input
                      type="time"
                      value={formData.time || ""}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className={`w-full bg-transparent outline-none font-medium text-2xl md:text-4xl tracking-tight text-center cursor-pointer transition-colors duration-300 ${
                        isDarkMode ? "text-white [color-scheme:dark] hover:text-white/90" : "text-gray-400 hover:text-black"
                      }`}
                    />
                  </div>

                  {/* VISUAL TIMELINE */}
                  {formData.date && formData.time && getTimeDistance(formData.date, formData.time) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      className={`flex flex-col items-center justify-center mt-8 transition-colors ${
                        isDarkMode ? "text-white/85" : "text-gray-500"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-[0.2em] font-bold">Now</div>
                      <div className={`h-10 w-px my-2 relative transition-colors ${isDarkMode ? "bg-white/[0.15]" : "bg-gray-200"}`}>
                        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-2 text-[10px] uppercase tracking-[0.15em] font-medium whitespace-nowrap transition-colors ${
                          isDarkMode ? "bg-[#050505] text-white/85" : "bg-white text-gray-500"
                        }`}>
                          {getTimeDistance(formData.date, formData.time)}
                        </div>
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.2em] font-bold">Target</div>
                    </motion.div>
                  )}
                </div>

                {/* DESKTOP EXECUTION DETAILS */}
                <div className="hidden md:block">
                  <div className={`h-px w-full my-10 transition-colors ${isDarkMode ? "bg-white/[0.15]" : "bg-gray-100"}`} />
                  <div className="grid grid-cols-2 gap-8">
                    {/* CATEGORY */}
                    <div>
                      <h3 className={`text-[10px] font-bold uppercase mb-4 transition-colors ${
                        isDarkMode ? "text-white/80 tracking-[0.25em]" : "text-gray-500 tracking-[0.2em]"
                      }`}>Category</h3>
                      <div className="flex flex-wrap gap-2 relative z-10">
                        {categories.map((c) => {
                          const Icon = c.icon;
                          const isActive = formData.type === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setFormData({ ...formData, type: c.id as TaskType })}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 border ${
                                isActive 
                                  ? (isDarkMode ? "isolate relative z-20 !bg-white !text-black !border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02]" : "isolate relative z-20 bg-gray-900 text-white border-transparent shadow-sm scale-[1.02]") 
                                  : (isDarkMode ? "bg-white/[0.04] text-white/85 border-white/[0.15] hover:bg-white/[0.08] hover:border-white/[0.25] hover:text-white" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-black")
                              }`}
                            >
                              <Icon size={14} strokeWidth={2.5} className={`relative z-10 ${isActive ? (isDarkMode ? "!text-black" : "text-white") : "opacity-70"}`} />
                              <span className="relative z-10">{c.id}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* PRIORITY */}
                    <div>
                      <h3 className={`text-[10px] font-bold uppercase mb-4 transition-colors ${
                        isDarkMode ? "text-white/80 tracking-[0.25em]" : "text-gray-500 tracking-[0.2em]"
                      }`}>Priority</h3>
                      <div className={`flex p-1 rounded-2xl transition-colors border relative z-10 ${
                        isDarkMode ? "bg-white/[0.05] border-white/[0.15]" : "bg-gray-50 border-gray-200"
                      }`}>
                        {priorities.map((p) => {
                          const isActive = formData.priority === p.value;
                          return (
                            <button
                              key={p.value}
                              onClick={() => setFormData({ ...formData, priority: p.value as Priority })}
                              className={`flex-1 py-3 text-[13px] font-semibold rounded-xl transition-all duration-200 ${
                                isActive 
                                  ? (isDarkMode ? "isolate relative z-20 !bg-white !text-black border !border-white shadow-[0_0_20px_rgba(255,255,255,.2)] scale-[1.02]" : "isolate relative z-20 bg-white text-gray-900 shadow-sm border border-gray-200 scale-[1.02]") 
                                  : (isDarkMode ? "text-white/80 hover:text-white border border-transparent" : "text-gray-500 hover:text-gray-900 border border-transparent")
                              }`}
                            >
                              <span className="relative z-10">{p.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MINIMAL COMMITMENT CARD */}
                <AnimatePresence>
                  {formData.title && formData.title.trim() !== "" && formData.date && formData.time && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-10 overflow-hidden"
                    >
                      <div className="flex flex-col items-center justify-center text-center relative z-10">
                        <div className={`text-[12px] font-medium px-4 py-1.5 rounded-full border transition-colors ${
                          isDarkMode ? "border-white/[0.15] text-white/85 bg-white/[0.04]" : "border-gray-200 text-gray-600 bg-gray-50"
                        }`}>
                          {getDeadlineHealth(formData.date, formData.time)}
                        </div>
                        <p className={`mt-4 text-[13px] font-medium transition-colors ${
                          isDarkMode ? "text-white/85" : "text-gray-500"
                        }`}>
                          This event becomes active {formatDisplayDate(formData.date).toLowerCase()}.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>

            {/* FOOTER */}
            <div className={`mt-auto pt-6 border-t flex flex-col justify-between items-center gap-4 transition-colors duration-500 md:flex-row relative z-10 ${
              isDarkMode ? "border-white/[0.15]" : "border-gray-100"
            } ${isFocused ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              
              <div className="flex flex-col w-full md:w-auto text-center md:text-left order-2 md:order-1">
                <span className={`text-[13px] font-medium transition-colors ${
                  isDarkMode ? "text-white/85" : "text-gray-500"
                }`}>
                  Scheduled events appear instantly in your timeline.
                </span>
              </div>
              
              <div className="flex items-center w-full md:w-auto gap-4 order-1 md:order-2">
                {/* Mobile Execution Details Toggle */}
                <button
                  onClick={() => setIsMobileSheetOpen(true)}
                  className={`md:hidden flex-1 py-4 text-[14px] font-semibold rounded-2xl transition-all border ${
                    isDarkMode ? "bg-[#050505] border-white/[0.15] text-white/85 hover:bg-white/[0.04]" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Details
                </button>

                <button
                  onClick={handleValidatedSave}
                  disabled={!formData.title?.trim() || !formData.date || !formData.time}
                  className={`
                    flex-1 md:w-auto px-8 py-4 text-[15px] font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 border isolate relative z-10
                    ${!formData.title?.trim() || !formData.date || !formData.time
                      ? (isDarkMode ? "bg-white/[0.04] border-white/[0.15] text-white/50 cursor-not-allowed" : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed")
                      : (isDarkMode ? "!bg-white border-white !text-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,.2)]" : "bg-gray-900 border-transparent text-white hover:bg-black shadow-md active:scale-95")
                    }
                  `}
                >
                  <span className="relative z-10">{getButtonText()}</span>
                </button>
              </div>
            </div>
            
          </motion.div>

          {/* MOBILE BOTTOM SHEET */}
          <AnimatePresence>
            {isMobileSheetOpen && (
              <motion.div
                variants={sheetVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                className={`fixed inset-x-0 bottom-0 z-[10001] p-6 pb-10 rounded-t-[32px] md:hidden transition-colors duration-300 border-t ${
                  isDarkMode ? "bg-[#050505] border-white/[0.15] shadow-[0_-20px_60px_rgba(0,0,0,0.8)]" : "bg-white border-gray-200 shadow-[0_-20px_60px_rgba(0,0,0,0.15)]"
                }`}
              >
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <h3 className={`text-lg font-semibold transition-colors ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>Execution Details</h3>
                  <button onClick={() => setIsMobileSheetOpen(false)} className={`p-2 rounded-full transition-colors ${
                    isDarkMode ? "bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.10]" : "bg-gray-100 text-gray-600"
                  }`}>
                    <ChevronUp size={20} className="transform rotate-180" />
                  </button>
                </div>

                <div className="space-y-8 relative z-10">
                  <div>
                    <h4 className={`text-[11px] font-bold uppercase mb-4 transition-colors ${
                      isDarkMode ? "text-white/80 tracking-[0.25em]" : "text-gray-500 tracking-[0.2em]"
                    }`}>Category</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((c) => {
                        const Icon = c.icon;
                        const isActive = formData.type === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setFormData({ ...formData, type: c.id as TaskType })}
                            className={`flex items-center gap-2 px-4 py-3.5 rounded-xl text-[14px] font-medium transition-all border ${
                              isActive 
                                ? (isDarkMode ? "isolate relative z-20 !bg-white !text-black !border-white shadow-md scale-[1.02]" : "isolate relative z-20 bg-gray-900 text-white border-transparent shadow-md scale-[1.02]") 
                                : (isDarkMode ? "bg-white/[0.04] text-white/85 border-white/[0.15] hover:border-white/[0.25] hover:text-white hover:bg-white/[0.08]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-black hover:bg-gray-50")
                            }`}
                          >
                            <Icon size={16} strokeWidth={2.5} className={`relative z-10 ${isActive ? (isDarkMode ? "!text-black" : "text-white") : "opacity-70"}`} />
                            <span className="relative z-10">{c.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-[11px] font-bold uppercase mb-4 transition-colors ${
                      isDarkMode ? "text-white/80 tracking-[0.25em]" : "text-gray-500 tracking-[0.2em]"
                    }`}>Priority</h4>
                    <div className={`flex flex-col gap-2 p-1 rounded-2xl transition-colors border ${
                      isDarkMode ? "bg-white/[0.05] border-white/[0.15]" : "bg-gray-50 border-gray-200"
                    }`}>
                      {priorities.map((p) => {
                        const isActive = formData.priority === p.value;
                        return (
                          <button
                            key={p.value}
                            onClick={() => setFormData({ ...formData, priority: p.value as Priority })}
                            className={`w-full py-4 text-[14px] font-semibold rounded-xl transition-all border ${
                              isActive 
                                ? (isDarkMode ? "isolate relative z-20 !bg-white !text-black shadow-[0_0_20px_rgba(255,255,255,.2)] !border-white scale-[1.02]" : "isolate relative z-20 bg-white text-gray-900 shadow-sm border-gray-200 scale-[1.02]") 
                                : (isDarkMode ? "text-white/80 hover:text-white border-transparent" : "text-gray-500 hover:text-gray-900 border-transparent")
                            }`}
                          >
                            <span className="relative z-10">{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}