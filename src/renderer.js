import { getState, getCheckedSizes, setKey, setState } from './state/store.js';
import { FONT_NAME_TO_WEIGHT } from './constants.js';

// Функция для конвертации названия начертания в вес
const getFontWeight = (weightName) => {
  if (typeof weightName === 'number') {
    return weightName; // Для обратной совместимости
  }
  return FONT_NAME_TO_WEIGHT[weightName] || '400';
};

const TITLE_SUBTITLE_RATIO = 1 / 2;
const LEGAL_DESCENT_FACTOR = 0.2;

let previewCanvas = null;
let previewCanvasNarrow = null;
let previewCanvasWide = null;
let previewCanvasSquare = null;
let currentPreviewIndex = 0;
let currentNarrowIndex = 0;
let currentWideIndex = 0;
let currentSquareIndex = 0;
let rafId = null;
let lastRenderMeta = null;

// Получаем отсортированные размеры по высоте (от маленькой к большой)
const getSortedSizes = () => {
  const sizes = getCheckedSizes();
  return [...sizes].sort((a, b) => a.height - b.height);
};

// Категоризация размеров
const categorizeSizes = (sizes) => {
  const narrow = []; // height > width * 1.5 (вертикальные)
  const wide = [];   // width >= height * 3 (горизонтальные)
  const square = []; // остальные (примерно квадратные)
  
  sizes.forEach((size) => {
    if (size.height > size.width * 1.5) {
      narrow.push(size);
    } else if (size.width >= size.height * 3) {
      wide.push(size);
    } else {
      square.push(size);
    }
  });
  
  return { narrow, wide, square };
};

const textMeasurementCache = new Map();

const cacheKey = (ctx, text) => {
  const font = ctx.font;
  return `${font}__${text}`;
};

const measureLineWidth = (ctx, text) => {
  if (!text) return 0;
  const key = cacheKey(ctx, text);
  if (textMeasurementCache.has(key)) {
    return textMeasurementCache.get(key);
  }
  const width = ctx.measureText(text).width;
  textMeasurementCache.set(key, width);
  return width;
};

const drawTextWithSpacing = (ctx, text, x, y, letterSpacing, align) => {
  ctx.textAlign = align;

  if (!letterSpacing) {
    ctx.fillText(text, x, y);
    return;
  }

  const characters = Array.from(text);
  const widths = characters.map((char) => measureLineWidth(ctx, char));
  const totalWidth = widths.reduce((acc, width) => acc + width, 0) + letterSpacing * (characters.length - 1);

  let startX = x;
  if (align === 'center') {
    startX = x - totalWidth / 2;
  } else if (align === 'right') {
    startX = x - totalWidth;
  }

  let currentX = startX;
  characters.forEach((char, index) => {
    ctx.fillText(char, currentX, y);
    currentX += widths[index] + letterSpacing;
  });
};

// Предлоги и союзы, которые не должны оставаться в конце строки
const HANGING_PREPOSITIONS = new Set([
  'в', 'во', 'на', 'над', 'под', 'с', 'со', 'к', 'ко', 'от', 'о', 'об', 'обо',
  'из', 'изо', 'до', 'по', 'про', 'для', 'при', 'без', 'безо', 'через', 'сквозь',
  'между', 'среди', 'перед', 'передо', 'за', 'у', 'около', 'возле', 'вдоль',
  'поперёк', 'против', 'ради', 'благодаря', 'согласно', 'вопреки', 'навстречу',
  'наперекор', 'подобно', 'соответственно', 'относительно', 'касательно',
  'и', 'а', 'но', 'или', 'либо', 'что', 'как', 'когда', 'если', 'хотя', 'чтобы'
]);

// Проверяет, является ли слово висячим предлогом/союзом
const isHangingPreposition = (word) => {
  // Убираем знаки препинания для проверки
  const cleanWord = word.replace(/[.,!?;:—–\-()«»""'']/g, '').toLowerCase();
  return HANGING_PREPOSITIONS.has(cleanWord);
};

const wrapText = (ctx, text, maxWidth, fontSize, fontWeight, lineHeight) => {
  if (!text) return [];

  const lines = [];
  const paragraphs = text.split(/\n+/);

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.split(/\s+/);
    let currentLine = '';

    words.forEach((word, wordIndex) => {
      if (!word) return;
      
      // handle words longer than max width
      if (!currentLine) {
        // Сначала пробуем разбить по дефису, если слово содержит дефис
        if (word.includes('-') && word.length > 1) {
          const parts = word.split('-');
          // Пробуем найти место разрыва
          for (let i = parts.length - 1; i > 0; i--) {
            const firstPart = parts.slice(0, i).join('-') + '-';
            const firstPartWidth = measureLineWidth(ctx, firstPart);
            
            if (firstPartWidth <= maxWidth) {
              // Первая часть помещается, переносим остальное на новую строку
              lines.push(firstPart);
              currentLine = parts.slice(i).join('-');
              return;
            }
          }
        }
        
        // Если не удалось разбить по дефису, разбиваем по символам
        const chars = Array.from(word);
        let chunk = '';
        chars.forEach((char) => {
          const possible = chunk + char;
          if (measureLineWidth(ctx, possible) <= maxWidth || !chunk) {
            chunk = possible;
          } else {
            if (chunk) lines.push(chunk);
            chunk = char;
          }
        });
        if (chunk) {
          currentLine = chunk;
        }
        return;
      }

      const tentativeLine = `${currentLine} ${word}`;
      const tentativeWidth = measureLineWidth(ctx, tentativeLine);

      if (tentativeWidth <= maxWidth) {
        currentLine = tentativeLine;
        return;
      }

      // Слово не помещается на текущей строке
      // Проверяем, можно ли разбить слово по дефису
      if (word.includes('-') && word.length > 1) {
        const parts = word.split('-');
        // Пробуем найти место разрыва, где можно перенести
        for (let i = parts.length - 1; i > 0; i--) {
          const firstPart = parts.slice(0, i).join('-') + '-';
          const secondPart = '-' + parts.slice(i).join('-');
          
          const lineWithFirstPart = currentLine ? `${currentLine} ${firstPart}` : firstPart;
          const firstPartWidth = measureLineWidth(ctx, lineWithFirstPart);
          
          if (firstPartWidth <= maxWidth) {
            // Первая часть помещается, переносим остальное на новую строку
            lines.push(lineWithFirstPart.trim());
            currentLine = parts.slice(i).join('-');
            return;
          }
        }
      }

      // Проверяем, не остался ли висячий предлог в конце текущей строки
      const lineWords = currentLine.trim().split(/\s+/);
      const lastWord = lineWords[lineWords.length - 1];
      
      if (isHangingPreposition(lastWord) && lineWords.length > 1) {
        // Если последнее слово - предлог, переносим его на следующую строку вместе со следующим словом
        // Убираем предлог из текущей строки
        lineWords.pop();
        const lineWithoutPreposition = lineWords.join(' ');
        
        // Формируем новую строку с предлогом и следующим словом
        const newLineWithPreposition = `${lastWord} ${word}`;
        const newLineWidth = measureLineWidth(ctx, newLineWithPreposition);
        
        // Если новая строка с предлогом помещается, используем её
        if (newLineWidth <= maxWidth || lineWords.length === 0) {
          if (lineWithoutPreposition) {
            lines.push(lineWithoutPreposition);
          }
          currentLine = newLineWithPreposition;
        } else {
          // Если не помещается даже предлог со словом, проверяем дефис
          if (word.includes('-') && word.length > 1) {
            const parts = word.split('-');
            for (let i = parts.length - 1; i > 0; i--) {
              const firstPart = parts.slice(0, i).join('-') + '-';
              const lineWithPrepositionAndFirst = `${lastWord} ${firstPart}`;
              const width = measureLineWidth(ctx, lineWithPrepositionAndFirst);
              if (width <= maxWidth) {
                if (lineWithoutPreposition) {
                  lines.push(lineWithoutPreposition);
                }
                lines.push(lineWithPrepositionAndFirst.trim());
                currentLine = parts.slice(i).join('-');
                return;
              }
            }
          }
          // Если не помещается даже предлог со словом, оставляем как есть
          lines.push(currentLine);
          currentLine = word;
        }
      } else {
        // Обычный перенос
        lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) {
      // Финальная проверка на висячий предлог в последней строке
      const lastWord = currentLine.trim().split(/\s+/).pop();
      if (isHangingPreposition(lastWord) && lines.length > 0) {
        // Переносим предлог на предыдущую строку, если это возможно
        const prevLine = lines[lines.length - 1];
        const newPrevLine = `${prevLine} ${lastWord}`;
        const newPrevWidth = measureLineWidth(ctx, newPrevLine);
        if (newPrevWidth <= maxWidth) {
          lines[lines.length - 1] = newPrevLine;
          const remainingWords = currentLine.trim().split(/\s+/);
          remainingWords.pop();
          if (remainingWords.length > 0) {
            lines.push(remainingWords.join(' '));
          }
        } else {
          lines.push(currentLine);
        }
      } else {
        lines.push(currentLine);
      }
    }

    if (paragraphIndex < paragraphs.length - 1) {
      lines.push('');
    }
  });

  return lines;
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 255, b: 255 };
};

