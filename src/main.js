import { cacheDom } from './ui/domCache.js';
import {
  syncFormFields,
  updatePreviewSizeSelect,
  renderPresetSizes,
  updatePadding,
  updateLegalOpacity,
  updateSubtitleOpacity,
  updateLogoSize,
  updateTitleSize,
  updateSubtitleSize,
  updateLegalSize,
  updateAgeSize,
  updateKVBorderRadius,
  selectPreloadedLogo,
  selectFontFamily,
  selectTitleFontFamily,
  selectSubtitleFontFamily,
  selectLegalFontFamily,
  selectAgeFontFamily,
  selectTitleAlign,
  toggleTitleAlign,
  selectTitleVPos,
  toggleTitleVPos,
  selectLogoPos,
  toggleLogoPos,
  selectLogoLanguage,
  toggleLogoLanguage,
  selectLayoutMode,
  updateColorFromPicker,
  updateColorFromHex,
  selectBgSize,
  selectBgPosition,
  applyPresetBgColor,
  handleLogoUpload,
  handleKVUpload,
  handleBgUpload,
  clearLogo,
  clearKV,
  clearBg,
  showSection,
  toggleSection,
  togglePlatform,
  toggleSize,
  toggleCustomSizeAction,
  removeCustomSizeAction,
  addCustomSizeFromInput,
  changePreviewSize,
  changePreviewSizeCategory,
  handlePresetContainerClick,
  selectAllSizesAction,
  deselectAllSizesAction,
  saveSettings,
  loadSettings,
  resetAll,
  initializeLogoDropdown,
  initializeLogoToggle,
  initializeLogoPosToggle,
  initializeTitleAlignToggle,
  initializeTitleVPosToggle,
  initializeExportScaleToggle,
  initializeFontDropdown,
  initializeFontDropdowns,
  initializeKVDropdown,
  initializeTabs,
    selectPreloadedKV,
    loadDefaultKV,
    initializeStateSubscribers,
    refreshMediaPreviews,
    updateSizesSummary,
    addTitleSubtitlePairAction,
    removeTitleSubtitlePairAction,
    setActiveTitlePair,
    updateActivePairTitle,
    updateActivePairSubtitle,
    updatePairTitleDirect,
    updatePairSubtitleDirect,
    refreshLogoColumns,
    refreshKVColumns,
    refreshAllAssets,
    handleTitleFontUpload,
    handleSubtitleFontUpload,
    handleLegalFontUpload,
    handleAgeFontUpload,
    clearTitleCustomFont,
    clearSubtitleCustomFont,
    clearLegalCustomFont,
    clearAgeCustomFont
} from './ui/ui.js';
import { renderer, clearTextMeasurementCache } from './renderer.js';
import { setKey, getState, ensurePresetSelection } from './state/store.js';
import { exportPNG, exportJPG } from './exporter.js';
import { scanFonts } from './utils/assetScanner.js';
import { setAvailableFonts } from './constants.js';

const initializeEventDelegation = (dom) => {
  dom.presetSizesList.addEventListener('click', handlePresetContainerClick);
  if (dom.previewSizeSelect) {
    dom.previewSizeSelect.addEventListener('change', (event) => changePreviewSize(event.target.value));
  }
  if (dom.previewSizeSelectNarrow) {
    dom.previewSizeSelectNarrow.addEventListener('change', (event) => changePreviewSizeCategory('narrow', event.target.value));
  }
  if (dom.previewSizeSelectWide) {
    dom.previewSizeSelectWide.addEventListener('change', (event) => changePreviewSizeCategory('wide', event.target.value));
  }
  if (dom.previewSizeSelectSquare) {
    dom.previewSizeSelectSquare.addEventListener('change', (event) => changePreviewSizeCategory('square', event.target.value));
  }
};

