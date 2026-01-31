import React, { useState } from 'react';
import { COMMON_COMPONENTS, getValenceNumber } from '../constants';
import { ChemicalComponent, ElementType } from '../types';
import { checkFormulaWithAI } from '../services/geminiService';
import { ArrowRight, Check, RotateCcw } from 'lucide-react';

export const CompoundBuilder: React.FC = () => {
  const [cation, setCation] = useState<ChemicalComponent | null>(null);
  const [anion, setAnion] = useState<ChemicalComponent | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter lists
  const cations = COMMON_COMPONENTS.filter(c => 
    c.type === ElementType.METAL || c.type === ElementType.HYDROGEN
  );
  const anions = COMMON_COMPONENTS.filter(c => 
    c.type === ElementType.ACID_RADICAL || c.type === ElementType.OH || c.type === ElementType.NON_METAL
  );

  const correctFormula = (() => {
    if (!cation || !anion) return '';
    const v1 = getValenceNumber(cation.valence);
    const v2 = getValenceNumber(anion.valence);
    
    // Simplify
    const gcd = (a: number, b: number): number => (!b ? a : gcd(b, a % b));
    const divisor = gcd(v1, v2);
    const idx1 = v2 / divisor;
    const idx2 = v1 / divisor;

    let f = cation.symbol;
    if (idx1 > 1) f += idx1;
    
    if (idx2 > 1) {
      // Logic: polyatomic radicals need parens
      const needsParens = ['SO4', 'NO3', 'OH', 'CO3', 'PO4', 'CH3COO'].includes(anion.symbol);
      f += needsParens ? `(${anion.symbol})${idx2}` : `${anion.symbol}${idx2}`;
    } else {
      f += anion.symbol;
    }
    return f;
  })();

  const handleCheck = async () => {
    if (!cation || !anion) return;
    if (!userAnswer.trim()) {
        setFeedback("Hãy nhập công thức trước nhé!");
        setIsCorrect(false);
        return;
    }

    if (userAnswer.trim() === correctFormula) {
      setIsCorrect(true);
      setFeedback(`Chính xác! ${cation.symbol} hóa trị ${cation.valence} và ${anion.symbol} hóa trị ${anion.valence}.`);
    } else {
      setIsCorrect(false);
      setIsLoading(true);
      const aiResponse = await checkFormulaWithAI(
          `${cation.name}`, 
          `${anion.name}`, 
          userAnswer
      );
      setFeedback(aiResponse);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCation(null);
    setAnion(null);
    setUserAnswer('');
    setFeedback(null);
    setIsCorrect(null);
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="text-center">
         <h2 className="text-2xl font-bold text-slate-800">Ghép Chất</h2>
         <p className="text-slate-500 text-sm">Chọn 2 thành phần để tạo công thức</p>
       </div>

       {/* Selection Area - Linear */}
       <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <select 
             className="flex-1 p-3 bg-purple-50 text-purple-900 rounded-lg font-bold outline-none appearance-none cursor-pointer"
             value={cation?.symbol || ''}
             onChange={(e) => {
                 setCation(cations.find(x => x.symbol === e.target.value) || null);
                 setFeedback(null); setIsCorrect(null);
             }}
          >
             <option value="">(+) Chọn</option>
             {cations.map(c => <option key={c.symbol+c.valence} value={c.symbol}>{c.symbol} ({c.valence})</option>)}
          </select>

          <span className="text-gray-400 font-bold">+</span>

          <select 
             className="flex-1 p-3 bg-pink-50 text-pink-900 rounded-lg font-bold outline-none appearance-none cursor-pointer"
             value={anion?.symbol || ''}
             onChange={(e) => {
                setAnion(anions.find(x => x.symbol === e.target.value) || null);
                setFeedback(null); setIsCorrect(null);
             }}
          >
             <option value="">(-) Chọn</option>
             {anions.map(a => <option key={a.symbol+a.valence} value={a.symbol}>{a.symbol} ({a.valence})</option>)}
          </select>
       </div>

       {/* Result Area */}
       <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-2 border-indigo-50 shadow-sm">
          <div className="flex items-center gap-3 w-full mb-4">
             <ArrowRight className="text-gray-400" />
             <input
               type="text"
               value={userAnswer}
               onChange={(e) => setUserAnswer(e.target.value)}
               placeholder="Nhập kết quả..."
               className="flex-1 text-2xl font-bold p-3 border-b-2 border-indigo-200 outline-none uppercase text-center focus:border-indigo-600 transition-colors"
             />
          </div>

          <div className="flex w-full gap-2">
            <button
                onClick={handleCheck}
                disabled={!cation || !anion || isLoading}
                className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 ${
                    !cation || !anion ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
             >
                {isLoading ? 'Đang chấm...' : <><Check size={18} /> Kiểm tra</>}
             </button>
             
             {isCorrect !== null && (
                 <button onClick={handleReset} className="p-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200">
                    <RotateCcw size={20} />
                 </button>
             )}
          </div>
       </div>

       {/* Feedback */}
       {feedback && (
         <div className={`p-4 rounded-xl border text-sm leading-relaxed ${
           isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
         }`}>
           <strong>{isCorrect ? 'Tuyệt vời!' : 'Lưu ý:'}</strong> {feedback}
         </div>
       )}
    </div>
  );
};