const getAlignedX = (align, canvasWidth, paddingPx) => {
  if (align === 'left') return paddingPx;
  if (align === 'center') return canvasWidth / 2;
  if (align === 'right') return canvasWidth - paddingPx;
  return paddingPx;
};

const getAlignedXWithinArea = (align, area) => {
  if (align === 'center') return (area.left + area.right) / 2;
  if (align === 'right') return area.right;
  return area.left;
};

const rectanglesOverlap = (r1, r2, margin = 10) => {
  return !(
    r1.x + r1.width + margin < r2.x ||
    r2.x + r2.width + margin < r1.x ||
    r1.y + r1.height + margin < r2.y ||
    r2.y + r2.height + margin < r1.y
  );
};

const mergeBounds = (...bounds) =>
  bounds
    .filter(Boolean)
    .reduce((acc, bound) => {
      if (!acc) return { ...bound };
      const minX = Math.min(acc.x, bound.x);
      const minY = Math.min(acc.y, bound.y);
      const maxX = Math.max(acc.x + acc.width, bound.x + bound.width);
      const maxY = Math.max(acc.y + acc.height, bound.y + bound.height);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }, null);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getTextBlockBounds = (ctx, lines, baselineX, baselineY, fontSize, lineHeight, align, maxWidth) => {
  if (!lines.length) return null;

  let maxLineWidth = 0;
  lines.forEach((line) => {
    const width = measureLineWidth(ctx, line || ' ');
    if (width > maxLineWidth) {
      maxLineWidth = width;
    }
  });

  let leftX = baselineX;
  if (align === 'center') {
    leftX = baselineX - maxLineWidth / 2;
  } else if (align === 'right') {
    leftX = baselineX - maxLineWidth;
  }

  const topY = baselineY - fontSize;
  const height = fontSize + (lines.length - 1) * fontSize * lineHeight;

  return {
    x: leftX,
    y: topY,
    width: Math.min(maxWidth, maxLineWidth),
    height
  };
};

