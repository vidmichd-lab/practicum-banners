import { renderer } from './renderer.js';
import { getState, getCheckedSizes } from './state/store.js';

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const getRendererInternals = () => {
  if (!renderer.__unsafe_getRenderToCanvas) {
    throw new Error('Renderer internals are not exposed.');
  }
  return renderer.__unsafe_getRenderToCanvas();
};

// Функция для создания безопасного имени папки из заголовка
const sanitizeFolderName = (title) => {
  if (!title || title.trim() === '') {
    return 'untitled';
  }
  // Удаляем недопустимые символы для имен папок
  return title
    .trim()
    .replace(/[<>:"/\\|?*]/g, '') // Удаляем недопустимые символы
    .replace(/\s+/g, '_') // Заменяем пробелы на подчеркивания
    .substring(0, 100) // Ограничиваем длину
    || 'untitled';
};

const exportSizes = async (format) => {
  const sizes = getCheckedSizes();
  if (!sizes.length) {
    alert('Нет выбранных размеров для экспорта!');
    return;
  }

  if (typeof JSZip === 'undefined') {
    alert('Библиотека JSZip не загружена. Проверьте подключение к интернету.');
    return;
  }

  const state = getState();
  const pairs = state.titleSubtitlePairs || [];
  
  if (pairs.length === 0) {
    alert('Нет заголовков для экспорта!');
    return;
  }

  const zip = new JSZip();
  const { renderToCanvas } = getRendererInternals();

  // Экспортируем для каждой пары заголовок/подзаголовок
  for (let pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
    const pair = pairs[pairIndex];
    const folderName = sanitizeFolderName(pair.title);
    
    // Загружаем KV для этой пары, если указан
    let pairKV = null;
    if (pair.kvSelected) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = pair.kvSelected;
        });
        pairKV = img;
      } catch (e) {
        console.warn(`Не удалось загрузить KV для пары ${pairIndex}: ${pair.kvSelected}`);
      }
    }
    
    // Используем фоновое изображение из пары, если оно есть
    // Если это строка (путь к файлу), загружаем изображение
    let pairBgImage = null;
    if (pair.bgImageSelected) {
      if (typeof pair.bgImageSelected === 'string') {
        // Это путь к файлу, загружаем изображение
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = pair.bgImageSelected;
          });
          pairBgImage = img;
        } catch (e) {
          console.warn(`Не удалось загрузить фоновое изображение для пары ${pairIndex}: ${pair.bgImageSelected}`);
        }
      } else {
        // Это уже объект Image
        pairBgImage = pair.bgImageSelected;
      }
    }
    
    // Создаем state для этой пары
    const exportState = { 
      ...state, 
      showBlocks: false, 
      showGuides: false,
      title: pair.title || '',
      subtitle: pair.subtitle || '',
      kv: pairKV,
      kvSelected: pair.kvSelected || '',
      bgImage: pairBgImage
    };

    // Экспортируем все размеры для этой пары
    const exportScale = state.exportScale || 1;
    for (let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex++) {
      const size = sizes[sizeIndex];
      const canvas = document.createElement('canvas');
      
      // Применяем масштаб к размерам canvas
      const scaledWidth = size.width * exportScale;
      const scaledHeight = size.height * exportScale;

      try {
        renderToCanvas(canvas, scaledWidth, scaledHeight, exportState);
      } catch (e) {
        console.error(e);
        alert('Ошибка экспорта. Запустите проект через локальный сервер.');
        return;
      }

      const quality = format === 'jpeg' ? 0.95 : 1;
      let blob = await new Promise((resolve) => canvas.toBlob(resolve, `image/${format}`, quality));
      if (!blob) {
        alert('Не удалось сформировать изображение. Возможно, холст «tainted».');
        return;
      }

      // Оптимизируем изображение по весу
      try {
        // Проверяем наличие библиотеки оптимизации (может быть доступна через window или глобально)
        let compressionLib = null;
        if (typeof window !== 'undefined') {
          compressionLib = window.imageCompression?.default || window.imageCompression || null;
        }
        if (!compressionLib && typeof imageCompression !== 'undefined') {
          compressionLib = imageCompression.default || imageCompression;
        }
        
        if (compressionLib) {
          const originalSize = blob.size;
          const options = {
            maxSizeMB: format === 'jpeg' ? 1 : 2, // Максимальный размер в MB
            maxWidthOrHeight: Math.max(scaledWidth, scaledHeight), // Сохраняем размер
            useWebWorker: true, // Используем Web Worker для лучшей производительности
            fileType: `image/${format}`,
            initialQuality: format === 'jpeg' ? 0.85 : 0.9, // Качество для оптимизации
            alwaysKeepResolution: true // Сохраняем разрешение
          };
          
          // Конвертируем blob в File для библиотеки
          const file = new File([blob], `temp.${format === 'jpeg' ? 'jpg' : format}`, { 
            type: `image/${format}` 
          });
          
          // Оптимизируем изображение
          const compressedFile = await compressionLib(file, options);
          const newSize = compressedFile.size;
          
          // Используем оптимизированное изображение только если оно меньше оригинала
          if (newSize < originalSize) {
            blob = compressedFile;
            const savedPercent = ((1 - newSize / originalSize) * 100).toFixed(1);
            console.log(`Оптимизировано: ${(newSize / 1024).toFixed(2)} KB (экономия ${savedPercent}%)`);
          } else {
            console.log(`Оптимизация не уменьшила размер, используем оригинал`);
          }
        }
      } catch (compressionError) {
        console.warn('Ошибка оптимизации изображения, используем оригинал:', compressionError);
        // Продолжаем с оригинальным blob, если оптимизация не удалась
      }

      const platform = (size.platform || 'unknown').toString();
      // В имени файла оставляем оригинальный размер, но фактически экспортируем в масштабе
      const filename = `${folderName}/${platform}/${size.width}x${size.height}.${format === 'jpeg' ? 'jpg' : format}`;
      
      // Добавляем файл в ZIP
      zip.file(filename, blob);
    }
  }

  // Генерируем ZIP архив
  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipFilename = `${state.namePrefix || 'export'}_${format === 'jpeg' ? 'jpg' : format}.zip`;
    downloadBlob(zipBlob, zipFilename);
    console.log(`Экспорт завершен: ${zipFilename}`);
  } catch (e) {
    console.error('Ошибка создания ZIP архива:', e);
    alert('Не удалось создать ZIP архив.');
  }
};

export const exportPNG = () => exportSizes('png');
export const exportJPG = () => exportSizes('jpeg');


