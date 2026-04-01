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
    <div className="flex flex-wrap items-center gap-2 px-5 border-b border-gray-200 shrink-0 bg-white transition-colors">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 min-w-[120px] text-center py-3 px-5 text-sm font-bold border-b-2 transition-colors ${
            activeTab === tab.id 
              ? 'text-blue-600 border-blue-600' 
              : 'text-gray-500 border-transparent hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}