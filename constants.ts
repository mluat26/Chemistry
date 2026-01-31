import { ChemicalComponent, ElementType, Valence, OrganicCompound } from './types';

export const COMMON_COMPONENTS: ChemicalComponent[] = [
  // --- KIM LOẠI ---
  { symbol: 'H', name: 'Hydro', valence: Valence.I, type: ElementType.HYDROGEN, atomicMass: 1 },
  { symbol: 'Na', name: 'Natri', valence: Valence.I, type: ElementType.METAL, atomicMass: 23 },
  { symbol: 'K', name: 'Kali', valence: Valence.I, type: ElementType.METAL, atomicMass: 39 },
  { symbol: 'Ag', name: 'Bạc', valence: Valence.I, type: ElementType.METAL, atomicMass: 108 },
  { symbol: 'Cu', name: 'Đồng', valence: Valence.II, type: ElementType.METAL, atomicMass: 64, note: "Phổ biến nhất. Cu(I) rất ít gặp." },
  { symbol: 'Fe', name: 'Sắt (II)', valence: Valence.II, type: ElementType.METAL, atomicMass: 56, note: "Trong hợp chất như: FeO, FeSO4, FeCl2..." },
  { symbol: 'Fe', name: 'Sắt (III)', valence: Valence.III, type: ElementType.METAL, atomicMass: 56, note: "Trong hợp chất như: Fe2O3, Fe2(SO4)3, FeCl3..." },
  { symbol: 'Mg', name: 'Magie', valence: Valence.II, type: ElementType.METAL, atomicMass: 24 },
  { symbol: 'Ca', name: 'Canxi', valence: Valence.II, type: ElementType.METAL, atomicMass: 40 },
  { symbol: 'Ba', name: 'Bari', valence: Valence.II, type: ElementType.METAL, atomicMass: 137 },
  { symbol: 'Zn', name: 'Kẽm', valence: Valence.II, type: ElementType.METAL, atomicMass: 65 },
  { symbol: 'Pb', name: 'Chì', valence: Valence.II, type: ElementType.METAL, atomicMass: 207 },
  { symbol: 'Al', name: 'Nhôm', valence: Valence.III, type: ElementType.METAL, atomicMass: 27 },

  // --- PHI KIM ---
  { symbol: 'S', name: 'Lưu huỳnh (II)', valence: Valence.II, type: ElementType.NON_METAL, atomicMass: 32, note: "Trong muối Sunfua (H2S, Na2S) hoặc Sắt pirit (FeS2)." },
  { symbol: 'S', name: 'Lưu huỳnh (IV)', valence: Valence.IV, type: ElementType.NON_METAL, atomicMass: 32, note: "Trong oxit SO2 hoặc muối Sunfit." },
  { symbol: 'S', name: 'Lưu huỳnh (VI)', valence: Valence.VI, type: ElementType.NON_METAL, atomicMass: 32, note: "Trong oxit SO3 hoặc Axit Sunfuric (H2SO4)." },
  { symbol: 'C', name: 'Cacbon (IV)', valence: Valence.IV, type: ElementType.NON_METAL, atomicMass: 12, note: "Phổ biến trong CO2, CaCO3. (CO là hóa trị II)" },
  { symbol: 'N', name: 'Nitơ', valence: Valence.III, type: ElementType.NON_METAL, atomicMass: 14, note: "Trong NH3. Nitơ còn có hóa trị I, II, IV, V trong các oxit." },
  { symbol: 'P', name: 'Photpho (V)', valence: Valence.V, type: ElementType.NON_METAL, atomicMass: 31, note: "Trong P2O5, Axit Photphoric." },

  // --- GỐC AXIT ---
  { symbol: 'OH', name: 'Hidroxit', valence: Valence.I, type: ElementType.OH, atomicMass: 17 },
  { symbol: 'Cl', name: 'Clorua', valence: Valence.I, type: ElementType.ACID_RADICAL, atomicMass: 35.5 },
  { symbol: 'NO3', name: 'Nitrat', valence: Valence.I, type: ElementType.ACID_RADICAL, atomicMass: 62 },
  { symbol: 'CH3COO', name: 'Axetat', valence: Valence.I, type: ElementType.ACID_RADICAL, atomicMass: 59 },
  { symbol: 'SO4', name: 'Sunfat', valence: Valence.II, type: ElementType.ACID_RADICAL, atomicMass: 96 },
  { symbol: 'CO3', name: 'Cacbonat', valence: Valence.II, type: ElementType.ACID_RADICAL, atomicMass: 60 },
  { symbol: 'SO3', name: 'Sunfit', valence: Valence.II, type: ElementType.ACID_RADICAL, atomicMass: 80 },
  { symbol: 'PO4', name: 'Photphat', valence: Valence.III, type: ElementType.ACID_RADICAL, atomicMass: 95 },
  { symbol: 'S', name: 'Sunfua', valence: Valence.II, type: ElementType.ACID_RADICAL, atomicMass: 32, note: "Gốc axit của H2S" },
  { symbol: 'O', name: 'Oxit', valence: Valence.II, type: ElementType.NON_METAL, atomicMass: 16 },
];

