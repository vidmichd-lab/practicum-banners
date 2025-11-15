/**
 * Модуль для работы с фоном
 * Содержит функции выбора цвета, загрузки изображения и управления фоном
 */

import { getState, setKey, setState, updatePairBgImage } from '../../state/store.js';
import { PRESET_BACKGROUND_COLORS, AVAILABLE_BG } from '../../constants.js';
import { scanBG } from '../../utils/assetScanner.js';
import { renderer } from '../../renderer.js';
import { getDom } from '../domCache.js';
import { autoSelectLogoByTextColor, syncFormFields } from '../ui.js';

/**
 * Загружает изображение из файла или URL
 */
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

/**
 * Читает файл как Data URL
 */
const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Нормализует цвет в формат #RRGGBB
 */
const normalizeColor = (color) => {
  if (!color) return '#000000';
  
  // Если уже в формате #RRGGBB, возвращаем как есть
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toUpperCase();
  }
  
  // Если в формате #RGB, конвертируем в #RRGGBB
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  
  // Если в формате rgb(r, g, b), конвертируем
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  
  return color;
};

/**
 * Обновляет UI для фона
 */
export const updateBgUI = () => {
  const state = getState();
  const { bgImage } = state;
  const dom = getDom();
  const bgImageOptions = document.getElementById('bgImageOptions');
  
  if (!dom.bgPreviewContainer || !dom.bgPreviewImg || !dom.bgPreviewPlaceholder) return;
  
  // Добавляем обработчик клика на превью для открытия модального окна
  if (dom.bgPreviewContainer) {
    dom.bgPreviewContainer.style.cursor = 'pointer';
    if (!dom.bgPreviewContainer.dataset.clickHandlerAdded) {
      dom.bgPreviewContainer.addEventListener('click', async () => {
        await openBGSelectModal();
      });
      dom.bgPreviewContainer.dataset.clickHandlerAdded = 'true';
    }
  }
  
  if (bgImage) {
    // Есть фоновое изображение
    if (dom.bgPreviewImg) {
      dom.bgPreviewImg.src = bgImage.src || (typeof bgImage === 'string' ? bgImage : '');
      dom.bgPreviewImg.style.display = 'block';
    }
    if (dom.bgPreviewPlaceholder) {
      dom.bgPreviewPlaceholder.style.display = 'none';
    }
    if (dom.bgUploadBtn) {
      dom.bgUploadBtn.style.display = 'none';
    }
    if (dom.bgReplaceBtn) {
      dom.bgReplaceBtn.style.display = 'flex';
    }
    if (dom.bgDeleteBtn) {
      dom.bgDeleteBtn.style.display = 'flex';
    }
    if (bgImageOptions) bgImageOptions.style.display = 'block';
  } else {
    // Нет фонового изображения
    if (dom.bgPreviewImg) {
      dom.bgPreviewImg.src = '';
      dom.bgPreviewImg.style.display = 'none';
    }
    if (dom.bgPreviewPlaceholder) {
      dom.bgPreviewPlaceholder.style.display = 'block';
    }
    if (dom.bgUploadBtn) {
      dom.bgUploadBtn.style.display = 'flex';
    }
    if (dom.bgReplaceBtn) {
      dom.bgReplaceBtn.style.display = 'none';
    }
    if (dom.bgDeleteBtn) {
      dom.bgDeleteBtn.style.display = 'none';
    }
    if (bgImageOptions) bgImageOptions.style.display = 'none';
  }
};

/**
 * Загружает фоновое изображение из файла
 */
export const handleBgImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  (async () => {
    try {
      const state = getState();
      const activePairIndex = state.activePairIndex || 0;
      
      const dataURL = await readFileAsDataURL(file);
      const img = await loadImage(dataURL);
      
      // Обновляем фоновое изображение для активной пары
      updatePairBgImage(activePairIndex, img);
      
      // При загрузке фонового изображения автоматически выключаем KV
      setKey('showKV', false);
      
      // Обновляем чекбокс "Показывать KV" сразу
      const dom = getDom();
      if (dom.showKV) {
        dom.showKV.checked = false;
      }
      
      updateBgUI();
      // Синхронизируем остальные поля UI (после обновления чекбокса)
      syncFormFields();
      renderer.render();
    } catch (error) {
      console.error(error);
      alert('Не удалось загрузить изображение.');
    }
  })();
};

