import React, { useState, useRef, useEffect } from 'react';
import { solveHomework, toSubscript } from '../services/geminiService';
import { Send, Mic, StopCircle, Camera, Bot, X, Sparkles, Zap } from 'lucide-react';

const SUGGESTIONS = [
    "Cân bằng: Fe + O2 -> ?",
    "Tính chất của Axit Axetic",
    "Nhận biết 3 lọ mất nhãn",
    "Điều chế khí Metan",
    "Công thức tính số mol"
];

export const AITutor: React.FC = () => {
    // Add 'usage' field to messages state
    const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string, image?: string, usage?: number}[]>([
        { 
            role: 'ai', 
            content: "Chào em! <b>Gia sư Hóa</b> đây.\n\nThầy có thể giúp em cân bằng phương trình, giải bài tập hoặc giải thích lý thuyết. Thầy sử dụng API riêng của em nhé!" 
        }
    ]);
    const [input, setInput] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if ((!textToSend.trim() && !image) || isLoading) return;

        const userMsg = { role: 'user' as const, content: textToSend, image: image || undefined };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setImage(null);
        setIsLoading(true);

        const response = await solveHomework(userMsg.content || "Giải thích ảnh này giúp em", userMsg.image);
        
        setMessages(prev => [...prev, { 
            role: 'ai', 
            content: response.text, 
            usage: response.usage 
        }]);
        setIsLoading(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Trình duyệt không hỗ trợ giọng nói.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev ? prev + ' ' + transcript : transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => { 
            console.error(event.error); 
            setIsListening(false);
        };
        recognition.onend = () => { setIsListening(false); };
        recognition.start();
    };

    // --- SAFE HTML RENDERER ---
    
    const parseInline = (text: string) => {
        let cleanText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '$1');
        cleanText = toSubscript(cleanText);

        const parts = cleanText.split(/(<b>.*?<\/b>)/g);
        
        return parts.map((part, index) => {
            if (part.startsWith('<b>') && part.endsWith('</b>')) {
                return <strong key={index} className="font-bold text-indigo-700">{part.slice(3, -4)}</strong>;
            }
            return part;
        });
    };

    const SafeHTML = ({ content }: { content: string }) => {
        if (!content) return null;

        const lines = content.split('\n');

        return (
            <div className="text-slate-800 text-sm leading-relaxed">
                {lines.map((line, lineIdx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={lineIdx} className="h-2" />;
                    
                    const isEquation = (trimmed.includes('→') || trimmed.includes('->')) && trimmed.length < 100;

                    if (isEquation) {
                         return (
                            <div key={lineIdx} className="my-2 px-2 py-2 bg-blue-50 border border-blue-100 rounded-lg text-center font-bold text-blue-900 text-base overflow-x-auto shadow-sm whitespace-nowrap scrollbar-hide max-w-full">
                                {parseInline(trimmed)}
                            </div>
                        );
                    }

                    return (
                        <div key={lineIdx} className="min-h-[1.5em] break-words">
                            {parseInline(line)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-135px)] animate-fade-in relative bg-white overflow-hidden">
             
             {/* Chat List */}
             <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 pb-36 space-y-6 scroll-smooth bg-white">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up items-end group`}>
                        {msg.role === 'ai' && (
                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white shadow-sm mr-2 mb-4 shrink-0">
                                 <Bot size={18} />
                             </div>
                        )}
                        
                        <div className={`relative max-w-[85%] p-3 shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none' 
                            : 'bg-gray-50 text-slate-800 rounded-2xl rounded-bl-none border border-gray-100'
                        }`}>
                            {msg.image && (
                                <div className="mb-2 overflow-hidden rounded-xl bg-black/5">
                                    <img src={msg.image} alt="Upload" className="max-w-full h-auto object-contain max-h-[200px]" />
                                </div>
                            )}
                            
                            <div className={msg.role === 'user' ? 'text-white text-sm' : ''}>
                                {msg.role === 'ai' 
                                    ? <SafeHTML content={msg.content} /> 
                                    : msg.content
                                }
                            </div>

                            {/* Token Usage Indicator */}
                            {msg.role === 'ai' && msg.usage && (
                                <div className="absolute -bottom-5 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Zap size={10} className="text-orange-400 fill-orange-400" />
                                    <span className="text-[10px] text-gray-400 font-mono font-bold">{msg.usage} tokens</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start animate-pulse pl-10">
                         <div className="bg-gray-50 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2 border border-gray-100">
                           <span className="text-xs font-bold text-gray-400">AI đang suy nghĩ</span>
                           <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
             </div>

             {/* Input Area + Suggestions */}
             <div className="absolute bottom-0 left-0 w-full bg-white z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                 
                 {!isLoading && (
                     <div className="w-full overflow-x-auto px-4 pb-2 pt-2 flex gap-2 scrollbar-hide bg-white/95 backdrop-blur-sm">
                         {SUGGESTIONS.map((s, i) => (
                             <button
                                key={i}
                                onClick={() => handleSend(s)}
                                className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 hover:bg-indigo-100 active:scale-95 transition-all shadow-sm"
                             >
                                 <Sparkles size={12} className="text-indigo-400" /> {s}
                             </button>
                         ))}
                     </div>
                 )}

                 <div className="p-3 border-t border-gray-100 bg-white pb-6 md:pb-3">
                    {image && (
                        <div className="absolute bottom-full left-4 mb-2 flex items-center gap-3 p-2 bg-white rounded-xl shadow-lg border border-indigo-100 animate-slide-up">
                            <img src={image} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
                            <button onClick={() => setImage(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-end gap-2 bg-gray-50 p-1.5 rounded-3xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
                        <div className="flex gap-0.5">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:bg-white hover:text-indigo-600 transition-colors"
                                title="Gửi ảnh"
                            >
                                <Camera size={20} />
                            </button>
                            <button 
                                onClick={toggleListening}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                                    isListening 
                                    ? 'bg-red-100 text-red-500 animate-pulse' 
                                    : 'text-gray-400 hover:bg-white hover:text-indigo-600'
                                }`}
                                title="Nhập bằng giọng nói"
                            >
                                {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
                            </button>
                        </div>

                        <input 
                            type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment"
                            onChange={handleImageUpload}
                        />
                        
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Nhập câu hỏi hóa học..."
                            className="flex-1 bg-transparent outline-none resize-none max-h-24 py-2.5 text-slate-800 placeholder:text-gray-400 text-sm leading-relaxed"
                            rows={1}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                            }}
                        />

                        <button 
                            onClick={() => handleSend()}
                            disabled={!input.trim() && !image}
                            className={`w-10 h-10 flex items-center justify-center rounded-full mb-0.5 transition-all ${
                                (!input.trim() && !image) 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95'
                            }`}
                        >
                            <Send size={18} className={(!input.trim() && !image) ? "" : "ml-0.5"} />
                        </button>
                    </div>
                 </div>
             </div>
        </div>
    );
};