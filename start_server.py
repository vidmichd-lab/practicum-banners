#!/usr/bin/env python3
"""
Простой HTTP сервер для запуска проекта локально
"""
import http.server
import socketserver
import webbrowser
import os
import sys
import socket
import traceback

PORT = 8000

def find_free_port(start_port=8000):
    """Находит свободный порт, начиная с start_port"""
    port = start_port
    while port < start_port + 100:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            port += 1
    raise RuntimeError(f"Не удалось найти свободный порт в диапазоне {start_port}-{start_port + 100}")

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Счетчики для статистики
    _assets_404_count = 0
    _js_404_count = 0
    _other_404_count = 0
    
    def translate_path(self, path):
        """Переводит URL путь в файловый путь"""
        try:
            # Сначала получаем стандартный путь
            translated = super().translate_path(path)
            
            # Если путь указывает на /state/ или /constants.js (без src/), перенаправляем на src/
            # Проверяем URL путь (не файловый путь)
            if path.startswith('/state/') and not path.startswith('/src/state/'):
                # Это запрос к /state/... без src/
                # Проверяем, существует ли файл в src/ директории
                src_path = os.path.join(os.getcwd(), 'src' + path)
                if os.path.exists(src_path):
                    return src_path
            
            # Обработка /constants.js -> src/constants.js
            if path.rstrip('/') == '/constants.js':
                src_path = os.path.join(os.getcwd(), 'src', 'constants.js')
                if os.path.exists(src_path):
                    return src_path
            
            # Если файла нет по стандартному пути, проверяем src/
            if not os.path.exists(translated):
                # Пытаемся найти файл в src/ директории
                if path.endswith('.js') and not path.startswith('/src/'):
                    src_path = os.path.join(os.getcwd(), 'src', path.lstrip('/'))
                    if os.path.exists(src_path):
                        return src_path
            
            return translated
        except Exception as e:
            print(f"❌ ОШИБКА в translate_path для пути '{path}': {e}")
            print(f"   Трассировка: {traceback.format_exc()}")
            # Возвращаем стандартный путь даже при ошибке
            return super().translate_path(path)
    
    def guess_type(self, path):
        """Определяет MIME-тип файла"""
        mimetype = super().guess_type(path)
        
        # Устанавливаем правильный MIME-тип для JavaScript модулей
        if path.endswith('.js'):
            return 'application/javascript'
        
        return mimetype
    
    def log_message(self, format, *args):
        """Логируем запросы для отладки"""
        # Логируем все запросы .js файлов и ошибки 404
        if len(args) >= 1:
            try:
                # Извлекаем путь и метод из лог-сообщения
                # Формат: "GET /path HTTP/1.1" или "HEAD /path HTTP/1.1"
                log_line = args[0] if isinstance(args[0], str) else str(args[0])
                method = 'GET'
                path = log_line
                
                if ' ' in log_line:
                    parts = log_line.split()
                    if len(parts) >= 2:
                        method = parts[0]  # GET, HEAD, POST и т.д.
                        path = parts[1]    # /path/to/file
                    elif len(parts) == 1:
                        path = parts[0]
                
                status = args[1] if len(args) > 1 else '200'
                
                # Логируем все запросы .js файлов
                if path.endswith('.js'):
                    if status == '404':
                        MyHTTPRequestHandler._js_404_count += 1
                        print(f"❌ 404 JS: {path}")
                        # Показываем, где искался файл
                        translated = self.translate_path(path)
                        print(f"   Искали по пути: {translated}")
                        if not os.path.exists(translated):
                            # Проверяем альтернативные пути
                            alt_paths = []
                            if path.startswith('/state/'):
                                alt_paths.append(os.path.join(os.getcwd(), 'src' + path))
                            if path.rstrip('/') == '/constants.js':
                                alt_paths.append(os.path.join(os.getcwd(), 'src', 'constants.js'))
                            if path.endswith('.js') and not path.startswith('/src/'):
                                alt_paths.append(os.path.join(os.getcwd(), 'src', path.lstrip('/')))
                            
                            for alt_path in alt_paths:
                                if os.path.exists(alt_path):
                                    print(f"   ⚠️  Файл найден по альтернативному пути: {alt_path}")
                                else:
                                    print(f"   ✗ Альтернативный путь не существует: {alt_path}")
                    else:
                        print(f"[{status}] JS: {path}")
                
                # Обработка ошибок 404
                elif len(args) >= 2 and args[1] == '404':
                    # Подавляем детальное логирование для HEAD запросов к assets/ (это нормальные проверки существования)
                    is_assets_check = (path.startswith('/assets/') or path.startswith('/logo/') or path.startswith('/font/'))
                    is_head_request = method.upper() == 'HEAD'
                    
                    if is_assets_check and is_head_request:
                        # Только считаем, не логируем детально
                        MyHTTPRequestHandler._assets_404_count += 1
                        # Показываем статистику каждые 50 запросов
                        if MyHTTPRequestHandler._assets_404_count % 50 == 0:
                            print(f"ℹ️  Проверено {MyHTTPRequestHandler._assets_404_count} несуществующих ресурсов (assets/logo/font/)...")
                    else:
                        # Детальное логирование для важных ошибок
                        MyHTTPRequestHandler._other_404_count += 1
                        print(f"❌ 404 ERROR: {path} ({method})")
                        translated = self.translate_path(path)
                        print(f"   Искали по пути: {translated}")
                        if not os.path.exists(translated):
                            # Проверяем альтернативные пути только для важных файлов
                            if path.startswith('/state/') or path.rstrip('/') == '/constants.js' or path.endswith('.js'):
                                alt_paths = []
                                if path.startswith('/state/'):
                                    alt_paths.append(os.path.join(os.getcwd(), 'src' + path))
                                if path.rstrip('/') == '/constants.js':
                                    alt_paths.append(os.path.join(os.getcwd(), 'src', 'constants.js'))
                                if path.endswith('.js') and not path.startswith('/src/'):
                                    alt_paths.append(os.path.join(os.getcwd(), 'src', path.lstrip('/')))
                                
                                for alt_path in alt_paths:
                                    if os.path.exists(alt_path):
                                        print(f"   ⚠️  Файл найден по альтернативному пути: {alt_path}")
                                    else:
                                        print(f"   ✗ Альтернативный путь не существует: {alt_path}")
            except Exception as e:
                print(f"❌ ОШИБКА в log_message: {e}")
                print(f"   Трассировка: {traceback.format_exc()}")
        
        # Для остальных запросов используем стандартное логирование
        super().log_message(format, *args)
    
    def do_GET(self):
        """Обработка GET запросов с детальным логированием ошибок"""
        try:
            super().do_GET()
        except Exception as e:
            print(f"❌ КРИТИЧЕСКАЯ ОШИБКА при обработке GET запроса '{self.path}': {e}")
            print(f"   Тип ошибки: {type(e).__name__}")
            print(f"   Трассировка:")
            traceback.print_exc()
            # Пытаемся отправить ответ об ошибке
            try:
                self.send_error(500, f"Internal Server Error: {str(e)}")
            except:
                pass
    
    def do_OPTIONS(self):
        """Обработка OPTIONS запросов для CORS"""
        try:
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
        except Exception as e:
            print(f"❌ ОШИБКА в do_OPTIONS: {e}")
            traceback.print_exc()
    
    def end_headers(self):
        """Добавляет заголовки CORS"""
        try:
            # Добавляем заголовки CORS для работы с модулями
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
        except Exception as e:
            print(f"❌ ОШИБКА в end_headers: {e}")
            traceback.print_exc()
            try:
                super().end_headers()
            except:
                pass

