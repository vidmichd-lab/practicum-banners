export const AVAILABLE_LOGOS = [
  // Логотипы теперь сканируются динамически через scanLogos()
  // Оставляем пустым массив, так как все логотипы загружаются из папок
];

// AVAILABLE_FONTS теперь заполняется динамически через scanFonts()
// По умолчанию пустой массив, заполняется при инициализации
export let AVAILABLE_FONTS = [
  { name: 'System Default', family: 'system-ui', file: null, weight: '400', style: 'normal' }
];

// Функция для обновления списка доступных шрифтов
export const setAvailableFonts = (fonts) => {
  AVAILABLE_FONTS = [
    { name: 'System Default', family: 'system-ui', file: null, weight: '400', weightName: 'Regular', style: 'normal' },
    ...fonts
  ];
};

// Маппинг весов шрифтов на названия начертаний
export const FONT_WEIGHT_TO_NAME = {
  '100': 'Thin',
  '200': 'ExtraLight',
  '300': 'Light',
  '400': 'Regular',
  '500': 'Medium',
  '600': 'SemiBold',
  '700': 'Bold',
  '800': 'Heavy',
  '900': 'Black'
};

// Маппинг названий начертаний на веса шрифтов
export const FONT_NAME_TO_WEIGHT = {
  'Thin': '100',
  'ExtraLight': '200',
  'Light': '300',
  'Regular': '400',
  'Medium': '500',
  'SemiBold': '600',
  'Bold': '700',
  'Heavy': '800',
  'Black': '900'
};

// Доступные начертания для выбора
export const AVAILABLE_WEIGHTS = [
  { name: 'Thin', weight: '100' },
  { name: 'ExtraLight', weight: '200' },
  { name: 'Light', weight: '300' },
  { name: 'Regular', weight: '400' },
  { name: 'Medium', weight: '500' },
  { name: 'SemiBold', weight: '600' },
  { name: 'Bold', weight: '700' },
  { name: 'Heavy', weight: '800' },
  { name: 'Black', weight: '900' }
];

export const PRESET_SIZES = {
  'РСЯ': [
    { width: 1600, height: 1200, checked: true }
  ],
  'MTS': [
    { width: 200, height: 200, checked: true },
    { width: 240, height: 400, checked: true },
    { width: 300, height: 250, checked: true },
    { width: 300, height: 300, checked: true },
    { width: 300, height: 50, checked: true },
    { width: 300, height: 600, checked: true },
    { width: 320, height: 100, checked: true },
    { width: 320, height: 480, checked: true },
    { width: 336, height: 280, checked: true },
    { width: 728, height: 90, checked: true }
  ],
  'Upravel': [
    { width: 300, height: 250, checked: true },
    { width: 320, height: 100, checked: true },
    { width: 320, height: 50, checked: true },
    { width: 336, height: 280, checked: true },
    { width: 300, height: 300, checked: true },
    { width: 300, height: 600, checked: true }
  ],
  'Habr': [
    { width: 300, height: 600, checked: true },
    { width: 300, height: 250, checked: true },
    { width: 1560, height: 320, checked: true },
    { width: 960, height: 450, checked: true },
    { width: 1320, height: 300, checked: true },
    { width: 520, height: 800, checked: true },
    { width: 1920, height: 1080, checked: true },
    { width: 600, height: 1200, checked: true },
    { width: 900, height: 750, checked: true }
  ],
  'Ozon': [
    { width: 2832, height: 600, checked: true },
    { width: 1080, height: 450, checked: true }
  ]
};

// Структура KV на основе папки assets/3d/sign/
// Примечание: файлы теперь сканируются динамически через scanKV()
export const AVAILABLE_KV = {};

// Предзагруженные цвета для фона
export const PRESET_BACKGROUND_COLORS = [
  '#027EF2',
  '#98D2FE',
  '#07AB4B',
  '#E84033',
  '#FF6C26',
  '#FFD20A',
  '#726BFF',
  '#1E1E1E',
  '#FFFFFF'
];

