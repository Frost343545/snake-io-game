// Главный файл инициализации игры
class SnakeIO {
    constructor() {
        this.game = null;
        this.ui = null;
        this.networkManager = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        // Дождаться загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.start();
            });
        } else {
            this.start();
        }
    }
    
    start() {
        console.log('Инициализация Snake.io...');
        
        // Инициализация UI
        this.ui = new UI();
        
        // Инициализация сетевого менеджера
        this.networkManager = window.networkManager;
        
        // Загрузка настроек сети
        this.loadNetworkSettings();
        
        // Настройка интеграции
        this.setupIntegration();
        
        // Настройка обработчиков событий
        this.setupEventHandlers();
        
        // Настройка адаптивности
        this.setupResponsive();
        
        // Настройка доступности
        this.setupAccessibility();
        
        // Настройка производительности
        this.setupPerformance();
        
        this.isInitialized = true;
        console.log('Snake.io инициализирована!');
    }
    
    setupIntegration() {
        // Связать UI с игрой
        this.ui.onGameStart = (canvas) => {
            this.startGame(canvas);
        };
        
        // Связать сетевой менеджер с игрой
        this.networkManager.setGame = (game) => {
            this.networkManager.game = game;
            this.networkManager.startUpdateLoop();
        };
    }
    
    loadNetworkSettings() {
        const defaultSettings = {
            localMode: true,
            autoReconnect: true
        };
        
        const savedSettings = localStorage.getItem('snakeNetworkSettings');
        const settings = savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
        
        // Применить настройки к сетевому менеджеру
        this.networkManager.useLocalMode = settings.localMode;
        this.networkManager.autoReconnect = settings.autoReconnect;
        
        console.log('Настройки сети загружены:', settings);
    }
    
    setupEventHandlers() {
        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Обработка видимости страницы
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // Обработка полноэкранного режима
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });
        
        // Обработка ошибок
        window.addEventListener('error', (event) => {
            this.handleError(event.error);
        });
        
        // Обработка необработанных промисов
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event.reason);
        });
    }
    
    setupResponsive() {
        // Определить тип устройства
        this.deviceType = this.getDeviceType();
        
        // Настроить интерфейс в зависимости от устройства
        this.configureForDevice();
        
        // Обработка изменения ориентации
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
    }
    
    setupAccessibility() {
        // Добавить поддержку клавиатурной навигации
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Добавить ARIA-атрибуты
        this.addAriaAttributes();
        
        // Настройка фокуса
        this.setupFocusManagement();
    }
    
    setupPerformance() {
        // Настройка FPS
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        
        // Мониторинг производительности
        this.setupPerformanceMonitoring();
        
        // Оптимизация рендеринга
        this.setupRenderOptimization();
    }
    
    startGame(canvas) {
        console.log('Запуск игры...');
        
        // Создать игровой экземпляр
        this.game = new SnakeGame(canvas);
        
        // Связать с сетевым менеджером
        this.networkManager.setGame(this.game);
        
        // Начать сетевое взаимодействие
        this.networkManager.connect();
        
        // Для демонстрации можно включить локальную симуляцию
        if (this.networkManager instanceof LocalNetworkManager) {
            this.networkManager.simulateLocalMultiplayer();
        }
        
        console.log('Игра запущена!');
    }
    
    handleResize() {
        if (this.game) {
            this.game.resizeCanvas();
        }
        
        if (this.ui) {
            this.ui.handleResize();
        }
        
        // Пересчитать размеры для мобильных устройств
        this.configureForDevice();
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Страница скрыта - приостановить игру
            if (this.game && this.game.isRunning) {
                this.game.togglePause();
            }
        } else {
            // Страница видна - возобновить игру
            if (this.game && this.game.isPaused) {
                this.game.togglePause();
            }
        }
    }
    
    handleFullscreenChange() {
        // Обновить размеры при изменении полноэкранного режима
        setTimeout(() => {
            this.handleResize();
        }, 100);
    }
    
    handleOrientationChange() {
        // Обработка изменения ориентации на мобильных устройствах
        this.handleResize();
        
        // Показать уведомление о повороте экрана
        if (this.deviceType === 'mobile') {
            this.ui.showNotification('Поверните устройство для лучшего игрового опыта');
        }
    }
    
    handleKeyboardNavigation(e) {
        // Навигация по меню с клавиатуры
        if (this.ui.currentScreen === 'mainMenu') {
            switch (e.key) {
                case '1':
                    this.ui.startGame();
                    break;
                case '2':
                    this.ui.showCustomizeScreen();
                    break;
                case '3':
                    this.ui.showLeaderboardScreen();
                    break;
                case '4':
                    this.ui.showHelpScreen();
                    break;
            }
        }
        
        // Горячие клавиши
        switch (e.key) {
            case 'F11':
                e.preventDefault();
                this.ui.toggleFullscreen();
                break;
            case 'Escape':
                if (this.ui.currentScreen === 'game' && this.game) {
                    this.game.togglePause();
                }
                break;
        }
    }
    
    handleError(error) {
        console.error('Ошибка игры:', error);
        
        if (this.ui) {
            this.ui.showNotification('Произошла ошибка. Попробуйте перезагрузить страницу.', 'error');
        }
    }
    
    handlePromiseRejection(reason) {
        console.error('Необработанная ошибка промиса:', reason);
    }
    
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/mobile|android|iphone|ipad|phone/.test(userAgent)) {
            return 'mobile';
        } else if (/tablet|ipad/.test(userAgent)) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }
    
    configureForDevice() {
        const deviceType = this.getDeviceType();
        
        // Настройки для мобильных устройств
        if (deviceType === 'mobile') {
            this.configureMobile();
        } else if (deviceType === 'tablet') {
            this.configureTablet();
        } else {
            this.configureDesktop();
        }
    }
    
    configureMobile() {
        // Показать мобильные элементы управления
        const mobileControls = document.querySelector('.mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = 'block';
        }
        
        // Уменьшить размеры элементов интерфейса
        document.body.classList.add('mobile-device');
        
        // Настроить размеры канваса
        if (this.game) {
            this.game.gridSize = 15; // Меньший размер сетки для мобильных
        }
    }
    
    configureTablet() {
        // Промежуточные настройки для планшетов
        document.body.classList.add('tablet-device');
        
        if (this.game) {
            this.game.gridSize = 18;
        }
    }
    
    configureDesktop() {
        // Настройки для десктопа
        document.body.classList.add('desktop-device');
        
        // Скрыть мобильные элементы управления
        const mobileControls = document.querySelector('.mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = 'none';
        }
        
        if (this.game) {
            this.game.gridSize = 20;
        }
    }
    
    addAriaAttributes() {
        // Добавить ARIA-атрибуты к основным элементам
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            mainMenu.setAttribute('role', 'main');
            mainMenu.setAttribute('aria-label', 'Главное меню Snake.io');
        }
        
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            gameCanvas.setAttribute('role', 'application');
            gameCanvas.setAttribute('aria-label', 'Игровое поле');
        }
        
        // Добавить ARIA-атрибуты к кнопкам
        const buttons = document.querySelectorAll('button');
        buttons.forEach((button, index) => {
            button.setAttribute('tabindex', '0');
            if (!button.getAttribute('aria-label')) {
                button.setAttribute('aria-label', button.textContent.trim());
            }
        });
    }
    
    setupFocusManagement() {
        // Управление фокусом для доступности
        const focusableElements = document.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        
        focusableElements.forEach(element => {
            element.addEventListener('focus', () => {
                element.classList.add('focused');
            });
            
            element.addEventListener('blur', () => {
                element.classList.remove('focused');
            });
        });
    }
    
    setupPerformanceMonitoring() {
        // Мониторинг FPS
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                this.currentFPS = fps;
                
                // Логировать низкий FPS
                if (fps < 30) {
                    console.warn(`Низкий FPS: ${fps}`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    setupRenderOptimization() {
        // Оптимизация рендеринга
        if (this.game) {
            // Использовать requestAnimationFrame для плавной анимации
            this.game.useRequestAnimationFrame = true;
            
            // Ограничить частоту обновлений
            this.game.maxFPS = 60;
        }
    }
    
    // Методы для отладки
    debug() {
        console.log('=== Отладочная информация ===');
        console.log('Тип устройства:', this.deviceType);
        console.log('Размер экрана:', window.innerWidth, 'x', window.innerHeight);
        console.log('Состояние игры:', this.game ? 'Запущена' : 'Не запущена');
        console.log('Состояние сети:', this.networkManager.isConnected ? 'Подключено' : 'Отключено');
        console.log('Текущий FPS:', this.currentFPS || 'Неизвестно');
        console.log('============================');
    }
    
    // Методы для тестирования
    testGame() {
        console.log('Запуск тестового режима...');
        
        // Создать тестовую игру
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        document.body.appendChild(canvas);
        
        this.startGame(canvas);
        
        // Автоматическое тестирование
        setTimeout(() => {
            this.game.snake.changeDirection('up');
        }, 1000);
        
        setTimeout(() => {
            this.game.snake.changeDirection('right');
        }, 2000);
        
        setTimeout(() => {
            this.game.snake.changeDirection('down');
        }, 3000);
        
        setTimeout(() => {
            this.game.snake.changeDirection('left');
        }, 4000);
    }
    
    // Методы для статистики
    getStats() {
        return {
            deviceType: this.deviceType,
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            gameRunning: this.game ? this.game.isRunning : false,
            networkConnected: this.networkManager.isConnected,
            currentFPS: this.currentFPS,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
        };
    }
    
    // Методы для сохранения/загрузки
    saveGame() {
        if (this.game) {
            const gameState = {
                score: this.game.score,
                length: this.game.snake.body.length,
                time: this.game.gameTime,
                snake: this.game.snake.body,
                food: { x: this.game.food.x, y: this.game.food.y },
                powerups: this.game.powerups.map(p => ({ x: p.x, y: p.y, type: p.type })),
                timestamp: Date.now()
            };
            
            localStorage.setItem('snakeGameState', JSON.stringify(gameState));
            console.log('Игра сохранена');
        }
    }
    
    loadGame() {
        const savedState = localStorage.getItem('snakeGameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            
            // Проверить, не устарели ли данные (старше 5 минут)
            if (Date.now() - gameState.timestamp < 300000) {
                console.log('Игра загружена');
                return gameState;
            }
        }
        return null;
    }
    
    // Методы для сброса
    resetGame() {
        if (this.game) {
            this.game = null;
        }
        
        localStorage.removeItem('snakeGameState');
        console.log('Игра сброшена');
    }
    
    // Методы для экспорта/импорта настроек
    exportSettings() {
        const settings = {
            player: this.ui.getPlayerSettings(),
            gameResults: JSON.parse(localStorage.getItem('snakeGameResults') || '[]'),
            timestamp: Date.now()
        };
        
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'snake-io-settings.json';
        link.click();
    }
    
    importSettings(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                
                if (settings.player) {
                    localStorage.setItem('snakePlayerSettings', JSON.stringify(settings.player));
                }
                
                if (settings.gameResults) {
                    localStorage.setItem('snakeGameResults', JSON.stringify(settings.gameResults));
                }
                
                console.log('Настройки импортированы');
                this.ui.showNotification('Настройки импортированы!');
                
                // Обновить интерфейс
                if (this.ui) {
                    this.ui.updatePlayerInfo();
                }
            } catch (error) {
                console.error('Ошибка импорта настроек:', error);
                this.ui.showNotification('Ошибка импорта настроек', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Глобальные утилиты
window.SnakeIO = {
    // Создать экземпляр игры
    create: () => new SnakeIO(),
    
    // Получить статистику
    getStats: () => window.snakeIO ? window.snakeIO.getStats() : null,
    
    // Отладочная информация
    debug: () => window.snakeIO ? window.snakeIO.debug() : null,
    
    // Тестовый режим
    test: () => window.snakeIO ? window.snakeIO.testGame() : null,
    
    // Экспорт настроек
    exportSettings: () => window.snakeIO ? window.snakeIO.exportSettings() : null,
    
    // Импорт настроек
    importSettings: (file) => window.snakeIO ? window.snakeIO.importSettings(file) : null
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.snakeIO = new SnakeIO();
    
    // Добавить обработчик для импорта файлов
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            window.snakeIO.importSettings(e.target.files[0]);
        }
    });
    document.body.appendChild(fileInput);
    
    // Глобальная функция для импорта
    window.importSnakeIOSettings = () => {
        fileInput.click();
    };
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SnakeIO;
} 