/**
 * Модуль для расчетов позиций и размеров элементов макета
 */

import { LAYOUT_CONSTANTS } from './constants.js';

/**
 * Определяет тип макета на основе размеров
 */
export const getLayoutType = (width, height, layoutMode = 'auto') => {
  const aspectRatio = width / height;
  const horizontalThreshold = 1.35;
  const isHorizontalLayout = layoutMode === 'horizontal' || (layoutMode === 'auto' && aspectRatio >= horizontalThreshold);
  const isUltraWide = width >= height * LAYOUT_CONSTANTS.ULTRA_WIDE_THRESHOLD;
  const isSuperWide = isUltraWide && height < LAYOUT_CONSTANTS.SUPER_WIDE_HEIGHT;
  
  return {
    isHorizontalLayout,
    isUltraWide,
    isSuperWide,
    aspectRatio
  };
};

/**
 * Вычисляет множители размеров для разных элементов в зависимости от типа макета
 */
export const calculateSizeMultipliers = (width, height, layoutType) => {
  const { isUltraWide, isSuperWide } = layoutType;
  
  let logoSizeMultiplier = 1;
  let titleSizeMultiplier = 1;
  let legalMultiplier = 1;
  let ageMultiplier = 1;

  if (height >= width * LAYOUT_CONSTANTS.VERTICAL_THRESHOLD) {
    logoSizeMultiplier = LAYOUT_CONSTANTS.VERTICAL_LOGO_MULTIPLIER;
  } else if (isUltraWide) {
    logoSizeMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_LOGO_MULTIPLIER;
    
    if (height < LAYOUT_CONSTANTS.SUPER_WIDE_HEIGHT) {
      titleSizeMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_TITLE_MULTIPLIER_SMALL;
    } else if (height < 200) {
      titleSizeMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_TITLE_MULTIPLIER_MEDIUM;
    } else {
      titleSizeMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_TITLE_MULTIPLIER_LARGE;
    }
    
    if (height >= 250 && height <= 350) {
      legalMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_LEGAL_MULTIPLIER_MEDIUM;
    } else {
      legalMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_LEGAL_MULTIPLIER_NORMAL;
    }
    
    ageMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_AGE_MULTIPLIER;
  } else if (width >= height * 4) {
    logoSizeMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_LOGO_MULTIPLIER;
    
    if (height < 200) {
      titleSizeMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_TITLE_MULTIPLIER_MEDIUM;
    } else {
      titleSizeMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_TITLE_MULTIPLIER_LARGE;
    }
    
    // Для больших форматов типа 2832x600 (большая ширина, средняя высота) увеличиваем заголовок
    if (width >= 2000 && height >= 400 && height <= 800) {
      titleSizeMultiplier = 2; // Увеличиваем для больших форматов (был 2, стал 2.2)
      // Также увеличиваем legal для больших форматов
      legalMultiplier = 2.5; // Увеличиваем legal умеренно
    } else if (height >= 250 && height <= 350) {
      legalMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_LEGAL_MULTIPLIER_MEDIUM;
    } else {
      legalMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_LEGAL_MULTIPLIER_NORMAL;
    }
    
    ageMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_AGE_MULTIPLIER;
  } else if (width >= height * LAYOUT_CONSTANTS.HORIZONTAL_THRESHOLD) {
    logoSizeMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_LOGO_MULTIPLIER;
    
    if (height < 200) {
      titleSizeMultiplier = 1.8;
    } else {
      titleSizeMultiplier = 1.6;
    }
    
    if (height >= 250 && height <= 350) {
      legalMultiplier = 1.8;
    } else {
      legalMultiplier = 2;
    }
    
    ageMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_AGE_MULTIPLIER;
  }

  // Для высоких макетов (height/width >= 2) заголовок масштабируется на 1.3
  const aspectRatio = height / width;
  if (aspectRatio >= 2) {
    titleSizeMultiplier *= 1.3;
  }

  // Для форматов типа 960x450 или 1920x1080 (широкие горизонтальные форматы с большой высотой)
  // legal должен быть меньше, но не так сильно
  // Исключаем большие форматы типа 2832x600 (width >= 2000)
  const isWideHorizontal = width >= height * LAYOUT_CONSTANTS.HORIZONTAL_THRESHOLD && !isUltraWide;
  if (isWideHorizontal && height >= 400 && height <= 1200 && width >= 800 && width < 2000) {
    // Для форматов типа 960x450 или 1920x1080 уменьшаем legal умеренно
    // Был 1.8-2, делаем 1.2-1.3 в зависимости от высоты
    const originalLegalMultiplier = (height >= 250 && height <= 350) ? 1.8 : 2;
    let newLegalMultiplier;
    if (height >= 450 && height <= 500) {
      newLegalMultiplier = 1.2;
    } else if (height > 500 && height <= 1080) {
      newLegalMultiplier = 1.1;
    } else {
      newLegalMultiplier = 1.15;
    }
    legalMultiplier = newLegalMultiplier;
    
    // 18+ тоже уменьшаем пропорционально legal (был 2)
    const reductionFactor = newLegalMultiplier / originalLegalMultiplier;
    ageMultiplier = LAYOUT_CONSTANTS.ULTRA_WIDE_AGE_MULTIPLIER * reductionFactor;
    
    // Для больших форматов (1920x1080) уменьшаем заголовок
    // Был 1.6, делаем меньше в зависимости от высоты
    if (height >= 800) {
      // Для очень больших форматов (1920x1080) уменьшаем заголовок сильнее
      titleSizeMultiplier = 1.2;
    } else if (height >= 500) {
      // Для средних форматов (960x450) уменьшаем немного
      titleSizeMultiplier = 1.4;
    }
  }

  return {
    logoSizeMultiplier,
    titleSizeMultiplier,
    legalMultiplier,
    ageMultiplier
  };
};

