# Инструкция по деплою в Yandex Object Storage

Этот документ описывает актуальный процесс публикации статического сайта из текущего репозитория в бакет `practicum-banners` на Yandex Object Storage.

## Предварительные требования

1. **Установите AWS CLI** (совместим с Yandex S3):
   ```bash
   # macOS
   brew install awscli
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install awscli
   
   # Или скачайте с официального сайта
   # https://aws.amazon.com/cli/
   ```

2. **Получите ключи доступа** в Yandex Cloud:
   - Перейдите в [Yandex Cloud Console](https://console.cloud.yandex.ru/)
   - Откройте раздел "Сервисные аккаунты"
   - Создайте сервисный аккаунт или используйте существующий
   - Создайте статический ключ доступа

## Настройка AWS CLI для Yandex Object Storage

Настройте AWS CLI для работы с Yandex Object Storage:

```bash
aws configure set aws_access_key_id YOUR_ACCESS_KEY
aws configure set aws_secret_access_key YOUR_SECRET_KEY
aws configure set region ru-central1
```

Или создайте файл `~/.aws/credentials` вручную:

```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

И файл `~/.aws/config`:

```ini
[default]
region = ru-central1
```

## Создание бакета (если ещё не создан)

Если бакет `practicum-banners` ещё не создан, создайте его через консоль Yandex Cloud или выполните:

```bash
aws --endpoint-url=https://storage.yandexcloud.net s3 mb s3://practicum-banners
```

## Автоматический деплой

Основной скрипт деплоя в репозитории: `deploy.sh`.

Поддерживаются два режима:

- `./deploy.sh` — инкрементальный деплой. Скрипт сравнивает локальные файлы с объектами в бакете и хранит локальный `.deploy-manifest` для ускорения повторных запусков.
- `./deploy.sh --full` — полная синхронизация бакета через `aws s3 sync --dryrun` с последующей загрузкой изменённых файлов и удалением объектов, отсутствующих локально.

Используйте скрипт `deploy.sh` для автоматического деплоя:

```bash
chmod +x deploy.sh
./deploy.sh
```

Скрипт автоматически:
- ✅ Проверит наличие AWS CLI
- ✅ Проверит существование бакета (создаст, если нужно)
- ✅ Настроит публичный доступ
- ✅ Включит хостинг статического сайта
- ✅ Настроит CORS
- ✅ При необходимости запустит конвертацию изображений в WebP через `compress_images.py`
- ✅ При необходимости запустит конвертацию новых шрифтов в WOFF2 через `convert_fonts_to_woff2.py`
- ✅ Загрузит только изменённые файлы с корректными `Content-Type` и `Cache-Control`
- ✅ Очистит старые PNG/JPG из бакета, если для них уже существует WebP-версия

## Что не попадает в бакет

Скрипт не должен публиковать служебные и локальные файлы, в том числе:

- `.git/*`, `.gitignore`, `.gitattributes`
- `__pycache__/*`, `*.pyc`
- `*.md`
- `*.py`
- `deploy.sh`, `deploy-*.sh`, `run_*.sh`
- `compress_images.py`

Отдельно стоит учитывать, что `.deploy-manifest` создаётся локально для инкрементального режима и может потребовать ручного удаления, если состояние деплоя разошлось с бакетом.

## Ручной деплой

Если хотите выполнить деплой вручную:

### 1. Загрузка файлов

```bash
aws --endpoint-url=https://storage.yandexcloud.net s3 sync ./ s3://practicum-banners/ \
  --exclude ".DS_Store" \
  --exclude "__pycache__/*" \
  --exclude "*.pyc" \
  --exclude ".git/*" \
  --exclude ".gitignore" \
  --exclude ".gitattributes" \
  --exclude "*.md" \
  --exclude "*.py" \
  --exclude "deploy*.sh" \
  --exclude "run_*.sh" \
  --exclude "compress_images.py" \
  --delete
```

### 2. Настройка публичного доступа

В консоли Yandex Cloud:
1. Откройте бакет `practicum-banners`
2. Перейдите в раздел "Доступ"
3. Включите "Публичный доступ на чтение объектов" и "Публичный доступ на чтение списка объектов"

Или через CLI:

```bash
aws --endpoint-url=https://storage.yandexcloud.net s3api put-bucket-acl \
  --bucket practicum-banners \
  --acl public-read
```

### 3. Включение хостинга статического сайта

В консоли Yandex Cloud:
1. Откройте бакет `practicum-banners`
2. Перейдите в раздел "Веб-сайт"
3. Включите хостинг
4. Укажите главную страницу: `index.html`
5. Укажите страницу ошибки: `index.html` (опционально)

Или через CLI:

```bash
cat > website-config.json << EOF
{
    "IndexDocument": {
        "Suffix": "index.html"
    },
    "ErrorDocument": {
        "Key": "index.html"
    }
}
EOF

aws --endpoint-url=https://storage.yandexcloud.net s3api put-bucket-website \
  --bucket practicum-banners \
  --website-configuration file://website-config.json

rm website-config.json
```

### 4. Настройка Content-Type

Убедитесь, что файлы имеют правильные Content-Type:

```bash
# HTML
aws --endpoint-url=https://storage.yandexcloud.net s3 cp \
  s3://practicum-banners/index.html s3://practicum-banners/index.html \
  --content-type "text/html; charset=utf-8" \
  --metadata-directive REPLACE

# CSS
aws --endpoint-url=https://storage.yandexcloud.net s3 cp \
  s3://practicum-banners/styles.css s3://practicum-banners/styles.css \
  --content-type "text/css; charset=utf-8" \
  --metadata-directive REPLACE

# JavaScript
aws --endpoint-url=https://storage.yandexcloud.net s3 cp \
  s3://practicum-banners/src/main.js s3://practicum-banners/src/main.js \
  --content-type "application/javascript; charset=utf-8" \
  --metadata-directive REPLACE
```

## Доступ к сайту

После деплоя сайт будет доступен по адресу:

**Основной URL:**
```
https://practicum-banners.website.yandexcloud.net
```

**Альтернативный URL:**
```
https://practicum-banners.storage.yandexcloud.net
```

## Настройка собственного домена (опционально)

1. В консоли Yandex Cloud откройте бакет `practicum-banners`
2. Перейдите в раздел "Веб-сайт"
3. Укажите свой домен в настройках
4. Настройте DNS-запись CNAME, указывающую на хостинг Yandex Object Storage
5. В Yandex Certificate Manager добавьте TLS-сертификат для HTTPS

## GitHub Actions

В репозитории есть workflow `.github/workflows/deploy.yml`.

Он работает отдельно от `deploy.sh`:

- запускается при `push` в `main`;
- определяет список изменённых файлов между `HEAD~1` и `HEAD`;
- загружает только изменённые файлы в S3 через `s3cmd`;
- удаляет объекты из бакета, если файл был удалён в репозитории.

Для workflow нужны секреты:

- `YC_BUCKET_NAME`
- `YC_ACCESS_KEY_ID`
- `YC_SECRET_ACCESS_KEY`

## Обновление сайта

Для обновления сайта просто запустите скрипт деплоя снова:

```bash
./deploy.sh
```

По умолчанию скрипт загружает только реально изменённые файлы. Если изменения не подхватились из-за локального манифеста или кеша, используйте:

```bash
./deploy.sh --full
```

или удалите локальный `.deploy-manifest` и повторите обычный запуск.

## Устранение проблем

### Ошибка доступа

Если получаете ошибку доступа, проверьте:
1. Правильность ключей доступа
2. Права сервисного аккаунта на бакет
3. Настройки публичного доступа

### Файлы не загружаются

Проверьте:
1. Наличие AWS CLI: `aws --version`
2. Настройку credentials: `aws configure list`
3. Доступность endpoint: `aws --endpoint-url=https://storage.yandexcloud.net s3 ls`
4. Не мешает ли локальный `.deploy-manifest` обнаружению изменений

### Неправильные Content-Type

Если файлы загружаются с неправильным Content-Type, используйте команды из раздела "Настройка Content-Type" выше.

## Дополнительные ресурсы

- [Документация Yandex Object Storage](https://cloud.yandex.ru/docs/storage/)
- [Документация AWS CLI](https://docs.aws.amazon.com/cli/)
- [Настройка хостинга статического сайта](https://cloud.yandex.ru/docs/storage/operations/hosting/setup)
