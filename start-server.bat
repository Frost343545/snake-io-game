@echo off
echo ========================================
echo    Запуск WebSocket сервера Snake.io
echo ========================================
echo.

echo Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Node.js не установлен!
    echo Скачайте Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js найден!
echo.

echo Установка зависимостей...
npm install
if errorlevel 1 (
    echo ОШИБКА: Не удалось установить зависимости!
    pause
    exit /b 1
)

echo.
echo Запуск сервера...
echo Сервер будет доступен по адресу: ws://localhost:3000
echo.
echo Для остановки сервера нажмите Ctrl+C
echo.

npm start

pause 