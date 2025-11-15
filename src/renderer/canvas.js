/**
 * Модуль для управления canvas и рендерингом
 * Содержит логику работы с preview canvas и индексами
 */

import { getCheckedSizes } from '../state/store.js';
import { LAYOUT_CONSTANTS } from './constants.js';

/**
 * Получает отсортированные размеры по высоте (от маленькой к большой)
 */
export const getSortedSizes = () => {
  const sizes = getCheckedSizes();
  return [...sizes].sort((a, b) => a.height - b.height);
};

/**
 * Категоризация размеров на узкие, широкие и квадратные
 */
export const categorizeSizes = (sizes) => {
  const narrow = []; // height >= width * VERTICAL_THRESHOLD (вертикальные)
  const wide = [];   // width >= height * HORIZONTAL_THRESHOLD (горизонтальные)
  const square = []; // остальные (примерно квадратные)
  
  sizes.forEach((size) => {
    if (size.height >= size.width * LAYOUT_CONSTANTS.VERTICAL_THRESHOLD) {
      narrow.push(size);
    } else if (size.width >= size.height * LAYOUT_CONSTANTS.HORIZONTAL_THRESHOLD) {
      wide.push(size);
    } else {
      square.push(size);
    }
  });
  
  return { narrow, wide, square };
};

/**
 * Класс для управления canvas состояниями
 */
class CanvasManager {
  constructor() {
    this.previewCanvas = null;
    this.previewCanvasNarrow = null;
    this.previewCanvasWide = null;
    this.previewCanvasSquare = null;
    this.currentPreviewIndex = 0;
    this.currentNarrowIndex = 0;
    this.currentWideIndex = 0;
    this.currentSquareIndex = 0;
    this.rafId = null;
    this.lastRenderMeta = null;
    this.renderToCanvasFn = null;
  }

  /**
   * Инициализация одного canvas (для обратной совместимости)
   */
  initialize(canvas) {
    this.previewCanvas = canvas;
  }

  /**
   * Инициализация множественных canvas по категориям
   */
  initializeMulti(canvasNarrow, canvasWide, canvasSquare) {
    this.previewCanvasNarrow = canvasNarrow;
    this.previewCanvasWide = canvasWide;
    this.previewCanvasSquare = canvasSquare;
  }

  /**
   * Устанавливает функцию рендеринга
   */
  setRenderFunction(renderFn) {
    this.renderToCanvasFn = renderFn;
  }