const exposeGlobals = () => {
  Object.assign(window, {
    updateState: (key, rawValue) => {
      const value = typeof rawValue === 'string' && rawValue.trim() === '' ? rawValue : rawValue;
      
      // Очищаем кэш измерения текста ПЕРЕД изменением состояния, если меняются параметры текста
      if (key === 'titleWeight' || key === 'subtitleWeight' || key === 'legalWeight' || key === 'ageWeight' ||
          key === 'titleFontFamily' || key === 'subtitleFontFamily' || key === 'legalFontFamily' || key === 'ageFontFamily' ||
          key === 'titleSize' || key === 'subtitleSize' || key === 'legalSize' || key === 'ageSize' ||
          key === 'titleLetterSpacing' || key === 'subtitleLetterSpacing' || key === 'legalLetterSpacing') {
        clearTextMeasurementCache();
      }
      
      setKey(key, value);
      // Для начертаний используем синхронный рендеринг для немедленного отображения
      if (key === 'titleWeight' || key === 'subtitleWeight' || key === 'legalWeight' || key === 'ageWeight') {
        // Принудительно очищаем кэш измерения текста перед рендерингом для начертаний
        clearTextMeasurementCache();
        // Используем синхронный рендеринг для немедленного отображения изменений
        renderer.renderSync();
      } else {
        renderer.render();
      }
    },
    updatePadding,
    updateLegalOpacity,
    updateSubtitleOpacity,
    updateLogoSize,
    updateTitleSize,
    updateSubtitleSize,
    updateLegalSize,
    updateAgeSize,
    updateKVBorderRadius,
    selectPreloadedLogo,
    selectPreloadedKV,
    handleLogoUpload,
    handleKVUpload,
    handleBgUpload,
    clearLogo,
    clearKV,
    clearBg,
    selectTitleAlign,
    selectTitleVPos,
    selectLogoPos,
    toggleLogoPos,
    selectLogoLanguage,
    toggleLogoLanguage,
    toggleTitleAlign,
    toggleTitleVPos,
    selectLayoutMode,
    updateColorFromPicker,
    updateColorFromHex,
  applyPresetBgColor,
  selectBgSize,
  selectBgPosition,
  selectFontFamily,
    selectTitleFontFamily,
    selectSubtitleFontFamily,
    selectLegalFontFamily,
    selectAgeFontFamily,
    showSection,
    toggleSection,
    changePreviewSize,
    changePreviewSizeCategory,
    selectAllSizes: selectAllSizesAction,
    deselectAllSizes: deselectAllSizesAction,
    togglePlatform,
    toggleSize,
    toggleCustomSize: toggleCustomSizeAction,
    removeCustomSize: removeCustomSizeAction,
    addCustomSizeFromInput,
    saveSettings,
    loadSettings,
    resetAll,
    exportAllPNG: exportPNG,
    exportAllJPG: exportJPG,
    addTitleSubtitlePair: addTitleSubtitlePairAction,
    removeTitleSubtitlePair: removeTitleSubtitlePairAction,
    setActiveTitlePair,
    updatePairTitleDirect,
    updatePairSubtitleDirect,
    refreshLogoColumns,
    refreshKVColumns,
    refreshAllAssets,
    handleTitleFontUpload,
    handleSubtitleFontUpload,
    handleLegalFontUpload,
    handleAgeFontUpload,
    clearTitleCustomFont,
    clearSubtitleCustomFont,
    clearLegalCustomFont,
    clearAgeCustomFont
  });
};

// Функция для динамической загрузки шрифтов через @font-face
const loadFonts = async (fonts) => {
  // Создаем стиль для @font-face правил
  let styleElement = document.getElementById('dynamic-fonts');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'dynamic-fonts';
    document.head.appendChild(styleElement);
  }
  
  // Группируем шрифты по семейству для более эффективной загрузки
  const fontGroups = new Map();
  fonts.forEach(font => {
    if (!fontGroups.has(font.family)) {
      fontGroups.set(font.family, []);
    }
    fontGroups.get(font.family).push(font);
  });
  
  // Создаем @font-face правила для каждого шрифта
  let fontFaceRules = '';
  
  fontGroups.forEach((familyFonts, family) => {
    familyFonts.forEach(font => {
      if (font.file) {
        // Определяем формат файла по расширению
        const ext = font.file.split('.').pop().toLowerCase();
        let format = 'truetype';
        if (ext === 'woff') format = 'woff';
        else if (ext === 'woff2') format = 'woff2';
        else if (ext === 'otf') format = 'opentype';
        
        // Создаем уникальный идентификатор для каждого шрифта
        const fontId = `${family}-${font.weight}-${font.style}`.replace(/\s+/g, '-');
        
        fontFaceRules += `
@font-face {
  font-family: '${family}';
  src: url('${font.file}') format('${format}');
  font-weight: ${font.weight};
  font-style: ${font.style};
  font-display: swap;
}
`;
      }
    });
  });
  
  // Добавляем правила в style элемент
  if (fontFaceRules.trim()) {
    styleElement.textContent = fontFaceRules;
  }
  
  // Предзагружаем только Regular начертания для быстрой загрузки
  const preloadLinks = [];
  const preloadedFamilies = new Set();
  
  fonts.forEach(font => {
    // Предзагружаем только Regular (400, normal) начертания для каждого семейства
    if (font.file && font.weight === '400' && font.style === 'normal' && !preloadedFamilies.has(font.family)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      const ext = font.file.split('.').pop().toLowerCase();
      link.type = `font/${ext}`;
      link.href = font.file;
      link.crossOrigin = 'anonymous';
      preloadLinks.push(link);
      preloadedFamilies.add(font.family);
    }
  });
  
  // Добавляем preload ссылки в head
  preloadLinks.forEach(link => {
    document.head.appendChild(link);
  });
  
  console.log(`Загружено ${fonts.length} шрифтов из ${fontGroups.size} семейств`);
};

