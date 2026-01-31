import { QuizQuestion, ChemicalComponent, ElementType, Valence } from '../types';
import { COMMON_COMPONENTS } from '../constants';

// --- HELPER: FORMAT FORMULA ---
export const toSubscript = (text: string | number | undefined | null) => {
    if (text === undefined || text === null || text === '') return '';
    const str = String(text);
    
    const subscriptMap: Record<string, string> = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        '+': '⁺', '-': '⁻'
    };

    return str.replace(/([a-zA-Z\)])(\d+)/g, (_, char, numStr) => {
        const subNums = numStr.split('').map((n: string) => subscriptMap[n] || n).join('');
        return `${char}${subNums}`;
    });
};

// --- USAGE TRACKING ---

export interface UsageStats {
    totalRequests: number;
    totalTokens: number;
    modelStats: Record<string, { requests: number, tokens: number }>;
}

export const getUsageStats = (): UsageStats => {
    const raw = localStorage.getItem('GEMINI_USAGE_STATS');
    if (!raw) return { totalRequests: 0, totalTokens: 0, modelStats: {} };
    try {
        return JSON.parse(raw);
    } catch {
        return { totalRequests: 0, totalTokens: 0, modelStats: {} };
    }
};

const trackUsage = (model: string, usage: { prompt_tokens: number, completion_tokens: number, total_tokens: number } | undefined) => {
    if (!usage) return;
    
    const stats = getUsageStats();
    const modelKey = model || 'unknown';

    // Update Global
    stats.totalRequests += 1;
    stats.totalTokens += usage.total_tokens;

    // Update Model Specific
    if (!stats.modelStats[modelKey]) {
        stats.modelStats[modelKey] = { requests: 0, tokens: 0 };
    }
    stats.modelStats[modelKey].requests += 1;
    stats.modelStats[modelKey].tokens += usage.total_tokens;

    localStorage.setItem('GEMINI_USAGE_STATS', JSON.stringify(stats));
};

// --- CUSTOM API HANDLER ---

const getApiConfig = () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || '';
    const endpoint = localStorage.getItem('CUSTOM_API_ENDPOINT') || 'https://api.deepseek.com/chat/completions'; 
    const model = localStorage.getItem('CUSTOM_API_MODEL') || 'deepseek-chat';
    return { apiKey, endpoint, model };
};

