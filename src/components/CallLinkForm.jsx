import React, { useState } from "react";
import { X, Video, Type, AlignLeft, Plus } from "lucide-react";
import useCall from "../hooks/useCall";
import useAuthStore from "../store/AuthStore";

/**
 * CallLinkForm - Premium UI for creating a new meeting link
 */
const CallLinkForm = ({ onClose }) => {
  const { user } = useAuthStore();
  const { createCallLink, isLoading } = useCall();
  
  const [formData, setFormData] = useState({
    title: "",
    description: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    await createCallLink({
      title: formData.title,
      description: formData.description,
      host_id: user?.id
    });
    
    onClose(); // Close modal after attempt
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-hidden pt-[94px] sm:pt-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Form Container */}
      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl relative z-10 animate-in fade-in slide-in-from-top-4 sm:zoom-in duration-500 overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
        
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Video size={24} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Create Call</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Permanent Link</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
          <div className="space-y-4">
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Type size={14} className="text-emerald-500/50" />
                Meeting Title
              </label>
              <div className="relative group">
                <input 
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Weekly Design Sync"
                  required
                  disabled={isLoading}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.08] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <AlignLeft size={14} className="text-emerald-500/50" />
                Description <span className="text-slate-600 normal-case font-normal">(Optional)</span>
              </label>
              <div className="relative group">
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What is this meeting about?"
                  rows="4"
                  disabled={isLoading}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.08] transition-all resize-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            type="submit"
            disabled={isLoading || !formData.title.trim()}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Generate Link
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CallLinkForm;
