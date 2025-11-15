# Руководство по написанию кода

**Этот файл содержит правила и принципы, которым должен следовать AI-агент при написании кода для этого проекта.**

---

## 🎯 Основные принципы

### 1. Чистый код
- **Читаемость превыше всего** - код должен быть понятен без комментариев
- **Один уровень абстракции** - функции должны делать одну вещь и делать её хорошо
- **Осмысленные имена** - переменные и функции должны иметь понятные названия
- **Избегайте магических чисел** - используйте константы с понятными именами
- **DRY (Don't Repeat Yourself)** - не дублируйте код, выносите в функции/модули

### 2. Структура и организация
- **Модульность** - разбивайте код на логические модули
- **Разделение ответственности** - каждый модуль отвечает за свою область
- **Иерархия импортов** - сначала внешние, потом внутренние модули
- **Экспорты в конце** - группируйте экспорты в конце файла

### 3. JavaScript/ES6+ стандарты
- **Используйте ES6+ синтаксис** - `const/let`, стрелочные функции, деструктуризация
- **Модули ES6** - используйте `import/export`, не `require/module.exports`
- **Строгий режим** - код должен работать в строгом режиме
- **Асинхронность** - используйте `async/await` вместо промисов с `.then()`

---

## 📝 Правила написания кода

### Именование

```javascript
// ✅ ХОРОШО
const calculateTextArea = (width, height) => { ... }
const isHorizontalLayout = layoutType.isHorizontal;
const MAX_RETRY_COUNT = 3;

// ❌ ПЛОХО
const calc = (w, h) => { ... }
const flag = layoutType.h;
const max = 3;
```

**Правила:**
- Функции: `camelCase`, глаголы (`calculate`, `render`, `update`, `get`, `set`)
- Константы: `UPPER_SNAKE_CASE`
- Классы: `PascalCase`
- Переменные: `camelCase`, существительные
- Булевы переменные: начинаются с `is`, `has`, `should`, `can`

### Функции

```javascript
// ✅ ХОРОШО - одна ответственность, понятное имя
const calculatePadding = (percent, minDimension) => {
  return (percent / 100) * minDimension;
};

// ✅ ХОРОШО - маленькая функция, делает одну вещь
const isFileExists = async (path) => {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// ❌ ПЛОХО - слишком много ответственности
const doEverything = (data) => {
  // валидация
  // обработка
  // рендеринг
  // сохранение
  // логирование
};
```

**Правила:**
- Максимум 20-30 строк на функцию
- Один уровень абстракции
- Не более 3-4 параметров (используйте объекты для большего количества)
- Избегайте побочных эффектов
- Возвращайте значения, не мутируйте входные параметры

### Обработка ошибок

```javascript
// ✅ ХОРОШО - явная обработка ошибок
try {
  const result = await loadData();
  return result;
} catch (error) {
  console.error('Ошибка загрузки данных:', error);
  throw new Error(`Не удалось загрузить данные: ${error.message}`);
}

// ✅ ХОРОШО - graceful degradation
const loadImage = async (src) => {
  try {
    const img = await loadImageAsync(src);
    return img;
  } catch (error) {
    console.warn('Не удалось загрузить изображение:', src);
    return null; // Возвращаем null вместо падения
  }
};

// ❌ ПЛОХО - игнорирование ошибок
const loadData = async () => {
  const result = await fetch(url); // Что если ошибка?
  return result.json();
};
```

**Правила:**
- Всегда обрабатывайте ошибки явно
- Логируйте ошибки с контекстом
- Используйте try/catch для асинхронных операций
- Предоставляйте fallback значения где возможно

### Комментарии

```javascript
// ✅ ХОРОШО - объясняет "почему", не "что"
// Увеличиваем отступы для супер широких форматов,
// чтобы текст не прилипал к краям на очень широких экранах
const effectivePadding = isSuperWide 
  ? padding * PADDING_MULTIPLIER_SUPER_WIDE 
  : padding;

// ✅ ХОРОШО - JSDoc для публичных функций
/**
 * Вычисляет область для текста с учетом KV и логотипа
 * @param {number} width - Ширина canvas
 * @param {number} height - Высота canvas
 * @param {Object} layoutType - Тип макета
 * @returns {Object} Объект с textArea и maxTextWidth
 */
export const calculateTextArea = (width, height, layoutType) => {
  // ...
};

// ❌ ПЛОХО - очевидные комментарии
// Увеличиваем padding
const padding = padding * 2;
```

**Правила:**
- Комментируйте "почему", а не "что"
- Используйте JSDoc для публичных API
- Удаляйте закомментированный код
- Обновляйте комментарии при изменении кода

### Импорты и экспорты

```javascript
// ✅ ХОРОШО - группировка и порядок
// 1. Внешние зависимости
import { renderer } from './renderer.js';

// 2. Внутренние модули (по алфавиту)
import { getState, setKey } from '../state/store.js';
import { AVAILABLE_FONTS } from '../constants.js';

// 3. Утилиты
import { calculateTextArea } from './layout.js';

// ✅ ХОРОШО - именованные экспорты
export const calculatePadding = (percent, minDimension) => { ... };
export const isHorizontalLayout = (width, height) => { ... };

// ❌ ПЛОХО - default экспорты (кроме главных модулей)
export default { calculatePadding, isHorizontalLayout };
```

**Правила:**
- Группируйте импорты: внешние → внутренние → утилиты
- Сортируйте импорты по алфавиту внутри группы
- Используйте именованные экспорты (кроме `main.js`, `renderer.js`)
- Всегда указывайте расширение `.js` в импортах

### Работа с состоянием

```javascript
// ✅ ХОРОШО - неизменяемость
const updateState = (key, value) => {
  setState(prevState => ({
    ...prevState,
    [key]: value
  }));
};

// ✅ ХОРОШО - деструктуризация
const { isUltraWide, isSuperWide, isHorizontalLayout } = layoutType;

// ❌ ПЛОХО - мутация состояния
const updateState = (key, value) => {
  state[key] = value; // Прямая мутация!
};
```

**Правила:**
- Не мутируйте состояние напрямую
- Используйте деструктуризацию для извлечения значений
- Создавайте новые объекты/массивы вместо мутации

### Асинхронный код

```javascript
// ✅ ХОРОШО - async/await
const loadData = async () => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка:', error);
    throw error;
  }
};

// ✅ ХОРОШО - параллельная загрузка
const loadAllAssets = async () => {
  const [fonts, logos, kv] = await Promise.all([
    scanFonts(),
    scanLogos(),
    scanKV()
  ]);
  return { fonts, logos, kv };
};

// ❌ ПЛОХО - callback hell
loadData((data) => {
  processData(data, (result) => {
    saveResult(result, (saved) => {
      // ...
    });
  });
});
```

**Правила:**
- Используйте `async/await` вместо промисов с `.then()`
- Используйте `Promise.all()` для параллельных операций
- Всегда обрабатывайте ошибки в async функциях

---

## 🏗️ Архитектурные принципы

### Модульная структура

```
src/
  ├── main.js              # Точка входа
  ├── renderer.js          # Главный рендерер
  ├── constants.js         # Глобальные константы
  ├── state/               # Управление состоянием
  │   └── store.js
  ├── ui/                  # Пользовательский интерфейс
  │   ├── ui.js
  │   ├── components/      # UI компоненты
  │   └── ...
  ├── renderer/            # Модули рендеринга
  │   ├── canvas.js
  │   ├── layout.js
  │   └── ...
  └── utils/               # Утилиты
      └── assetScanner.js
```

**Правила:**
- Каждый модуль в отдельном файле
- Модули группируются по функциональности
- Импорты только из родительских/сиблинговых модулей
- Нет циклических зависимостей

### Разделение ответственности

- **UI модули** - только работа с DOM и событиями
- **Renderer модули** - только рендеринг на canvas
- **State модули** - только управление состоянием
- **Utils модули** - только утилитарные функции

---

## 🐛 Отладка и логирование

```javascript
// ✅ ХОРОШО - информативные логи
console.log('Начинаем рендеринг превью, размеров:', sizes.length);
console.error('Ошибка загрузки логотипа:', error);
console.warn('Не все canvas элементы найдены');

// ✅ ХОРОШО - логирование с контекстом
console.error('Ошибка рендеринга узкого формата:', {
  error: error.message,
  canvasId: canvas.id,
  width,
  height
});

// ❌ ПЛОХО - бесполезные логи
console.log('here');
console.log(data);
```

**Правила:**
- Используйте `console.log` для информации
- Используйте `console.error` для ошибок
- Используйте `console.warn` для предупреждений
- Всегда включайте контекст в логи
- Удаляйте отладочные логи перед коммитом

---

## ⚡ Производительность

```javascript
// ✅ ХОРОШО - кэширование
const textMeasurementCache = new Map();
const measureText = (text, font) => {
  const key = `${font}__${text}`;
  if (textMeasurementCache.has(key)) {
    return textMeasurementCache.get(key);
  }
  const result = expensiveMeasurement(text, font);
  textMeasurementCache.set(key, result);
  return result;
};

// ✅ ХОРОШО - debounce для частых событий
const debouncedRender = debounce(() => {
  renderer.render();
}, 100);

// ❌ ПЛОХО - пересчет на каждом рендере
const measureText = (text, font) => {
  return expensiveMeasurement(text, font); // Вызывается каждый раз!
};
```

**Правила:**
- Кэшируйте дорогие вычисления
- Используйте debounce/throttle для частых событий
- Избегайте ненужных перерисовок
- Оптимизируйте циклы и рекурсию

---

## 🔒 Безопасность

```javascript
// ✅ ХОРОШО - валидация входных данных
const updateState = (key, value) => {
  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error('Ключ должен быть непустой строкой');
  }
  // ...
};

// ✅ ХОРОШО - санитизация
const sanitizePath = (path) => {
  return path.replace(/[^a-zA-Z0-9/._-]/g, '');
};

// ❌ ПЛОХО - доверие к пользовательскому вводу
const loadFile = (path) => {
  return fetch(path); // Что если path = "../../../etc/passwd"?
};
```

**Правила:**
- Валидируйте все пользовательские данные
- Санитизируйте пути к файлам
- Не доверяйте внешним данным
- Используйте параметризованные запросы

---

## 📋 Чеклист перед коммитом

- [ ] Код следует принципам чистого кода
- [ ] Все функции имеют понятные имена
- [ ] Нет дублирования кода
- [ ] Обработаны все ошибки
- [ ] Удалены отладочные логи
- [ ] Обновлены комментарии (если нужно)
- [ ] Проверены все импорты
- [ ] Код протестирован вручную
- [ ] Нет console.log для отладки
- [ ] Код соответствует стилю проекта

---

## 🎨 Стиль кода

### Отступы и форматирование
- **2 пробела** для отступов (не табы)
- **Точка с запятой** в конце строк
- **Одинарные кавычки** для строк (если нет необходимости в двойных)
- **Пробелы** вокруг операторов и после запятых

```javascript
// ✅ ХОРОШО
const result = calculate(width, height);
const obj = { x: 10, y: 20 };
if (condition) {
  doSomething();
}

// ❌ ПЛОХО
const result=calculate(width,height);
const obj={x:10,y:20};
if(condition){doSomething();}
```

### Длина строк
- Максимум **100-120 символов** на строку
- Перенос длинных строк с отступом

```javascript
// ✅ ХОРОШО
const longFunction = (
  veryLongParameter1,
  veryLongParameter2,
  veryLongParameter3
) => {
  // ...
};

// ❌ ПЛОХО
const longFunction = (veryLongParameter1, veryLongParameter2, veryLongParameter3) => { ... };
```

---

## 🚫 Что НЕ делать

- ❌ Не использовать `var` (только `const` и `let`)
- ❌ Не мутировать параметры функций
- ❌ Не создавать глобальные переменные
- ❌ Не использовать `==` (только `===` и `!==`)
- ❌ Не оставлять `console.log` в продакшн коде
- ❌ Не игнорировать ошибки
- ❌ Не создавать функции длиннее 50 строк
- ❌ Не использовать магические числа
- ❌ Не создавать циклические зависимости
- ❌ Не дублировать код

---

## 📚 Дополнительные ресурсы

- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [JavaScript Best Practices](https://www.w3schools.com/js/js_best_practices.asp)
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)

---

**Помните:** Код пишется один раз, но читается множество раз. Пишите код так, чтобы его было легко понять и поддерживать.

