import {
  getState,
  setKey,
  setState,
  batch,
  subscribe,
  saveSettingsSnapshot,
  applySavedSettings,
  resetState,
  togglePresetSize,
  selectAllPresetSizes,
  deselectAllPresetSizes,
  getCheckedSizes,
  ensurePresetSelection,
  addTitleSubtitlePair,
  removeTitleSubtitlePair,
  setActivePairIndex,
  updatePairTitle,
  updatePairSubtitle,
  updatePairKV,
  addCustomSize,
  removeCustomSize,
  toggleCustomSize
} from '../state/store.js';
import { AVAILABLE_LOGOS, AVAILABLE_FONTS, AVAILABLE_KV, PRESET_BACKGROUND_COLORS, FONT_WEIGHT_TO_NAME, FONT_NAME_TO_WEIGHT } from '../constants.js';
import { scanLogos, scanKV } from '../utils/assetScanner.js';
import { renderer, clearTextMeasurementCache } from '../renderer.js';
import { getDom } from './domCache.js';
let savedSettings = null;

const updateChipGroup = (group, value) => {
  document.querySelectorAll(`[data-group="${group}"]`).forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.value === value);
  });
};

const syncChips = (state) => {
  // Обновляем тумблеры для выключки текста и вертикальной позиции
  updateTitleAlignToggle(state.titleAlign || 'left');
  updateTitleVPosToggle(state.titleVPos || 'top');
  // Остальные чипсы
  updateChipGroup('bg-size', state.bgSize || 'cover');
  updateChipGroup('bg-position', state.bgPosition || 'center');
  updateLogoPosToggle(state.logoPos || 'left');
  updateChipGroup('logo-lang', state.logoLanguage || 'ru');
};

export const syncFormFields = () => {
  const state = getState();
  const dom = getDom();

  if (!dom.paddingPercent) return;

  dom.paddingPercent.value = state.paddingPercent;
  dom.paddingValue.textContent = `${state.paddingPercent}%`;
  
  // Синхронизируем активную пару
  if (state.titleSubtitlePairs && state.titleSubtitlePairs.length > 0) {
    const activePair = state.titleSubtitlePairs[state.activePairIndex || 0];
    if (activePair) {
      if (dom.title) dom.title.value = activePair.title || '';
      if (dom.subtitle) dom.subtitle.value = activePair.subtitle || '';
    }
  } else {
    if (dom.title) dom.title.value = state.title || '';
    if (dom.subtitle) dom.subtitle.value = state.subtitle || '';
  }
  dom.titleColor.value = state.titleColor;
  if (dom.titleColorHex) dom.titleColorHex.value = state.titleColor;
  dom.titleSize.value = state.titleSize;
  if (dom.titleSizeValue) dom.titleSizeValue.textContent = `${state.titleSize}%`;
  // Конвертируем вес из числа в название для обратной совместимости
  const titleWeight = typeof state.titleWeight === 'number' 
    ? FONT_WEIGHT_TO_NAME[state.titleWeight.toString()] || 'Regular' 
    : (state.titleWeight || 'Regular');
  dom.titleWeight.value = titleWeight;
  if (dom.titleFontFamily) dom.titleFontFamily.value = state.titleFontFamily || state.fontFamily || 'YS Text';
  if (state.titleCustomFontName) {
    updateCustomFontInfo('title', state.titleCustomFontName);
  }
  dom.titleLetterSpacing.value = state.titleLetterSpacing;
  dom.titleLineHeight.value = state.titleLineHeight;

  dom.subtitle.value = state.subtitle;
  dom.subtitleColor.value = state.subtitleColor;
  if (dom.subtitleColorHex) dom.subtitleColorHex.value = state.subtitleColor;
  dom.subtitleOpacity.value = state.subtitleOpacity || 90;
  if (dom.subtitleOpacityValue) dom.subtitleOpacityValue.textContent = `${state.subtitleOpacity || 90}%`;
  dom.subtitleSize.value = state.subtitleSize;
  if (dom.subtitleSizeValue) dom.subtitleSizeValue.textContent = `${state.subtitleSize}%`;
  // Конвертируем вес из числа в название для обратной совместимости
  const subtitleWeight = typeof state.subtitleWeight === 'number' 
    ? FONT_WEIGHT_TO_NAME[state.subtitleWeight.toString()] || 'Regular' 
    : (state.subtitleWeight || 'Regular');
  dom.subtitleWeight.value = subtitleWeight;
  if (dom.subtitleFontFamily) dom.subtitleFontFamily.value = state.subtitleFontFamily || state.fontFamily || 'YS Text';
  if (state.subtitleCustomFontName) {
    updateCustomFontInfo('subtitle', state.subtitleCustomFontName);
  }
  dom.subtitleLetterSpacing.value = state.subtitleLetterSpacing;
  dom.subtitleLineHeight.value = state.subtitleLineHeight;
  dom.subtitleGap.value = state.subtitleGap;

  dom.legal.value = state.legal;
  dom.legalColor.value = state.legalColor;
  if (dom.legalColorHex) dom.legalColorHex.value = state.legalColor;
  dom.legalOpacity.value = state.legalOpacity;
  dom.legalOpacityValue.textContent = `${state.legalOpacity}%`;
  dom.legalSize.value = state.legalSize;
  if (dom.legalSizeValue) dom.legalSizeValue.textContent = `${state.legalSize}%`;
  // Конвертируем вес из числа в название для обратной совместимости
  const legalWeight = typeof state.legalWeight === 'number' 
    ? FONT_WEIGHT_TO_NAME[state.legalWeight.toString()] || 'Regular' 
    : (state.legalWeight || 'Regular');
  dom.legalWeight.value = legalWeight;
  if (dom.legalFontFamily) dom.legalFontFamily.value = state.legalFontFamily || state.fontFamily || 'YS Text';
  if (state.legalCustomFontName) {
    updateCustomFontInfo('legal', state.legalCustomFontName);
  }
  dom.legalLetterSpacing.value = state.legalLetterSpacing;
  dom.legalLineHeight.value = state.legalLineHeight;

  dom.age.value = state.age;
  dom.ageSize.value = state.ageSize;
  if (dom.ageSizeValue) dom.ageSizeValue.textContent = `${state.ageSize}%`;
  if (dom.ageFontFamily) dom.ageFontFamily.value = state.ageFontFamily || state.fontFamily || 'YS Text';
  if (state.ageCustomFontName) {
    updateCustomFontInfo('age', state.ageCustomFontName);
  }
  dom.ageGapPercent.value = state.ageGapPercent;

  dom.showSubtitle.checked = state.showSubtitle;
  if (dom.hideSubtitleOnWide) dom.hideSubtitleOnWide.checked = state.hideSubtitleOnWide;
  dom.showLegal.checked = state.showLegal;
  dom.showAge.checked = state.showAge;
  dom.showKV.checked = state.showKV;
  dom.showBlocks.checked = state.showBlocks || false;
  dom.showGuides.checked = !!state.showGuides;

  if (dom.logoSelect) dom.logoSelect.value = state.logoSelected || '';
  updateLogoTriggerText(state.logoSelected || '');
  dom.logoSize.value = state.logoSize;
  dom.logoSizeValue.textContent = `${state.logoSize}%`;

  if (dom.kvSelect) {
    dom.kvSelect.value = state.kvSelected || '';
    updateKVTriggerText(state.kvSelected || '');
  }
  if (dom.kvBorderRadius) {
    dom.kvBorderRadius.value = state.kvBorderRadius || 0;
  }
  if (dom.kvBorderRadiusValue) {
    dom.kvBorderRadiusValue.textContent = `${state.kvBorderRadius || 0}%`;
  }

  dom.bgColor.value = state.bgColor;
  if (dom.bgColorHex) dom.bgColorHex.value = state.bgColor;

  dom.namePrefix.value = state.namePrefix;

  const fontSelect = dom.fontFamily;
  if (fontSelect) {
    fontSelect.value = state.fontFamily;
  }

  syncChips(state);
  updateChipGroup('layout-mode', state.layoutMode || 'auto');
  updateLogoToggle(state.logoLanguage || 'ru');
};

export const updatePreviewSizeSelect = () => {
  const dom = getDom();
  const categorized = renderer.getCategorizedSizes();
  let needsRender = false;

  // Обновляем дроплист для узких форматов
  if (dom.previewSizeSelectNarrow) {
    if (!categorized.narrow.length) {
      dom.previewSizeSelectNarrow.innerHTML = '<option value="-1">Нет узких форматов</option>';
    } else {
      const options = categorized.narrow
        .map((size, index) => `<option value="${index}">${size.width} × ${size.height} (${size.platform})</option>`)
        .join('');
      dom.previewSizeSelectNarrow.innerHTML = options;
      // Выбираем первый по умолчанию
      dom.previewSizeSelectNarrow.value = '0';
      renderer.setCategoryIndex('narrow', 0, false); // не вызывать render
      needsRender = true;
    }
  }

  // Обновляем дроплист для широких форматов
  if (dom.previewSizeSelectWide) {
    if (!categorized.wide.length) {
      dom.previewSizeSelectWide.innerHTML = '<option value="-1">Нет широких форматов</option>';
    } else {
      // Ищем 1600x1200 в широких форматах
      const defaultIndex = categorized.wide.findIndex(size => size.width === 1600 && size.height === 1200);
      const selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;
      
      const options = categorized.wide
        .map((size, index) => `<option value="${index}" ${index === selectedIndex ? 'selected' : ''}>${size.width} × ${size.height} (${size.platform})</option>`)
        .join('');
      dom.previewSizeSelectWide.innerHTML = options;
      renderer.setCategoryIndex('wide', selectedIndex, false); // не вызывать render
      needsRender = true;
    }
  }

  // Обновляем дроплист для квадратных форматов
  if (dom.previewSizeSelectSquare) {
    if (!categorized.square.length) {
      dom.previewSizeSelectSquare.innerHTML = '<option value="-1">Нет квадратных форматов</option>';
    } else {
      const options = categorized.square
        .map((size, index) => `<option value="${index}">${size.width} × ${size.height} (${size.platform})</option>`)
        .join('');
      dom.previewSizeSelectSquare.innerHTML = options;
      // Выбираем первый по умолчанию
      dom.previewSizeSelectSquare.value = '0';
      renderer.setCategoryIndex('square', 0, false); // не вызывать render
      needsRender = true;
    }
  }

  // Вызываем render один раз после всех обновлений
  if (needsRender) {
    renderer.render();
  }

  // Обратная совместимость со старым дроплистом
  if (dom.previewSizeSelect) {
    const sortedSizes = renderer.getSortedSizes();
    if (!sortedSizes.length) {
      dom.previewSizeSelect.innerHTML = '<option value="-1">No sizes selected</option>';
      return;
    }

    const defaultIndex = sortedSizes.findIndex(size => size.width === 1600 && size.height === 1200);
    const currentIndex = renderer.getCurrentIndex();
    
    let selectedIndex;
    if (currentIndex < 0 || currentIndex >= sortedSizes.length) {
      selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;
    } else if (currentIndex === 0 && defaultIndex >= 0 && defaultIndex !== 0) {
      selectedIndex = defaultIndex;
    } else {
      selectedIndex = currentIndex;
    }

    if (selectedIndex !== currentIndex) {
      renderer.setCurrentIndex(selectedIndex);
    }

    const options = sortedSizes
      .map((size, index) => `<option value="${index}" ${index === selectedIndex ? 'selected' : ''}>${size.width} × ${size.height} (${size.platform})</option>`)
      .join('');

    dom.previewSizeSelect.innerHTML = options;
  }
};

const updateLogoUI = () => {
  const dom = getDom();
  const { logo, logoSelected } = getState();
  const logoRemoveBtn = document.getElementById('logoRemoveBtn');
  const logoPreviewImg = document.getElementById('logoPreviewImg');
  const logoPreviewPlaceholder = document.getElementById('logoPreviewPlaceholder');
  const logoPreviewContainer = document.getElementById('logoPreviewContainer');
  
  // Обновляем превью логотипа
  if (logoPreviewImg && logoPreviewPlaceholder) {
    if (logo) {
      // Загруженное изображение
      logoPreviewImg.src = logo.src;
      logoPreviewImg.style.display = 'block';
      logoPreviewPlaceholder.style.display = 'none';
    } else if (logoSelected) {
      // Предзагруженный логотип
      logoPreviewImg.src = logoSelected;
      logoPreviewImg.style.display = 'block';
      logoPreviewPlaceholder.style.display = 'none';
    } else {
      // Нет логотипа
      logoPreviewImg.src = '';
      logoPreviewImg.style.display = 'none';
      logoPreviewPlaceholder.style.display = 'block';
    }
  }
  
  // Добавляем обработчик клика на превью для открытия модального окна
  if (logoPreviewContainer) {
    logoPreviewContainer.style.cursor = 'pointer';
    // Используем data-атрибут для отслеживания, был ли уже добавлен обработчик
    if (!logoPreviewContainer.dataset.clickHandlerAdded) {
      logoPreviewContainer.addEventListener('click', async () => {
        await openLogoSelectModal();
      });
      logoPreviewContainer.dataset.clickHandlerAdded = 'true';
    }
  }
  
  // Обновляем состояние кнопки "Удалить"
  if (logoRemoveBtn) {
    const hasLogo = !!(logo || logoSelected);
    logoRemoveBtn.disabled = !hasLogo;
    if (hasLogo) {
      logoRemoveBtn.style.opacity = '1';
      logoRemoveBtn.style.cursor = 'pointer';
    } else {
      logoRemoveBtn.style.opacity = '0.5';
      logoRemoveBtn.style.cursor = 'not-allowed';
    }
  }
};