const renderToCanvas = (canvas, width, height, state) => {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const paddingPx = (state.paddingPercent / 100) * Math.min(width, height);
  const minDimension = Math.min(width, height);
  const aspectRatio = width / height;
  const layoutMode = state.layoutMode || 'auto';
  const horizontalThreshold = 1.35;
  const isHorizontalLayout = layoutMode === 'horizontal' || (layoutMode === 'auto' && aspectRatio >= horizontalThreshold);
  const isUltraWide = width >= height * 8;
  // Супер широкие форматы (например, 728x90) - очень маленькая высота
  const isSuperWide = isUltraWide && height < 120;
  
  // Увеличиваем отступы для супер широких форматов
  const effectivePaddingPx = isSuperWide ? paddingPx * 2 : paddingPx;

  let logoSizePercent = state.logoSize;
  let titleSizeMultiplier = 1;
  let legalMultiplier = 1;
  let ageMultiplier = 1;

  if (height >= width * 1.5) {
    logoSizePercent *= 2;
  } else if (isUltraWide) {
    // Ultra-wide layouts: make title and legal larger
    // Учитываем высоту макета - для больших размеров делаем меньше, чтобы подзаголовок не залезал на legal
    logoSizePercent *= 0.75;
    if (height < 120) {
      // Супер широкие форматы (728x90 и т.д.) - можно больше
      titleSizeMultiplier = 3;
    } else if (height < 200) {
      // Средние широкие форматы - умеренно
      titleSizeMultiplier = 2.2;
    } else {
      // Большие широкие форматы - меньше, чтобы подзаголовок помещался
      titleSizeMultiplier = 2;
    }
    // Для форматов типа 1320x300 делаем legal чуть меньше
    if (height >= 250 && height <= 350) {
      legalMultiplier = 2;
    } else {
      legalMultiplier = 2.5;
    }
    ageMultiplier = 2;
  } else if (width >= height * 4) {
    // Очень широкие форматы (>= 4:1)
    logoSizePercent *= 0.75;
    if (height < 200) {
      titleSizeMultiplier = 2.2;
    } else {
      titleSizeMultiplier = 2;
    }
    // Для форматов типа 1320x300 делаем legal чуть меньше
    if (height >= 250 && height <= 350) {
      legalMultiplier = 2;
    } else {
      legalMultiplier = 2.5;
    }
    ageMultiplier = 2;
  } else if (width >= height * 3) {
    // Средние широкие форматы (3:1 - 4:1)
    logoSizePercent *= 0.75;
    if (height < 200) {
      titleSizeMultiplier = 1.8;
    } else {
      titleSizeMultiplier = 1.6;
    }
    // Для форматов типа 1320x300 делаем legal чуть меньше
    if (height >= 250 && height <= 350) {
      legalMultiplier = 1.8;
    } else {
      legalMultiplier = 2;
    }
    ageMultiplier = 2;
  }

  let leftSectionWidth;
  let rightSectionWidth;
  let maxTextWidth;
  let textArea = {
    left: paddingPx,
    right: width - paddingPx
  };
  if (isUltraWide) {
    leftSectionWidth = width;
    rightSectionWidth = 0;
    maxTextWidth = width - paddingPx * 2;
  } else if (isHorizontalLayout) {
    leftSectionWidth = width * 0.55;
    rightSectionWidth = width - leftSectionWidth - paddingPx;
    maxTextWidth = leftSectionWidth - paddingPx * 2;
    textArea.right = textArea.left + maxTextWidth;
  } else {
    maxTextWidth = width - paddingPx * 2;
    leftSectionWidth = width;
    rightSectionWidth = 0;
  }

  // Рисуем фон (цвет или изображение)
  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, width, height);
  
  if (state.bgImage) {
    const img = state.bgImage;
    const imgWidth = img.width;
    const imgHeight = img.height;
    const imgAspect = imgWidth / imgHeight;
    const canvasAspect = width / height;
    
    let drawWidth = width;
    let drawHeight = height;
    let drawX = 0;
    let drawY = 0;
    
    const bgSize = state.bgSize || 'cover';
    const bgPosition = state.bgPosition || 'center';
    
    if (bgSize === 'cover') {
      if (imgAspect > canvasAspect) {
        // Изображение шире - подгоняем по высоте
        drawHeight = height;
        drawWidth = height * imgAspect;
      } else {
        // Изображение выше - подгоняем по ширине
        drawWidth = width;
        drawHeight = width / imgAspect;
      }
    } else if (bgSize === 'contain') {
      if (imgAspect > canvasAspect) {
        // Изображение шире - подгоняем по ширине
        drawWidth = width;
        drawHeight = width / imgAspect;
      } else {
        // Изображение выше - подгоняем по высоте
        drawHeight = height;
        drawWidth = height * imgAspect;
      }
    } else if (bgSize === 'repeat') {
      // Для repeat просто заполняем всё пространство
      drawWidth = width;
      drawHeight = height;
    }
    
    // Позиционирование
    if (bgSize !== 'repeat') {
      if (bgPosition === 'center' || bgPosition === '') {
        drawX = (width - drawWidth) / 2;
        drawY = (height - drawHeight) / 2;
      } else if (bgPosition === 'top') {
        drawX = (width - drawWidth) / 2;
        drawY = 0;
      } else if (bgPosition === 'bottom') {
        drawX = (width - drawWidth) / 2;
        drawY = height - drawHeight;
      } else if (bgPosition === 'left') {
        drawX = 0;
        drawY = (height - drawHeight) / 2;
      } else if (bgPosition === 'right') {
        drawX = width - drawWidth;
        drawY = (height - drawHeight) / 2;
      }
    }
    
    if (bgSize === 'repeat') {
      // Повторяем изображение по всему canvas
      const pattern = ctx.createPattern(img, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Рисуем изображение один раз с учетом размера и позиции
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }
  }

  let legalLines = [];
  let legalSize = 0;
  let ageSizePx = 0;
  let ageTextWidth = 0;
  let legalTextBounds = null;
  let ageBoundsRect = null;
  if (state.showAge && state.age) {
    ageSizePx = (state.ageSize / 100) * minDimension * ageMultiplier;
    const ageWeight = getFontWeight(state.ageWeight || state.legalWeight);
    ctx.font = `${ageWeight} ${ageSizePx}px ${state.ageFontFamily || state.fontFamily}`;
    ageTextWidth = measureLineWidth(ctx, state.age || '');
  }

  // Calculate preliminary legalBlockHeight for positioning title/subtitle
  // This will be refined after positioning legal and age
  let preliminaryLegalBlockHeight = 0;
  
  // First, calculate age position to know how much space to reserve
  const ageGapPx = width * (state.ageGapPercent / 100);
  let ageReservedWidth = 0;
  if (state.showAge && state.age && ageTextWidth > 0) {
    ageReservedWidth = ageTextWidth + ageGapPx;
    preliminaryLegalBlockHeight = Math.max(preliminaryLegalBlockHeight, ageSizePx * 1.5);
  }
  
  if (state.showLegal && state.legal) {
    legalSize = (state.legalSize / 100) * minDimension * legalMultiplier;
    const legalWeight = getFontWeight(state.legalWeight);
    ctx.font = `${legalWeight} ${legalSize}px ${state.legalFontFamily || state.fontFamily}`;
    // Legal всегда занимает всю ширину макета (минус отступы и место для age)
    const availableWidth = width - paddingPx * 2;
    const legalMaxWidth = Math.max(50, availableWidth - ageReservedWidth);
    legalLines = wrapText(ctx, state.legal, legalMaxWidth, legalSize, legalWeight, state.legalLineHeight);
    preliminaryLegalBlockHeight = Math.max(preliminaryLegalBlockHeight, legalLines.length * legalSize * state.legalLineHeight);
  }
  
  // Use preliminary value for now
  let legalBlockHeight = preliminaryLegalBlockHeight;

  let legalContentBounds = null;
  let legalBounds = null;

  let logoBounds = null;
  let logoHeight = 0;
  if (state.logo) {
    let logoWidth = (width * logoSizePercent) / 100;
    let logoScale = logoWidth / state.logo.width;
    logoHeight = state.logo.height * logoScale;

    if (isUltraWide) {
      const availableHeight = Math.max(0, height - paddingPx * 2);
      logoHeight = Math.min(availableHeight * 0.3, state.logo.height * logoScale);
      logoScale = logoHeight / state.logo.height;
      logoWidth = state.logo.width * logoScale;
      logoBounds = {
        x: paddingPx,
        y: paddingPx + (availableHeight - logoHeight) / 2,
        width: logoWidth,
        height: logoHeight
      };
    } else if (isHorizontalLayout) {
      logoBounds = { x: paddingPx, y: paddingPx, width: logoWidth, height: logoHeight };
    } else {
      let logoX;
      let logoY;
      // If text is centered, logo should also be centered
      const effectiveLogoPos = (state.titleAlign === 'center') ? 'center' : state.logoPos;
      
      if (state.titleVPos === 'top') {
        if (effectiveLogoPos === 'left') {
          logoX = paddingPx;
          logoY = paddingPx;
        } else if (effectiveLogoPos === 'center') {
          logoX = (width - logoWidth) / 2;
          logoY = paddingPx;
        } else {
          logoX = paddingPx;
          logoY = paddingPx;
        }
      } else if (state.titleVPos === 'center') {
        if (effectiveLogoPos === 'center') {
          logoX = (width - logoWidth) / 2;
          logoY = paddingPx;
        } else if (effectiveLogoPos === 'left') {
          logoX = paddingPx;
          logoY = paddingPx;
        } else {
          logoX = (width - logoWidth) / 2;
          logoY = paddingPx;
        }
      } else {
        if (effectiveLogoPos === 'left') {
          logoX = paddingPx;
          logoY = paddingPx;
        } else if (effectiveLogoPos === 'center') {
          logoX = (width - logoWidth) / 2;
          logoY = paddingPx;
        } else {
          logoX = paddingPx;
          logoY = paddingPx;
        }
      }
      logoBounds = { x: logoX, y: logoY, width: logoWidth, height: logoHeight };
    }
  }

  let kvPlannedMeta = null;

  if (isSuperWide && state.showKV && state.kv) {
    // Для супер широких форматов: KV после логотипа, все свободное место для заголовка
    const availableHeight = Math.max(0, height - effectivePaddingPx * 2);
    const logoRight = logoBounds ? logoBounds.x + logoBounds.width : effectivePaddingPx;
    const gap = Math.max(effectivePaddingPx * 0.5, width * 0.01);
    const minKvSize = 30; // Минимальный размер для KV (уменьшен для более мягкой проверки)
    
    // Используем максимально возможную высоту для KV
    let kvScale = availableHeight > 0 ? availableHeight / state.kv.height : 0;
    let kvW = state.kv.width * kvScale;
    let kvH = state.kv.height * kvScale;
    const maxKvWidth = Math.max(minKvSize, width * 0.25);
    if (kvW > maxKvWidth) {
      kvScale = maxKvWidth / state.kv.width;
      kvW = maxKvWidth;
      kvH = state.kv.height * kvScale;
    }
    
    // Проверяем, что KV достаточно большой для отображения
    // Используем более мягкую проверку: хотя бы одна сторона должна быть >= minKvSize
    if ((kvW >= minKvSize || kvH >= minKvSize) && kvScale > 0) {
    const kvX = logoRight + gap;
    const kvY = effectivePaddingPx + (availableHeight - kvH) / 2;
    kvPlannedMeta = { kvX, kvY, kvW, kvH, kvScale, paddingPx: effectivePaddingPx };

    // Текст занимает все оставшееся место после KV
    const textStart = kvX + kvW + gap;
    textArea.left = textStart;
    textArea.right = width - effectivePaddingPx;
    } else {
      // Если места недостаточно, не размещаем KV
      textArea.left = logoRight + gap;
      textArea.right = width - effectivePaddingPx;
    }
  } else if (isUltraWide && state.showKV && state.kv) {
    const availableHeight = Math.max(0, height - paddingPx * 2);
    const minKvSize = 30; // Минимальный размер для KV (уменьшен для более мягкой проверки)
    // Используем максимально возможную высоту для KV
    let kvScale = availableHeight > 0 ? availableHeight / state.kv.height : 0;
    let kvW = state.kv.width * kvScale;
    let kvH = state.kv.height * kvScale;
    const maxKvWidth = Math.max(minKvSize, width * 0.25);
    if (kvW > maxKvWidth) {
      kvScale = maxKvWidth / state.kv.width;
      kvW = maxKvWidth;
      kvH = state.kv.height * kvScale;
    }
    
    // Проверяем, что KV достаточно большой для отображения
    // Используем более мягкую проверку: хотя бы одна сторона должна быть >= minKvSize
    if ((kvW >= minKvSize || kvH >= minKvSize) && kvScale > 0) {
    const kvX = width / 2 - kvW / 2;
    const kvY = paddingPx + (availableHeight - kvH) / 2;
    kvPlannedMeta = { kvX, kvY, kvW, kvH, kvScale, paddingPx };

    const textStart = kvX + kvW + Math.max(paddingPx, width * 0.02);
    textArea.left = Math.min(width - paddingPx - 200, Math.max(textStart, paddingPx));
    textArea.right = width - paddingPx;
    if (textArea.right - textArea.left < 200) {
      textArea.left = Math.max(paddingPx, textArea.right - 200);
      }
    } else {
      // Если места недостаточно, не размещаем KV
      const logoRight = logoBounds ? logoBounds.x + logoBounds.width : paddingPx;
      textArea.left = logoRight + paddingPx;
      textArea.right = width - paddingPx;
    }
  } else if (isSuperWide) {
    // Для супер широких форматов без KV: текст начинается после логотипа
    const logoRight = logoBounds ? logoBounds.x + logoBounds.width : effectivePaddingPx;
    textArea.left = logoRight + Math.max(effectivePaddingPx * 0.5, width * 0.01);
    textArea.right = width - effectivePaddingPx;
  } else if (isUltraWide) {
    const logoRight = logoBounds ? logoBounds.x + logoBounds.width : paddingPx;
    textArea.left = logoRight + paddingPx;
    textArea.right = width - paddingPx;
  } else if (isHorizontalLayout && state.showKV && state.kv) {
    const minTextRatio = width >= height * 3 ? 0.68 : 0.5;
    const widthAfterPadding = Math.max(0, width - paddingPx * 2);
    const minTextWidth = Math.max(widthAfterPadding * minTextRatio, 200);
    const gap = Math.max(paddingPx, width * 0.02);
    const availableHeight = Math.max(0, height - paddingPx * 2);
    const minKvSize = 30; // Минимальный размер для KV (уменьшен для более мягкой проверки)

    let kvMeta = null;
    let textWidth = widthAfterPadding;

    const maxKvWidth = Math.max(0, widthAfterPadding - minTextWidth - gap);
    if (maxKvWidth >= minKvSize) {
      const scaleByHeight = availableHeight > 0 ? availableHeight / state.kv.height : 0;
      let kvW = state.kv.width * scaleByHeight;
      let kvH = availableHeight;
      if (kvW > maxKvWidth) {
        const scaleByWidth = maxKvWidth / state.kv.width;
        kvW = maxKvWidth;
        kvH = state.kv.height * scaleByWidth;
      }

      // Проверяем минимальный размер KV
      // Используем более мягкую проверку: хотя бы одна сторона должна быть >= minKvSize
      if (kvW >= minKvSize || kvH >= minKvSize) {
        const kvScale = kvW / state.kv.width;
        const kvX = width - paddingPx - kvW;
        const kvY = paddingPx + Math.max(0, (availableHeight - kvH) / 2);
        kvMeta = { kvX, kvY, kvW, kvH, kvScale, paddingPx };
        textWidth = Math.max(minTextWidth, widthAfterPadding - kvW - gap);
      }
    }

    textWidth = Math.max(minTextWidth, Math.min(textWidth, widthAfterPadding));
    textArea.left = paddingPx;
    textArea.right = paddingPx + textWidth;

    if (kvMeta) {
      kvPlannedMeta = kvMeta;
    }
  }

  if (textArea.right <= textArea.left) {
    textArea.right = width - effectivePaddingPx;
    textArea.left = effectivePaddingPx;
  }
  maxTextWidth = Math.max(50, textArea.right - textArea.left);

  // Common baseline for legal and age - both should be on the same line at the bottom
  // Age is always at the bottom right, legal text takes remaining space on the left
  const commonBaselineY = height - effectivePaddingPx;
  
  // Check if KV will be positioned on the right in horizontal layout (to avoid legal text overlap)
  let kvRightEdge = width - paddingPx;
  if (isHorizontalLayout && state.showKV && state.kv && !kvPlannedMeta) {
    // Estimate KV position - it will be on the right side
    const widthAfterPadding = Math.max(0, width - paddingPx * 2);
    const minTextRatio = width >= height * 3 ? 0.68 : 0.5;
    const minTextWidth = Math.max(widthAfterPadding * minTextRatio, 200);
    const gap = Math.max(paddingPx, width * 0.02);
    const availableHeight = Math.max(0, height - paddingPx * 2);
    const maxKvWidth = Math.max(0, widthAfterPadding - minTextWidth - gap);
    if (maxKvWidth > 10) {
      const scaleByHeight = availableHeight > 0 ? availableHeight / state.kv.height : 0;
      let kvW = state.kv.width * scaleByHeight;
      if (kvW > maxKvWidth) {
        kvW = maxKvWidth;
      }
      if (kvW > 10) {
        kvRightEdge = width - paddingPx - kvW - gap;
      }
    }
  } else if (kvPlannedMeta && isHorizontalLayout) {
    // KV is already planned, use its left edge
    kvRightEdge = kvPlannedMeta.kvX - Math.max(paddingPx, width * 0.02);
  }
  
  if ((state.showLegal && legalLines.length > 0) || (state.showAge && state.age)) {
    // Legal всегда занимает всю ширину макета (минус отступы и место для age)
    const ageWidth = (state.showAge && state.age && ageTextWidth > 0) ? ageTextWidth + ageGapPx : 0;
    // Legal занимает всю ширину макета по нижнему краю на любом макете
    const fullLegalWidth = width - effectivePaddingPx * 2 - ageWidth;
    let legalMaxWidthForFlex = Math.max(50, fullLegalWidth);
    
    // Calculate legal text block - last line should be at commonBaselineY
    if (state.showLegal && legalLines.length > 0) {
      // Legal всегда занимает всю ширину макета (минус отступы и место для age)
      const firstLineBaselineY = commonBaselineY - (legalLines.length - 1) * legalSize * state.legalLineHeight;
      const legalHeight = legalLines.length * legalSize * state.legalLineHeight;
      const legalTop = commonBaselineY - legalHeight;
      
      // Пересчитываем legalLines с учетом полной ширины
      const legalWeight = getFontWeight(state.legalWeight);
      legalLines = wrapText(ctx, state.legal, legalMaxWidthForFlex, legalSize, legalWeight, state.legalLineHeight);
      
      legalContentBounds = {
        x: effectivePaddingPx,
        y: Math.max(effectivePaddingPx, legalTop),
        width: legalMaxWidthForFlex,
        height: legalHeight
      };
      
      legalTextBounds = {
        x: effectivePaddingPx,
        y: legalContentBounds.y,
        width: legalMaxWidthForFlex,
        height: legalHeight
      };
      
      legalBounds = { ...legalContentBounds };
    }

    // Position age at the same baseline as legal's last line (commonBaselineY)
    if (state.showAge && state.age && ageTextWidth > 0) {
      const ageBaseline = commonBaselineY;
      const ageY = ageBaseline - ageSizePx;
      const ageXRight = width - effectivePaddingPx;
      
      ageBoundsRect = {
        x: ageXRight - ageTextWidth,
        y: ageY,
        width: ageTextWidth,
        height: ageSizePx
      };
      
      // Legal уже занимает всю ширину с учетом места для age (ageWidth уже учтен в legalMaxWidthForFlex)
      // Пересчитываем legalLines только если нужно, чтобы убедиться, что текст правильно обернут
      if (state.showLegal && state.legal && legalLines.length > 0) {
        const legalWeight = getFontWeight(state.legalWeight);
        const legalHeight = legalLines.length * legalSize * state.legalLineHeight;
        const firstLineBaselineY = commonBaselineY - (legalLines.length - 1) * legalSize * state.legalLineHeight;
        const legalTop = commonBaselineY - legalHeight;
        
        // Обновляем bounds с правильной шириной
        legalContentBounds = {
          x: effectivePaddingPx,
          y: Math.max(effectivePaddingPx, legalTop),
          width: legalMaxWidthForFlex,
          height: legalHeight
        };
        
        legalTextBounds = {
          x: effectivePaddingPx,
          y: legalContentBounds.y,
          width: legalMaxWidthForFlex,
          height: legalHeight
        };
        
        legalBounds = { ...legalContentBounds };
      }
    }
  }

  // Refine legalBlockHeight based on actual positions
  // Legal and age are on the same baseline at the bottom, so calculate height from top of legal to bottom
  if (legalTextBounds || legalContentBounds) {
    const legalTop = legalTextBounds ? legalTextBounds.y : (legalContentBounds ? legalContentBounds.y : height - paddingPx);
    const legalHeight = legalTextBounds ? legalTextBounds.height : (legalContentBounds ? legalContentBounds.height : 0);
    // Legal block extends from its top to the bottom (commonBaselineY)
    const commonBaselineY = height - paddingPx;
    legalBlockHeight = Math.max(legalBlockHeight, commonBaselineY - legalTop + paddingPx * 0.5);
  } else if (state.showLegal && legalLines.length > 0) {
    // Fallback: use calculated height
    legalBlockHeight = Math.max(legalBlockHeight, legalLines.length * legalSize * state.legalLineHeight + paddingPx * 0.5);
  }
  if (ageBoundsRect && ageSizePx > 0) {
    // Ensure we have enough space for age
    legalBlockHeight = Math.max(legalBlockHeight, ageSizePx + paddingPx * 0.5);
  }

  const baseTitleSize = (state.titleSize / 100) * minDimension;
  const titleSize = baseTitleSize * titleSizeMultiplier;
  const baseSubtitleSize = (state.subtitleSize / 100) * minDimension;
  // Подзаголовок всегда масштабируется пропорционально заголовку
  // Используем то же соотношение, что и для базовых размеров, умноженное на titleSizeMultiplier
  // Это гарантирует, что при изменении titleSizeMultiplier или state.titleSize подзаголовок будет масштабироваться вместе с заголовком
  const subtitleSize = baseSubtitleSize * titleSizeMultiplier;

  // Hide subtitle on wide formats (height < 150px) if option is enabled
  const shouldShowSubtitle = state.showSubtitle && state.subtitle && !(state.hideSubtitleOnWide && height < 150);
  
  // Получаем веса шрифтов один раз
  const titleWeight = getFontWeight(state.titleWeight);
  const subtitleWeight = getFontWeight(state.subtitleWeight);
  
  ctx.font = `${titleWeight} ${titleSize}px ${state.titleFontFamily || state.fontFamily}`;
  const titleLines = wrapText(ctx, state.title, maxTextWidth, titleSize, titleWeight, state.titleLineHeight);
  const titleBlockHeight = titleLines.length * titleSize * state.titleLineHeight;

  let subtitleBlockHeight = 0;
  let subtitleLines = [];
  if (shouldShowSubtitle) {
    ctx.font = `${subtitleWeight} ${subtitleSize}px ${state.subtitleFontFamily || state.fontFamily}`;
    // Учитываем letter spacing при обертке текста - уменьшаем maxWidth
    let effectiveMaxWidth = maxTextWidth;
    if (state.subtitleLetterSpacing) {
      // Приблизительно вычитаем максимальный letter spacing для длинной строки
      // Это консервативная оценка, чтобы гарантировать, что текст не выйдет за границы
      const estimatedCharsPerLine = Math.floor(maxTextWidth / (subtitleSize * 0.6)); // примерная ширина символа
      const letterSpacingImpact = state.subtitleLetterSpacing * Math.max(0, estimatedCharsPerLine - 1);
      effectiveMaxWidth = Math.max(50, maxTextWidth - letterSpacingImpact);
    }
    subtitleLines = wrapText(ctx, state.subtitle, effectiveMaxWidth, subtitleSize, subtitleWeight, state.subtitleLineHeight);
    if (subtitleLines.length > 0) {
      // Gap is calculated separately, not included in block height
      subtitleBlockHeight = subtitleLines.length * subtitleSize * state.subtitleLineHeight;
    }
  }

  // Total text height includes title, subtitle, and gap between them
  // For ultra-wide formats, reduce gap by 3% (closer to title)
  const effectiveSubtitleGap = isUltraWide ? state.subtitleGap - 3 : state.subtitleGap;
  const subtitleGapPx = shouldShowSubtitle && subtitleLines.length > 0 ? (effectiveSubtitleGap / 100) * height : 0;
  const totalTextHeight = titleBlockHeight + subtitleGapPx + subtitleBlockHeight;

  let startY;

  if (isSuperWide) {
    // Для супер широких форматов: центрируем заголовок с подзаголовком по высоте,
    // но учитываем, что legal занимает всю нижнюю часть
    const legalAreaHeight = legalBlockHeight > 0 ? legalBlockHeight + effectivePaddingPx * 0.5 : 0;
    const availableHeightForText = Math.max(0, height - effectivePaddingPx - legalAreaHeight);
    const textCenterY = effectivePaddingPx + availableHeightForText / 2;
    startY = textCenterY - totalTextHeight / 2 + titleSize;
  } else if (isUltraWide) {
    const availableHeight = Math.max(0, height - effectivePaddingPx * 2);
    startY = effectivePaddingPx + (availableHeight - totalTextHeight) / 2 + titleSize;
  } else if (isHorizontalLayout) {
    startY = paddingPx + titleSize;
    if (legalBlockHeight > 0) {
      const bottomPadding = paddingPx + legalBlockHeight + paddingPx * 0.5;
      startY = Math.min(startY, height - bottomPadding - totalTextHeight + titleSize);
    }
    if (state.logo && logoBounds) {
      const logoBottom = logoBounds.y + logoBounds.height;
      const logoStart = logoBottom + paddingPx + titleSize;
      startY = Math.max(startY, logoStart);
    }
    startY = Math.max(paddingPx + titleSize, startY);
  } else {
    if (state.titleVPos === 'top') {
      if (state.logo && logoBounds) {
        startY = logoBounds.y + logoBounds.height + paddingPx + titleSize;
      } else {
        startY = paddingPx + titleSize;
      }
      const minStart = logoBounds ? logoBounds.y + logoBounds.height + titleSize : paddingPx + titleSize;
      startY = Math.max(minStart, startY);
    } else if (state.titleVPos === 'center') {
      const availableHeight = height - legalBlockHeight - paddingPx * 2;
      startY = (availableHeight - totalTextHeight) / 2 + paddingPx + titleSize;
    } else {
      const legalTop = height - paddingPx - legalBlockHeight;
      // For ultra-wide formats, reduce gap by 3% (closer to title)
      const effectiveSubtitleGap = isUltraWide ? state.subtitleGap - 3 : state.subtitleGap;
      const subtitleGapPx = (effectiveSubtitleGap / 100) * height;
      // Use user-defined gap, with minimum safety gap to avoid overlap
      const gapFromSubtitle = subtitleLines.length > 0 ? subtitleGapPx : titleSize * state.titleLineHeight * 0.3;
      const safetyGap = Math.max(paddingPx * 0.5, gapFromSubtitle, legalSize * state.legalLineHeight * 0.5);
      const textBottom = legalTop - safetyGap;
      startY = textBottom - totalTextHeight + titleSize;
      if (startY < paddingPx + titleSize) {
        startY = paddingPx + titleSize;
      }
    }
  }

  const effectiveTitleAlign = state.titleAlign || 'left';
  const titleX = getAlignedXWithinArea(effectiveTitleAlign, textArea);
  // titleWeight уже определен выше
  ctx.font = `${titleWeight} ${titleSize}px ${state.titleFontFamily || state.fontFamily}`;
  ctx.fillStyle = state.titleColor;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = effectiveTitleAlign;

  const computeTextBounds = (baseY) => {
    const titleBoundsLocal = getTextBlockBounds(
      ctx,
      titleLines,
      titleX,
      baseY,
      titleSize,
      state.titleLineHeight,
      effectiveTitleAlign,
      maxTextWidth
    );

    let subtitleYLocal = null;
    let subtitleBoundsLocal = null;

    if (shouldShowSubtitle && subtitleLines.length > 0) {
      // Calculate subtitle Y position based on title block
      // For ultra-wide formats, reduce gap by 3% (closer to title)
      const effectiveSubtitleGap = isUltraWide ? state.subtitleGap - 3 : state.subtitleGap;
      const subtitleGapPx = (effectiveSubtitleGap / 100) * height;
      subtitleYLocal = baseY + titleBlockHeight + subtitleGapPx;
      
      subtitleBoundsLocal = getTextBlockBounds(
        ctx,
        subtitleLines,
        getAlignedXWithinArea(effectiveTitleAlign, textArea),
        subtitleYLocal,
        subtitleSize,
        state.subtitleLineHeight,
        effectiveTitleAlign,
        maxTextWidth
      );
    }

    return { titleBounds: titleBoundsLocal, subtitleBounds: subtitleBoundsLocal, subtitleY: subtitleYLocal };
  };

  let { titleBounds, subtitleBounds, subtitleY } = computeTextBounds(startY);

    if (!isHorizontalLayout && legalBlockHeight > 0) {
      const legalTop = height - paddingPx - legalBlockHeight;
      // For ultra-wide formats, reduce gap by 3% (closer to title)
      const effectiveSubtitleGap = isUltraWide ? state.subtitleGap - 3 : state.subtitleGap;
      const subtitleGapPx = (effectiveSubtitleGap / 100) * height;
      const desiredGap = Math.max(
        paddingPx * 0.5,
        shouldShowSubtitle && subtitleLines.length > 0 ? Math.max(subtitleGapPx, subtitleSize * state.subtitleLineHeight * 0.3) : titleSize * state.titleLineHeight * 0.3,
        legalSize * state.legalLineHeight * 0.4
      );
      const textBottom = Math.max(
        titleBounds ? titleBounds.y + titleBounds.height : -Infinity,
        subtitleBounds ? subtitleBounds.y + subtitleBounds.height : -Infinity
      );
      const allowedBottom = legalTop - desiredGap;
      if (textBottom > allowedBottom) {
        const shift = textBottom - allowedBottom;
        const minStart = paddingPx + titleSize;
        startY = Math.max(minStart, startY - shift);
        ({ titleBounds, subtitleBounds, subtitleY } = computeTextBounds(startY));
      }
    }

  titleLines.forEach((line, index) => {
    const lineY = startY + index * titleSize * state.titleLineHeight;
    if (state.titleLetterSpacing) {
      drawTextWithSpacing(ctx, line, titleX, lineY, state.titleLetterSpacing, effectiveTitleAlign);
    } else {
      ctx.fillText(line, titleX, lineY);
    }
  });

  // Draw subtitle if it's enabled and has content
  if (shouldShowSubtitle && subtitleLines.length > 0) {
    // Ensure subtitleY is calculated if it wasn't set
    let actualSubtitleY = subtitleY;
    if (actualSubtitleY === null || actualSubtitleY === undefined) {
      // Calculate subtitle Y position if it wasn't calculated
      // For ultra-wide formats, reduce gap by 3% (closer to title)
      const effectiveSubtitleGap = isUltraWide ? state.subtitleGap - 3 : state.subtitleGap;
      const subtitleGapPx = (effectiveSubtitleGap / 100) * height;
      actualSubtitleY = startY + titleBlockHeight + subtitleGapPx;
    }
    
    const subtitleX = getAlignedXWithinArea(effectiveTitleAlign, textArea);
    const effectiveSubtitleAlign = effectiveTitleAlign;
    // subtitleWeight уже определен выше
    ctx.font = `${subtitleWeight} ${subtitleSize}px ${state.subtitleFontFamily || state.fontFamily}`;
    const { r, g, b } = hexToRgb(state.subtitleColor);
    const opacity = Math.max(0, Math.min(100, state.subtitleOpacity || 100)) / 100;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    ctx.textAlign = effectiveSubtitleAlign;
    ctx.textBaseline = 'alphabetic';

    subtitleLines.forEach((line, index) => {
      const lineY = actualSubtitleY + index * subtitleSize * state.subtitleLineHeight;
      // For layouts up to 150px height, always show subtitle even if it overflows
      // For larger layouts, only draw if line is at least partially visible
      const isSmallLayout = height <= 150;
      if (isSmallLayout || (lineY > -subtitleSize && lineY < height + subtitleSize)) {
        // Проверяем, что текст не выходит за границы охранного поля
        let lineToDraw = line;
        const availableWidth = textArea.right - textArea.left;
        
        if (state.subtitleLetterSpacing) {
          // Измеряем реальную ширину строки с letter spacing
          const characters = Array.from(line);
          const widths = characters.map((char) => measureLineWidth(ctx, char));
          const totalWidth = widths.reduce((acc, width) => acc + width, 0) + state.subtitleLetterSpacing * (characters.length - 1);
          
          // Если текст выходит за границы, обрезаем его
          if (totalWidth > availableWidth) {
            // Обрезаем строку до нужной длины
            let truncatedLine = '';
            let truncatedWidth = 0;
            for (let i = 0; i < characters.length; i++) {
              const char = characters[i];
              const charWidth = widths[i];
              const spacing = i > 0 ? state.subtitleLetterSpacing : 0;
              if (truncatedWidth + charWidth + spacing <= availableWidth) {
                truncatedLine += char;
                truncatedWidth += charWidth + spacing;
              } else {
                break;
              }
            }
            lineToDraw = truncatedLine;
          }
          drawTextWithSpacing(ctx, lineToDraw, subtitleX, lineY, state.subtitleLetterSpacing, effectiveSubtitleAlign);
        } else {
          // Проверяем ширину без letter spacing
          const lineWidth = measureLineWidth(ctx, line);
          if (lineWidth > availableWidth) {
            // Обрезаем строку
            let truncatedLine = '';
            let truncatedWidth = 0;
            const characters = Array.from(line);
            for (const char of characters) {
              const charWidth = measureLineWidth(ctx, char);
              if (truncatedWidth + charWidth <= availableWidth) {
                truncatedLine += char;
                truncatedWidth += charWidth;
              } else {
                break;
              }
            }
            lineToDraw = truncatedLine;
          }
          ctx.fillText(lineToDraw, subtitleX, lineY);
        }
      }
    });
  }

  const textBlockBottom = Math.max(
    titleBounds ? titleBounds.y + titleBounds.height : startY,
    subtitleBounds ? subtitleBounds.y + subtitleBounds.height : 0
  );

  if (state.showKV && state.kv && !kvPlannedMeta) {
    if (!isUltraWide && !isHorizontalLayout) {
      const safeGapY = paddingPx * 0.5;
      const availableWidth = Math.max(0, width - paddingPx * 2);
      const textTop = titleBounds ? titleBounds.y : paddingPx;
      const logoBottom = logoBounds ? logoBounds.y + logoBounds.height : paddingPx;
      const topAreaStart = Math.max(paddingPx, logoBottom + safeGapY);
      const topAreaEnd = Math.max(topAreaStart, textTop - safeGapY);
      const topAreaHeight = Math.max(0, topAreaEnd - topAreaStart);

      const legalReserved = (state.showLegal && legalLines.length > 0) || (state.showAge && state.age) ? legalBlockHeight : 0;
      const bottomAreaStart = textBlockBottom + safeGapY;
      // Учитываем отступ для legal (safeGap для KV должен быть выше legal)
      const legalTop = height - paddingPx - legalReserved;
      const safeGapForLegal = Math.max(paddingPx * 0.5, legalSize * 0.5);
      const bottomAreaEnd = Math.max(bottomAreaStart, legalTop - safeGapForLegal);
      const bottomAreaHeight = Math.max(0, bottomAreaEnd - bottomAreaStart);

      const minKvSize = 30; // Минимальный размер для KV (уменьшен для более мягкой проверки)
      const computeFit = (availHeight, areaStart, areaEnd) => {
        if (availableWidth <= 0 || availHeight <= 0) return null;
        // Используем максимально возможный масштаб для заполнения доступного пространства
        const scale = Math.min(availableWidth / state.kv.width, availHeight / state.kv.height);
        if (!(scale > 0) || !Number.isFinite(scale)) return null;
        const kvW = state.kv.width * scale;
        const kvH = state.kv.height * scale;
        
        // Проверяем минимальный размер KV - если слишком маленький, не размещаем
        // Используем более мягкую проверку: хотя бы одна сторона должна быть >= minKvSize
        if (kvW < minKvSize && kvH < minKvSize) return null;
        
        // Центрируем KV в доступной области, используя всю доступную высоту
        const kvX = paddingPx + (availableWidth - kvW) / 2;
        // Размещаем KV так, чтобы максимально использовать доступное пространство
        const kvY = areaStart + (availHeight - kvH) / 2;
        return {
          kvW,
          kvH,
          kvScale: scale,
          kvX,
          kvY
        };
      };

      const topFit = computeFit(topAreaHeight, topAreaStart, topAreaEnd);
      const bottomFit = computeFit(bottomAreaHeight, bottomAreaStart, bottomAreaEnd);
      const areaTop = topFit ? topFit.kvW * topFit.kvH : 0;
      const areaBottom = bottomFit ? bottomFit.kvW * bottomFit.kvH : 0;

      let placement = null;
      if (bottomFit && (areaBottom >= areaTop || !topFit)) {
        placement = bottomFit;
      } else if (topFit) {
        placement = topFit;
      }

      // Если не помещается ни в top, ни в bottom, не размещаем КВ (placement остается null)
      // КВ будет автоматически скрыт в конце функции, если kvRenderMeta будет null

      if (placement) {
        kvPlannedMeta = { ...placement, paddingPx };
      }
    }
  }

  if (state.showLegal && legalLines.length > 0) {
    const legalWeight = getFontWeight(state.legalWeight);
    ctx.font = `${legalWeight} ${legalSize}px ${state.legalFontFamily || state.fontFamily}`;
    const { r, g, b } = hexToRgb(state.legalColor);
    const opacity = Math.max(0, Math.min(100, state.legalOpacity || 100)) / 100;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    ctx.textAlign = 'left';

    // Draw legal text - last line should be at commonBaselineY (height - effectivePaddingPx)
    const commonBaselineY = height - effectivePaddingPx;
    const firstLineBaselineY = commonBaselineY - (legalLines.length - 1) * legalSize * state.legalLineHeight;
    const drawX = effectivePaddingPx;
    
    // Legal всегда занимает всю ширину макета (минус отступы и место для age)
    const maxLegalWidth = width - effectivePaddingPx * 2 - (state.showAge && state.age && ageTextWidth > 0 ? ageTextWidth + ageGapPx : 0);
    
    // Use clipping to ensure text doesn't go beyond the allowed area
    ctx.save();
    ctx.beginPath();
    ctx.rect(drawX, 0, maxLegalWidth, height);
    ctx.clip();
    
    legalLines.forEach((line, index) => {
      const lineY = firstLineBaselineY + index * legalSize * state.legalLineHeight;
      // Measure line width to ensure it doesn't exceed maxLegalWidth
      const lineWidth = measureLineWidth(ctx, line);
      if (lineWidth > maxLegalWidth) {
        // If line is too long, truncate it (shouldn't happen if wrapText works correctly)
        let truncatedLine = line;
        while (measureLineWidth(ctx, truncatedLine + '...') > maxLegalWidth && truncatedLine.length > 0) {
          truncatedLine = truncatedLine.slice(0, -1);
        }
        ctx.fillText(truncatedLine + '...', drawX, lineY);
      } else {
        ctx.fillText(line, drawX, lineY);
      }
    });
    
    ctx.restore();
  }

  if (state.showAge && state.age && ageBoundsRect) {
    const ageWeight = getFontWeight(state.ageWeight || state.legalWeight);
    ctx.font = `${ageWeight} ${ageSizePx}px ${state.ageFontFamily || state.fontFamily}`;
    const { r, g, b } = hexToRgb(state.legalColor);
    const opacity = Math.max(0, Math.min(100, state.legalOpacity || 100)) / 100;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    ctx.textAlign = 'left';
    // Draw age at the same baseline as legal's last line
    const commonBaselineY = height - paddingPx;
    ctx.fillText(state.age, ageBoundsRect.x, commonBaselineY);
  }

  let kvRenderMeta = null;
  if (kvPlannedMeta) {
    // KV всегда должен быть немного выше legal текста
    if (legalTextBounds || legalContentBounds || ageBoundsRect) {
      const kvBottom = kvPlannedMeta.kvY + kvPlannedMeta.kvH;
      const legalTop = legalTextBounds ? legalTextBounds.y : (legalContentBounds ? legalContentBounds.y : height);
      const ageTop = ageBoundsRect ? ageBoundsRect.y : height;
      const minLegalTop = Math.min(legalTop, ageTop);
      // Минимальный отступ между KV и legal (чуть больше, чем просто safeGap)
      const safeGap = Math.max(paddingPx * 0.5, legalSize * 0.5);
      
      // Всегда проверяем и корректируем позицию KV, чтобы он был выше legal
      const maxAllowedBottom = minLegalTop - safeGap;
      
      // Если KV находится слишком низко (пересекается или слишком близко к legal), перемещаем его выше
      if (kvBottom > maxAllowedBottom) {
        if (maxAllowedBottom >= kvPlannedMeta.kvY + kvPlannedMeta.kvH * 0.5) {
          // Move KV up if there's enough space
          kvPlannedMeta.kvY = Math.max(paddingPx, maxAllowedBottom - kvPlannedMeta.kvH);
        } else {
          // Reduce KV size to fit if moving up is not enough
          const availableHeight = Math.max(0, maxAllowedBottom - paddingPx - safeGap);
          if (availableHeight > 10) {
            const availableWidthForKV = Math.max(0, width - paddingPx * 2);
            const newScale = Math.min(
              kvPlannedMeta.kvScale || 1,
              availableHeight / state.kv.height,
              availableWidthForKV / state.kv.width
            );
            kvPlannedMeta.kvW = state.kv.width * newScale;
            kvPlannedMeta.kvH = state.kv.height * newScale;
            kvPlannedMeta.kvScale = newScale;
            kvPlannedMeta.kvX = paddingPx + Math.max(0, (availableWidthForKV - kvPlannedMeta.kvW) / 2);
            kvPlannedMeta.kvY = Math.max(paddingPx, maxAllowedBottom - kvPlannedMeta.kvH);
          }
        }
      }
    }
    
    // Применяем скругление углов для KV
    if (state.kvBorderRadius > 0) {
      ctx.save();
      const borderRadius = Math.min(state.kvBorderRadius / 100 * Math.min(kvPlannedMeta.kvW, kvPlannedMeta.kvH), 
                                     Math.min(kvPlannedMeta.kvW, kvPlannedMeta.kvH) / 2);
      
      // Создаем скругленный прямоугольник
      ctx.beginPath();
      if (ctx.roundRect) {
        // Используем современный API, если доступен
        ctx.roundRect(kvPlannedMeta.kvX, kvPlannedMeta.kvY, kvPlannedMeta.kvW, kvPlannedMeta.kvH, borderRadius);
      } else {
        // Fallback для старых браузеров
        const x = kvPlannedMeta.kvX;
        const y = kvPlannedMeta.kvY;
        const w = kvPlannedMeta.kvW;
        const h = kvPlannedMeta.kvH;
        const r = borderRadius;
        
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }
      ctx.clip();
    }
    
    ctx.drawImage(state.kv, kvPlannedMeta.kvX, kvPlannedMeta.kvY, kvPlannedMeta.kvW, kvPlannedMeta.kvH);
    
    if (state.kvBorderRadius > 0) {
      ctx.restore();
    }
    
    kvRenderMeta = kvPlannedMeta;
  }

  if (state.logo && logoBounds) {
    ctx.drawImage(state.logo, logoBounds.x, logoBounds.y, logoBounds.width, logoBounds.height);
  }

  if (state.showGuides) {
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(paddingPx, paddingPx, width - paddingPx * 2, height - paddingPx * 2);
  }

  if (state.showBlocks) {
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#74c0fc';
    if (titleBounds) {
      ctx.fillRect(titleBounds.x, titleBounds.y, titleBounds.width, titleBounds.height);
    }
    if (subtitleBounds) {
      ctx.fillStyle = '#ffa94d';
      ctx.fillRect(subtitleBounds.x, subtitleBounds.y, subtitleBounds.width, subtitleBounds.height);
    }
    if (logoBounds) {
      ctx.fillStyle = '#9775fa';
      ctx.fillRect(logoBounds.x, logoBounds.y, logoBounds.width, logoBounds.height);
    }
    if (kvRenderMeta) {
      ctx.fillStyle = '#51cf66';
      ctx.fillRect(kvRenderMeta.kvX, kvRenderMeta.kvY, kvRenderMeta.kvW, kvRenderMeta.kvH);
    }
    if (legalTextBounds) {
      ctx.fillStyle = '#ffd43b';
      ctx.fillRect(
        legalTextBounds.x,
        legalTextBounds.y,
        isHorizontalLayout ? maxTextWidth : legalTextBounds.width,
        legalTextBounds.height
      );
    }
    if (ageBoundsRect) {
      ctx.fillStyle = '#ff922b';
      ctx.fillRect(ageBoundsRect.x, ageBoundsRect.y, ageBoundsRect.width, ageBoundsRect.height);
    } else if (!legalTextBounds && legalContentBounds) {
      ctx.fillStyle = '#ffd43b';
      ctx.fillRect(legalContentBounds.x, legalContentBounds.y, legalContentBounds.width, legalContentBounds.height);
    }
    ctx.globalAlpha = 1.0;
  }

  // Если KV включен, но места для него нет, автоматически выключаем
  // Но только если размер KV уменьшился почти до 0 (меньше 10px) из-за изменения кегля текста
  if (state.showKV && state.kv && !kvRenderMeta) {
    // Проверяем, что места действительно недостаточно
    const availableWidth = Math.max(0, width - paddingPx * 2);
    const availableHeight = Math.max(0, height - paddingPx * 2);
    const criticalMinSize = 10; // Критически минимальный размер - почти 0
    
    // Вычисляем максимально возможный размер KV при текущих условиях
    const scaleByWidth = availableWidth > 0 ? availableWidth / state.kv.width : 0;
    const scaleByHeight = availableHeight > 0 ? availableHeight / state.kv.height : 0;
    const maxScale = Math.min(scaleByWidth, scaleByHeight);
    const maxKvW = state.kv.width * maxScale;
    const maxKvH = state.kv.height * maxScale;
    
    // Выключаем KV только если максимально возможный размер стал почти 0
    // Это происходит когда текст занимает почти все место из-за увеличения кегля
    if (maxKvW < criticalMinSize || maxKvH < criticalMinSize) {
      // Используем setTimeout, чтобы избежать изменения состояния во время рендеринга
      setTimeout(() => {
        const currentState = getState();
        // Проверяем, что KV все еще включен (чтобы не выключать его многократно)
        if (currentState.showKV) {
          setState({ showKV: false });
        }
      }, 0);
    }
  }

  return {
    kvRenderMeta,
    canvasWidth: width,
    canvasHeight: height
  };
};

