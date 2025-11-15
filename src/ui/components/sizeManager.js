/**
 * Модуль для управления размерами
 * Содержит функции управления пресетными и кастомными размерами
 */

import { getState, setKey } from '../../state/store.js';
import { PRESET_SIZES } from '../../constants.js';
import {
  togglePresetSize,
  selectAllPresetSizes,
  deselectAllPresetSizes,
  getCheckedSizes,
  addCustomSize,
  removeCustomSize,
  toggleCustomSize
} from '../../state/store.js';
import { renderer } from '../../renderer.js';
import { getDom } from '../domCache.js';

/**
 * Обновляет сводку выбранных размеров
 */
export const updateSizesSummary = () => {
  const dom = getDom();
  if (!dom.sizesSummary) return;
  const sizes = getCheckedSizes();
  dom.sizesSummary.textContent = `Выбрано: ${sizes.length} размеров`;
};

/**
 * Рендерит пресетные размеры
 */
export const renderPresetSizes = () => {
  const state = getState();
  const dom = getDom();
  if (!dom.presetSizesList) return;
  
  let html = '';
  Object.keys(state.presetSizes).forEach((platform) => {
    html += `
      <div class="platform-group" id="platform-group-${platform}">
        <div class="platform-header" onclick="togglePlatformSizes('${platform}')">
          <span>${platform}</span>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="platform-sizes collapsed" id="sizes-${platform}">
    `;
    state.presetSizes[platform].forEach((size, index) => {
      const id = `size-${platform}-${index}`;
      html += `
        <div class="size-checkbox-item">
          <input type="checkbox" id="${id}" data-platform="${platform}" data-index="${index}" ${
            size.checked ? 'checked' : ''
          } onchange="toggleSizeAction('${platform}', ${index})">
          <label for="${id}">${size.width} × ${size.height}</label>
        </div>
      `;
    });
    html += `
        </div>
      </div>
    `;
  });
  
  dom.presetSizesList.innerHTML = html;
  updateSizesSummary();
  
  // Также обновляем кастомные размеры
  renderCustomSizes();
};

/**
 * Рендерит кастомные размеры
 */
export const renderCustomSizes = () => {
  const state = getState();
  const customSizesSection = document.getElementById('customSizesSection');
  const customSizesList = document.getElementById('customSizesList');
  
  if (!customSizesSection || !customSizesList) return;
  
  if (state.customSizes && state.customSizes.length > 0) {
    customSizesSection.style.display = 'block';
    let html = '';
    state.customSizes.forEach((size) => {
      const id = `custom-size-${size.id}`;
      html += `
        <div class="size-checkbox-item" style="position: relative;">
          <input type="checkbox" id="${id}" data-custom-id="${size.id}" ${
            size.checked ? 'checked' : ''
          } onchange="toggleCustomSizeAction('${size.id}')">
          <label for="${id}" style="flex: 1;">${size.width} × ${size.height}</label>
          <button onclick="removeCustomSizeAction('${size.id}')" class="btn-small btn-danger" style="border: none; cursor: pointer; font-size: 16px; line-height: 1; opacity: 0.7; transition: opacity 0.2s; padding: 4px 8px;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Удалить">×</button>
        </div>
      `;
    });
    customSizesList.innerHTML = html;
    updateSizesSummary();
  } else {
    customSizesSection.style.display = 'none';
    customSizesList.innerHTML = '';
  }
};

/**
 * Обновляет селект размеров для превью
 */