const initialize = async () => {
  try {
    console.log('Начало инициализации...');
    
    // Загружаем шрифты из папки font/
    console.log('Сканирование шрифтов...');
    const fonts = await scanFonts();
    console.log(`Найдено ${fonts.length} шрифтов`);
    
    // Обновляем список доступных шрифтов
    setAvailableFonts(fonts);
    console.log('Список доступных шрифтов обновлен');
    
    // Загружаем шрифты через @font-face
    await loadFonts(fonts);
    console.log('Шрифты загружены через @font-face');
    
    const dom = cacheDom();
    console.log('DOM кэширован');
    
    // Инициализируем старый canvas для обратной совместимости
    if (dom.previewCanvas) {
      renderer.initialize(dom.previewCanvas);
    }
    // Инициализируем новые canvas для мульти-превью
    if (dom.previewCanvasNarrow && dom.previewCanvasWide && dom.previewCanvasSquare) {
      renderer.initializeMulti(dom.previewCanvasNarrow, dom.previewCanvasWide, dom.previewCanvasSquare);
    }
    console.log('Canvas инициализированы');
    
    initializeStateSubscribers();
    console.log('Подписчики состояния инициализированы');

    initializeTabs();
    console.log('Табы инициализированы');
    
    initializeLogoDropdown();
    console.log('Логотип dropdown инициализирован');
    
    initializeLogoToggle();
    console.log('Логотип toggle инициализирован');
    
    initializeLogoPosToggle();
    console.log('Позиция логотипа toggle инициализирована');
    
    initializeTitleAlignToggle();
    console.log('Выключка заголовка toggle инициализирована');
    
    initializeTitleVPosToggle();
    console.log('Вертикальная позиция заголовка toggle инициализирована');
    
    initializeExportScaleToggle();
    console.log('Масштаб экспорта toggle инициализирован');
    
    // Инициализируем dropdown для шрифтов после их загрузки
    initializeFontDropdown();
    console.log('Шрифт dropdown инициализирован');
    
    // Инициализируем dropdown для шрифтов в каждом разделе
    initializeFontDropdowns();
    console.log('Все dropdown для шрифтов инициализированы');
    
    initializeKVDropdown();
    console.log('KV dropdown инициализирован');
    
    ensurePresetSelection();
    console.log('Предустановленные размеры проверены');
    
    await selectPreloadedLogo(getState().logoSelected);
    console.log('Логотип загружен');
    
    // Загружаем KV из активной пары, если есть, иначе используем значение по умолчанию
    const initialState = getState();
    const pairs = initialState.titleSubtitlePairs || [];
    const activePair = pairs[initialState.activePairIndex || 0];
    const kvToLoad = (activePair && activePair.kvSelected) || initialState.kvSelected || 'assets/3d/sign/01.png';
    if (kvToLoad) {
      await selectPreloadedKV(kvToLoad);
    }
    console.log('KV загружен');

    // Сначала экспортируем функции в глобальную область, чтобы они были доступны в HTML
    exposeGlobals();
    console.log('Функции экспортированы в глобальную область');
    
    renderPresetSizes();
    console.log('Предустановленные размеры отрендерены');
    
    updatePreviewSizeSelect();
    console.log('Выбор размера превью обновлен');
    
    syncFormFields();
    console.log('Поля формы синхронизированы');
    
    refreshMediaPreviews();
    console.log('Превью медиа обновлены');
    
    updateSizesSummary();
    console.log('Сводка размеров обновлена');
    
    initializeEventDelegation(dom);
    console.log('Делегирование событий инициализировано');
    
    // Показываем раздел по умолчанию
    showSection('layout');
    console.log('Раздел показан');

    renderer.render();
    console.log('Рендеринг завершен');
  } catch (error) {
    console.error('Ошибка инициализации:', error);
    console.error('Стек ошибки:', error.stack);
    alert(`Ошибка загрузки приложения: ${error.message}\n\nПроверьте консоль браузера для подробностей.`);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}