/**
 * Вычисляет область для текста
 */
export const calculateTextArea = (width, height, paddingPx, layoutType, logoBounds, kvPlannedMeta) => {
  const { isUltraWide, isSuperWide, isHorizontalLayout } = layoutType;
  
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

  // Учитываем KV и логотип при расчете области текста
  if (isSuperWide && kvPlannedMeta) {
    const textStart = kvPlannedMeta.kvX + kvPlannedMeta.kvW + Math.max(paddingPx, width * 0.01);
    textArea.left = textStart;
    textArea.right = width - paddingPx;
  } else if (isUltraWide && kvPlannedMeta) {
    const textStart = kvPlannedMeta.kvX + kvPlannedMeta.kvW + Math.max(paddingPx, width * 0.02);
    textArea.left = Math.min(width - paddingPx - 200, Math.max(textStart, paddingPx));
    textArea.right = width - paddingPx;
    if (textArea.right - textArea.left < 200) {
      textArea.left = Math.max(paddingPx, textArea.right - 200);
    }
  } else if (isSuperWide) {
    const logoRight = logoBounds ? (logoBounds.x + (logoBounds.totalWidth || logoBounds.width)) : paddingPx;
    textArea.left = logoRight + Math.max(paddingPx * 0.5, width * 0.01);
    textArea.right = width - paddingPx;
  } else if (isUltraWide) {
    const logoRight = logoBounds ? (logoBounds.x + (logoBounds.totalWidth || logoBounds.width)) : paddingPx;
    textArea.left = logoRight + paddingPx;
    textArea.right = width - paddingPx;
  } else if (isHorizontalLayout && kvPlannedMeta) {
    const minTextRatio = width >= height * LAYOUT_CONSTANTS.HORIZONTAL_THRESHOLD ? LAYOUT_CONSTANTS.MIN_TEXT_RATIO_WIDE : LAYOUT_CONSTANTS.MIN_TEXT_RATIO_NORMAL;
    const widthAfterPadding = Math.max(0, width - paddingPx * 2);
    const minTextWidth = Math.max(widthAfterPadding * minTextRatio, LAYOUT_CONSTANTS.MIN_TEXT_WIDTH);
    const gap = Math.max(paddingPx, width * 0.02);
    
    // Рассчитываем ширину текста с учетом KV
    const textWidth = Math.max(minTextWidth, widthAfterPadding - kvPlannedMeta.kvW - gap);
    
    textArea.left = paddingPx;
    textArea.right = paddingPx + textWidth;
    
    // Дополнительная проверка: гарантируем, что текст не заходит на KV
    const kvRight = kvPlannedMeta.kvX + kvPlannedMeta.kvW;
    const maxTextRight = kvRight - gap;
    if (textArea.right > maxTextRight) {
      textArea.right = Math.max(textArea.left + 50, maxTextRight);
    }
  }

  if (textArea.right <= textArea.left) {
    textArea.right = width - paddingPx;
    textArea.left = paddingPx;
  }
  
  maxTextWidth = Math.max(50, textArea.right - textArea.left);

  return { textArea, maxTextWidth };
};

