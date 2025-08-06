// Класс управления сетевым взаимодействием
class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.playerId = null;
        this.serverUrl = 'wss://snake-io-game.onrender.com'; // Ваш реальный URL с Render
        this.game = null;
        this.lastUpdate = 0;
        this.updateInterval = 50; // Обновление каждые 50мс
        this.useLocalMode = false; // По умолчанию используем реальный сервер
        this.autoReconnect = true; // Автопереподключение
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generatePlayerId();
    }
    
    setupEventListeners() {
        // Обработка событий окна
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
        
        // Обработка видимости страницы
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });
    }
    
    generatePlayerId() {
        this.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
    }
    
    connect() {
        if (this.isConnected) return;
        
        // Если включен локальный режим, сразу переключаемся на него
        if (this.useLocalMode) {
            console.log('Использование локального режима');
            this.switchToLocalMode();
            return;
        }
        
        try {
            this.socket = new WebSocket(this.serverUrl);
            
            this.socket.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                console.log('Подключено к серверу');
                
                if (window.ui) {
                    window.ui.showConnectionStatus('connected');
                }
                
                // Отправить данные игрока
                this.sendPlayerData();
            };
            
            this.socket.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
            
            this.socket.onclose = () => {
                this.isConnected = false;
                console.log('Отключено от сервера');
                
                if (window.ui) {
                    window.ui.showConnectionStatus('disconnected');
                }
                
                // Попытка переподключения
                this.attemptReconnect();
            };
            
            this.socket.onerror = (error) => {
                console.error('Ошибка WebSocket:', error);
                
                if (window.ui) {
                    window.ui.showConnectionStatus('error');
                }
            };
            
        } catch (error) {
            console.error('Ошибка подключения:', error);
            this.attemptReconnect();
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
    }
    
    attemptReconnect() {
        if (!this.autoReconnect) {
            console.log('Автопереподключение отключено');
            return;
        }
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Превышено максимальное количество попыток переподключения');
            console.log('Переключение в локальный режим...');
            this.switchToLocalMode();
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
    }
    
    switchToLocalMode() {
        console.log('Активация локального режима с ИИ игроками');
        this.useLocalMode = true;
        
        // Создаем локальный менеджер сети
        if (!this.localManager) {
            this.localManager = new LocalNetworkManager();
        }
        
        // Устанавливаем игру в локальный менеджер
        this.localManager.setGame(this.game);
        
        // Запускаем симуляцию мультиплеера только если игра готова
        if (this.game) {
            this.localManager.simulateLocalMultiplayer();
        }
        
        if (window.ui) {
            window.ui.showConnectionStatus('local');
            window.ui.showNotification('Переключение в локальный режим с ИИ игроками', 'info');
        }
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'player_joined':
                this.handlePlayerJoined(data);
                break;
            case 'player_left':
                this.handlePlayerLeft(data);
                break;
            case 'game_state':
                this.handleGameState(data);
                break;
            case 'player_update':
                this.handlePlayerUpdate(data);
                break;
            case 'food_update':
                this.handleFoodUpdate(data);
                break;
            case 'powerup_spawn':
                this.handlePowerupSpawn(data);
                break;
            case 'powerup_collected':
                this.handlePowerupCollected(data);
                break;
            case 'player_died':
                this.handlePlayerDied(data);
                break;
            case 'leaderboard_update':
                this.handleLeaderboardUpdate(data);
                break;
            case 'error':
                this.handleError(data);
                break;
            default:
                console.log('Неизвестный тип сообщения:', data.type);
        }
    }
    
    handlePlayerJoined(data) {
        if (data.playerId === this.playerId) return;
        
        console.log(`Игрок ${data.playerName} присоединился к игре`);
        
        if (this.game) {
            this.game.addPlayer({
                id: data.playerId,
                name: data.playerName,
                skin: data.skin,
                head: data.head,
                body: data.body,
                direction: data.direction
            });
        }
        
        if (window.ui) {
            window.ui.showNotification(`${data.playerName} присоединился к игре`);
        }
    }
    
    handlePlayerLeft(data) {
        if (data.playerId === this.playerId) return;
        
        console.log(`Игрок ${data.playerName} покинул игру`);
        
        if (this.game) {
            this.game.removePlayer(data.playerId);
        }
        
        if (window.ui) {
            window.ui.showNotification(`${data.playerName} покинул игру`);
        }
    }
    
    handleGameState(data) {
        if (!this.game) return;
        
        // Обновить состояние игры
        this.game.food.x = data.food.x;
        this.game.food.y = data.food.y;
        
        // Обновить пауэрапы
        this.game.powerups = data.powerups.map(powerupData => {
            const powerup = new Powerup(this.game, powerupData.type);
            powerup.x = powerupData.x;
            powerup.y = powerupData.y;
            powerup.spawnTime = powerupData.spawnTime;
            return powerup;
        });
        
        // Обновить других игроков
        data.players.forEach(playerData => {
            if (playerData.id !== this.playerId) {
                this.game.updatePlayer(playerData);
            }
        });
    }
    
    handlePlayerUpdate(data) {
        if (data.playerId === this.playerId) return;
        
        if (this.game) {
            this.game.updatePlayer(data);
        }
    }
    
    handleFoodUpdate(data) {
        if (!this.game) return;
        
        this.game.food.x = data.x;
        this.game.food.y = data.y;
    }
    
    handlePowerupSpawn(data) {
        if (!this.game) return;
        
        const powerup = new Powerup(this.game, data.type);
        powerup.x = data.x;
        powerup.y = data.y;
        powerup.spawnTime = data.spawnTime;
        this.game.powerups.push(powerup);
    }
    
    handlePowerupCollected(data) {
        if (!this.game) return;
        
        // Удалить пауэрап из игры
        this.game.powerups = this.game.powerups.filter(powerup => 
            powerup.x !== data.x || powerup.y !== data.y
        );
    }
    
    handlePlayerDied(data) {
        if (data.playerId === this.playerId) return;
        
        console.log(`Игрок ${data.playerName} погиб`);
        
        if (this.game) {
            this.game.removePlayer(data.playerId);
        }
        
        if (window.ui) {
            window.ui.showNotification(`${data.playerName} погиб!`, 'info');
        }
    }
    
    handleLeaderboardUpdate(data) {
        // Обновить таблицу лидеров
        localStorage.setItem('snakeLeaderboard', JSON.stringify(data.leaderboard));
        
        if (window.ui && window.ui.currentScreen === 'leaderboard') {
            window.ui.loadLeaderboard();
        }
    }
    
    handleError(data) {
        console.error('Ошибка сервера:', data.message);
        
        if (window.ui) {
            window.ui.showNotification(`Ошибка: ${data.message}`, 'error');
        }
    }
    
    sendPlayerData() {
        if (!this.isConnected || !this.game) return;
        
        const playerData = {
            type: 'player_data',
            playerId: this.playerId,
            name: this.game.playerSettings.name,
            skin: this.game.playerSettings.skin,
            head: this.game.playerSettings.head,
            body: this.game.snake.body,
            direction: this.game.snake.direction,
            score: this.game.score,
            length: this.game.snake.body.length
        };
        
        this.send(playerData);
    }
    
    sendGameUpdate() {
        if (!this.isConnected || !this.game) return;
        
        const now = Date.now();
        if (now - this.lastUpdate < this.updateInterval) return;
        
        this.lastUpdate = now;
        
        const gameUpdate = {
            type: 'game_update',
            playerId: this.playerId,
            body: this.game.snake.body,
            direction: this.game.snake.direction,
            score: this.game.score,
            length: this.game.snake.body.length,
            isGhost: this.game.snake.isGhost,
            isMagnet: this.game.snake.isMagnet
        };
        
        this.send(gameUpdate);
    }
    
    sendFoodEaten() {
        if (!this.isConnected) return;
        
        const foodEaten = {
            type: 'food_eaten',
            playerId: this.playerId,
            foodX: this.game.food.x,
            foodY: this.game.food.y
        };
        
        this.send(foodEaten);
    }
    
    sendPowerupCollected(powerup) {
        if (!this.isConnected) return;
        
        const powerupCollected = {
            type: 'powerup_collected',
            playerId: this.playerId,
            powerupType: powerup.type,
            powerupX: powerup.x,
            powerupY: powerup.y
        };
        
        this.send(powerupCollected);
    }
    
    sendPlayerDied() {
        if (!this.isConnected) return;
        
        const playerDied = {
            type: 'player_died',
            playerId: this.playerId,
            finalScore: this.game.score,
            finalLength: this.game.snake.body.length,
            gameTime: this.game.gameTime
        };
        
        this.send(playerDied);
    }
    
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }
    
    pauseUpdates() {
        // Приостановить отправку обновлений при скрытии вкладки
        this.updateInterval = 1000; // Увеличить интервал
    }
    
    resumeUpdates() {
        // Возобновить нормальную частоту обновлений
        this.updateInterval = 50;
    }
    
    // Методы для интеграции с игрой
    setGame(game) {
        this.game = game;
        
        // Начать отправку обновлений
        this.startUpdateLoop();
    }
    
    startUpdateLoop() {
        setInterval(() => {
            if (this.isConnected && this.game && this.game.isRunning && !this.game.isPaused) {
                this.sendGameUpdate();
            }
        }, this.updateInterval);
    }
    
    // Методы для получения статистики
    getConnectionStats() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            playerId: this.playerId
        };
    }
    
    // Методы для тестирования соединения
    ping() {
        if (!this.isConnected) return false;
        
        const pingMessage = {
            type: 'ping',
            timestamp: Date.now()
        };
        
        this.send(pingMessage);
        return true;
    }
    
    // Методы для работы с комнатами
    joinRoom(roomId) {
        const joinMessage = {
            type: 'join_room',
            roomId: roomId,
            playerId: this.playerId
        };
        
        this.send(joinMessage);
    }
    
    leaveRoom() {
        const leaveMessage = {
            type: 'leave_room',
            playerId: this.playerId
        };
        
        this.send(leaveMessage);
    }
    
    // Методы для чата
    sendChatMessage(message) {
        const chatMessage = {
            type: 'chat',
            playerId: this.playerId,
            message: message,
            timestamp: Date.now()
        };
        
        this.send(chatMessage);
    }
    
    // Методы для настроек игры
    updateGameSettings(settings) {
        const settingsMessage = {
            type: 'game_settings',
            playerId: this.playerId,
            settings: settings
        };
        
        this.send(settingsMessage);
    }
}

