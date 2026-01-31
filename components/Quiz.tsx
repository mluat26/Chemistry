import React, { useState, useEffect } from 'react';
import { generateQuizQuestion } from '../services/geminiService';
import { QuizQuestion } from '../types';
import { BrainCircuit, RefreshCw, Trophy } from 'lucide-react';

export const Quiz: React.FC = () => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNewQuestion = async () => {
    setLoading(true);
    setIsRevealed(false);
    setSelectedAnswer(null);
    // Random topics
    const topics = ["hóa trị", "oxit", "axit", "bazơ", "muối", "nhận biết chất"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const q = await generateQuizQuestion(randomTopic);
    setQuestion(q);
    setLoading(false);
  };

  useEffect(() => {
    loadNewQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (index: number) => {
    if (isRevealed) return;
    setSelectedAnswer(index);
    setIsRevealed(true);
    if (index === question?.correctAnswer) {
      setScore(s => s + 10);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-orange-600 flex items-center gap-2">
            <BrainCircuit /> Đố Vui Hóa Học
        </h2>
        <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Điểm: {score}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 animate-pulse">
          <BrainCircuit className="w-16 h-16 mb-4 opacity-50" />
          <p>Đang suy nghĩ câu hỏi hay...</p>
        </div>
      ) : question ? (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
          <div className="bg-orange-50 p-6 border-b border-orange-100">
            <h3 className="text-xl font-bold text-gray-800 leading-relaxed">{question.question}</h3>
          </div>
          
          <div className="p-6 space-y-3">
            {question.options.map((option, idx) => {
              let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-lg ";
              
              if (isRevealed) {
                if (idx === question.correctAnswer) {
                  btnClass += "bg-green-100 border-green-500 text-green-800";
                } else if (idx === selectedAnswer) {
                   btnClass += "bg-red-100 border-red-500 text-red-800";
                } else {
                   btnClass += "bg-gray-50 border-transparent opacity-50";
                }
              } else {
                 btnClass += "bg-white border-gray-100 hover:border-orange-300 hover:bg-orange-50 cursor-pointer active:scale-[0.99]";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={btnClass}
                  disabled={isRevealed}
                >
                  <span className="inline-block w-8 h-8 rounded-full bg-white border text-center leading-7 text-sm font-bold text-gray-500 mr-3 shadow-sm">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          {isRevealed && (
            <div className="p-6 bg-blue-50 border-t border-blue-100 animate-fade-in">
              <p className="font-bold text-blue-800 mb-1">💡 Giải thích:</p>
              <p className="text-blue-900">{question.explanation}</p>
              <button 
                onClick={loadNewQuestion}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" /> Câu tiếp theo
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-red-500">
            Không tải được câu hỏi. Kiểm tra kết nối mạng.
            <button onClick={loadNewQuestion} className="block mx-auto mt-4 text-blue-500 underline">Thử lại</button>
        </div>
      )}
    </div>
  );
};