export const ORGANIC_DATA: OrganicCompound[] = [
  {
    id: 'CH4',
    name: 'Metan',
    formula: 'CH₄',
    class: 'Hidrocacbon (No)',
    preparation: 'Đun nóng Natri axetat với vôi tôi xút: CH₃COONa + NaOH → CH₄ + Na₂CO₃ (CaO, t°)',
    reactions: [
      {
        action: 'Cháy',
        reagent: '+ O₂',
        condition: 't°',
        equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
        description: 'Metan cháy tạo ra khí Cacbonic và nước, tỏa nhiều nhiệt.'
      },
      {
        action: 'Thế',
        reagent: '+ Cl₂',
        condition: 'Ánh sáng',
        equation: 'CH₄ + Cl₂ → CH₃Cl + HCl',
        description: 'Clo thế chỗ 1 nguyên tử Hydro. Đây là phản ứng đặc trưng của liên kết đơn.'
      }
    ]
  },
  {
    id: 'C2H4',
    name: 'Etilen',
    formula: 'C₂H₄',
    class: 'Hidrocacbon (Không no)',
    preparation: 'Tách nước từ Rượu Etylic: C₂H₅OH → C₂H₄ + H₂O (H₂SO₄ đặc, 170°C)',
    reactions: [
      {
        action: 'Cộng',
        reagent: '+ Br₂ (dd)',
        condition: '',
        equation: 'C₂H₄ + Br₂ → C₂H₄Br₂',
        description: 'Làm mất màu dung dịch Brom màu da cam. Đặc trưng của liên kết đôi.'
      },
      {
        action: 'Trùng hợp',
        reagent: 'Xúc tác, P',
        condition: 't°',
        equation: 'nCH₂=CH₂ → (-CH₂-CH₂-)n',
        description: 'Các phân tử Etilen nối đuôi nhau tạo thành nhựa PE (Polietilen).'
      },
      {
        action: 'Cháy',
        reagent: '+ O₂',
        condition: 't°',
        equation: 'C₂H₄ + 3O₂ → 2CO₂ + 2H₂O',
        description: 'Cháy sáng, tỏa nhiệt.'
      }
    ]
  },
  {
    id: 'C2H2',
    name: 'Axetilen',
    formula: 'C₂H₂',
    class: 'Hidrocacbon (Không no)',
    preparation: 'Cho Canxi cacbua (đất đèn) tác dụng với nước: CaC₂ + 2H₂O → C₂H₂ + Ca(OH)₂',
    reactions: [
      {
        action: 'Cộng',
        reagent: '+ 2Br₂ (dd)',
        condition: '',
        equation: 'C₂H₂ + 2Br₂ → C₂H₂Br₄',
        description: 'Làm mất màu Brom tương tự Etilen nhưng cần tỉ lệ 1:2 do có liên kết ba.'
      },
      {
        action: 'Cháy',
        reagent: '+ O₂',
        condition: 't°',
        equation: '2C₂H₂ + 5O₂ → 4CO₂ + 2H₂O',
        description: 'Ngọn lửa Axetilen tỏa nhiệt rất cao (dùng để hàn cắt kim loại).'
      }
    ]
  },
  {
    id: 'C6H6',
    name: 'Benzen',
    formula: 'C₆H₆',
    class: 'Hidrocacbon (Thơm)',
    preparation: 'Trùng hợp Axetilen (ít dùng trong PTN): 3C₂H₂ → C₆H₆ (C, 600°C) hoặc chưng cất nhựa than đá.',
    reactions: [
      {
        action: 'Thế',
        reagent: '+ Br₂ (lỏng)',
        condition: 'Bột Fe, t°',
        equation: 'C₆H₆ + Br₂ → C₆H₅Br + HBr',
        description: 'Benzen thế với Brom lỏng (nguyên chất) tạo Bromobenzen. Không phản ứng với dd Brom.'
      },
      {
        action: 'Cháy',
        reagent: '+ O₂',
        condition: 't°',
        equation: '2C₆H₆ + 15O₂ → 12CO₂ + 6H₂O',
        description: 'Benzen cháy trong không khí sinh ra nhiều muội than.'
      },
      {
        action: 'Cộng',
        reagent: '+ H₂',
        condition: 'Ni, t°',
        equation: 'C₆H₆ + 3H₂ → C₆H₁₂',
        description: 'Phản ứng cộng tạo ra Xiclohexan.'
      }
    ]
  },
  {
    id: 'C2H5OH',
    name: 'Rượu Etylic',
    formula: 'C₂H₅OH',
    class: 'Dẫn xuất (Rượu)',
    preparation: 'Lên men tinh bột hoặc Đường: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ (Men rượu)',
    reactions: [
      {
        action: 'Cháy',
        reagent: '+ O₂',
        condition: 't°',
        equation: 'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O',
        description: 'Rượu cháy với ngọn lửa màu xanh, tỏa nhiều nhiệt.'
      },
      {
        action: 'Thế',
        reagent: '+ Na',
        condition: '',
        equation: '2C₂H₅OH + 2Na → 2C₂H₅ONa + H₂',
        description: 'Natri thế chỗ nguyên tử Hydro trong nhóm -OH, giải phóng khí H₂.'
      },
      {
        action: 'Oxi hóa',
        reagent: '+ O₂',
        condition: 'Men giấm',
        equation: 'C₂H₅OH + O₂ → CH₃COOH + H₂O',
        description: 'Rượu để lâu trong không khí bị chua thành Giấm ăn (Axit Axetic).'
      }
    ]
  },
  {
    id: 'CH3COOH',
    name: 'Axit Axetic',
    formula: 'CH₃COOH',
    class: 'Dẫn xuất (Axit)',
    preparation: 'Oxi hóa rượu etylic bằng men giấm: C₂H₅OH + O₂ → CH₃COOH + H₂O',
    reactions: [
      {
        action: 'Tác dụng Axit/Bazơ',
        reagent: '+ NaOH',
        condition: '',
        equation: 'CH₃COOH + NaOH → CH₃COONa + H₂O',
        description: 'Phản ứng trung hòa tạo muối Axetat.'
      },
      {
        action: 'Tác dụng Axit/Bazơ',
        reagent: '+ CaCO₃',
        condition: '',
        equation: '2CH₃COOH + CaCO₃ → (CH₃COO)₂Ca + CO₂ + H₂O',
        description: 'Axit làm sủi bọt khí CO₂ khi gặp đá vôi (Canxi cacbonat).'
      },
      {
        action: 'Este hóa',
        reagent: '+ C₂H₅OH',
        condition: 'H₂SO₄ đặc, t°',
        equation: 'CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O',
        description: 'Tạo ra Etyl Axetat có mùi thơm (mùi dầu chuối).'
      }
    ]
  },
  {
    id: 'C6H12O6',
    name: 'Glucozơ',
    formula: 'C₆H₁₂O₆',
    class: 'Cacbohidrat',
    preparation: 'Thủy phân tinh bột hoặc xenlulozơ với xúc tác Axit: (-C₆H₁₀O₅-)n + nH₂O → nC₆H₁₂O₆',
    reactions: [
      {
        action: 'Oxi hóa',
        reagent: '+ Ag₂O/NH₃',
        condition: 't° (Tráng gương)',
        equation: 'C₆H₁₂O₆ + Ag₂O → C₆H₁₂O₇ + 2Ag',
        description: 'Phản ứng tráng gương chứng tỏ Glucozơ có nhóm andehit. Tạo lớp bạc bám vào thành ống nghiệm.'
      },
      {
        action: 'Lên men',
        reagent: 'Men rượu',
        condition: '30-32°C',
        equation: 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂',
        description: 'Quá trình lên men tạo ra Rượu etylic và khí CO₂.'
      }
    ]
  },
  {
    id: 'FAT',
    name: 'Chất béo',
    formula: '(RCOO)₃C₃H₅',
    class: 'Este',
    preparation: 'Có sẵn trong tự nhiên (dầu thực vật, mỡ động vật).',
    reactions: [
      {
        action: 'Thủy phân',
        reagent: '+ H₂O (Axit)',
        condition: 't°, Axit',
        equation: '(RCOO)₃C₃H₅ + 3H₂O → 3RCOOH + C₃H₅(OH)₃',
        description: 'Thủy phân trong môi trường axit tạo ra Axit béo và Glixerol.'
      },
      {
        action: 'Xà phòng hóa',
        reagent: '+ NaOH',
        condition: 't°',
        equation: '(RCOO)₃C₃H₅ + 3NaOH → 3RCOONa + C₃H₅(OH)₃',
        description: 'Thủy phân trong môi trường kiềm tạo muối (Xà phòng) và Glixerol.'
      }
    ]
  }
];

export const getValenceNumber = (v: Valence): number => {
  switch (v) {
    case Valence.I: return 1;
    case Valence.II: return 2;
    case Valence.III: return 3;
    case Valence.IV: return 4;
    case Valence.V: return 5;
    case Valence.VI: return 6;
    default: return 1;
  }
};