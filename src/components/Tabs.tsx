"use client";

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
  const tabs = [
    { id: 'matrix', label: 'MATRIX ENGINE' },
    { id: 'analytics', label: 'INSIGHTS' },
    { id: 'audit', label: 'AUDIT LOGS' }
  ];

  return (
    <div className="
      flex flex-wrap items-center gap-2 px-5 border-b border-gray-200 shrink-0 z-[90]
      sticky top-[73px] md:top-[77px] 
      bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80
      transition-all duration-300
    ">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            relative flex-1 sm:flex-none min-w-[100px] text-center py-4 px-5 
            text-[11px] font-black tracking-widest transition-all duration-200
            ${
              activeTab === tab.id 
                ? 'text-blue-600' 
                : 'text-gray-400 hover:text-slate-900'
            }
          `}
        >
          {tab.label}

          {/* ACTIVE INDICATOR (Animated Underline) */}
          {activeTab === tab.id && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 animate-in fade-in slide-in-from-bottom-1 duration-300" 
            />
          )}
        </button>
      ))}
    </div>
  );
}