/**
 * Очищает фоновое изображение
 */
export const clearBgImage = () => {
  const state = getState();
  const activePairIndex = state.activePairIndex || 0;
  
  // Очищаем фоновое изображение для активной пары
  updatePairBgImage(activePairIndex, null);
  
  updateBgUI();
  renderer.render();
};

/**
 * Обновляет цвет фона
 */
export const updateBgColor = async (color) => {
  const normalizedColor = normalizeColor(color);
  setKey('bgColor', normalizedColor);
  const dom = getDom();
  if (dom.bgColor) dom.bgColor.value = normalizedColor;
  if (dom.bgColorHex) dom.bgColorHex.value = normalizedColor;
  
  // Обновляем цвета текста в зависимости от фона
  await updateTextColorsForBg(normalizedColor);
  
  renderer.render();
};

/**
 * Применяет предустановленный цвет фона
 */
export const applyPresetBgColor = async (color) => {
  const normalizedColor = normalizeColor(color);
  setKey('bgColor', normalizedColor);
  const dom = getDom();
  if (dom.bgColor) dom.bgColor.value = normalizedColor;
  if (dom.bgColorHex) dom.bgColorHex.value = normalizedColor;
  
  // Обновляем цвета текста в зависимости от фона
  await updateTextColorsForBg(normalizedColor);
  
  renderer.render();
};

/**
 * Обновляет цвета текста в зависимости от фона
 */
const updateTextColorsForBg = async (bgColor) => {
  const normalizedBg = normalizeColor(bgColor);
  const dom = getDom();
  
  // Специальная проверка для цвета #FF6C26 - всегда белый текст и белый логотип
  if (normalizedBg === '#FF6C26') {
    const textColor = '#ffffff';
    setState({
      titleColor: textColor,
      subtitleColor: textColor,
      legalColor: textColor
    });
    
    // Обновляем UI элементы для цветов текста
    if (dom.titleColor) dom.titleColor.value = textColor;
    if (dom.titleColorHex) dom.titleColorHex.value = textColor;
    if (dom.subtitleColor) dom.subtitleColor.value = textColor;
    if (dom.subtitleColorHex) dom.subtitleColorHex.value = textColor;
    if (dom.legalColor) dom.legalColor.value = textColor;
    if (dom.legalColorHex) dom.legalColorHex.value = textColor;
    
    // Автоматически выбираем белый логотип
    await autoSelectLogoByTextColor(textColor);
    return;
  }
  
  // Конвертируем цвет в RGB
  const hex = normalizedBg.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Вычисляем яркость (luminance)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Если фон темный, делаем текст светлым, и наоборот
  const textColor = luminance > 0.5 ? '#1e1e1e' : '#ffffff';
  const subtitleColor = luminance > 0.5 ? '#4a4a4a' : '#e0e0e0';
  const legalColor = luminance > 0.5 ? '#666666' : '#ffffff';
  
  setState({
    titleColor: textColor,
    subtitleColor: subtitleColor,
    legalColor: legalColor
  });
  
  // Обновляем UI элементы для цветов текста
  if (dom.titleColor) dom.titleColor.value = textColor;
  if (dom.titleColorHex) dom.titleColorHex.value = textColor;
  if (dom.subtitleColor) dom.subtitleColor.value = subtitleColor;
  if (dom.subtitleColorHex) dom.subtitleColorHex.value = subtitleColor;
  if (dom.legalColor) dom.legalColor.value = legalColor;
  if (dom.legalColorHex) dom.legalColorHex.value = legalColor;
  
  // Автоматически выбираем соответствующий логотип на основе цвета текста
  await autoSelectLogoByTextColor(textColor);
};

/**
 * Обновляет размер фонового изображения
 */
export const updateBgSize = (size) => {
  setKey('bgSize', size);
  renderer.render();
};

/**
 * Обновляет позицию фонового изображения
 */
export const updateBgPosition = (position) => {
  setKey('bgPosition', position);
  renderer.render();
};

/**
 * Инициализирует UI для работы с фоном
 */