const doRender = async () => {
  const sizes = getSortedSizes();
  if (!sizes.length) return;

  const state = getState();
  const categorized = categorizeSizes(sizes);

  // Рендерим узкий формат
  if (previewCanvasNarrow && categorized.narrow.length > 0) {
    if (currentNarrowIndex >= categorized.narrow.length) {
      currentNarrowIndex = 0;
    }
    const narrowSize = categorized.narrow[currentNarrowIndex];
    renderToCanvas(previewCanvasNarrow, narrowSize.width, narrowSize.height, state);
  }

  // Рендерим широкий формат
  if (previewCanvasWide && categorized.wide.length > 0) {
    if (currentWideIndex >= categorized.wide.length) {
      currentWideIndex = 0;
    }
    const wideSize = categorized.wide[currentWideIndex];
    lastRenderMeta = renderToCanvas(previewCanvasWide, wideSize.width, wideSize.height, state);
    // Используем размер широкого формата для kvCanvas (для совместимости)
    setKey('kvCanvasWidth', wideSize.width);
    setKey('kvCanvasHeight', wideSize.height);
  }

  // Рендерим квадратный формат
  if (previewCanvasSquare && categorized.square.length > 0) {
    if (currentSquareIndex >= categorized.square.length) {
      currentSquareIndex = 0;
    }
    const squareSize = categorized.square[currentSquareIndex];
    renderToCanvas(previewCanvasSquare, squareSize.width, squareSize.height, state);
  }

  // Обратная совместимость со старым canvas
  if (previewCanvas) {
    if (currentPreviewIndex >= sizes.length) {
      currentPreviewIndex = 0;
    }
    const size = sizes[currentPreviewIndex];
    lastRenderMeta = renderToCanvas(previewCanvas, size.width, size.height, state);
    setKey('kvCanvasWidth', size.width);
    setKey('kvCanvasHeight', size.height);
  }
};