export const updatePreviewSizeSelect = () => {
  const categorized = renderer.getCategorizedSizes();
  const indices = renderer.getCategoryIndices();
  
  // Обновляем категорию "Узкие"
  const narrowBtn = document.getElementById('previewSizeSelectNarrowBtn');
  const narrowText = document.getElementById('previewSizeSelectNarrowText');
  const narrowDropdown = document.getElementById('previewSizeSelectNarrowDropdown');
  
  if (narrowBtn && narrowText && narrowDropdown) {
    if (categorized.narrow.length === 0) {
      narrowText.textContent = 'Нет размеров';
      narrowDropdown.innerHTML = '';
    } else {
      const selectedIndex = (indices.narrow >= 0 && indices.narrow < categorized.narrow.length) 
        ? indices.narrow 
        : 0;
      const selectedSize = categorized.narrow[selectedIndex];
      narrowText.textContent = `${selectedSize.width} × ${selectedSize.height} (${selectedSize.platform})`;
      
      narrowDropdown.innerHTML = '';
      categorized.narrow.forEach((size, index) => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        if (index === selectedIndex) {
          option.classList.add('selected');
        }
        option.textContent = `${size.width} × ${size.height} (${size.platform})`;
        option.onclick = () => {
          changePreviewSizeCategory('narrow', index.toString());
        };
        narrowDropdown.appendChild(option);
      });
    }
  }
  
  // Обновляем категорию "Широкие"
  const wideBtn = document.getElementById('previewSizeSelectWideBtn');
  const wideText = document.getElementById('previewSizeSelectWideText');
  const wideDropdown = document.getElementById('previewSizeSelectWideDropdown');
  
  if (wideBtn && wideText && wideDropdown) {
    if (categorized.wide.length === 0) {
      wideText.textContent = 'Нет размеров';
      wideDropdown.innerHTML = '';
    } else {
      const defaultIndex = categorized.wide.findIndex(size => size.width === 1600 && size.height === 1200);
      const selectedIndex = (indices.wide >= 0 && indices.wide < categorized.wide.length) 
        ? indices.wide 
        : (defaultIndex >= 0 ? defaultIndex : 0);
      const selectedSize = categorized.wide[selectedIndex];
      wideText.textContent = `${selectedSize.width} × ${selectedSize.height} (${selectedSize.platform})`;
      
      wideDropdown.innerHTML = '';
      categorized.wide.forEach((size, index) => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        if (index === selectedIndex) {
          option.classList.add('selected');
        }
        option.textContent = `${size.width} × ${size.height} (${size.platform})`;
        option.onclick = () => {
          changePreviewSizeCategory('wide', index.toString());
        };
        wideDropdown.appendChild(option);
      });
    }
  }
  
  // Обновляем категорию "Квадратные"
  const squareBtn = document.getElementById('previewSizeSelectSquareBtn');
  const squareText = document.getElementById('previewSizeSelectSquareText');
  const squareDropdown = document.getElementById('previewSizeSelectSquareDropdown');
  
  if (squareBtn && squareText && squareDropdown) {
    if (categorized.square.length === 0) {
      squareText.textContent = 'Нет размеров';
      squareDropdown.innerHTML = '';
    } else {
      const selectedIndex = (indices.square >= 0 && indices.square < categorized.square.length) 
        ? indices.square 
        : 0;
      const selectedSize = categorized.square[selectedIndex];
      squareText.textContent = `${selectedSize.width} × ${selectedSize.height} (${selectedSize.platform})`;
      
      squareDropdown.innerHTML = '';
      categorized.square.forEach((size, index) => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        if (index === selectedIndex) {
          option.classList.add('selected');
        }
        option.textContent = `${size.width} × ${size.height} (${size.platform})`;
        option.onclick = () => {
          changePreviewSizeCategory('square', index.toString());
        };
        squareDropdown.appendChild(option);
      });
    }
  }
  
  // Закрываем все дропдауны
  [
    document.getElementById('previewSizeSelectNarrowDropdown'),
    document.getElementById('previewSizeSelectWideDropdown'),
    document.getElementById('previewSizeSelectSquareDropdown')
  ].forEach(dropdown => {
    if (dropdown) dropdown.style.display = 'none';
  });
};

/**
 * Переключает размер превью по категории
 */
export const changePreviewSizeCategory = (category, index) => {
  const categorized = renderer.getCategorizedSizes();
  const sizes = categorized[category] || [];
  const idx = Number(index) || 0;
  if (sizes[idx]) {
    // Обновляем текст кнопки сразу
    const size = sizes[idx];
    if (category === 'narrow') {
      const narrowText = document.getElementById('previewSizeSelectNarrowText');
      if (narrowText) {
        narrowText.textContent = `${size.width} × ${size.height} (${size.platform})`;
      }
    } else if (category === 'wide') {
      const wideText = document.getElementById('previewSizeSelectWideText');
      if (wideText) {
        wideText.textContent = `${size.width} × ${size.height} (${size.platform})`;
      }
    } else if (category === 'square') {
      const squareText = document.getElementById('previewSizeSelectSquareText');
      if (squareText) {
        squareText.textContent = `${size.width} × ${size.height} (${size.platform})`;
      }
    }
    
    // Устанавливаем индекс для категории и запускаем рендеринг
    renderer.setCategoryIndex(category, idx, true);
    
    // Обновляем UI селектора после небольшой задержки
    setTimeout(() => {
      updatePreviewSizeSelect();
    }, 50);
    
    // Прокручиваем к области превью канваса после завершения рендеринга
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Прокручиваем к конкретному canvas в зависимости от категории
          let targetCanvas = null;
          if (category === 'narrow') {
            targetCanvas = document.getElementById('previewCanvasNarrow');
          } else if (category === 'wide') {
            targetCanvas = document.getElementById('previewCanvasWide');
          } else if (category === 'square') {
            targetCanvas = document.getElementById('previewCanvasSquare');
          }
          
          // Если нашли конкретный canvas, прокручиваем к нему, иначе к области
          const scrollTarget = targetCanvas || document.getElementById('canvasArea');
          if (scrollTarget) {
            // Получаем позицию элемента
            const rect = scrollTarget.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
            
            // Вычисляем позицию для центрирования элемента
            const targetY = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);
            const targetX = rect.left + scrollLeft - (window.innerWidth / 2) + (rect.width / 2);
            
            // Прокручиваем к элементу
            if (window.scrollTo && typeof window.scrollTo === 'function') {
              window.scrollTo({ 
                top: Math.max(0, targetY), 
                left: Math.max(0, targetX), 
                behavior: 'smooth' 
              });
            } else {
              // Fallback для очень старых браузеров
              window.scrollTo(Math.max(0, targetX), Math.max(0, targetY));
            }
          }
        }, 200);
      });
    });
  }
};

