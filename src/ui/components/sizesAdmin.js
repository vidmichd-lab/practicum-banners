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
import { updatePresetSizesFromConfig, getState, setKey, setState, batch } from '../../state/store.js';
import { renderPresetSizes, updatePreviewSizeSelect, updateSizesSummary } from './sizeManager.js';
import { renderer } from '../../renderer.js';
import { openLogoSelectModal, closeLogoSelectModal, selectPreloadedLogo } from './logoSelector.js';
import { openKVSelectModal, closeKVSelectModal, selectPreloadedKV } from './kvSelector.js';
import { handleLogoUpload, handleKVUpload, handleBgUpload, handlePartnerLogoUpload } from '../ui.js';
import { updateBgColor, applyPresetBgColor, openBGSelectModal } from './backgroundSelector.js';
import { PRESET_BACKGROUND_COLORS } from '../../constants.js';
import { autoSelectLogoByTextColor } from '../ui.js';

let adminModal = null;
let isAdminOpen = false;
// Сохраняем исходные значения для возможности отката
let originalDefaults = null;

/**
 * Рендерит вкладку с настройками по умолчанию
 */
const renderDefaultsTab = () => {
  const state = getState();
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#2a2a2a';
  const bgPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#0d0d0d';
  const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#e9e9e9';
  const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999999';
  
  // Сохраняем исходные значения при первом рендере
  if (!originalDefaults) {
    originalDefaults = JSON.parse(JSON.stringify({
      logoSelected: state.logoSelected || '',
      kvSelected: state.kvSelected || '',
      title: state.title || '',
      subtitle: state.subtitle || '',
      legal: state.legal || '',
      age: state.age || '18+',
      bgColor: state.bgColor || '#1e1e1e',
      bgImage: state.bgImage || null,
      titleColor: state.titleColor || '#ffffff',
      subtitleColor: state.subtitleColor || '#e0e0e0',
      subtitleOpacity: state.subtitleOpacity ?? 90,
      legalColor: state.legalColor || '#ffffff',
      legalOpacity: state.legalOpacity ?? 60,
      titleAlign: state.titleAlign || 'left',
      subtitleAlign: state.subtitleAlign || 'left',
      legalAlign: state.legalAlign || 'left',
      titleVPos: state.titleVPos || 'top',
      titleSize: state.titleSize ?? 8,
      subtitleSize: state.subtitleSize ?? 4,
      titleSubtitleRatio: state.titleSubtitleRatio ?? 0.5,
      legalSize: state.legalSize ?? 2,
      ageSize: state.ageSize ?? 4,
      logoSize: state.logoSize ?? 40,
      titleWeight: state.titleWeight || 'Regular',
      subtitleWeight: state.subtitleWeight || 'Regular',
      legalWeight: state.legalWeight || 'Regular',
      ageWeight: state.ageWeight || 'Regular',
      titleLetterSpacing: state.titleLetterSpacing ?? 0,
      subtitleLetterSpacing: state.subtitleLetterSpacing ?? 0,
      legalLetterSpacing: state.legalLetterSpacing ?? 0,
      titleLineHeight: state.titleLineHeight ?? 1.1,
      subtitleLineHeight: state.subtitleLineHeight ?? 1.2,
      legalLineHeight: state.legalLineHeight ?? 1.4,
      subtitleGap: state.subtitleGap ?? -1,
      ageGapPercent: state.ageGapPercent ?? 1,
      logoPos: state.logoPos || 'left',
      logoLanguage: state.logoLanguage || 'ru',
      partnerLogoFile: state.partnerLogoFile || null,
      kvBorderRadius: state.kvBorderRadius ?? 0,
      kvPosition: state.kvPosition || 'center',
      bgSize: state.bgSize || 'cover',
      bgPosition: state.bgPosition || 'center',
      bgVPosition: state.bgVPosition || 'center',
      textGradientOpacity: state.textGradientOpacity ?? 100,
      paddingPercent: state.paddingPercent ?? 5,
      layoutMode: state.layoutMode || 'auto'
    }));
  }
  
  const hasLogo = !!(state.logoSelected && state.logoSelected !== originalDefaults.logoSelected);
  const hasKV = !!(state.kvSelected && state.kvSelected !== originalDefaults.kvSelected);
  
  // Функция для преобразования hex в rgba
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  // Цвета для группировки элементов
  const colorTitle = '#FF6B6B';
  const colorSubtitle = '#4ECDC4';
  const colorLegal = '#95E1D3';
  const colorAge = '#F38181';
  const colorLogo = '#AA96DA';
  const colorKV = '#FCBAD3';
  const colorBg = '#FFD93D';
  
  return `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="padding: 14px; background: rgba(33, 150, 243, 0.12); border-left: 4px solid #2196F3; border-radius: 6px; margin-bottom: 4px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span class="material-icons" style="font-size: 20px; color: #2196F3; flex-shrink: 0; margin-top: 2px;">info</span>
          <div>
            <div style="font-weight: 600; color: ${textPrimary}; margin-bottom: 4px; font-size: 14px;">Значения по умолчанию</div>
            <div style="font-size: 12px; color: ${textSecondary}; line-height: 1.5;">Эти значения используются при создании нового проекта или сбросе настроек. Элементы сгруппированы по типам для удобства навигации.</div>
          </div>
        </div>
      </div>
      
      <div style="border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px; background: rgba(255, 255, 255, 0.02);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${borderColor};">
          <span class="material-icons" style="color: #FF9800; font-size: 20px;">image</span>
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Медиа-элементы</h3>
        </div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group">
            <label style="font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span class="material-icons" style="font-size: 18px; color: ${textSecondary};">account_circle</span>
              Логотип по умолчанию
            </label>
        <div id="defaultLogoPreview" class="preview-container" style="width: 100%; height: 60px; background: ${bgPrimary}; border: 1px solid ${borderColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; cursor: pointer; position: relative;">
          <img id="defaultLogoPreviewImg" src="${state.logoSelected || ''}" style="max-width: 100%; max-height: 100%; display: none;">
          <span id="defaultLogoPreviewPlaceholder" style="color: ${textPrimary}; opacity: 0.5;">— Нет —</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn" id="defaultLogoSelect" style="flex: 1;"><span class="material-icons" style="font-size: 18px; margin-right: 4px;">folder</span>Выбрать из библиотеки</button>
          <button class="btn" id="defaultLogoUpload" style="flex: 1;"><span class="material-icons" style="font-size: 18px; margin-right: 4px;">upload</span>Загрузить</button>
          <button class="btn btn-danger" id="defaultLogoClear" style="flex: 0 0 auto; display: ${hasLogo ? 'block' : 'none'};" title="Вернуть исходное значение"><span class="material-icons" style="font-size: 18px;">delete</span></button>
          <input type="file" id="defaultLogoUploadFile" accept="image/*,.svg" style="display: none;">
        </div>
      </div>
      
      <div class="form-group">
        <label style="font-weight: 600; margin-bottom: 8px;">Партнерский логотип (КЗ) по умолчанию</label>
        <div id="defaultPartnerLogoPreview" class="preview-container" style="width: 100%; height: 60px; background: ${bgPrimary}; border: 1px solid ${borderColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; cursor: pointer; position: relative;">
          <img id="defaultPartnerLogoPreviewImg" src="${state.partnerLogoFile || ''}" style="max-width: 100%; max-height: 100%; display: ${state.partnerLogoFile ? 'block' : 'none'};">
          <span id="defaultPartnerLogoPreviewPlaceholder" style="color: ${textPrimary}; opacity: 0.5; display: ${state.partnerLogoFile ? 'none' : 'block'};">— Нет —</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn" id="defaultPartnerLogoUpload" style="flex: 1;"><span class="material-icons" style="font-size: 18px; margin-right: 4px;">upload</span>Загрузить</button>
          <button class="btn btn-danger" id="defaultPartnerLogoClear" style="flex: 0 0 auto; display: ${state.partnerLogoFile ? 'block' : 'none'};" title="Удалить"><span class="material-icons" style="font-size: 18px;">delete</span></button>
          <input type="file" id="defaultPartnerLogoUploadFile" accept="image/*,.svg" style="display: none;">
        </div>
      </div>
      
      <div class="form-group">
        <label style="font-weight: 600; margin-bottom: 8px;">KV по умолчанию</label>
        <div id="defaultKVPreview" class="preview-container" style="width: 100%; height: 60px; background: ${bgPrimary}; border: 1px solid ${borderColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; cursor: pointer; position: relative;">
          <img id="defaultKVPreviewImg" src="${state.kvSelected || ''}" style="max-width: 100%; max-height: 100%; display: none;">
          <span id="defaultKVPreviewPlaceholder" style="color: ${textPrimary}; opacity: 0.5;">— Нет —</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn" id="defaultKVSelect" style="flex: 1;"><span class="material-icons" style="font-size: 18px; margin-right: 4px;">folder</span>Выбрать из библиотеки</button>
          <button class="btn" id="defaultKVUpload" style="flex: 1;"><span class="material-icons" style="font-size: 18px; margin-right: 4px;">upload</span>Загрузить</button>
          <button class="btn btn-danger" id="defaultKVClear" style="flex: 0 0 auto; display: ${hasKV ? 'block' : 'none'};" title="Вернуть исходное значение"><span class="material-icons" style="font-size: 18px;">delete</span></button>
          <input type="file" id="defaultKVUploadFile" accept="image/*" style="display: none;">
        </div>
      </div>
      
      <div class="form-group">
        <label style="font-weight: 600; margin-bottom: 8px;">Заголовок по умолчанию</label>
        <textarea id="defaultTitle" style="width: 100%; min-height: 60px; padding: 12px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px; resize: vertical;">${state.title || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label style="font-weight: 600; margin-bottom: 8px;">Подзаголовок по умолчанию</label>
        <textarea id="defaultSubtitle" style="width: 100%; min-height: 60px; padding: 12px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px; resize: vertical;">${state.subtitle || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label style="font-weight: 600; margin-bottom: 8px;">Юридический текст по умолчанию</label>
        <textarea id="defaultLegal" style="width: 100%; min-height: 80px; padding: 12px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px; resize: vertical;">${state.legal || ''}</textarea>
      </div>
      
      <div class="form-group">
        <label style="font-weight: 600; margin-bottom: 8px;">Возрастное ограничение по умолчанию</label>
        <input type="text" id="defaultAge" value="${state.age || '18+'}" style="width: 100%; padding: 12px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
      </div>
      
      <div class="form-group">
        <label style="font-weight: 600; margin-bottom: 8px;">Фон по умолчанию</label>
        <div id="defaultBgPreview" class="preview-container" style="width: 100%; height: 60px; background: ${state.bgColor || '#1e1e1e'}; border: 1px solid ${borderColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; position: relative;">
          <img id="defaultBgPreviewImg" src="${state.bgImage || ''}" style="max-width: 100%; max-height: 100%; display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
          <span id="defaultBgPreviewPlaceholder" style="color: ${textPrimary}; opacity: 0.5; z-index: 1;">${state.bgImage ? 'Изображение' : 'Цвет: ' + (state.bgColor || '#1e1e1e')}</span>
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <input type="color" id="defaultBgColor" value="${state.bgColor || '#1e1e1e'}" style="width: 60px; height: 40px; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer;">
          <input type="text" id="defaultBgColorHex" value="${state.bgColor || '#1e1e1e'}" placeholder="#1e1e1e" style="flex: 1; padding: 12px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          <button class="btn btn-danger" id="defaultBgColorReset" style="flex: 0 0 auto; display: ${state.bgColor !== originalDefaults.bgColor ? 'block' : 'none'};" title="Вернуть исходный цвет"><span class="material-icons" style="font-size: 18px;">refresh</span></button>
        </div>
        <button class="btn" id="defaultBgUpload" style="width: 100%;"><span class="material-icons" style="font-size: 18px; margin-right: 4px;">upload</span>Загрузить изображение</button>
        <input type="file" id="defaultBgUploadFile" accept="image/*" style="display: none;">
        <button class="btn btn-danger" id="defaultBgClear" style="width: 100%; margin-top: 8px; display: ${state.bgImage ? 'block' : 'none'};"><span class="material-icons" style="font-size: 18px; margin-right: 4px;">delete</span>Удалить изображение</button>
      </div>
      
      <div class="form-group">
        <label style="font-weight: 600; margin-bottom: 8px;">Цвет заголовка по умолчанию</label>
        <div style="display: flex; gap: 8px;">
          <input type="color" id="defaultTextColor" value="${state.titleColor || '#ffffff'}" style="width: 60px; height: 40px; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer;">
          <input type="text" id="defaultTextColorHex" value="${state.titleColor || '#ffffff'}" placeholder="#ffffff" style="flex: 1; padding: 12px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          <button class="btn btn-danger" id="defaultTextColorReset" style="flex: 0 0 auto; display: ${state.titleColor !== originalDefaults.titleColor ? 'block' : 'none'};" title="Вернуть исходный цвет"><span class="material-icons" style="font-size: 18px;">refresh</span></button>
        </div>
      </div>
      
      <div style="border: 1px solid ${hexToRgba(colorTitle, 0.4)}; border-left: 4px solid ${colorTitle}; border-radius: 8px; padding: 16px; background: ${hexToRgba(colorTitle, 0.08)}; margin-top: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorTitle, 0.3)};">
          <div style="width: 32px; height: 32px; border-radius: 6px; background: ${hexToRgba(colorTitle, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorTitle}; font-size: 20px;">title</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Настройки заголовка</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">Основной текст макета</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Размер (%)</label>
            <input type="number" id="defaultTitleSize" value="${state.titleSize ?? 8}" step="0.1" min="1" max="20" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Вес шрифта</label>
            <select id="defaultTitleWeight" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="Thin" ${state.titleWeight === 'Thin' ? 'selected' : ''}>Thin</option>
              <option value="ExtraLight" ${state.titleWeight === 'ExtraLight' ? 'selected' : ''}>ExtraLight</option>
              <option value="Light" ${state.titleWeight === 'Light' ? 'selected' : ''}>Light</option>
              <option value="Regular" ${state.titleWeight === 'Regular' || !state.titleWeight ? 'selected' : ''}>Regular</option>
              <option value="Medium" ${state.titleWeight === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="SemiBold" ${state.titleWeight === 'SemiBold' ? 'selected' : ''}>SemiBold</option>
              <option value="Bold" ${state.titleWeight === 'Bold' ? 'selected' : ''}>Bold</option>
              <option value="Heavy" ${state.titleWeight === 'Heavy' ? 'selected' : ''}>Heavy</option>
              <option value="Black" ${state.titleWeight === 'Black' ? 'selected' : ''}>Black</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Выравнивание</label>
            <select id="defaultTitleAlign" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="left" ${state.titleAlign === 'left' || !state.titleAlign ? 'selected' : ''}>Слева</option>
              <option value="center" ${state.titleAlign === 'center' ? 'selected' : ''}>По центру</option>
              <option value="right" ${state.titleAlign === 'right' ? 'selected' : ''}>Справа</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Вертикальная позиция</label>
            <select id="defaultTitleVPos" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="top" ${state.titleVPos === 'top' || !state.titleVPos ? 'selected' : ''}>Вверху</option>
              <option value="center" ${state.titleVPos === 'center' ? 'selected' : ''}>По центру</option>
              <option value="bottom" ${state.titleVPos === 'bottom' ? 'selected' : ''}>Внизу</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Межбуквенное расстояние</label>
            <input type="number" id="defaultTitleLetterSpacing" value="${state.titleLetterSpacing ?? 0}" step="0.1" min="-5" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Межстрочный интервал</label>
            <input type="number" id="defaultTitleLineHeight" value="${state.titleLineHeight ?? 1.1}" step="0.1" min="0.5" max="3" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="border: 1px solid ${hexToRgba(colorSubtitle, 0.4)}; border-left: 4px solid ${colorSubtitle}; border-radius: 8px; padding: 16px; background: ${hexToRgba(colorSubtitle, 0.08)}; margin-top: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorSubtitle, 0.3)};">
          <div style="width: 32px; height: 32px; border-radius: 6px; background: ${hexToRgba(colorSubtitle, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorSubtitle}; font-size: 20px;">subtitles</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Настройки подзаголовка</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">Дополнительный текст под заголовком</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Цвет</label>
            <div style="display: flex; gap: 8px;">
              <input type="color" id="defaultSubtitleColor" value="${state.subtitleColor || '#e0e0e0'}" style="width: 60px; height: 40px; border: 1px solid ${borderColor}; border-radius: 6px; cursor: pointer;">
              <input type="text" id="defaultSubtitleColorHex" value="${state.subtitleColor || '#e0e0e0'}" placeholder="#e0e0e0" style="flex: 1; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
            </div>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Прозрачность (%)</label>
            <input type="number" id="defaultSubtitleOpacity" value="${state.subtitleOpacity ?? 90}" step="1" min="0" max="100" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Размер (%)</label>
            <input type="number" id="defaultSubtitleSize" value="${state.subtitleSize ?? 4}" step="0.1" min="1" max="20" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Коэффициент зависимости от заголовка</label>
            <input type="range" id="defaultTitleSubtitleRatio" value="${state.titleSubtitleRatio ?? 0.5}" step="0.01" min="0.1" max="1" style="width: 100%;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: ${textSecondary}; margin-top: 4px;">
              <span>0.1</span>
              <span id="defaultTitleSubtitleRatioValue">${(state.titleSubtitleRatio ?? 0.5).toFixed(2)}</span>
              <span>1.0</span>
            </div>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 4px;">Коэффициент определяет, во сколько раз подзаголовок меньше заголовка (0.5 = в 2 раза меньше)</div>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Вес шрифта</label>
            <select id="defaultSubtitleWeight" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="Thin" ${state.subtitleWeight === 'Thin' ? 'selected' : ''}>Thin</option>
              <option value="ExtraLight" ${state.subtitleWeight === 'ExtraLight' ? 'selected' : ''}>ExtraLight</option>
              <option value="Light" ${state.subtitleWeight === 'Light' ? 'selected' : ''}>Light</option>
              <option value="Regular" ${state.subtitleWeight === 'Regular' || !state.subtitleWeight ? 'selected' : ''}>Regular</option>
              <option value="Medium" ${state.subtitleWeight === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="SemiBold" ${state.subtitleWeight === 'SemiBold' ? 'selected' : ''}>SemiBold</option>
              <option value="Bold" ${state.subtitleWeight === 'Bold' ? 'selected' : ''}>Bold</option>
              <option value="Heavy" ${state.subtitleWeight === 'Heavy' ? 'selected' : ''}>Heavy</option>
              <option value="Black" ${state.subtitleWeight === 'Black' ? 'selected' : ''}>Black</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Выравнивание</label>
            <select id="defaultSubtitleAlign" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="left" ${state.subtitleAlign === 'left' || !state.subtitleAlign ? 'selected' : ''}>Слева</option>
              <option value="center" ${state.subtitleAlign === 'center' ? 'selected' : ''}>По центру</option>
              <option value="right" ${state.subtitleAlign === 'right' ? 'selected' : ''}>Справа</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Отступ от заголовка</label>
            <input type="number" id="defaultSubtitleGap" value="${state.subtitleGap ?? -1}" step="0.1" min="-10" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Межбуквенное расстояние</label>
            <input type="number" id="defaultSubtitleLetterSpacing" value="${state.subtitleLetterSpacing ?? 0}" step="0.1" min="-5" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Межстрочный интервал</label>
            <input type="number" id="defaultSubtitleLineHeight" value="${state.subtitleLineHeight ?? 1.2}" step="0.1" min="0.5" max="3" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="border: 1px solid ${hexToRgba(colorLegal, 0.4)}; border-left: 4px solid ${colorLegal}; border-radius: 8px; padding: 16px; background: ${hexToRgba(colorLegal, 0.08)}; margin-top: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorLegal, 0.3)};">
          <div style="width: 32px; height: 32px; border-radius: 6px; background: ${hexToRgba(colorLegal, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorLegal}; font-size: 20px;">gavel</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Настройки юридического текста</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">Юридическая информация внизу макета</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Цвет</label>
            <div style="display: flex; gap: 8px;">
              <input type="color" id="defaultLegalColor" value="${state.legalColor || '#ffffff'}" style="width: 60px; height: 40px; border: 1px solid ${borderColor}; border-radius: 6px; cursor: pointer;">
              <input type="text" id="defaultLegalColorHex" value="${state.legalColor || '#ffffff'}" placeholder="#ffffff" style="flex: 1; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
            </div>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Прозрачность (%)</label>
            <input type="number" id="defaultLegalOpacity" value="${state.legalOpacity ?? 60}" step="1" min="0" max="100" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Размер (%)</label>
            <input type="number" id="defaultLegalSize" value="${state.legalSize ?? 2}" step="0.1" min="1" max="20" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Вес шрифта</label>
            <select id="defaultLegalWeight" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="Thin" ${state.legalWeight === 'Thin' ? 'selected' : ''}>Thin</option>
              <option value="ExtraLight" ${state.legalWeight === 'ExtraLight' ? 'selected' : ''}>ExtraLight</option>
              <option value="Light" ${state.legalWeight === 'Light' ? 'selected' : ''}>Light</option>
              <option value="Regular" ${state.legalWeight === 'Regular' || !state.legalWeight ? 'selected' : ''}>Regular</option>
              <option value="Medium" ${state.legalWeight === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="SemiBold" ${state.legalWeight === 'SemiBold' ? 'selected' : ''}>SemiBold</option>
              <option value="Bold" ${state.legalWeight === 'Bold' ? 'selected' : ''}>Bold</option>
              <option value="Heavy" ${state.legalWeight === 'Heavy' ? 'selected' : ''}>Heavy</option>
              <option value="Black" ${state.legalWeight === 'Black' ? 'selected' : ''}>Black</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Выравнивание</label>
            <select id="defaultLegalAlign" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="left" ${state.legalAlign === 'left' || !state.legalAlign ? 'selected' : ''}>Слева</option>
              <option value="center" ${state.legalAlign === 'center' ? 'selected' : ''}>По центру</option>
              <option value="right" ${state.legalAlign === 'right' ? 'selected' : ''}>Справа</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Межбуквенное расстояние</label>
            <input type="number" id="defaultLegalLetterSpacing" value="${state.legalLetterSpacing ?? 0}" step="0.1" min="-5" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Межстрочный интервал</label>
            <input type="number" id="defaultLegalLineHeight" value="${state.legalLineHeight ?? 1.4}" step="0.1" min="0.5" max="3" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="border: 1px solid ${hexToRgba(colorAge, 0.4)}; border-left: 4px solid ${colorAge}; border-radius: 8px; padding: 16px; background: ${hexToRgba(colorAge, 0.08)}; margin-top: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorAge, 0.3)};">
          <div style="width: 32px; height: 32px; border-radius: 6px; background: ${hexToRgba(colorAge, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorAge}; font-size: 20px;">child_care</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Настройки возраста</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">Возрастное ограничение (18+, 16+ и т.д.)</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Размер (%)</label>
            <input type="number" id="defaultAgeSize" value="${state.ageSize ?? 4}" step="0.1" min="1" max="20" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Вес шрифта</label>
            <select id="defaultAgeWeight" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="Thin" ${state.ageWeight === 'Thin' ? 'selected' : ''}>Thin</option>
              <option value="ExtraLight" ${state.ageWeight === 'ExtraLight' ? 'selected' : ''}>ExtraLight</option>
              <option value="Light" ${state.ageWeight === 'Light' ? 'selected' : ''}>Light</option>
              <option value="Regular" ${state.ageWeight === 'Regular' || !state.ageWeight ? 'selected' : ''}>Regular</option>
              <option value="Medium" ${state.ageWeight === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="SemiBold" ${state.ageWeight === 'SemiBold' ? 'selected' : ''}>SemiBold</option>
              <option value="Bold" ${state.ageWeight === 'Bold' ? 'selected' : ''}>Bold</option>
              <option value="Heavy" ${state.ageWeight === 'Heavy' ? 'selected' : ''}>Heavy</option>
              <option value="Black" ${state.ageWeight === 'Black' ? 'selected' : ''}>Black</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Отступ от текста (%)</label>
            <input type="number" id="defaultAgeGapPercent" value="${state.ageGapPercent ?? 1}" step="0.1" min="0" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="border: 1px solid ${hexToRgba(colorLogo, 0.4)}; border-left: 4px solid ${colorLogo}; border-radius: 8px; padding: 16px; background: ${hexToRgba(colorLogo, 0.08)}; margin-top: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorLogo, 0.3)};">
          <div style="width: 32px; height: 32px; border-radius: 6px; background: ${hexToRgba(colorLogo, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorLogo}; font-size: 20px;">account_circle</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Настройки логотипа</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">Логотип Практикума</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Размер (%)</label>
            <input type="number" id="defaultLogoSize" value="${state.logoSize ?? 40}" step="1" min="10" max="100" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Позиция</label>
            <select id="defaultLogoPos" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="left" ${state.logoPos === 'left' || !state.logoPos ? 'selected' : ''}>Слева</option>
              <option value="center" ${state.logoPos === 'center' ? 'selected' : ''}>По центру</option>
              <option value="right" ${state.logoPos === 'right' ? 'selected' : ''}>Справа</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Язык</label>
            <select id="defaultLogoLanguage" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="ru" ${state.logoLanguage === 'ru' || !state.logoLanguage ? 'selected' : ''}>Русский</option>
              <option value="kz" ${state.logoLanguage === 'kz' ? 'selected' : ''}>Казахский</option>
            </select>
          </div>
        </div>
      </div>
      
      <div style="border: 1px solid ${hexToRgba(colorKV, 0.4)}; border-left: 4px solid ${colorKV}; border-radius: 8px; padding: 16px; background: ${hexToRgba(colorKV, 0.08)}; margin-top: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorKV, 0.3)};">
          <div style="width: 32px; height: 32px; border-radius: 6px; background: ${hexToRgba(colorKV, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorKV}; font-size: 20px;">image</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Настройки KV</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">Key Visual — основное изображение</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Скругление углов (px)</label>
            <input type="number" id="defaultKvBorderRadius" value="${state.kvBorderRadius ?? 0}" step="1" min="0" max="100" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Позиция</label>
            <select id="defaultKvPosition" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="left" ${state.kvPosition === 'left' ? 'selected' : ''}>Слева</option>
              <option value="center" ${state.kvPosition === 'center' || !state.kvPosition ? 'selected' : ''}>По центру</option>
              <option value="right" ${state.kvPosition === 'right' ? 'selected' : ''}>Справа</option>
            </select>
          </div>
        </div>
      </div>
      
      <div style="border: 1px solid ${hexToRgba(colorBg, 0.4)}; border-left: 4px solid ${colorBg}; border-radius: 8px; padding: 16px; background: ${hexToRgba(colorBg, 0.08)}; margin-top: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorBg, 0.3)};">
          <div style="width: 32px; height: 32px; border-radius: 6px; background: ${hexToRgba(colorBg, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorBg}; font-size: 20px;">settings</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Дополнительные настройки</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">Общие параметры макета и фона</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Отступы (%)</label>
            <input type="number" id="defaultPaddingPercent" value="${state.paddingPercent ?? 5}" step="0.1" min="0" max="20" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Режим макета</label>
            <select id="defaultLayoutMode" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="auto" ${state.layoutMode === 'auto' || !state.layoutMode ? 'selected' : ''}>Автоматически</option>
              <option value="horizontal" ${state.layoutMode === 'horizontal' ? 'selected' : ''}>Горизонтальный</option>
              <option value="vertical" ${state.layoutMode === 'vertical' ? 'selected' : ''}>Вертикальный</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Размер фона</label>
            <select id="defaultBgSize" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="cover" ${state.bgSize === 'cover' || !state.bgSize ? 'selected' : ''}>Cover</option>
              <option value="contain" ${state.bgSize === 'contain' ? 'selected' : ''}>Contain</option>
              <option value="auto" ${state.bgSize === 'auto' ? 'selected' : ''}>Auto</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Позиция фона (горизонтально)</label>
            <select id="defaultBgPosition" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="left" ${state.bgPosition === 'left' ? 'selected' : ''}>Слева</option>
              <option value="center" ${state.bgPosition === 'center' || !state.bgPosition ? 'selected' : ''}>По центру</option>
              <option value="right" ${state.bgPosition === 'right' ? 'selected' : ''}>Справа</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Позиция фона (вертикально)</label>
            <select id="defaultBgVPosition" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              <option value="top" ${state.bgVPosition === 'top' ? 'selected' : ''}>Вверху</option>
              <option value="center" ${state.bgVPosition === 'center' || !state.bgVPosition ? 'selected' : ''}>По центру</option>
              <option value="bottom" ${state.bgVPosition === 'bottom' ? 'selected' : ''}>Внизу</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Прозрачность градиента под текстом (%)</label>
            <input type="number" id="defaultTextGradientOpacity" value="${state.textGradientOpacity ?? 100}" step="1" min="0" max="100" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Прозрачность подложки для центрированного текста (%)</label>
            <input type="number" id="defaultCenterTextOverlayOpacity" value="${state.centerTextOverlayOpacity ?? 20}" step="1" min="0" max="100" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
        </div>
      </div>
      </div>
      
      ${(() => {
        // Содержимое из вкладки множителей
        const multipliers = state.formatMultipliers || {
          vertical: { logo: 2, title: 1, subtitle: 1, legal: 1, age: 1 },
          ultraWide: { logo: 0.75, titleSmall: 3, titleMedium: 2.2, titleLarge: 2, subtitleSmall: 3, subtitleMedium: 2.2, subtitleLarge: 2, legalNormal: 2.5, legalMedium: 2, age: 2 },
          veryWide: { logo: 0.75, titleMedium: 2.2, titleLarge: 2, titleExtraLarge: 2, subtitleMedium: 2.2, subtitleLarge: 2, subtitleExtraLarge: 2, legalNormal: 2.5, legalMedium: 2, legalExtraLarge: 2.5, age: 2 },
          horizontal: { logo: 0.75, titleSmall: 1.8, titleLarge: 1.6, titleWideSmall: 1.2, titleWideMedium: 1.4, subtitleSmall: 1.8, subtitleLarge: 1.6, subtitleWideSmall: 1.2, subtitleWideMedium: 1.4, legalSmall: 1.8, legalLarge: 2, legalWide450: 1.2, legalWide500: 1.1, legalWideOther: 1.15, age: 2, ageWide: null },
          square: { title: 0.9, subtitle: 0.9 },
          tall: { title: 1.3, subtitle: 1.3 }
        };
        
        // Цвета для разных типов форматов
        const colorVertical = '#FF9800';
        const colorUltraWide = '#2196F3';
        const colorVeryWide = '#9C27B0';
        const colorHorizontal = '#4CAF50';
        const colorSquare = '#FFC107';
        const colorTall = '#E91E63';
        
        // Цвета для элементов
        const colorLogo = '#AA96DA';
        const colorTitle = '#FF6B6B';
        const colorSubtitle = '#4ECDC4';
        const colorLegal = '#95E1D3';
        const colorAge = '#F38181';
        
        return `
      <div style="padding: 14px; background: rgba(33, 150, 243, 0.12); border-left: 4px solid #2196F3; border-radius: 6px; margin-top: 20px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span class="material-icons" style="font-size: 20px; color: #2196F3; flex-shrink: 0; margin-top: 2px;">zoom_in</span>
          <div>
            <div style="font-weight: 600; color: ${textPrimary}; margin-bottom: 4px; font-size: 14px;">Множители форматов</div>
            <div style="font-size: 12px; color: ${textSecondary}; line-height: 1.5;">Множители применяются к размерам элементов в зависимости от типа формата. Схожие элементы выделены одинаковыми цветами для удобства навигации.</div>
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background: ${hexToRgba(colorVertical, 0.08)}; border: 1px solid ${hexToRgba(colorVertical, 0.4)}; border-left: 4px solid ${colorVertical}; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorVertical, 0.3)};">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: ${hexToRgba(colorVertical, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorVertical}; font-size: 22px;">crop_portrait</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Вертикальные форматы</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">height >= width × 1.5 (вертикальные баннеры)</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group" style="border-left: 3px solid ${colorLogo}; padding-left: 10px; background: ${hexToRgba(colorLogo, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorLogo};"></span>
              Логотип
            </label>
            <input type="number" id="multiplier-vertical-logo" value="${multipliers.vertical.logo}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorTitle}; padding-left: 10px; background: ${hexToRgba(colorTitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorTitle};"></span>
              Заголовок
            </label>
            <input type="number" id="multiplier-vertical-title" value="${multipliers.vertical.title}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorSubtitle}; padding-left: 10px; background: ${hexToRgba(colorSubtitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorSubtitle};"></span>
              Подзаголовок
            </label>
            <input type="number" id="multiplier-vertical-subtitle" value="${multipliers.vertical.subtitle ?? 1}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorLegal}; padding-left: 10px; background: ${hexToRgba(colorLegal, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorLegal};"></span>
              Юридический текст
            </label>
            <input type="number" id="multiplier-vertical-legal" value="${multipliers.vertical.legal}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorAge}; padding-left: 10px; background: ${hexToRgba(colorAge, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorAge};"></span>
              Возраст
            </label>
            <input type="number" id="multiplier-vertical-age" value="${multipliers.vertical.age}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background: ${hexToRgba(colorUltraWide, 0.08)}; border: 1px solid ${hexToRgba(colorUltraWide, 0.4)}; border-left: 4px solid ${colorUltraWide}; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorUltraWide, 0.3)};">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: ${hexToRgba(colorUltraWide, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorUltraWide}; font-size: 22px;">crop_landscape</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Ультра-широкие форматы</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">width >= height × 8 (очень широкие баннеры)</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group" style="border-left: 3px solid ${colorLogo}; padding-left: 10px; background: ${hexToRgba(colorLogo, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorLogo};"></span>
              Логотип
            </label>
            <input type="number" id="multiplier-ultraWide-logo" value="${multipliers.ultraWide.logo}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorTitle}; padding-left: 10px; background: ${hexToRgba(colorTitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorTitle};"></span>
              Заголовок (height < 120)
            </label>
            <input type="number" id="multiplier-ultraWide-titleSmall" value="${multipliers.ultraWide.titleSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorSubtitle}; padding-left: 10px; background: ${hexToRgba(colorSubtitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorSubtitle};"></span>
              Подзаголовок (height < 120)
            </label>
            <input type="number" id="multiplier-ultraWide-subtitleSmall" value="${multipliers.ultraWide.subtitleSmall ?? multipliers.ultraWide.titleSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorTitle}; padding-left: 10px; background: ${hexToRgba(colorTitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorTitle};"></span>
              Заголовок (height < 200)
            </label>
            <input type="number" id="multiplier-ultraWide-titleMedium" value="${multipliers.ultraWide.titleMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorSubtitle}; padding-left: 10px; background: ${hexToRgba(colorSubtitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorSubtitle};"></span>
              Подзаголовок (height < 200)
            </label>
            <input type="number" id="multiplier-ultraWide-subtitleMedium" value="${multipliers.ultraWide.subtitleMedium ?? multipliers.ultraWide.titleMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorTitle}; padding-left: 10px; background: ${hexToRgba(colorTitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorTitle};"></span>
              Заголовок (height >= 200)
            </label>
            <input type="number" id="multiplier-ultraWide-titleLarge" value="${multipliers.ultraWide.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorSubtitle}; padding-left: 10px; background: ${hexToRgba(colorSubtitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorSubtitle};"></span>
              Подзаголовок (height >= 200)
            </label>
            <input type="number" id="multiplier-ultraWide-subtitleLarge" value="${multipliers.ultraWide.subtitleLarge ?? multipliers.ultraWide.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorLegal}; padding-left: 10px; background: ${hexToRgba(colorLegal, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorLegal};"></span>
              Юридический (обычный)
            </label>
            <input type="number" id="multiplier-ultraWide-legalNormal" value="${multipliers.ultraWide.legalNormal}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorLegal}; padding-left: 10px; background: ${hexToRgba(colorLegal, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorLegal};"></span>
              Юридический (height 250-350)
            </label>
            <input type="number" id="multiplier-ultraWide-legalMedium" value="${multipliers.ultraWide.legalMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorAge}; padding-left: 10px; background: ${hexToRgba(colorAge, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorAge};"></span>
              Возраст
            </label>
            <input type="number" id="multiplier-ultraWide-age" value="${multipliers.ultraWide.age}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background: ${hexToRgba(colorVeryWide, 0.08)}; border: 1px solid ${hexToRgba(colorVeryWide, 0.4)}; border-left: 4px solid ${colorVeryWide}; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorVeryWide, 0.3)};">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: ${hexToRgba(colorVeryWide, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorVeryWide}; font-size: 22px;">crop_landscape</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Очень широкие форматы</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">width >= height × 4 (широкие баннеры)</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Логотип</label>
            <input type="number" id="multiplier-veryWide-logo" value="${multipliers.veryWide.logo}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (height < 200)</label>
            <input type="number" id="multiplier-veryWide-titleMedium" value="${multipliers.veryWide.titleMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (height < 200)</label>
            <input type="number" id="multiplier-veryWide-subtitleMedium" value="${multipliers.veryWide.subtitleMedium ?? multipliers.veryWide.titleMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (height >= 200)</label>
            <input type="number" id="multiplier-veryWide-titleLarge" value="${multipliers.veryWide.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (height >= 200)</label>
            <input type="number" id="multiplier-veryWide-subtitleLarge" value="${multipliers.veryWide.subtitleLarge ?? multipliers.veryWide.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (width >= 2000, height 400-800)</label>
            <input type="number" id="multiplier-veryWide-titleExtraLarge" value="${multipliers.veryWide.titleExtraLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (width >= 2000, height 400-800)</label>
            <input type="number" id="multiplier-veryWide-subtitleExtraLarge" value="${multipliers.veryWide.subtitleExtraLarge ?? multipliers.veryWide.titleExtraLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (обычный)</label>
            <input type="number" id="multiplier-veryWide-legalNormal" value="${multipliers.veryWide.legalNormal}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (height 250-350)</label>
            <input type="number" id="multiplier-veryWide-legalMedium" value="${multipliers.veryWide.legalMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (width >= 2000, height 400-800)</label>
            <input type="number" id="multiplier-veryWide-legalExtraLarge" value="${multipliers.veryWide.legalExtraLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Возраст</label>
            <input type="number" id="multiplier-veryWide-age" value="${multipliers.veryWide.age}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background: ${hexToRgba(colorHorizontal, 0.08)}; border: 1px solid ${hexToRgba(colorHorizontal, 0.4)}; border-left: 4px solid ${colorHorizontal}; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorHorizontal, 0.3)};">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: ${hexToRgba(colorHorizontal, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorHorizontal}; font-size: 22px;">crop_landscape</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Горизонтальные форматы</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">width >= height × 1.5 (горизонтальные баннеры)</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Логотип</label>
            <input type="number" id="multiplier-horizontal-logo" value="${multipliers.horizontal.logo}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (height < 200)</label>
            <input type="number" id="multiplier-horizontal-titleSmall" value="${multipliers.horizontal.titleSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (height < 200)</label>
            <input type="number" id="multiplier-horizontal-subtitleSmall" value="${multipliers.horizontal.subtitleSmall ?? multipliers.horizontal.titleSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (height >= 200)</label>
            <input type="number" id="multiplier-horizontal-titleLarge" value="${multipliers.horizontal.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (height >= 200)</label>
            <input type="number" id="multiplier-horizontal-subtitleLarge" value="${multipliers.horizontal.subtitleLarge ?? multipliers.horizontal.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (широкий, height >= 800)</label>
            <input type="number" id="multiplier-horizontal-titleWideSmall" value="${multipliers.horizontal.titleWideSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (широкий, height >= 800)</label>
            <input type="number" id="multiplier-horizontal-subtitleWideSmall" value="${multipliers.horizontal.subtitleWideSmall ?? multipliers.horizontal.titleWideSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (широкий, height 500-800)</label>
            <input type="number" id="multiplier-horizontal-titleWideMedium" value="${multipliers.horizontal.titleWideMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (широкий, height 500-800)</label>
            <input type="number" id="multiplier-horizontal-subtitleWideMedium" value="${multipliers.horizontal.subtitleWideMedium ?? multipliers.horizontal.titleWideMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (height 250-350)</label>
            <input type="number" id="multiplier-horizontal-legalSmall" value="${multipliers.horizontal.legalSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (height > 350)</label>
            <input type="number" id="multiplier-horizontal-legalLarge" value="${multipliers.horizontal.legalLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (широкий, height 450-500)</label>
            <input type="number" id="multiplier-horizontal-legalWide450" value="${multipliers.horizontal.legalWide450}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (широкий, height 500-1080)</label>
            <input type="number" id="multiplier-horizontal-legalWide500" value="${multipliers.horizontal.legalWide500}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (широкий, другое)</label>
            <input type="number" id="multiplier-horizontal-legalWideOther" value="${multipliers.horizontal.legalWideOther}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Возраст</label>
            <input type="number" id="multiplier-horizontal-age" value="${multipliers.horizontal.age}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid ${hexToRgba(borderColor, 0.4)}; border-left: 4px solid ${borderColor}; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${borderColor};">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${textSecondary}; font-size: 22px;">tune</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Дополнительные настройки</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">Специальные форматы</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Квадратные форматы: Заголовок</label>
            <input type="number" id="multiplier-square-title" value="${multipliers.square.title}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Квадратные форматы: Подзаголовок</label>
            <input type="number" id="multiplier-square-subtitle" value="${multipliers.square.subtitle ?? multipliers.square.title}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Высокие макеты (height/width >= 2): Заголовок</label>
            <input type="number" id="multiplier-tall-title" value="${multipliers.tall.title}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Высокие макеты (height/width >= 2): Подзаголовок</label>
            <input type="number" id="multiplier-tall-subtitle" value="${multipliers.tall.subtitle ?? multipliers.tall.title}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="padding: 12px; background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; color: ${textPrimary}; font-size: 13px;">
        <strong>💡 Подсказка:</strong> Изменения применяются автоматически при изменении значений. Множители влияют на размеры элементов в зависимости от типа формата.
      </div>
        `;
      })()}
      
      ${(() => {
        // Содержимое из вкладки фонов
        let savedBackgrounds = JSON.parse(localStorage.getItem('adminBackgrounds') || '[]');
        
        // Функция для вычисления настроек цвета
        const getColorSettings = (color) => {
          // Вычисляем цвет текста на основе яркости фона
          const hex = color.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          
          // Специальная проверка для цвета #FF6C26 - всегда белый текст и белый логотип
          let textColor = '#ffffff';
          let logoFolder = 'white';
          
          if (color === '#FF6C26') {
            textColor = '#ffffff';
            logoFolder = 'white';
          } else {
            textColor = luminance > 0.5 ? '#1e1e1e' : '#ffffff';
            logoFolder = luminance > 0.5 ? 'black' : 'white';
          }
          
          return {
            bgColor: color,
            bgImage: null,
            textColor: textColor,
            logoFolder: logoFolder
          };
        };
        
        // Проверяем, есть ли все предустановленные цвета в сохраненных фонах
        const existingColors = savedBackgrounds.map(bg => bg.bgColor?.toUpperCase()).filter(Boolean);
        const missingPresetColors = PRESET_BACKGROUND_COLORS.filter(color => 
          !existingColors.includes(color.toUpperCase())
        );
        
        // Добавляем недостающие предустановленные цвета
        if (missingPresetColors.length > 0) {
          const newBackgrounds = missingPresetColors.map(color => getColorSettings(color));
          savedBackgrounds = [...savedBackgrounds, ...newBackgrounds];
          // Сохраняем обновленный список
          localStorage.setItem('adminBackgrounds', JSON.stringify(savedBackgrounds));
        }
        
        // Если вообще нет сохраненных фонов, создаем все из предустановленных цветов
        if (savedBackgrounds.length === 0) {
          savedBackgrounds = PRESET_BACKGROUND_COLORS.map(color => getColorSettings(color));
          localStorage.setItem('adminBackgrounds', JSON.stringify(savedBackgrounds));
        }
        
        const colorBg = '#FF6C26';
        
        return `
          <div style="border-top: 2px solid ${borderColor}; margin-top: 32px; padding-top: 32px;">
            <div style="padding: 14px; background: rgba(33, 150, 243, 0.12); border-left: 4px solid #2196F3; border-radius: 6px; margin-bottom: 20px;">
              <div style="display: flex; align-items: flex-start; gap: 10px;">
                <span class="material-icons" style="font-size: 20px; color: #2196F3; flex-shrink: 0; margin-top: 2px;">palette</span>
                <div>
                  <div style="font-weight: 600; color: ${textPrimary}; margin-bottom: 4px; font-size: 14px;">Управление фонами</div>
                  <div style="font-size: 12px; color: ${textSecondary}; line-height: 1.5;">Настройте фоны, цвета текста и логотипы для каждого фона. При выборе фона автоматически применяются соответствующие настройки текста и логотипа.</div>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 16px;">
              <button class="btn btn-primary" id="adminAddBackground" style="display: flex; align-items: center; gap: 6px;">
                <span class="material-icons" style="font-size: 18px;">add</span>
                Добавить фон
              </button>
            </div>
            
            <div id="adminBackgroundsList" style="display: flex; flex-direction: column; gap: 16px;">
              ${savedBackgrounds.map((bg, index) => `
                <div class="admin-background-item" data-bg-index="${index}" style="border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px; background: ${bgPrimary};">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div style="width: 60px; height: 60px; border-radius: 8px; background: ${bg.bgColor || '#1e1e1e'}; border: 1px solid ${borderColor}; position: relative; overflow: hidden;">
                        ${bg.bgImage ? `<img src="${bg.bgImage}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                      </div>
                      <div>
                        <div style="font-weight: 600; color: ${textPrimary}; margin-bottom: 4px;">Фон #${index + 1}</div>
                        <div style="font-size: 12px; color: ${textSecondary};">
                          ${bg.bgImage ? 'Изображение' : `Цвет: ${bg.bgColor || '#1e1e1e'}`}
                        </div>
                      </div>
                    </div>
                    <button class="btn btn-danger" data-remove-bg="${index}" style="padding: 8px;">
                      <span class="material-icons" style="font-size: 18px;">delete</span>
                    </button>
                  </div>
                  
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                    <div class="form-group">
                      <label style="font-weight: 500; margin-bottom: 8px; font-size: 13px; display: block;">Фон</label>
                      <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                        <input type="color" class="admin-bg-color" data-bg-index="${index}" value="${bg.bgColor || '#1e1e1e'}" style="width: 60px; height: 40px; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer;">
                        <input type="text" class="admin-bg-color-hex" data-bg-index="${index}" value="${bg.bgColor || '#1e1e1e'}" placeholder="#1e1e1e" style="flex: 1; padding: 8px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
                      </div>
                      <button class="btn" data-upload-bg="${index}" style="width: 100%; margin-bottom: 8px;">
                        <span class="material-icons" style="font-size: 18px; margin-right: 4px;">upload</span>
                        Загрузить изображение
                      </button>
                      <input type="file" class="admin-bg-upload-file" data-bg-index="${index}" accept="image/*" style="display: none;">
                      <button class="btn" data-select-bg="${index}" style="width: 100%; margin-bottom: 8px;">
                        <span class="material-icons" style="font-size: 18px; margin-right: 4px;">image</span>
                        Выбрать из библиотеки
                      </button>
                      ${bg.bgImage ? `<button class="btn btn-danger" data-clear-bg="${index}" style="width: 100%;">
                        <span class="material-icons" style="font-size: 18px; margin-right: 4px;">delete</span>
                        Удалить изображение
                      </button>` : ''}
                    </div>
                    
                    <div class="form-group">
                      <label style="font-weight: 500; margin-bottom: 8px; font-size: 13px; display: block;">Цвет текста</label>
                      <div style="display: flex; gap: 8px;">
                        <input type="color" class="admin-text-color" data-bg-index="${index}" value="${bg.textColor || '#ffffff'}" style="width: 60px; height: 40px; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer;">
                        <input type="text" class="admin-text-color-hex" data-bg-index="${index}" value="${bg.textColor || '#ffffff'}" placeholder="#ffffff" style="flex: 1; padding: 8px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label style="font-weight: 500; margin-bottom: 8px; font-size: 13px; display: block;">Логотип</label>
                      <select class="admin-logo-folder" data-bg-index="${index}" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
                        <option value="white" ${bg.logoFolder === 'white' ? 'selected' : ''}>Белый</option>
                        <option value="black" ${bg.logoFolder === 'black' || !bg.logoFolder ? 'selected' : ''}>Черный</option>
                      </select>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      })()}
    </div>
  `;
};

/**
 * Рендерит вкладку с настройками множителей форматов
 */
const renderMultipliersTab = () => {
  try {
    const state = getState();
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const borderColor = computedStyle.getPropertyValue('--border-color') || '#2a2a2a';
    const bgPrimary = computedStyle.getPropertyValue('--bg-primary') || '#0d0d0d';
    const textPrimary = computedStyle.getPropertyValue('--text-primary') || '#e9e9e9';
    const textSecondary = computedStyle.getPropertyValue('--text-secondary') || '#999999';
    
    // Получаем множители из state или используем дефолтные
    const multipliers = state.formatMultipliers || {
      vertical: { logo: 2, title: 1, subtitle: 1, legal: 1, age: 1 },
      ultraWide: { logo: 0.75, titleSmall: 3, titleMedium: 2.2, titleLarge: 2, subtitleSmall: 3, subtitleMedium: 2.2, subtitleLarge: 2, legalNormal: 2.5, legalMedium: 2, age: 2 },
      veryWide: { logo: 0.75, titleMedium: 2.2, titleLarge: 2, titleExtraLarge: 2, subtitleMedium: 2.2, subtitleLarge: 2, subtitleExtraLarge: 2, legalNormal: 2.5, legalMedium: 2, legalExtraLarge: 2.5, age: 2 },
      horizontal: { logo: 0.75, titleSmall: 1.8, titleLarge: 1.6, titleWideSmall: 1.2, titleWideMedium: 1.4, subtitleSmall: 1.8, subtitleLarge: 1.6, subtitleWideSmall: 1.2, subtitleWideMedium: 1.4, legalSmall: 1.8, legalLarge: 2, legalWide450: 1.2, legalWide500: 1.1, legalWideOther: 1.15, age: 2, ageWide: null },
      square: { title: 0.9, subtitle: 0.9 },
      tall: { title: 1.3, subtitle: 1.3 }
    };
    
    // Функция для преобразования hex в rgba
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    // Цвета для разных типов форматов
    const colorVertical = '#FF9800';
    const colorUltraWide = '#2196F3';
    const colorVeryWide = '#9C27B0';
    const colorHorizontal = '#4CAF50';
    const colorSquare = '#FFC107';
    const colorTall = '#E91E63';
    
    // Цвета для элементов
    const colorLogo = '#AA96DA';
    const colorTitle = '#FF6B6B';
    const colorSubtitle = '#4ECDC4';
    const colorLegal = '#95E1D3';
    const colorAge = '#F38181';
    
    return `
    <div style="display: flex; flex-direction: column; gap: 20px; width: 100%; min-width: 0;">
      <div style="padding: 14px; background: rgba(33, 150, 243, 0.12); border-left: 4px solid #2196F3; border-radius: 6px; margin-bottom: 4px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span class="material-icons" style="font-size: 20px; color: #2196F3; flex-shrink: 0; margin-top: 2px;">zoom_in</span>
          <div>
            <div style="font-weight: 600; color: ${textPrimary}; margin-bottom: 4px; font-size: 14px;">Множители форматов</div>
            <div style="font-size: 12px; color: ${textSecondary}; line-height: 1.5;">Множители применяются к размерам элементов в зависимости от типа формата. Схожие элементы выделены одинаковыми цветами для удобства навигации.</div>
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background: ${hexToRgba(colorVertical, 0.08)}; border: 1px solid ${hexToRgba(colorVertical, 0.4)}; border-left: 4px solid ${colorVertical}; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorVertical, 0.3)};">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: ${hexToRgba(colorVertical, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorVertical}; font-size: 22px;">crop_portrait</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Вертикальные форматы</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">height >= width × 1.5 (вертикальные баннеры)</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group" style="border-left: 3px solid ${colorLogo}; padding-left: 10px; background: ${hexToRgba(colorLogo, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorLogo};"></span>
              Логотип
            </label>
            <input type="number" id="multiplier-vertical-logo" value="${multipliers.vertical.logo}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorTitle}; padding-left: 10px; background: ${hexToRgba(colorTitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorTitle};"></span>
              Заголовок
            </label>
            <input type="number" id="multiplier-vertical-title" value="${multipliers.vertical.title}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorSubtitle}; padding-left: 10px; background: ${hexToRgba(colorSubtitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorSubtitle};"></span>
              Подзаголовок
            </label>
            <input type="number" id="multiplier-vertical-subtitle" value="${multipliers.vertical.subtitle ?? 1}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorLegal}; padding-left: 10px; background: ${hexToRgba(colorLegal, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorLegal};"></span>
              Юридический текст
            </label>
            <input type="number" id="multiplier-vertical-legal" value="${multipliers.vertical.legal}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorAge}; padding-left: 10px; background: ${hexToRgba(colorAge, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorAge};"></span>
              Возраст
            </label>
            <input type="number" id="multiplier-vertical-age" value="${multipliers.vertical.age}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background: ${hexToRgba(colorUltraWide, 0.08)}; border: 1px solid ${hexToRgba(colorUltraWide, 0.4)}; border-left: 4px solid ${colorUltraWide}; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorUltraWide, 0.3)};">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: ${hexToRgba(colorUltraWide, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorUltraWide}; font-size: 22px;">crop_landscape</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Ультра-широкие форматы</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">width >= height × 8 (очень широкие баннеры)</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group" style="border-left: 3px solid ${colorLogo}; padding-left: 10px; background: ${hexToRgba(colorLogo, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorLogo};"></span>
              Логотип
            </label>
            <input type="number" id="multiplier-ultraWide-logo" value="${multipliers.ultraWide.logo}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorTitle}; padding-left: 10px; background: ${hexToRgba(colorTitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorTitle};"></span>
              Заголовок (height < 120)
            </label>
            <input type="number" id="multiplier-ultraWide-titleSmall" value="${multipliers.ultraWide.titleSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorSubtitle}; padding-left: 10px; background: ${hexToRgba(colorSubtitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorSubtitle};"></span>
              Подзаголовок (height < 120)
            </label>
            <input type="number" id="multiplier-ultraWide-subtitleSmall" value="${multipliers.ultraWide.subtitleSmall ?? multipliers.ultraWide.titleSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorTitle}; padding-left: 10px; background: ${hexToRgba(colorTitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorTitle};"></span>
              Заголовок (height < 200)
            </label>
            <input type="number" id="multiplier-ultraWide-titleMedium" value="${multipliers.ultraWide.titleMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorSubtitle}; padding-left: 10px; background: ${hexToRgba(colorSubtitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorSubtitle};"></span>
              Подзаголовок (height < 200)
            </label>
            <input type="number" id="multiplier-ultraWide-subtitleMedium" value="${multipliers.ultraWide.subtitleMedium ?? multipliers.ultraWide.titleMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorTitle}; padding-left: 10px; background: ${hexToRgba(colorTitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorTitle};"></span>
              Заголовок (height >= 200)
            </label>
            <input type="number" id="multiplier-ultraWide-titleLarge" value="${multipliers.ultraWide.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorSubtitle}; padding-left: 10px; background: ${hexToRgba(colorSubtitle, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorSubtitle};"></span>
              Подзаголовок (height >= 200)
            </label>
            <input type="number" id="multiplier-ultraWide-subtitleLarge" value="${multipliers.ultraWide.subtitleLarge ?? multipliers.ultraWide.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorLegal}; padding-left: 10px; background: ${hexToRgba(colorLegal, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorLegal};"></span>
              Юридический (обычный)
            </label>
            <input type="number" id="multiplier-ultraWide-legalNormal" value="${multipliers.ultraWide.legalNormal}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorLegal}; padding-left: 10px; background: ${hexToRgba(colorLegal, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorLegal};"></span>
              Юридический (height 250-350)
            </label>
            <input type="number" id="multiplier-ultraWide-legalMedium" value="${multipliers.ultraWide.legalMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group" style="border-left: 3px solid ${colorAge}; padding-left: 10px; background: ${hexToRgba(colorAge, 0.08)};">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${colorAge};"></span>
              Возраст
            </label>
            <input type="number" id="multiplier-ultraWide-age" value="${multipliers.ultraWide.age}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background: ${hexToRgba(colorVeryWide, 0.08)}; border: 1px solid ${hexToRgba(colorVeryWide, 0.4)}; border-left: 4px solid ${colorVeryWide}; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorVeryWide, 0.3)};">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: ${hexToRgba(colorVeryWide, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorVeryWide}; font-size: 22px;">crop_landscape</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Очень широкие форматы</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">width >= height × 4 (широкие баннеры)</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Логотип</label>
            <input type="number" id="multiplier-veryWide-logo" value="${multipliers.veryWide.logo}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (height < 200)</label>
            <input type="number" id="multiplier-veryWide-titleMedium" value="${multipliers.veryWide.titleMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (height < 200)</label>
            <input type="number" id="multiplier-veryWide-subtitleMedium" value="${multipliers.veryWide.subtitleMedium ?? multipliers.veryWide.titleMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (height >= 200)</label>
            <input type="number" id="multiplier-veryWide-titleLarge" value="${multipliers.veryWide.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (height >= 200)</label>
            <input type="number" id="multiplier-veryWide-subtitleLarge" value="${multipliers.veryWide.subtitleLarge ?? multipliers.veryWide.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (width >= 2000, height 400-800)</label>
            <input type="number" id="multiplier-veryWide-titleExtraLarge" value="${multipliers.veryWide.titleExtraLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (width >= 2000, height 400-800)</label>
            <input type="number" id="multiplier-veryWide-subtitleExtraLarge" value="${multipliers.veryWide.subtitleExtraLarge ?? multipliers.veryWide.titleExtraLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (обычный)</label>
            <input type="number" id="multiplier-veryWide-legalNormal" value="${multipliers.veryWide.legalNormal}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (height 250-350)</label>
            <input type="number" id="multiplier-veryWide-legalMedium" value="${multipliers.veryWide.legalMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (width >= 2000, height 400-800)</label>
            <input type="number" id="multiplier-veryWide-legalExtraLarge" value="${multipliers.veryWide.legalExtraLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Возраст</label>
            <input type="number" id="multiplier-veryWide-age" value="${multipliers.veryWide.age}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background: ${hexToRgba(colorHorizontal, 0.08)}; border: 1px solid ${hexToRgba(colorHorizontal, 0.4)}; border-left: 4px solid ${colorHorizontal}; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${hexToRgba(colorHorizontal, 0.3)};">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: ${hexToRgba(colorHorizontal, 0.2)}; display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${colorHorizontal}; font-size: 22px;">crop_landscape</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Горизонтальные форматы</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">width >= height × 1.5 (горизонтальные баннеры)</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Логотип</label>
            <input type="number" id="multiplier-horizontal-logo" value="${multipliers.horizontal.logo}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (height < 200)</label>
            <input type="number" id="multiplier-horizontal-titleSmall" value="${multipliers.horizontal.titleSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (height < 200)</label>
            <input type="number" id="multiplier-horizontal-subtitleSmall" value="${multipliers.horizontal.subtitleSmall ?? multipliers.horizontal.titleSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (height >= 200)</label>
            <input type="number" id="multiplier-horizontal-titleLarge" value="${multipliers.horizontal.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (height >= 200)</label>
            <input type="number" id="multiplier-horizontal-subtitleLarge" value="${multipliers.horizontal.subtitleLarge ?? multipliers.horizontal.titleLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (широкий, height >= 800)</label>
            <input type="number" id="multiplier-horizontal-titleWideSmall" value="${multipliers.horizontal.titleWideSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (широкий, height >= 800)</label>
            <input type="number" id="multiplier-horizontal-subtitleWideSmall" value="${multipliers.horizontal.subtitleWideSmall ?? multipliers.horizontal.titleWideSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Заголовок (широкий, height 500-800)</label>
            <input type="number" id="multiplier-horizontal-titleWideMedium" value="${multipliers.horizontal.titleWideMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Подзаголовок (широкий, height 500-800)</label>
            <input type="number" id="multiplier-horizontal-subtitleWideMedium" value="${multipliers.horizontal.subtitleWideMedium ?? multipliers.horizontal.titleWideMedium}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (height 250-350)</label>
            <input type="number" id="multiplier-horizontal-legalSmall" value="${multipliers.horizontal.legalSmall}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (height > 350)</label>
            <input type="number" id="multiplier-horizontal-legalLarge" value="${multipliers.horizontal.legalLarge}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (широкий, height 450-500)</label>
            <input type="number" id="multiplier-horizontal-legalWide450" value="${multipliers.horizontal.legalWide450}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (широкий, height 500-1080)</label>
            <input type="number" id="multiplier-horizontal-legalWide500" value="${multipliers.horizontal.legalWide500}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Юридический (широкий, другое)</label>
            <input type="number" id="multiplier-horizontal-legalWideOther" value="${multipliers.horizontal.legalWideOther}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Возраст</label>
            <input type="number" id="multiplier-horizontal-age" value="${multipliers.horizontal.age}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="padding: 16px; background: rgba(255, 255, 255, 0.02); border: 1px solid ${hexToRgba(borderColor, 0.4)}; border-left: 4px solid ${borderColor}; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${borderColor};">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center;">
            <span class="material-icons" style="color: ${textSecondary}; font-size: 22px;">tune</span>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${textPrimary};">Дополнительные настройки</h3>
            <div style="font-size: 11px; color: ${textSecondary}; margin-top: 2px;">Специальные форматы</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Квадратные форматы: Заголовок</label>
            <input type="number" id="multiplier-square-title" value="${multipliers.square.title}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Квадратные форматы: Подзаголовок</label>
            <input type="number" id="multiplier-square-subtitle" value="${multipliers.square.subtitle ?? multipliers.square.title}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Высокие макеты (height/width >= 2): Заголовок</label>
            <input type="number" id="multiplier-tall-title" value="${multipliers.tall.title}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
          <div class="form-group">
            <label style="font-weight: 500; margin-bottom: 4px; font-size: 13px;">Высокие макеты (height/width >= 2): Подзаголовок</label>
            <input type="number" id="multiplier-tall-subtitle" value="${multipliers.tall.subtitle ?? multipliers.tall.title}" step="0.1" min="0.1" max="10" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 6px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
          </div>
        </div>
      </div>
      
      <div style="padding: 12px; background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; color: ${textPrimary}; font-size: 13px;">
        <strong>💡 Подсказка:</strong> Изменения применяются автоматически при изменении значений. Множители влияют на размеры элементов в зависимости от типа формата.
      </div>
    </div>
  `;
  } catch (error) {
    console.error('Ошибка при рендеринге вкладки множителей:', error);
    return `<div style="padding: 20px; color: red;">Ошибка при загрузке множителей: ${error.message}</div>`;
  }
};

/**
 * Рендерит вкладку с управлением фонами
 */
const renderBackgroundsTab = () => {
  const state = getState();
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#2a2a2a';
  const bgPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#0d0d0d';
  const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#e9e9e9';
  const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999999';
  
  // Получаем сохраненные фоны из localStorage или используем пустой массив
  const savedBackgrounds = JSON.parse(localStorage.getItem('adminBackgrounds') || '[]');
  
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const colorBg = '#FF6C26';
  
  return `
    <div style="padding: 14px; background: rgba(33, 150, 243, 0.12); border-left: 4px solid #2196F3; border-radius: 6px; margin-bottom: 20px;">
      <div style="display: flex; align-items: flex-start; gap: 10px;">
        <span class="material-icons" style="font-size: 20px; color: #2196F3; flex-shrink: 0; margin-top: 2px;">palette</span>
        <div>
          <div style="font-weight: 600; color: ${textPrimary}; margin-bottom: 4px; font-size: 14px;">Управление фонами</div>
          <div style="font-size: 12px; color: ${textSecondary}; line-height: 1.5;">Настройте фоны, цвета текста и логотипы для каждого фона. При выборе фона автоматически применяются соответствующие настройки текста и логотипа.</div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 16px;">
      <button class="btn btn-primary" id="adminAddBackground" style="display: flex; align-items: center; gap: 6px;">
        <span class="material-icons" style="font-size: 18px;">add</span>
        Добавить фон
      </button>
    </div>
    
    <div id="adminBackgroundsList" style="display: flex; flex-direction: column; gap: 16px;">
      ${savedBackgrounds.map((bg, index) => `
        <div class="admin-background-item" data-bg-index="${index}" style="border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px; background: ${bgPrimary};">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 60px; height: 60px; border-radius: 8px; background: ${bg.bgColor || '#1e1e1e'}; border: 1px solid ${borderColor}; position: relative; overflow: hidden;">
                ${bg.bgImage ? `<img src="${bg.bgImage}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
              </div>
              <div>
                <div style="font-weight: 600; color: ${textPrimary}; margin-bottom: 4px;">Фон #${index + 1}</div>
                <div style="font-size: 12px; color: ${textSecondary};">
                  ${bg.bgImage ? 'Изображение' : `Цвет: ${bg.bgColor || '#1e1e1e'}`}
                </div>
              </div>
            </div>
            <button class="btn btn-danger" data-remove-bg="${index}" style="padding: 8px;">
              <span class="material-icons" style="font-size: 18px;">delete</span>
            </button>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
            <div class="form-group">
              <label style="font-weight: 500; margin-bottom: 8px; font-size: 13px; display: block;">Фон</label>
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <input type="color" class="admin-bg-color" data-bg-index="${index}" value="${bg.bgColor || '#1e1e1e'}" style="width: 60px; height: 40px; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer;">
                <input type="text" class="admin-bg-color-hex" data-bg-index="${index}" value="${bg.bgColor || '#1e1e1e'}" placeholder="#1e1e1e" style="flex: 1; padding: 8px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              </div>
              <button class="btn" data-upload-bg="${index}" style="width: 100%; margin-bottom: 8px;">
                <span class="material-icons" style="font-size: 18px; margin-right: 4px;">upload</span>
                Загрузить изображение
              </button>
              <input type="file" class="admin-bg-upload-file" data-bg-index="${index}" accept="image/*" style="display: none;">
              <button class="btn" data-select-bg="${index}" style="width: 100%; margin-bottom: 8px;">
                <span class="material-icons" style="font-size: 18px; margin-right: 4px;">image</span>
                Выбрать из библиотеки
              </button>
              ${bg.bgImage ? `<button class="btn btn-danger" data-clear-bg="${index}" style="width: 100%;">
                <span class="material-icons" style="font-size: 18px; margin-right: 4px;">delete</span>
                Удалить изображение
              </button>` : ''}
            </div>
            
            <div class="form-group">
              <label style="font-weight: 500; margin-bottom: 8px; font-size: 13px; display: block;">Цвет текста</label>
              <div style="display: flex; gap: 8px;">
                <input type="color" class="admin-text-color" data-bg-index="${index}" value="${bg.textColor || '#ffffff'}" style="width: 60px; height: 40px; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer;">
                <input type="text" class="admin-text-color-hex" data-bg-index="${index}" value="${bg.textColor || '#ffffff'}" placeholder="#ffffff" style="flex: 1; padding: 8px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              </div>
            </div>
            
            <div class="form-group">
              <label style="font-weight: 500; margin-bottom: 8px; font-size: 13px; display: block;">Логотип</label>
              <select class="admin-logo-folder" data-bg-index="${index}" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
                <option value="white" ${bg.logoFolder === 'white' ? 'selected' : ''}>Белый</option>
                <option value="black" ${bg.logoFolder === 'black' || !bg.logoFolder ? 'selected' : ''}>Черный</option>
              </select>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
};

/**
 * Создает и показывает модальное окно админки размеров
 */
export const showSizesAdmin = () => {
  console.log('showSizesAdmin вызвана');
  
  // Проверяем, есть ли уже модальное окно в DOM
  const existingModal = document.getElementById('sizesAdminModal');
  if (existingModal) {
    console.log('Админка уже открыта, закрываем предыдущую');
    existingModal.remove();
    isAdminOpen = false;
  }
  
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
    align-items: center !important;
    justify-content: center !important;
    pointer-events: auto !important;
    visibility: visible !important;
    opacity: 1 !important;
  `;
  
  // Получаем цвета из CSS переменных
  const root = getComputedStyle(document.documentElement);
  const bgSecondary = root.getPropertyValue('--bg-secondary') || '#141414';
  const borderColor = root.getPropertyValue('--border-color') || '#2a2a2a';
  const textPrimary = root.getPropertyValue('--text-primary') || '#e9e9e9';
  const textSecondary = root.getPropertyValue('--text-secondary') || '#999999';
  
  adminModal.innerHTML = `
    <div class="sizes-admin-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px); z-index: 1;"></div>
    <div class="sizes-admin-content" style="position: relative; background: ${bgSecondary}; border: 1px solid ${borderColor}; border-radius: 12px; width: 90%; max-width: 1000px; height: 90vh; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); z-index: 2; overflow: hidden;">
      <div class="sizes-admin-header" style="flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="material-icons" style="font-size: 24px; color: ${root.getPropertyValue('--text-primary') || '#e9e9e9'};">settings</span>
          <div>
            <h2 style="margin: 0; font-size: 20px;">Настройки размеров</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: ${root.getPropertyValue('--text-secondary') || '#999999'}; opacity: 0.8;">Управление форматами и значениями по умолчанию</p>
          </div>
        </div>
        <button class="sizes-admin-close" id="sizesAdminClose">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="sizes-admin-body" style="overflow-y: auto; flex: 1 1 auto; padding: 20px; display: flex; flex-direction: column; min-height: 0; overflow-x: hidden;">
        <div class="sizes-admin-tabs" style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid ${borderColor};">
          <button class="sizes-admin-tab active" data-tab="sizes" title="Управление размерами для разных платформ" style="display: flex; align-items: center; gap: 6px;">
            <span class="material-icons" style="font-size: 18px;">aspect_ratio</span>
            <span>Размеры</span>
          </button>
          <button class="sizes-admin-tab" data-tab="defaults" title="Настройки значений по умолчанию для всех элементов" style="display: flex; align-items: center; gap: 6px;">
            <span class="material-icons" style="font-size: 18px;">tune</span>
            <span>Значения по умолчанию</span>
          </button>
        </div>
        
        <div class="sizes-admin-tab-content" id="sizesAdminTabSizes" style="width: 100%;">
          <div style="margin-bottom: 16px; padding: 12px; background: rgba(33, 150, 243, 0.1); border-left: 3px solid #2196F3; border-radius: 4px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="material-icons" style="font-size: 18px; color: #2196F3;">info</span>
              <span style="font-weight: 500; color: ${textPrimary};">Размеры автоматически группируются по типу формата</span>
            </div>
            <div style="display: flex; gap: 16px; margin-top: 8px; font-size: 12px; color: ${textSecondary};">
              <span style="display: flex; align-items: center; gap: 4px;"><span style="color: #4CAF50;">■</span> Квадратные</span>
              <span style="display: flex; align-items: center; gap: 4px;"><span style="color: #2196F3;">■</span> Горизонтальные</span>
              <span style="display: flex; align-items: center; gap: 4px;"><span style="color: #FF9800;">■</span> Вертикальные</span>
            </div>
          </div>
          <div class="sizes-admin-toolbar" style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
            <button class="btn btn-primary" id="sizesAdminAddPlatform" title="Добавить новую платформу для размеров">
              <span class="material-icons">add</span> Добавить платформу
            </button>
            <button class="btn" id="sizesAdminExport" title="Экспортировать настройки размеров в JSON файл">
              <span class="material-icons">download</span> Экспорт JSON
            </button>
            <button class="btn" id="sizesAdminImport" title="Импортировать настройки размеров из JSON файла">
              <span class="material-icons">upload</span> Импорт JSON
            </button>
            <input type="file" id="sizesAdminImportFile" accept=".json" style="display: none;">
            <button class="btn btn-danger" id="sizesAdminReset" title="Сбросить все размеры к значениям по умолчанию">
              <span class="material-icons">refresh</span> Сбросить к дефолту
            </button>
          </div>
          <div class="sizes-admin-platforms" id="sizesAdminPlatforms"></div>
        </div>
        
        <div class="sizes-admin-tab-content" id="sizesAdminTabDefaults" style="display: none; width: 100%; min-height: 200px;">
          ${renderDefaultsTab()}
        </div>
        </div>
      <div class="sizes-admin-footer" style="padding: 16px; border-top: 1px solid ${borderColor}; display: flex; gap: 8px; justify-content: flex-end; flex-shrink: 0; background: ${bgSecondary}; position: relative; z-index: 10;">
        <button class="btn btn-primary" id="sizesAdminSave">Сохранить</button>
        <button class="btn" id="sizesAdminCancel">Отмена</button>
      </div>
    </div>
  `;
  
  try {
    // Удаляем предыдущее модальное окно, если оно существует
    const existingModal = document.getElementById('sizesAdminModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    document.body.appendChild(adminModal);
    
    // Принудительно применяем стили после добавления в DOM
    requestAnimationFrame(() => {
      adminModal.style.display = 'flex';
      adminModal.style.visibility = 'visible';
      adminModal.style.opacity = '1';
    });
    
    console.log('Модальное окно добавлено в DOM');
    console.log('Модальное окно видимо:', adminModal.offsetParent !== null);
    console.log('Z-index модального окна:', window.getComputedStyle(adminModal).zIndex);
    console.log('Display:', window.getComputedStyle(adminModal).display);
    console.log('Visibility:', window.getComputedStyle(adminModal).visibility);
    console.log('Position:', window.getComputedStyle(adminModal).position);
    console.log('Width:', adminModal.offsetWidth, 'Height:', adminModal.offsetHeight);
    console.log('ClientWidth:', adminModal.clientWidth, 'ClientHeight:', adminModal.clientHeight);
    
    // Проверяем содержимое
    const content = adminModal.querySelector('.sizes-admin-content');
    if (content) {
      console.log('Контент найден, размеры:', content.offsetWidth, 'x', content.offsetHeight);
    } else {
      console.error('Контент НЕ найден!');
    }
    
    // Рендерим платформы
    renderAdminPlatforms(sizes);
    console.log('Платформы отрендерены');
    
    // Сбрасываем исходные значения при открытии
    originalDefaults = null;
    
    // Обновляем превью для значений по умолчанию
    updateDefaultsPreview();
    
    // Обработчики событий
    setupAdminHandlers(sizes);
    setupDefaultsHandlers(); // Включает setupBackgroundsHandlers()
    setupMultipliersHandlers();
    setupTabHandlers();
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
  
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#2a2a2a';
  const bgPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#0d0d0d';
  const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#e9e9e9';
  const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999999';
  
  // Функция для определения типа формата
  const getFormatType = (width, height) => {
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.1) return 'square';
    if (ratio > 1.2) return 'horizontal';
    if (ratio < 0.8) return 'vertical';
    return 'near-square';
  };
  
  // Функция для получения иконки типа формата
  const getFormatIcon = (type) => {
    switch(type) {
      case 'square': return 'crop_square';
      case 'horizontal': return 'crop_landscape';
      case 'vertical': return 'crop_portrait';
      default: return 'aspect_ratio';
    }
  };
  
  // Функция для получения цвета типа формата
  const getFormatColor = (type) => {
    switch(type) {
      case 'square': return '#4CAF50';
      case 'horizontal': return '#2196F3';
      case 'vertical': return '#FF9800';
      default: return textSecondary;
    }
  };
  
  // Функция для получения названия типа формата
  const getFormatName = (type) => {
    switch(type) {
      case 'square': return 'Квадратный';
      case 'horizontal': return 'Горизонтальный';
      case 'vertical': return 'Вертикальный';
      default: return 'Почти квадратный';
    }
  };
  
  // Группируем размеры по типу формата
  const groupSizesByType = (platformSizes) => {
    const groups = {
      square: [],
      horizontal: [],
      vertical: [],
      'near-square': []
    };
    
    platformSizes.forEach((size, index) => {
      const type = getFormatType(size.width, size.height);
      groups[type].push({...size, originalIndex: index});
    });
    
    return groups;
  };
  
  let html = '';
  
  Object.keys(sizes).forEach((platform) => {
    const groupedSizes = groupSizesByType(sizes[platform]);
    const formatOrder = ['square', 'horizontal', 'vertical', 'near-square'];
    
    html += `
      <div class="sizes-admin-platform" data-platform="${platform}" style="margin-bottom: 24px; border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px; background: ${bgPrimary};">
        <div class="sizes-admin-platform-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${borderColor};">
          <span class="material-icons" style="color: ${textSecondary}; font-size: 20px;">category</span>
          <input type="text" class="sizes-admin-platform-name" value="${platform}" data-original="${platform}" style="flex: 1; font-weight: 600; font-size: 16px;">
          <span style="color: ${textSecondary}; font-size: 12px;">${sizes[platform].length} ${sizes[platform].length === 1 ? 'размер' : sizes[platform].length < 5 ? 'размера' : 'размеров'}</span>
          <button class="btn-small btn-danger" data-action="remove-platform" data-platform="${platform}" title="Удалить платформу">
            <span class="material-icons">delete</span>
          </button>
        </div>
        <div class="sizes-admin-sizes-list">
    `;
    
    formatOrder.forEach(formatType => {
      if (groupedSizes[formatType].length > 0) {
        const formatColor = getFormatColor(formatType);
        const formatIcon = getFormatIcon(formatType);
        const formatName = getFormatName(formatType);
        
        html += `
          <div class="sizes-admin-format-group" style="margin-bottom: 16px; padding: 12px; background: rgba(255, 255, 255, 0.02); border-radius: 6px; border-left: 3px solid ${formatColor};">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span class="material-icons" style="color: ${formatColor}; font-size: 18px;">${formatIcon}</span>
              <span style="color: ${textPrimary}; font-weight: 500; font-size: 13px;">${formatName} (${groupedSizes[formatType].length})</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
        `;
        
        groupedSizes[formatType].forEach((size) => {
          const ratio = (size.width / size.height).toFixed(2);
          const index = size.originalIndex;
          
          html += `
            <div class="sizes-admin-size-item" style="display: flex; align-items: center; gap: 12px; padding: 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; border: 1px solid ${borderColor};">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <div style="width: 40px; height: 40px; border: 2px solid ${formatColor}; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.05); position: relative; overflow: hidden;" title="Пропорции: ${ratio}:1">
                  <div style="position: absolute; width: ${Math.min(100, (size.width / Math.max(size.width, size.height)) * 100)}%; height: ${Math.min(100, (size.height / Math.max(size.width, size.height)) * 100)}%; background: ${formatColor}; opacity: 0.3;"></div>
                  <span style="font-size: 10px; color: ${textPrimary}; font-weight: 600; z-index: 1;">${ratio}</span>
                </div>
                <input type="number" class="sizes-admin-size-width" value="${size.width}" min="1" placeholder="Ширина" style="width: 100px; padding: 6px 8px; border: 1px solid ${borderColor}; border-radius: 4px; background: ${bgPrimary}; color: ${textPrimary};">
                <span style="color: ${textSecondary};">×</span>
                <input type="number" class="sizes-admin-size-height" value="${size.height}" min="1" placeholder="Высота" style="width: 100px; padding: 6px 8px; border: 1px solid ${borderColor}; border-radius: 4px; background: ${bgPrimary}; color: ${textPrimary};">
                <span style="color: ${textSecondary}; font-size: 12px; min-width: 60px;">${size.width}×${size.height}</span>
              </div>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;">
                <input type="checkbox" ${size.checked ? 'checked' : ''} class="sizes-admin-size-checked" style="cursor: pointer;">
                <span style="color: ${textSecondary}; font-size: 12px;">Выбрано</span>
              </label>
              <button class="btn-small btn-danger" data-action="remove-size" data-platform="${platform}" data-index="${index}" title="Удалить размер" style="padding: 6px;">
                <span class="material-icons" style="font-size: 18px;">close</span>
              </button>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      }
    });
    
    html += `
        </div>
        <button class="btn-small" data-action="add-size" data-platform="${platform}" style="margin-top: 12px; width: 100%;">
          <span class="material-icons">add</span> Добавить размер
        </button>
      </div>
    `;
  });
  
  container.innerHTML = html;
};

