/**
 * Компонент админки для управления размерами
 * Позволяет добавлять, редактировать и удалять размеры и платформы
 */

import { 
  getPresetSizes, 
  saveSizesConfig, 
  exportSizesConfig, 
  importSizesConfig,
  resetSizesConfig 
} from '../../utils/sizesConfig.js';
import { updatePresetSizesFromConfig } from '../../state/store.js';
import { renderPresetSizes, updatePreviewSizeSelect, updateSizesSummary } from './sizeManager.js';
import { renderer } from '../../renderer.js';

let adminModal = null;
let isAdminOpen = false;

/**
 * Создает и показывает модальное окно админки размеров
 */
export const showSizesAdmin = () => {
  console.log('showSizesAdmin вызвана');
  if (isAdminOpen) {
    console.log('Админка уже открыта');
    return;
  }
  
  isAdminOpen = true;
  const sizes = getPresetSizes();
  console.log('Размеры загружены:', sizes);
  
  // Создаем модальное окно
  adminModal = document.createElement('div');
  adminModal.id = 'sizesAdminModal';
  adminModal.className = 'sizes-admin-modal';
  
  // Применяем стили напрямую, чтобы гарантировать видимость
  adminModal.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 99999 !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
  `;
  
  // Получаем цвета из CSS переменных
  const root = getComputedStyle(document.documentElement);
  const bgSecondary = root.getPropertyValue('--bg-secondary') || '#141414';
  const borderColor = root.getPropertyValue('--border-color') || '#2a2a2a';
  
  adminModal.innerHTML = `
    <div class="sizes-admin-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px); z-index: 1;"></div>
    <div class="sizes-admin-content" style="position: relative; background: ${bgSecondary}; border: 1px solid ${borderColor}; border-radius: 12px; width: 90%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); z-index: 2; overflow: hidden;">
      <div class="sizes-admin-header">
        <h2>Админка размеров</h2>
        <button class="sizes-admin-close" id="sizesAdminClose">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="sizes-admin-body">
        <div class="sizes-admin-toolbar">
          <button class="btn btn-primary" id="sizesAdminAddPlatform">
            <span class="material-icons">add</span> Добавить платформу
          </button>
          <button class="btn" id="sizesAdminExport">
            <span class="material-icons">download</span> Экспорт JSON
          </button>
          <button class="btn" id="sizesAdminImport">
            <span class="material-icons">upload</span> Импорт JSON
          </button>
          <input type="file" id="sizesAdminImportFile" accept=".json" style="display: none;">
          <button class="btn btn-danger" id="sizesAdminReset">
            <span class="material-icons">refresh</span> Сбросить к дефолту
          </button>
        </div>
        <div class="sizes-admin-platforms" id="sizesAdminPlatforms"></div>
      </div>
      <div class="sizes-admin-footer">
        <button class="btn btn-primary" id="sizesAdminSave">Сохранить</button>
        <button class="btn" id="sizesAdminCancel">Отмена</button>
      </div>
    </div>
  `;
  
  try {
    document.body.appendChild(adminModal);
    console.log('Модальное окно добавлено в DOM');
    console.log('Модальное окно видимо:', adminModal.offsetParent !== null);
    console.log('Z-index модального окна:', window.getComputedStyle(adminModal).zIndex);
    
    // Рендерим платформы
    renderAdminPlatforms(sizes);
    console.log('Платформы отрендерены');
    
    // Обработчики событий
    setupAdminHandlers(sizes);
    console.log('Обработчики событий установлены');
  } catch (error) {
    console.error('Ошибка при создании админки:', error);
    isAdminOpen = false;
    throw error;
  }
  
  // Закрытие по клику на overlay
  const overlay = adminModal.querySelector('.sizes-admin-overlay');
  const closeBtn = adminModal.querySelector('#sizesAdminClose');
  const cancelBtn = adminModal.querySelector('#sizesAdminCancel');
  
  if (overlay) {
    overlay.addEventListener('click', closeSizesAdmin);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSizesAdmin);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeSizesAdmin);
  }
  
  // Закрытие по Escape
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeSizesAdmin();
    }
  };
  document.addEventListener('keydown', escapeHandler);
  adminModal._escapeHandler = escapeHandler;
  
  console.log('Админка размеров открыта');
};

/**
 * Закрывает модальное окно админки
 */
const closeSizesAdmin = () => {
  if (!isAdminOpen || !adminModal) return;
  
  if (adminModal._escapeHandler) {
    document.removeEventListener('keydown', adminModal._escapeHandler);
  }
  
  document.body.removeChild(adminModal);
  adminModal = null;
  isAdminOpen = false;
};

/**
 * Рендерит список платформ в админке
 */
const renderAdminPlatforms = (sizes) => {
  const container = document.getElementById('sizesAdminPlatforms');
  if (!container) return;
  
  let html = '';
  
  Object.keys(sizes).forEach((platform) => {
    html += `
      <div class="sizes-admin-platform" data-platform="${platform}">
        <div class="sizes-admin-platform-header">
          <input type="text" class="sizes-admin-platform-name" value="${platform}" data-original="${platform}">
          <button class="btn-small btn-danger" data-action="remove-platform" data-platform="${platform}">
            <span class="material-icons">delete</span>
          </button>
        </div>
        <div class="sizes-admin-sizes-list">
          ${sizes[platform].map((size, index) => `
            <div class="sizes-admin-size-item">
              <input type="number" class="sizes-admin-size-width" value="${size.width}" min="1" placeholder="Ширина">
              <span>×</span>
              <input type="number" class="sizes-admin-size-height" value="${size.height}" min="1" placeholder="Высота">
              <label>
                <input type="checkbox" ${size.checked ? 'checked' : ''} class="sizes-admin-size-checked">
                Выбрано
              </label>
              <button class="btn-small btn-danger" data-action="remove-size" data-platform="${platform}" data-index="${index}">
                <span class="material-icons">close</span>
              </button>
            </div>
          `).join('')}
        </div>
        <button class="btn-small" data-action="add-size" data-platform="${platform}">
          <span class="material-icons">add</span> Добавить размер
        </button>
      </div>
    `;
  });
  
  container.innerHTML = html;
};

/**
 * Настраивает обработчики событий для админки
 */
const setupAdminHandlers = (initialSizes) => {
  let currentSizes = JSON.parse(JSON.stringify(initialSizes));
  
  // Добавление платформы
  document.getElementById('sizesAdminAddPlatform').addEventListener('click', () => {
    const platformName = prompt('Введите название платформы:');
    if (platformName && platformName.trim()) {
      const name = platformName.trim();
      if (currentSizes[name]) {
        alert('Платформа с таким названием уже существует');
        return;
      }
      currentSizes[name] = [];
      renderAdminPlatforms(currentSizes);
      setupAdminHandlers(currentSizes);
    }
  });
  
  // Удаление платформы
  document.getElementById('sizesAdminPlatforms').addEventListener('click', (e) => {
    if (e.target.closest('[data-action="remove-platform"]')) {
      const platform = e.target.closest('[data-action="remove-platform"]').dataset.platform;
      if (confirm(`Удалить платформу "${platform}" и все её размеры?`)) {
        delete currentSizes[platform];
        renderAdminPlatforms(currentSizes);
        setupAdminHandlers(currentSizes);
      }
    }
  });
  
  // Переименование платформы
  document.getElementById('sizesAdminPlatforms').addEventListener('change', (e) => {
    if (e.target.classList.contains('sizes-admin-platform-name')) {
      const original = e.target.dataset.original;
      const newName = e.target.value.trim();
      
      if (newName && newName !== original) {
        if (currentSizes[newName]) {
          alert('Платформа с таким названием уже существует');
          e.target.value = original;
          return;
        }
        currentSizes[newName] = currentSizes[original];
        delete currentSizes[original];
        e.target.dataset.original = newName;
        // Обновляем data-platform в родительском элементе
        e.target.closest('.sizes-admin-platform').dataset.platform = newName;
        // Обновляем обработчики
        setupAdminHandlers(currentSizes);
      }
    }
  });
  
  // Добавление размера
  document.getElementById('sizesAdminPlatforms').addEventListener('click', (e) => {
    if (e.target.closest('[data-action="add-size"]')) {
      const platform = e.target.closest('[data-action="add-size"]').dataset.platform;
      if (!currentSizes[platform]) {
        currentSizes[platform] = [];
      }
      currentSizes[platform].push({ width: 1080, height: 1080, checked: true });
      renderAdminPlatforms(currentSizes);
      setupAdminHandlers(currentSizes);
    }
  });
  
  // Удаление размера
  document.getElementById('sizesAdminPlatforms').addEventListener('click', (e) => {
    if (e.target.closest('[data-action="remove-size"]')) {
      const btn = e.target.closest('[data-action="remove-size"]');
      const platform = btn.dataset.platform;
      const index = parseInt(btn.dataset.index, 10);
      if (currentSizes[platform] && currentSizes[platform][index]) {
        currentSizes[platform].splice(index, 1);
        renderAdminPlatforms(currentSizes);
        setupAdminHandlers(currentSizes);
      }
    }
  });
  
  // Обновление размеров при изменении полей
  document.getElementById('sizesAdminPlatforms').addEventListener('input', (e) => {
    const sizeItem = e.target.closest('.sizes-admin-size-item');
    if (!sizeItem) return;
    
    const platform = sizeItem.closest('.sizes-admin-platform').dataset.platform;
    const index = Array.from(sizeItem.parentElement.children).indexOf(sizeItem);
    
    if (currentSizes[platform] && currentSizes[platform][index]) {
      const widthInput = sizeItem.querySelector('.sizes-admin-size-width');
      const heightInput = sizeItem.querySelector('.sizes-admin-size-height');
      const checkedInput = sizeItem.querySelector('.sizes-admin-size-checked');
      
      if (widthInput) {
        const width = parseInt(widthInput.value, 10);
        if (!isNaN(width) && width > 0) {
          currentSizes[platform][index].width = width;
        }
      }
      if (heightInput) {
        const height = parseInt(heightInput.value, 10);
        if (!isNaN(height) && height > 0) {
          currentSizes[platform][index].height = height;
        }
      }
      if (checkedInput) {
        currentSizes[platform][index].checked = checkedInput.checked;
      }
    }
  });
  
  // Сохранение
  document.getElementById('sizesAdminSave').addEventListener('click', () => {
    // Валидация
    for (const [platform, sizes] of Object.entries(currentSizes)) {
      if (!platform || !platform.trim()) {
        alert('Название платформы не может быть пустым');
        return;
      }
      for (const size of sizes) {
        if (!size.width || !size.height || size.width <= 0 || size.height <= 0) {
          alert(`Некорректный размер в платформе "${platform}"`);
          return;
        }
      }
    }
    
    saveSizesConfig(currentSizes);
    updatePresetSizesFromConfig();
    renderPresetSizes();
    updatePreviewSizeSelect();
    updateSizesSummary();
    renderer.render();
    closeSizesAdmin();
    alert('Размеры успешно сохранены!');
  });
  
  // Экспорт
  document.getElementById('sizesAdminExport').addEventListener('click', () => {
    exportSizesConfig();
  });
  
  // Импорт
  document.getElementById('sizesAdminImport').addEventListener('click', () => {
    document.getElementById('sizesAdminImportFile').click();
  });
  
  document.getElementById('sizesAdminImportFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const imported = await importSizesConfig(file);
      currentSizes = imported;
      renderAdminPlatforms(currentSizes);
      setupAdminHandlers(currentSizes);
      alert('Размеры успешно импортированы!');
    } catch (error) {
      alert(`Ошибка импорта: ${error.message}`);
    }
    e.target.value = '';
  });
  
  // Сброс
  document.getElementById('sizesAdminReset').addEventListener('click', () => {
    if (confirm('Сбросить все размеры к дефолтным? Это действие нельзя отменить.')) {
      const defaults = resetSizesConfig();
      currentSizes = defaults;
      renderAdminPlatforms(currentSizes);
      setupAdminHandlers(currentSizes);
    }
  });
};

// Делаем функцию доступной глобально
if (typeof window !== 'undefined') {
  window.showSizesAdmin = showSizesAdmin;
}

