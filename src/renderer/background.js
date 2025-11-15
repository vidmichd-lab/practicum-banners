/**
 * Модуль для работы с фоном (цвет и изображение)
 */

/**
 * Рисует фон на canvas
 */
export const drawBackground = (ctx, width, height, state) => {
  // Рисуем цветной фон
  const bgColor = state.bgColor || '#1e1e1e';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Логируем только первый раз
  if (!drawBackground._logged) {
    console.log('Фон нарисован:', { bgColor, width, height, hasBgImage: !!state.bgImage });
    drawBackground._logged = true;
  }
  
  // Если есть изображение фона, рисуем его
  if (state.bgImage) {
    const img = state.bgImage;
    // Проверяем, что изображение загружено
    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
      console.warn('Фоновое изображение не загружено или невалидно');
      return;
    }
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
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
};