const updateKVUI = () => {
  const dom = getDom();
  const state = getState();
  const { kv, kvSelected } = state;
  const kvRemoveBtn = document.getElementById('kvRemoveBtn');
  const kvPreviewImg = document.getElementById('kvPreviewImg');
  const kvPreviewPlaceholder = document.getElementById('kvPreviewPlaceholder');
  const kvActivePairLabel = document.getElementById('kvActivePairLabel');
  const kvPreviewContainer = document.getElementById('kvPreviewContainer');
  
  // Обновляем заголовок для активной пары
  if (kvActivePairLabel) {
    const activeIndex = state.activePairIndex || 0;
    kvActivePairLabel.textContent = `KV для заголовка ${activeIndex + 1}`;
  }
  
  // Обновляем превью KV
  if (kvPreviewImg && kvPreviewPlaceholder) {
    if (kv) {
      // Загруженное изображение
      kvPreviewImg.src = kv.src;
      kvPreviewImg.style.display = 'block';
      kvPreviewPlaceholder.style.display = 'none';
    } else if (kvSelected) {
      // Предзагруженный KV
      kvPreviewImg.src = kvSelected;
      kvPreviewImg.style.display = 'block';
      kvPreviewPlaceholder.style.display = 'none';
    } else {
      // Нет KV
      kvPreviewImg.src = '';
      kvPreviewImg.style.display = 'none';
      kvPreviewPlaceholder.style.display = 'block';
    }
  }
  
  // Добавляем обработчик клика на превью для открытия модального окна
  if (kvPreviewContainer) {
    kvPreviewContainer.style.cursor = 'pointer';
    // Используем data-атрибут для отслеживания, был ли уже добавлен обработчик
    if (!kvPreviewContainer.dataset.clickHandlerAdded) {
      kvPreviewContainer.addEventListener('click', async () => {
        await openKVSelectModal();
      });
      kvPreviewContainer.dataset.clickHandlerAdded = 'true';
    }
  }
  
  // Обновляем состояние кнопки "Удалить"
  if (kvRemoveBtn) {
    const hasKV = !!(kv || kvSelected);
    kvRemoveBtn.disabled = !hasKV;
    if (hasKV) {
      kvRemoveBtn.style.opacity = '1';
      kvRemoveBtn.style.cursor = 'pointer';
    } else {
      kvRemoveBtn.style.opacity = '0.5';
      kvRemoveBtn.style.cursor = 'not-allowed';
    }
  }
};

const updateBgUI = () => {
  const dom = getDom();
  const { bgImage } = getState();
  const bgImageOptions = document.getElementById('bgImageOptions');
  
  if (!dom.bgPreview || !dom.bgActions || !dom.bgThumb) return;

  if (bgImage) {
    dom.bgPreview.style.display = 'block';
    dom.bgActions.style.display = 'block';
    dom.bgThumb.style.backgroundImage = `url(${bgImage.src})`;
    if (bgImageOptions) bgImageOptions.style.display = 'block';
  } else {
    dom.bgPreview.style.display = 'none';
    dom.bgActions.style.display = 'none';
    dom.bgThumb.style.backgroundImage = 'none';
    if (bgImageOptions) bgImageOptions.style.display = 'none';
  }
};

export const selectBgSize = (size) => {
  setKey('bgSize', size);
  updateChipGroup('bg-size', size);
  renderer.render();
};

export const selectBgPosition = (position) => {
  setKey('bgPosition', position);
  updateChipGroup('bg-position', position);
  renderer.render();
};

export const refreshMediaPreviews = () => {
  updateLogoUI();
  updateKVUI();
  updateBgUI();
};

export const updateSizesSummary = () => {
  const dom = getDom();
  const sizes = getCheckedSizes();
  dom.sizesSummary.textContent = `Выбрано: ${sizes.length} размеров`;
};

export const renderPresetSizes = () => {
  const dom = getDom();
  const state = getState();
  let html = '';

  Object.keys(state.presetSizes).forEach((platform) => {
    html += `
      <div class="platform-group">
        <div class="platform-header" data-platform="${platform}">
          <span>${platform}</span>
          <span class="platform-arrow collapsed" id="arrow-${platform}">▶</span>
        </div>
        <div class="platform-sizes collapsed" id="sizes-${platform}">
    `;

    state.presetSizes[platform].forEach((size, index) => {
      const id = `size-${platform}-${index}`;
      html += `
        <div class="size-checkbox-item">
          <input type="checkbox" id="${id}" data-platform="${platform}" data-index="${index}" ${
            size.checked ? 'checked' : ''
          }>
          <label for="${id}">${size.width} × ${size.height}</label>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  // Добавляем кастомные размеры
  if (state.customSizes && state.customSizes.length > 0) {
    html += `
      <div class="platform-group">
        <div class="platform-header" data-platform="Custom">
          <span>Кастомные</span>
          <span class="platform-arrow collapsed" id="arrow-Custom">▶</span>
        </div>
        <div class="platform-sizes collapsed" id="sizes-Custom">
    `;

    state.customSizes.forEach((size) => {
      const id = `custom-size-${size.id}`;
      html += `
        <div class="size-checkbox-item" style="position: relative;">
          <input type="checkbox" id="${id}" data-custom-id="${size.id}" ${
            size.checked ? 'checked' : ''
          }>
          <label for="${id}" style="flex: 1;">${size.width} × ${size.height}</label>
          <button onclick="removeCustomSizeAction('${size.id}')" class="btn-small" style="background: transparent; border: none; color: #ff6b6b; cursor: pointer; font-size: 16px; line-height: 1; opacity: 0.7; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Удалить">×</button>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  dom.presetSizesList.innerHTML = html;
  updateSizesSummary();
};

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

const loadImageFile = async (file, target) => {
  try {
    const dataURL = await readFileAsDataURL(file);
    const img = await loadImage(dataURL);
    setKey(target, img);
    if (target === 'logo') updateLogoUI();
    if (target === 'kv') updateKVUI();
    if (target === 'bgImage') updateBgUI();
    renderer.render();
  } catch (error) {
    console.error(error);
    alert('Не удалось загрузить изображение.');
  }
};

export const handleLogoUpload = (event) => {
  const file = event.target.files[0];
  if (file) loadImageFile(file, 'logo');
};

export const handleKVUpload = (event) => {
  const file = event.target.files[0];
  if (file) loadImageFile(file, 'kv');
};

export const handleBgUpload = (event) => {
  const file = event.target.files[0];
  if (file) loadImageFile(file, 'bgImage');
};

export const handlePairKVUpload = async (pairIndex, file) => {
  try {
    const dataURL = await readFileAsDataURL(file);
    const img = await loadImage(dataURL);
    
    // Обновляем KV для пары
    const state = getState();
    const pairs = state.titleSubtitlePairs || [];
    const pair = pairs[pairIndex];
    
    if (pair) {
      // Сохраняем путь к файлу (используем data URL как идентификатор)
      updatePairKV(pairIndex, dataURL);
      
      // Если это активная пара, обновляем глобальный KV
      if (pairIndex === (state.activePairIndex || 0)) {
        setState({ kv: img, kvSelected: dataURL });
        updateKVUI();
        renderer.render();
      }
      
      // Обновляем UI
      renderKVPairs();
    }
  } catch (error) {
    console.error(error);
    alert('Не удалось загрузить изображение.');
  }
};

export const clearLogo = () => {
  setState({ logo: null, logoSelected: '' });
  const dom = getDom();
  if (dom.logoSelect) dom.logoSelect.value = '';
  updateLogoTriggerText('');
  updateLogoUI();
  renderer.render();
};

export const clearKV = () => {
  setState({ kv: null, kvSelected: '', showKV: false });
  const dom = getDom();
  dom.showKV.checked = false;
  updateKVTriggerText('');
  updateKVUI();
  renderer.render();
};

export const clearBg = () => {
  setState({ bgImage: null });
  updateBgUI();
  renderer.render();
};

export const selectPreloadedLogo = async (logoFile) => {
  const dom = getDom();
  
  // Закрываем модальное окно выбора
  closeLogoSelectModal();
  
  setState({ logoSelected: logoFile || '' });
  updateLogoTriggerText(logoFile || '');

  if (!logoFile) {
    setState({ logo: null });
    updateLogoUI();
    renderer.render();
    return;
  }

  // Пробуем найти логотип в структуре или загрузить напрямую
  let logoInfo = null;
  
  // Сначала проверяем в AVAILABLE_LOGOS (если есть)
  if (AVAILABLE_LOGOS && AVAILABLE_LOGOS.length > 0) {
    logoInfo = AVAILABLE_LOGOS.find((logo) => logo.file === logoFile);
  }
  
  // Если не нашли, пробуем загрузить напрямую по пути
  // (файл может существовать, даже если его нет в структуре)
  if (!logoInfo) {
    // Создаем объект с информацией о логотипе из пути
    const pathParts = logoFile.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const nameWithoutExt = fileName.replace(/\.(svg|png)$/, '');
    const displayName = nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1).replace(/_/g, ' ');
    logoInfo = { file: logoFile, name: displayName };
  }

  try {
    const img = await loadImage(logoInfo.file);
    setState({ logo: img });
    if (dom.logoSelect) dom.logoSelect.value = logoFile;
    updateLogoUI();
    renderer.render();
  } catch (error) {
    console.error(error);
    alert('Не удалось загрузить логотип.');
    setState({ logo: null });
    updateLogoUI();
    renderer.render();
  }
};

export const selectFontFamily = (fontFamily) => {
  const font = AVAILABLE_FONTS.find((item) => item.family === fontFamily);
  setState({ fontFamily, fontFamilyFile: font?.file || null });
  clearTextMeasurementCache();
  renderer.render();
};

// Функции для загрузки пользовательских шрифтов
const loadCustomFont = async (file, fontType) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const blob = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      // Определяем формат шрифта
      let format = 'woff2';
      if (file.name.endsWith('.woff')) format = 'woff';
      else if (file.name.endsWith('.ttf')) format = 'truetype';
      else if (file.name.endsWith('.otf')) format = 'opentype';
      
      // Создаем уникальное имя для шрифта
      const fontName = `CustomFont_${fontType}_${Date.now()}`;
      
      // Создаем @font-face правило
      const style = document.createElement('style');
      style.id = `font-face-${fontType}`;
      style.textContent = `
        @font-face {
          font-family: '${fontName}';
          src: url('${url}') format('${format}');
          font-display: swap;
        }
      `;
      
      // Удаляем старое правило, если есть
      const oldStyle = document.getElementById(`font-face-${fontType}`);
      if (oldStyle) {
        oldStyle.remove();
        // Освобождаем старый URL
        const state = getState();
        const oldUrl = state[`${fontType}CustomFont`];
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
        }
      }
      
      document.head.appendChild(style);
      
      resolve({ url, fontName, fileName: file.name });
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const handleTitleFontUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const { url, fontName, fileName } = await loadCustomFont(file, 'title');
    setState({
      titleCustomFont: url,
      titleCustomFontName: fileName,
      titleFontFamily: fontName
    });
    updateCustomFontInfo('title', fileName);
    clearTextMeasurementCache();
    renderer.render();
  } catch (error) {
    console.error('Ошибка загрузки шрифта:', error);
    alert('Ошибка загрузки шрифта');
  }
  
  // Сбрасываем input
  event.target.value = '';
};

export const handleSubtitleFontUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const { url, fontName, fileName } = await loadCustomFont(file, 'subtitle');
    setState({
      subtitleCustomFont: url,
      subtitleCustomFontName: fileName,
      subtitleFontFamily: fontName
    });
    updateCustomFontInfo('subtitle', fileName);
    clearTextMeasurementCache();
    renderer.render();
  } catch (error) {
    console.error('Ошибка загрузки шрифта:', error);
    alert('Ошибка загрузки шрифта');
  }
  
  event.target.value = '';
};

export const handleLegalFontUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const { url, fontName, fileName } = await loadCustomFont(file, 'legal');
    setState({
      legalCustomFont: url,
      legalCustomFontName: fileName,
      legalFontFamily: fontName
    });
    updateCustomFontInfo('legal', fileName);
    clearTextMeasurementCache();
    renderer.render();
  } catch (error) {
    console.error('Ошибка загрузки шрифта:', error);
    alert('Ошибка загрузки шрифта');
  }
  
  event.target.value = '';
};

export const handleAgeFontUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const { url, fontName, fileName } = await loadCustomFont(file, 'age');
    setState({
      ageCustomFont: url,
      ageCustomFontName: fileName,
      ageFontFamily: fontName
    });
    updateCustomFontInfo('age', fileName);
    clearTextMeasurementCache();
    renderer.render();
  } catch (error) {
    console.error('Ошибка загрузки шрифта:', error);
    alert('Ошибка загрузки шрифта');
  }
  
  event.target.value = '';
};

// Функции для очистки кастомных шрифтов
export const clearTitleCustomFont = () => {
  const state = getState();
  if (state.titleCustomFont) {
    URL.revokeObjectURL(state.titleCustomFont);
  }
  const style = document.getElementById('font-face-title');
  if (style) style.remove();
  
  setState({
    titleCustomFont: null,
    titleCustomFontName: null,
    titleFontFamily: 'YS Text',
    titleFontFamilyFile: null
  });
  updateCustomFontInfo('title', null);
  clearTextMeasurementCache();
  renderer.render();
};

export const clearSubtitleCustomFont = () => {
  const state = getState();
  if (state.subtitleCustomFont) {
    URL.revokeObjectURL(state.subtitleCustomFont);
  }
  const style = document.getElementById('font-face-subtitle');
  if (style) style.remove();
  
  setState({
    subtitleCustomFont: null,
    subtitleCustomFontName: null,
    subtitleFontFamily: 'YS Text',
    subtitleFontFamilyFile: null
  });
  updateCustomFontInfo('subtitle', null);
  clearTextMeasurementCache();
  renderer.render();
};

export const clearLegalCustomFont = () => {
  const state = getState();
  if (state.legalCustomFont) {
    URL.revokeObjectURL(state.legalCustomFont);
  }
  const style = document.getElementById('font-face-legal');
  if (style) style.remove();
  
  setState({
    legalCustomFont: null,
    legalCustomFontName: null,
    legalFontFamily: 'YS Text',
    legalFontFamilyFile: null
  });
  updateCustomFontInfo('legal', null);
  clearTextMeasurementCache();
  renderer.render();
};

export const clearAgeCustomFont = () => {
  const state = getState();
  if (state.ageCustomFont) {
    URL.revokeObjectURL(state.ageCustomFont);
  }
  const style = document.getElementById('font-face-age');
  if (style) style.remove();
  
  setState({
    ageCustomFont: null,
    ageCustomFontName: null,
    ageFontFamily: 'YS Text',
    ageFontFamilyFile: null
  });
  updateCustomFontInfo('age', null);
  clearTextMeasurementCache();
  renderer.render();
};

