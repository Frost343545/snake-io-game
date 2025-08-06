// Класс управления пользовательским интерфейсом
class UI {
    constructor() {
        this.currentScreen = 'loading';
        this.game = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showLoadingScreen();
        this.simulateLoading();
    }
    
    setupEventListeners() {
        // Главное меню
        document.getElementById('playBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('customizeBtn').addEventListener('click', () => {
            this.showCustomizeScreen();
        });
        
        document.getElementById('leaderboardBtn').addEventListener('click', () => {
            this.showLeaderboardScreen();
        });
        
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.showHelpScreen();
        });
        
        // Настройки
        document.getElementById('saveCustomizeBtn').addEventListener('click', () => {
            this.saveCustomization();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Игровые элементы управления
        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (this.game) {
                this.game.togglePause();
            }
        });
        
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Экран окончания игры
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Таблица лидеров
        document.getElementById('backToMenuFromLeaderboard').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Помощь
        document.getElementById('backToMenuFromHelp').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Настройки скинов и голов
        this.setupCustomizationListeners();
        
        // Табы таблицы лидеров
        this.setupLeaderboardTabs();
    }
    
    setupCustomizationListeners() {
        // Скины
        const skinOptions = document.querySelectorAll('.skin-option');
        skinOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectSkin(option.dataset.skin);
            });
        });
        
        // Головы
        const headOptions = document.querySelectorAll('.head-option');
        headOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectHead(option.dataset.head);
            });
        });
        
        // Настройки сети
        const localModeToggle = document.getElementById('localModeToggle');
        const autoReconnectToggle = document.getElementById('autoReconnectToggle');
        
        if (localModeToggle) {
            localModeToggle.addEventListener('change', () => {
                this.updateNetworkSettings();
            });
        }
        
        if (autoReconnectToggle) {
            autoReconnectToggle.addEventListener('change', () => {
                this.updateNetworkSettings();
            });
        }
    }
    
    setupLeaderboardTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchLeaderboardTab(btn.dataset.tab);
            });
        });
    }
    
    showLoadingScreen() {
        this.hideAllScreens();
        document.getElementById('loadingScreen').classList.remove('hidden');
        this.currentScreen = 'loading';
    }
    
    showMainMenu() {
        this.hideAllScreens();
        document.getElementById('mainMenu').classList.remove('hidden');
        this.currentScreen = 'mainMenu';
        this.updatePlayerInfo();
    }
    
    showCustomizeScreen() {
        this.hideAllScreens();
        document.getElementById('customizeScreen').classList.remove('hidden');
        this.currentScreen = 'customize';
        this.loadCurrentSettings();
    }
    
    showGameScreen() {
        this.hideAllScreens();
        document.getElementById('gameScreen').classList.remove('hidden');
        this.currentScreen = 'game';
        
        // Показать мобильные элементы управления на мобильных устройствах
        if (window.innerWidth <= 768) {
            document.querySelector('.mobile-controls').style.display = 'block';
        }
    }
    
    showGameOverScreen() {
        this.hideAllScreens();
        document.getElementById('gameOverScreen').classList.remove('hidden');
        this.currentScreen = 'gameOver';
    }
    
    showLeaderboardScreen() {
        this.hideAllScreens();
        document.getElementById('leaderboardScreen').classList.remove('hidden');
        this.currentScreen = 'leaderboard';
        this.loadLeaderboard();
    }
    
    showHelpScreen() {
        this.hideAllScreens();
        document.getElementById('helpScreen').classList.remove('hidden');
        this.currentScreen = 'help';
    }
    
    hideAllScreens() {
        const screens = [
            'loadingScreen',
            'mainMenu',
            'customizeScreen',
            'gameScreen',
            'gameOverScreen',
            'leaderboardScreen',
            'helpScreen'
        ];
        
        screens.forEach(screenId => {
            document.getElementById(screenId).classList.add('hidden');
        });
        
        // Скрыть мобильные элементы управления
        document.querySelector('.mobile-controls').style.display = 'none';
    }
    
    simulateLoading() {
        let progress = 0;
        const progressBar = document.querySelector('.loading-progress');
        const loadingText = document.querySelector('#loadingScreen p');
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            progressBar.style.width = progress + '%';
            
            if (progress < 30) {
                loadingText.textContent = 'Загрузка ресурсов...';
            } else if (progress < 60) {
                loadingText.textContent = 'Подключение к серверу...';
            } else if (progress < 90) {
                loadingText.textContent = 'Инициализация игры...';
            } else {
                loadingText.textContent = 'Готово!';
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.showMainMenu();
                }, 500);
            }
        }, 100);
    }
    
    startGame() {
        this.showGameScreen();
        
        // Инициализация игры
        const canvas = document.getElementById('gameCanvas');
        this.game = new SnakeGame(canvas);
        
        // Подключение к сети (если доступно)
        if (window.networkManager) {
            window.networkManager.connect();
        }
    }
    
    selectSkin(skinType) {
        // Убрать активный класс со всех скинов
        document.querySelectorAll('.skin-option').forEach(option => {
            option.classList.remove('active');
        });
        
        // Добавить активный класс выбранному скину
        document.querySelector(`[data-skin="${skinType}"]`).classList.add('active');
        
        // Обновить превью в главном меню
        const currentSkinPreview = document.getElementById('currentSkin');
        currentSkinPreview.className = `skin-preview ${skinType}-skin`;
    }
    
    selectHead(headType) {
        // Убрать активный класс со всех голов
        document.querySelectorAll('.head-option').forEach(option => {
            option.classList.remove('active');
        });
        
        // Добавить активный класс выбранной голове
        document.querySelector(`[data-head="${headType}"]`).classList.add('active');
    }
    
    loadCurrentSettings() {
        const settings = this.getPlayerSettings();
        const networkSettings = this.getNetworkSettings();
        
        // Установить текущий скин
        this.selectSkin(settings.skin);
        
        // Установить текущую голову
        this.selectHead(settings.head);
        
        // Установить имя игрока
        document.getElementById('playerName').value = settings.name;
        
        // Установить настройки сети
        const localModeToggle = document.getElementById('localModeToggle');
        const autoReconnectToggle = document.getElementById('autoReconnectToggle');
        
        if (localModeToggle) {
            localModeToggle.checked = networkSettings.localMode;
        }
        
        if (autoReconnectToggle) {
            autoReconnectToggle.checked = networkSettings.autoReconnect;
        }
    }
    
    saveCustomization() {
        const skin = document.querySelector('.skin-option.active').dataset.skin;
        const head = document.querySelector('.head-option.active').dataset.head;
        const name = document.getElementById('playerName').value.trim() || 'Игрок';
        
        const settings = {
            skin: skin,
            head: head,
            name: name
        };
        
        // Сохранить настройки игрока
        localStorage.setItem('snakePlayerSettings', JSON.stringify(settings));
        
        // Сохранить настройки сети
        this.updateNetworkSettings();
        
        // Обновить настройки в игре
        if (this.game) {
            this.game.playerSettings = settings;
        }
        
        // Показать уведомление
        this.showNotification('Настройки сохранены!');
        
        // Вернуться в главное меню
        this.showMainMenu();
    }
    
    getPlayerSettings() {
        const defaultSettings = {
            skin: 'default',
            head: 'default',
            name: 'Игрок'
        };
        
        const savedSettings = localStorage.getItem('snakePlayerSettings');
        return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }
    
    getNetworkSettings() {
        const defaultSettings = {
            localMode: true,
            autoReconnect: true
        };
        
        const savedSettings = localStorage.getItem('snakeNetworkSettings');
        return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }
    
    updateNetworkSettings() {
        const localMode = document.getElementById('localModeToggle').checked;
        const autoReconnect = document.getElementById('autoReconnectToggle').checked;
        
        const settings = {
            localMode: localMode,
            autoReconnect: autoReconnect
        };
        
        localStorage.setItem('snakeNetworkSettings', JSON.stringify(settings));
        
        // Обновить настройки в сетевом менеджере
        if (window.networkManager) {
            window.networkManager.useLocalMode = localMode;
            window.networkManager.autoReconnect = autoReconnect;
        }
    }
    
    updatePlayerInfo() {
        const settings = this.getPlayerSettings();
        
        // Обновить превью скина
        const currentSkinPreview = document.getElementById('currentSkin');
        currentSkinPreview.className = `skin-preview ${settings.skin}-skin`;
        
        // Обновить статистику
        const savedResults = JSON.parse(localStorage.getItem('snakeGameResults') || '[]');
        if (savedResults.length > 0) {
            const bestResult = savedResults[0];
            document.getElementById('playerScore').textContent = bestResult.score;
            document.getElementById('playerLength').textContent = bestResult.length;
        }
    }
    
    loadLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        
        // Получить данные в зависимости от выбранной вкладки
        let data = [];
        switch (activeTab) {
            case 'daily':
                data = this.getDailyLeaderboard();
                break;
            case 'weekly':
                data = this.getWeeklyLeaderboard();
                break;
            case 'alltime':
                data = this.getAllTimeLeaderboard();
                break;
        }
        
        // Очистить список
        leaderboardList.innerHTML = '';
        
        // Заполнить список
        data.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-score">${entry.score}</span>
            `;
            leaderboardList.appendChild(item);
        });
        
        // Если данных нет, показать сообщение
        if (data.length === 0) {
            leaderboardList.innerHTML = '<p style="text-align: center; color: #cccccc; padding: 20px;">Нет данных для отображения</p>';
        }
    }
    
    getDailyLeaderboard() {
        const today = new Date().toDateString();
        const savedResults = JSON.parse(localStorage.getItem('snakeGameResults') || '[]');
        
        return savedResults
            .filter(result => new Date(result.date).toDateString() === today)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    
    getWeeklyLeaderboard() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const savedResults = JSON.parse(localStorage.getItem('snakeGameResults') || '[]');
        
        return savedResults
            .filter(result => new Date(result.date) > weekAgo)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    
    getAllTimeLeaderboard() {
        const savedResults = JSON.parse(localStorage.getItem('snakeGameResults') || '[]');
        
        return savedResults
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    
    switchLeaderboardTab(tab) {
        // Убрать активный класс со всех табов
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавить активный класс выбранному табу
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Загрузить данные для выбранной вкладки
        this.loadLeaderboard();
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Ошибка перехода в полноэкранный режим:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    showNotification(message, type = 'success') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Автоматически удалить уведомление через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // Методы для обновления игрового UI
    updateGameScore(score) {
        document.getElementById('gameScore').textContent = score;
    }
    
    updateGameLength(length) {
        document.getElementById('gameLength').textContent = length;
    }
    
    updateFinalResults(score, length, time) {
        document.getElementById('finalScore').textContent = score;
        document.getElementById('finalLength').textContent = length;
        document.getElementById('gameTime').textContent = this.formatTime(time);
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Методы для сетевого взаимодействия
    showConnectionStatus(status) {
        let message = '';
        let type = 'info';
        
        switch (status) {
            case 'connecting':
                message = 'Подключение к серверу...';
                break;
            case 'connected':
                message = 'Подключено к серверу';
                type = 'success';
                break;
            case 'disconnected':
                message = 'Отключено от сервера';
                type = 'error';
                break;
            case 'error':
                message = 'Ошибка подключения';
                type = 'error';
                break;
            case 'local':
                message = 'Локальный режим с ИИ игроками';
                type = 'info';
                break;
        }
        
        this.showNotification(message, type);
    }
    
    updatePlayerCount(count) {
        // Можно добавить отображение количества игроков в игре
        console.log(`Игроков в игре: ${count}`);
    }
    
    // Методы для адаптивности
    handleResize() {
        if (this.currentScreen === 'game' && this.game) {
            this.game.resizeCanvas();
        }
        
        // Показать/скрыть мобильные элементы управления
        const mobileControls = document.querySelector('.mobile-controls');
        if (window.innerWidth <= 768) {
            if (this.currentScreen === 'game') {
                mobileControls.style.display = 'block';
            }
        } else {
            mobileControls.style.display = 'none';
        }
    }
    
    // Методы для доступности
    setupAccessibility() {
        // Добавить поддержку клавиатурной навигации
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.currentScreen === 'game' && this.game) {
                    this.game.togglePause();
                } else if (this.currentScreen !== 'mainMenu') {
                    this.showMainMenu();
                }
            }
        });
        
        // Добавить ARIA-атрибуты для доступности
        this.addAriaAttributes();
    }
    
    addAriaAttributes() {
        // Добавить ARIA-атрибуты к кнопкам
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (!button.getAttribute('aria-label')) {
                button.setAttribute('aria-label', button.textContent.trim());
            }
        });
        
        // Добавить ARIA-атрибуты к экранам
        const screens = document.querySelectorAll('.menu-screen, .game-screen');
        screens.forEach(screen => {
            screen.setAttribute('role', 'region');
            screen.setAttribute('aria-label', screen.querySelector('h1, h2')?.textContent || 'Игровой экран');
        });
    }
    
    // Методы для анимаций
    animateScreenTransition(fromScreen, toScreen) {
        const fromElement = document.getElementById(fromScreen);
        const toElement = document.getElementById(toScreen);
        
        if (fromElement && toElement) {
            fromElement.style.animation = 'fadeOut 0.3s ease-out';
            toElement.style.animation = 'fadeIn 0.3s ease-out';
            
            setTimeout(() => {
                fromElement.style.animation = '';
                toElement.style.animation = '';
            }, 300);
        }
    }
    
    // Методы для сохранения состояния
    saveGameState() {
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
        }
    }
    
    loadGameState() {
        const savedState = localStorage.getItem('snakeGameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            
            // Проверить, не устарели ли данные (старше 1 минуты)
            if (Date.now() - gameState.timestamp < 60000) {
                return gameState;
            }
        }
        return null;
    }
    
    clearGameState() {
        localStorage.removeItem('snakeGameState');
    }
}

// Инициализация UI при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.ui = new UI();
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        if (window.ui) {
            window.ui.handleResize();
        }
    });
    
    // Обработка видимости страницы (для паузы при переключении вкладок)
    document.addEventListener('visibilitychange', () => {
        if (window.ui && window.ui.game && document.hidden) {
            window.ui.game.togglePause();
        }
    });
}); 