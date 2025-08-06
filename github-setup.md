# 📁 Настройка GitHub репозитория

## 📋 Обзор
Для деплоя на большинстве платформ нужен GitHub репозиторий.

## 🎯 Пошаговая инструкция:

### 1. **Создайте репозиторий на GitHub**
- Зайдите на [github.com](https://github.com)
- Нажмите "New repository"
- Назовите: `snake-io-game`
- Сделайте публичным

### 2. **Инициализируйте Git локально**
```bash
# В папке с игрой
git init
git add .
git commit -m "Initial commit: Snake.io multiplayer game"
```

### 3. **Создайте файл `.gitignore`**
```
node_modules/
.env
.DS_Store
*.log
```

### 4. **Создайте README.md**
```markdown
# Snake.io Multiplayer Game

Онлайн игра в стиле Slither.io с мультиплеером.

## Запуск
1. `npm install`
2. `npm start`
3. Откройте `index.html` в браузере

## Технологии
- HTML5 Canvas
- JavaScript ES6+
- WebSocket
- Node.js
```

### 5. **Загрузите на GitHub**
```bash
git remote add origin https://github.com/your-username/snake-io-game.git
git branch -M main
git push -u origin main
```

### 6. **Структура файлов**
```
snake-io-game/
├── index.html
├── styles.css
├── js/
│   ├── main.js
│   ├── game.js
│   ├── ui.js
│   └── network.js
├── server.js
├── package.json
├── README.md
└── .gitignore
```

## ✅ Готово!
Теперь у вас есть репозиторий для деплоя на любую платформу. 