// Return type changed to include usage info
export const solveHomework = async (question: string, imageBase64?: string): Promise<{ text: string, usage: number }> => {
    const { apiKey, endpoint, model } = getApiConfig();

    if (!apiKey) {
         return { text: "⚠️ Em chưa nhập API Key. Hãy vào Cài đặt (⚙️) để nhập Key của DeepSeek nhé!", usage: 0 };
    }

    try {
        const customPrompt = localStorage.getItem('GEMINI_CUSTOM_PROMPT') || '';
        
        const messages = [
            {
                role: "system",
                content: `Bạn là Gia sư Hóa Học lớp 9 thân thiện. 
                ${customPrompt}
                QUY TẮC:
                1. Trả lời ngắn gọn, đúng trọng tâm.
                2. KHÔNG dùng Markdown code block. Dùng thẻ <b>...</b> để in đậm.
                3. Viết công thức hóa học bình thường (H2O, Al4C3), ứng dụng sẽ tự chuyển thành số nhỏ.
                4. Giọng điệu khích lệ.`
            },
            {
                role: "user",
                content: question
            }
        ];

        if (imageBase64) {
             messages[1].content += "\n[Lưu ý: Người dùng có gửi kèm ảnh nhưng hệ thống này chỉ hỗ trợ văn bản.]";
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model, 
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            if (response.status === 402) return { text: "⚠️ **Hết tín dụng (402)**.", usage: 0 };
            if (response.status === 401) return { text: "⚠️ **Lỗi xác thực (401)**.", usage: 0 };
            throw new Error(`Status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "Không đọc được phản hồi từ AI.";
        
        // Track Usage
        const usageData = data.usage || { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 };
        trackUsage(model, usageData);

        return { text: reply, usage: usageData.total_tokens };

    } catch (error: any) {
        console.error("API Call Error", error);
        return { text: `Lỗi kết nối: ${error.message}.`, usage: 0 };
    }
};

// --- LOCAL FALLBACKS & QUIZ GENERATION ---

export const generateQuizQuestion = async (_topic: string): Promise<QuizQuestion> => {
    // Local Logic (Fast & Offline) - No Usage Tracking needed
    await new Promise(r => setTimeout(r, 400));
    const item = COMMON_COMPONENTS[Math.floor(Math.random() * COMMON_COMPONENTS.length)];
    const isAskSymbol = Math.random() > 0.5;

    if (isAskSymbol) {
        return {
            question: `Ký hiệu hóa học của "${item.name}" là gì?`,
            options: generateOptions(item.symbol, COMMON_COMPONENTS.map(c => c.symbol)),
            correctAnswer: 0,
            explanation: `Ký hiệu của ${item.name} là ${toSubscript(item.symbol)}.`
        };
    } else {
         return {
            question: `Hóa trị của ${item.name} (${toSubscript(item.symbol)}) là bao nhiêu?`,
            options: generateOptions(String(item.valence), ['I', 'II', 'III', 'IV', 'V', 'VI']),
            correctAnswer: 0,
            explanation: `${item.name} thường có hóa trị ${item.valence}.`
        };
    }
};

function generateOptions(correct: string, pool: string[]): string[] {
    const wrong = pool.filter(x => x !== correct);
    const selectedWrong = wrong.sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [correct, ...selectedWrong].sort(() => 0.5 - Math.random());
    return options;
}

export const generateOrganicPractice = async (compoundName: string): Promise<QuizQuestion> => {
    // This function was removed from UI but kept in service just in case. 
    // If used, it should also be updated to track usage.
    return {
        question: "Placeholder",
        options: ["A", "B", "C", "D"],
        correctAnswer: 0,
        explanation: "Placeholder"
    }
};

export const checkFormulaWithAI = async (_cation: string, _anion: string, _userFormula: string): Promise<string> => {
    return "Hãy nhớ quy tắc chéo: Hóa trị chất này là chỉ số chất kia!";
};

// --- AI AUTO-ADD SUBSTANCE ---
// Return type changed to include usage
export const lookupChemicalWithAI = async (query: string): Promise<{ data: ChemicalComponent | null, usage: number }> => {
    const { apiKey, endpoint, model } = getApiConfig();
    if (!apiKey) return { data: null, usage: 0 };

    const prompt = `JSON only. Chemical info for '${query}'.
    Format:
    {
      "symbol": "string (e.g. Fe)",
      "name": "string (e.g. Sắt)",
      "valence": "string (I, II, III, IV, V, VI)",
      "type": "string (Kim loại | Phi kim | Gốc axit | Hydro | Nhóm OH)",
      "atomicMass": number,
      "note": "string or null (very short)"
    }
    If unknown/invalid, return null.`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1
            })
        });

        if (!response.ok) return { data: null, usage: 0 };

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Track usage
        const usageData = data.usage || { total_tokens: 0 };
        trackUsage(model, usageData);
        
        if (jsonStr === 'null' || !jsonStr) return { data: null, usage: usageData.total_tokens };

        const result = JSON.parse(jsonStr);
        
        // Validate Valence Enum
        let v = result.valence as Valence;
        if (!Object.values(Valence).includes(v)) v = Valence.I; 

        // Validate Type Enum
        let t = result.type as ElementType;
        const validTypes = Object.values(ElementType);
        if (!validTypes.includes(t)) t = ElementType.NON_METAL; 

        return {
            data: {
                symbol: result.symbol,
                name: result.name,
                valence: v,
                type: t,
                atomicMass: result.atomicMass,
                note: result.note || undefined
            },
            usage: usageData.total_tokens
        };

    } catch (e) {
        console.error("AI Lookup Error", e);
        return { data: null, usage: 0 };
    }
};