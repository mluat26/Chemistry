export enum Valence {
  I = 'I',
  II = 'II',
  III = 'III',
  IV = 'IV',
  V = 'V',
  VI = 'VI',
}

export enum ElementType {
  METAL = 'Kim loại',
  NON_METAL = 'Phi kim',
  ACID_RADICAL = 'Gốc axit',
  HYDROGEN = 'Hydro',
  OH = 'Nhóm OH',
}

export interface ChemicalComponent {
  id?: string; // Added for IndexedDB unique key
  symbol: string;
  name: string;
  valence: Valence;
  type: ElementType;
  atomicMass?: number;
  note?: string;
}

// Organic Chemistry Types
export type ReactionAction = 'Cộng' | 'Thế' | 'Cháy' | 'Oxi hóa' | 'Trùng hợp' | 'Este hóa' | 'Tác dụng Axit/Bazơ' | 'Lên men' | 'Thủy phân' | 'Xà phòng hóa';

export interface OrganicReaction {
  action: ReactionAction;
  reagent: string;      // Tác nhân (ví dụ: + Cl2, + O2)
  condition?: string;   // Điều kiện (ví dụ: ánh sáng, t độ)
  equation: string;     // Phương trình
  description: string;  // Giải thích đơn giản
  productName?: string; // Tên sản phẩm chính (cho phần đố vui)
}

export interface OrganicCompound {
  id: string;
  name: string;
  formula: string;
  class: string; // Hidrocacbon, Dẫn xuất...
  preparation?: string; // Điều chế (Mới thêm)
  reactions: OrganicReaction[];
}

export type ViewState = 'TABLE' | 'ORGANIC' | 'AI_TUTOR';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}