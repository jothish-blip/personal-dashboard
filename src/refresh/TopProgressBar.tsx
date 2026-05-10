"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let mounted = true;

    // 1. Navigation delay (120ms) to prevent flashing on instant navigation
    const showTimer = setTimeout(() => {
      if (!mounted) return;

      setVisible(true);
      setOpacity(1);
      setProgress(15);

      // 2. Realistic, non-linear progress steps
      const step1 = setTimeout(() => setProgress(45), 120);
      const step2 = setTimeout(() => setProgress(72), 240);
      const step3 = setTimeout(() => setProgress(88), 420);

      // 3. Smooth finish and elegant fade-out
      const finish = setTimeout(() => {
        setProgress(100);

        // Wait a moment at 100% before fading out
        setTimeout(() => {
          setOpacity(0);

          // Wait for fade transition to finish before unmounting
          setTimeout(() => {
            setVisible(false);
            setProgress(0);
            setOpacity(1);
          }, 180);
        }, 120);
      }, 520);

      return () => {
        clearTimeout(step1);
        clearTimeout(step2);
        clearTimeout(step3);
        clearTimeout(finish);
      };
    }, 120);

    return () => {
      mounted = false;
      clearTimeout(showTimer);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[4px] md:h-[3px] z-[9999] pointer-events-none">
      <div
        className="
          h-full
          relative
          overflow-hidden
          transition-all
          duration-300
          ease-[cubic-bezier(0.22,1,0.36,1)]
          shadow-[0_0_14px_rgba(249,115,22,0.35)]
        "
        style={{
          width: `${progress}%`,
          opacity,
          background: "linear-gradient(90deg, #fb923c, #f97316)",
        }}
      >
        {/* Premium shimmer/pulse effect */}
        <div className="absolute inset-0 bg-white/20 animate-pulse" />
      </div>
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