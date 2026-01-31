import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import { ValenceTable } from './components/ValenceTable';
import { OrganicMap } from './components/OrganicMap';
import { AITutor } from './components/AITutor';
import { DB } from './utils/db';
import { getUsageStats, UsageStats } from './services/geminiService';
import { Search, FlaskConical, Bot, Settings, Key, X, Check, MessageSquare, Trash2, HardDrive, Link as LinkIcon, Cpu, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('TABLE');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiModel, setApiModel] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Storage State
  const [storageUsage, setStorageUsage] = useState<{usage: number, quota: number} | null>(null);
  
  // API Usage State
  const [apiStats, setApiStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    setApiKey(localStorage.getItem('GEMINI_API_KEY') || '');
    setApiEndpoint(localStorage.getItem('CUSTOM_API_ENDPOINT') || '');
    setApiModel(localStorage.getItem('CUSTOM_API_MODEL') || '');
    setCustomPrompt(localStorage.getItem('GEMINI_CUSTOM_PROMPT') || '');
  }, []);

  // Fetch Data when Settings open
  useEffect(() => {
      if (showSettings) {
          // 1. Storage
          if(navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                setStorageUsage({
                    usage: estimate.usage || 0,
                    quota: estimate.quota || 0
                });
            }).catch(err => console.error("Storage estimate error:", err));
          }

          // 2. API Usage
          setApiStats(getUsageStats());
      }
  }, [showSettings]);

  const saveSettings = () => {
    if (apiKey.trim()) localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    else localStorage.removeItem('GEMINI_API_KEY');

    if (apiEndpoint.trim()) localStorage.setItem('CUSTOM_API_ENDPOINT', apiEndpoint.trim());
    else localStorage.removeItem('CUSTOM_API_ENDPOINT');

    if (apiModel.trim()) localStorage.setItem('CUSTOM_API_MODEL', apiModel.trim());
    else localStorage.removeItem('CUSTOM_API_MODEL');

    if (customPrompt.trim()) localStorage.setItem('GEMINI_CUSTOM_PROMPT', customPrompt.trim());
    else localStorage.removeItem('GEMINI_CUSTOM_PROMPT');

    setShowSettings(false);
  };

  const handleGlobalReset = async () => {
      if (window.confirm("⚠️ CẢNH BÁO: Hành động này sẽ xóa toàn bộ dữ liệu bạn đã thêm và đưa về trạng thái gốc.\n\nBạn có chắc chắn không?")) {
          await DB.resetData();
          localStorage.removeItem('GEMINI_USAGE_STATS'); // Also reset stats
          alert("Dữ liệu đã được khôi phục về mặc định.");
          window.location.reload(); 
      }
  };

  const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const Tab = ({ target, icon: Icon, label }: { target: ViewState; icon: any; label: string }) => (
     <button 
        onClick={() => setView(target)}
        className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors border-b-4 ${
            view === target 
            ? 'border-blue-600 text-blue-800 bg-blue-50' 
            : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'
        }`}
     >
         <Icon size={18} className={view === target ? "fill-current" : ""} />
         <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
     </button>
  );

  // Layout Logic:
  // - AI_TUTOR: Full width (w-full), no max-width limit, no padding constraints.
  // - Others: Max width for readability, centered.
  const isAI = view === 'AI_TUTOR';
  // Note: 'mx-auto' keeps content centered when max-width is applied
  const containerClass = isAI ? 'w-full' : 'max-w-xl mx-auto';
  const mainPadding = isAI ? 'p-0' : 'p-4';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col transition-all duration-300">
      
      {/* Header Container - Always Full Width Background */}
      <header className="w-full bg-white shadow-sm sticky top-0 z-10">
        
        {/* Header Content - Constrained Width based on View */}
        <div className={`transition-all duration-300 ${containerClass}`}>
            <div className="flex justify-between items-center px-4 py-3">
                 <div className="flex items-center gap-2">
                    <h1 className="font-extrabold text-lg text-blue-600 tracking-tight">Hóa Học 9</h1>
                    <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Vui Học</span>
                 </div>
                 <button 
                    onClick={() => setShowSettings(true)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                 >
                    <Settings size={18} />
                 </button>
            </div>
            
            {/* Simple Tabs - Reduced height */}
            <div className="flex border-t border-gray-100">
               <Tab target="TABLE" icon={Search} label="Tra Hóa Trị" />
               <Tab target="ORGANIC" icon={FlaskConical} label="Hữu Cơ" />
               <Tab target="AI_TUTOR" icon={Bot} label="Gia Sư AI" />
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`w-full flex-1 transition-all duration-300 ${containerClass} ${mainPadding}`}>
          {view === 'TABLE' && <ValenceTable />}
          {view === 'ORGANIC' && <OrganicMap />}
          {view === 'AI_TUTOR' && <AITutor />}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                 <h3 className="font-bold flex items-center gap-2"><Settings size={18} /> Cài đặt Ứng dụng</h3>
                 <button onClick={() => setShowSettings(false)} className="hover:bg-blue-700 p-1 rounded-full"><X size={20} /></button>
              </div>
              
              <div className="p-6 space-y-6">
                 
                 {/* STORAGE SECTION */}
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3">
                        <HardDrive size={16} className="text-slate-500"/> Dung lượng dữ liệu
                     </h4>
                     {storageUsage ? (
                         <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                <span>Đã dùng: {formatBytes(storageUsage.usage)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="h-2.5 rounded-full bg-blue-500"
                                    style={{ width: `${Math.min((storageUsage.usage / storageUsage.quota) * 100 * 10, 100)}%` }}
                                ></div>
                            </div>
                         </div>
                     ) : (
                         <p className="text-xs text-gray-400">Đang tính toán...</p>
                     )}
                 </div>

                 {/* API STATS SECTION */}
                 {apiStats && apiStats.totalRequests > 0 && (
                     <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                         <h4 className="flex items-center gap-2 font-bold text-orange-800 mb-3">
                            <Activity size={16} className="text-orange-600"/> Thống kê API
                         </h4>
                         <div className="grid grid-cols-2 gap-4 text-center">
                             <div className="bg-white p-2 rounded-lg border border-orange-100 shadow-sm">
                                 <div className="text-xs text-gray-400 font-bold uppercase">Requests</div>
                                 <div className="text-xl font-black text-orange-600">{apiStats.totalRequests}</div>
                             </div>
                             <div className="bg-white p-2 rounded-lg border border-orange-100 shadow-sm">
                                 <div className="text-xs text-gray-400 font-bold uppercase">Tokens</div>
                                 <div className="text-xl font-black text-orange-600">{apiStats.totalTokens.toLocaleString()}</div>
                             </div>
                         </div>
                         <div className="mt-3 space-y-2">
                             {Object.entries(apiStats.modelStats).map(([model, stats]: [string, any]) => (
                                 <div key={model} className="flex justify-between items-center text-xs border-t border-orange-100 pt-2">
                                     <span className="font-mono text-gray-600 font-bold">{model}</span>
                                     <span className="text-gray-500">{stats.requests} req / {stats.tokens.toLocaleString()} tok</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 <hr className="border-gray-100" />

                 {/* API CONFIG SECTION */}
                 <div>
                    <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                        <Key size={16} className="text-blue-500"/> Cấu hình API
                    </h4>
                    
                    <div className="space-y-3">
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">API Endpoint (URL)</label>
                             <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:border-blue-500">
                                 <LinkIcon size={16} className="text-gray-400" />
                                 <input 
                                    type="text" 
                                    value={apiEndpoint}
                                    onChange={(e) => setApiEndpoint(e.target.value)}
                                    placeholder="https://api.deepseek.com/chat/completions"
                                    className="w-full bg-transparent outline-none text-sm font-mono"
                                  />
                             </div>
                             <p className="text-[10px] text-gray-400 mt-1">Mặc định: https://api.deepseek.com/chat/completions</p>
                        </div>
                        
                         <div>
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Model Name</label>
                             <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:border-blue-500">
                                 <Cpu size={16} className="text-gray-400" />
                                 <input 
                                    type="text" 
                                    value={apiModel}
                                    onChange={(e) => setApiModel(e.target.value)}
                                    placeholder="deepseek-chat"
                                    className="w-full bg-transparent outline-none text-sm font-mono"
                                  />
                             </div>
                             <p className="text-[10px] text-gray-400 mt-1">VD: deepseek-chat, deepseek-reasoner</p>
                        </div>

                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">API Key</label>
                             <input 
                                type="password" 
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all font-mono text-sm"
                              />
                        </div>
                    </div>
                 </div>

                 <hr className="border-gray-100" />

                 {/* PROMPT SECTION */}
                 <div>
                     <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                        <MessageSquare size={16} className="text-purple-500"/> Lời nhắc hệ thống
                     </h4>
                     <textarea 
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="VD: Hãy giải thích thật dễ hiểu..."
                        rows={2}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition-all text-sm resize-none"
                     />
                 </div>

                 {/* RESET BUTTON MOVED TO BOTTOM */}
                 <button 
                    onClick={handleGlobalReset}
                    className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 flex items-center justify-center gap-2"
                 >
                     <Trash2 size={14} /> Reset Ứng Dụng (Xóa hết dữ liệu)
                 </button>
                 
                 <button 
                    onClick={saveSettings}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex justify-center items-center gap-2"
                  >
                     <Check size={18} /> Lưu Cài Đặt
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;