"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation sequence on every route change
    setVisible(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(70), 100);
    const timer2 = setTimeout(() => setProgress(100), 300);
    
    const timer3 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[3px] z-[9999] pointer-events-none">
      {/* GRADIENT BAR: 
          Uses a linear gradient transitioning from Red to Orange to Green.
          Includes a soft glow (box-shadow) that matches the orange theme.
      */}
      <div
        className="h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(249,115,22,0.6)]"
        style={{ 
          width: `${progress}%`,
          background: "linear-gradient(to right, #ef4444, #f97316, #22c55e)" 
        }}
      />
    </div>
  );
}

export default function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarContent />
    </Suspense>
  );
}