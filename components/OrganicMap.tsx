import React, { useState, useEffect } from 'react';
import { OrganicCompound, OrganicReaction, QuizQuestion } from '../types';
import { DB } from '../utils/db';
import { generateOrganicPractice, toSubscript } from '../services/geminiService';
import { FlaskConical, Flame, RefreshCcw, ArrowRight, Zap, CheckCircle2, XCircle, Beaker, X, TestTube, Plus, Trash2, Save, Edit, BrainCircuit } from 'lucide-react';

export const OrganicMap: React.FC = () => {
  // --- STATE ---
  const [data, setData] = useState<OrganicCompound[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<OrganicReaction | null>(null);
  
  // Practice Mode
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  
  // Old Local Practice State (Fallback)
  const [localQuestion, setLocalQuestion] = useState<{
      targetReaction: OrganicReaction;
      compoundName: string;
      options: OrganicReaction[];
  } | null>(null);
  
  // New AI Quiz State
  const [aiQuestion, setAiQuestion] = useState<QuizQuestion | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);

  // Add Mode
  const [isAdding, setIsAdding] = useState(false);
  const [newCompound, setNewCompound] = useState<Partial<OrganicCompound>>({
      id: '', name: '', formula: '', class: '', preparation: '', reactions: []
  });
  // Temp state for adding a reaction to the new compound
  const [newReaction, setNewReaction] = useState<Partial<OrganicReaction>>({
      action: 'Cháy', reagent: '', equation: '', description: ''
  });

  // Load Data from DB
  const loadData = async () => {
      try {
          const items = await DB.getAllOrganic();
          setData(items);
          if (!selectedId && items.length > 0) setSelectedId(items[0].id);
      } catch (e) {
          console.error(e);
      }
  };

  useEffect(() => {
      loadData();
  }, []);

  const currentCompound = data.find(c => c.id === selectedId) || data[0];

  const getActionIcon = (action: string) => {
    switch(action) {
        case 'Cháy': return <Flame className="w-5 h-5 text-orange-500" />;
        case 'Cộng': return <Zap className="w-5 h-5 text-yellow-500" />;
        case 'Trùng hợp': return <RefreshCcw className="w-5 h-5 text-purple-500" />;
        case 'Oxi hóa': return <FlaskConical className="w-5 h-5 text-pink-500" />;
        default: return <Beaker className="w-5 h-5 text-blue-500" />;
    }
  };

  // --- LOGIC: PRACTICE ---
  
  const startPractice = async () => {
      if (data.length === 0) return;
      
      setIsPracticeMode(true);
      setPracticeFeedback(null);
      
      const hasKey = !!localStorage.getItem('GEMINI_API_KEY');
      const randomCompound = data[Math.floor(Math.random() * data.length)];

      if (hasKey) {
          // AI Mode
          setIsAiMode(true);
          setPracticeLoading(true);
          setAiQuestion(null);
          try {
              const q = await generateOrganicPractice(randomCompound.name);
              setAiQuestion(q);
          } catch (e) {
              console.error("AI Fail, fallback local", e);
              setIsAiMode(false);
              startLocalPractice(randomCompound);
          } finally {
              setPracticeLoading(false);
          }
      } else {
          // Local Mode
          setIsAiMode(false);
          startLocalPractice(randomCompound);
      }
  };

  const startLocalPractice = (randomCompound: OrganicCompound) => {
      if (!randomCompound.reactions || randomCompound.reactions.length === 0) {
          // Retry with another compound if empty
          const next = data.find(c => c.id !== randomCompound.id && c.reactions.length > 0);
          if(next) startLocalPractice(next);
          else alert("Chưa đủ dữ liệu để luyện tập.");
          return;
      }

      const randomReaction = randomCompound.reactions[Math.floor(Math.random() * randomCompound.reactions.length)];
      
      // Get wrong options
      const allReactions = data.flatMap(c => c.reactions);
      const wrongOptions = allReactions
          .filter(r => r.equation !== randomReaction.equation)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3); // 3 wrong + 1 correct = 4
          
      const options = [randomReaction, ...wrongOptions].sort(() => 0.5 - Math.random());
      setLocalQuestion({ targetReaction: randomReaction, compoundName: randomCompound.name, options: options });
  };

  const checkAnswer = (idx: number, equationOrOption: string) => {
      if (isAiMode && aiQuestion) {
          if (idx === aiQuestion.correctAnswer) setPracticeFeedback('correct');
          else setPracticeFeedback('wrong');
      } else if (localQuestion) {
          if (equationOrOption === localQuestion.targetReaction.equation) setPracticeFeedback('correct');
          else setPracticeFeedback('wrong');
      }
  };

  // --- LOGIC: ADD NEW COMPOUND ---
  
  const handleSelectExistingToEdit = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      if (!id) {
          // Reset to blank new
          setNewCompound({ id: '', name: '', formula: '', class: '', preparation: '', reactions: [] });
          return;
      }
      const existing = data.find(c => c.id === id);
      if (existing) {
          // Clone to avoid direct mutation
          setNewCompound(JSON.parse(JSON.stringify(existing)));
      }
  };

  const handleAddReaction = () => {
      if (!newReaction.equation) { alert("Cần nhập phương trình phản ứng"); return; }
      
      const r: OrganicReaction = {
          action: (newReaction.action as any) || 'Khác',
          reagent: newReaction.reagent || '',
          condition: newReaction.condition || '',
          equation: newReaction.equation || '',
          description: newReaction.description || '',
          productName: ''
      };

      setNewCompound(prev => ({
          ...prev,
          reactions: [...(prev.reactions || []), r]
      }));

      // Reset reaction form
      setNewReaction({ action: 'Cháy', reagent: '', equation: '', description: '' });
  };

  const handleSaveCompound = async () => {
      if (!newCompound.name || !newCompound.formula) {
          alert("Vui lòng nhập Tên và Công thức");
          return;
      }

      const id = newCompound.id || (newCompound.formula?.replace(/[^a-zA-Z0-9]/g, '') + Date.now());
      const compound: OrganicCompound = {
          id: id,
          name: newCompound.name!,
          formula: newCompound.formula!,
          class: newCompound.class || 'Khác',
          preparation: newCompound.preparation,
          reactions: newCompound.reactions || []
      };

      await DB.saveOrganic(compound);
      await loadData();
      
      setIsAdding(false);
      setNewCompound({ id: '', name: '', formula: '', class: '', preparation: '', reactions: [] });
      setSelectedId(id); // Switch to new/edited item
  };

  const handleDeleteCompound = async () => {
      if (!currentCompound) return;
      if (window.confirm(`Bạn có chắc muốn xóa ${currentCompound.name}?`)) {
          await DB.deleteOrganic(currentCompound.id);
          await loadData();
          if (data.length > 0) setSelectedId(data[0].id);
      }
  };

  // --- RENDER: ADD FORM ---
  if (isAdding) {
      return (
          <div className="bg-white min-h-[80vh] rounded-2xl shadow-sm border border-indigo-100 p-4 animate-slide-up pb-24">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-slate-800">
                      {newCompound.id ? 'Sửa Chất / Thêm Phản Ứng' : 'Thêm Chất Hữu Cơ Mới'}
                  </h2>
                  <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
              </div>

              {/* Select Existing Helper */}
              <div className="mb-6 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                  <label className="text-xs font-bold text-indigo-800 uppercase mb-1 block">Chọn chất có sẵn để sửa hoặc thêm phản ứng:</label>
                  <select 
                     className="w-full p-2 rounded-lg border border-indigo-200 text-sm font-bold text-slate-700"
                     onChange={handleSelectExistingToEdit}
                     value={newCompound.id || ''}
                  >
                      <option value="">-- Tạo mới hoàn toàn --</option>
                      {data.map(c => (
                          <option key={c.id} value={c.id}>{toSubscript(c.formula)} - {c.name}</option>
                      ))}
                  </select>
              </div>

              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Tên chất</label>
                          <input 
                              className="w-full p-2 border rounded-lg font-bold" 
                              placeholder="VD: Propan"
                              value={newCompound.name}
                              onChange={e => setNewCompound({...newCompound, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Công thức (CTPT)</label>
                          <input 
                              className="w-full p-2 border rounded-lg font-bold" 
                              placeholder="VD: C3H8"
                              value={newCompound.formula}
                              onChange={e => setNewCompound({...newCompound, formula: e.target.value})}
                          />
                      </div>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Phân loại</label>
                      <input 
                          className="w-full p-2 border rounded-lg" 
                          placeholder="VD: Hidrocacbon no"
                          value={newCompound.class}
                          onChange={e => setNewCompound({...newCompound, class: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Điều chế (Tùy chọn)</label>
                      <textarea 
                          className="w-full p-2 border rounded-lg text-sm" 
                          rows={2}
                          value={newCompound.preparation}
                          onChange={e => setNewCompound({...newCompound, preparation: e.target.value})}
                      />
                  </div>

                  {/* Reaction Sub-form */}
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <h3 className="font-bold text-blue-800 text-sm mb-2">Thêm Phản Ứng Mới (Hiện có: {newCompound.reactions?.length || 0})</h3>
                      <div className="space-y-2">
                          <select 
                            className="w-full p-2 rounded border"
                            value={newReaction.action}
                            onChange={e => setNewReaction({...newReaction, action: e.target.value as any})}
                          >
                              <option>Cháy</option>
                              <option>Thế</option>
                              <option>Cộng</option>
                              <option>Trùng hợp</option>
                              <option>Oxi hóa</option>
                              <option>Este hóa</option>
                              <option>Thủy phân</option>
                              <option>Khác</option>
                          </select>
                          <input 
                              className="w-full p-2 rounded border text-sm" placeholder="Tác nhân (VD: + O2)"
                              value={newReaction.reagent}
                              onChange={e => setNewReaction({...newReaction, reagent: e.target.value})}
                          />
                           <input 
                              className="w-full p-2 rounded border text-sm" placeholder="Điều kiện (t°, xt...)"
                              value={newReaction.condition}
                              onChange={e => setNewReaction({...newReaction, condition: e.target.value})}
                          />
                          <input 
                              className="w-full p-2 rounded border font-mono text-sm" placeholder="PT: A + B -> C"
                              value={newReaction.equation}
                              onChange={e => setNewReaction({...newReaction, equation: e.target.value})}
                          />
                           <input 
                              className="w-full p-2 rounded border text-sm" placeholder="Mô tả hiện tượng..."
                              value={newReaction.description}
                              onChange={e => setNewReaction({...newReaction, description: e.target.value})}
                          />
                          <button 
                            onClick={handleAddReaction}
                            className="w-full bg-blue-200 text-blue-800 font-bold py-2 rounded-lg hover:bg-blue-300"
                          >
                              + Thêm phản ứng này
                          </button>
                      </div>
                  </div>
                  
                  {/* List of existing reactions preview (simple) */}
                  {newCompound.reactions && newCompound.reactions.length > 0 && (
                      <div className="text-xs text-gray-500">
                          <p className="font-bold">Các phản ứng hiện tại:</p>
                          <ul className="list-disc pl-4">
                              {newCompound.reactions.map((r, i) => (
                                  <li key={i}>{r.action}: {r.equation.substring(0, 30)}...</li>
                              ))}
                          </ul>
                      </div>
                  )}

                  <div className="pt-2">
                      <button 
                        onClick={handleSaveCompound}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                      >
                          <Save size={18} /> Lưu Thay Đổi
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: PRACTICE (AI & LOCAL) ---
  if (isPracticeMode) {
      if (practiceLoading) {
          return (
              <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-indigo-100 flex flex-col items-center justify-center min-h-[300px]">
                  <BrainCircuit className="w-16 h-16 text-indigo-300 animate-pulse mb-4" />
                  <p className="font-bold text-indigo-600">AI đang soạn câu hỏi...</p>
              </div>
          );
      }

      // AI Mode Render
      if (isAiMode && aiQuestion) {
          return (
              <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-indigo-100 animate-fade-in pb-20">
                  <div className="mb-6">
                      <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">AI Question</span>
                      <h3 className="text-lg font-bold text-slate-800 leading-relaxed">{toSubscript(aiQuestion.question)}</h3>
                  </div>
                  
                  <div className="space-y-3">
                      {aiQuestion.options.map((opt, idx) => (
                          <button
                              key={idx}
                              onClick={() => checkAnswer(idx, opt)}
                              disabled={practiceFeedback !== null}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                  practiceFeedback === 'correct' && idx === aiQuestion.correctAnswer
                                  ? 'bg-green-100 border-green-500 text-green-900'
                                  : practiceFeedback === 'wrong' && idx !== aiQuestion.correctAnswer && practiceFeedback !== null // Visual cue for disabled
                                  ? 'opacity-40 bg-gray-50'
                                  : 'bg-white hover:bg-gray-50 border-gray-200'
                              } ${practiceFeedback === 'wrong' && idx === (aiQuestion.options.indexOf(opt)) ? 'bg-red-100 border-red-200' : ''}`}
                          >
                              <span className="font-bold text-gray-500 mr-2">{String.fromCharCode(65+idx)}.</span>
                              <span className="font-medium text-slate-800">{toSubscript(opt)}</span>
                          </button>
                      ))}
                  </div>

                  {practiceFeedback === 'correct' && (
                      <div className="mt-6 text-center animate-bounce">
                          <div className="text-green-600 font-bold text-xl flex items-center justify-center gap-2">
                              <CheckCircle2 /> Chính xác!
                          </div>
                          <p className="text-sm text-gray-600 mt-2 bg-green-50 p-2 rounded">{toSubscript(aiQuestion.explanation)}</p>
                          <button onClick={startPractice} className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg">Câu tiếp theo →</button>
                      </div>
                  )}
                  {practiceFeedback === 'wrong' && (
                      <div className="mt-6 text-center">
                           <div className="text-red-500 font-bold text-lg flex items-center justify-center gap-2 mb-4">
                              <XCircle /> Chưa đúng rồi.
                          </div>
                          <button onClick={startPractice} className="text-gray-400 font-bold hover:text-gray-600">Bỏ qua</button>
                      </div>
                  )}
                   <button onClick={() => setIsPracticeMode(false)} className="mt-8 w-full py-3 text-gray-400 font-bold hover:text-gray-600 border-t">Thoát</button>
              </div>
          );
      }

      // Fallback Local Mode Render
      if (!isAiMode && localQuestion) {
          return (
              <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-indigo-100 animate-fade-in pb-20">
                  <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-slate-700 mb-2">Thử Thách (Chế độ Cơ bản)</h3>
                      <p className="text-base text-gray-600">
                          Từ <span className="font-bold text-blue-600 text-lg">{localQuestion.compoundName}</span>, 
                          hãy chọn phương trình cho phản ứng:
                      </p>
                      <div className="bg-indigo-50 p-4 rounded-xl mt-3 border border-indigo-200 text-indigo-900 font-medium italic break-words">
                          "{toSubscript(localQuestion.targetReaction.description)}"
                      </div>
                  </div>
    
                  <div className="grid gap-4">
                      {localQuestion.options.map((opt, idx) => (
                          <button 
                              key={idx}
                              onClick={() => checkAnswer(idx, opt.equation)}
                              disabled={practiceFeedback !== null}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                  practiceFeedback === 'correct' && opt.equation === localQuestion.targetReaction.equation
                                  ? 'bg-green-100 border-green-500 text-green-900'
                                  : practiceFeedback === 'wrong' && opt.equation !== localQuestion.targetReaction.equation
                                  ? 'opacity-40'
                                  : 'bg-white hover:bg-gray-50 border-gray-200 shadow-sm active:scale-[0.98]'
                              }`}
                          >
                              <div className="font-bold flex items-center gap-3">
                                  <div className="p-2 bg-white rounded-lg shadow-sm border shrink-0">{getActionIcon(opt.action)}</div>
                                  <div className="min-w-0">
                                    <span className="block">{opt.action}</span>
                                    <span className="text-xs font-normal text-gray-500 truncate block">{toSubscript(opt.equation)}</span>
                                  </div>
                              </div>
                          </button>
                      ))}
                  </div>
    
                  {practiceFeedback === 'correct' && (
                      <div className="mt-6 text-center animate-bounce">
                          <div className="text-green-600 font-bold text-xl flex items-center justify-center gap-2">
                              <CheckCircle2 /> Chính xác!
                          </div>
                          <button onClick={startPractice} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg">Câu tiếp theo →</button>
                      </div>
                  )}
                   {practiceFeedback === 'wrong' && (
                      <div className="mt-6 text-center">
                          <div className="text-red-500 font-bold text-lg flex items-center justify-center gap-2 mb-4">
                              <XCircle /> Sai rồi, thử lại nhé!
                          </div>
                          <button onClick={startPractice} className="text-gray-400 font-bold hover:text-gray-600">Bỏ qua câu này</button>
                      </div>
                  )}
    
                  <button 
                      onClick={() => setIsPracticeMode(false)}
                      className="mt-8 w-full py-3 text-gray-400 font-bold hover:text-gray-600 border-t"
                  >
                      Thoát luyện tập
                  </button>
              </div>
          );
      }
      return null;
  }

  // --- RENDER: MAIN VIEW ---
  if (data.length === 0) {
      return (
          <div className="text-center py-10">
              <p>Chưa có dữ liệu.</p>
              <button onClick={() => setIsAdding(true)} className="text-blue-500 font-bold">Thêm mới</button>
          </div>
      )
  }

  // FIXED FONT SIZE for Short formulas
  const getCircleFontSize = (text: string) => {
      const len = text.length; 
      if (len > 8) return "text-xs"; 
      if (len > 6) return "text-sm";
      if (len >= 4) return "text-xl"; // C2H4 (4 chars) -> xl
      if (len === 3) return "text-2xl"; // CH4 (3 chars) -> 2xl
      return "text-4xl"; // Al (2 chars), C (1 char)
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24">
      <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Sơ Đồ Hữu Cơ</h2>
            <p className="text-xs text-gray-500 font-medium">Chọn chất để xem phản ứng</p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setIsAdding(true)}
                className="bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200"
            >
                <Plus size={20} />
            </button>
            <button 
                onClick={startPractice}
                className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg active:scale-95 flex items-center gap-1"
            >
                <BrainCircuit size={16} /> Luyện tập
            </button>
          </div>
      </div>
      
      {/* Grid List */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {data.map(c => (
            <button
                key={c.id}
                onClick={() => { setSelectedId(c.id); setSelectedReaction(null); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className={`p-3 rounded-xl border-2 transition-all font-bold text-left relative overflow-hidden flex flex-col justify-center min-h-[80px] ${
                    selectedId === c.id 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
            >
                <span className="block text-sm mb-1 leading-tight">{c.name}</span>
                <span className={`block text-[12px] break-all whitespace-normal leading-tight ${selectedId === c.id ? 'text-blue-100' : 'text-gray-400'}`}>
                    {toSubscript(c.formula)}
                </span>
                {selectedId === c.id && <div className="absolute right-2 top-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>}
            </button>
        ))}
      </div>

      {/* Main visualization area */}
      {currentCompound && (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-50 overflow-hidden relative min-h-[300px]">
          <div className="bg-gradient-to-r from-slate-50 to-white p-6 flex flex-col items-center justify-center border-b border-gray-100 relative">
             <button 
                onClick={handleDeleteCompound}
                className="absolute right-4 top-4 text-gray-300 hover:text-red-500 p-2"
                title="Xóa chất này"
             >
                 <Trash2 size={18} />
             </button>

             {/* CIRCLE FIX: Use toSubscript and Adaptive Font Size */}
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-blue-50 mb-3 px-2 text-center overflow-hidden shrink-0">
                 <span className={`font-black text-slate-800 whitespace-nowrap leading-tight text-center ${getCircleFontSize(currentCompound.formula)}`}>
                     {toSubscript(currentCompound.formula)}
                 </span>
             </div>
             <h3 className="text-xl font-bold text-blue-900 text-center">{currentCompound.name}</h3>
             <span className="text-xs font-bold text-white bg-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1">{currentCompound.class}</span>
          </div>

          <div className="p-4 bg-gray-50 space-y-4 mb-20 md:mb-0">
               {/* Preparation Section */}
               {currentCompound.preparation && (
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                      <h4 className="font-bold text-indigo-700 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <TestTube className="w-4 h-4" /> Điều chế
                      </h4>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                          {toSubscript(currentCompound.preparation)}
                      </p>
                  </div>
               )}

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase ml-2 mb-2">Các phản ứng hóa học:</p>
                <div className="space-y-2">
                {currentCompound.reactions.map((r, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedReaction(r)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left group ${
                          selectedReaction === r 
                          ? 'bg-white border-blue-500 ring-2 ring-blue-100 z-10' 
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                       <div className="flex items-center gap-4 w-full">
                           <div className={`p-3 rounded-xl transition-colors shrink-0 ${
                               selectedReaction === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                           }`}>
                              {getActionIcon(r.action)}
                           </div>
                           <div className="min-w-0 flex-1">
                               <div className={`font-bold text-base ${selectedReaction === r ? 'text-blue-800' : 'text-slate-700'}`}>{r.action}</div>
                               <div className="text-xs text-gray-500 font-medium mt-1 truncate">{toSubscript(r.reagent)}</div>
                           </div>
                           <ArrowRight className={`w-5 h-5 shrink-0 ${selectedReaction === r ? 'text-blue-500' : 'text-gray-300'}`} />
                       </div>
                    </button>
                ))}
                {currentCompound.reactions.length === 0 && <p className="text-center text-gray-400 italic text-sm">Chưa có dữ liệu phản ứng.</p>}
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Mobile Friendly Detail Overlay */}
      {selectedReaction && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:bg-black/20 pointer-events-none">
              <div className="w-full md:w-[500px] bg-white md:rounded-2xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] pointer-events-auto animate-slide-up flex flex-col max-h-[85vh] overflow-hidden">
                  
                  {/* Handle for drag feel */}
                  <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-white" onClick={() => setSelectedReaction(null)}>
                      <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                  </div>

                  <div className="p-6 overflow-y-auto">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="text-2xl font-bold text-slate-800">{selectedReaction.action}</span>
                                  {getActionIcon(selectedReaction.action)}
                              </div>
                              <p className="text-sm text-gray-500 font-medium">Tác nhân: {toSubscript(selectedReaction.reagent)}</p>
                          </div>
                          <button 
                            onClick={() => setSelectedReaction(null)}
                            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                          >
                              <X className="w-6 h-6 text-gray-500" />
                          </button>
                      </div>

                      <div className="bg-slate-900 rounded-xl p-6 text-center shadow-inner mb-6 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                          <p className="text-white font-mono font-bold text-lg md:text-xl break-words whitespace-pre-wrap leading-relaxed">
                              {toSubscript(selectedReaction.equation)}
                          </p>
                          {selectedReaction.condition && (
                              <span className="inline-block mt-3 text-xs font-bold text-slate-400 border border-slate-700 px-3 py-1 rounded-full">
                                  Điều kiện: {toSubscript(selectedReaction.condition)}
                              </span>
                          )}
                      </div>

                      <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                          <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                              <Beaker className="w-4 h-4" /> Hiện tượng & Giải thích
                          </h4>
                          <p className="text-slate-700 leading-relaxed">
                              {toSubscript(selectedReaction.description)}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};