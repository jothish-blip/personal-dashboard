"use client";

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Tabs({ activeTab, setActiveTab }: TabsProps) {
  const tabs = [
    { id: 'matrix', label: 'Matrix Engine' },
    { id: 'analytics', label: 'Insights' },
    { id: 'audit', label: 'Audit Logs' }
  ];

  return (
    <div className="w-full border-b border-gray-200 sticky top-[64px] z-[90] bg-white/90 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="max-w-[1500px] mx-auto flex items-center px-4 gap-8 overflow-x-auto custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative py-3.5 text-sm font-semibold transition-colors whitespace-nowrap
              ${
                activeTab === tab.id 
                  ? 'text-orange-600' 
                  : 'text-gray-500 hover:text-gray-800'
              }
            `}
          >
            {tab.label}

            {/* ACTIVE INDICATOR (Clean Underline) */}
            {activeTab === tab.id && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-t-sm animate-in fade-in zoom-in-95 duration-200" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Hide scrollbar on mobile overflow to keep it clean */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}