// Функция для обновления UI информации о кастомном шрифте
const updateCustomFontInfo = (fontType, fileName) => {
  const infoDiv = document.getElementById(`${fontType}CustomFontInfo`);
  const nameSpan = document.getElementById(`${fontType}CustomFontName`);
  
  if (infoDiv && nameSpan) {
    if (fileName) {
      infoDiv.style.display = 'block';
      nameSpan.textContent = fileName;
    } else {
      infoDiv.style.display = 'none';
      nameSpan.textContent = '';
    }
  }
};

// Обновляем функции выбора шрифтов, чтобы они очищали кастомные шрифты при выборе стандартного
export const selectTitleFontFamily = (fontFamily) => {
  const state = getState();
  // Если выбираем стандартный шрифт (не кастомный), очищаем кастомный
  if (!fontFamily.startsWith('CustomFont_') && state.titleCustomFont) {
    URL.revokeObjectURL(state.titleCustomFont);
    const style = document.getElementById('font-face-title');
    if (style) style.remove();
  }
  
  const font = AVAILABLE_FONTS.find((item) => item.family === fontFamily);
  setState({ 
    titleFontFamily: fontFamily, 
    titleFontFamilyFile: font?.file || null,
    titleCustomFont: fontFamily.startsWith('CustomFont_') ? state.titleCustomFont : null,
    titleCustomFontName: fontFamily.startsWith('CustomFont_') ? state.titleCustomFontName : null
  });
  if (!fontFamily.startsWith('CustomFont_')) {
    updateCustomFontInfo('title', null);
  }
  clearTextMeasurementCache();
  renderer.render();
};

export const selectSubtitleFontFamily = (fontFamily) => {
  const state = getState();
  if (!fontFamily.startsWith('CustomFont_') && state.subtitleCustomFont) {
    URL.revokeObjectURL(state.subtitleCustomFont);
    const style = document.getElementById('font-face-subtitle');
    if (style) style.remove();
  }
  
  const font = AVAILABLE_FONTS.find((item) => item.family === fontFamily);
  setState({ 
    subtitleFontFamily: fontFamily, 
    subtitleFontFamilyFile: font?.file || null,
    subtitleCustomFont: fontFamily.startsWith('CustomFont_') ? state.subtitleCustomFont : null,
    subtitleCustomFontName: fontFamily.startsWith('CustomFont_') ? state.subtitleCustomFontName : null
  });
  if (!fontFamily.startsWith('CustomFont_')) {
    updateCustomFontInfo('subtitle', null);
  }
  clearTextMeasurementCache();
  renderer.render();
};

export const selectLegalFontFamily = (fontFamily) => {
  const state = getState();
  if (!fontFamily.startsWith('CustomFont_') && state.legalCustomFont) {
    URL.revokeObjectURL(state.legalCustomFont);
    const style = document.getElementById('font-face-legal');
    if (style) style.remove();
  }
  
  const font = AVAILABLE_FONTS.find((item) => item.family === fontFamily);
  setState({ 
    legalFontFamily: fontFamily, 
    legalFontFamilyFile: font?.file || null,
    legalCustomFont: fontFamily.startsWith('CustomFont_') ? state.legalCustomFont : null,
    legalCustomFontName: fontFamily.startsWith('CustomFont_') ? state.legalCustomFontName : null
  });
  if (!fontFamily.startsWith('CustomFont_')) {
    updateCustomFontInfo('legal', null);
  }
  clearTextMeasurementCache();
  renderer.render();
};

export const selectAgeFontFamily = (fontFamily) => {
  const state = getState();
  if (!fontFamily.startsWith('CustomFont_') && state.ageCustomFont) {
    URL.revokeObjectURL(state.ageCustomFont);
    const style = document.getElementById('font-face-age');
    if (style) style.remove();
  }
  
  const font = AVAILABLE_FONTS.find((item) => item.family === fontFamily);
  setState({ 
    ageFontFamily: fontFamily, 
    ageFontFamilyFile: font?.file || null,
    ageCustomFont: fontFamily.startsWith('CustomFont_') ? state.ageCustomFont : null,
    ageCustomFontName: fontFamily.startsWith('CustomFont_') ? state.ageCustomFontName : null
  });
  if (!fontFamily.startsWith('CustomFont_')) {
    updateCustomFontInfo('age', null);
  }
  clearTextMeasurementCache();
  renderer.render();
};

