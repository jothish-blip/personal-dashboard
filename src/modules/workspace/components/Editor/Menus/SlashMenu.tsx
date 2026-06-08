import React from 'react';

interface SlashMenuProps {
  showSlashMenu: boolean;
  filteredSlashCommands: any[];
  isDarkMode: boolean;
  handleSlashCommand: (cmd: string) => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({ showSlashMenu, filteredSlashCommands, isDarkMode, handleSlashCommand }) => {
  if (!showSlashMenu) return null;

  return (
    <div className={`fixed left-1/2 top-[40%] -translate-x-1/2 z-[60] backdrop-blur-xl border shadow-2xl rounded-2xl p-3 w-72 animate-in fade-in zoom-in-95 duration-200 ${
      isDarkMode ? "bg-[#111111]/95 border-gray-800" : "bg-white/95 border-gray-200"
    }`}>
      <p className={`text-[10px] font-black px-3 py-1 uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
        {filteredSlashCommands.length > 0 ? "Quick Commands" : "No Match Found"}
      </p>
      {filteredSlashCommands.map((item) => (
        <button
          key={item.cmd}
          onClick={() => handleSlashCommand(item.cmd)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-colors ${
            isDarkMode ? "hover:bg-green-900/30 active:bg-green-900/50 text-gray-200" : "hover:bg-green-50 active:bg-green-100 text-gray-800"
          }`}
        >
          <span className={isDarkMode ? "text-green-500" : "text-green-600"}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
};