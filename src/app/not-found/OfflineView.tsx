"use client";

import React, { useState, useEffect, useRef } from "react";
import { WifiOff, RefreshCw, Trophy, Gamepad2, ChevronLeft, ChevronRight, Zap, Target, Brain, Activity } from "lucide-react";

type GameType = "navigator" | "snake" | "bounce" | "memory" | "tap";

export default function OfflineView() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [activeGame, setActiveGame] = useState<GameType>("navigator");

  // Global Game State
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Navigator/Bounce/Snake States
  const [items, setItems] = useState<any[]>([]);
  const [playerPosition, setPlayerPosition] = useState(50);
  
  const gameLoopRef = useRef<any>(null);

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
    setGameState("playing");
    setItems([]);

    if (activeGame === "navigator") {
      gameLoopRef.current = setInterval(() => {
        setItems(prev => {
          const moved = prev.map(i => ({ ...i, y: i.y + 5 })).filter(i => i.y < 110);
          if (Math.random() > 0.9) {
            moved.push({ id: Date.now(), x: Math.random() * 90, y: -10, type: Math.random() > 0.3 ? "task" : "friction" });
          }
          return moved;
        });
      }, 50);
    } 
    
    else if (activeGame === "tap") {
      let timer = 10;
      gameLoopRef.current = setInterval(() => {
        timer--;
        if (timer <= 0) endGame();
      }, 1000);
    }
  };

  useEffect(() => {
    if (gameState !== "playing") return;
    if (activeGame === "navigator") {
      const collision = items.find(i => i.y > 80 && i.y < 95 && Math.abs(i.x - playerPosition) < 12);
      if (collision) {
        if (collision.type === "task") {
          setScore(s => s + 10);
          setItems(prev => prev.filter(i => i.id !== collision.id));
        } else {
          endGame();
        }
      }
    }
  }, [items, playerPosition]);

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
    <div className="fixed inset-0 z-[9999] bg-[#F9FAFB] flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 space-y-6">
        
        {/* TOP STATUS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-xl"><WifiOff size={20} className="text-red-500" /></div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase">Offline Mode</h2>
              <p className="text-[10px] font-bold text-gray-400">NexEngine Arcade</p>
            </div>
          </div>
          <button onClick={handleReconnect} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <RefreshCw size={18} className={`${isRetrying ? 'animate-spin' : ''} text-gray-400`} />
          </button>
        </div>

        {/* GAME SELECTOR */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: "navigator", icon: <Target size={14}/>, label: "Navigator" },
            { id: "tap", icon: <Zap size={14}/>, label: "Tap-Power" },
            { id: "memory", icon: <Brain size={14}/>, label: "Logic" },
            { id: "bounce", icon: <Activity size={14}/>, label: "Focus" },
            { id: "snake", icon: <Gamepad2 size={14}/>, label: "Snake" }
          ].map(g => (
            <button 
              key={g.id}
              onClick={() => { setActiveGame(g.id as GameType); setGameState("idle"); stopLoop(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight whitespace-nowrap transition-all ${activeGame === g.id ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              {g.icon} {g.label}
            </button>
          ))}
        </div>

        {/* SCREEN */}
        <div className="relative h-64 bg-slate-900 rounded-[2rem] border-4 border-slate-800 overflow-hidden group">
          {gameState === "idle" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <p className="text-white font-black text-sm mb-4">READY TO EXECUTE?</p>
              <button onClick={initGame} className="px-8 py-3 bg-white text-slate-900 font-black rounded-2xl text-xs uppercase hover:scale-105 transition shadow-xl">Start {activeGame}</button>
            </div>
          )}

          {gameState === "gameover" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-500/20 backdrop-blur-md">
              <p className="text-white font-black text-xl mb-1">SESSION ENDED</p>
              <p className="text-white/80 font-bold text-[10px] mb-4">Score: {score}</p>
              <button onClick={initGame} className="px-8 py-3 bg-white text-slate-900 font-black rounded-2xl text-xs uppercase">Restart</button>
            </div>
          )}

          {/* Render Navigator Game */}
          {activeGame === "navigator" && gameState === "playing" && (
            <>
              <div className="absolute bottom-4 text-2xl z-10 transition-all duration-75" style={{ left: `${playerPosition}%`, transform: 'translateX(-50%)' }}>🚀</div>
              {items.map(i => <div key={i.id} className="absolute text-xl" style={{ left: `${i.x}%`, top: `${i.y}%` }}>{i.type === "task" ? "✅" : "❌"}</div>)}
              <input type="range" min="5" max="95" value={playerPosition} onChange={(e) => setPlayerPosition(parseInt(e.target.value))} className="absolute inset-x-0 bottom-0 h-full opacity-0 cursor-pointer z-30" />
            </>
          )}

          {/* Render Tap Game */}
          {activeGame === "tap" && gameState === "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <button onClick={() => setScore(s => s + 1)} className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition transform">
                <Zap size={40} fill="white" />
              </button>
              <p className="text-white/40 text-[10px] mt-4 font-bold uppercase">Click Fast!</p>
            </div>
          )}

          {/* Placeholders for others to keep code light */}
          {(activeGame === "memory" || activeGame === "bounce" || activeGame === "snake") && gameState === "playing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 text-center p-8">
              <Code2 className="mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Logic Node Locked</p>
              <p className="text-[8px] mt-1">This module is under construction for the v0.9 update.</p>
              <button onClick={endGame} className="mt-4 text-[10px] underline">Back to Navigator</button>
            </div>
          )}

          {/* UI OVERLAY */}
          <div className="absolute top-4 inset-x-6 flex justify-between pointer-events-none">
             <div className="text-left">
               <p className="text-[8px] font-bold text-slate-500 uppercase">Progress</p>
               <p className="text-white font-black text-lg">{score}</p>
             </div>
             <div className="text-right">
               <p className="text-[8px] font-bold text-slate-500 uppercase">Best</p>
               <p className="text-orange-400 font-black text-lg">{highScore}</p>
             </div>
          </div>
        </div>

        {/* BOTTOM ACTION */}
        <div className="pt-2">
          <button onClick={handleReconnect} disabled={isRetrying} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition active:scale-95 disabled:opacity-50">
            {isRetrying ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            <span className="uppercase text-xs tracking-widest">{isRetrying ? 'Synchronizing...' : 'Retry Uplink'}</span>
          </button>
          <div className="flex items-center justify-center gap-2 mt-4 text-orange-500">
            <Trophy size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Rank: System Guardian</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function Code2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code-2"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
  );
}