const updateTitleAlignToggle = (align) => {
  const toggle = document.getElementById('titleAlignToggle');
  if (!toggle) return;
  
  // Проверяем, видим ли раздел с этим тумблером
  const panelSection = toggle.closest('.panel-section');
  if (panelSection && !panelSection.classList.contains('active')) {
    // Раздел скрыт, не обновляем визуально, только сохраняем значение
    toggle.setAttribute('data-value', align);
    return;
  }
  
  // Устанавливаем значение выключки
  toggle.setAttribute('data-value', align);
  
  // Обновляем опции
  const options = toggle.querySelectorAll('.toggle-switch-option');
  options.forEach(option => {
    if (option.dataset.value === align) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
  
  // Принудительно обновляем CSS для слайдера (3 опции)
  // Используем точный расчет на основе реальных размеров
  const slider = toggle.querySelector('.toggle-switch-slider');
  const track = toggle.querySelector('.toggle-switch-track');
  if (slider && track) {
    // Ждем один кадр для получения актуальных размеров
    requestAnimationFrame(() => {
      const trackWidth = track.offsetWidth;
      const sliderWidth = slider.offsetWidth;
      const sectionWidth = trackWidth / 3;
      const initialLeft = 4; // padding контейнера
      
      // Рассчитываем позицию: начало нужной секции минус начальная позиция слайдера
      if (align === 'center') {
        // Позиция начала второй секции: sectionWidth
        // Нужно сдвинуть на: sectionWidth - initialLeft
        const translateX = sectionWidth - initialLeft;
        slider.style.transform = `translateX(${translateX}px)`;
      } else if (align === 'right') {
        // Позиция начала третьей секции: sectionWidth * 2
        // Нужно сдвинуть на: sectionWidth * 2 - initialLeft
        const translateX = sectionWidth * 2 - initialLeft;
        slider.style.transform = `translateX(${translateX}px)`;
      } else {
        // Позиция начала первой секции: 0, но слайдер уже на left: 4px
        // Нужно вернуть в исходную позицию (left уже задан в CSS)
        slider.style.transform = 'translateX(0)';
      }
    });
  }
};

const updateTitleVPosToggle = (vPos) => {
  const toggle = document.getElementById('titleVPosToggle');
  if (!toggle) return;
  
  // Проверяем, видим ли раздел с этим тумблером
  const panelSection = toggle.closest('.panel-section');
  if (panelSection && !panelSection.classList.contains('active')) {
    // Раздел скрыт, не обновляем визуально, только сохраняем значение
    toggle.setAttribute('data-value', vPos);
    return;
  }
  
  // Устанавливаем значение позиции
  toggle.setAttribute('data-value', vPos);
  
  // Обновляем опции
  const options = toggle.querySelectorAll('.toggle-switch-option');
  options.forEach(option => {
    if (option.dataset.value === vPos) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
  
  // Принудительно обновляем CSS для слайдера (3 опции)
  // Используем точный расчет на основе реальных размеров
  const slider = toggle.querySelector('.toggle-switch-slider');
  const track = toggle.querySelector('.toggle-switch-track');
  if (slider && track) {
    // Ждем один кадр для получения актуальных размеров
    requestAnimationFrame(() => {
      const trackWidth = track.offsetWidth;
      const sliderWidth = slider.offsetWidth;
      const sectionWidth = trackWidth / 3;
      const initialLeft = 4; // padding контейнера
      
      // Рассчитываем позицию: начало нужной секции минус начальная позиция слайдера
      if (vPos === 'center') {
        // Позиция начала второй секции: sectionWidth
        // Нужно сдвинуть на: sectionWidth - initialLeft
        const translateX = sectionWidth - initialLeft;
        slider.style.transform = `translateX(${translateX}px)`;
      } else if (vPos === 'bottom') {
        // Позиция начала третьей секции: sectionWidth * 2
        // Нужно сдвинуть на: sectionWidth * 2 - initialLeft
        const translateX = sectionWidth * 2 - initialLeft;
        slider.style.transform = `translateX(${translateX}px)`;
      } else {
        // Позиция начала первой секции: 0, но слайдер уже на left: 4px
        // Нужно вернуть в исходную позицию (left уже задан в CSS)
        slider.style.transform = 'translateX(0)';
      }
    });
  }
};

export const toggleTitleAlign = () => {
  const toggle = document.getElementById('titleAlignToggle');
  if (!toggle) return;
  
  const currentValue = toggle.getAttribute('data-value') || 'left';
  let newValue;
  
  // Циклическое переключение: left -> center -> right -> left
  if (currentValue === 'left') {
    newValue = 'center';
  } else if (currentValue === 'center') {
    newValue = 'right';
  } else {
    newValue = 'left';
  }
  
  // Сразу обновляем визуальное состояние тумблера
  updateTitleAlignToggle(newValue);
  
  // Затем обновляем состояние приложения
  selectTitleAlign(newValue);
};

export const toggleTitleVPos = () => {
  const toggle = document.getElementById('titleVPosToggle');
  if (!toggle) return;
  
  const currentValue = toggle.getAttribute('data-value') || 'top';
  let newValue;
  
  // Циклическое переключение: top -> center -> bottom -> top
  if (currentValue === 'top') {
    newValue = 'center';
  } else if (currentValue === 'center') {
    newValue = 'bottom';
  } else {
    newValue = 'top';
  }
  
  // Сразу обновляем визуальное состояние тумблера
  updateTitleVPosToggle(newValue);
  
  // Затем обновляем состояние приложения
  selectTitleVPos(newValue);
};

export const selectTitleAlign = (align) => {
  setKey('titleAlign', align);
  updateTitleAlignToggle(align);
  renderer.render();
};

export const selectTitleVPos = (vPos) => {
  setKey('titleVPos', vPos);
  updateTitleVPosToggle(vPos);
  renderer.render();
};

export const selectLogoPos = (pos) => {
  setKey('logoPos', pos);
  updateLogoPosToggle(pos);
  renderer.render();
};

const updateLogoToggle = (language) => {
  const toggle = document.getElementById('logoLangToggle');
  if (!toggle) return;
  
  // Устанавливаем значение языка
  toggle.setAttribute('data-value', language);
  
  // Обновляем опции
  const options = toggle.querySelectorAll('.toggle-switch-option');
  options.forEach(option => {
    if (option.dataset.value === language) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
  
  // Принудительно обновляем CSS для слайдера
  const slider = toggle.querySelector('.toggle-switch-slider');
  if (slider) {
    if (language === 'kz') {
      slider.style.transform = 'translateX(100%)';
    } else {
      slider.style.transform = 'translateX(0)';
    }
  }
  
  // Также обновляем класс на самом тумблере для CSS селектора
  toggle.classList.remove('lang-ru', 'lang-kz');
  toggle.classList.add(`lang-${language}`);
};

const updateLogoPosToggle = (pos) => {
  const toggle = document.getElementById('logoPosToggle');
  if (!toggle) return;
  
  // Проверяем, видим ли раздел с этим тумблером
  const panelSection = toggle.closest('.panel-section');
  if (panelSection && !panelSection.classList.contains('active')) {
    // Раздел скрыт, не обновляем визуально, только сохраняем значение
    toggle.setAttribute('data-value', pos);
    return;
  }
  
  // Устанавливаем значение позиции
  toggle.setAttribute('data-value', pos);
  
  // Обновляем опции
  const options = toggle.querySelectorAll('.toggle-switch-option');
  options.forEach(option => {
    if (option.dataset.value === pos) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
  
  // Принудительно обновляем CSS для слайдера
  const slider = toggle.querySelector('.toggle-switch-slider');
  if (slider) {
    if (pos === 'center') {
      slider.style.transform = 'translateX(100%)';
    } else {
      slider.style.transform = 'translateX(0)';
    }
  }
};

export const toggleLogoPos = () => {
  const state = getState();
  const currentPos = state.logoPos || 'left';
  const newPos = currentPos === 'left' ? 'center' : 'left';
  selectLogoPos(newPos);
};

export const toggleLogoLanguage = async () => {
  const toggle = document.getElementById('logoLangToggle');
  if (!toggle) return;
  
  const currentLang = toggle.getAttribute('data-value') || 'ru';
  const newLang = currentLang === 'ru' ? 'kz' : 'ru';
  
  // Сразу обновляем визуальное состояние тумблера
  updateLogoToggle(newLang);
  
  // Затем обновляем состояние приложения
  await selectLogoLanguage(newLang);
};

export const selectLogoLanguage = async (language) => {
  const state = getState();
  setKey('logoLanguage', language);
  updateChipGroup('logo-lang', language);
  
  // Обновляем тумблер сразу, чтобы визуально было видно изменение
  updateLogoToggle(language);
  
  // Если есть выбранный логотип, обновляем его путь на новый язык
  if (state.logoSelected && state.logoSelected.startsWith('logo/')) {
    const parts = state.logoSelected.split('/');
    if (parts.length >= 4 && (parts[1] === 'black' || parts[1] === 'white')) {
      const targetFolder = parts[1]; // black или white
      const logoType = parts[3]; // main.svg, main_mono.svg, long.svg
      const newLogoPath = `logo/${targetFolder}/${language}/${logoType}`;
      
      // Обновляем логотип на новый язык
      await selectPreloadedLogo(newLogoPath);
      
      // После загрузки логотипа снова обновляем тумблер (на случай, если что-то сбросилось)
      updateLogoToggle(language);
    }
  }
  
  // Если модальное окно открыто, обновляем колонки
  const logoModalOverlay = document.getElementById('logoSelectModalOverlay');
  if (logoModalOverlay && logoModalOverlay.style.display === 'block') {
    // Перерисовываем колонки с учетом нового языка
    const cachedStructure = cachedLogosStructure;
    if (cachedStructure) {
      // Сбрасываем выбранные папки для перерисовки
      selectedLogoFolder1 = null;
      selectedLogoFolder2 = null;
      selectedLogoFolder3 = null;
      renderLogoColumn1(cachedStructure);
    }
  }
  
  // Финальное обновление тумблера для надежности
  updateLogoToggle(language);
  
  renderer.render();
};

export const selectLayoutMode = (mode) => {
  setKey('layoutMode', mode);
  updateChipGroup('layout-mode', mode);
  updateLayoutPreviewMock();
  renderer.render();
};

export const updatePadding = (value) => {
  const numeric = parseInt(value, 10);
  setKey('paddingPercent', numeric);
  const dom = getDom();
  dom.paddingValue.textContent = `${numeric}%`;
  renderer.render();
};

export const updateLogoSize = (value) => {
  const numeric = parseInt(value, 10);
  setKey('logoSize', numeric);
  const dom = getDom();
  dom.logoSizeValue.textContent = `${numeric}%`;
  renderer.render();
};

export const updateTitleSize = (value) => {
  const numeric = parseFloat(value);
  setKey('titleSize', numeric);
  const dom = getDom();
  if (dom.titleSizeValue) {
    dom.titleSizeValue.textContent = `${numeric}%`;
  }
  renderer.render();
};

export const updateSubtitleSize = (value) => {
  const numeric = parseFloat(value);
  setKey('subtitleSize', numeric);
  const dom = getDom();
  if (dom.subtitleSizeValue) {
    dom.subtitleSizeValue.textContent = `${numeric}%`;
  }
  renderer.render();
};

export const updateLegalSize = (value) => {
  const numeric = parseFloat(value);
  setKey('legalSize', numeric);
  const dom = getDom();
  if (dom.legalSizeValue) {
    dom.legalSizeValue.textContent = `${numeric}%`;
  }
  renderer.render();
};

export const updateAgeSize = (value) => {
  const numeric = parseFloat(value);
  setKey('ageSize', numeric);
  const dom = getDom();
  if (dom.ageSizeValue) {
    dom.ageSizeValue.textContent = `${numeric}%`;
  }
  renderer.render();
};

export const updateKVBorderRadius = (value) => {
  const numeric = parseInt(value, 10);
  setKey('kvBorderRadius', numeric);
  const dom = getDom();
  if (dom.kvBorderRadiusValue) {
    dom.kvBorderRadiusValue.textContent = `${numeric}%`;
  }
  renderer.render();
};

export const updateLegalOpacity = (value) => {
  const numeric = parseInt(value, 10);
  setKey('legalOpacity', numeric);
  const dom = getDom();
  dom.legalOpacityValue.textContent = `${numeric}%`;
  renderer.render();
};

export const updateSubtitleOpacity = (value) => {
  const numeric = parseInt(value, 10);
  setKey('subtitleOpacity', numeric);
  const dom = getDom();
  dom.subtitleOpacityValue.textContent = `${numeric}%`;
  renderer.render();
};

export const showSection = (sectionId) => {
  // Скрываем все разделы
  document.querySelectorAll('.panel-section').forEach((section) => {
    section.classList.remove('active');
  });
  
  // Показываем выбранный раздел
  const targetSection = document.getElementById(`panel-section-${sectionId}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  // Обновляем активный таб
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.remove('active');
  });
  
  const targetTab = document.querySelector(`[data-section="${sectionId}"]`);
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  // После переключения раздела обновляем тумблеры, если они теперь видимы
  const state = getState();
  if (sectionId === 'title') {
    // Используем requestAnimationFrame для обновления после рендеринга
    requestAnimationFrame(() => {
      updateTitleAlignToggle(state.titleAlign || 'left');
      updateTitleVPosToggle(state.titleVPos || 'top');
    });
  }
};

export const initializeTabs = () => {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    const sectionId = tab.dataset.section;
    if (sectionId) {
      // Удаляем старый onclick и добавляем обработчик события
      tab.removeAttribute('onclick');
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        showSection(sectionId);
      });
    }
  });
};

export const toggleSection = (sectionId) => {
  const contentEl = document.getElementById(`content-${sectionId}`);
  const arrowEl = document.getElementById(`arrow-${sectionId}`);
  if (contentEl && arrowEl) {
    const isCollapsed = contentEl.classList.contains('collapsed');
    contentEl.classList.toggle('collapsed');
    arrowEl.classList.toggle('collapsed');
    // Обновляем символ стрелки
    if (isCollapsed) {
      arrowEl.textContent = '▼';
    } else {
      arrowEl.textContent = '▶';
    }
  }
};

// Нормализует цвет: приводит к верхнему регистру и добавляет # если нужно
const normalizeColor = (color) => {
  let normalized = color.toUpperCase().trim();
  if (!normalized.startsWith('#')) {
    normalized = '#' + normalized;
  }
  
  // Преобразуем короткую форму в полную (#FFF -> #FFFFFF)
  if (normalized.length === 4) {
    normalized = '#' + normalized[1] + normalized[1] + normalized[2] + normalized[2] + normalized[3] + normalized[3];
  }
  
  return normalized;
};

// Автоматически выбирает логотип на основе цвета текста
const autoSelectLogoByTextColor = async (textColor) => {
  const normalizedColor = normalizeColor(textColor);
  const state = getState();
  const currentLogo = state.logoSelected || '';
  
  // Определяем, какую папку использовать
  let targetFolder = null;
  if (normalizedColor === '#1E1E1E') {
    targetFolder = 'black';
  } else if (normalizedColor === '#FFFFFF') {
    targetFolder = 'white';
  }
  
  // Если цвет не соответствует ни black, ни white, не меняем логотип
  if (!targetFolder) {
    return;
  }
  
  // Используем выбранный язык из состояния
  const language = state.logoLanguage || 'ru';
  let logoType = 'main.svg'; // по умолчанию
  
  // Парсим текущий путь логотипа: logo/{black|white}/{язык}/{тип}
  if (currentLogo && currentLogo.startsWith('logo/')) {
    const parts = currentLogo.split('/');
    if (parts.length >= 4 && (parts[1] === 'black' || parts[1] === 'white')) {
      logoType = parts[3]; // main.svg, main_mono.svg, long.svg
    }
  }
  
  // Формируем новый путь к логотипу
  const newLogoPath = `logo/${targetFolder}/${language}/${logoType}`;
  
  // Если путь не изменился, не обновляем
  if (newLogoPath === currentLogo) {
    return;
  }
  
  // Выбираем новый логотип
  await selectPreloadedLogo(newLogoPath);
};

const updateTextColorsForBg = async (bgColor) => {
  const dom = getDom();
  const normalizedBg = normalizeColor(bgColor);
  
  // Определяем цвет текста на основе цвета фона
  // Темный текст (#1E1E1E) для светлых/ярких фонов:
  // #98D2FE, #FFD20A, #FFFFFF
  // Белый текст (#FFFFFF) для темных/насыщенных фонов:
  // #027EF2, #07AB4B, #E84033, #FF6C26, #726BFF, #1E1E1E
  
  let textColor = null;
  
  if (normalizedBg === '#98D2FE' || normalizedBg === '#FFD20A' || normalizedBg === '#FFFFFF') {
    // Светлые/яркие фоны - темный текст
    textColor = '#1E1E1E';
  } else if (
    normalizedBg === '#027EF2' ||
    normalizedBg === '#07AB4B' ||
    normalizedBg === '#E84033' ||
    normalizedBg === '#FF6C26' ||
    normalizedBg === '#726BFF' ||
    normalizedBg === '#1E1E1E'
  ) {
    // Темные/насыщенные фоны - белый текст
    textColor = '#FFFFFF';
  }
  
  // Если цвет фона соответствует одному из предустановленных, обновляем цвета текста
  if (textColor) {
    setKey('titleColor', textColor);
    setKey('subtitleColor', textColor);
    setKey('legalColor', textColor);
    if (dom.titleColor) dom.titleColor.value = textColor;
    if (dom.titleColorHex) dom.titleColorHex.value = textColor;
    if (dom.subtitleColor) dom.subtitleColor.value = textColor;
    if (dom.subtitleColorHex) dom.subtitleColorHex.value = textColor;
    if (dom.legalColor) dom.legalColor.value = textColor;
    if (dom.legalColorHex) dom.legalColorHex.value = textColor;
    // Автоматически выбираем соответствующий логотип
    await autoSelectLogoByTextColor(textColor);
  }
};

export const updateColorFromPicker = async (key, value) => {
  setKey(key, value);
  const dom = getDom();
  const hexInput = dom[`${key}Hex`];
  if (hexInput) hexInput.value = value;
  if (key === 'bgColor') {
    await updateTextColorsForBg(value);
  }
  // Автоматически выбираем логотип на основе цвета текста
  if (key === 'titleColor' || key === 'subtitleColor') {
    await autoSelectLogoByTextColor(value);
  }
  renderer.render();
};

export const updateColorFromHex = async (key, value) => {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const dom = getDom();
  if (hexPattern.test(value)) {
    setKey(key, value);
    const colorInput = dom[key];
    if (colorInput) colorInput.value = value;
    if (key === 'bgColor') {
      await updateTextColorsForBg(value);
    }
    // Автоматически выбираем логотип на основе цвета текста
    if (key === 'titleColor' || key === 'subtitleColor') {
      await autoSelectLogoByTextColor(value);
    }
    renderer.render();
  } else {
    const hexInput = dom[`${key}Hex`];
    if (hexInput) {
      hexInput.style.borderColor = '#ff4444';
      setTimeout(() => {
        hexInput.style.borderColor = '';
        hexInput.value = getState()[key];
      }, 1000);
    }
  }
};

export const applyPresetBgColor = async (color) => {
  const dom = getDom();
  setKey('bgColor', color);
  if (dom.bgColor) dom.bgColor.value = color;
  if (dom.bgColorHex) dom.bgColorHex.value = color;
  await updateTextColorsForBg(color);
  renderer.render();
};

export const changePreviewSize = (index) => {
  renderer.setCurrentIndex(Number(index) || 0);
};

export const changePreviewSizeCategory = (category, index) => {
  renderer.setCategoryIndex(category, Number(index) || 0);
};

export const togglePlatform = (platform) => {
  const sizesEl = document.getElementById(`sizes-${platform}`);
  const arrowEl = document.getElementById(`arrow-${platform}`);
  if (sizesEl) {
    sizesEl.classList.toggle('collapsed');
    const isCollapsed = sizesEl.classList.contains('collapsed');
    if (arrowEl) {
      arrowEl.classList.toggle('collapsed');
      arrowEl.textContent = isCollapsed ? '▶' : '▼';
    }
  }
};

export const toggleSize = (platform, index) => {
  togglePresetSize(platform, index);
  updatePreviewSizeSelect();
  updateSizesSummary();
  renderer.render();
};

export const toggleCustomSizeAction = (id) => {
  toggleCustomSize(id);
  updatePreviewSizeSelect();
  updateSizesSummary();
  renderer.render();
};

export const removeCustomSizeAction = (id) => {
  removeCustomSize(id);
  renderPresetSizes();
  updatePreviewSizeSelect();
  updateSizesSummary();
  renderer.render();
};

export const addCustomSizeAction = (width, height) => {
  if (!width || !height || width <= 0 || height <= 0) {
    alert('Пожалуйста, введите корректные значения ширины и высоты');
    return;
  }
  addCustomSize(width, height);
  renderPresetSizes();
  updatePreviewSizeSelect();
  updateSizesSummary();
  renderer.render();
};

export const addCustomSizeFromInput = () => {
  const widthInput = document.getElementById('customWidth');
  const heightInput = document.getElementById('customHeight');
  
  if (!widthInput || !heightInput) return;
  
  const width = parseInt(widthInput.value, 10);
  const height = parseInt(heightInput.value, 10);
  
  if (!width || !height || width <= 0 || height <= 0) {
    alert('Пожалуйста, введите корректные значения ширины и высоты');
    return;
  }
  
  addCustomSizeAction(width, height);
  
  // Очищаем поля ввода
  widthInput.value = '';
  heightInput.value = '';
};

export const handlePresetContainerClick = (event) => {
  const header = event.target.closest('.platform-header');
  if (header) {
    const platform = header.dataset.platform;
    togglePlatform(platform);
    return;
  }

  const checkbox = event.target.closest('input[type="checkbox"]');
  if (checkbox) {
    if (checkbox.dataset.platform) {
      // Обычный размер
      toggleSize(checkbox.dataset.platform, Number(checkbox.dataset.index));
    } else if (checkbox.dataset.customId) {
      // Кастомный размер
      toggleCustomSizeAction(checkbox.dataset.customId);
    }
  }
};

export const selectAllSizesAction = () => {
  selectAllPresetSizes();
  renderPresetSizes();
  updatePreviewSizeSelect();
  renderer.render();
};

export const deselectAllSizesAction = () => {
  deselectAllPresetSizes();
  renderPresetSizes();
  updatePreviewSizeSelect();
  renderer.render();
};

export const saveSettings = () => {
  savedSettings = saveSettingsSnapshot();
  alert('Настройки сохранены (изображения исключены, выбор пресетов сохранён)');
};

export const loadSettings = () => {
  if (!savedSettings) {
    alert('Нет сохранённых настроек.');
    return;
  }

  const current = getState();
  const currentLogo = current.logo;
  const currentKV = current.kv;
  const currentBg = current.bgImage;

  applySavedSettings(savedSettings);
  ensurePresetSelection();
  setState({ logo: currentLogo, kv: currentKV, bgImage: currentBg });

  syncFormFields();
  renderPresetSizes();
  updatePreviewSizeSelect();
  updateLogoUI();
  updateKVUI();
  updateBgUI();
  renderer.render();

  alert('Настройки загружены!');
};

export const resetAll = () => {
  if (!confirm('Сбросить все настройки к значениям по умолчанию?')) return;
  resetState();
  ensurePresetSelection();
  initializeLogoDropdown();
  initializeFontDropdown();
  syncFormFields();
  renderPresetSizes();
  updatePreviewSizeSelect();
  updateLogoUI();
  updateKVUI();
  updateBgUI();
  renderer.render();
};

// Кэш для отсканированных логотипов (структурированный)
let cachedLogosStructure = null;
let logosScanning = false;

let selectedLogoFolder1 = null;
let selectedLogoFolder2 = null;
let selectedLogoFolder3 = null;

const renderLogoColumn1 = (allLogos) => {
  const column1 = document.getElementById('logoFolder1Column');
  if (!column1) {
    console.error('logoFolder1Column not found');
    return;
  }
  
  column1.innerHTML = '';
  const folders1 = Object.keys(allLogos || {}).sort();
  
  if (folders1.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.textContent = 'Логотипы не найдены';
    emptyMsg.className = 'column-empty-message';
    column1.appendChild(emptyMsg);
    return;
  }
  
  folders1.forEach((folder1) => {
    const item = document.createElement('div');
    item.className = 'column-item logo-folder1-item';
    item.dataset.folder1 = folder1;
    item.textContent = folder1;
    
    item.addEventListener('click', () => {
      selectedLogoFolder1 = folder1;
      selectedLogoFolder2 = null;
      selectedLogoFolder3 = null;
      // Обновляем стили
      document.querySelectorAll('.logo-folder1-item').forEach(el => {
        el.classList.remove('active');
      });
      item.classList.add('active');
      
      // Обновляем вторую колонку
      renderLogoColumn2(allLogos);
      // Очищаем колонки
      const column3 = document.getElementById('logoFolder3Column');
      const column4 = document.getElementById('logoImagesColumn');
      if (column3) {
        column3.innerHTML = '';
        column3.style.display = 'none';
      }
      if (column4) {
        column4.innerHTML = '';
      }
    });
    
    column1.appendChild(item);
  });
  
  // Выбираем первую папку по умолчанию
  if (folders1.length > 0 && !selectedLogoFolder1) {
    selectedLogoFolder1 = folders1[0];
    const firstItem = column1.querySelector(`[data-folder1="${folders1[0]}"]`);
    if (firstItem) {
      firstItem.classList.add('active');
      // Сбрасываем выбранные подпапки
      selectedLogoFolder2 = null;
      selectedLogoFolder3 = null;
      renderLogoColumn2(allLogos);
    }
  }
};

const renderLogoColumn2 = (allLogos) => {
  const column2 = document.getElementById('logoFolder2Column');
  const column3 = document.getElementById('logoFolder3Column');
  if (!column2 || !selectedLogoFolder1) return;
  
  column2.innerHTML = '';
  const folders2 = Object.keys(allLogos[selectedLogoFolder1] || {}).sort();
  
  folders2.forEach((folder2) => {
    const item = document.createElement('div');
    item.className = 'column-item logo-folder2-item';
    item.dataset.folder2 = folder2;
    // Показываем "root" как пустую строку или скрываем
    item.textContent = folder2 === 'root' ? '—' : folder2;
    
    item.addEventListener('click', () => {
      selectedLogoFolder2 = folder2;
      selectedLogoFolder3 = null;
      // Обновляем стили
      document.querySelectorAll('.logo-folder2-item').forEach(el => {
        el.classList.remove('active');
      });
      item.classList.add('active');
      
      const folder2Data = allLogos[selectedLogoFolder1][selectedLogoFolder2];
      
      // Проверяем, является ли это трехуровневой структурой (объект) или массивом
      if (folder2Data && typeof folder2Data === 'object' && !Array.isArray(folder2Data)) {
        // Трехуровневая структура - показываем колонку 3
        if (column3) {
          column3.style.display = 'block';
        }
        renderLogoColumn3(allLogos);
      } else {
        // Двухуровневая структура - скрываем колонку 3 и показываем изображения
        if (column3) {
          column3.style.display = 'none';
        }
        const images = Array.isArray(folder2Data) ? folder2Data : [];
        
        // Фильтруем по языку, если выбран kz
        const state = getState();
        const selectedLanguage = state.logoLanguage || 'ru';
        const filteredImages = selectedLanguage === 'kz' 
          ? images.filter(logo => logo.file.includes(`/${selectedLanguage}/`))
          : images;
        
        renderLogoColumn4(filteredImages);
      }
      
      console.log('renderLogoColumn2 - folder2Data:', folder2Data, 'isArray:', Array.isArray(folder2Data));
    });
    
    column2.appendChild(item);
  });
  
  // Выбираем первую подпапку по умолчанию
  if (folders2.length > 0 && !selectedLogoFolder2) {
    selectedLogoFolder2 = folders2[0];
    const firstItem = column2.querySelector(`[data-folder2="${folders2[0]}"]`);
    if (firstItem) {
      firstItem.classList.add('active');
      const folder2Data = allLogos[selectedLogoFolder1][selectedLogoFolder2];
      if (folder2Data && typeof folder2Data === 'object' && !Array.isArray(folder2Data)) {
        if (column3) {
          column3.style.display = 'block';
        }
        renderLogoColumn3(allLogos);
      } else {
        if (column3) {
          column3.style.display = 'none';
        }
        const images = Array.isArray(folder2Data) ? folder2Data : [];
        
        // Фильтруем по языку, если выбран kz
        const state = getState();
        const selectedLanguage = state.logoLanguage || 'ru';
        const filteredImages = selectedLanguage === 'kz' 
          ? images.filter(logo => logo.file.includes(`/${selectedLanguage}/`))
          : images;
        
        renderLogoColumn4(filteredImages);
      }
    }
  }
};

const renderLogoColumn3 = (allLogos) => {
  const column3 = document.getElementById('logoFolder3Column');
  if (!column3 || !selectedLogoFolder1 || !selectedLogoFolder2) return;
  
  column3.innerHTML = '';
  const folder2Data = allLogos[selectedLogoFolder1][selectedLogoFolder2];
  
  // Проверяем, является ли это трехуровневой структурой
  if (!folder2Data || typeof folder2Data !== 'object' || Array.isArray(folder2Data)) {
    return;
  }
  
  const state = getState();
  const selectedLanguage = state.logoLanguage || 'ru';
  
  // Фильтруем языки: если выбран kz, показываем только kz
  let folders3 = Object.keys(folder2Data).sort();
  if (selectedLanguage === 'kz') {
    folders3 = folders3.filter(folder => folder === 'kz');
  }
  
  folders3.forEach((folder3) => {
    const item = document.createElement('div');
    item.className = 'column-item logo-folder3-item';
    item.dataset.folder3 = folder3;
    item.textContent = folder3 === 'root' ? '—' : folder3.toUpperCase();
    
    item.addEventListener('click', () => {
      selectedLogoFolder3 = folder3;
      // Обновляем стили
      document.querySelectorAll('.logo-folder3-item').forEach(el => {
        el.classList.remove('active');
      });
      item.classList.add('active');
      
      // Обновляем четвертую колонку с изображениями
      const images = folder2Data[folder3] || [];
      renderLogoColumn4(images);
    });
    
    column3.appendChild(item);
  });
  
  // Выбираем первую подпапку по умолчанию
  if (folders3.length > 0 && !selectedLogoFolder3) {
    selectedLogoFolder3 = folders3[0];
    const firstItem = column3.querySelector(`[data-folder3="${folders3[0]}"]`);
    if (firstItem) {
      firstItem.classList.add('active');
      const images = folder2Data[selectedLogoFolder3] || [];
      renderLogoColumn4(images);
    }
  }
};

const renderLogoColumn4 = (images) => {
  const column4 = document.getElementById('logoImagesColumn');
  if (!column4) return;
  
  column4.innerHTML = '';
  
  const state = getState();
  const selectedLanguage = state.logoLanguage || 'ru';
  
  // Фильтруем логотипы по выбранному языку
  const filteredImages = images.filter((logo) => {
    if (selectedLanguage === 'kz') {
      // Если выбран kz, показываем только логотипы из папки kz
      return logo.file.includes(`/${selectedLanguage}/`);
    }
    // Если выбран ru, показываем все (ru, en, kz)
    return true;
  });
  
  filteredImages.forEach((logo) => {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'preview-item';
    
    const img = document.createElement('img');
    img.src = logo.file;
    img.alt = logo.name;
    
    imgContainer.appendChild(img);
    
    imgContainer.addEventListener('click', () => {
      selectPreloadedLogo(logo.file);
      // Закрываем модальное окно после выбора
      closeLogoSelectModal();
    });
    
    column4.appendChild(imgContainer);
  });
};

const buildLogoStructure = (scannedLogos) => {
  const logoStructure = {};
  
  // Добавляем AVAILABLE_LOGOS в структуру
  AVAILABLE_LOGOS.forEach(logo => {
    const pathParts = logo.file.split('/');
    if (pathParts.length >= 3 && pathParts[0] === 'logo') {
      const folder1 = pathParts[1];
      
      // Проверяем трехуровневую структуру (logo/folder1/folder2/folder3/file)
      if (pathParts.length === 5) {
        const folder2 = pathParts[2];
        const folder3 = pathParts[3];
        if (!logoStructure[folder1]) {
          logoStructure[folder1] = {};
        }
        if (!logoStructure[folder1][folder2]) {
          logoStructure[folder1][folder2] = {};
        }
        if (!logoStructure[folder1][folder2][folder3]) {
          logoStructure[folder1][folder2][folder3] = [];
        }
        if (!logoStructure[folder1][folder2][folder3].find(l => l.file === logo.file)) {
          logoStructure[folder1][folder2][folder3].push(logo);
        }
      }
      // Проверяем двухуровневую структуру (logo/folder1/folder2/file)
      else if (pathParts.length === 4) {
        const folder2 = pathParts[2];
        if (!logoStructure[folder1]) {
          logoStructure[folder1] = {};
        }
        if (!logoStructure[folder1][folder2]) {
          logoStructure[folder1][folder2] = [];
        }
        if (!logoStructure[folder1][folder2].find(l => l.file === logo.file)) {
          logoStructure[folder1][folder2].push(logo);
        }
      } else {
        // Одноуровневая структура (logo/folder1/file) - используем "root" как folder2
        if (!logoStructure[folder1]) {
          logoStructure[folder1] = {};
        }
        if (!logoStructure[folder1]['root']) {
          logoStructure[folder1]['root'] = [];
        }
        if (!logoStructure[folder1]['root'].find(l => l.file === logo.file)) {
          logoStructure[folder1]['root'].push(logo);
        }
      }
    }
  });
  
  // Добавляем отсканированные логотипы
  scannedLogos.forEach(logo => {
    const pathParts = logo.file.split('/');
    if (pathParts.length >= 3 && pathParts[0] === 'logo') {
      const folder1 = pathParts[1];
      
      // Проверяем трехуровневую структуру (logo/folder1/folder2/folder3/file)
      if (pathParts.length === 5) {
        const folder2 = pathParts[2];
        const folder3 = pathParts[3];
        if (!logoStructure[folder1]) {
          logoStructure[folder1] = {};
        }
        if (!logoStructure[folder1][folder2]) {
          logoStructure[folder1][folder2] = {};
        }
        if (!logoStructure[folder1][folder2][folder3]) {
          logoStructure[folder1][folder2][folder3] = [];
        }
        if (!logoStructure[folder1][folder2][folder3].find(l => l.file === logo.file)) {
          logoStructure[folder1][folder2][folder3].push(logo);
        }
      }
      // Проверяем двухуровневую структуру (logo/folder1/folder2/file)
      else if (pathParts.length === 4) {
        const folder2 = pathParts[2];
        if (!logoStructure[folder1]) {
          logoStructure[folder1] = {};
        }
        // Если уже есть трехуровневая структура, добавляем в 'root'
        if (logoStructure[folder1][folder2] && typeof logoStructure[folder1][folder2] === 'object' && !Array.isArray(logoStructure[folder1][folder2])) {
          if (!logoStructure[folder1][folder2]['root']) {
            logoStructure[folder1][folder2]['root'] = [];
          }
          if (!logoStructure[folder1][folder2]['root'].find(l => l.file === logo.file)) {
            logoStructure[folder1][folder2]['root'].push(logo);
          }
        } else {
          if (!logoStructure[folder1][folder2]) {
            logoStructure[folder1][folder2] = [];
          }
          if (!logoStructure[folder1][folder2].find(l => l.file === logo.file)) {
            logoStructure[folder1][folder2].push(logo);
          }
        }
      } else {
        // Одноуровневая структура (logo/folder1/file) - используем "root" как folder2
        if (!logoStructure[folder1]) {
          logoStructure[folder1] = {};
        }
        if (!logoStructure[folder1]['root']) {
          logoStructure[folder1]['root'] = [];
        }
        if (!logoStructure[folder1]['root'].find(l => l.file === logo.file)) {
          logoStructure[folder1]['root'].push(logo);
        }
      }
    }
  });
  
  return logoStructure;
};

const populateLogoColumns = async (forceRefresh = false) => {
  const column1 = document.getElementById('logoFolder1Column');
  if (!column1) return;
  
  // Если уже сканируем, ждем
  if (logosScanning) {
    return;
  }
  
  // Если принудительное обновление, очищаем кэш
  if (forceRefresh) {
    cachedLogosStructure = null;
    selectedLogoFolder1 = null;
    selectedLogoFolder2 = null;
    selectedLogoFolder3 = null;
  }
  
  // Если есть кэш и не принудительное обновление, используем его
  if (cachedLogosStructure && !forceRefresh) {
    // Сбрасываем выбранные папки, чтобы автоматически выбралась первая
    selectedLogoFolder1 = null;
    selectedLogoFolder2 = null;
    selectedLogoFolder3 = null;
    renderLogoColumn1(cachedLogosStructure);
    return;
  }
  
  // Сканируем в фоне
  logosScanning = true;
  const scannedStructure = await scanLogos();
  
  // scanLogos теперь возвращает структурированные данные напрямую
  // Добавляем AVAILABLE_LOGOS в структуру
  const logoStructure = { ...scannedStructure };
  
  // Добавляем AVAILABLE_LOGOS в структуру
  AVAILABLE_LOGOS.forEach(logo => {
    const pathParts = logo.file.split('/');
    if (pathParts.length >= 3 && pathParts[0] === 'logo') {
      const folder1 = pathParts[1];
      
      if (!logoStructure[folder1]) {
        logoStructure[folder1] = {};
      }
      
      // Проверяем трехуровневую структуру (logo/folder1/folder2/folder3/file)
      if (pathParts.length === 5) {
        const folder2 = pathParts[2];
        const folder3 = pathParts[3];
        if (!logoStructure[folder1][folder2]) {
          logoStructure[folder1][folder2] = {};
        }
        if (!logoStructure[folder1][folder2][folder3]) {
          logoStructure[folder1][folder2][folder3] = [];
        }
        if (!logoStructure[folder1][folder2][folder3].find(l => l.file === logo.file)) {
          logoStructure[folder1][folder2][folder3].push(logo);
        }
      }
      // Проверяем двухуровневую структуру (logo/folder1/folder2/file)
      else if (pathParts.length === 4) {
        const folder2 = pathParts[2];
        // Если уже есть трехуровневая структура, добавляем в 'root'
        if (logoStructure[folder1][folder2] && typeof logoStructure[folder1][folder2] === 'object' && !Array.isArray(logoStructure[folder1][folder2])) {
          if (!logoStructure[folder1][folder2]['root']) {
            logoStructure[folder1][folder2]['root'] = [];
          }
          if (!logoStructure[folder1][folder2]['root'].find(l => l.file === logo.file)) {
            logoStructure[folder1][folder2]['root'].push(logo);
          }
        } else {
          if (!logoStructure[folder1][folder2]) {
            logoStructure[folder1][folder2] = [];
          }
          if (!logoStructure[folder1][folder2].find(l => l.file === logo.file)) {
            logoStructure[folder1][folder2].push(logo);
          }
        }
      } else {
        // Одноуровневая структура (logo/folder1/file) - используем "root" как folder2
        if (!logoStructure[folder1]['root']) {
          logoStructure[folder1]['root'] = [];
        }
        if (!logoStructure[folder1]['root'].find(l => l.file === logo.file)) {
          logoStructure[folder1]['root'].push(logo);
        }
      }
    }
  });
  
  cachedLogosStructure = logoStructure;
  logosScanning = false;
  
  // Отладочная информация
  console.log('Final logo structure:', logoStructure);
  console.log('Final structure keys:', Object.keys(logoStructure));
  
  // Сбрасываем выбранные папки перед рендерингом
  selectedLogoFolder1 = null;
  selectedLogoFolder2 = null;
  selectedLogoFolder3 = null;
  
  // Заполняем колонки
  renderLogoColumn1(logoStructure);
};

export const refreshLogoColumns = async () => {
  await populateLogoColumns(true);
};

const openLogoSelectModal = async () => {
  const overlay = document.getElementById('logoSelectModalOverlay');
  if (!overlay) return;
  
  // Сбрасываем выбранные папки
  selectedLogoFolder1 = null;
  selectedLogoFolder2 = null;
  selectedLogoFolder3 = null;
  
  // При открытии заполняем колонки лениво
  await populateLogoColumns();
  
  // Показываем модальное окно
  overlay.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Блокируем скролл фона
};

const closeLogoSelectModal = () => {
  const overlay = document.getElementById('logoSelectModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = ''; // Разблокируем скролл
  }
};

export const initializeLogoToggle = () => {
  const toggle = document.getElementById('logoLangToggle');
  if (!toggle) return;
  
  // Удаляем старые обработчики через клонирование
  const newToggle = toggle.cloneNode(true);
  toggle.parentNode.replaceChild(newToggle, toggle);
  const updatedToggle = document.getElementById('logoLangToggle');
  
  // Добавляем обработчик клика
  updatedToggle.addEventListener('click', async (e) => {
    e.stopPropagation();
    await toggleLogoLanguage();
  });
  
  // Инициализируем состояние тумблера
  const state = getState();
  updateLogoToggle(state.logoLanguage || 'ru');
};

export const initializeLogoPosToggle = () => {
  const toggle = document.getElementById('logoPosToggle');
  if (!toggle) return;
  
  // Добавляем обработчик клика
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLogoPos();
  });
  
  // Инициализируем состояние тумблера
  const state = getState();
  updateLogoPosToggle(state.logoPos || 'left');
};

export const initializeTitleAlignToggle = () => {
  const toggle = document.getElementById('titleAlignToggle');
  if (!toggle) return;
  
  // Добавляем обработчик клика на тумблер
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTitleAlign();
  });
  
  // Добавляем обработчики клика на опции для прямого выбора
  const options = toggle.querySelectorAll('.toggle-switch-option');
  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = option.dataset.value;
      selectTitleAlign(value);
    });
  });
  
  // Инициализируем состояние тумблера
  const state = getState();
  updateTitleAlignToggle(state.titleAlign || 'left');
};

export const initializeTitleVPosToggle = () => {
  const toggle = document.getElementById('titleVPosToggle');
  if (!toggle) return;
  
  // Добавляем обработчик клика на тумблер
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTitleVPos();
  });
  
  // Добавляем обработчики клика на опции для прямого выбора
  const options = toggle.querySelectorAll('.toggle-switch-option');
  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = option.dataset.value;
      selectTitleVPos(value);
    });
  });
  
  // Инициализируем состояние тумблера
  const state = getState();
  updateTitleVPosToggle(state.titleVPos || 'top');
};

export const initializeLogoDropdown = async () => {
  const dom = getDom();
  if (!dom.logoSelect) return;
  
  const trigger = document.getElementById('logoSelectTrigger');
  const textSpan = document.getElementById('logoSelectText');
  
  if (!trigger || !textSpan) return;
  
  // Удаляем старые обработчики через клонирование trigger
  const newTrigger = trigger.cloneNode(true);
  trigger.parentNode.replaceChild(newTrigger, trigger);
  const updatedTrigger = document.getElementById('logoSelectTrigger');
  
  // Обработчик открытия модального окна
  updatedTrigger.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await openLogoSelectModal();
  });
  
  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('logoSelectModalOverlay');
      if (overlay && overlay.style.display === 'block') {
        closeLogoSelectModal();
      }
    }
  });
  
  // Делаем функцию закрытия доступной глобально
  window.closeLogoSelectModal = closeLogoSelectModal;
  
  // Обновляем текст триггера
  const state = getState();
  updateLogoTriggerText(state.logoSelected || '');
};

const toggleDropdown = (type) => {
  const dropdown = document.getElementById(`${type}SelectDropdown`);
  if (!dropdown) {
    console.warn(`Dropdown ${type}SelectDropdown not found`);
    return;
  }
  
  const computedStyle = window.getComputedStyle(dropdown);
  const isOpen = computedStyle.display !== 'none';
  
  if (isOpen) {
    dropdown.style.display = 'none';
  } else {
    // Закрываем другие dropdown
    document.querySelectorAll('.custom-select-dropdown').forEach(dd => {
      if (dd !== dropdown) dd.style.display = 'none';
    });
    dropdown.style.display = 'block';
  }
};

const closeDropdown = (type) => {
  const dropdown = document.getElementById(`${type}SelectDropdown`);
  if (dropdown) dropdown.style.display = 'none';
};

const updateLogoTriggerText = async (value) => {
  const textSpan = document.getElementById('logoSelectText');
  if (!textSpan) return;
  
  if (!value) {
    textSpan.textContent = 'Выбрать';
    return;
  }
  
  // Если есть логотип, показываем "Выбрать из библиотеки"
  textSpan.textContent = 'Выбрать из библиотеки';
};

// Функция для обновления dropdown для шрифтов
// Показывает только гарнитуры (семейства), начертания выбираются отдельно
const updateFontDropdown = (selectElement, currentValue) => {
  if (!selectElement) return;
  
  selectElement.innerHTML = '';
  
  // Группируем шрифты по семействам
  const fontFamilies = new Set();
  
  AVAILABLE_FONTS.forEach((font) => {
    if (font.family && font.family !== 'system-ui') {
      fontFamilies.add(font.family);
    }
  });
  
  // Добавляем опцию "System Default" первой
  const systemOption = document.createElement('option');
  systemOption.value = 'system-ui';
  systemOption.textContent = 'System Default';
  systemOption.dataset.file = null;
  selectElement.appendChild(systemOption);
  
  // Добавляем опции для каждого семейства
  const sortedFamilies = Array.from(fontFamilies).sort();
  sortedFamilies.forEach((family) => {
    const option = document.createElement('option');
    option.value = family;
    option.textContent = family;
    // Находим Regular начертание (400, normal) для этого семейства
    const regularFont = AVAILABLE_FONTS.find(
      f => f.family === family && f.weight === '400' && f.style === 'normal'
    );
    option.dataset.file = regularFont?.file || '';
    selectElement.appendChild(option);
  });
  
  // Устанавливаем текущее значение
  if (currentValue) {
    selectElement.value = currentValue;
  } else {
    // По умолчанию выбираем YS Text
    selectElement.value = 'YS Text';
  }
};

export const initializeFontDropdown = () => {
  const dom = getDom();
  if (!dom.fontFamily) return;
  const state = getState();
  updateFontDropdown(dom.fontFamily, state.fontFamily || 'YS Text');
};

// Инициализация всех dropdown для шрифтов в разделах
export const initializeFontDropdowns = () => {
  const dom = getDom();
  const state = getState();
  
  // Обновляем dropdown для заголовка
  if (dom.titleFontFamily) {
    updateFontDropdown(dom.titleFontFamily, state.titleFontFamily || 'YS Text');
  }
  
  // Обновляем dropdown для подзаголовка
  if (dom.subtitleFontFamily) {
    updateFontDropdown(dom.subtitleFontFamily, state.subtitleFontFamily || 'YS Text');
  }
  
  // Обновляем dropdown для юридического текста
  if (dom.legalFontFamily) {
    updateFontDropdown(dom.legalFontFamily, state.legalFontFamily || 'YS Text');
  }
  
  // Обновляем dropdown для возраста
  if (dom.ageFontFamily) {
    updateFontDropdown(dom.ageFontFamily, state.ageFontFamily || 'YS Text');
  }
};

// Кэш для отсканированных KV
let cachedKV = null;
let kvScanning = false;

let selectedFolder1 = null;
let selectedFolder2 = null;

const renderKVColumn1 = (allKV) => {
  const column1 = document.getElementById('kvFolder1Column');
  if (!column1) return;
  
  column1.innerHTML = '';
  const folders1 = Object.keys(allKV).sort();
  
  folders1.forEach((folder1) => {
    const item = document.createElement('div');
    item.className = 'column-item kv-folder1-item';
    item.dataset.folder1 = folder1;
    item.textContent = folder1;
    
    item.addEventListener('click', () => {
      selectedFolder1 = folder1;
      selectedFolder2 = null;
      // Обновляем стили
      document.querySelectorAll('.kv-folder1-item').forEach(el => {
        el.classList.remove('active');
      });
      item.classList.add('active');
      
      // Обновляем вторую колонку
      renderKVColumn2(allKV);
      // Очищаем третью колонку
      renderKVColumn3([]);
    });
    
    column1.appendChild(item);
  });
  
  // Выбираем первую папку по умолчанию
  if (folders1.length > 0 && !selectedFolder1) {
    selectedFolder1 = folders1[0];
    const firstItem = column1.querySelector(`[data-folder1="${folders1[0]}"]`);
    if (firstItem) {
      firstItem.classList.add('active');
      renderKVColumn2(allKV);
    }
  }
};

const renderKVColumn2 = (allKV) => {
  const column2 = document.getElementById('kvFolder2Column');
  if (!column2 || !selectedFolder1) return;
  
  column2.innerHTML = '';
  const folders2 = Object.keys(allKV[selectedFolder1] || {}).sort();
  
  folders2.forEach((folder2) => {
    const item = document.createElement('div');
    item.className = 'column-item kv-folder2-item';
    item.dataset.folder2 = folder2;
    item.textContent = folder2;
    
    item.addEventListener('click', () => {
      selectedFolder2 = folder2;
      // Обновляем стили
      document.querySelectorAll('.kv-folder2-item').forEach(el => {
        el.classList.remove('active');
      });
      item.classList.add('active');
      
      // Обновляем третью колонку
      const images = allKV[selectedFolder1][selectedFolder2] || [];
      renderKVColumn3(images);
    });
    
    column2.appendChild(item);
  });
  
  // Выбираем первую подпапку по умолчанию
  if (folders2.length > 0 && !selectedFolder2) {
    selectedFolder2 = folders2[0];
    const firstItem = column2.querySelector(`[data-folder2="${folders2[0]}"]`);
    if (firstItem) {
      firstItem.classList.add('active');
      const images = allKV[selectedFolder1][selectedFolder2] || [];
      renderKVColumn3(images);
    }
  }
};

const renderKVColumn3 = (images) => {
  const column3 = document.getElementById('kvImagesColumn');
  if (!column3) return;
  
  column3.innerHTML = '';
  
  // Определяем активный KV
  const state = getState();
  let activeKVFile = null;
  
  if (currentKVModalPairIndex !== null) {
    // Модальное окно открыто для конкретной пары
    const pairs = state.titleSubtitlePairs || [];
    const pair = pairs[currentKVModalPairIndex];
    if (pair && pair.kvSelected) {
      activeKVFile = pair.kvSelected;
    }
  } else {
    // Модальное окно открыто для обычного KV
    activeKVFile = state.kvSelected || '';
  }
  
  images.forEach((kv) => {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'preview-item';
    
    // Добавляем обводку для активного KV
    if (activeKVFile && kv.file === activeKVFile) {
      imgContainer.style.border = '2px solid #027EF2';
      imgContainer.style.borderRadius = '4px';
    } else {
      imgContainer.style.border = '2px solid transparent';
      imgContainer.style.borderRadius = '4px';
    }
    
    const img = document.createElement('img');
    img.src = kv.file;
    img.alt = kv.name;
    
    imgContainer.appendChild(img);
    
    imgContainer.addEventListener('click', () => {
      selectPreloadedKV(kv.file);
      // Закрываем модальное окно после выбора
      closeKVSelectModal();
    });
    
    column3.appendChild(imgContainer);
  });
};

const buildKVStructure = (scannedKV) => {
  // Объединяем с известными KV из констант
  const allKV = { ...AVAILABLE_KV };
  Object.keys(scannedKV).forEach(folder1 => {
    if (!allKV[folder1]) {
      allKV[folder1] = {};
    }
    Object.keys(scannedKV[folder1]).forEach(folder2 => {
      if (!allKV[folder1][folder2]) {
        allKV[folder1][folder2] = [];
      }
      // Добавляем новые файлы
      scannedKV[folder1][folder2].forEach(kv => {
        if (!allKV[folder1][folder2].find(k => k.file === kv.file)) {
          allKV[folder1][folder2].push(kv);
        }
      });
    });
  });
  return allKV;
};

const populateKVColumns = async (forceRefresh = false) => {
  const column1 = document.getElementById('kvFolder1Column');
  if (!column1) return;
  
  // Если уже сканируем, ждем
  if (kvScanning) {
    return;
  }
  
  // Если принудительное обновление, очищаем кэш
  if (forceRefresh) {
    cachedKV = null;
    selectedFolder1 = null;
    selectedFolder2 = null;
  }
  
  // Если есть кэш и не принудительное обновление, используем его
  if (cachedKV && !forceRefresh) {
    renderKVColumn1(cachedKV);
    return;
  }
  
  // Сканируем в фоне
  kvScanning = true;
  const scannedKV = await scanKV();
  
  // Создаем структуру
  const allKV = buildKVStructure(scannedKV);
  
  cachedKV = allKV;
  kvScanning = false;
  
  // Заполняем колонки
  renderKVColumn1(allKV);
};

export const refreshKVColumns = async () => {
  await populateKVColumns(true);
};

// Глобальная переменная для хранения индекса пары, для которой открывается модальное окно
let currentKVModalPairIndex = null;

const openKVSelectModal = async (pairIndex = null) => {
  const overlay = document.getElementById('kvSelectModalOverlay');
  if (!overlay) return;
  
  // Сохраняем индекс пары, если указан
  currentKVModalPairIndex = pairIndex;
  
  // Сбрасываем выбранные папки
  selectedFolder1 = null;
  selectedFolder2 = null;
  
  // При открытии заполняем колонки лениво
  await populateKVColumns();
  
  // Показываем модальное окно
  overlay.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Блокируем скролл фона
};

const closeKVSelectModal = () => {
  const overlay = document.getElementById('kvSelectModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = ''; // Разблокируем скролл
  }
  // Сбрасываем индекс пары при закрытии
  currentKVModalPairIndex = null;
};

export const initializeKVDropdown = async () => {
  const dom = getDom();
  if (!dom.kvSelect) return;
  
  const trigger = document.getElementById('kvSelectTrigger');
  const textSpan = document.getElementById('kvSelectText');
  
  if (!trigger || !textSpan) return;
  
  // Удаляем старые обработчики через клонирование trigger
  const newTrigger = trigger.cloneNode(true);
  trigger.parentNode.replaceChild(newTrigger, trigger);
  const updatedTrigger = document.getElementById('kvSelectTrigger');
  
  // Обработчик открытия модального окна
  updatedTrigger.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await openKVSelectModal();
  });
  
  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('kvSelectModalOverlay');
      if (overlay && overlay.style.display === 'block') {
        closeKVSelectModal();
      }
    }
  });
  
  // Делаем функцию закрытия доступной глобально
  window.closeKVSelectModal = closeKVSelectModal;
  
  // Обновляем текст триггера
  const state = getState();
  updateKVTriggerText(state.kvSelected || '');
};

const updateKVTriggerText = (value) => {
  const textSpan = document.getElementById('kvSelectText');
  if (!textSpan) return;
  
  if (!value) {
    textSpan.textContent = 'Выбрать';
    return;
  }
  
  // Если есть KV, показываем "Выбрать из библиотеки"
  textSpan.textContent = 'Выбрать из библиотеки';
};

export const selectPreloadedKV = async (kvFile) => {
  const dom = getDom();
  const state = getState();
  
  // Закрываем модальное окно выбора
  closeKVSelectModal();

  // Если модальное окно открыто для конкретной пары, обновляем только эту пару
  if (currentKVModalPairIndex !== null) {
    await selectPairKV(currentKVModalPairIndex, kvFile || '');
    return;
  }
  
  // Иначе обновляем KV для активной пары (обычное поведение)
  const activeIndex = state.activePairIndex || 0;
  const pairs = state.titleSubtitlePairs || [];
  if (pairs[activeIndex]) {
    updatePairKV(activeIndex, kvFile || '');
  }
  
  setState({ kvSelected: kvFile || '' });
  updateKVTriggerText(kvFile || '');

  if (!kvFile) {
    setState({ kv: null });
    updateKVUI();
    renderer.render();
    // Обновляем превью в списке KV для пар
    renderKVPairs();
    return;
  }

  try {
    const img = await loadImage(kvFile);
    setState({ kv: img });
    if (dom.kvSelect) dom.kvSelect.value = kvFile;
    updateKVUI();
    renderer.render();
    // Обновляем превью в списке KV для пар
    renderKVPairs();
  } catch (error) {
    console.error(error);
    alert('Не удалось загрузить KV.');
    setState({ kv: null });
    updateKVUI();
    renderer.render();
    // Обновляем превью в списке KV для пар
    renderKVPairs();
  }
};

export const loadDefaultKV = async () => {
  const dom = getDom();
  const state = getState();
  const defaultKV = state.kvSelected || 'assets/3d/sign/01.png';
  
  if (!defaultKV) return;
  
  try {
    const img = await loadImage(defaultKV);
    setKey('kv', img);
    setState({ kvSelected: defaultKV });
    if (dom.kvSelect) dom.kvSelect.value = defaultKV;
    updateKVTriggerText(defaultKV);
    updateKVUI();
    renderer.render();
  } catch (error) {
    console.warn(`Failed to load default KV image: ${defaultKV}`);
  }
};

// Функции для управления парами заголовок/подзаголовок
export const updateActivePairTitle = (title) => {
  const state = getState();
  const activeIndex = state.activePairIndex || 0;
  updatePairTitle(activeIndex, title);
  renderer.render();
};

export const updateActivePairSubtitle = (subtitle) => {
  const state = getState();
  const activeIndex = state.activePairIndex || 0;
  updatePairSubtitle(activeIndex, subtitle);
  renderer.render();
};

export const updatePairTitleDirect = (index, title) => {
  // Обновляем состояние - структура пар не изменится, только текст
  // поэтому renderTitleSubtitlePairs не будет вызван
  updatePairTitle(index, title);
  // Если это активная пара, обновляем только рендер превью
  const state = getState();
  if (index === (state.activePairIndex || 0)) {
    renderer.render();
  }
};

export const updatePairSubtitleDirect = (index, subtitle) => {
  // Обновляем состояние - структура пар не изменится, только текст
  // поэтому renderTitleSubtitlePairs не будет вызван
  updatePairSubtitle(index, subtitle);
  // Если это активная пара, обновляем только рендер превью
  const state = getState();
  if (index === (state.activePairIndex || 0)) {
    renderer.render();
  }
};

// Функции для работы с KV для пар
const populateKVDropdownForPair = async (pairIndex, dropdown) => {
  // Если уже заполнен (больше чем опция "Нет"), не заполняем повторно
  if (dropdown.children.length > 1) {
    return;
  }
  
  // Используем кэш или сканируем
  let allKV = cachedKV;
  if (!allKV) {
    kvScanning = true;
    const scannedKV = await scanKV();
    allKV = { ...AVAILABLE_KV };
    Object.keys(scannedKV).forEach(folder1 => {
      if (!allKV[folder1]) {
        allKV[folder1] = {};
      }
      Object.keys(scannedKV[folder1]).forEach(folder2 => {
        if (!allKV[folder1][folder2]) {
          allKV[folder1][folder2] = [];
        }
        scannedKV[folder1][folder2].forEach(kv => {
          if (!allKV[folder1][folder2].find(k => k.file === kv.file)) {
            allKV[folder1][folder2].push(kv);
          }
        });
      });
    });
    cachedKV = allKV;
    kvScanning = false;
  }
  
  // Заполняем dropdown
  Object.keys(allKV).sort().forEach((folder1) => {
    Object.keys(allKV[folder1]).sort().forEach((folder2) => {
      const groupLabel = document.createElement('div');
      groupLabel.className = 'custom-select-option-group';
      groupLabel.textContent = folder2 === 'root' ? folder1 : `${folder1}/${folder2}`;
      dropdown.appendChild(groupLabel);
      
      allKV[folder1][folder2].forEach((kv) => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        option.dataset.value = kv.file;
        option.innerHTML = `
          <img src="${kv.file}" class="custom-select-option-preview" alt="${kv.name}">
          <span class="custom-select-option-label">${kv.name}</span>
        `;
        option.onclick = async () => {
          await selectPairKV(pairIndex, kv.file);
          closeKVDropdown(pairIndex);
        };
        dropdown.appendChild(option);
      });
    });
  });
};

const toggleKVDropdown = (pairIndex) => {
  const dropdown = document.getElementById(`kvSelectDropdown-${pairIndex}`);
  if (!dropdown) return;
  
  const computedStyle = window.getComputedStyle(dropdown);
  const isOpen = computedStyle.display !== 'none';
  
  if (isOpen) {
    dropdown.style.display = 'none';
  } else {
    // Закрываем другие dropdown
    document.querySelectorAll('.custom-select-dropdown').forEach(dd => {
      if (dd !== dropdown) dd.style.display = 'none';
    });
    dropdown.style.display = 'block';
  }
};

const closeKVDropdown = (pairIndex) => {
  const dropdown = document.getElementById(`kvSelectDropdown-${pairIndex}`);
  if (dropdown) dropdown.style.display = 'none';
};

export const selectPairKV = async (pairIndex, kvFile) => {
  // Обновляем KV для пары
  updatePairKV(pairIndex, kvFile || '');
  
  // Обновляем текст в кнопке
  const kvText = document.getElementById(`kvSelectText-${pairIndex}`);
  if (kvText) {
    let kvDisplayText = kvFile ? 'Выбрать' : 'Выбрать';
    if (kvFile) {
      // Проверяем, является ли это data URL
      if (kvFile.startsWith('data:')) {
        kvDisplayText = 'Загруженное изображение';
      } else {
        // Пытаемся найти имя KV из кэша или используем имя файла
        if (cachedKV) {
          let foundName = null;
          Object.keys(cachedKV).forEach((folder1) => {
            Object.keys(cachedKV[folder1] || {}).forEach((folder2) => {
              const kv = cachedKV[folder1][folder2].find(k => k.file === kvFile);
              if (kv) foundName = kv.name;
            });
          });
          if (foundName) {
            kvDisplayText = foundName;
          } else {
            // Используем имя файла без расширения
            kvDisplayText = kvFile.split('/').pop().replace(/\.(png|jpg|jpeg)$/i, '');
          }
        } else {
          // Используем имя файла без расширения
          kvDisplayText = kvFile.split('/').pop().replace(/\.(png|jpg|jpeg)$/i, '');
        }
      }
    }
    kvText.textContent = kvDisplayText;
  }
  
  // Превью больше не используется, структура изменилась на dropdown + кнопки
  // Если это активная пара, загружаем KV
  const state = getState();
  if (pairIndex === (state.activePairIndex || 0)) {
    if (!kvFile) {
      setState({ kv: null, kvSelected: '' });
      updateKVTriggerText('');
      updateKVUI();
      renderer.render();
      renderKVPairs(); // Обновляем кнопки
      return;
    }
    
    try {
      const img = await loadImage(kvFile);
      setState({ kv: img, kvSelected: kvFile });
      updateKVTriggerText(kvFile);
      updateKVUI();
      renderer.render();
      renderKVPairs(); // Обновляем кнопки
    } catch (error) {
      console.error(error);
      alert('Не удалось загрузить KV.');
      setState({ kv: null, kvSelected: '' });
      updateKVTriggerText('');
      updateKVUI();
      renderer.render();
      renderKVPairs(); // Обновляем кнопки
    }
  } else {
    // Обновляем кнопки даже если это не активная пара
    renderKVPairs();
  }
};

const renderKVPairs = () => {
  const state = getState();
  const pairs = state.titleSubtitlePairs || [];
  const activeIndex = state.activePairIndex || 0;
  
  const kvContainer = document.getElementById('kvPairsContainer');
  if (!kvContainer) return;
  
  // Очищаем контейнер
  kvContainer.innerHTML = '';
  
  // Запускаем сканирование KV в фоне, если кэш пуст (для следующего рендеринга)
  if (!cachedKV && !kvScanning) {
    kvScanning = true;
    scanKV().then((scannedKV) => {
      cachedKV = { ...AVAILABLE_KV };
      Object.keys(scannedKV).forEach(folder1 => {
        if (!cachedKV[folder1]) {
          cachedKV[folder1] = {};
        }
        Object.keys(scannedKV[folder1]).forEach(folder2 => {
          if (!cachedKV[folder1][folder2]) {
            cachedKV[folder1][folder2] = [];
          }
          scannedKV[folder1][folder2].forEach(kv => {
            if (!cachedKV[folder1][folder2].find(k => k.file === kv.file)) {
              cachedKV[folder1][folder2].push(kv);
            }
          });
        });
      });
      kvScanning = false;
      // Перерисовываем после заполнения кэша, чтобы обновить имена
      renderKVPairs();
    }).catch((error) => {
      console.error('Ошибка при сканировании KV:', error);
      kvScanning = false;
    });
  }
  
  // Рендерим KV только для неактивных пар (активная пара показывается в блоке выше)
  pairs.forEach((pair, index) => {
    // Пропускаем активную пару, она показывается в основном блоке
    if (index === activeIndex) return;
    
    const isActive = false;
    
    // Элемент для KV этой пары
    const kvItem = document.createElement('div');
    kvItem.className = `form-group form-item ${isActive ? 'active' : ''}`;
    kvItem.setAttribute('data-kv-pair-index', index);
    
    const kvLabel = document.createElement('label');
    kvLabel.className = `form-label mb-sm ${isActive ? 'active' : ''}`;
    kvLabel.style.display = 'block';
    kvLabel.textContent = `KV для заголовка ${index + 1}${isActive ? ' (активен)' : ''}`;
    
    // Создаем кнопку для выбора KV (как для обычного KV - открывает модальное окно)
    const kvSelectBtn = document.createElement('button');
    kvSelectBtn.className = 'btn btn-full mb-sm';
    kvSelectBtn.id = `kvSelectTrigger-${index}`;
    kvSelectBtn.style.cssText = 'display: flex; align-items: center; justify-content: space-between;';
    
    const kvText = document.createElement('span');
    kvText.id = `kvSelectText-${index}`;
    
    // Определяем текст для кнопки KV
    let kvDisplayText = 'Выбрать';
    if (pair.kvSelected) {
      // Проверяем, является ли это data URL
      if (pair.kvSelected.startsWith('data:')) {
        kvDisplayText = 'Загруженное изображение';
      } else {
        // Пытаемся найти имя KV из кэша или используем имя файла
        if (cachedKV) {
          let foundName = null;
          Object.keys(cachedKV).forEach((folder1) => {
            Object.keys(cachedKV[folder1] || {}).forEach((folder2) => {
              const kv = cachedKV[folder1][folder2].find(k => k.file === pair.kvSelected);
              if (kv) foundName = kv.name;
            });
          });
          if (foundName) {
            kvDisplayText = foundName;
          } else {
            // Используем имя файла без расширения
            kvDisplayText = pair.kvSelected.split('/').pop().replace(/\.(png|jpg|jpeg)$/i, '');
          }
        } else {
          // Используем имя файла без расширения
          kvDisplayText = pair.kvSelected.split('/').pop().replace(/\.(png|jpg|jpeg)$/i, '');
        }
      }
    }
    kvText.textContent = kvDisplayText;
    
    kvSelectBtn.appendChild(kvText);
    
    // Открываем модальное окно при клике на кнопку
    kvSelectBtn.onclick = async (e) => {
      e.stopPropagation();
      await openKVSelectModal(index);
    };
    
    // Создаем кнопки действий для KV (всегда видны для каждого KV) - под dropdown
    const kvActions = document.createElement('div');
    kvActions.className = 'gap-sm';
    kvActions.style.cssText = 'display: flex; width: 100%;';
    
    // Кнопка "Загрузить" (всегда видна)
    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn';
    loadBtn.style.cssText = 'flex: 1;';
    loadBtn.textContent = 'Загрузить';
    loadBtn.onclick = (e) => {
      e.stopPropagation();
      // Создаем временный input для загрузки файла
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          await handlePairKVUpload(index, file);
        }
        document.body.removeChild(input);
      };
      document.body.appendChild(input);
      input.click();
    };
    
    // Кнопка "Удалить" (всегда видна, но может быть неактивна)
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn';
    removeBtn.setAttribute('data-action', 'remove');
    removeBtn.style.cssText = 'flex: 1; background: #2a1f1f; color: #ff6b6b; border-color: #ff6b6b;';
    removeBtn.textContent = 'Удалить';
    removeBtn.disabled = !pair.kvSelected;
    if (!pair.kvSelected) {
      removeBtn.style.opacity = '0.5';
      removeBtn.style.cursor = 'not-allowed';
    }
    removeBtn.onclick = async (e) => {
      e.stopPropagation();
      if (pair.kvSelected) {
        await selectPairKV(index, '');
      }
    };
    
    kvActions.appendChild(loadBtn);
    kvActions.appendChild(removeBtn);
    
    kvItem.appendChild(kvLabel);
    kvItem.appendChild(kvSelectBtn);
    kvItem.appendChild(kvActions);
    
    kvContainer.appendChild(kvItem);
  });
};

const renderTitleSubtitlePairs = () => {
  const state = getState();
  const pairs = state.titleSubtitlePairs || [];
  const activeIndex = state.activePairIndex || 0;
  
  const titleContainer = document.getElementById('titlePairsContainer');
  const subtitleContainer = document.getElementById('subtitlePairsContainer');
  
  if (!titleContainer || !subtitleContainer) return;
  
  // Сохраняем фокус и позицию курсора перед перерисовкой
  const activeElement = document.activeElement;
  let savedFocus = null;
  let savedSelectionStart = null;
  let savedSelectionEnd = null;
  let savedValue = null;
  
  if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') && 
      (activeElement.id.startsWith('title-') || activeElement.id.startsWith('subtitle-'))) {
    savedFocus = activeElement.id;
    savedSelectionStart = activeElement.selectionStart;
    savedSelectionEnd = activeElement.selectionEnd;
    savedValue = activeElement.value;
  }
  
  // Очищаем контейнеры
  titleContainer.innerHTML = '';
  subtitleContainer.innerHTML = '';
  
  // Рендерим пары заголовков
  pairs.forEach((pair, index) => {
    const isActive = index === activeIndex;
    
    // Элемент для заголовка
    const titleItem = document.createElement('div');
    titleItem.className = `form-group form-item ${isActive ? 'active' : ''}`;
    
    // Создаем header с label и кнопкой
    const titleHeader = document.createElement('div');
    titleHeader.className = 'form-header';
    
    const titleLabel = document.createElement('label');
    titleLabel.className = `form-label ${isActive ? 'active' : ''}`;
    titleLabel.textContent = `Заголовок ${index + 1}${isActive ? ' (активен)' : ''}`;
    titleLabel.onclick = () => setActiveTitlePair(index);
    
    const titleButtons = document.createElement('div');
    titleButtons.className = 'gap-sm';
    titleButtons.style.cssText = 'display: flex; align-items: center;';
    
    // Добавляем кнопку "Добавить заголовок" только для первого заголовка
    if (index === 0) {
      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-tiny';
      addBtn.textContent = '+ Добавить';
      addBtn.onclick = (e) => {
        e.stopPropagation();
        addTitleSubtitlePair();
      };
      titleButtons.appendChild(addBtn);
    }
    
    if (pairs.length > 1) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-small';
      removeBtn.style.cssText = 'background: #2a1f1f; color: #ff6b6b; border-color: #ff6b6b; min-width: 32px;';
      removeBtn.textContent = '−';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeTitleSubtitlePairAction(index);
      };
      titleButtons.appendChild(removeBtn);
    }
    
    titleHeader.appendChild(titleLabel);
    titleHeader.appendChild(titleButtons);
    
    // Создаем textarea
    const titleTextarea = document.createElement('textarea');
    titleTextarea.id = `title-${index}`;
    titleTextarea.className = 'form-textarea';
    titleTextarea.value = pair.title || '';
    titleTextarea.oninput = (e) => {
      updatePairTitleDirect(index, e.target.value);
    };
    titleTextarea.onfocus = () => {
      const state = getState();
      // Устанавливаем активную пару только если она еще не активна
      if (index !== (state.activePairIndex || 0)) {
        setActivePairIndex(index);
      }
    };
    
    titleItem.appendChild(titleHeader);
    titleItem.appendChild(titleTextarea);
    titleContainer.appendChild(titleItem);
    
    // Элемент для подзаголовка
    const subtitleItem = document.createElement('div');
    subtitleItem.className = `form-group form-item ${isActive ? 'active' : ''}`;
    
    // Создаем header с label и кнопкой
    const subtitleHeader = document.createElement('div');
    subtitleHeader.className = 'form-header';
    
    const subtitleLabel = document.createElement('label');
    subtitleLabel.className = `form-label ${isActive ? 'active' : ''}`;
    subtitleLabel.textContent = `Подзаголовок ${index + 1}${isActive ? ' (активен)' : ''}`;
    subtitleLabel.onclick = () => setActiveTitlePair(index);
    
    const subtitleButtons = document.createElement('div');
    subtitleButtons.className = 'gap-sm';
    subtitleButtons.style.cssText = 'display: flex;';
    
    if (pairs.length > 1) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-small';
      removeBtn.style.cssText = 'background: #2a1f1f; color: #ff6b6b; border-color: #ff6b6b; min-width: 32px;';
      removeBtn.textContent = '−';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeTitleSubtitlePairAction(index);
      };
      subtitleButtons.appendChild(removeBtn);
    }
    
    subtitleHeader.appendChild(subtitleLabel);
    if (pairs.length > 1) {
      subtitleHeader.appendChild(subtitleButtons);
    }
    
    // Создаем textarea
    const subtitleTextarea = document.createElement('textarea');
    subtitleTextarea.id = `subtitle-${index}`;
    subtitleTextarea.className = 'form-textarea';
    subtitleTextarea.value = pair.subtitle || '';
    subtitleTextarea.oninput = (e) => {
      updatePairSubtitleDirect(index, e.target.value);
    };
    subtitleTextarea.onfocus = () => {
      const state = getState();
      // Устанавливаем активную пару только если она еще не активна
      if (index !== (state.activePairIndex || 0)) {
        setActivePairIndex(index);
      }
    };
    
    subtitleItem.appendChild(subtitleHeader);
    subtitleItem.appendChild(subtitleTextarea);
    subtitleContainer.appendChild(subtitleItem);
  });
  
  // Обновляем текстовые поля активной пары (для обратной совместимости)
  if (pairs.length > 0 && activeIndex < pairs.length) {
    const activePair = pairs[activeIndex];
    const titleInput = document.getElementById('title');
    const subtitleInput = document.getElementById('subtitle');
    if (titleInput) titleInput.value = activePair.title || '';
    if (subtitleInput) subtitleInput.value = activePair.subtitle || '';
  }
  
  // Рендерим KV для каждой пары в разделе KV
  renderKVPairs();
  
  // Восстанавливаем фокус и позицию курсора после перерисовки
  if (savedFocus && savedValue !== null) {
    requestAnimationFrame(() => {
      const element = document.getElementById(savedFocus);
      if (element && element.value === savedValue) {
        // Значение не изменилось, восстанавливаем позицию курсора
        element.focus();
        if (element.setSelectionRange && typeof savedSelectionStart === 'number') {
          const maxPos = element.value.length;
          const start = Math.min(savedSelectionStart, maxPos);
          const end = Math.min(savedSelectionEnd, maxPos);
          element.setSelectionRange(start, end);
        }
      } else if (element) {
        // Значение изменилось, просто фокусируемся
        element.focus();
      }
    });
  }
};

export const setActiveTitlePair = async (index) => {
  setActivePairIndex(index);
  
  // Загружаем KV для активной пары
  const state = getState();
  const pairs = state.titleSubtitlePairs || [];
  const activePair = pairs[index];
  
  if (activePair && activePair.kvSelected) {
    try {
      const img = await loadImage(activePair.kvSelected);
      setState({ kv: img, kvSelected: activePair.kvSelected });
      updateKVTriggerText(activePair.kvSelected);
      updateKVUI();
    } catch (error) {
      console.error('Не удалось загрузить KV для активной пары:', error);
      setState({ kv: null, kvSelected: '' });
      updateKVTriggerText('');
      updateKVUI();
    }
  } else {
    setState({ kv: null, kvSelected: '' });
    updateKVTriggerText('');
    updateKVUI();
  }
  
  renderTitleSubtitlePairs();
  renderKVPairs();
  syncFormFields();
  renderer.render();
};

export const addTitleSubtitlePairAction = () => {
  const state = getState();
  const oldLength = (state.titleSubtitlePairs || []).length;
  addTitleSubtitlePair();
  // Делаем новую пару активной (индекс последнего элемента = oldLength)
  setActivePairIndex(oldLength);
  renderTitleSubtitlePairs();
  renderKVPairs();
  syncFormFields();
  renderer.render();
};

export const removeTitleSubtitlePairAction = (index) => {
  removeTitleSubtitlePair(index);
  renderTitleSubtitlePairs();
  renderKVPairs();
  syncFormFields();
  renderer.render();
};

export const initializeStateSubscribers = () => {
  let lastPairsStructure = ''; // Сериализованная структура пар (без текста)
  let lastActiveIndex = -1;
  
  const serializePairsStructure = (pairs) => {
    // Сериализуем только ID пар, не текст
    return pairs.map((p, i) => `${i}:${p.id || ''}`).join('|');
  };
  
  subscribe(async (state) => {
    syncFormFields();
    
    // Перерисовываем только если изменилась структура (количество/ID) пар или активный индекс
    // НЕ перерисовываем при изменении текста
    const currentPairs = state.titleSubtitlePairs || [];
    const currentPairsStructure = serializePairsStructure(currentPairs);
    const currentActiveIndex = state.activePairIndex || 0;
    
    // Если изменился активный индекс, загружаем KV для новой активной пары
    if (currentActiveIndex !== lastActiveIndex && currentActiveIndex >= 0 && currentActiveIndex < currentPairs.length) {
      const activePair = currentPairs[currentActiveIndex];
      if (activePair && activePair.kvSelected) {
        try {
          const img = await loadImage(activePair.kvSelected);
          setState({ kv: img, kvSelected: activePair.kvSelected });
          updateKVTriggerText(activePair.kvSelected);
        } catch (error) {
          console.error('Не удалось загрузить KV для активной пары:', error);
          setState({ kv: null, kvSelected: '' });
          updateKVTriggerText('');
        }
      } else {
        setState({ kv: null, kvSelected: '' });
        updateKVTriggerText('');
      }
    }
    
    if (currentPairsStructure !== lastPairsStructure || currentActiveIndex !== lastActiveIndex) {
      renderTitleSubtitlePairs();
      renderKVPairs();
      // Обновляем заголовок KV при смене активной пары или изменении структуры
      updateKVUI();
      lastPairsStructure = currentPairsStructure;
      lastActiveIndex = currentActiveIndex;
    }
  });
  // Инициализируем отображение пар при загрузке
  const initialState = getState();
  lastPairsStructure = serializePairsStructure(initialState.titleSubtitlePairs || []);
  lastActiveIndex = initialState.activePairIndex || 0;
  renderTitleSubtitlePairs();
  renderKVPairs();
};

// Функция полного обновления всех ассетов (логотипы и KV)
export const refreshAllAssets = async () => {
  // Показываем индикатор загрузки
  const refreshBtn = document.querySelector('[onclick="refreshAllAssets()"]');
  const originalText = refreshBtn ? refreshBtn.textContent : 'Обновить';
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Обновление...';
  }
  
  try {
    // Обновляем логотипы (очищает кэш и пересканирует)
    await refreshLogoColumns();
    
    // Обновляем KV (очищает кэш и пересканирует)
    await refreshKVColumns();
    
    // Если модальные окна открыты, обновляем их содержимое
    const logoModalOverlay = document.getElementById('logoSelectModalOverlay');
    const kvModalOverlay = document.getElementById('kvSelectModalOverlay');
    
    if (logoModalOverlay?.style.display === 'block') {
      // Модальное окно логотипов открыто - обновляем его содержимое
      await populateLogoColumns(true);
    }
    
    if (kvModalOverlay?.style.display === 'block') {
      // Модальное окно KV открыто - обновляем его содержимое
      await populateKVColumns(true);
    }
    
    // Обновляем превью медиа
    refreshMediaPreviews();
    
    // Показываем уведомление об успехе
    if (refreshBtn) {
      refreshBtn.textContent = '✓ Обновлено';
      setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
      }, 2000);
    }
  } catch (error) {
    console.error('Ошибка при обновлении ассетов:', error);
    if (refreshBtn) {
      refreshBtn.textContent = 'Ошибка';
      setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
      }, 2000);
    }
    alert('Произошла ошибка при обновлении. Попробуйте еще раз.');
  }
};


