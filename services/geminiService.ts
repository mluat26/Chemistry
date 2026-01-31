import { QuizQuestion } from '../types';
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

// --- CUSTOM API HANDLER ---

const getApiConfig = () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || '';
    const endpoint = localStorage.getItem('CUSTOM_API_ENDPOINT') || 'https://api.deepseek.com/chat/completions'; 
    const model = localStorage.getItem('CUSTOM_API_MODEL') || 'deepseek-chat';
    return { apiKey, endpoint, model };
};

export const solveHomework = async (question: string, imageBase64?: string): Promise<string> => {
    const { apiKey, endpoint, model } = getApiConfig();

    if (!apiKey) {
         return "⚠️ Em chưa nhập API Key. Hãy vào Cài đặt (⚙️) để nhập Key của DeepSeek nhé!";
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
            // Handle Billing & Auth Errors
            if (response.status === 402) {
                return "⚠️ **Hết tín dụng (402):** Tài khoản DeepSeek/OpenAI của bạn đã hết số dư. Vui lòng nạp thêm hoặc xóa API Key để dùng chế độ Offline.";
            }
            if (response.status === 401) {
                return "⚠️ **Lỗi xác thực (401):** API Key không chính xác hoặc đã bị vô hiệu hóa.";
            }
            if (response.status === 429) {
                return "⚠️ **Quá tải (429):** Hệ thống đang bận, vui lòng thử lại sau giây lát.";
            }

            const errText = await response.text();
            throw new Error(`Status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "Không đọc được phản hồi từ AI.";
        
        return reply;

    } catch (error: any) {
        console.error("API Call Error", error);
        return `Lỗi kết nối: ${error.message}. Hãy kiểm tra mạng hoặc API Key nhé!`;
    }
};

// --- LOCAL FALLBACKS & QUIZ GENERATION ---

export const generateQuizQuestion = async (_topic: string): Promise<QuizQuestion> => {
    // Local Logic (Fast & Offline)
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
    const { apiKey, endpoint, model } = getApiConfig();

    if (!apiKey) throw new Error("No API Key provided");

    const prompt = `Tạo 1 câu hỏi trắc nghiệm khách quan (4 lựa chọn) về tính chất hóa học, ứng dụng hoặc điều chế của chất: ${compoundName} (Hóa học lớp 9).
    Định dạng trả về JSON thuần túy (không markdown):
    {
      "question": "Nội dung câu hỏi?",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correctAnswer": 0, // Số nguyên 0-3 tương ứng A-D
      "explanation": "Giải thích ngắn gọn."
    }`;

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
                temperature: 0.7
            })
        });

        if (!response.ok) {
            if (response.status === 402) throw new Error("Insufficient Balance");
            throw new Error(`API Status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        
        // Sanitize JSON string
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(jsonStr);

    } catch (e) {
        console.error("AI Quiz Gen Error", e);
        throw e;
    }
};

export const checkFormulaWithAI = async (_cation: string, _anion: string, _userFormula: string): Promise<string> => {
    return "Hãy nhớ quy tắc chéo: Hóa trị chất này là chỉ số chất kia!";
};