/**
 * Обновляет превью пропорций для элемента размера
 */
const updateSizePreview = (sizeItem, width, height) => {
  const preview = sizeItem.querySelector('div[title*="Пропорции"]');
  if (!preview) return;
  
  const ratio = (width / height).toFixed(2);
  const formatType = (() => {
    const r = width / height;
    if (Math.abs(r - 1) < 0.1) return 'square';
    if (r > 1.2) return 'horizontal';
    if (r < 0.8) return 'vertical';
    return 'near-square';
  })();
  
  const formatColor = (() => {
    switch(formatType) {
      case 'square': return '#4CAF50';
      case 'horizontal': return '#2196F3';
      case 'vertical': return '#FF9800';
      default: return '#999999';
    }
  })();
  
  const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#e9e9e9';
  
  preview.style.borderColor = formatColor;
  preview.title = `Пропорции: ${ratio}:1`;
  const previewInner = preview.querySelector('div');
  if (previewInner) {
    previewInner.style.background = formatColor;
    previewInner.style.width = `${Math.min(100, (width / Math.max(width, height)) * 100)}%`;
    previewInner.style.height = `${Math.min(100, (height / Math.max(width, height)) * 100)}%`;
  }
  const ratioSpan = preview.querySelector('span');
  if (ratioSpan) {
    ratioSpan.textContent = ratio;
    ratioSpan.style.color = textPrimary;
  }
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
    // Находим индекс через data-атрибут, который мы сохранили при рендеринге
    const removeBtn = sizeItem.querySelector('[data-action="remove-size"]');
    if (!removeBtn) return;
    const index = parseInt(removeBtn.dataset.index, 10);
    
    if (currentSizes[platform] && currentSizes[platform][index] !== undefined) {
      const widthInput = sizeItem.querySelector('.sizes-admin-size-width');
      const heightInput = sizeItem.querySelector('.sizes-admin-size-height');
      const checkedInput = sizeItem.querySelector('.sizes-admin-size-checked');
      
      if (widthInput) {
        const width = parseInt(widthInput.value, 10);
        if (!isNaN(width) && width > 0) {
          currentSizes[platform][index].width = width;
          // Обновляем отображение размера
          const sizeDisplay = sizeItem.querySelector('span[style*="min-width: 60px"]');
          if (sizeDisplay && heightInput) {
            const height = parseInt(heightInput.value, 10) || currentSizes[platform][index].height;
            sizeDisplay.textContent = `${width}×${height}`;
          }
          // Обновляем превью пропорций
          updateSizePreview(sizeItem, width, parseInt(heightInput?.value || currentSizes[platform][index].height, 10));
        }
      }
      if (heightInput) {
        const height = parseInt(heightInput.value, 10);
        if (!isNaN(height) && height > 0) {
          currentSizes[platform][index].height = height;
          // Обновляем отображение размера
          const sizeDisplay = sizeItem.querySelector('span[style*="min-width: 60px"]');
          if (sizeDisplay && widthInput) {
            const width = parseInt(widthInput.value, 10) || currentSizes[platform][index].width;
            sizeDisplay.textContent = `${width}×${height}`;
          }
          // Обновляем превью пропорций
          updateSizePreview(sizeItem, parseInt(widthInput?.value || currentSizes[platform][index].width, 10), height);
        }
      }
      if (checkedInput) {
        currentSizes[platform][index].checked = checkedInput.checked;
      }
    }
  });
  
  // Сохранение
  document.getElementById('sizesAdminSave').addEventListener('click', () => {
    // Валидация размеров
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
    
    // Сохраняем размеры
    saveSizesConfig(currentSizes);
    updatePresetSizesFromConfig();
    renderPresetSizes();
    updatePreviewSizeSelect();
    updateSizesSummary();
    
    // Сохраняем значения по умолчанию и множители
    const state = getState();
    
    // Создаем объект с значениями по умолчанию (исключаем изображения и файлы)
    const defaultValues = {
      logoSelected: state.logoSelected || '',
      kvSelected: state.kvSelected || '',
      title: state.title || '',
      subtitle: state.subtitle || '',
      legal: state.legal || '',
      age: state.age || '18+',
      bgColor: state.bgColor || '#1e1e1e',
      titleColor: state.titleColor || '#ffffff',
      subtitleColor: state.subtitleColor || '#e0e0e0',
      subtitleOpacity: state.subtitleOpacity ?? 90,
      legalColor: state.legalColor || '#ffffff',
      legalOpacity: state.legalOpacity ?? 60,
      titleAlign: state.titleAlign || 'left',
      subtitleAlign: state.subtitleAlign || 'left',
      legalAlign: state.legalAlign || 'left',
      titleVPos: state.titleVPos || 'top',
      titleSize: state.titleSize ?? 8,
      subtitleSize: state.subtitleSize ?? 4,
      titleSubtitleRatio: state.titleSubtitleRatio ?? 0.5,
      legalSize: state.legalSize ?? 2,
      ageSize: state.ageSize ?? 4,
      logoSize: state.logoSize ?? 40,
      titleWeight: state.titleWeight || 'Regular',
      subtitleWeight: state.subtitleWeight || 'Regular',
      legalWeight: state.legalWeight || 'Regular',
      ageWeight: state.ageWeight || 'Regular',
      titleLetterSpacing: state.titleLetterSpacing ?? 0,
      subtitleLetterSpacing: state.subtitleLetterSpacing ?? 0,
      legalLetterSpacing: state.legalLetterSpacing ?? 0,
      titleLineHeight: state.titleLineHeight ?? 1.1,
      subtitleLineHeight: state.subtitleLineHeight ?? 1.2,
      legalLineHeight: state.legalLineHeight ?? 1.4,
      subtitleGap: state.subtitleGap ?? -1,
      ageGapPercent: state.ageGapPercent ?? 1,
      logoPos: state.logoPos || 'left',
      logoLanguage: state.logoLanguage || 'ru',
      kvBorderRadius: state.kvBorderRadius ?? 0,
      kvPosition: state.kvPosition || 'center',
      bgSize: state.bgSize || 'cover',
      bgPosition: state.bgPosition || 'center',
      bgVPosition: state.bgVPosition || 'center',
      textGradientOpacity: state.textGradientOpacity ?? 100,
      centerTextOverlayOpacity: state.centerTextOverlayOpacity ?? 20,
      paddingPercent: state.paddingPercent ?? 5,
      layoutMode: state.layoutMode || 'auto'
    };
    
    // Сохраняем значения по умолчанию в localStorage
    localStorage.setItem('default-values', JSON.stringify(defaultValues));
    
    // Применяем значения по умолчанию к state (исключаем изображения и файлы)
    // Используем batch для обновления всех значений сразу
    batch(() => {
      Object.keys(defaultValues).forEach(key => {
        setKey(key, defaultValues[key]);
      });
    });
    
    // Сохраняем множители, если они есть
    const currentMultipliers = state.formatMultipliers;
    if (currentMultipliers) {
      // Сохраняем в localStorage
      localStorage.setItem('format-multipliers', JSON.stringify(currentMultipliers));
      // Убеждаемся, что множители обновлены в state (создаем новый объект для триггера обновления)
      const updatedMultipliers = JSON.parse(JSON.stringify(currentMultipliers));
      // Принудительно обновляем state, даже если объект выглядит одинаковым
      setState({ formatMultipliers: updatedMultipliers });
    }
    
    // Небольшая задержка перед рендером, чтобы state успел обновиться
    setTimeout(() => {
      // Проверяем, что значения обновились
      const checkState = getState();
      console.log('Значения по умолчанию после сохранения:', {
        titleSize: checkState.titleSize,
        subtitleSize: checkState.subtitleSize,
        logoSize: checkState.logoSize,
        bgColor: checkState.bgColor
      });
      // Принудительно перерисовываем все макеты с новыми значениями
    renderer.render();
    }, 50);
    
    closeSizesAdmin();
    alert('Все настройки успешно сохранены!');
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

/**
 * Обновляет превью для значений по умолчанию
 */
const updateDefaultsPreview = () => {
  const state = getState();
  
  // Логотип
  const logoImg = document.getElementById('defaultLogoPreviewImg');
  const logoPlaceholder = document.getElementById('defaultLogoPreviewPlaceholder');
  const logoClearBtn = document.getElementById('defaultLogoClear');
  if (logoImg && logoPlaceholder) {
    if (state.logoSelected) {
      logoImg.src = state.logoSelected;
      logoImg.style.display = 'block';
      logoPlaceholder.style.display = 'none';
    } else {
      logoImg.style.display = 'none';
      logoPlaceholder.style.display = 'block';
    }
    // Показываем кнопку удаления, если значение изменилось
    if (logoClearBtn && originalDefaults) {
      logoClearBtn.style.display = (state.logoSelected && state.logoSelected !== originalDefaults.logoSelected) ? 'block' : 'none';
    }
  }
  
  // Партнерский логотип
  const partnerLogoImg = document.getElementById('defaultPartnerLogoPreviewImg');
  const partnerLogoPlaceholder = document.getElementById('defaultPartnerLogoPreviewPlaceholder');
  const partnerLogoClearBtn = document.getElementById('defaultPartnerLogoClear');
  if (partnerLogoImg && partnerLogoPlaceholder) {
    if (state.partnerLogoFile) {
      partnerLogoImg.src = state.partnerLogoFile;
      partnerLogoImg.style.display = 'block';
      partnerLogoPlaceholder.style.display = 'none';
    } else {
      partnerLogoImg.style.display = 'none';
      partnerLogoPlaceholder.style.display = 'block';
    }
    // Показываем кнопку удаления, если есть файл
    if (partnerLogoClearBtn) {
      partnerLogoClearBtn.style.display = state.partnerLogoFile ? 'block' : 'none';
    }
  }
  
  // KV
  const kvImg = document.getElementById('defaultKVPreviewImg');
  const kvPlaceholder = document.getElementById('defaultKVPreviewPlaceholder');
  const kvClearBtn = document.getElementById('defaultKVClear');
  if (kvImg && kvPlaceholder) {
    if (state.kvSelected) {
      kvImg.src = state.kvSelected;
      kvImg.style.display = 'block';
      kvPlaceholder.style.display = 'none';
    } else {
      kvImg.style.display = 'none';
      kvPlaceholder.style.display = 'block';
    }
    // Показываем кнопку удаления, если значение изменилось
    if (kvClearBtn && originalDefaults) {
      kvClearBtn.style.display = (state.kvSelected && state.kvSelected !== originalDefaults.kvSelected) ? 'block' : 'none';
    }
  }
  
  // Фон
  const bgPreview = document.getElementById('defaultBgPreview');
  const bgImg = document.getElementById('defaultBgPreviewImg');
  const bgPlaceholder = document.getElementById('defaultBgPreviewPlaceholder');
  const bgColorResetBtn = document.getElementById('defaultBgColorReset');
  if (bgPreview && bgImg && bgPlaceholder) {
    if (state.bgImage) {
      bgImg.src = state.bgImage;
      bgImg.style.display = 'block';
      bgPlaceholder.textContent = 'Изображение';
    } else {
      bgImg.style.display = 'none';
      bgPreview.style.background = state.bgColor || '#1e1e1e';
      bgPlaceholder.textContent = 'Цвет: ' + (state.bgColor || '#1e1e1e');
    }
    // Показываем кнопку сброса цвета, если цвет изменился
    if (bgColorResetBtn && originalDefaults) {
      bgColorResetBtn.style.display = (state.bgColor !== originalDefaults.bgColor) ? 'block' : 'none';
    }
  }
};

/**
 * Настраивает обработчики для вкладки с настройками по умолчанию
 */
const setupDefaultsHandlers = () => {
  // Выбор логотипа из библиотеки
  const defaultLogoSelect = document.getElementById('defaultLogoSelect');
  if (defaultLogoSelect) {
    defaultLogoSelect.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      // Сохраняем оригинальный обработчик
      const originalSelectHandler = window.selectPreloadedLogo;
      let handlerRestored = false;
      
      // Временно переопределяем обработчик выбора
      window.selectPreloadedLogo = async (logoFile) => {
        if (!handlerRestored) {
          handlerRestored = true;
          // Используем импортированную функцию напрямую
          await selectPreloadedLogo(logoFile);
          updateDefaultsPreview();
          // Показываем кнопку удаления
          const clearBtn = document.getElementById('defaultLogoClear');
          if (clearBtn && originalDefaults) {
            const state = getState();
            clearBtn.style.display = (state.logoSelected && state.logoSelected !== originalDefaults.logoSelected) ? 'block' : 'none';
          }
          // Восстанавливаем оригинальный обработчик
          window.selectPreloadedLogo = originalSelectHandler;
        }
      };
      
      // Используем импортированную функцию напрямую
      try {
        console.log('Попытка открыть модальное окно выбора логотипа');
        if (openLogoSelectModal) {
          console.log('Используем импортированную функцию openLogoSelectModal');
          await openLogoSelectModal();
        } else if (typeof window.openLogoSelectModal === 'function') {
          console.log('Используем глобальную функцию window.openLogoSelectModal');
          await window.openLogoSelectModal();
        } else {
          console.error('openLogoSelectModal не найдена');
          window.selectPreloadedLogo = originalSelectHandler;
          return;
        }
        console.log('Модальное окно должно быть открыто');
        
        // Увеличиваем z-index модального окна выбора логотипа, чтобы оно было поверх попапа настроек
        // Используем requestAnimationFrame для гарантии, что модальное окно уже отрендерено
        requestAnimationFrame(() => {
          const logoModal = document.getElementById('logoSelectModalOverlay');
          if (logoModal) {
            logoModal.style.zIndex = '100000';
            const logoPanel = document.getElementById('logoSelectPanel');
            if (logoPanel) {
              logoPanel.style.zIndex = '100001';
            }
          }
        });
        
        // Отслеживаем закрытие модального окна через MutationObserver
        const logoModal = document.getElementById('logoSelectModalOverlay');
        if (logoModal) {
          const observer = new MutationObserver(() => {
            const isVisible = logoModal.style.display !== 'none' && 
                            getComputedStyle(logoModal).display !== 'none';
            if (!isVisible && !handlerRestored) {
              observer.disconnect();
              window.selectPreloadedLogo = originalSelectHandler;
              handlerRestored = true;
            }
          });
          
          observer.observe(logoModal, {
            attributes: true,
            attributeFilter: ['style']
          });
          
          // Также слушаем клики на overlay для закрытия
          const closeHandler = (e) => {
            if (e.target === logoModal && !handlerRestored) {
              observer.disconnect();
              logoModal.removeEventListener('click', closeHandler);
              window.selectPreloadedLogo = originalSelectHandler;
              handlerRestored = true;
            }
          };
          logoModal.addEventListener('click', closeHandler);
          
          // Очищаем через 30 секунд на случай, если что-то пошло не так
          setTimeout(() => {
            observer.disconnect();
            if (logoModal) {
              logoModal.removeEventListener('click', closeHandler);
            }
            if (!handlerRestored) {
              window.selectPreloadedLogo = originalSelectHandler;
              handlerRestored = true;
            }
          }, 30000);
        }
      } catch (error) {
        console.error('Ошибка при открытии модального окна выбора логотипа:', error);
        window.selectPreloadedLogo = originalSelectHandler;
      }
    });
  }
  
  // Удаление логотипа (возврат к исходному)
  const defaultLogoClear = document.getElementById('defaultLogoClear');
  if (defaultLogoClear) {
    defaultLogoClear.addEventListener('click', () => {
      if (originalDefaults) {
        setKey('logoSelected', originalDefaults.logoSelected);
        setKey('logo', null);
        updateDefaultsPreview();
        defaultLogoClear.style.display = 'none';
      }
    });
  }
  
  // Загрузка логотипа
  const defaultLogoUpload = document.getElementById('defaultLogoUpload');
  const defaultLogoUploadFile = document.getElementById('defaultLogoUploadFile');
  if (defaultLogoUpload && defaultLogoUploadFile) {
    defaultLogoUpload.addEventListener('click', () => {
      defaultLogoUploadFile.click();
    });
    defaultLogoUploadFile.addEventListener('change', async (e) => {
      if (e.target.files[0]) {
        const event = { target: e.target };
        await handleLogoUpload(event);
        updateDefaultsPreview();
      }
    });
  }
  
  // Загрузка партнерского логотипа
  const defaultPartnerLogoUpload = document.getElementById('defaultPartnerLogoUpload');
  const defaultPartnerLogoUploadFile = document.getElementById('defaultPartnerLogoUploadFile');
  if (defaultPartnerLogoUpload && defaultPartnerLogoUploadFile) {
    defaultPartnerLogoUpload.addEventListener('click', () => {
      defaultPartnerLogoUploadFile.click();
    });
    defaultPartnerLogoUploadFile.addEventListener('change', async (e) => {
      if (e.target.files[0]) {
        const event = { target: e.target };
        await handlePartnerLogoUpload(event);
        updateDefaultsPreview();
      }
    });
  }
  
  // Удаление партнерского логотипа
  const defaultPartnerLogoClear = document.getElementById('defaultPartnerLogoClear');
  if (defaultPartnerLogoClear) {
    defaultPartnerLogoClear.addEventListener('click', () => {
      setKey('partnerLogo', null);
      setKey('partnerLogoFile', null);
      updateDefaultsPreview();
      renderer.render();
    });
  }
  
  // Выбор KV из библиотеки
  const defaultKVSelect = document.getElementById('defaultKVSelect');
  if (defaultKVSelect) {
    defaultKVSelect.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      // Сохраняем оригинальный обработчик
      const originalSelectHandler = window.selectPreloadedKV;
      let handlerRestored = false;
      
      // Временно переопределяем обработчик выбора
      window.selectPreloadedKV = async (kvFile) => {
        if (!handlerRestored) {
          handlerRestored = true;
          // Используем импортированную функцию напрямую
          await selectPreloadedKV(kvFile);
          updateDefaultsPreview();
          // Показываем кнопку удаления
          const clearBtn = document.getElementById('defaultKVClear');
          if (clearBtn && originalDefaults) {
            const state = getState();
            clearBtn.style.display = (state.kvSelected && state.kvSelected !== originalDefaults.kvSelected) ? 'block' : 'none';
          }
          // Восстанавливаем оригинальный обработчик
          window.selectPreloadedKV = originalSelectHandler;
        }
      };
      
      // Используем импортированную функцию напрямую
      try {
        console.log('Попытка открыть модальное окно выбора KV');
        if (openKVSelectModal) {
          console.log('Используем импортированную функцию openKVSelectModal');
          await openKVSelectModal();
        } else if (typeof window.openKVSelectModal === 'function') {
          console.log('Используем глобальную функцию window.openKVSelectModal');
          await window.openKVSelectModal();
        } else {
          console.error('openKVSelectModal не найдена');
          window.selectPreloadedKV = originalSelectHandler;
          return;
        }
        console.log('Модальное окно должно быть открыто');
        
        // Увеличиваем z-index модального окна выбора KV, чтобы оно было поверх попапа настроек
        // Используем requestAnimationFrame для гарантии, что модальное окно уже отрендерено
        requestAnimationFrame(() => {
          const kvModal = document.getElementById('kvSelectModalOverlay');
          if (kvModal) {
            kvModal.style.zIndex = '100000';
            const kvPanel = document.getElementById('kvSelectPanel');
            if (kvPanel) {
              kvPanel.style.zIndex = '100001';
            }
          }
        });
        
        // Отслеживаем закрытие модального окна через MutationObserver
        const kvModal = document.getElementById('kvSelectModalOverlay');
        if (kvModal) {
          const observer = new MutationObserver(() => {
            const isVisible = kvModal.style.display !== 'none' && 
                            getComputedStyle(kvModal).display !== 'none';
            if (!isVisible && !handlerRestored) {
              observer.disconnect();
              window.selectPreloadedKV = originalSelectHandler;
              handlerRestored = true;
            }
          });
          
          observer.observe(kvModal, {
            attributes: true,
            attributeFilter: ['style']
          });
          
          // Также слушаем клики на overlay для закрытия
          const closeHandler = (e) => {
            if (e.target === kvModal && !handlerRestored) {
              observer.disconnect();
              kvModal.removeEventListener('click', closeHandler);
              window.selectPreloadedKV = originalSelectHandler;
              handlerRestored = true;
            }
          };
          kvModal.addEventListener('click', closeHandler);
          
          // Очищаем через 30 секунд на случай, если что-то пошло не так
          setTimeout(() => {
            observer.disconnect();
            if (kvModal) {
              kvModal.removeEventListener('click', closeHandler);
            }
            if (!handlerRestored) {
              window.selectPreloadedKV = originalSelectHandler;
              handlerRestored = true;
            }
          }, 30000);
        }
      } catch (error) {
        console.error('Ошибка при открытии модального окна выбора KV:', error);
        window.selectPreloadedKV = originalSelectHandler;
      }
    });
  }
  
  // Удаление KV (возврат к исходному)
  const defaultKVClear = document.getElementById('defaultKVClear');
  if (defaultKVClear) {
    defaultKVClear.addEventListener('click', () => {
      if (originalDefaults) {
        setKey('kvSelected', originalDefaults.kvSelected);
        setKey('kv', null);
        updateDefaultsPreview();
        defaultKVClear.style.display = 'none';
      }
    });
  }
  
  // Загрузка KV
  const defaultKVUpload = document.getElementById('defaultKVUpload');
  const defaultKVUploadFile = document.getElementById('defaultKVUploadFile');
  if (defaultKVUpload && defaultKVUploadFile) {
    defaultKVUpload.addEventListener('click', () => {
      defaultKVUploadFile.click();
    });
    defaultKVUploadFile.addEventListener('change', async (e) => {
      if (e.target.files[0]) {
        const event = { target: e.target };
        await handleKVUpload(event);
        updateDefaultsPreview();
        // Показываем кнопку удаления
        const clearBtn = document.getElementById('defaultKVClear');
        if (clearBtn) clearBtn.style.display = 'block';
      }
    });
  }
  
  // Загрузка фона
  const defaultBgUpload = document.getElementById('defaultBgUpload');
  const defaultBgUploadFile = document.getElementById('defaultBgUploadFile');
  if (defaultBgUpload && defaultBgUploadFile) {
    defaultBgUpload.addEventListener('click', () => {
      defaultBgUploadFile.click();
    });
    defaultBgUploadFile.addEventListener('change', async (e) => {
      if (e.target.files[0]) {
        const event = { target: e.target };
        await handleBgUpload(event);
        updateDefaultsPreview();
        const clearBtn = document.getElementById('defaultBgClear');
        if (clearBtn) clearBtn.style.display = 'block';
      }
    });
  }
  
  // Удаление фона (изображения)
  const defaultBgClear = document.getElementById('defaultBgClear');
  if (defaultBgClear) {
    defaultBgClear.addEventListener('click', () => {
      setKey('bgImage', null);
      updateDefaultsPreview();
      defaultBgClear.style.display = 'none';
    });
  }
  
  // Сброс цвета фона к исходному
  const defaultBgColorReset = document.getElementById('defaultBgColorReset');
  if (defaultBgColorReset) {
    defaultBgColorReset.addEventListener('click', () => {
      if (originalDefaults) {
        setKey('bgColor', originalDefaults.bgColor);
        const bgColorInput = document.getElementById('defaultBgColor');
        const bgColorHexInput = document.getElementById('defaultBgColorHex');
        if (bgColorInput) bgColorInput.value = originalDefaults.bgColor;
        if (bgColorHexInput) bgColorHexInput.value = originalDefaults.bgColor;
        updateDefaultsPreview();
        defaultBgColorReset.style.display = 'none';
      }
    });
  }
  
  // Цвет фона
  const defaultBgColor = document.getElementById('defaultBgColor');
  const defaultBgColorHex = document.getElementById('defaultBgColorHex');
  if (defaultBgColor && defaultBgColorHex) {
    defaultBgColor.addEventListener('input', (e) => {
      const color = e.target.value;
      setKey('bgColor', color);
      defaultBgColorHex.value = color;
      updateDefaultsPreview();
      // Показываем кнопку сброса, если цвет изменился
      if (defaultBgColorReset && originalDefaults) {
        defaultBgColorReset.style.display = color !== originalDefaults.bgColor ? 'block' : 'none';
      }
    });
    defaultBgColorHex.addEventListener('change', (e) => {
      const color = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(color)) {
        setKey('bgColor', color);
        defaultBgColor.value = color;
        updateDefaultsPreview();
        // Показываем кнопку сброса, если цвет изменился
        if (defaultBgColorReset && originalDefaults) {
          defaultBgColorReset.style.display = color !== originalDefaults.bgColor ? 'block' : 'none';
        }
      }
    });
  }
  
  // Цвет текста
  const defaultTextColor = document.getElementById('defaultTextColor');
  const defaultTextColorHex = document.getElementById('defaultTextColorHex');
  const defaultTextColorReset = document.getElementById('defaultTextColorReset');
  if (defaultTextColor && defaultTextColorHex) {
    defaultTextColor.addEventListener('input', (e) => {
      const color = e.target.value;
      setKey('titleColor', color);
      defaultTextColorHex.value = color;
      // Показываем кнопку сброса, если цвет изменился
      if (defaultTextColorReset && originalDefaults) {
        defaultTextColorReset.style.display = color !== originalDefaults.titleColor ? 'block' : 'none';
      }
    });
    defaultTextColorHex.addEventListener('change', (e) => {
      const color = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(color)) {
        setKey('titleColor', color);
        defaultTextColor.value = color;
        // Показываем кнопку сброса, если цвет изменился
        if (defaultTextColorReset && originalDefaults) {
          defaultTextColorReset.style.display = color !== originalDefaults.titleColor ? 'block' : 'none';
        }
      }
    });
  }
  
  // Сброс цвета текста к исходному
  if (defaultTextColorReset) {
    defaultTextColorReset.addEventListener('click', () => {
      if (originalDefaults) {
        setKey('titleColor', originalDefaults.titleColor);
        if (defaultTextColor) defaultTextColor.value = originalDefaults.titleColor;
        if (defaultTextColorHex) defaultTextColorHex.value = originalDefaults.titleColor;
        defaultTextColorReset.style.display = 'none';
      }
    });
  }
  
  // Текстовые поля
  const defaultTitle = document.getElementById('defaultTitle');
  if (defaultTitle) {
    defaultTitle.addEventListener('input', (e) => {
      setKey('title', e.target.value);
    });
  }
  
  const defaultSubtitle = document.getElementById('defaultSubtitle');
  if (defaultSubtitle) {
    defaultSubtitle.addEventListener('input', (e) => {
      setKey('subtitle', e.target.value);
    });
  }
  
  const defaultLegal = document.getElementById('defaultLegal');
  if (defaultLegal) {
    defaultLegal.addEventListener('input', (e) => {
      setKey('legal', e.target.value);
    });
  }
  
  const defaultAge = document.getElementById('defaultAge');
  if (defaultAge) {
    defaultAge.addEventListener('input', (e) => {
      setKey('age', e.target.value);
    });
  }
  
  // Настройки заголовка
  const defaultTitleSize = document.getElementById('defaultTitleSize');
  if (defaultTitleSize) {
    defaultTitleSize.addEventListener('input', (e) => {
      setKey('titleSize', parseFloat(e.target.value) || 8);
      // Пересчитываем размер подзаголовка на основе коэффициента
      const state = getState();
      const ratio = state.titleSubtitleRatio ?? 0.5;
      const newSubtitleSize = parseFloat((state.titleSize * ratio).toFixed(2));
      setKey('subtitleSize', newSubtitleSize);
      renderer.render();
    });
  }
  
  const defaultTitleWeight = document.getElementById('defaultTitleWeight');
  if (defaultTitleWeight) {
    defaultTitleWeight.addEventListener('change', (e) => {
      setKey('titleWeight', e.target.value);
      renderer.render();
    });
  }
  
  const defaultTitleAlign = document.getElementById('defaultTitleAlign');
  if (defaultTitleAlign) {
    defaultTitleAlign.addEventListener('change', (e) => {
      setKey('titleAlign', e.target.value);
      renderer.render();
    });
  }
  
  const defaultTitleVPos = document.getElementById('defaultTitleVPos');
  if (defaultTitleVPos) {
    defaultTitleVPos.addEventListener('change', (e) => {
      setKey('titleVPos', e.target.value);
      renderer.render();
    });
  }
  
  const defaultTitleLetterSpacing = document.getElementById('defaultTitleLetterSpacing');
  if (defaultTitleLetterSpacing) {
    defaultTitleLetterSpacing.addEventListener('input', (e) => {
      setKey('titleLetterSpacing', parseFloat(e.target.value) || 0);
      renderer.render();
    });
  }
  
  const defaultTitleLineHeight = document.getElementById('defaultTitleLineHeight');
  if (defaultTitleLineHeight) {
    defaultTitleLineHeight.addEventListener('input', (e) => {
      setKey('titleLineHeight', parseFloat(e.target.value) || 1.1);
      renderer.render();
    });
  }
  
  // Настройки подзаголовка
  const defaultSubtitleColor = document.getElementById('defaultSubtitleColor');
  const defaultSubtitleColorHex = document.getElementById('defaultSubtitleColorHex');
  if (defaultSubtitleColor && defaultSubtitleColorHex) {
    defaultSubtitleColor.addEventListener('input', (e) => {
      const color = e.target.value;
      setKey('subtitleColor', color);
      defaultSubtitleColorHex.value = color;
      renderer.render();
    });
    defaultSubtitleColorHex.addEventListener('change', (e) => {
      const color = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(color)) {
        setKey('subtitleColor', color);
        defaultSubtitleColor.value = color;
        renderer.render();
      }
    });
  }
  
  const defaultSubtitleOpacity = document.getElementById('defaultSubtitleOpacity');
  if (defaultSubtitleOpacity) {
    defaultSubtitleOpacity.addEventListener('input', (e) => {
      setKey('subtitleOpacity', parseInt(e.target.value) || 90);
      renderer.render();
    });
  }

  const defaultTitleSubtitleRatio = document.getElementById('defaultTitleSubtitleRatio');
  if (defaultTitleSubtitleRatio) {
    defaultTitleSubtitleRatio.addEventListener('input', (e) => {
      const ratio = parseFloat(e.target.value) || 0.5;
      const ratioValue = document.getElementById('defaultTitleSubtitleRatioValue');
      if (ratioValue) {
        ratioValue.textContent = ratio.toFixed(2);
      }
      setKey('titleSubtitleRatio', ratio);
      // Пересчитываем размер подзаголовка на основе нового коэффициента
      const state = getState();
      const newSubtitleSize = parseFloat((state.titleSize * ratio).toFixed(2));
      setKey('subtitleSize', newSubtitleSize);
      renderer.render();
    });
  }
  
  const defaultSubtitleSize = document.getElementById('defaultSubtitleSize');
  if (defaultSubtitleSize) {
    defaultSubtitleSize.addEventListener('input', (e) => {
      setKey('subtitleSize', parseFloat(e.target.value) || 4);
      renderer.render();
    });
  }
  
  const defaultSubtitleWeight = document.getElementById('defaultSubtitleWeight');
  if (defaultSubtitleWeight) {
    defaultSubtitleWeight.addEventListener('change', (e) => {
      setKey('subtitleWeight', e.target.value);
      renderer.render();
    });
  }
  
  const defaultSubtitleAlign = document.getElementById('defaultSubtitleAlign');
  if (defaultSubtitleAlign) {
    defaultSubtitleAlign.addEventListener('change', (e) => {
      setKey('subtitleAlign', e.target.value);
      renderer.render();
    });
  }
  
  const defaultSubtitleGap = document.getElementById('defaultSubtitleGap');
  if (defaultSubtitleGap) {
    defaultSubtitleGap.addEventListener('input', (e) => {
      setKey('subtitleGap', parseFloat(e.target.value) || -1);
      renderer.render();
    });
  }
  
  const defaultSubtitleLetterSpacing = document.getElementById('defaultSubtitleLetterSpacing');
  if (defaultSubtitleLetterSpacing) {
    defaultSubtitleLetterSpacing.addEventListener('input', (e) => {
      setKey('subtitleLetterSpacing', parseFloat(e.target.value) || 0);
      renderer.render();
    });
  }
  
  const defaultSubtitleLineHeight = document.getElementById('defaultSubtitleLineHeight');
  if (defaultSubtitleLineHeight) {
    defaultSubtitleLineHeight.addEventListener('input', (e) => {
      setKey('subtitleLineHeight', parseFloat(e.target.value) || 1.2);
      renderer.render();
    });
  }
  
  // Настройки юридического текста
  const defaultLegalColor = document.getElementById('defaultLegalColor');
  const defaultLegalColorHex = document.getElementById('defaultLegalColorHex');
  if (defaultLegalColor && defaultLegalColorHex) {
    defaultLegalColor.addEventListener('input', (e) => {
      const color = e.target.value;
      setKey('legalColor', color);
      defaultLegalColorHex.value = color;
      renderer.render();
    });
    defaultLegalColorHex.addEventListener('change', (e) => {
      const color = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(color)) {
        setKey('legalColor', color);
        defaultLegalColor.value = color;
        renderer.render();
      }
    });
  }
  
  const defaultLegalOpacity = document.getElementById('defaultLegalOpacity');
  if (defaultLegalOpacity) {
    defaultLegalOpacity.addEventListener('input', (e) => {
      setKey('legalOpacity', parseInt(e.target.value) || 60);
      renderer.render();
    });
  }
  
  const defaultLegalSize = document.getElementById('defaultLegalSize');
  if (defaultLegalSize) {
    defaultLegalSize.addEventListener('input', (e) => {
      setKey('legalSize', parseFloat(e.target.value) || 2);
      renderer.render();
    });
  }
  
  const defaultLegalWeight = document.getElementById('defaultLegalWeight');
  if (defaultLegalWeight) {
    defaultLegalWeight.addEventListener('change', (e) => {
      setKey('legalWeight', e.target.value);
      renderer.render();
    });
  }
  
  const defaultLegalAlign = document.getElementById('defaultLegalAlign');
  if (defaultLegalAlign) {
    defaultLegalAlign.addEventListener('change', (e) => {
      setKey('legalAlign', e.target.value);
      renderer.render();
    });
  }
  
  const defaultLegalLetterSpacing = document.getElementById('defaultLegalLetterSpacing');
  if (defaultLegalLetterSpacing) {
    defaultLegalLetterSpacing.addEventListener('input', (e) => {
      setKey('legalLetterSpacing', parseFloat(e.target.value) || 0);
      renderer.render();
    });
  }
  
  const defaultLegalLineHeight = document.getElementById('defaultLegalLineHeight');
  if (defaultLegalLineHeight) {
    defaultLegalLineHeight.addEventListener('input', (e) => {
      setKey('legalLineHeight', parseFloat(e.target.value) || 1.4);
      renderer.render();
    });
  }
  
  // Настройки возраста
  const defaultAgeSize = document.getElementById('defaultAgeSize');
  if (defaultAgeSize) {
    defaultAgeSize.addEventListener('input', (e) => {
      setKey('ageSize', parseFloat(e.target.value) || 4);
      renderer.render();
    });
  }
  
  const defaultAgeWeight = document.getElementById('defaultAgeWeight');
  if (defaultAgeWeight) {
    defaultAgeWeight.addEventListener('change', (e) => {
      setKey('ageWeight', e.target.value);
      renderer.render();
    });
  }
  
  const defaultAgeGapPercent = document.getElementById('defaultAgeGapPercent');
  if (defaultAgeGapPercent) {
    defaultAgeGapPercent.addEventListener('input', (e) => {
      setKey('ageGapPercent', parseFloat(e.target.value) || 1);
      renderer.render();
    });
  }
  
  // Настройки логотипа
  const defaultLogoSize = document.getElementById('defaultLogoSize');
  if (defaultLogoSize) {
    defaultLogoSize.addEventListener('input', (e) => {
      setKey('logoSize', parseInt(e.target.value) || 40);
      renderer.render();
    });
  }
  
  const defaultLogoPos = document.getElementById('defaultLogoPos');
  if (defaultLogoPos) {
    defaultLogoPos.addEventListener('change', (e) => {
      setKey('logoPos', e.target.value);
      renderer.render();
    });
  }
  
  const defaultLogoLanguage = document.getElementById('defaultLogoLanguage');
  if (defaultLogoLanguage) {
    defaultLogoLanguage.addEventListener('change', (e) => {
      setKey('logoLanguage', e.target.value);
      renderer.render();
    });
  }
  
  // Настройки KV
  const defaultKvBorderRadius = document.getElementById('defaultKvBorderRadius');
  if (defaultKvBorderRadius) {
    defaultKvBorderRadius.addEventListener('input', (e) => {
      setKey('kvBorderRadius', parseInt(e.target.value) || 0);
      renderer.render();
    });
  }
  
  const defaultKvPosition = document.getElementById('defaultKvPosition');
  if (defaultKvPosition) {
    defaultKvPosition.addEventListener('change', (e) => {
      setKey('kvPosition', e.target.value);
      renderer.render();
    });
  }
  
  // Дополнительные настройки
  const defaultPaddingPercent = document.getElementById('defaultPaddingPercent');
  if (defaultPaddingPercent) {
    defaultPaddingPercent.addEventListener('input', (e) => {
      setKey('paddingPercent', parseFloat(e.target.value) || 5);
      renderer.render();
    });
  }
  
  const defaultLayoutMode = document.getElementById('defaultLayoutMode');
  if (defaultLayoutMode) {
    defaultLayoutMode.addEventListener('change', (e) => {
      setKey('layoutMode', e.target.value);
      renderer.render();
    });
  }
  
  const defaultBgSize = document.getElementById('defaultBgSize');
  if (defaultBgSize) {
    defaultBgSize.addEventListener('change', (e) => {
      setKey('bgSize', e.target.value);
      renderer.render();
    });
  }
  
  const defaultBgPosition = document.getElementById('defaultBgPosition');
  if (defaultBgPosition) {
    defaultBgPosition.addEventListener('change', (e) => {
      setKey('bgPosition', e.target.value);
      renderer.render();
    });
  }
  
  const defaultBgVPosition = document.getElementById('defaultBgVPosition');
  if (defaultBgVPosition) {
    defaultBgVPosition.addEventListener('change', (e) => {
      setKey('bgVPosition', e.target.value);
      renderer.render();
    });
  }
  
  const defaultTextGradientOpacity = document.getElementById('defaultTextGradientOpacity');
  if (defaultTextGradientOpacity) {
    defaultTextGradientOpacity.addEventListener('input', (e) => {
      setKey('textGradientOpacity', parseInt(e.target.value) || 100);
      renderer.render();
    });
  }
  
  const defaultCenterTextOverlayOpacity = document.getElementById('defaultCenterTextOverlayOpacity');
  if (defaultCenterTextOverlayOpacity) {
    defaultCenterTextOverlayOpacity.addEventListener('input', (e) => {
      setKey('centerTextOverlayOpacity', parseInt(e.target.value) || 20);
      renderer.render();
    });
  }
  
  // Настройка обработчиков для управления фонами (перемещено из отдельной вкладки)
  setupBackgroundsHandlers();
};

