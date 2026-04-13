"use client";

import React, { useState, useEffect, useRef } from "react";
import { WifiOff, RefreshCw, Trophy } from "lucide-react";

interface GameItem {
  id: number;
  x: number;
  y: number;
  type: "task" | "friction";
}

export default function OfflineView() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  // Global Game State
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Navigator Game States
  const [items, setItems] = useState<GameItem[]>([]);
  const [playerPosition, setPlayerPosition] = useState(50);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Network Listeners
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      stopLoop();
    };
  }, []);

  const stopLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  const initGame = () => {
    stopLoop();
    setScore(0);
    setPlayerPosition(50);
    setItems([]);
    setGameState("playing");

    // Game Loop (Smoother interval)
    gameLoopRef.current = setInterval(() => {
      setItems(prev => {
        // Move items down slowly (step of 1.5 for smoother 30ms framerate)
        const moved = prev
          .map(i => ({ ...i, y: i.y + 1.5 }))
          .filter(i => i.y < 110); // Remove items that fall off screen

        // Spawn new items randomly
        if (Math.random() > 0.94) {
          moved.push({
            id: Date.now() + Math.random(),
            x: Math.random() * 90 + 5, // Keep away from extreme edges
            y: -10,
            type: Math.random() > 0.25 ? "task" : "friction" // 75% good, 25% bad
          });
        }
        return moved;
      });
    }, 30);
  };

  // Collision Detection Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    // Rocket is fixed near the bottom (roughly 85% to 95% of the screen height)
    const collision = items.find(
      i => i.y > 85 && i.y < 95 && Math.abs(i.x - playerPosition) < 8
    );

    if (collision) {
      if (collision.type === "task") {
        setScore(s => s + 10);
        setItems(prev => prev.filter(i => i.id !== collision.id));
      } else {
        endGame();
      }
    }
  }, [items, playerPosition, gameState]);

  const endGame = () => {
    setGameState("gameover");
    stopLoop();
    if (score > highScore) setHighScore(score);
  };

  const handleReconnect = () => {
    setIsRetrying(true);
    setTimeout(() => window.location.reload(), 800);
  };

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col overflow-hidden font-sans">
      
      {/* TOP HEADER OVERLAY (Full Width) */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-slate-900/90 to-transparent pointer-events-none">
        
        {/* Left: Status */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="p-2.5 bg-red-500/20 backdrop-blur-md rounded-xl border border-red-500/30">
            <WifiOff size={22} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Connection Lost</h2>
            <p className="text-[11px] font-bold text-slate-400">NexEngine Offline Mode</p>
          </div>
        </div>

        {/* Right: Reconnect Button */}
        <button 
          onClick={handleReconnect} 
          disabled={isRetrying}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 border border-white/10"
        >
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">{isRetrying ? 'Synchronizing...' : 'Retry Uplink'}</span>
        </button>
      </div>

      {/* GAME SCORE HUD */}
      <div className="absolute top-24 inset-x-0 z-30 px-6 flex justify-between pointer-events-none">
         <div className="text-left">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</p>
           <p className="text-white font-black text-3xl tabular-nums">{score}</p>
         </div>
         <div className="text-right flex flex-col items-end">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
             <Trophy size={10} className="text-orange-500"/> Best
           </p>
           <p className="text-orange-400 font-black text-3xl tabular-nums">{highScore}</p>
         </div>
      </div>

      {/* MAIN FULL-SCREEN GAME AREA */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        
        {/* IDLE STATE */}
        {gameState === "idle" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md">
            <div className="w-20 h-20 mb-6 bg-slate-800 rounded-3xl flex items-center justify-center border-2 border-slate-700 shadow-2xl">
              <span className="text-4xl">🚀</span>
            </div>
            <h1 className="text-white font-black text-2xl md:text-3xl tracking-tight mb-2 uppercase">Navigator</h1>
            <p className="text-slate-400 text-sm font-medium mb-8 max-w-xs text-center">Collect the green tasks ✅ and avoid the red frictions ❌ while we try to reconnect you.</p>
            <button 
              onClick={initGame} 
              className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(249,115,22,0.4)]"
            >
              Initiate Launch
            </button>
          </div>
        )}

        {/* GAME OVER STATE */}
        {gameState === "gameover" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-md">
            <p className="text-red-400 font-black text-3xl md:text-5xl mb-2 tracking-tight">CRITICAL HIT</p>
            <p className="text-white font-bold text-lg mb-8 bg-black/30 px-6 py-2 rounded-full">Final Score: {score}</p>
            <button 
              onClick={initGame} 
              className="px-10 py-4 bg-white text-slate-900 hover:bg-gray-100 font-black rounded-2xl text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
            >
              Restart System
            </button>
          </div>
        )}

        {/* PLAYING STATE - THE ACTUAL GAME */}
        {gameState === "playing" && (
          <>
            {/* The Background Grid (purely visual) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] opacity-20 pointer-events-none" />

            {/* Falling Items */}
            {items.map(i => (
              <div 
                key={i.id} 
                className="absolute text-3xl md:text-4xl transition-all duration-[30ms] ease-linear drop-shadow-2xl" 
                style={{ left: `${i.x}%`, top: `${i.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                {i.type === "task" ? "✅" : "❌"}
              </div>
            ))}

            {/* Player Rocket */}
            <div 
              className="absolute bottom-[10%] text-5xl md:text-6xl z-10 transition-all duration-75 ease-out drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] pointer-events-none" 
              style={{ left: `${playerPosition}%`, transform: 'translateX(-50%)' }}
            >
              🚀
            </div>

            {/* Invisible Input Slider (Controls the rocket) */}
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={playerPosition} 
              onChange={(e) => setPlayerPosition(parseInt(e.target.value))} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20 touch-none" 
            />
          </>
        )}
      </div>

    </div>
  );
}