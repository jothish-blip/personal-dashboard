import React from "react";
import { X } from "lucide-react";
import { TaskType, Priority } from "./types";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  handleSave: () => void;
}

export default function AddEventModal({ isOpen, onClose, formData, setFormData, handleSave }: AddEventModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
        <div className="p-10 space-y-10">
          <header className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">Initialize Node</h3>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-900"><X size={24} /></button>
          </header>

          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descriptor</label>
              <input 
                autoFocus type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Objective Detail..." 
                className="w-full py-4 border-b border-slate-100 focus:border-orange-500 outline-none font-bold text-xl placeholder:text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp (Date)</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full py-2 bg-transparent outline-none font-bold text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Time</label>
                <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full py-2 bg-transparent outline-none font-bold text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Domain Group</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TaskType})} className="w-full py-2 bg-transparent outline-none font-bold text-sm">
                  {["Work", "Study", "Health", "Finance", "Personal", "Deep Work", "Learning", "Meeting"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority Level</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Priority})} className="w-full py-2 bg-transparent outline-none font-bold text-sm">
                  <option value="low">Low Impact</option><option value="medium">Medium Impact</option><option value="high">High Impact</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            >
              Write to System Memory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}