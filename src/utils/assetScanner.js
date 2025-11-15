// Функция для проверки существования файла (без ошибок в консоли)
const checkFileExists = async (url) => {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    // Игнорируем ошибки - файл не существует
    return false;
  }
};

// Сканирование логотипов из папки logo/ с динамическим обнаружением структуры (аналогично scanKV)
// Возвращает структурированные данные (объект) вместо плоского массива
export const scanLogos = async () => {
  const logoStructure = {};
  
  // Список возможных папок первого уровня (только реально используемые)
  const firstLevelFolders = ['black', 'white'];
  
  // Список возможных папок второго уровня (только реально используемые)
  const secondLevelFolders = [];
  
  // Список возможных папок третьего уровня (языковые коды)
  const thirdLevelFolders = ['ru', 'en', 'kz'];
  
  // Функция для сканирования файлов в трехуровневой папке
  // Если folder2 пустой, сканирует logo/folder1/folder3/file
  // Иначе сканирует logo/folder1/folder2/folder3/file
  const scanFolder3Level = async (folder1, folder2, folder3) => {
    const folderFiles = [];
    
    // Список известных именованных файлов для проверки
    const knownNames = ['main', 'main_mono', 'mono', 'long', 'logo', 'long_logo', 'black', 'white', 'icon', 'symbol', 'mark', 'emblem'];
    
    // Определяем путь в зависимости от наличия folder2
    const basePath = folder2 ? `logo/${folder1}/${folder2}/${folder3}` : `logo/${folder1}/${folder3}`;
    
    // Проверяем именованные файлы
    const namedFilePromises = [];
    for (const name of knownNames) {
      namedFilePromises.push(
        checkFileExists(`${basePath}/${name}.svg`).then(exists => ({ name, exists, ext: 'svg' })),
        checkFileExists(`${basePath}/${name}.png`).then(exists => ({ name, exists, ext: 'png' }))
      );
    }
    
    const namedResults = await Promise.all(namedFilePromises);
    let foundAny = false;
    
    for (let i = 0; i < namedResults.length; i += 2) {
      const svgResult = namedResults[i];
      const pngResult = namedResults[i + 1];
      
      if (svgResult.exists) {
        const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
        const folder2Name = folder2 ? folder2.charAt(0).toUpperCase() + folder2.slice(1) : '';
        const folder3Name = folder3.toUpperCase();
        const displayName = svgResult.name.charAt(0).toUpperCase() + svgResult.name.slice(1).replace(/_/g, ' ');
        const displayPath = folder2 ? `${folder1Name} / ${folder2Name} / ${folder3Name} / ${displayName}` : `${folder1Name} / ${folder3Name} / ${displayName}`;
        folderFiles.push({ name: displayPath, file: `${basePath}/${svgResult.name}.svg` });
        foundAny = true;
      } else if (pngResult.exists) {
        const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
        const folder2Name = folder2 ? folder2.charAt(0).toUpperCase() + folder2.slice(1) : '';
        const folder3Name = folder3.toUpperCase();
        const displayName = pngResult.name.charAt(0).toUpperCase() + pngResult.name.slice(1).replace(/_/g, ' ');
        const displayPath = folder2 ? `${folder1Name} / ${folder2Name} / ${folder3Name} / ${displayName}` : `${folder1Name} / ${folder3Name} / ${displayName}`;
        folderFiles.push({ name: displayPath, file: `${basePath}/${pngResult.name}.png` });
        foundAny = true;
      }
    }
    
    // Проверяем числовые файлы (01-99)
    if (foundAny) {
      for (let batchStart = 1; batchStart <= 99; batchStart += 10) {
        const batchEnd = Math.min(batchStart + 9, 99);
        const batchPromises = [];
        
        for (let i = batchStart; i <= batchEnd; i++) {
          const num = i.toString().padStart(2, '0');
          batchPromises.push(
            checkFileExists(`${basePath}/${num}.svg`).then(exists => ({ num, exists, ext: 'svg' })),
            checkFileExists(`${basePath}/${num}.png`).then(exists => ({ num, exists, ext: 'png' }))
          );
        }
        
        const batchResults = await Promise.all(batchPromises);
        
        for (let i = 0; i < batchResults.length; i += 2) {
          const svgResult = batchResults[i];
          const pngResult = batchResults[i + 1];
          
          if (svgResult.exists) {
            const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
            const folder2Name = folder2 ? folder2.charAt(0).toUpperCase() + folder2.slice(1) : '';
            const folder3Name = folder3.toUpperCase();
            const displayPath = folder2 ? `${folder1Name} / ${folder2Name} / ${folder3Name} / ${svgResult.num}` : `${folder1Name} / ${folder3Name} / ${svgResult.num}`;
            folderFiles.push({ name: displayPath, file: `${basePath}/${svgResult.num}.svg` });
          } else if (pngResult.exists) {
            const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
            const folder2Name = folder2 ? folder2.charAt(0).toUpperCase() + folder2.slice(1) : '';
            const folder3Name = folder3.toUpperCase();
            const displayPath = folder2 ? `${folder1Name} / ${folder2Name} / ${folder3Name} / ${pngResult.num}` : `${folder1Name} / ${folder3Name} / ${pngResult.num}`;
            folderFiles.push({ name: displayPath, file: `${basePath}/${pngResult.num}.png` });
          }
        }
      }
    }
    
    return folderFiles;
  };
  
  // Функция для сканирования файлов в папке
  const scanFolder = async (folder1, folder2) => {
    const folderFiles = [];
    
    // Список известных именованных файлов для проверки
    const knownNames = ['main', 'main_mono', 'mono', 'long', 'logo', 'long_logo', 'black', 'white', 'icon', 'symbol', 'mark', 'emblem'];
    
    // Сначала проверяем именованные файлы
    const namedFilePromises = [];
    for (const name of knownNames) {
      namedFilePromises.push(
        checkFileExists(`logo/${folder1}/${folder2}/${name}.svg`).then(exists => ({ name, exists, ext: 'svg' })),
        checkFileExists(`logo/${folder1}/${folder2}/${name}.png`).then(exists => ({ name, exists, ext: 'png' }))
      );
    }
    
    const namedResults = await Promise.all(namedFilePromises);
    let foundAny = false;
    
    for (let i = 0; i < namedResults.length; i += 2) {
      const svgResult = namedResults[i];
      const pngResult = namedResults[i + 1];
      
      if (svgResult.exists) {
        const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
        const folder2Name = folder2.charAt(0).toUpperCase() + folder2.slice(1);
        const displayName = svgResult.name.charAt(0).toUpperCase() + svgResult.name.slice(1).replace(/_/g, ' ');
        folderFiles.push({ name: `${folder1Name} / ${folder2Name} / ${displayName}`, file: `logo/${folder1}/${folder2}/${svgResult.name}.svg` });
        foundAny = true;
      } else if (pngResult.exists) {
        const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
        const folder2Name = folder2.charAt(0).toUpperCase() + folder2.slice(1);
        const displayName = pngResult.name.charAt(0).toUpperCase() + pngResult.name.slice(1).replace(/_/g, ' ');
        folderFiles.push({ name: `${folder1Name} / ${folder2Name} / ${displayName}`, file: `logo/${folder1}/${folder2}/${pngResult.name}.png` });
        foundAny = true;
      }
    }
    
    // Затем проверяем числовые файлы (01-99)
    const quickCheckPromises = [];
    for (let i = 1; i <= 10; i++) {
      const num = i.toString().padStart(2, '0');
      quickCheckPromises.push(
        checkFileExists(`logo/${folder1}/${folder2}/${num}.svg`),
        checkFileExists(`logo/${folder1}/${folder2}/${num}.png`)
      );
    }
    
    const quickCheckResults = await Promise.all(quickCheckPromises);
    
    // Проверяем результаты быстрой проверки
    for (let i = 0; i < 10; i++) {
      const svgExists = quickCheckResults[i * 2];
      const pngExists = quickCheckResults[i * 2 + 1];
      const num = (i + 1).toString().padStart(2, '0');
      
      if (svgExists) {
        const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
        const folder2Name = folder2.charAt(0).toUpperCase() + folder2.slice(1);
        folderFiles.push({ name: `${folder1Name} / ${folder2Name} / ${num}`, file: `logo/${folder1}/${folder2}/${num}.svg` });
        foundAny = true;
      } else if (pngExists) {
        const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
        const folder2Name = folder2.charAt(0).toUpperCase() + folder2.slice(1);
        folderFiles.push({ name: `${folder1Name} / ${folder2Name} / ${num}`, file: `logo/${folder1}/${folder2}/${num}.png` });
        foundAny = true;
      }
    }
    
    // Если нашли хотя бы один файл, сканируем остальные
    if (foundAny) {
      // Сканируем файлы 11-99 батчами для оптимизации
      for (let batchStart = 11; batchStart <= 99; batchStart += 10) {
        const batchEnd = Math.min(batchStart + 9, 99);
        const batchPromises = [];
        
        for (let i = batchStart; i <= batchEnd; i++) {
          const num = i.toString().padStart(2, '0');
          batchPromises.push(
            checkFileExists(`logo/${folder1}/${folder2}/${num}.svg`).then(exists => ({ num, exists, ext: 'svg' })),
            checkFileExists(`logo/${folder1}/${folder2}/${num}.png`).then(exists => ({ num, exists, ext: 'png' }))
          );
        }
        
        const batchResults = await Promise.all(batchPromises);
        
        for (let i = 0; i < batchResults.length; i += 2) {
          const svgResult = batchResults[i];
          const pngResult = batchResults[i + 1];
          
          if (svgResult.exists) {
            const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
            const folder2Name = folder2.charAt(0).toUpperCase() + folder2.slice(1);
            folderFiles.push({ name: `${folder1Name} / ${folder2Name} / ${svgResult.num}`, file: `logo/${folder1}/${folder2}/${svgResult.num}.svg` });
          } else if (pngResult.exists) {
            const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
            const folder2Name = folder2.charAt(0).toUpperCase() + folder2.slice(1);
            folderFiles.push({ name: `${folder1Name} / ${folder2Name} / ${pngResult.num}`, file: `logo/${folder1}/${folder2}/${pngResult.num}.png` });
          }
        }
      }
    }
    
    return folderFiles;
  };
  
  // Сначала проверяем двухуровневую структуру (logo/folder1/folder3/file)
  // Например: logo/white/ru/main.svg - это white -> ru -> [файлы]
  for (const folder1 of firstLevelFolders) {
    for (const folder3 of thirdLevelFolders) {
      const folderFiles3 = await scanFolder3Level(folder1, '', folder3);
      
      if (folderFiles3.length > 0) {
        if (!logoStructure[folder1]) {
          logoStructure[folder1] = {};
        }
        // Сохраняем как двухуровневую структуру: folder1 -> folder3 -> [файлы]
        if (!logoStructure[folder1][folder3]) {
          logoStructure[folder1][folder3] = [];
        }
        folderFiles3.forEach(file => {
          if (!logoStructure[folder1][folder3].find(l => l.file === file.file)) {
            logoStructure[folder1][folder3].push(file);
          }
        });
      }
    }
  }
  
  // Если есть папки второго уровня, проверяем трехуровневую структуру с folder2
  if (secondLevelFolders.length > 0) {
    for (const folder1 of firstLevelFolders) {
      for (const folder2 of secondLevelFolders) {
        // Проверяем трехуровневую структуру (logo/folder1/folder2/folder3/file)
        for (const folder3 of thirdLevelFolders) {
          const folderFiles3 = await scanFolder3Level(folder1, folder2, folder3);
          
          if (folderFiles3.length > 0) {
            if (!logoStructure[folder1]) {
              logoStructure[folder1] = {};
            }
            if (!logoStructure[folder1][folder2]) {
              logoStructure[folder1][folder2] = {};
            }
            logoStructure[folder1][folder2][folder3] = folderFiles3;
          }
        }
        
        // Затем проверяем двухуровневую структуру (logo/folder1/folder2/file)
        const folderFiles = await scanFolder(folder1, folder2);
        
        if (folderFiles.length > 0) {
          if (!logoStructure[folder1]) {
            logoStructure[folder1] = {};
          }
          // Если уже есть трехуровневая структура, добавляем файлы в 'root'
          if (logoStructure[folder1][folder2] && typeof logoStructure[folder1][folder2] === 'object' && !Array.isArray(logoStructure[folder1][folder2])) {
            // Уже есть трехуровневая структура, добавляем в 'root'
            logoStructure[folder1][folder2]['root'] = folderFiles;
          } else {
            // Нет трехуровневой структуры, используем массив
            logoStructure[folder1][folder2] = folderFiles;
          }
        }
      }
    }
  }
  
  // Преобразуем структуру в плоский массив для обратной совместимости
  const logos = [];
  Object.keys(logoStructure).forEach((folder1) => {
    Object.keys(logoStructure[folder1]).forEach((folder2) => {
      const folder2Data = logoStructure[folder1][folder2];
      // Проверяем, является ли это трехуровневой структурой (объект с ключами folder3) или массивом
      if (Array.isArray(folder2Data)) {
        logos.push(...folder2Data);
      } else if (typeof folder2Data === 'object') {
        // Трехуровневая структура
        Object.keys(folder2Data).forEach((folder3) => {
          if (Array.isArray(folder2Data[folder3])) {
            logos.push(...folder2Data[folder3]);
          }
        });
      }
    });
  });
  
  // Также проверяем файлы в одноуровневой структуре (logo/folder1/file) для обратной совместимости
  const knownLogoFiles = [
    'black.svg', 'black.png',
    'long_black.svg', 'long_black.png',
    'long_white.svg', 'long_white.png',
    'white.svg', 'white.png',
    'logo.svg', 'logo.png',
    'long_logo.svg', 'long_logo.png',
    'main.svg', 'main.png',
    'main_mono.svg', 'main_mono.png',
    'mono.svg', 'mono.png',
    'long.svg', 'long.png',
    'icon.svg', 'icon.png',
    'symbol.svg', 'symbol.png',
    'mark.svg', 'mark.png',
    'emblem.svg', 'emblem.png'
  ];
  
  for (const folder1 of firstLevelFolders) {
    // Проверяем известные файлы
    for (const filename of knownLogoFiles) {
      const file = `logo/${folder1}/${filename}`;
      const exists = await checkFileExists(file);
      if (exists) {
        const baseName = filename.replace(/\.(svg|png)$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
        const name = `${folder1Name} / ${baseName}`;
        if (!logos.find(l => l.file === file)) {
          logos.push({ name, file });
        }
      }
    }
    
    // Проверяем числовые файлы в одноуровневой структуре (батчами для оптимизации)
    for (let batchStart = 1; batchStart <= 99; batchStart += 10) {
      const batchEnd = Math.min(batchStart + 9, 99);
      const batchPromises = [];
      
      for (let i = batchStart; i <= batchEnd; i++) {
        const num = i.toString().padStart(2, '0');
        batchPromises.push(
          checkFileExists(`logo/${folder1}/${num}.svg`).then(exists => ({ num, exists, ext: 'svg' })),
          checkFileExists(`logo/${folder1}/${num}.png`).then(exists => ({ num, exists, ext: 'png' }))
        );
      }
      
      const batchResults = await Promise.all(batchPromises);
      
      for (let i = 0; i < batchResults.length; i += 2) {
        const svgResult = batchResults[i];
        const pngResult = batchResults[i + 1];
        
        if (svgResult.exists) {
          const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
          if (!logos.find(l => l.file === `logo/${folder1}/${svgResult.num}.svg`)) {
            logos.push({ name: `${folder1Name} / ${svgResult.num}`, file: `logo/${folder1}/${svgResult.num}.svg` });
          }
        } else if (pngResult.exists) {
          const folder1Name = folder1.charAt(0).toUpperCase() + folder1.slice(1);
          if (!logos.find(l => l.file === `logo/${folder1}/${pngResult.num}.png`)) {
            logos.push({ name: `${folder1Name} / ${pngResult.num}`, file: `logo/${folder1}/${pngResult.num}.png` });
          }
        }
      }
    }
  }
  
  // Возвращаем структурированные данные вместо плоского массива
  return logoStructure;
};

// Сканирование KV из папки assets/ с динамическим обнаружением структуры
export const scanKV = async () => {
  const kvStructure = {};
  
  // Расширенный список возможных папок первого уровня
  // Убрали 'patterns' и 'elements' из первого уровня, так как реально используется только assets/3d/
  const firstLevelFolders = ['3d', '2d', 'icons', 'illustrations', 'photos', 'images', 'graphics', 'textures', 'vectors', 'backgrounds'];
  
  // Расширенный список возможных папок второго уровня
  // Включаем все известные папки, включая новые: logos, numbers, other, tech, yandex
  // Убрали 'elements' из второго уровня, так как такой папки нет в проекте
  const secondLevelFolders = ['sign', 'icons', 'backgrounds', 'patterns', 'shapes', 'vectors', 'textures', 'photos', 'illustrations', 'logos', 'numbers', 'other', 'tech', 'yandex'];
  
  // Функция для сканирования файлов в папке
  const scanFolder = async (folder1, folder2) => {
    const folderFiles = [];
    
    // Сначала проверяем первые 10 файлов, чтобы понять, существует ли папка
    let foundAny = false;
    const quickCheckPromises = [];
    
    for (let i = 1; i <= 10; i++) {
      const num = i.toString().padStart(2, '0');
      quickCheckPromises.push(
        checkFileExists(`assets/${folder1}/${folder2}/${num}.png`),
        checkFileExists(`assets/${folder1}/${folder2}/${num}.jpg`)
      );
    }
    
    const quickCheckResults = await Promise.all(quickCheckPromises);
    
    // Проверяем результаты быстрой проверки
    for (let i = 0; i < 10; i++) {
      const pngExists = quickCheckResults[i * 2];
      const jpgExists = quickCheckResults[i * 2 + 1];
      const num = (i + 1).toString().padStart(2, '0');
      
      if (pngExists) {
        folderFiles.push({ name: num, file: `assets/${folder1}/${folder2}/${num}.png` });
        foundAny = true;
      } else if (jpgExists) {
        folderFiles.push({ name: num, file: `assets/${folder1}/${folder2}/${num}.jpg` });
        foundAny = true;
      }
    }
    
    // Если нашли хотя бы один файл, сканируем остальные
    if (foundAny) {
      // Сканируем файлы 11-99 батчами для оптимизации
      for (let batchStart = 11; batchStart <= 99; batchStart += 10) {
        const batchEnd = Math.min(batchStart + 9, 99);
        const batchPromises = [];
        
        for (let i = batchStart; i <= batchEnd; i++) {
          const num = i.toString().padStart(2, '0');
          batchPromises.push(
            checkFileExists(`assets/${folder1}/${folder2}/${num}.png`).then(exists => ({ num, exists, ext: 'png' })),
            checkFileExists(`assets/${folder1}/${folder2}/${num}.jpg`).then(exists => ({ num, exists, ext: 'jpg' }))
          );
        }
        
        const batchResults = await Promise.all(batchPromises);
        
        for (let i = 0; i < batchResults.length; i += 2) {
          const pngResult = batchResults[i];
          const jpgResult = batchResults[i + 1];
          
          if (pngResult.exists) {
            folderFiles.push({ name: pngResult.num, file: `assets/${folder1}/${folder2}/${pngResult.num}.png` });
          } else if (jpgResult.exists) {
            folderFiles.push({ name: jpgResult.num, file: `assets/${folder1}/${folder2}/${jpgResult.num}.jpg` });
          }
        }
      }
    }
    
    return folderFiles;
  };
  
  // Сканируем все комбинации папок
  for (const folder1 of firstLevelFolders) {
    for (const folder2 of secondLevelFolders) {
      const folderFiles = await scanFolder(folder1, folder2);
      
      if (folderFiles.length > 0) {
        if (!kvStructure[folder1]) {
          kvStructure[folder1] = {};
        }
        kvStructure[folder1][folder2] = folderFiles;
      }
    }
  }
  
  return kvStructure;
};

// Маппинг названий начертаний на веса шрифтов
const FONT_WEIGHT_MAP = {
  'Thin': '100',
  'Light': '300',
  'Regular': '400',
  'Medium': '500',
  'Bold': '700',
  'Heavy': '800',
  'Black': '900'
};

// Маппинг названий начертаний на стили шрифтов
const FONT_STYLE_MAP = {
  'Italic': 'italic',
  'Oblique': 'oblique'
};

// Парсинг имени файла шрифта для извлечения информации
const parseFontFileName = (fileName, fontFamilyName) => {
  // Убираем расширение
  const nameWithoutExt = fileName.replace(/\.(ttf|otf|woff|woff2)$/i, '');
  
  // Убираем имя семейства из начала (если есть)
  // Поддерживаем форматы: "YS Text-Regular" или "YS Text Regular"
  let variantName = nameWithoutExt;
  
  // Проверяем формат с дефисом: "Family-Weight"
  if (nameWithoutExt.startsWith(fontFamilyName + '-')) {
    variantName = nameWithoutExt.substring(fontFamilyName.length + 1);
  } 
  // Проверяем формат с пробелом: "Family Weight"
  else if (nameWithoutExt.startsWith(fontFamilyName + ' ')) {
    variantName = nameWithoutExt.substring(fontFamilyName.length + 1);
  }
  // Если имя семейства совпадает с именем файла (без расширения), это Regular
  else if (nameWithoutExt === fontFamilyName) {
    variantName = 'Regular';
  }
  
  // Определяем стиль (italic)
  let style = 'normal';
  let weightName = variantName;
  
  // Проверяем наличие "Italic" в названии (может быть в конце или в середине)
  if (variantName.toLowerCase().includes('italic')) {
    style = 'italic';
    // Убираем "Italic" и пробелы вокруг него
    weightName = variantName.replace(/\s*italic\s*/i, '').trim();
    // Если после удаления "Italic" осталась пустая строка, это Regular Italic
    if (!weightName) {
      weightName = 'Regular';
    }
  }
  
  // Определяем вес по маппингу
  const weight = FONT_WEIGHT_MAP[weightName] || '400';
  
  return {
    weight,
    style,
    weightName: weightName || 'Regular',
    displayName: weightName === 'Regular' ? 'Regular' : weightName
  };
};

// Сканирование шрифтов из папки font/
// Возвращает массив объектов { family, name, file, weight, style }
export const scanFonts = async () => {
  const fonts = [];
  
  // Список известных папок со шрифтами
  // Можно расширить, если появятся новые папки
  const fontFolders = [
    'YS Text',
    'YS Text Cond',
    'YS Text Wide',
    'YS Display',
    'YS Display Cond',
    'YS Display Wide',
    'YS Logotype',
    'Yandex Serif Display'
  ];
  
  // Известные расширения шрифтов
  const fontExtensions = ['ttf', 'otf', 'woff', 'woff2'];
  
  // Известные начертания для проверки
  const knownWeights = ['Thin', 'Light', 'Regular', 'Medium', 'Bold', 'Heavy', 'Black'];
  const knownItalicWeights = knownWeights.map(w => w + ' Italic');
  const allKnownWeights = [...knownWeights, ...knownItalicWeights];
  
  // Сканируем каждую папку
  for (const folder of fontFolders) {
    const fontFamily = folder;
    
    // Сканируем файлы в папке
    // Проверяем известные начертания с дефисом и пробелами
    const fontPromises = [];
    
    // Формат с дефисом: "YS Text-Regular.ttf"
    for (const weightName of allKnownWeights) {
      for (const ext of fontExtensions) {
        const fileName = `${fontFamily}-${weightName}.${ext}`;
        const filePath = `font/${folder}/${fileName}`;
        fontPromises.push(
          checkFileExists(filePath).then(exists => ({
            exists,
            fileName,
            filePath,
            weightName,
            ext,
            format: 'hyphen'
          }))
        );
      }
    }
    
    // Формат с пробелом: "YS Text Regular.ttf"
    for (const weightName of allKnownWeights) {
      for (const ext of fontExtensions) {
        const fileName = `${fontFamily} ${weightName}.${ext}`;
        const filePath = `font/${folder}/${fileName}`;
        fontPromises.push(
          checkFileExists(filePath).then(exists => ({
            exists,
            fileName,
            filePath,
            weightName,
            ext,
            format: 'space'
          }))
        );
      }
    }
    
    // Также проверяем файлы без начертания в названии (только имя семейства)
    for (const ext of fontExtensions) {
      const fileName = `${fontFamily}.${ext}`;
      const filePath = `font/${folder}/${fileName}`;
      fontPromises.push(
        checkFileExists(filePath).then(exists => ({
          exists,
          fileName,
          filePath,
          weightName: 'Regular',
          ext,
          format: 'name-only'
        }))
      );
    }
    
    const fontResults = await Promise.all(fontPromises);
    
    // Обрабатываем найденные шрифты
    const foundFonts = new Map(); // Используем Map для избежания дубликатов
    
    for (const result of fontResults) {
      if (result.exists) {
        const parsed = parseFontFileName(result.fileName, fontFamily);
        const key = `${fontFamily}-${parsed.weight}-${parsed.style}`;
        
        // Если такой шрифт уже найден, пропускаем (приоритет: woff2 > woff > ttf > otf)
        if (foundFonts.has(key)) {
          const existing = foundFonts.get(key);
          const extPriority = { woff2: 4, woff: 3, ttf: 2, otf: 1 };
          if (extPriority[result.ext] > extPriority[existing.ext]) {
            foundFonts.set(key, { ...result, ...parsed });
          }
        } else {
          foundFonts.set(key, { ...result, ...parsed });
        }
      }
    }
    
    // Добавляем найденные шрифты в массив
    foundFonts.forEach((font) => {
      fonts.push({
        family: fontFamily,
        name: `${fontFamily} ${font.weightName}`,
        file: font.filePath,
        weight: font.weight,
        style: font.style,
        weightName: font.weightName
      });
    });
  }
  
  // Сортируем шрифты: сначала по семейству, затем по весу
  fonts.sort((a, b) => {
    if (a.family !== b.family) {
      return a.family.localeCompare(b.family);
    }
    return parseInt(a.weight) - parseInt(b.weight);
  });
  
  return fonts;
};