export const initializeBackgroundUI = () => {
  const state = getState();
  const dom = getDom();
  
  // Обновляем цвет фона
  if (dom.bgColor) {
    dom.bgColor.value = state.bgColor || '#1e1e1e';
  }
  if (dom.bgColorHex) {
    dom.bgColorHex.value = state.bgColor || '#1e1e1e';
  }
  
  // Обновляем UI фонового изображения
  updateBgUI();
  
  // Инициализируем dropdown для выбора из библиотеки
  initializeBGDropdown();
  
  // Инициализируем предустановленные цвета
  const presetColorsContainer = document.getElementById('presetBgColors');
  if (presetColorsContainer) {
    presetColorsContainer.innerHTML = '';
    PRESET_BACKGROUND_COLORS.forEach((color) => {
      const colorBtn = document.createElement('button');
      colorBtn.className = 'preset-color-btn';
      colorBtn.style.backgroundColor = color;
      colorBtn.title = color;
      colorBtn.addEventListener('click', () => {
        applyPresetBgColor(color);
      });
      presetColorsContainer.appendChild(colorBtn);
    });
  }
};

// Кэш для отсканированных фоновых изображений
let cachedBG = null;
let bgScanning = false;

// Выбранные папки для навигации по структуре фоновых изображений
let selectedBGFolder1 = null;
let selectedBGFolder2 = null;

// Глобальная переменная для хранения индекса пары, для которой открывается модальное окно
let currentBGModalPairIndex = null;

/**
 * Выбирает предзагруженное фоновое изображение из библиотеки
 */
export const selectPreloadedBG = async (bgFile) => {
  const state = getState();
  const activePairIndex = state.activePairIndex || 0;
  
  // Закрываем модальное окно выбора
  closeBGSelectModal();

  // Если открыта админка и выбран фон для админки
  if (window._adminBgSelectIndex !== undefined && window._adminBgSelectIndex !== null) {
    const adminIndex = window._adminBgSelectIndex;
    const backgrounds = JSON.parse(localStorage.getItem('adminBackgrounds') || '[]');
    if (backgrounds[adminIndex]) {
      backgrounds[adminIndex].bgImage = bgFile || null;
      localStorage.setItem('adminBackgrounds', JSON.stringify(backgrounds));
      // Обновляем список фонов в админке
      const adminModal = document.getElementById('sizesAdminModal');
      if (adminModal) {
        const backgroundsList = adminModal.querySelector('#adminBackgroundsList');
        if (backgroundsList) {
          // Вызываем refreshBackgroundsList через событие или напрямую
          const event = new CustomEvent('adminBackgroundsUpdated');
          adminModal.dispatchEvent(event);
        }
      }
    }
    window._adminBgSelectIndex = null;
    return;
  }

  // Если модальное окно открыто для конкретной пары, обновляем только эту пару
  if (currentBGModalPairIndex !== null) {
    await selectPairBG(currentBGModalPairIndex, bgFile || '');
    return;
  }
  
  if (!bgFile) {
    // Очищаем фоновое изображение для активной пары
    updatePairBgImage(activePairIndex, null);
    setState({ bgImage: null });
    updateBgUI();
    renderer.render();
    return;
  }
  
  // Обновляем фоновое изображение для активной пары (сохраняем путь как строку)
  updatePairBgImage(activePairIndex, bgFile);
  
  // При выборе фонового изображения автоматически выключаем KV
  setKey('showKV', false);
  
  // Обновляем чекбокс "Показывать KV" сразу
  const dom = getDom();
  if (dom.showKV) {
    dom.showKV.checked = false;
  }
  
  try {
    const img = await loadImage(bgFile);
    setState({ bgImage: img });
    updateBgUI();
    renderer.render();
  } catch (error) {
    console.error('Ошибка загрузки фонового изображения:', error, 'Путь:', bgFile);
    setState({ bgImage: null });
    updateBgUI();
    renderer.render();
  }
};

/**
 * Выбирает фоновое изображение для конкретной пары
 */