/**
 * Переключает пресетный размер
 */
export const toggleSize = (platform, index) => {
  togglePresetSize(platform, index);
  updatePreviewSizeSelect();
  updateSizesSummary();
  renderer.render();
};

/**
 * Переключает кастомный размер
 */
export const toggleCustomSizeAction = (id) => {
  toggleCustomSize(id);
  updatePreviewSizeSelect();
  updateSizesSummary();
  renderer.render();
};

/**
 * Удаляет кастомный размер
 */
export const removeCustomSizeAction = (id) => {
  removeCustomSize(id);
  renderCustomSizes();
  updatePreviewSizeSelect();
  updateSizesSummary();
  renderer.render();
};

/**
 * Добавляет кастомный размер
 */
export const addCustomSizeAction = (width, height) => {
  if (!width || !height || width <= 0 || height <= 0) {
    alert('Пожалуйста, введите корректные размеры.');
    return;
  }
  
  addCustomSize(width, height);
  renderCustomSizes();
  updatePreviewSizeSelect();
  updateSizesSummary();
  renderer.render();
};

/**
 * Обновляет состояние кнопки добавления размера
 */
export const updateAddSizeButtonState = () => {
  const widthInput = document.getElementById('customWidth');
  const heightInput = document.getElementById('customHeight');
  const addButton = document.getElementById('addSizeButton');
  
  if (!widthInput || !heightInput || !addButton) return;
  
  const width = parseInt(widthInput.value, 10);
  const height = parseInt(heightInput.value, 10);
  
  if (width > 0 && height > 0) {
    addButton.disabled = false;
    addButton.style.opacity = '1';
    addButton.style.cursor = 'pointer';
  } else {
    addButton.disabled = true;
    addButton.style.opacity = '0.5';
    addButton.style.cursor = 'not-allowed';
  }
};

/**
 * Добавляет кастомный размер из полей ввода
 */
export const addCustomSizeFromInput = () => {
  const widthInput = document.getElementById('customWidth');
  const heightInput = document.getElementById('customHeight');
  
  if (!widthInput || !heightInput) return;
  
  const width = parseInt(widthInput.value, 10);
  const height = parseInt(heightInput.value, 10);
  
  if (!width || !height || width <= 0 || height <= 0) {
    alert('Пожалуйста, введите корректные размеры.');
    return;
  }
  
  addCustomSizeAction(width, height);
  
  // Очищаем поля ввода
  widthInput.value = '';
  heightInput.value = '';
  updateAddSizeButtonState();
};

/**
 * Выбирает все размеры
 */
export const selectAllSizesAction = () => {
  selectAllPresetSizes();
  renderPresetSizes();
  updatePreviewSizeSelect();
  updateSizesSummary();
  renderer.render();
};

/**
 * Снимает выбор со всех размеров
 */
export const deselectAllSizesAction = () => {
  deselectAllPresetSizes();
  renderPresetSizes();
  updatePreviewSizeSelect();
  updateSizesSummary();
  renderer.render();
};

/**
 * Переключает видимость размеров платформы
 */
export const togglePlatformSizes = (platform) => {
  const sizesEl = document.getElementById(`sizes-${platform}`);
  const platformGroup = document.getElementById(`platform-group-${platform}`);
  if (sizesEl && platformGroup) {
    sizesEl.classList.toggle('collapsed');
    const isCollapsed = sizesEl.classList.contains('collapsed');
    const toggleIcon = platformGroup.querySelector('.toggle-icon');
    if (toggleIcon) {
      toggleIcon.textContent = isCollapsed ? '▼' : '▲';
    }
  }
};

/**
 * Инициализирует UI для работы с размерами
 */
export const initializeSizeManager = () => {
  renderPresetSizes();
  updatePreviewSizeSelect();
  updateSizesSummary();
  
  // Инициализируем обработчики для кастомных размеров
  const widthInput = document.getElementById('customWidthInput');
  const heightInput = document.getElementById('customHeightInput');
  
  if (widthInput && heightInput) {
    widthInput.addEventListener('input', updateAddSizeButtonState);
    heightInput.addEventListener('input', updateAddSizeButtonState);
    widthInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addCustomSizeFromInput();
      }
    });
    heightInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addCustomSizeFromInput();
      }
    });
  }
  
  const addButton = document.getElementById('addSizeButton');
  if (addButton) {
    addButton.addEventListener('click', addCustomSizeFromInput);
  }
};

// Делаем функции доступными глобально для использования в HTML
if (typeof window !== 'undefined') {
  window.toggleSizeAction = toggleSize;
  window.toggleCustomSizeAction = toggleCustomSizeAction;
  window.removeCustomSizeAction = removeCustomSizeAction;
  window.addCustomSizeAction = addCustomSizeAction;
  window.updateAddSizeButtonState = updateAddSizeButtonState;
  window.togglePlatformSizes = togglePlatformSizes;
  window.changePreviewSizeCategory = changePreviewSizeCategory;
}