// Класс для работы с локальным сервером (для разработки)
class LocalNetworkManager extends NetworkManager {
    constructor() {
        super();
        this.serverUrl = 'ws://localhost:3000'; // Локальный сервер для разработки
        this.localPlayers = new Map();
        this.localFood = [];
        this.localPowerups = [];
    }
    
    // Переопределяем setGame для локального менеджера
    setGame(game) {
        this.game = game;
        console.log('Локальный менеджер сети: игра установлена');
    }
    
    // Симуляция локальной многопользовательской игры
    simulateLocalMultiplayer() {
        if (!this.game) return;
        
        // Создать виртуальных игроков
        this.createVirtualPlayers();
        
        // Симулировать обновления
        setInterval(() => {
            this.updateVirtualPlayers();
        }, 100);
    }
    
    createVirtualPlayers() {
        const playerNames = ['Алекс', 'Мария', 'Дмитрий', 'Анна', 'Сергей'];
        const skins = ['default', 'neon', 'golden', 'rainbow', 'fire'];
        
        for (let i = 0; i < 3; i++) {
            const virtualPlayer = {
                id: `virtual_${i}`,
                name: playerNames[i],
                skin: skins[i],
                head: 'default',
                body: this.generateRandomSnake(),
                direction: 'right',
                score: Math.floor(Math.random() * 1000),
                isActive: true
            };
            
            this.localPlayers.set(virtualPlayer.id, virtualPlayer);
            
            if (this.game) {
                this.game.addPlayer(virtualPlayer);
            }
        }
    }
    
