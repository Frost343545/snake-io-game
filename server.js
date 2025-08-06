const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Создаем HTTP сервер
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Хранилище игроков и игрового состояния
const players = new Map();
const food = [];
const powerups = [];

// Генерация случайного ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Генерация случайной еды
function generateFood() {
    return {
        id: generateId(),
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
}

// Генерация случайного бонуса
function generatePowerup() {
    const types = ['speed', 'size', 'invincible'];
    return {
        id: generateId(),
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        type: types[Math.floor(Math.random() * types.length)],
        color: '#ffaa00'
    };
}

// Инициализация еды и бонусов
for (let i = 0; i < 50; i++) {
    food.push(generateFood());
}

for (let i = 0; i < 10; i++) {
    powerups.push(generatePowerup());
}

// Обработка подключений
wss.on('connection', (ws, req) => {
    const playerId = generateId();
    console.log(`Игрок подключился: ${playerId}`);

    // Создаем нового игрока
    const player = {
        id: playerId,
        name: `Игрок ${playerId.substr(0, 4)}`,
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        size: 20,
        score: 0,
        segments: [],
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        skin: 'default',
        head: 'default',
        powerups: []
    };

    // Инициализируем сегменты змеи
    for (let i = 0; i < 5; i++) {
        player.segments.push({
            x: player.x - i * 20,
            y: player.y
        });
    }

    players.set(playerId, player);

    // Отправляем игроку его данные и текущее состояние игры
    ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        players: Array.from(players.values()),
        food: food,
        powerups: powerups
    }));

    // Уведомляем всех о новом игроке
    broadcast({
        type: 'playerJoined',
        player: player
    }, ws);

    // Обработка сообщений от клиента
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'update':
                    updatePlayer(playerId, data);
                    break;
                case 'eat':
                    handleEat(playerId, data.foodId);
                    break;
                case 'powerup':
                    handlePowerup(playerId, data.powerupId);
                    break;
                case 'death':
                    handleDeath(playerId);
                    break;
                case 'chat':
                    broadcast({
                        type: 'chat',
                        playerId: playerId,
                        message: data.message
                    });
                    break;
            }
        } catch (error) {
            console.error('Ошибка обработки сообщения:', error);
        }
    });

    // Обработка отключения
    ws.on('close', () => {
        console.log(`Игрок отключился: ${playerId}`);
        players.delete(playerId);
        
        broadcast({
            type: 'playerLeft',
            playerId: playerId
        });
    });

    // Обработка ошибок
    ws.on('error', (error) => {
        console.error('Ошибка WebSocket:', error);
        players.delete(playerId);
    });
});

// Обновление позиции игрока
function updatePlayer(playerId, data) {
    const player = players.get(playerId);
    if (!player) return;

    player.x = data.x;
    player.y = data.y;
    player.segments = data.segments;
    player.score = data.score;
    player.size = data.size;
    player.powerups = data.powerups;

    // Отправляем обновление всем игрокам
    broadcast({
        type: 'playerUpdate',
        playerId: playerId,
        player: player
    });
}

// Обработка поедания еды
function handleEat(playerId, foodId) {
    const player = players.get(playerId);
    const foodIndex = food.findIndex(f => f.id === foodId);
    
    if (player && foodIndex !== -1) {
        // Увеличиваем счет и размер
        player.score += 10;
        player.size += 2;
        
        // Удаляем съеденную еду
        food.splice(foodIndex, 1);
        
        // Добавляем новую еду
        food.push(generateFood());
        
        // Уведомляем всех
        broadcast({
            type: 'foodEaten',
            playerId: playerId,
            foodId: foodId,
            newFood: food[food.length - 1],
            playerScore: player.score
        });
    }
}

// Обработка получения бонуса
function handlePowerup(playerId, powerupId) {
    const player = players.get(playerId);
    const powerupIndex = powerups.findIndex(p => p.id === powerupId);
    
    if (player && powerupIndex !== -1) {
        const powerup = powerups[powerupIndex];
        
        // Применяем эффект бонуса
        switch (powerup.type) {
            case 'speed':
                player.powerups.push({ type: 'speed', duration: 5000 });
                break;
            case 'size':
                player.size += 10;
                break;
            case 'invincible':
                player.powerups.push({ type: 'invincible', duration: 3000 });
                break;
        }
        
        // Удаляем использованный бонус
        powerups.splice(powerupIndex, 1);
        
        // Добавляем новый бонус
        powerups.push(generatePowerup());
        
        // Уведомляем всех
        broadcast({
            type: 'powerupCollected',
            playerId: playerId,
            powerupId: powerupId,
            newPowerup: powerups[powerups.length - 1],
            powerupType: powerup.type
        });
    }
}

// Обработка смерти игрока
function handleDeath(playerId) {
    const player = players.get(playerId);
    if (!player) return;

    // Сбрасываем игрока
    player.x = Math.random() * 2000;
    player.y = Math.random() * 2000;
    player.score = 0;
    player.size = 20;
    player.segments = [];
    player.powerups = [];

    // Восстанавливаем сегменты
    for (let i = 0; i < 5; i++) {
        player.segments.push({
            x: player.x - i * 20,
            y: player.y
        });
    }

    broadcast({
        type: 'playerDeath',
        playerId: playerId,
        player: player
    });
}

// Отправка сообщения всем подключенным клиентам
function broadcast(data, exclude = null) {
    wss.clients.forEach((client) => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Периодическое обновление состояния
setInterval(() => {
    // Обновляем бонусы
    players.forEach(player => {
        player.powerups = player.powerups.filter(powerup => {
            powerup.duration -= 100;
            return powerup.duration > 0;
        });
    });

    // Отправляем обновление состояния
    broadcast({
        type: 'gameState',
        players: Array.from(players.values()),
        food: food,
        powerups: powerups
    });
}, 100);

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`WebSocket сервер запущен на порту ${PORT}`);
    console.log(`URL для подключения: ws://localhost:${PORT}`);
});

// Обработка завершения работы
process.on('SIGINT', () => {
    console.log('Завершение работы сервера...');
    wss.close();
    server.close();
    process.exit(0);
}); 