/**
 * Настраивает обработчики для вкладки с множителями форматов
 */
const setupMultipliersHandlers = () => {
  const state = getState();
  
  // Загружаем множители из localStorage, если их нет в state
  let multipliers = state.formatMultipliers;
  if (!multipliers) {
    try {
      const saved = localStorage.getItem('format-multipliers');
      if (saved) {
        multipliers = JSON.parse(saved);
        // Инициализируем множители в state
        setKey('formatMultipliers', JSON.parse(JSON.stringify(multipliers)));
      }
    } catch (e) {
      console.warn('Ошибка при загрузке множителей из localStorage:', e);
    }
  }
  
  // Если множителей все еще нет, используем дефолтные
  if (!multipliers) {
    multipliers = {
    vertical: { logo: 2, title: 1, subtitle: 1, legal: 1, age: 1 },
    ultraWide: { logo: 0.75, titleSmall: 3, titleMedium: 2.2, titleLarge: 2, subtitleSmall: 3, subtitleMedium: 2.2, subtitleLarge: 2, legalNormal: 2.5, legalMedium: 2, age: 2 },
    veryWide: { logo: 0.75, titleMedium: 2.2, titleLarge: 2, titleExtraLarge: 2, subtitleMedium: 2.2, subtitleLarge: 2, subtitleExtraLarge: 2, legalNormal: 2.5, legalMedium: 2, legalExtraLarge: 2.5, age: 2 },
    horizontal: { logo: 0.75, titleSmall: 1.8, titleLarge: 1.6, titleWideSmall: 1.2, titleWideMedium: 1.4, subtitleSmall: 1.8, subtitleLarge: 1.6, subtitleWideSmall: 1.2, subtitleWideMedium: 1.4, legalSmall: 1.8, legalLarge: 2, legalWide450: 1.2, legalWide500: 1.1, legalWideOther: 1.15, age: 2, ageWide: null },
    square: { title: 0.9, subtitle: 0.9 },
    tall: { title: 1.3, subtitle: 1.3 }
  };
    // Инициализируем дефолтные множители в state
    setKey('formatMultipliers', JSON.parse(JSON.stringify(multipliers)));
  }
  
  // Функция для обновления множителя
  const updateMultiplier = (formatType, key, value) => {
    // Получаем актуальное состояние
    const currentState = getState();
    let currentMultipliers = currentState.formatMultipliers || {};
    
    // Создаем копию множителей
    const updatedMultipliers = JSON.parse(JSON.stringify(currentMultipliers));
    
    // Инициализируем тип формата, если его нет
    if (!updatedMultipliers[formatType]) {
      updatedMultipliers[formatType] = {};
    }
    
    // Обновляем значение
    updatedMultipliers[formatType][key] = parseFloat(value) || 0;
    
    // Обновляем множители в state (используем setState для принудительного обновления)
    setState({ formatMultipliers: updatedMultipliers });
    
    // Обновляем локальную переменную для последующих изменений
    multipliers = updatedMultipliers;
    
    // Автоматически перерисовываем превью с небольшой задержкой
    setTimeout(() => {
      // Проверяем, что множители обновились в state
      const checkState = getState();
      console.log('Множители после обновления:', checkState.formatMultipliers?.[formatType]?.[key]);
    renderer.render();
    }, 50);
  };
  
  // Вертикальные форматы
  const verticalInputs = ['logo', 'title', 'subtitle', 'legal', 'age'];
  verticalInputs.forEach(key => {
    const input = document.getElementById(`multiplier-vertical-${key}`);
    if (input) {
      input.addEventListener('input', (e) => {
        updateMultiplier('vertical', key, e.target.value);
      });
    }
  });
  
  // Ультра-широкие форматы
  const ultraWideInputs = ['logo', 'titleSmall', 'titleMedium', 'titleLarge', 'subtitleSmall', 'subtitleMedium', 'subtitleLarge', 'legalNormal', 'legalMedium', 'age'];
  ultraWideInputs.forEach(key => {
    const input = document.getElementById(`multiplier-ultraWide-${key}`);
    if (input) {
      input.addEventListener('input', (e) => {
        updateMultiplier('ultraWide', key, e.target.value);
      });
    }
  });
  
  // Очень широкие форматы
  const veryWideInputs = ['logo', 'titleMedium', 'titleLarge', 'titleExtraLarge', 'subtitleMedium', 'subtitleLarge', 'subtitleExtraLarge', 'legalNormal', 'legalMedium', 'legalExtraLarge', 'age'];
  veryWideInputs.forEach(key => {
    const input = document.getElementById(`multiplier-veryWide-${key}`);
    if (input) {
      input.addEventListener('input', (e) => {
        updateMultiplier('veryWide', key, e.target.value);
      });
    }
  });
  
  // Горизонтальные форматы
  const horizontalInputs = ['logo', 'titleSmall', 'titleLarge', 'titleWideSmall', 'titleWideMedium', 'subtitleSmall', 'subtitleLarge', 'subtitleWideSmall', 'subtitleWideMedium', 'legalSmall', 'legalLarge', 'legalWide450', 'legalWide500', 'legalWideOther', 'age'];
  horizontalInputs.forEach(key => {
    const input = document.getElementById(`multiplier-horizontal-${key}`);
    if (input) {
      input.addEventListener('input', (e) => {
        updateMultiplier('horizontal', key, e.target.value);
      });
    }
  });
  
  // Квадратные форматы
  const squareTitleInput = document.getElementById('multiplier-square-title');
  if (squareTitleInput) {
    squareTitleInput.addEventListener('input', (e) => {
      updateMultiplier('square', 'title', e.target.value);
    });
  }
  const squareSubtitleInput = document.getElementById('multiplier-square-subtitle');
  if (squareSubtitleInput) {
    squareSubtitleInput.addEventListener('input', (e) => {
      updateMultiplier('square', 'subtitle', e.target.value);
    });
  }
  
  // Высокие макеты
  const tallTitleInput = document.getElementById('multiplier-tall-title');
  if (tallTitleInput) {
    tallTitleInput.addEventListener('input', (e) => {
      updateMultiplier('tall', 'title', e.target.value);
    });
  }
  const tallSubtitleInput = document.getElementById('multiplier-tall-subtitle');
  if (tallSubtitleInput) {
    tallSubtitleInput.addEventListener('input', (e) => {
      updateMultiplier('tall', 'subtitle', e.target.value);
    });
  }
};

