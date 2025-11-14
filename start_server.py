#!/usr/bin/env python3
"""
Простой HTTP сервер для запуска проекта локально
"""
import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Добавляем заголовки CORS для работы с модулями
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Переходим в директорию скрипта
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Проверяем наличие index.html
    if not os.path.exists('index.html'):
        print("Ошибка: index.html не найден в текущей директории")
        sys.exit(1)
    
    # Создаем сервер
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"Сервер запущен на {url}")
        print(f"Откройте в браузере: {url}")
        print("Нажмите Ctrl+C для остановки сервера")
        
        # Автоматически открываем браузер
        try:
            webbrowser.open(url)
        except:
            pass
        
        # Запускаем сервер
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nСервер остановлен")

if __name__ == "__main__":
    main()