export const selectPairBG = async (pairIndex, bgFile) => {
  const state = getState();
  updatePairBgImage(pairIndex, bgFile || null);
  
  // Если это активная пара, обновляем глобальное фоновое изображение
  if (pairIndex === (state.activePairIndex || 0)) {
    if (!bgFile) {
      setState({ bgImage: null });
      updateBgUI();
    } else {
      // При выборе фонового изображения автоматически выключаем KV
      setKey('showKV', false);
      
      // Обновляем чекбокс "Показывать KV" сразу
      const dom = getDom();
      if (dom.showKV) {
        dom.showKV.checked = false;
      }
      
      try {
        const img = await loadImage(bgFile);
        setState({ bgImage: img });
        updateBgUI();
      } catch (error) {
        console.error(error);
        setState({ bgImage: null });
        updateBgUI();
      }
    }
    renderer.render();
  }
};

/**
 * Рендерит первую колонку со списком папок первого уровня
 */
const renderBGColumn1 = (allBG) => {
  const column1 = document.getElementById('bgFolder1Column');
  if (!column1) return;
  
  column1.innerHTML = '';
  const folders1 = Object.keys(allBG).sort();
  
  folders1.forEach((folder1) => {
    const item = document.createElement('div');
    item.className = 'column-item bg-folder1-item';
    item.dataset.folder1 = folder1;
    item.textContent = folder1;
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedBGFolder1 = folder1;
      selectedBGFolder2 = null;
      document.querySelectorAll('.bg-folder1-item').forEach(el => {
        el.classList.remove('active');
      });
      item.classList.add('active');
      renderBGColumn2(allBG);
      renderBGColumn3([]);
    });
    
    column1.appendChild(item);
  });
  
  if (folders1.length > 0 && !selectedBGFolder1) {
    selectedBGFolder1 = folders1[0];
    const firstItem = column1.querySelector(`[data-folder1="${folders1[0]}"]`);
    if (firstItem) {
      firstItem.classList.add('active');
      renderBGColumn2(allBG);
    }
  }
};

/**
 * Рендерит вторую колонку со списком папок второго уровня
 */
const renderBGColumn2 = (allBG) => {
  const column2 = document.getElementById('bgFolder2Column');
  if (!column2 || !selectedBGFolder1) return;
  
  column2.innerHTML = '';
  const folders2 = Object.keys(allBG[selectedBGFolder1] || {}).sort();
  
  folders2.forEach((folder2) => {
    const item = document.createElement('div');
    item.className = 'column-item bg-folder2-item';
    item.dataset.folder2 = folder2;
    item.textContent = folder2;
    
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedBGFolder2 = folder2;
      document.querySelectorAll('.bg-folder2-item').forEach(el => {
        el.classList.remove('active');
      });
      item.classList.add('active');
      const images = allBG[selectedBGFolder1][selectedBGFolder2] || [];
      renderBGColumn3(images);
    });
    
    column2.appendChild(item);
  });
  
  if (folders2.length > 0 && !selectedBGFolder2) {
    selectedBGFolder2 = folders2[0];
    const firstItem = column2.querySelector(`[data-folder2="${folders2[0]}"]`);
    if (firstItem) {
      firstItem.classList.add('active');
      const images = allBG[selectedBGFolder1][selectedBGFolder2] || [];
      renderBGColumn3(images);
    }
  }
};

/**
 * Рендерит третью колонку с изображениями фона
 */
const renderBGColumn3 = (images) => {
  const column3 = document.getElementById('bgImagesColumn');
  if (!column3) return;
  
  column3.innerHTML = '';
  
  const state = getState();
  let activeBGFile = null;
  
  if (currentBGModalPairIndex !== null) {
    const pairs = state.titleSubtitlePairs || [];
    const pair = pairs[currentBGModalPairIndex];
    if (pair && pair.bgImageSelected) {
      activeBGFile = typeof pair.bgImageSelected === 'string' ? pair.bgImageSelected : pair.bgImageSelected.src;
    }
  } else {
    const bgImage = state.bgImage;
    activeBGFile = bgImage ? (typeof bgImage === 'string' ? bgImage : bgImage.src) : '';
  }
  
  images.forEach((bg, index) => {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'preview-item';
    
    const isActive = activeBGFile && bg.file === activeBGFile;
    
    if (isActive) {
      imgContainer.style.border = '2px solid #027EF2';
      imgContainer.style.borderRadius = '4px';
    } else {
      imgContainer.style.border = '2px solid transparent';
      imgContainer.style.borderRadius = '4px';
    }
    
    const img = document.createElement('img');
    img.alt = bg.name;
    img.src = bg.file;
    
    if (index < 6 || isActive) {
      img.loading = 'eager';
    } else {
      img.loading = 'lazy';
    }
    
    imgContainer.appendChild(img);
    
    imgContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPreloadedBG(bg.file);
      closeBGSelectModal();
    });
    
    column3.appendChild(imgContainer);
  });
};

