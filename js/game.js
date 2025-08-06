// Основной игровой класс
class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Игровые настройки
        this.gridSize = 20;
        this.gameSpeed = 150;
        this.lastUpdate = 0;
        this.isRunning = false;
        this.isPaused = false;
        
        // Игровые объекты
        this.snake = new Snake(this);
        this.food = new Food(this);
        this.powerups = [];
        this.particles = [];
        this.players = new Map(); // Другие игроки
        
        // Игровые данные
        this.score = 0;
        this.gameTime = 0;
        this.startTime = 0;
        
        // Настройки игрока
        this.playerSettings = {
            skin: 'default',
            head: 'default',
            name: 'Игрок'
        };
        
        // Эффекты
        this.effects = {
            screenShake: 0,
            flash: 0
        };
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.loadPlayerSettings();
        this.setupEventListeners();
        this.startGame();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    loadPlayerSettings() {
        const settings = localStorage.getItem('snakePlayerSettings');
        if (settings) {
            this.playerSettings = { ...this.playerSettings, ...JSON.parse(settings) };
        }
    }
    
    setupEventListeners() {
        // Обработка клавиатуры
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning || this.isPaused) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.snake.changeDirection('up');
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.snake.changeDirection('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.snake.changeDirection('left');
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.snake.changeDirection('right');
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        // Мобильные элементы управления
        const directionBtns = ['upBtn', 'downBtn', 'leftBtn', 'rightBtn'];
        directionBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (!this.isRunning || this.isPaused) return;
                    const direction = btnId.replace('Btn', '');
                    this.snake.changeDirection(direction);
                });
            }
        });
        
        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    startGame() {
        this.isRunning = true;
        this.startTime = Date.now();
        this.gameLoop();
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastUpdate;
        
        if (deltaTime >= this.gameSpeed && !this.isPaused) {
            this.update();
            this.lastUpdate = currentTime;
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        // Обновление времени игры
        this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Обновление змейки
        this.snake.update();
        
        // Проверка столкновений
        this.checkCollisions();
        
        // Обновление еды
        this.food.update();
        
        // Обновление пауэрапов
        this.powerups = this.powerups.filter(powerup => {
            powerup.update();
            return powerup.isActive;
        });
        
        // Обновление частиц
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.isActive;
        });
        
        // Обновление эффектов
        this.updateEffects();
        
        // Обновление других игроков
        this.updateOtherPlayers();
        
        // Обновление UI
        this.updateUI();
    }
    
    render() {
        // Очистка канваса
        this.ctx.fillStyle = '#0c0c0c';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Применение эффектов экрана
        this.applyScreenEffects();
        
        // Рендеринг сетки
        this.renderGrid();
        
        // Рендеринг еды
        this.food.render();
        
        // Рендеринг пауэрапов
        this.powerups.forEach(powerup => powerup.render());
        
        // Рендеринг змейки
        this.snake.render();
        
        // Рендеринг других игроков
        this.renderOtherPlayers();
        
        // Рендеринг частиц
        this.particles.forEach(particle => particle.render());
        
        // Рендеринг UI
        this.renderUI();
    }
    
    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    checkCollisions() {
        const head = this.snake.body[0];
        
        // Проверка столкновения с едой
        if (this.food.checkCollision(head)) {
            this.eatFood();
        }
        
        // Проверка столкновения с пауэрапами
        this.powerups.forEach(powerup => {
            if (powerup.checkCollision(head)) {
                this.collectPowerup(powerup);
            }
        });
        
        // Проверка столкновения с другими игроками
        this.players.forEach(player => {
            if (this.checkPlayerCollision(head, player)) {
                this.handlePlayerCollision(player);
            }
        });
        
        // Проверка столкновения с собой
        if (this.snake.checkSelfCollision()) {
            this.gameOver();
        }
        
        // Проверка столкновения со стенами
        if (this.checkWallCollision(head)) {
            this.gameOver();
        }
    }
    
    eatFood() {
        this.score += 10;
        this.snake.grow();
        this.food.respawn();
        
        // Создание частиц
        this.createEatParticles(this.food.x, this.food.y);
        
        // Звуковой эффект
        this.playSound('eat');
        
        // Эффект экрана
        this.effects.screenShake = 5;
        
        // Случайное появление пауэрапа
        if (Math.random() < 0.1) {
            this.spawnPowerup();
        }
    }
    
    collectPowerup(powerup) {
        powerup.collect();
        this.powerups = this.powerups.filter(p => p !== powerup);
        
        // Применение эффекта пауэрапа
        switch (powerup.type) {
            case 'speed':
                this.snake.speedBoost(5000);
                break;
            case 'ghost':
                this.snake.ghostMode(3000);
                break;
            case 'magnet':
                this.snake.magnetMode(4000);
                break;
        }
        
        this.createPowerupParticles(powerup.x, powerup.y, powerup.type);
        this.playSound('powerup');
    }
    
    spawnPowerup() {
        const types = ['speed', 'ghost', 'magnet'];
        const type = types[Math.floor(Math.random() * types.length)];
        const powerup = new Powerup(this, type);
        this.powerups.push(powerup);
    }
    
    createEatParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const particle = new Particle(this, x, y, 'eat');
            this.particles.push(particle);
        }
    }
    
    createPowerupParticles(x, y, type) {
        for (let i = 0; i < 12; i++) {
            const particle = new Particle(this, x, y, type);
            this.particles.push(particle);
        }
    }
    
    checkWallCollision(head) {
        return head.x < 0 || head.x >= this.width || head.y < 0 || head.y >= this.height;
    }
    
    checkPlayerCollision(head, player) {
        return player.body.some(segment => 
            Math.abs(head.x - segment.x) < this.gridSize && 
            Math.abs(head.y - segment.y) < this.gridSize
        );
    }
    
    handlePlayerCollision(player) {
        if (this.snake.isGhost) return; // Призрачный режим
        
        // Создание частиц столкновения
        this.createCollisionParticles(player.body[0].x, player.body[0].y);
        
        // Звуковой эффект
        this.playSound('death');
        
        // Эффект экрана
        this.effects.flash = 10;
        this.effects.screenShake = 15;
        
        this.gameOver();
    }
    
    createCollisionParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            const particle = new Particle(this, x, y, 'collision');
            this.particles.push(particle);
        }
    }
    
    updateEffects() {
        if (this.effects.screenShake > 0) {
            this.effects.screenShake--;
        }
        
        if (this.effects.flash > 0) {
            this.effects.flash--;
        }
    }
    
    applyScreenEffects() {
        // Эффект тряски экрана
        if (this.effects.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.effects.screenShake;
            const shakeY = (Math.random() - 0.5) * this.effects.screenShake;
            this.ctx.save();
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Эффект вспышки
        if (this.effects.flash > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.effects.flash / 20})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
    
    updateOtherPlayers() {
        // Здесь будет логика обновления других игроков через сеть
        // Пока что просто обновляем существующих
        this.players.forEach(player => {
            player.update();
        });
    }
    
    renderOtherPlayers() {
        this.players.forEach(player => {
            player.render();
        });
    }
    
    updateUI() {
        // Обновление счетчиков
        document.getElementById('gameScore').textContent = this.score;
        document.getElementById('gameLength').textContent = this.snake.body.length;
    }
    
    renderUI() {
        // Рендеринг ников над игроками
        this.renderPlayerNames();
    }
    
    renderPlayerNames() {
        // Ник игрока
        this.renderPlayerName(this.snake.body[0].x, this.snake.body[0].y - 30, this.playerSettings.name, true);
        
        // Ники других игроков
        this.players.forEach(player => {
            this.renderPlayerName(player.body[0].x, player.body[0].y - 30, player.name, false);
        });
    }
    
    renderPlayerName(x, y, name, isCurrentPlayer) {
        this.ctx.save();
        
        // Фон для имени
        const textWidth = this.ctx.measureText(name).width;
        this.ctx.fillStyle = isCurrentPlayer ? 'rgba(0, 255, 136, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(x - textWidth/2 - 5, y - 15, textWidth + 10, 20);
        
        // Текст имени
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '12px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(name, x, y);
        
        this.ctx.restore();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const overlay = document.getElementById('gameOverlay');
        if (this.isPaused) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    
    gameOver() {
        this.isRunning = false;
        
        // Сохранение результатов
        this.saveGameResults();
        
        // Показать экран окончания игры
        this.showGameOverScreen();
    }
    
    saveGameResults() {
        const results = {
            score: this.score,
            length: this.snake.body.length,
            time: this.gameTime,
            date: new Date().toISOString()
        };
        
        // Сохранение в localStorage
        const savedResults = JSON.parse(localStorage.getItem('snakeGameResults') || '[]');
        savedResults.push(results);
        savedResults.sort((a, b) => b.score - a.score);
        savedResults.splice(10); // Оставляем только топ-10
        localStorage.setItem('snakeGameResults', JSON.stringify(savedResults));
    }
    
    showGameOverScreen() {
        // Обновление результатов
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLength').textContent = this.snake.body.length;
        document.getElementById('gameTime').textContent = this.formatTime(this.gameTime);
        
        // Переключение экранов
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    playSound(soundName) {
        try {
            const audio = document.getElementById(soundName + 'Sound');
            if (audio && audio.readyState >= 2) { // HAVE_CURRENT_DATA или выше
                audio.currentTime = 0;
                audio.play().catch(() => {
                    // Игнорируем ошибки автовоспроизведения
                    console.log(`Звук ${soundName} не может быть воспроизведен`);
                });
            }
        } catch (error) {
            // Игнорируем ошибки со звуками
            console.log(`Ошибка воспроизведения звука ${soundName}:`, error.message);
        }
    }
    
    // Методы для сетевого взаимодействия
    addPlayer(playerData) {
        const player = new Snake(this, playerData);
        this.players.set(playerData.id, player);
    }
    
    removePlayer(playerId) {
        this.players.delete(playerId);
    }
    
    updatePlayer(playerData) {
        const player = this.players.get(playerData.id);
        if (player) {
            player.updateFromData(playerData);
        }
    }
}

// Класс змейки
class Snake {
    constructor(game) {
        this.game = game;
        this.body = [
            { x: game.width / 2, y: game.height / 2 },
            { x: game.width / 2 - game.gridSize, y: game.height / 2 },
            { x: game.width / 2 - game.gridSize * 2, y: game.height / 2 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.speed = 1;
        this.isGhost = false;
        this.isMagnet = false;
        this.speedBoostEnd = 0;
        this.ghostModeEnd = 0;
        this.magnetModeEnd = 0;
    }
    
    update() {
        // Обновление направления
        this.direction = this.nextDirection;
        
        // Обновление эффектов
        this.updateEffects();
        
        // Движение
        this.move();
        
        // Магнитный режим
        if (this.isMagnet) {
            this.attractFood();
        }
    }
    
    updateEffects() {
        const now = Date.now();
        
        if (now > this.speedBoostEnd) {
            this.speed = 1;
        }
        
        if (now > this.ghostModeEnd) {
            this.isGhost = false;
        }
        
        if (now > this.magnetModeEnd) {
            this.isMagnet = false;
        }
    }
    
    move() {
        const head = { ...this.body[0] };
        
        switch (this.direction) {
            case 'up':
                head.y -= this.game.gridSize;
                break;
            case 'down':
                head.y += this.game.gridSize;
                break;
            case 'left':
                head.x -= this.game.gridSize;
                break;
            case 'right':
                head.x += this.game.gridSize;
                break;
        }
        
        this.body.unshift(head);
        this.body.pop();
    }
    
    grow() {
        const tail = { ...this.body[this.body.length - 1] };
        this.body.push(tail);
    }
    
    changeDirection(newDirection) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        
        if (opposites[newDirection] !== this.direction) {
            this.nextDirection = newDirection;
        }
    }
    
    checkSelfCollision() {
        if (this.isGhost) return false;
        
        const head = this.body[0];
        return this.body.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }
    
    attractFood() {
        const head = this.body[0];
        const food = this.game.food;
        
        const distance = Math.sqrt(
            Math.pow(head.x - food.x, 2) + Math.pow(head.y - food.y, 2)
        );
        
        if (distance < 100) {
            const angle = Math.atan2(food.y - head.y, food.x - head.x);
            food.x -= Math.cos(angle) * 2;
            food.y -= Math.sin(angle) * 2;
        }
    }
    
    speedBoost(duration) {
        this.speed = 1.5;
        this.speedBoostEnd = Date.now() + duration;
    }
    
    ghostMode(duration) {
        this.isGhost = true;
        this.ghostModeEnd = Date.now() + duration;
    }
    
    magnetMode(duration) {
        this.isMagnet = true;
        this.magnetModeEnd = Date.now() + duration;
    }
    
    render() {
        this.ctx = this.game.ctx;
        
        this.body.forEach((segment, index) => {
            if (index === 0) {
                this.renderHead(segment);
            } else {
                this.renderBody(segment, index);
            }
        });
    }
    
    renderHead(segment) {
        this.ctx.save();
        
        // Призрачный режим
        if (this.isGhost) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // Рендеринг головы в зависимости от выбранного скина
        this.renderSkin(segment, true);
        
        // Рендеринг дополнительных элементов головы
        this.renderHeadAccessory(segment);
        
        this.ctx.restore();
    }
    
    renderBody(segment, index) {
        this.ctx.save();
        
        // Призрачный режим
        if (this.isGhost) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // Рендеринг тела в зависимости от выбранного скина
        this.renderSkin(segment, false, index);
        
        this.ctx.restore();
    }
    
    renderSkin(segment, isHead, index = 0) {
        const skin = this.game.playerSettings.skin;
        
        switch (skin) {
            case 'neon':
                this.renderNeonSkin(segment, isHead, index);
                break;
            case 'golden':
                this.renderGoldenSkin(segment, isHead, index);
                break;
            case 'rainbow':
                this.renderRainbowSkin(segment, isHead, index);
                break;
            case 'fire':
                this.renderFireSkin(segment, isHead, index);
                break;
            case 'ice':
                this.renderIceSkin(segment, isHead, index);
                break;
            default:
                this.renderDefaultSkin(segment, isHead, index);
        }
    }
    
    renderDefaultSkin(segment, isHead, index) {
        const size = isHead ? this.game.gridSize : this.game.gridSize - 2;
        const x = segment.x + (this.game.gridSize - size) / 2;
        const y = segment.y + (this.game.gridSize - size) / 2;
        
        if (isHead) {
            this.ctx.fillStyle = '#00ff88';
        } else {
            const alpha = 1 - (index / this.body.length) * 0.3;
            this.ctx.fillStyle = `rgba(0, 204, 106, ${alpha})`;
        }
        
        this.ctx.fillRect(x, y, size, size);
        
        // Градиент
        const gradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, size, size);
    }
    
    renderNeonSkin(segment, isHead, index) {
        const size = this.game.gridSize;
        const x = segment.x;
        const y = segment.y;
        
        // Неоновое свечение
        this.ctx.shadowColor = isHead ? '#ff00ff' : '#00ffff';
        this.ctx.shadowBlur = 10;
        
        this.ctx.fillStyle = isHead ? '#ff00ff' : '#00ffff';
        this.ctx.fillRect(x, y, size, size);
        
        // Пульсация
        const pulse = Math.sin(Date.now() * 0.01 + index) * 0.3 + 0.7;
        this.ctx.globalAlpha = pulse;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    renderGoldenSkin(segment, isHead, index) {
        const size = this.game.gridSize;
        const x = segment.x;
        const y = segment.y;
        
        // Золотой градиент
        const gradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(0.5, '#ffb347');
        gradient.addColorStop(1, '#ff8c00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, size, size);
        
        // Блики
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fillRect(x + 2, y + 2, size / 3, size / 3);
    }
    
    renderRainbowSkin(segment, isHead, index) {
        const size = this.game.gridSize;
        const x = segment.x;
        const y = segment.y;
        
        // Радужный эффект
        const hue = (Date.now() * 0.1 + index * 30) % 360;
        this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        this.ctx.fillRect(x, y, size, size);
        
        // Дополнительное свечение
        this.ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
        this.ctx.shadowBlur = 5;
        this.ctx.fillRect(x, y, size, size);
        this.ctx.shadowBlur = 0;
    }
    
    renderFireSkin(segment, isHead, index) {
        const size = this.game.gridSize;
        const x = segment.x;
        const y = segment.y;
        
        // Огненный градиент
        const gradient = this.ctx.createLinearGradient(x, y, x, y + size);
        gradient.addColorStop(0, '#ff4500');
        gradient.addColorStop(0.5, '#ff6347');
        gradient.addColorStop(1, '#ff8c00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, size, size);
        
        // Эффект пламени
        const flameIntensity = Math.sin(Date.now() * 0.02 + index) * 0.3 + 0.7;
        this.ctx.globalAlpha = flameIntensity;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        this.ctx.globalAlpha = 1;
    }
    
    renderIceSkin(segment, isHead, index) {
        const size = this.game.gridSize;
        const x = segment.x;
        const y = segment.y;
        
        // Ледяной градиент
        const gradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(0.5, '#b0e0e6');
        gradient.addColorStop(1, '#e0f6ff');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, size, size);
        
        // Кристаллический эффект
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    }
    
    renderHeadAccessory(segment) {
        const headType = this.game.playerSettings.head;
        const size = this.game.gridSize;
        const x = segment.x;
        const y = segment.y;
        
        switch (headType) {
            case 'crown':
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillRect(x + size * 0.3, y - 5, size * 0.4, 5);
                this.ctx.fillRect(x + size * 0.2, y - 8, size * 0.6, 3);
                break;
            case 'sunglasses':
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(x + 3, y + 5, 6, 3);
                this.ctx.fillRect(x + 11, y + 5, 6, 3);
                break;
            case 'hat':
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(x + 2, y - 3, size - 4, 3);
                this.ctx.fillRect(x + 4, y - 6, size - 8, 3);
                break;
        }
    }
    
    // Методы для сетевого взаимодействия
    updateFromData(data) {
        this.body = data.body;
        this.direction = data.direction;
        this.speed = data.speed;
        this.isGhost = data.isGhost;
        this.isMagnet = data.isMagnet;
    }
}

// Класс еды
class Food {
    constructor(game) {
        this.game = game;
        this.respawn();
        this.pulse = 0;
    }
    
    respawn() {
        const maxX = Math.floor(this.game.width / this.game.gridSize);
        const maxY = Math.floor(this.game.height / this.game.gridSize);
        
        do {
            this.x = Math.floor(Math.random() * maxX) * this.game.gridSize;
            this.y = Math.floor(Math.random() * maxY) * this.game.gridSize;
        } while (this.checkSnakeCollision());
    }
    
    checkSnakeCollision() {
        return this.game.snake.body.some(segment => 
            segment.x === this.x && segment.y === this.y
        );
    }
    
    checkCollision(head) {
        return head.x === this.x && head.y === this.y;
    }
    
    update() {
        this.pulse += 0.1;
    }
    
    render() {
        this.ctx = this.game.ctx;
        
        const size = this.game.gridSize;
        const pulseSize = Math.sin(this.pulse) * 2;
        
        // Основной цвет еды
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(
            this.x + pulseSize, 
            this.y + pulseSize, 
            size - pulseSize * 2, 
            size - pulseSize * 2
        );
        
        // Градиент
        const gradient = this.ctx.createRadialGradient(
            this.x + size/2, this.y + size/2, 0,
            this.x + size/2, this.y + size/2, size/2
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#ff6b6b');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.x + pulseSize + 2, 
            this.y + pulseSize + 2, 
            size - pulseSize * 2 - 4, 
            size - pulseSize * 2 - 4
        );
        
        // Свечение
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(this.x, this.y, size, size);
        this.ctx.shadowBlur = 0;
    }
}

// Класс пауэрапов
class Powerup {
    constructor(game, type) {
        this.game = game;
        this.type = type;
        this.respawn();
        this.isActive = true;
        this.collected = false;
        this.rotation = 0;
    }
    
    respawn() {
        const maxX = Math.floor(this.game.width / this.game.gridSize);
        const maxY = Math.floor(this.game.height / this.game.gridSize);
        
        do {
            this.x = Math.floor(Math.random() * maxX) * this.game.gridSize;
            this.y = Math.floor(Math.random() * maxY) * this.game.gridSize;
        } while (this.checkSnakeCollision());
    }
    
    checkSnakeCollision() {
        return this.game.snake.body.some(segment => 
            segment.x === this.x && segment.y === this.y
        );
    }
    
    checkCollision(head) {
        return head.x === this.x && head.y === this.y;
    }
    
    collect() {
        this.collected = true;
        this.isActive = false;
    }
    
    update() {
        this.rotation += 0.05;
        
        // Автоматическое исчезновение через 10 секунд
        if (Date.now() - this.spawnTime > 10000) {
            this.isActive = false;
        }
    }
    
    render() {
        this.ctx = this.game.ctx;
        
        const size = this.game.gridSize;
        const centerX = this.x + size / 2;
        const centerY = this.y + size / 2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.rotation);
        
        // Рендеринг в зависимости от типа
        switch (this.type) {
            case 'speed':
                this.renderSpeedPowerup();
                break;
            case 'ghost':
                this.renderGhostPowerup();
                break;
            case 'magnet':
                this.renderMagnetPowerup();
                break;
        }
        
        this.ctx.restore();
        
        // Свечение
        this.ctx.shadowColor = this.getPowerupColor();
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = this.getPowerupColor();
        this.ctx.fillRect(this.x, this.y, size, size);
        this.ctx.shadowBlur = 0;
    }
    
    getPowerupColor() {
        switch (this.type) {
            case 'speed': return '#ffff00';
            case 'ghost': return '#00ffff';
            case 'magnet': return '#ff00ff';
            default: return '#ffffff';
        }
    }
    
    renderSpeedPowerup() {
        const size = this.game.gridSize;
        
        // Молния
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.moveTo(-size/4, -size/3);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(size/4, -size/3);
        this.ctx.lineTo(0, size/3);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    renderGhostPowerup() {
        const size = this.game.gridSize;
        
        // Призрак
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(0, -size/4, size/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-size/3, -size/4);
        this.ctx.lineTo(-size/3, size/4);
        this.ctx.lineTo(size/3, size/4);
        this.ctx.lineTo(size/3, -size/4);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    renderMagnetPowerup() {
        const size = this.game.gridSize;
        
        // Магнит
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.fillRect(-size/3, -size/3, size/1.5, size/1.5);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-size/4, -size/4, size/2, size/2);
    }
}

// Класс частиц
class Particle {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1;
        this.decay = 0.02;
        this.isActive = true;
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
        
        if (this.life <= 0) {
            this.isActive = false;
        }
    }
    
    render() {
        this.ctx = this.game.ctx;
        
        this.ctx.save();
        this.ctx.globalAlpha = this.life;
        
        switch (this.type) {
            case 'eat':
                this.ctx.fillStyle = '#00ff88';
                break;
            case 'powerup':
                this.ctx.fillStyle = '#ffff00';
                break;
            case 'collision':
                this.ctx.fillStyle = '#ff0000';
                break;
            default:
                this.ctx.fillStyle = '#ffffff';
        }
        
        this.ctx.fillRect(
            this.x - this.size/2, 
            this.y - this.size/2, 
            this.size, 
            this.size
        );
        
        this.ctx.restore();
    }
} 