export const renderer = {
  initialize(canvas) {
    previewCanvas = canvas;
  },
  initializeMulti(canvasNarrow, canvasWide, canvasSquare) {
    previewCanvasNarrow = canvasNarrow;
    previewCanvasWide = canvasWide;
    previewCanvasSquare = canvasSquare;
  },
  render() {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(doRender);
  },
  renderSync() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    doRender();
  },
  getCurrentIndex() {
    return currentPreviewIndex;
  },
  setCurrentIndex(index) {
    currentPreviewIndex = Number(index) || 0;
    this.render();
  },
  setCategoryIndex(category, index, shouldRender = true) {
    const idx = Number(index) || 0;
    if (category === 'narrow') {
      currentNarrowIndex = idx;
    } else if (category === 'wide') {
      currentWideIndex = idx;
    } else if (category === 'square') {
      currentSquareIndex = idx;
    }
    if (shouldRender) {
      this.render();
    }
  },
  getCategorizedSizes() {
    const sizes = getSortedSizes();
    return categorizeSizes(sizes);
  },
  getCheckedSizes() {
    return getCheckedSizes();
  },
  getSortedSizes() {
    return getSortedSizes();
  },
  getRenderMeta() {
    return lastRenderMeta;
  }
};

renderer.__unsafe_getRenderToCanvas = () => ({ renderToCanvas });

export const clearTextMeasurementCache = () => textMeasurementCache.clear();