def main():
    try:
        # Переходим в директорию скрипта
        script_dir = os.path.dirname(os.path.abspath(__file__))
        print(f"📁 Рабочая директория: {script_dir}")
        os.chdir(script_dir)
        
        # Проверяем наличие index.html
        if not os.path.exists('index.html'):
            print("❌ ОШИБКА: index.html не найден в текущей директории")
            print(f"   Искали в: {os.getcwd()}")
            sys.exit(1)
        print("✓ index.html найден")
        
        # Проверяем наличие src/ директории
        if not os.path.exists('src'):
            print("⚠️  ПРЕДУПРЕЖДЕНИЕ: директория src/ не найдена")
        else:
            print("✓ Директория src/ найдена")
        
        # Находим свободный порт
        try:
            actual_port = find_free_port(PORT)
            if actual_port != PORT:
                print(f"⚠️  Порт {PORT} занят, используем порт {actual_port}")
            else:
                print(f"✓ Порт {actual_port} свободен")
        except RuntimeError as e:
            print(f"❌ ОШИБКА при поиске свободного порта: {e}")
            sys.exit(1)
        
        # Создаем сервер
        print(f"\n🚀 Запуск сервера...")
        with socketserver.TCPServer(("", actual_port), MyHTTPRequestHandler) as httpd:
            url = f"http://localhost:{actual_port}"
            print(f"\n{'='*60}")
            print(f"✅ Сервер успешно запущен на {url}")
            print(f"{'='*60}")
            print(f"Откройте в браузере: {url}")
            print("Нажмите Ctrl+C для остановки сервера")
            print(f"{'='*60}\n")
            
            # Автоматически открываем браузер
            try:
                webbrowser.open(url)
            except Exception as e:
                print(f"⚠️  Не удалось открыть браузер автоматически: {e}")
            
            # Запускаем сервер
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n\n🛑 Сервер остановлен пользователем")
                # Показываем статистику при остановке
                total_404 = (MyHTTPRequestHandler._assets_404_count + 
                            MyHTTPRequestHandler._js_404_count + 
                            MyHTTPRequestHandler._other_404_count)
                if total_404 > 0:
                    print(f"\n📊 Статистика 404 ошибок:")
                    if MyHTTPRequestHandler._assets_404_count > 0:
                        print(f"   - Проверки ресурсов (assets/logo/font/): {MyHTTPRequestHandler._assets_404_count}")
                    if MyHTTPRequestHandler._js_404_count > 0:
                        print(f"   - JS файлы: {MyHTTPRequestHandler._js_404_count}")
                    if MyHTTPRequestHandler._other_404_count > 0:
                        print(f"   - Другие: {MyHTTPRequestHandler._other_404_count}")
            except Exception as e:
                print(f"\n❌ КРИТИЧЕСКАЯ ОШИБКА сервера: {e}")
                print(f"   Тип ошибки: {type(e).__name__}")
                print(f"   Трассировка:")
                traceback.print_exc()
                sys.exit(1)
    except Exception as e:
        print(f"\n❌ КРИТИЧЕСКАЯ ОШИБКА при запуске: {e}")
        print(f"   Тип ошибки: {type(e).__name__}")
        print(f"   Трассировка:")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