  /**
   * Выполняет рендеринг всех canvas
   */
  async doRender(getState, setKey) {
    try {
      const sizes = getSortedSizes();
      if (!sizes || !sizes.length) {
        console.warn('Нет выбранных размеров для рендеринга');
        return;
      }

      if (!this.renderToCanvasFn) {
        console.error('Функция рендеринга не установлена');
        return;
      }

      if (typeof getState !== 'function') {
        console.error('getState не является функцией');
        return;
      }

      const state = getState();
      if (!state) {
        console.error('Состояние не получено');
        return;
      }

      const categorized = categorizeSizes(sizes);
    
    // Отладочная информация
    if (categorized.narrow.length === 0 && categorized.wide.length === 0 && categorized.square.length === 0) {
      console.warn('Все категории размеров пустые, но есть размеры:', sizes);
    }

    // Функция для получения размера с fallback - всегда возвращает валидный размер
    const getSizeForCategory = (categorySizes, index) => {
      if (categorySizes.length > 0) {
        // Используем сохраненный индекс, если он валиден
        const validIndex = (index !== undefined && index >= 0 && index < categorySizes.length) 
          ? index 
          : 0;
        return categorySizes[validIndex];
      }
      // Если в категории нет размеров, используем первый доступный размер из любых других категорий
      if (categorized.narrow.length > 0) return categorized.narrow[0];
      if (categorized.square.length > 0) return categorized.square[0];
      if (categorized.wide.length > 0) return categorized.wide[0];
      // В крайнем случае используем первый размер из всех
      return sizes[0];
    };

    // Рендерим узкий формат
    if (this.previewCanvasNarrow) {
      const narrowSize = getSizeForCategory(categorized.narrow, this.currentNarrowIndex);
      if (narrowSize) {
        try {
          this.renderToCanvasFn(this.previewCanvasNarrow, narrowSize.width, narrowSize.height, state);
          // Проверяем, что canvas действительно отрендерился
          if (this.previewCanvasNarrow.width === 0 || this.previewCanvasNarrow.height === 0) {
            console.warn('Canvas узкого формата имеет нулевой размер после рендеринга');
          } else {
            // Проверяем видимые размеры canvas (только первый раз)
            if (!this._narrowLogged) {
              const rect = this.previewCanvasNarrow.getBoundingClientRect();
              const style = window.getComputedStyle(this.previewCanvasNarrow);
              console.log('Canvas узкого формата:', {
                internal: { width: this.previewCanvasNarrow.width, height: this.previewCanvasNarrow.height },
                visible: { width: rect.width, height: rect.height },
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                position: { x: rect.x, y: rect.y }
              });
              this._narrowLogged = true;
            }
          }
        } catch (error) {
          console.error('Ошибка рендеринга узкого формата:', error);
        }
      } else {
        console.warn('Не найден размер для узкого формата');
      }
    } else {
      console.warn('Canvas узкого формата не инициализирован');
    }

    // Рендерим широкий формат
    if (this.previewCanvasWide) {
      const wideSize = getSizeForCategory(categorized.wide, this.currentWideIndex);
      if (wideSize) {
        try {
          this.lastRenderMeta = this.renderToCanvasFn(this.previewCanvasWide, wideSize.width, wideSize.height, state);
          // Используем размер широкого формата для kvCanvas (для совместимости)
          setKey('kvCanvasWidth', wideSize.width);
          setKey('kvCanvasHeight', wideSize.height);
          // Проверяем, что canvas действительно отрендерился
          if (this.previewCanvasWide.width === 0 || this.previewCanvasWide.height === 0) {
            console.warn('Canvas широкого формата имеет нулевой размер после рендеринга');
          }
        } catch (error) {
          console.error('Ошибка рендеринга широкого формата:', error);
        }
      } else {
        console.warn('Не найден размер для широкого формата');
      }
    } else {
      console.warn('Canvas широкого формата не инициализирован');
    }

    // Рендерим квадратный формат
    if (this.previewCanvasSquare) {
      const squareSize = getSizeForCategory(categorized.square, this.currentSquareIndex);
      if (squareSize) {
        try {
          this.renderToCanvasFn(this.previewCanvasSquare, squareSize.width, squareSize.height, state);
          // Проверяем, что canvas действительно отрендерился
          if (this.previewCanvasSquare.width === 0 || this.previewCanvasSquare.height === 0) {
            console.warn('Canvas квадратного формата имеет нулевой размер после рендеринга');
          }
        } catch (error) {
          console.error('Ошибка рендеринга квадратного формата:', error);
        }
      } else {
        console.warn('Не найден размер для квадратного формата');
      }
    } else {
        console.warn('Canvas квадратного формата не инициализирован');
    }

    // Обратная совместимость со старым canvas
    if (this.previewCanvas) {
      if (this.currentPreviewIndex >= sizes.length) {
        this.currentPreviewIndex = 0;
      }
      const size = sizes[this.currentPreviewIndex];
      if (size) {
        try {
          this.lastRenderMeta = this.renderToCanvasFn(this.previewCanvas, size.width, size.height, state);
          if (typeof setKey === 'function') {
            setKey('kvCanvasWidth', size.width);
            setKey('kvCanvasHeight', size.height);
          }
        } catch (error) {
          console.error('Ошибка рендеринга старого canvas:', error);
          console.error('Стек ошибки:', error.stack);
        }
      }
    }
    } catch (error) {
      console.error('Критическая ошибка в doRender:', error);
      console.error('Стек ошибки:', error.stack);
      // Не пробрасываем ошибку дальше, чтобы не сломать приложение
    }
  }

  /**
   * Запланировать рендеринг через requestAnimationFrame
   */
  render(getState, setKey) {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      this.doRender(getState, setKey);
    });
  }

  /**
   * Выполнить рендеринг синхронно
   */
  renderSync(getState, setKey) {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.doRender(getState, setKey);
  }

  /**
   * Получить текущий индекс
   */
  getCurrentIndex() {
    return this.currentPreviewIndex;
  }

  /**
   * Установить текущий индекс
   */
  setCurrentIndex(index, getState, setKey) {
    this.currentPreviewIndex = Number(index) || 0;
    this.render(getState, setKey);
  }

  /**
   * Установить индекс для категории
   */
  setCategoryIndex(category, index, shouldRender, getState, setKey) {
    const idx = Number(index) || 0;
    if (category === 'narrow') {
      this.currentNarrowIndex = idx;
    } else if (category === 'wide') {
      this.currentWideIndex = idx;
    } else if (category === 'square') {
      this.currentSquareIndex = idx;
    }
    if (shouldRender) {
      this.render(getState, setKey);
    }
  }

  /**
   * Получить категоризированные размеры
   */
  getCategorizedSizes() {
    const sizes = getSortedSizes();
    return categorizeSizes(sizes);
  }

  /**
   * Получить текущие индексы для категорий
   */
  getCategoryIndices() {
    return {
      narrow: this.currentNarrowIndex,
      wide: this.currentWideIndex,
      square: this.currentSquareIndex
    };
  }

  /**
   * Получить метаданные последнего рендера
   */
  getRenderMeta() {
    return this.lastRenderMeta;
  }
}

// Создаем единственный экземпляр
export const canvasManager = new CanvasManager();