/**
 * Вычисляет позицию логотипа
 */
export const calculateLogoBounds = (state, width, height, paddingPx, layoutType, logoSizePercent) => {
  const { isUltraWide, isSuperWide, isHorizontalLayout } = layoutType;
  
  if (!state.showLogo || !state.logo) return null;

  // Учитываем партнерский логотип при расчете общей ширины
  const hasPartnerLogo = state.partnerLogo && state.showLogo;
  const separatorWidth = hasPartnerLogo ? 12 : 0; // Ширина разделителя "|" (увеличена для большего отступа)
  
  // Общая ширина для обоих логотипов
  let totalLogoWidth = (width * logoSizePercent) / 100;
  
  // Если есть партнерский логотип, делим пространство пополам
  let mainLogoWidth = totalLogoWidth;
  if (hasPartnerLogo) {
    // Оставляем место для разделителя и делим оставшееся пространство
    const availableWidth = totalLogoWidth - separatorWidth;
    mainLogoWidth = availableWidth / 2;
  }
  
  let logoScale = mainLogoWidth / state.logo.width;
  let logoHeight = state.logo.height * logoScale;

  if (isUltraWide) {
    const availableHeight = Math.max(0, height - paddingPx * 2);
    logoHeight = Math.min(availableHeight * 0.3, state.logo.height * logoScale);
    logoScale = logoHeight / state.logo.height;
    mainLogoWidth = state.logo.width * logoScale;
    
    // Пересчитываем для партнерского логотипа
    if (hasPartnerLogo) {
      const partnerLogoScale = logoHeight / state.partnerLogo.height;
      const partnerLogoWidth = state.partnerLogo.width * partnerLogoScale;
      totalLogoWidth = mainLogoWidth + separatorWidth + partnerLogoWidth;
    } else {
      totalLogoWidth = mainLogoWidth;
    }
    
    return {
      x: paddingPx,
      y: paddingPx + (availableHeight - logoHeight) / 2,
      width: mainLogoWidth,
      height: logoHeight,
      totalWidth: totalLogoWidth,
      hasPartnerLogo
    };
  } else if (isHorizontalLayout) {
    // Пересчитываем для партнерского логотипа
    if (hasPartnerLogo) {
      const partnerLogoScale = logoHeight / state.partnerLogo.height;
      const partnerLogoWidth = state.partnerLogo.width * partnerLogoScale;
      totalLogoWidth = mainLogoWidth + separatorWidth + partnerLogoWidth;
    } else {
      totalLogoWidth = mainLogoWidth;
    }
    
    return {
      x: paddingPx,
      y: paddingPx,
      width: mainLogoWidth,
      height: logoHeight,
      totalWidth: totalLogoWidth,
      hasPartnerLogo
    };
  } else {
    let logoX;
    let logoY;
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
    
    // Пересчитываем для партнерского логотипа
    if (hasPartnerLogo) {
      const partnerLogoScale = logoHeight / state.partnerLogo.height;
      const partnerLogoWidth = state.partnerLogo.width * partnerLogoScale;
      totalLogoWidth = mainLogoWidth + separatorWidth + partnerLogoWidth;
    } else {
      totalLogoWidth = mainLogoWidth;
    }
    
    // Если позиция center, нужно учесть общую ширину для центрирования
    if (effectiveLogoPos === 'center' && hasPartnerLogo) {
      logoX = (width - totalLogoWidth) / 2;
    }
    
    return {
      x: logoX,
      y: logoY,
      width: mainLogoWidth,
      height: logoHeight,
      totalWidth: totalLogoWidth,
      hasPartnerLogo
    };
  }
};