/**
 * Настраивает обработчики для управления фонами
 */
const setupBackgroundsHandlers = () => {
  // Функция для сохранения фонов в localStorage
  const saveBackgrounds = (backgrounds) => {
    localStorage.setItem('adminBackgrounds', JSON.stringify(backgrounds));
  };
  
  // Функция для получения фонов из localStorage
  const getBackgrounds = () => {
    return JSON.parse(localStorage.getItem('adminBackgrounds') || '[]');
  };
  
  // Функция для вычисления настроек цвета
  const getColorSettings = (color) => {
    // Вычисляем цвет текста на основе яркости фона
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Специальная проверка для цвета #FF6C26 - всегда белый текст и белый логотип
    let textColor = '#ffffff';
    let logoFolder = 'white';
    
    if (color === '#FF6C26') {
      textColor = '#ffffff';
      logoFolder = 'white';
    } else {
      textColor = luminance > 0.5 ? '#1e1e1e' : '#ffffff';
      logoFolder = luminance > 0.5 ? 'black' : 'white';
    }
    
    return {
      bgColor: color,
      bgImage: null,
      textColor: textColor,
      logoFolder: logoFolder
    };
  };
  
  // Функция для перерисовки списка фонов (делаем доступной глобально для обновления при открытии вкладки)
  window.refreshBackgroundsList = () => {
    const backgroundsList = adminModal.querySelector('#adminBackgroundsList');
    if (backgroundsList) {
      let savedBackgrounds = JSON.parse(localStorage.getItem('adminBackgrounds') || '[]');
      
      // Проверяем, есть ли все предустановленные цвета в сохраненных фонах
      const existingColors = savedBackgrounds.map(bg => bg.bgColor?.toUpperCase()).filter(Boolean);
      const missingPresetColors = PRESET_BACKGROUND_COLORS.filter(color => 
        !existingColors.includes(color.toUpperCase())
      );
      
      // Добавляем недостающие предустановленные цвета
      if (missingPresetColors.length > 0) {
        const newBackgrounds = missingPresetColors.map(color => getColorSettings(color));
        savedBackgrounds = [...savedBackgrounds, ...newBackgrounds];
        // Сохраняем обновленный список
        localStorage.setItem('adminBackgrounds', JSON.stringify(savedBackgrounds));
      }
      
      // Если вообще нет сохраненных фонов, создаем все из предустановленных цветов
      if (savedBackgrounds.length === 0) {
        savedBackgrounds = PRESET_BACKGROUND_COLORS.map(color => getColorSettings(color));
        localStorage.setItem('adminBackgrounds', JSON.stringify(savedBackgrounds));
      }
      const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#2a2a2a';
      const bgPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#0d0d0d';
      const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#e9e9e9';
      const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999999';
      
      backgroundsList.innerHTML = savedBackgrounds.map((bg, index) => `
        <div class="admin-background-item" data-bg-index="${index}" style="border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px; background: ${bgPrimary};">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 60px; height: 60px; border-radius: 8px; background: ${bg.bgColor || '#1e1e1e'}; border: 1px solid ${borderColor}; position: relative; overflow: hidden;">
                ${bg.bgImage ? `<img src="${bg.bgImage}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
              </div>
              <div>
                <div style="font-weight: 600; color: ${textPrimary}; margin-bottom: 4px;">Фон #${index + 1}</div>
                <div style="font-size: 12px; color: ${textSecondary};">
                  ${bg.bgImage ? 'Изображение' : `Цвет: ${bg.bgColor || '#1e1e1e'}`}
                </div>
              </div>
            </div>
            <button class="btn btn-danger" data-remove-bg="${index}" style="padding: 8px;">
              <span class="material-icons" style="font-size: 18px;">delete</span>
            </button>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
            <div class="form-group">
              <label style="font-weight: 500; margin-bottom: 8px; font-size: 13px; display: block;">Фон</label>
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <input type="color" class="admin-bg-color" data-bg-index="${index}" value="${bg.bgColor || '#1e1e1e'}" style="width: 60px; height: 40px; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer;">
                <input type="text" class="admin-bg-color-hex" data-bg-index="${index}" value="${bg.bgColor || '#1e1e1e'}" placeholder="#1e1e1e" style="flex: 1; padding: 8px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              </div>
              <button class="btn" data-upload-bg="${index}" style="width: 100%; margin-bottom: 8px;">
                <span class="material-icons" style="font-size: 18px; margin-right: 4px;">upload</span>
                Загрузить изображение
              </button>
              <input type="file" class="admin-bg-upload-file" data-bg-index="${index}" accept="image/*" style="display: none;">
              <button class="btn" data-select-bg="${index}" style="width: 100%; margin-bottom: 8px;">
                <span class="material-icons" style="font-size: 18px; margin-right: 4px;">image</span>
                Выбрать из библиотеки
              </button>
              ${bg.bgImage ? `<button class="btn btn-danger" data-clear-bg="${index}" style="width: 100%;">
                <span class="material-icons" style="font-size: 18px; margin-right: 4px;">delete</span>
                Удалить изображение
              </button>` : ''}
            </div>
            
            <div class="form-group">
              <label style="font-weight: 500; margin-bottom: 8px; font-size: 13px; display: block;">Цвет текста</label>
              <div style="display: flex; gap: 8px;">
                <input type="color" class="admin-text-color" data-bg-index="${index}" value="${bg.textColor || '#ffffff'}" style="width: 60px; height: 40px; border: 1px solid ${borderColor}; border-radius: 8px; cursor: pointer;">
                <input type="text" class="admin-text-color-hex" data-bg-index="${index}" value="${bg.textColor || '#ffffff'}" placeholder="#ffffff" style="flex: 1; padding: 8px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
              </div>
            </div>
            
            <div class="form-group">
              <label style="font-weight: 500; margin-bottom: 8px; font-size: 13px; display: block;">Логотип</label>
              <select class="admin-logo-folder" data-bg-index="${index}" style="width: 100%; padding: 8px; border: 1px solid ${borderColor}; border-radius: 8px; background: ${bgPrimary}; color: ${textPrimary}; font-family: inherit; font-size: 14px;">
                <option value="white" ${bg.logoFolder === 'white' ? 'selected' : ''}>Белый</option>
                <option value="black" ${bg.logoFolder === 'black' || !bg.logoFolder ? 'selected' : ''}>Черный</option>
              </select>
            </div>
          </div>
        </div>
      `).join('');
    }
  };
  
  // Добавление нового фона
  const addBackgroundBtn = adminModal.querySelector('#adminAddBackground');
  if (addBackgroundBtn) {
    addBackgroundBtn.addEventListener('click', () => {
      const backgrounds = getBackgrounds();
      backgrounds.push({
        bgColor: '#1e1e1e',
        bgImage: null,
        textColor: '#ffffff',
        logoFolder: 'white'
      });
      saveBackgrounds(backgrounds);
      window.refreshBackgroundsList();
    });
  }
  
  // Обработчик обновления списка фонов
  adminModal.addEventListener('adminBackgroundsUpdated', () => {
    window.refreshBackgroundsList();
  });
  
  // Используем делегирование событий для динамически создаваемых элементов
  const backgroundsList = adminModal.querySelector('#adminBackgroundsList');
  if (backgroundsList) {
    // Удаление фона
    backgroundsList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove-bg]');
      if (removeBtn) {
        const index = parseInt(removeBtn.dataset.removeBg);
        const backgrounds = getBackgrounds();
        backgrounds.splice(index, 1);
        saveBackgrounds(backgrounds);
        window.refreshBackgroundsList();
      }
    });
    
    // Загрузка изображения фона
    backgroundsList.addEventListener('click', (e) => {
      const uploadBtn = e.target.closest('[data-upload-bg]');
      if (uploadBtn) {
        const index = parseInt(uploadBtn.dataset.uploadBg);
        const fileInput = adminModal.querySelector(`.admin-bg-upload-file[data-bg-index="${index}"]`);
        if (fileInput) fileInput.click();
      }
      
      // Выбор из библиотеки
      const selectBtn = e.target.closest('[data-select-bg]');
      if (selectBtn) {
        const index = parseInt(selectBtn.dataset.selectBg);
        // Сохраняем индекс для использования в обработчике выбора
        window._adminBgSelectIndex = index;
        // Открываем модальное окно выбора фона
        openBGSelectModal().then(() => {
          // Обработчик будет установлен в backgroundSelector.js
        });
      }
    });
    
    // Удаление изображения фона
    backgroundsList.addEventListener('click', (e) => {
      const clearBtn = e.target.closest('[data-clear-bg]');
      if (clearBtn) {
        const index = parseInt(clearBtn.dataset.clearBg);
        const backgrounds = getBackgrounds();
        if (backgrounds[index]) {
          backgrounds[index].bgImage = null;
          saveBackgrounds(backgrounds);
          window.refreshBackgroundsList();
        }
      }
    });
    
    // Изменение цвета фона
    backgroundsList.addEventListener('input', (e) => {
      if (e.target.classList.contains('admin-bg-color')) {
        const index = parseInt(e.target.dataset.bgIndex);
        const backgrounds = getBackgrounds();
        if (backgrounds[index]) {
          backgrounds[index].bgColor = e.target.value;
          const hexInput = adminModal.querySelector(`.admin-bg-color-hex[data-bg-index="${index}"]`);
          if (hexInput) hexInput.value = e.target.value;
          saveBackgrounds(backgrounds);
          window.refreshBackgroundsList();
        }
      } else if (e.target.classList.contains('admin-bg-color-hex')) {
        const index = parseInt(e.target.dataset.bgIndex);
        const backgrounds = getBackgrounds();
        if (backgrounds[index] && /^#[0-9A-Fa-f]{6}$/i.test(e.target.value)) {
          backgrounds[index].bgColor = e.target.value.toUpperCase();
          const colorInput = adminModal.querySelector(`.admin-bg-color[data-bg-index="${index}"]`);
          if (colorInput) colorInput.value = e.target.value;
          saveBackgrounds(backgrounds);
          refreshBackgroundsList();
        }
      } else if (e.target.classList.contains('admin-text-color')) {
        const index = parseInt(e.target.dataset.bgIndex);
        const backgrounds = getBackgrounds();
        if (backgrounds[index]) {
          backgrounds[index].textColor = e.target.value;
          const hexInput = adminModal.querySelector(`.admin-text-color-hex[data-bg-index="${index}"]`);
          if (hexInput) hexInput.value = e.target.value;
          saveBackgrounds(backgrounds);
          refreshBackgroundsList();
        }
      } else if (e.target.classList.contains('admin-text-color-hex')) {
        const index = parseInt(e.target.dataset.bgIndex);
        const backgrounds = getBackgrounds();
        if (backgrounds[index] && /^#[0-9A-Fa-f]{6}$/i.test(e.target.value)) {
          backgrounds[index].textColor = e.target.value.toUpperCase();
          const colorInput = adminModal.querySelector(`.admin-text-color[data-bg-index="${index}"]`);
          if (colorInput) colorInput.value = e.target.value;
          saveBackgrounds(backgrounds);
          refreshBackgroundsList();
        }
      } else if (e.target.classList.contains('admin-logo-folder')) {
        const index = parseInt(e.target.dataset.bgIndex);
        const backgrounds = getBackgrounds();
        if (backgrounds[index]) {
          backgrounds[index].logoFolder = e.target.value;
          saveBackgrounds(backgrounds);
        }
      }
    });
    
    // Загрузка файла изображения
    backgroundsList.addEventListener('change', (e) => {
      if (e.target.classList.contains('admin-bg-upload-file')) {
        const index = parseInt(e.target.dataset.bgIndex);
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const backgrounds = getBackgrounds();
            if (backgrounds[index]) {
              backgrounds[index].bgImage = event.target.result;
              saveBackgrounds(backgrounds);
              window.refreshBackgroundsList();
            }
          };
          reader.readAsDataURL(file);
        }
      }
    });
    
    // Применение фона к текущему макету (двойной клик на элементе фона)
    backgroundsList.addEventListener('dblclick', async (e) => {
      const item = e.target.closest('.admin-background-item');
      if (item) {
        const index = parseInt(item.dataset.bgIndex);
        const backgrounds = getBackgrounds();
        const bg = backgrounds[index];
        if (bg) {
          // Применяем фон
          if (bg.bgImage) {
            // Если есть изображение, загружаем его
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
              const state = getState();
              const activePairIndex = state.activePairIndex || 0;
              const { updatePairBgImage } = await import('../../state/store.js');
              updatePairBgImage(activePairIndex, img);
              setState({ bgImage: img });
              await applyBackgroundSettings(bg);
            };
            img.src = bg.bgImage;
          } else {
            // Если только цвет, применяем цвет
            await applyPresetBgColor(bg.bgColor);
            await applyBackgroundSettings(bg);
          }
        }
      }
    });
  }
  
  // Функция для применения настроек текста и логотипа
  const applyBackgroundSettings = async (bg) => {
    // Устанавливаем цвет текста
    setKey('titleColor', bg.textColor || '#ffffff');
    
    // Выбираем логотип на основе папки
    const state = getState();
    const language = state.logoLanguage || 'ru';
    const logoType = 'main.svg'; // Можно сделать настраиваемым
    const logoPath = `logo/${bg.logoFolder || 'white'}/${language}/${logoType}`;
    setKey('logoSelected', logoPath);
    
    // Загружаем логотип через selectPreloadedLogo
    await selectPreloadedLogo(logoPath);
    
    renderer.render();
  };
};

/**
 * Настраивает обработчики для переключения вкладок
 */
const setupTabHandlers = () => {
  const tabs = adminModal.querySelectorAll('.sizes-admin-tab');
  const tabContents = adminModal.querySelectorAll('.sizes-admin-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      console.log('Переключение на вкладку:', targetTab);
      
      // Убираем active у всех вкладок
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => {
        content.style.display = 'none';
        console.log('Скрыта вкладка:', content.id);
      });
      
      // Активируем выбранную вкладку
      tab.classList.add('active');
      const targetContent = adminModal.querySelector(`#sizesAdminTab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
      if (targetContent) {
        targetContent.style.display = 'block';
        // Принудительно устанавливаем стили для отображения
        targetContent.style.visibility = 'visible';
        targetContent.style.opacity = '1';
        targetContent.style.height = 'auto';
        targetContent.style.minHeight = '100px';
        
        // Обновляем список фонов при открытии вкладки "Значения по умолчанию"
        if (targetTab === 'defaults' && typeof window.refreshBackgroundsList === 'function') {
          requestAnimationFrame(() => {
            window.refreshBackgroundsList();
          });
        }
        
        // Проверяем родительский контейнер
        const parent = targetContent.parentElement;
        if (parent) {
          const parentStyle = window.getComputedStyle(parent);
          console.log('Родительский контейнер:', parent.className || '(нет класса)', 'id:', parent.id || '(нет id)');
          console.log('Родитель display:', parentStyle.display);
          console.log('Родитель width:', parentStyle.width, 'height:', parentStyle.height);
          console.log('Родитель flex-direction:', parentStyle.flexDirection);
          console.log('Родитель размеры:', parent.offsetWidth, 'x', parent.offsetHeight);
        }
        
        // Используем requestAnimationFrame для гарантированного отображения
        requestAnimationFrame(() => {
          const computedStyle = window.getComputedStyle(targetContent);
          console.log('Показана вкладка:', targetContent.id);
          console.log('Размеры offset:', targetContent.offsetWidth, 'x', targetContent.offsetHeight);
          console.log('Размеры client:', targetContent.clientWidth, 'x', targetContent.clientHeight);
          console.log('Размеры scroll:', targetContent.scrollWidth, 'x', targetContent.scrollHeight);
          console.log('Computed display:', computedStyle.display);
          console.log('Computed visibility:', computedStyle.visibility);
          console.log('Computed width:', computedStyle.width);
          console.log('Computed height:', computedStyle.height);
          console.log('Computed min-height:', computedStyle.minHeight);
          console.log('Computed max-height:', computedStyle.maxHeight);
          console.log('Computed overflow:', computedStyle.overflow);
          
          // Проверяем первый дочерний элемент
          const firstChild = targetContent.firstElementChild;
          if (firstChild) {
            console.log('Первый дочерний элемент:', firstChild.tagName, 'размеры:', firstChild.offsetWidth, 'x', firstChild.offsetHeight);
            console.log('Computed display первого дочернего:', window.getComputedStyle(firstChild).display);
          } else {
            console.warn('Нет дочерних элементов!');
          }
          
          // Если размеры все еще 0, пытаемся принудительно установить
          if (targetContent.offsetWidth === 0 || targetContent.offsetHeight === 0) {
            console.warn('Размеры все еще 0, пытаемся исправить...');
            
            // Устанавливаем явные размеры
            targetContent.style.width = '100%';
            targetContent.style.minHeight = '400px';
            targetContent.style.display = 'block';
            targetContent.style.overflow = 'visible';
            targetContent.style.position = 'relative';
            
            // Если родитель flex, нужно установить flex-basis
            if (parent && window.getComputedStyle(parent).display === 'flex') {
              targetContent.style.flex = '1 1 auto';
              targetContent.style.flexBasis = 'auto';
              targetContent.style.flexGrow = '1';
              targetContent.style.flexShrink = '1';
            }
            
            // Принудительно устанавливаем размеры первому дочернему элементу
            if (firstChild) {
              firstChild.style.width = '100%';
              firstChild.style.minHeight = '200px';
            }
            
            // Проверяем еще раз после установки стилей
            requestAnimationFrame(() => {
              console.log('После исправления - размеры offset:', targetContent.offsetWidth, 'x', targetContent.offsetHeight);
              console.log('После исправления - размеры первого дочернего:', firstChild ? firstChild.offsetWidth + 'x' + firstChild.offsetHeight : 'нет');
            });
          }
        });
      } else {
        console.error('Вкладка не найдена:', `#sizesAdminTab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
      }
    });
  });
};

// Делаем функцию доступной глобально
if (typeof window !== 'undefined') {
  window.showSizesAdmin = showSizesAdmin;
}

