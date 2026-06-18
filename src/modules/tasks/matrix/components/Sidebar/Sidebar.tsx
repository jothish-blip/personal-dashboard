"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  FolderOpen,
  Target,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Circle
} from "lucide-react";
import { useTheme } from "@/theme/ThemeProvider";

interface Task {
  id?: string;
  name?: string;
  group?: string;
  history?: Record<string, boolean>;
}

interface SidebarProps {
  tasks: Task[];
  userName?: string | null;
}

export default function Sidebar({
  tasks = [],
  userName = null,
}: SidebarProps) {
  const { isDarkMode } = useTheme();

  // Accordion States
  const [todoOpen, setTodoOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const [consistencyOpen, setConsistencyOpen] = useState(false);

  // Pagination States
  const [todoShowAll, setTodoShowAll] = useState(false);
  const [doneShowAll, setDoneShowAll] = useState(false);

  const getToday = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  };

  const today = getToday();

  // Pre-compute last 7 days for the Consistency tab
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
  }, []);

  const todoTasks = useMemo(() => {
    return tasks.filter((task) => task.history?.[today] !== true);
  }, [tasks, today]);

  const doneTasks = useMemo(() => {
    return tasks.filter((task) => task.history?.[today] === true);
  }, [tasks, today]);

  const totalTasks = tasks.length;

  // Calculate 7-day consistency metrics
  const consistencyMetrics = useMemo(() => {
    if (totalTasks === 0) return { rate: 0, days: [] };

    let completedIn7Days = 0;
    const possibleIn7Days = totalTasks * 7;

    const days = last7Days.map((day) => {
      let dayCompletedCount = 0;
      tasks.forEach((t) => {
        if (t.history?.[day]) {
          dayCompletedCount++;
          completedIn7Days++;
        }
      });
      const isPerfect = totalTasks > 0 && dayCompletedCount === totalTasks;
      return { date: day, checked: isPerfect };
    });

    const rate = Math.round((completedIn7Days / possibleIn7Days) * 100);
    return { rate, days };
  }, [tasks, last7Days, totalTasks]);

  // Theme Colors
  const surface = isDarkMode ? "bg-black border-white/[0.06]" : "bg-white border-black/[0.05]";
  const textPrimary = isDarkMode ? "text-slate-100" : "text-slate-900";
  const textMuted = isDarkMode ? "text-slate-400" : "text-slate-500";
  const borderSubtle = isDarkMode ? "border-white/[0.06]" : "border-black/[0.05]";
  const hoverBg = isDarkMode ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.02]";

  const displayedTodo = todoShowAll ? todoTasks : todoTasks.slice(0, 5);
  const hiddenTodoCount = todoTasks.length - 5;

  const displayedDone = doneShowAll ? doneTasks : doneTasks.slice(0, 5);
  const hiddenDoneCount = doneTasks.length - 5;

  return (
    <aside
      className="
        w-full
        flex
        flex-col
        gap-2
        pb-40
        pr-1
        h-full
        min-h-0
        overflow-y-auto
        overflow-x-hidden
        [scrollbar-width:none]
        [-ms-overflow-style:none]
        [&::-webkit-scrollbar]:hidden
      "
    >
      <section className="flex flex-col gap-1 px-1 mt-2">
        
        {/* TO DO ACCORDION */}
        <div className="flex flex-col">
          <button 
            onClick={() => setTodoOpen(!todoOpen)}
            className={`flex items-center gap-2 py-2.5 px-2 rounded-xl transition-colors w-full text-left ${hoverBg}`}
          >
            {todoOpen ? (
              <ChevronDown size={16} className={textMuted} />
            ) : (
              <ChevronRight size={16} className={textMuted} />
            )}
            <span className={`text-[14px] font-medium ${textPrimary}`}>
              To Do ({todoTasks.length})
            </span>
          </button>

          <AnimatePresence initial={false}>
            {todoOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-1 pl-3 pr-2 py-2">
                  {todoTasks.length > 0 ? (
                    <>
                      {displayedTodo.map((task, index) => (
                        <TaskRow key={task.id || index} task={task} isDarkMode={isDarkMode} isCompleted={false} hoverBg={hoverBg} />
                      ))}
                      {!todoShowAll && hiddenTodoCount > 0 && (
                        <button 
                          onClick={() => setTodoShowAll(true)}
                          className={`text-[12px] font-medium py-2 mt-1 text-left pl-7 ${isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Show {hiddenTodoCount} more...
                        </button>
                      )}
                    </>
                  ) : (
                    <div className={`text-[13px] pl-7 py-2 ${textMuted}`}>No pending tasks.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* DONE ACCORDION */}
        <div className="flex flex-col">
          <button 
            onClick={() => setDoneOpen(!doneOpen)}
            className={`flex items-center gap-2 py-2.5 px-2 rounded-xl transition-colors w-full text-left ${hoverBg}`}
          >
            {doneOpen ? (
              <ChevronDown size={16} className={textMuted} />
            ) : (
              <ChevronRight size={16} className={textMuted} />
            )}
            <span className={`text-[14px] font-medium ${textPrimary}`}>
              Done ({doneTasks.length})
            </span>
          </button>

          <AnimatePresence initial={false}>
            {doneOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-1 pl-3 pr-2 py-2">
                  {doneTasks.length > 0 ? (
                    <>
                      {displayedDone.map((task, index) => (
                        <TaskRow key={task.id || index} task={task} isDarkMode={isDarkMode} isCompleted={true} hoverBg={hoverBg} />
                      ))}
                      {!doneShowAll && hiddenDoneCount > 0 && (
                        <button 
                          onClick={() => setDoneShowAll(true)}
                          className={`text-[12px] font-medium py-2 mt-1 text-left pl-7 ${isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Show {hiddenDoneCount} more...
                        </button>
                      )}
                    </>
                  ) : (
                    <div className={`text-[13px] pl-7 py-2 ${textMuted}`}>No completed tasks.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className={`h-[1px] mx-2 my-2 ${borderSubtle}`} />

        {/* CONSISTENCY ACCORDION */}
        <div className="flex flex-col">
          <button 
            onClick={() => setConsistencyOpen(!consistencyOpen)}
            className={`flex items-center gap-2 py-2.5 px-2 rounded-xl transition-colors w-full text-left ${hoverBg}`}
          >
            {consistencyOpen ? (
              <ChevronDown size={16} className={textMuted} />
            ) : (
              <ChevronRight size={16} className={textMuted} />
            )}
            <span className={`text-[14px] font-medium ${textPrimary}`}>
              Consistency
            </span>
          </button>

          <AnimatePresence initial={false}>
            {consistencyOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pl-8 pr-4 py-3">
                  <div className={`text-[13px] font-medium mb-4 ${textMuted}`}>
                    Rate: <span className={textPrimary}>{consistencyMetrics.rate}%</span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {consistencyMetrics.days.map((day, idx) => {
                      const dayName = new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <span className={`${day.checked ? (isDarkMode ? "text-emerald-400" : "text-emerald-500") : "text-slate-300 dark:text-slate-700"}`}>
                            {day.checked ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                          </span>
                          <span className={`text-[13px] font-medium ${textPrimary}`}>{dayName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </aside>
  );
}

// --- SUBCOMPONENTS ---

function TaskRow({ task, isDarkMode, isCompleted, hoverBg }: { task: Task; isDarkMode: boolean; isCompleted: boolean; hoverBg: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const textColor = isCompleted 
    ? (isDarkMode ? "text-slate-500 line-through" : "text-slate-400 line-through")
    : (isDarkMode ? "text-slate-200" : "text-slate-900");
    
  const groupColor = isDarkMode ? "text-slate-500" : "text-slate-400";
  const iconColor = isCompleted 
    ? (isDarkMode ? "text-slate-600" : "text-slate-300")
    : (isDarkMode ? "text-slate-400" : "text-slate-400");

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`group flex flex-col px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${hoverBg}`}
    >
      <div className="flex items-center gap-3">
        <div className={`shrink-0 flex items-center justify-center ${iconColor}`}>
          {isCompleted ? <Check size={16} strokeWidth={2.5} /> : <Circle size={16} strokeWidth={2} />}
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-[13px] font-medium tracking-tight truncate leading-tight ${textColor}`}>
            {task.name}
          </span>
          <span className={`text-[11px] truncate mt-0.5 ${groupColor}`}>
            {task.group || "General"}
          </span>
        </div>
      </div>

      {/* Action Links: Appear on Hover (Desktop) OR Tap (Mobile) */}
      <div className={`
        flex items-center gap-4 pl-7 overflow-hidden transition-all duration-200 ease-out
        ${isExpanded ? 'max-h-12 opacity-100 mt-2.5' : 'max-h-0 opacity-0 md:max-h-12 md:mt-2.5 md:opacity-0 md:group-hover:opacity-100'}
      `}>
        <ActionLink href="/focus" icon={<Target size={13} />} label="Focus" isDarkMode={isDarkMode} />
        <ActionLink href="/Planner" icon={<CalendarDays size={13} />} label="Planner" isDarkMode={isDarkMode} />
        <ActionLink href="/Workspace" icon={<FolderOpen size={13} />} label="Workspace" isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

function ActionLink({ href, icon, label, isDarkMode }: { href: string; icon: React.ReactNode; label: string; isDarkMode: boolean; }) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()} // Prevent row toggle when clicking link
      className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
        isDarkMode ? "text-slate-400 hover:text-orange-400" : "text-slate-500 hover:text-orange-500"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}