/**
 * Строит структуру фоновых изображений из отсканированных данных
 */
const buildBGStructure = (scannedBG) => {
  const allBG = { ...AVAILABLE_BG };
  Object.keys(scannedBG).forEach(folder1 => {
    if (!allBG[folder1]) {
      allBG[folder1] = {};
    }
    Object.keys(scannedBG[folder1]).forEach(folder2 => {
      if (!allBG[folder1][folder2]) {
        allBG[folder1][folder2] = [];
      }
      scannedBG[folder1][folder2].forEach(bg => {
        if (!allBG[folder1][folder2].find(b => b.file === bg.file)) {
          allBG[folder1][folder2].push(bg);
        }
      });
    });
  });
  return allBG;
};

/**
 * Заполняет колонки фоновых изображений
 */
const populateBGColumns = async (forceRefresh = false) => {
  const column1 = document.getElementById('bgFolder1Column');
  if (!column1) return;
  
  if (bgScanning) {
    return;
  }
  
  if (forceRefresh) {
    cachedBG = null;
    selectedBGFolder1 = null;
    selectedBGFolder2 = null;
  }
  
  if (cachedBG && !forceRefresh) {
    renderBGColumn1(cachedBG);
    return;
  }
  
  bgScanning = true;
  const scannedBG = await scanBG();
  const allBG = buildBGStructure(scannedBG);
  cachedBG = allBG;
  bgScanning = false;
  
  renderBGColumn1(allBG);
};

/**
 * Обновляет колонки фоновых изображений (принудительное обновление)
 */
export const refreshBGColumns = async () => {
  const refreshBtn = document.querySelector('[data-function="refreshBGColumns"]');
  if (!refreshBtn) return;
  
  const originalHTML = refreshBtn.innerHTML;
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<span class="material-icons refresh-spinner">refresh</span> Обновление...';
  refreshBtn.offsetHeight;
  
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    cachedBG = null;
    selectedBGFolder1 = null;
    selectedBGFolder2 = null;
    await populateBGColumns(true);
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = originalHTML;
  }
};

/**
 * Открывает модальное окно выбора фонового изображения
 */
const openBGSelectModal = async (pairIndex = null) => {
  const overlay = document.getElementById('bgSelectModalOverlay');
  if (!overlay) return;
  
  currentBGModalPairIndex = pairIndex;
  selectedBGFolder1 = null;
  selectedBGFolder2 = null;
  
  await populateBGColumns();
  
  overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
};

/**
 * Закрывает модальное окно выбора фонового изображения
 */
const closeBGSelectModal = () => {
  const overlay = document.getElementById('bgSelectModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
  currentBGModalPairIndex = null;
};

/**
 * Инициализирует dropdown для выбора фонового изображения
 */
export const initializeBGDropdown = async () => {
  const trigger = document.getElementById('bgSelectTrigger');
  if (!trigger) return;
  
  const newTrigger = trigger.cloneNode(true);
  trigger.parentNode.replaceChild(newTrigger, trigger);
  const updatedTrigger = document.getElementById('bgSelectTrigger');
  
  updatedTrigger.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await openBGSelectModal();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('bgSelectModalOverlay');
      if (overlay && overlay.style.display === 'block') {
        closeBGSelectModal();
      }
    }
  });
  
  window.openBGSelectModal = openBGSelectModal;
  window.closeBGSelectModal = closeBGSelectModal;
};

// Экспортируем функции для использования в других модулях
export {
  openBGSelectModal,
  closeBGSelectModal
};

// Экспортируем константы для использования в других модулях
export { PRESET_BACKGROUND_COLORS };