    generateRandomSnake() {
        const body = [];
        const startX = Math.floor(Math.random() * 20) * this.game.gridSize;
        const startY = Math.floor(Math.random() * 20) * this.game.gridSize;
        
        for (let i = 0; i < 3; i++) {
            body.push({
                x: startX - i * this.game.gridSize,
                y: startY
            });
        }
        
        return body;
    }
    
    updateVirtualPlayers() {
        this.localPlayers.forEach(player => {
            if (!player.isActive) return;
            
            // Простой ИИ для виртуальных игроков
            this.updateVirtualPlayerAI(player);
            
            // Обновить в игре
            if (this.game) {
                this.game.updatePlayer(player);
            }
        });
    }
    
    updateVirtualPlayerAI(player) {
        const head = player.body[0];
        const food = this.game.food;
        
        // Простое следование за едой
        if (head.x < food.x && player.direction !== 'left') {
            player.direction = 'right';
        } else if (head.x > food.x && player.direction !== 'right') {
            player.direction = 'left';
        } else if (head.y < food.y && player.direction !== 'up') {
            player.direction = 'down';
        } else if (head.y > food.y && player.direction !== 'down') {
            player.direction = 'up';
        }
        
        // Движение
        const newHead = { ...head };
        switch (player.direction) {
            case 'up':
                newHead.y -= this.game.gridSize;
                break;
            case 'down':
                newHead.y += this.game.gridSize;
                break;
            case 'left':
                newHead.x -= this.game.gridSize;
                break;
            case 'right':
                newHead.x += this.game.gridSize;
                break;
        }
        
        // Проверка границ
        if (newHead.x < 0 || newHead.x >= this.game.width || 
            newHead.y < 0 || newHead.y >= this.game.height) {
            // Изменить направление при столкновении со стеной
            const directions = ['up', 'down', 'left', 'right'];
            player.direction = directions[Math.floor(Math.random() * directions.length)];
            return;
        }
        
        // Обновить тело змейки
        player.body.unshift(newHead);
        player.body.pop();
        
        // Случайно увеличить длину
        if (Math.random() < 0.01) {
            const tail = { ...player.body[player.body.length - 1] };
            player.body.push(tail);
            player.score += 10;
        }
    }
}

// Инициализация сетевого менеджера
window.networkManager = new NetworkManager();

// Для разработки можно использовать локальный менеджер
// window.networkManager = new LocalNetworkManager(); 