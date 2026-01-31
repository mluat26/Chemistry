import React, { useState, useMemo, useEffect } from 'react';
import { ChemicalComponent, ElementType, Valence } from '../types';
import { DB } from '../utils/db';
import { FlaskConical, ChevronDown, Trash2, Atom, Zap, X, BookOpen, Copy, ArrowLeft, Upload, RefreshCw, Scale, Info } from 'lucide-react';

export const ValenceTable: React.FC = () => {
  const [input, setInput] = useState('');
  const [quickAddInput, setQuickAddInput] = useState('');
  const [isManageMode, setIsManageMode] = useState(false);
  
  // Data State
  const [data, setData] = useState<ChemicalComponent[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<ChemicalComponent | null>(null);

  // Load from DB
  const loadData = async () => {
      try {
          const items = await DB.getAllValence();
          setData(items);
      } catch (e) {
          console.error("DB Error", e);
      }
  };

  useEffect(() => {
      loadData();
  }, []);

  const handleResetDB = async () => {
      if(window.confirm("Bạn có chắc muốn khôi phục dữ liệu gốc? Dữ liệu bạn thêm sẽ bị mất.")) {
          await DB.resetData();
          loadData();
      }
  };

  const normalize = (s: string) => s.trim().toLowerCase();

  // --- LOGIC CATEGORIZATION ---
  const { fixed, variable, radicals } = useMemo(() => {
    const symbolCounts: Record<string, number> = {};
    data.forEach(c => {
      symbolCounts[c.symbol] = (symbolCounts[c.symbol] || 0) + 1;
    });

    const fixed: ChemicalComponent[] = [];
    const variable: ChemicalComponent[] = [];
    const radicals: ChemicalComponent[] = [];

    data.forEach(c => {
      if (c.type === ElementType.ACID_RADICAL || c.type === ElementType.OH) {
        radicals.push(c);
      } else {
        if (symbolCounts[c.symbol] > 1) {
          variable.push(c);
        } else {
          fixed.push(c);
        }
      }
    });

    return { fixed, variable, radicals };
  }, [data]);

  // --- ACTIONS ---
  const handleRemove = async (itemToRemove: ChemicalComponent) => {
      if (!itemToRemove.id) return;
      if(window.confirm(`Xóa ${itemToRemove.symbol} (${itemToRemove.valence})?`)) {
          await DB.deleteValence(itemToRemove.id);
          loadData();
          if (selectedItem?.id === itemToRemove.id) setSelectedItem(null);
      }
  };

  const handleCopyData = () => {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("Đã sao chép toàn bộ dữ liệu (JSON) vào bộ nhớ tạm!");
  };

  const parseAndAdd = async () => {
      if (!quickAddInput.trim()) return;

      const lines = quickAddInput.split('\n').filter(line => line.trim());
      let successCount = 0;
      let errorCount = 0;

      for (const line of lines) {
          // Expected format: Symbol - Name - Valence - Type (Opt) - Note (Opt)
          const parts = line.split('-').map(s => s.trim());
          
          if (parts.length < 3) {
              errorCount++;
              continue;
          }

          const [symbol, name, valStr, typeStr, note] = parts;

          // Valence Validation
          let valence: Valence = Valence.I;
          const vUpper = valStr.toUpperCase();
          if (Object.values(Valence).includes(vUpper as Valence)) {
              valence = vUpper as Valence;
          } else {
              // Convert numbers
              const map: Record<string, Valence> = {'1': Valence.I, '2': Valence.II, '3': Valence.III, '4': Valence.IV, '5': Valence.V, '6': Valence.VI};
              if (map[valStr]) valence = map[valStr];
              else {
                  // Fallback
                  valence = Valence.I; 
              }
          }

          // Type Detection
          let type = ElementType.METAL;
          
          if (typeStr) {
             // User provided type explicitly
             const tLower = typeStr.toLowerCase();
             if(tLower.includes('phi kim')) type = ElementType.NON_METAL;
             else if(tLower.includes('axit') || tLower.includes('gốc')) type = ElementType.ACID_RADICAL;
             else if(tLower.includes('kim loại')) type = ElementType.METAL;
             else if(tLower.includes('hydro')) type = ElementType.HYDROGEN;
             else if(tLower.includes('oh')) type = ElementType.OH;
          } else {
             // Auto-detect
             const sUpper = symbol.toUpperCase();
             if (['O', 'S', 'C', 'N', 'P', 'CL', 'BR', 'I', 'F'].includes(sUpper)) type = ElementType.NON_METAL;
             else if (symbol.length > 2 || ['OH', 'NO3', 'SO4', 'CO3', 'PO4'].includes(sUpper)) type = ElementType.ACID_RADICAL;
          }

          const newItem: ChemicalComponent = {
              symbol,
              name,
              valence,
              type,
              note: note || undefined,
              atomicMass: 0
          };
          
          await DB.addValence(newItem);
          successCount++;
      }

      loadData();
      setQuickAddInput('');
      
      if (successCount > 0) alert(`Đã lưu ${successCount} chất vào CSDL.`);
      else if (errorCount > 0) alert("Lỗi định dạng. Vui lòng kiểm tra lại.");
  };

  // --- RENDER HELPERS ---
  
  // Helper to adjust font size for long symbols (Visual Fix)
  const getSymbolFontSize = (text: string) => {
      if (text.length > 5) return "text-sm"; // Very long like CH3COO
      if (text.length > 2) return "text-lg"; // Medium like SO4, NO3
      return "text-3xl"; // Short like Fe, H (Bigger per request)
  };

  const renderList = (list: ChemicalComponent[]) => (
      <div className="space-y-3 mt-2 animate-slide-up">
          {list.map((item, idx) => (
              <button 
                  key={item.id || idx} 
                  onClick={() => setSelectedItem(item)}
                  className="w-full bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-blue-400 hover:shadow-md transition-all active:scale-[0.98] text-left relative overflow-hidden"
              >
                  {/* Highlighted Symbol Left */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-14 shrink-0 font-extrabold text-blue-600 text-center whitespace-nowrap ${getSymbolFontSize(item.symbol)}`}>
                          {item.symbol}
                      </div>
                      <div className="min-w-0 border-l border-gray-100 pl-4 py-1">
                          <div className="font-bold text-slate-800 text-base truncate">{item.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="text-[10px] text-gray-500 uppercase font-bold border border-gray-200 px-1.5 rounded">{item.type}</div>
                             {item.atomicMass && <div className="text-[10px] text-gray-400 bg-gray-50 px-1.5 rounded font-mono">{item.atomicMass}</div>}
                          </div>
                      </div>
                  </div>
                  
                  {/* Highlighted Valence Right (Yellow Box) */}
                  <div className="flex items-center gap-3 pl-2">
                       {/* Yellow Highlight Box */}
                       <div className="w-12 h-11 bg-yellow-300 rounded-xl flex items-center justify-center border-b-4 border-yellow-400 shadow-sm shrink-0">
                           <span className="font-black text-yellow-900 text-xl tracking-tighter">{item.valence}</span>
                       </div>
                  </div>

                  {/* Remove Button (Only visible on manage mode usually, but added absolute for consistent layout if needed, hiding for now in main view to keep clean) */}
                  {isManageMode && (
                    <div 
                        onClick={(e) => { e.stopPropagation(); handleRemove(item); }}
                        className="absolute top-0 right-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-bl-xl transition-colors"
                    >
                        <Trash2 size={14} />
                    </div>
                  )}
              </button>
          ))}
          {list.length === 0 && <p className="text-center text-xs text-gray-400 py-2">Trống</p>}
      </div>
  );

  const SummaryCard = ({ 
      title, count, icon: Icon, colorClass, categoryKey, list 
  }: { 
      title: string, count: number, icon: any, colorClass: string, categoryKey: string, list?: any[] 
  }) => (
      <div className={`bg-white rounded-2xl p-3 shadow-sm border-2 transition-all ${
          expandedCard === categoryKey ? `border-${colorClass}-400 ring-2 ring-${colorClass}-100` : 'border-gray-100 hover:border-gray-200'
      }`}>
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setExpandedCard(expandedCard === categoryKey ? null : categoryKey)}
          >
              <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${colorClass.replace('text', 'bg')}-100 ${colorClass}-600 flex items-center justify-center`}>
                      <Icon size={20} className={colorClass.includes('text') ? colorClass : `text-${colorClass}-600`} />
                  </div>
                  <div>
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
                    <p className="text-xl font-black text-slate-800">{count}</p>
                  </div>
              </div>
              <ChevronDown size={20} className={`text-gray-300 transition-transform ${expandedCard === categoryKey ? 'rotate-180' : ''}`} />
          </div>

          {expandedCard === categoryKey && list && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                   {renderList(list)}
              </div>
          )}
      </div>
  );

  // --- VIEW: MANAGE MODE ---
  if (isManageMode) {
      return (
          <div className="flex flex-col gap-5 animate-slide-up pb-24">
              {/* Header */}
              <div className="flex items-center justify-between px-2">
                  <button onClick={() => setIsManageMode(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
                      <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-lg font-extrabold text-slate-800 uppercase tracking-wide">Quản Lý Dữ Liệu</h2>
                  <button onClick={handleResetDB} className="p-2 text-red-400 hover:text-red-600" title="Khôi phục gốc">
                      <RefreshCw size={20} />
                  </button>
              </div>

              {/* Copy Button */}
              <button 
                  onClick={handleCopyData}
                  className="mx-4 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-200 hover:bg-blue-100 active:scale-[0.98] transition-all"
              >
                  <Copy size={18} /> Copy Toàn Bộ Dữ Liệu (JSON)
              </button>

              {/* Summary Lists */}
              <div className="px-4 space-y-3">
                  <SummaryCard 
                      title="Kim Loại (Cố định)" count={fixed.length} icon={Atom} 
                      colorClass="text-blue" categoryKey="fixed" list={fixed}
                  />
                  <SummaryCard 
                      title="Đa Hóa Trị" count={variable.length} icon={Zap} 
                      colorClass="text-orange" categoryKey="variable" list={variable}
                  />
                  <SummaryCard 
                      title="Gốc Axit / Phi kim" count={radicals.length} icon={FlaskConical} 
                      colorClass="text-purple" categoryKey="radicals" list={radicals}
                  />
              </div>

              {/* Quick Add (Bulk) */}
              <div className="px-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Thêm nhanh (Nhiều dòng)</label>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Mỗi dòng 1 chất</span>
                      </div>
                      <div className="flex flex-col gap-2">
                          <textarea 
                              value={quickAddInput}
                              onChange={(e) => setQuickAddInput(e.target.value)}
                              placeholder={`Ba - Bari - II - Kim loại\nCl - Clo - I - Phi kim\nNO3 - Nitrat - I - Gốc axit`}
                              rows={4}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none resize-none font-mono"
                          />
                           <p className="text-[10px] text-gray-400 italic">
                              Cú pháp: Ký hiệu - Tên - Hóa trị - Loại (tùy chọn) - Ghi chú
                          </p>
                          <button 
                              onClick={parseAndAdd}
                              disabled={!quickAddInput.trim()}
                              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                          >
                              <Upload size={18} /> Thêm Vào CSDL
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- VIEW: SEARCH MODE (DEFAULT) ---
  
  // Strict Search Logic (Enhanced)
  let results: ChemicalComponent[] = [];
  if (input.trim()) {
      const searchKey = normalize(input);
      
      results = data.filter(c => {
        const s = normalize(c.symbol);
        const n = normalize(c.name);
        if (s.startsWith(searchKey)) return true;
        if (n.startsWith(searchKey)) return true;
        if (n.includes(` ${searchKey}`)) return true;
        return false;
      });

      results.sort((a, b) => {
          const sKey = normalize(input);
          const aSym = normalize(a.symbol);
          const bSym = normalize(b.symbol);
          if (aSym === sKey && bSym !== sKey) return -1;
          if (bSym === sKey && aSym !== sKey) return 1;
          return aSym.length - bSym.length;
      });
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-24 relative min-h-[60vh]">
      
      {/* Top Bar */}
      <div className="flex justify-end px-4 mt-2">
          <button 
             onClick={() => setIsManageMode(true)}
             className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
              <BookOpen size={14} /> Danh Sách
          </button>
      </div>

      {/* Main Search */}
      <div className="px-4">
        <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="🔍 Tra cứu (VD: Fe, Sắt...)"
              className="w-full pl-5 pr-12 py-4 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-xl font-bold shadow-sm transition-all placeholder:text-gray-300"
              autoFocus
            />
            {input && (
                <button 
                    onClick={() => setInput('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300"
                >
                    <X size={16} />
                </button>
            )}
        </div>
      </div>

      {/* Results */}
      <div className="px-4">
        {input.trim() ? (
            <>
                <div className="flex justify-between items-center mb-2 ml-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">Kết quả ({results.length})</span>
                </div>
                {results.length > 0 ? renderList(results) : (
                    <div className="text-center py-10 opacity-50 bg-gray-50 rounded-2xl border-2 border-dashed">
                        <p>Không tìm thấy chất nào.</p>
                    </div>
                )}
            </>
        ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-30 pointer-events-none select-none">
                <Atom size={64} className="text-gray-300 mb-4" />
                <p className="text-lg font-bold text-gray-400">Nhập tên chất để bắt đầu</p>
            </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-[2px] p-0 md:p-4 animate-fade-in">
              <div className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-3xl shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] flex flex-col">
                  {/* Modal Header (Color Coded by Type) */}
                  <div className={`p-6 pb-8 relative flex flex-col items-center justify-center ${
                      selectedItem.type === ElementType.ACID_RADICAL ? 'bg-purple-100' :
                      selectedItem.type === ElementType.NON_METAL ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                      <button 
                          onClick={() => setSelectedItem(null)}
                          className="absolute right-4 top-4 p-2 bg-white/50 rounded-full hover:bg-white transition-colors"
                      >
                          <X size={20} className="text-gray-600"/>
                      </button>

                      <div className="text-6xl font-black text-slate-800 mb-2 tracking-tight">
                          {selectedItem.symbol}
                      </div>
                      <div className="text-2xl font-bold text-slate-700">{selectedItem.name}</div>
                      
                      {/* Floating Valence Badge */}
                      <div className="absolute -bottom-6 bg-yellow-400 text-yellow-900 font-black text-3xl w-16 h-16 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg rotate-12">
                          {selectedItem.valence}
                      </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 pt-10 space-y-4 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                              <div className="text-xs text-gray-400 font-bold uppercase mb-1 flex items-center justify-center gap-1"><Scale size={12}/> Nguyên tử khối</div>
                              <div className="font-bold text-slate-800">{selectedItem.atomicMass || '?'}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                              <div className="text-xs text-gray-400 font-bold uppercase mb-1 flex items-center justify-center gap-1"><Info size={12}/> Phân loại</div>
                              <div className="font-bold text-slate-800">{selectedItem.type}</div>
                          </div>
                      </div>

                      {/* Note Section - Highlighted if exists */}
                      {selectedItem.note ? (
                          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                              <div className="font-bold text-yellow-700 mb-1 flex items-center gap-2">
                                  <span>💡 Lưu ý quan trọng</span>
                              </div>
                              <p className="text-slate-700 text-sm leading-relaxed">
                                  {selectedItem.note}
                              </p>
                          </div>
                      ) : (
                          <p className="text-center text-gray-400 text-xs italic">Không có ghi chú thêm.</p>
                      )}
                      
                      <button 
                          onClick={() => setSelectedItem(null)}
                          className="w-full py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                          Đóng
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};