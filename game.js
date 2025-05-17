// Main game file
// Audio elements
const audio = {
    mainMenu: new Audio('./music/mainmenu.mp3'),
    gameMusic: new Audio('./music/stage1.mp3'),
    bomb: new Audio('./music/bomb.wav'),
    shoot: new Audio('./music/gun.wav'),
    timeShift: new Audio('./music/timeshift.wav'),
    die: new Audio('./music/die.wav'),
    win: new Audio('./music/win.wav'),
    lose: new Audio('./music/lose.wav'),
    powerup: new Audio('./music/powerup.wav'),
    select: new Audio('./music/select.wav')
};

// Set loops for background music
audio.mainMenu.loop = true;
audio.gameMusic.loop = true;

// Audio volume settings
let musicVolume = 0.5;
let sfxVolume = 0.5;

function updateVolumes() {
    // Update music volume
    audio.mainMenu.volume = musicVolume;
    audio.gameMusic.volume = musicVolume;
    
    // Update sound effects volume
    audio.bomb.volume = sfxVolume;
    audio.shoot.volume = sfxVolume;
    audio.timeShift.volume = sfxVolume;
    audio.die.volume = sfxVolume;
    audio.win.volume = sfxVolume;
    audio.lose.volume = sfxVolume;
    audio.powerup.volume = sfxVolume;
    audio.select.volume = sfxVolume;
}

// Game variables
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// Game state
let gameState = {
    running: false,
    paused: false,
    characterSelected: null,
    score: 0,
    lives: 3,
    bombs: 3,
    power: 1,
    maxPower: 4,
    timeEnergy: 100,
    maxTimeEnergy: 100,
    timeShiftActive: false,
    elapsedTime: 0,
    bossPhase: false,
    gameProgress: 0,
    gameWon: false
};

// Assets loading
const images = {
    background: loadImage('./model/background.png'),
    reimu: loadImage('./model/reimu.png'),
    flandre: loadImage('./model/flandre.png'),
    enemy1: loadImage('./model/enemy_1.png'),
    enemy2: loadImage('./model/enemy_2.png'),
    boss: loadImage('./model/sigma.png'),
    powerup: loadImage('./model/power.png'),
    heart: loadImage('./model/heart.png'),
    bomb: loadImage('./model/bomb.png')
};

function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

// Game entities
let player = null;
let playerBullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];
let background = {
    y: 0,
    speed: 0.5, // Slower and smoother scrolling speed
    image: images.background
};
let boss = null;

// Controls
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    shift: false,
    z: false,
    c: false
};

// Utility functions
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Classes
class Entity {
    constructor(x, y, width, height, speed, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.image = image;
        this.markedForDeletion = false;
    }

    draw() {
        ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
}

class Player extends Entity {
    constructor(x, y, width, height, speed, image) {
        super(x, y, width, height, speed, image);
        this.hitboxRadius = 5;
        this.shootCooldown = 0;
        this.invulnerable = 0;
        this.normalSpeed = speed;
        this.timeShiftSpeed = speed * 0.75;
    }

    update(deltaTime) {
        // Movement
        const currentSpeed = gameState.timeShiftActive ? this.timeShiftSpeed : this.normalSpeed;
        
        if (keys.up && this.y - this.height / 2 > 0) {
            this.y -= currentSpeed;
        }
        if (keys.down && this.y + this.height / 2 < CANVAS_HEIGHT) {
            this.y += currentSpeed;
        }
        if (keys.left && this.x - this.width / 2 > 0) {
            this.x -= currentSpeed;
        }
        if (keys.right && this.x + this.width / 2 < CANVAS_WIDTH) {
            this.x += currentSpeed;
        }

        // Shooting
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        if (keys.z && this.shootCooldown <= 0) {
            this.shoot();
            audio.shoot.currentTime = 0;
            audio.shoot.play();
            this.shootCooldown = 0.1; // 200ms cooldown
        }

        // Bomb
        if (keys.c && gameState.bombs > 0 && !this.bombUsed) {
            this.useBomb();
            this.bombUsed = true;
        } else if (!keys.c) {
            this.bombUsed = false;
        }

        // Invulnerability frames
        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
        }
    }

    shoot() {
        const powerLevel = Math.floor(gameState.power);
        
        if (powerLevel === 1) {
            playerBullets.push(new Bullet(this.x, this.y - 15, 8, 16, 10, 'player'));
        }
        else if (powerLevel === 5) {
            playerBullets.push(new Bullet(this.x - 10, this.y - 15, 8, 16, 10, 'player'));
            playerBullets.push(new Bullet(this.x + 10, this.y - 15, 8, 16, 10, 'player'));
        }
        else if (powerLevel === 10) {
            playerBullets.push(new Bullet(this.x, this.y - 20, 8, 16, 10, 'player'));
            playerBullets.push(new Bullet(this.x - 15, this.y - 10, 8, 16, 10, 'player', -0.2));
            playerBullets.push(new Bullet(this.x + 15, this.y - 10, 8, 16, 10, 'player', 0.2));
        }
        else if (powerLevel === 4) {
            playerBullets.push(new Bullet(this.x - 10, this.y - 15, 8, 16, 10, 'player'));
            playerBullets.push(new Bullet(this.x + 10, this.y - 15, 8, 16, 10, 'player'));
            playerBullets.push(new Bullet(this.x - 20, this.y - 5, 8, 16, 10, 'player', -0.3));
            playerBullets.push(new Bullet(this.x + 20, this.y - 5, 8, 16, 10, 'player', 0.3));
        }
    }

    useBomb() {
        gameState.bombs--;
        audio.bomb.play();
        
        // Clear all enemy bullets and damage all enemies
        enemyBullets = [];
        
        enemies.forEach(enemy => {
            enemy.health -= 5;
            if (enemy.health <= 0) {
                enemy.markedForDeletion = true;
                gameState.score += enemy.pointValue;
            }
        });
        
        if (boss) {
            boss.health -= 20;
            if (boss.health <= 0) {
                boss = null;
                gameState.gameWon = true;
            }
        }
        
        // Temporary invulnerability
        this.invulnerable = 3; // 3 seconds
        
        updateBombsDisplay();
    }

    draw() {
        super.draw();
        
        // Draw hitbox - red gradient circle
        let opacity = 1;
        if (this.invulnerable > 0) {
            opacity = (Math.sin(Date.now() / 50) + 1) / 2 * 0.8 + 0.2;
        }
        
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.hitboxRadius
        );
        gradient.addColorStop(0, `rgba(255, 50, 50, ${opacity})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.hitboxRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Invulnerability effect
        if (this.invulnerable > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.hitboxRadius + 8, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.stroke();
        }
    }
}

class Enemy extends Entity {
    constructor(x, y, width, height, speed, image, health = 3, pointValue = 100, bulletPattern = 'basic') {
        super(x, y, width, height, speed, image);
        this.health = health;
        this.pointValue = pointValue;
        this.bulletPattern = bulletPattern;
        this.shootTimer = randomBetween(1, 3);
        this.normalSpeed = speed;
        this.timeShiftSpeed = speed * 0.25;
    }

    update(deltaTime) {
        const currentSpeed = gameState.timeShiftActive ? this.timeShiftSpeed : this.normalSpeed;
        this.y += currentSpeed * deltaTime * 60;
        
        if (this.y > CANVAS_HEIGHT + this.height / 2) {
            this.markedForDeletion = true;
        }
        
        // Shooting logic
        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = randomBetween(2, 4);
        }
    }

    shoot() {
        if (!player) return;
        
        switch (this.bulletPattern) {
            case 'basic':
                // Single bullet aimed at player
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                enemyBullets.push(new Bullet(
                    this.x, 
                    this.y,
                    8,
                    8,
                    3,
                    'enemy',
                    Math.cos(angle),
                    Math.sin(angle)
                ));
                break;
                
            case 'spread':
                // 3-way spread
                for (let i = -1; i <= 1; i++) {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x) + i * 0.3;
                    enemyBullets.push(new Bullet(
                        this.x,
                        this.y,
                        8,
                        8,
                        3,
                        'enemy',
                        Math.cos(angle),
                        Math.sin(angle)
                    ));
                }
                break;
        }
    }
}

class Boss extends Entity {
    constructor(x, y, width, height, speed, image) {
        super(x, y, width, height, speed, image);
        this.health = 100;
        this.maxHealth = 100;
        this.pointValue = 10000;
        this.attackPatterns = ['circle', 'aimed', 'spiral'];
        this.currentPattern = 0;
        this.shootTimer = 1;
        this.patternTimer = 10;
        this.angleOffset = 0;
        this.normalSpeed = speed;
        this.timeShiftSpeed = speed * 0.25;
        this.targetX = CANVAS_WIDTH / 2;
        this.targetY = 150;
        this.moveSpeed = 2;
    }

    update(deltaTime) {
        // Move toward target position
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
            const currentSpeed = gameState.timeShiftActive ? this.timeShiftSpeed : this.normalSpeed;
            this.x += dx / distance * currentSpeed;
            this.y += dy / distance * currentSpeed;
        }
        
        // Change target occasionally
        if (Math.random() < 0.005) {
            this.targetX = randomBetween(100, CANVAS_WIDTH - 100);
        }
        
        // Shooting logic
        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = gameState.timeShiftActive ? 0.5 : 0.2;
        }
        
        // Pattern switching
        this.patternTimer -= deltaTime;
        if (this.patternTimer <= 0) {
            this.currentPattern = (this.currentPattern + 1) % this.attackPatterns.length;
            this.patternTimer = 10;
        }
        
        this.angleOffset += 0.03;
    }

    shoot() {
        switch (this.attackPatterns[this.currentPattern]) {
            case 'circle':
                // Circle pattern - bullets in all directions
                const bulletsCount = 12;
                for (let i = 0; i < bulletsCount; i++) {
                    const angle = (i / bulletsCount) * Math.PI * 2 + this.angleOffset;
                    enemyBullets.push(new Bullet(
                        this.x,
                        this.y,
                        10,
                        10,
                        2.5,
                        'enemy',
                        Math.cos(angle),
                        Math.sin(angle)
                    ));
                }
                break;
                
            case 'aimed':
                // Aimed shots at player
                if (player) {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    // Fire 5 bullets in a spread
                    for (let i = -2; i <= 2; i++) {
                        enemyBullets.push(new Bullet(
                            this.x,
                            this.y,
                            10,
                            10,
                            3,
                            'enemy',
                            Math.cos(angle + i * 0.15),
                            Math.sin(angle + i * 0.15)
                        ));
                    }
                }
                break;
                
            case 'spiral':
                // Spiral pattern
                for (let i = 0; i < 3; i++) {
                    const angle = this.angleOffset + (i * Math.PI * 2 / 3);
                    enemyBullets.push(new Bullet(
                        this.x,
                        this.y,
                        10,
                        10,
                        3,
                        'enemy',
                        Math.cos(angle),
                        Math.sin(angle)
                    ));
                }
                break;
        }
    }

    draw() {
        super.draw();
        
        // Draw health bar
        const barWidth = 200;
        const barHeight = 15;
        const x = (CANVAS_WIDTH - barWidth) / 2;
        const y = 20;
        
        // Background of health bar
        ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Health portion
        const healthRatio = this.health / this.maxHealth;
        const healthWidth = barWidth * healthRatio;
        
        const gradient = ctx.createLinearGradient(x, y, x + healthWidth, y);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(1, '#ff5500');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, healthWidth, barHeight);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}

class Bullet {
    constructor(x, y, width, height, speed, type, dirX = 0, dirY = -1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.type = type;
        this.dirX = dirX;
        this.dirY = dirY;
        this.markedForDeletion = false;
        this.normalSpeed = speed;
        this.timeShiftSpeed = type === 'player' ? speed * 0.75 : speed * 0.25;
    }

    update(deltaTime) {
        const currentSpeed = gameState.timeShiftActive ? this.timeShiftSpeed : this.normalSpeed;
        this.x += this.dirX * currentSpeed;
        this.y += this.dirY * currentSpeed;
        
        // Out of bounds check
        if (this.y < -this.height || this.y > CANVAS_HEIGHT + this.height || 
            this.x < -this.width || this.x > CANVAS_WIDTH + this.width) {
            this.markedForDeletion = true;
        }
    }

    draw() {
        ctx.save();
        
        if (this.type === 'player') {
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#88bbff');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
            
            // Glow effect
            ctx.shadowColor = '#88bbff';
            ctx.shadowBlur = 10;
        } else {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.width/2);
            gradient.addColorStop(0, '#ff7700');
            gradient.addColorStop(1, '#ff0000');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow effect
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
        }
        
        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'power', 'heart', or 'bomb'
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.markedForDeletion = false;
        this.image = type === 'power' ? images.powerup : 
                     type === 'heart' ? images.heart : 
                     images.bomb;
    }

    update() {
        this.y += this.speed;
        
        if (this.y > CANVAS_HEIGHT + this.height) {
            this.markedForDeletion = true;
        }
        
        // Check collision with player
        if (player && distance(this.x, this.y, player.x, player.y) < 30) {
            this.collect();
        }
    }

    draw() {
        ctx.drawImage(this.image, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Add glow effect
        ctx.save();
        ctx.shadowColor = this.type === 'power' ? '#ffff00' : 
                          this.type === 'heart' ? '#ff0000' : 
                          '#0088ff';
        ctx.shadowBlur = 10;
        ctx.drawImage(this.image, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.restore();
    }

    collect() {
        audio.powerup.currentTime = 0;
        audio.powerup.play();
        
        switch (this.type) {
            case 'power':
                if (gameState.power < gameState.maxPower) {
                    // Each power-up adds 1.0 power level (changed from 0.5)
                    gameState.power += 1.0;
                    if (gameState.power > gameState.maxPower) {
                        gameState.power = gameState.maxPower;
                    }
                } else {
                    // Give points instead
                    gameState.score += 500;
                }
                updatePowerBar();
                break;
                
            case 'heart':
                if (gameState.lives < 5) {
                    gameState.lives++;
                    updateLivesDisplay();
                } else {
                    // Give points instead
                    gameState.score += 1000;
                }
                break;
                
            case 'bomb':
                if (gameState.bombs < 5) {
                    gameState.bombs++;
                    updateBombsDisplay();
                } else {
                    // Give points instead
                    gameState.score += 750;
                }
                break;
        }
        
        document.getElementById('score-display').textContent = `Score: ${gameState.score}`;
        this.markedForDeletion = true;
    }
}

// Game initialization
function initGame() {
    gameState.running = true;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.bombs = 3;
    gameState.power = 1;
    gameState.timeEnergy = gameState.maxTimeEnergy;
    gameState.timeShiftActive = false;
    gameState.elapsedTime = 0;
    gameState.gameProgress = 0;
    gameState.bossPhase = false;
    gameState.gameWon = false;
    
    player = new Player(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 100,
        50,
        50,
        5,
        gameState.characterSelected === 'reimu' ? images.reimu : images.flandre
    );
    
    playerBullets = [];
    enemies = [];
    enemyBullets = [];
    powerups = [];
    boss = null;
    
    // Initialize UI
    document.getElementById('score-display').textContent = `Score: ${gameState.score}`;
    updateLivesDisplay();
    updateBombsDisplay();
    updateTimeEnergyBar();
    updatePowerBar();
}

function updateLivesDisplay() {
    const livesContainer = document.getElementById('lives-container');
    livesContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.lives; i++) {
        const lifeIcon = document.createElement('img');
        lifeIcon.src = './model/heart.png';
        lifeIcon.classList.add('life-icon');
        livesContainer.appendChild(lifeIcon);
    }
}

function updateBombsDisplay() {
    const bombsContainer = document.getElementById('bombs-container');
    bombsContainer.innerHTML = '';
    
    for (let i = 0; i < gameState.bombs; i++) {
        const bombIcon = document.createElement('img');
        bombIcon.src = './model/bomb.png';
        bombIcon.classList.add('bomb-icon');
        bombsContainer.appendChild(bombIcon);
    }
}

function updateTimeEnergyBar() {
    const energyBar = document.getElementById('time-energy-bar');
    const energyValue = document.getElementById('time-energy-value');
    const percentage = (gameState.timeEnergy / gameState.maxTimeEnergy) * 100;
    
    energyBar.style.width = `${percentage}%`;
    energyValue.textContent = Math.round(gameState.timeEnergy);
}

function updatePowerBar() {
    const powerBar = document.getElementById('power-bar');
    const powerValue = document.getElementById('power-value');
    const percentage = (gameState.power / gameState.maxPower) * 100;
    
    powerBar.style.width = `${percentage}%`;
    powerValue.textContent = gameState.power.toFixed(1);
}

function updateProgressBar() {
    if (gameState.bossPhase) return;
    
    const progressBar = document.getElementById('progress-bar');
    gameState.gameProgress += 1/60/120; // 2 minutes in 60fps steps
    
    if (gameState.gameProgress >= 1) {
        gameState.gameProgress = 1;
        startBossPhase();
    }
    
    // Create Touhou-style animated effect for progress bar
    const progressWidth = gameState.gameProgress * 100;
    progressBar.style.width = `${progressWidth}%`;
    
    // Add flickering effect at the edge
    if (progressWidth > 0) {
        const flickerIntensity = (Math.sin(Date.now() / 100) + 1) / 2;
        progressBar.style.boxShadow = `0 0 ${5 + flickerIntensity * 10}px #ff00ff`;
    }
}

function startBossPhase() {
    gameState.bossPhase = true;
    boss = new Boss(CANVAS_WIDTH / 2, -100, 100, 100, 3, images.boss);
}

// Spawn enemies
function spawnEnemy() {
    if (gameState.bossPhase) return;
    
    const x = randomBetween(50, CANVAS_WIDTH - 50);
    const y = -50;
    const type = Math.random() > 0.5 ? 'enemy1' : 'enemy2';
    const image = type === 'enemy1' ? images.enemy1 : images.enemy2;
    const pattern = Math.random() > 0.7 ? 'spread' : 'basic';
    
    enemies.push(new Enemy(x, y, 40, 40, 2, image, 3, 100, pattern));
}

function spawnPowerUp(x, y) {
    const random = Math.random();
    let type;
    
    if (random < 0.6) {
        type = 'power';
    } else if (random < 0.85) {
        type = 'heart';
    } else {
        type = 'bomb';
    }
    
    powerups.push(new PowerUp(x, y, type));
}

// Collision detection
function checkCollisions() {
    // Player bullets vs enemies
    playerBullets.forEach(bullet => {
        enemies.forEach(enemy => {
            if (distance(bullet.x, bullet.y, enemy.x, enemy.y) < (enemy.width / 2 + bullet.width / 2)) {
                enemy.health--;
                bullet.markedForDeletion = true;
                
                if (enemy.health <= 0) {
                    enemy.markedForDeletion = true;
                    gameState.score += enemy.pointValue;
                    document.getElementById('score-display').textContent = `Score: ${gameState.score}`;
                    
                    // Chance to spawn power-up
                    if (Math.random() < 0.3) {
                        spawnPowerUp(enemy.x, enemy.y);
                    }
                }
            }
        });
        
        // Player bullets vs boss
        if (boss && distance(bullet.x, bullet.y, boss.x, boss.y) < (boss.width / 2 + bullet.width / 2)) {
            boss.health -= 1;
            bullet.markedForDeletion = true;
            
            if (boss.health <= 0) {
                boss = null;
                gameState.score += 10000;
                document.getElementById('score-display').textContent = `Score: ${gameState.score}`;
                gameState.gameWon = true;
                audio.win.play();
            }
        }
    });
    
    // Enemy bullets vs player
    if (player && player.invulnerable <= 0) {
        for (let i = 0; i < enemyBullets.length; i++) {
            const bullet = enemyBullets[i];
            if (distance(bullet.x, bullet.y, player.x, player.y) < player.hitboxRadius) {
                bullet.markedForDeletion = true;
                playerHit();
                break;
            }
        }
    }
}

function playerHit() {
    gameState.lives--;
    updateLivesDisplay();
    
    audio.die.currentTime = 0;
    audio.die.play();
    
    // Reduce power level
    if (gameState.power > 1) {
        gameState.power--;
        updatePowerBar();
    }
    
    player.invulnerable = 2; // 2 seconds of invulnerability
    
    if (gameState.lives <= 0) {
        gameOver(false);
    } else {
        // Reset player position
        player.x = CANVAS_WIDTH / 2;
        player.y = CANVAS_HEIGHT - 100;
    }
}

function gameOver(won) {
    gameState.running = false;
    
    setTimeout(() => {
        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
        
        if (won) {
            document.getElementById('game-over-text').textContent = "You Win!";
            audio.win.play();
        } else {
            document.getElementById('game-over-text').textContent = "Game Over";
            audio.lose.play();
        }
        
        document.getElementById('final-score').textContent = `Final Score: ${gameState.score}`;
        
        saveHighScore(gameState.score);
    }, 1000);
}

// High score handling
function saveHighScore(score) {
    let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    
    highScores.push({
        score: score,
        date: new Date().toLocaleDateString()
    });
    
    highScores.sort((a, b) => b.score - a.score);
    
    if (highScores.length > 10) {
        highScores = highScores.slice(0, 10);
    }
    
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

function displayHighScores() {
    const highScoreList = document.getElementById('highscore-list');
    highScoreList.innerHTML = '';
    
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    
    if (highScores.length === 0) {
        const noScoresMsg = document.createElement('div');
        noScoresMsg.textContent = 'No high scores yet!';
        noScoresMsg.className = 'highscore-entry';
        highScoreList.appendChild(noScoresMsg);
        return;
    }
    
    highScores.forEach((entry, index) => {
        const scoreEntry = document.createElement('div');
        scoreEntry.className = 'highscore-entry';
        
        const rank = document.createElement('span');
        rank.textContent = `${index + 1}.`;
        
        const scoreText = document.createElement('span');
        scoreText.textContent = `${entry.score.toLocaleString()}`;
        
        const dateText = document.createElement('span');
        dateText.textContent = entry.date;
        
        scoreEntry.appendChild(rank);
        scoreEntry.appendChild(scoreText);
        scoreEntry.appendChild(dateText);
        
        highScoreList.appendChild(scoreEntry);
    });
}

// Game loop
let lastTime = 0;
let enemySpawnTimer = 0;
let enemySpawnInterval = 1.5; // seconds

function gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = (timestamp - lastTime) / 1000; // convert to seconds
    lastTime = timestamp;
    
    if (gameState.running && !gameState.paused) {
        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Draw scrolling background
        const bgWidth = background.image.width || CANVAS_WIDTH;
        const bgHeight = background.image.height || CANVAS_HEIGHT;
        
        // Use the original background image size for better scaling
        const scaleFactor = Math.max(CANVAS_WIDTH / bgWidth, CANVAS_HEIGHT / bgHeight);
        const scaledWidth = bgWidth * scaleFactor;
        const scaledHeight = bgHeight * scaleFactor;
        
        // Center the background image
        const offsetX = (CANVAS_WIDTH - scaledWidth) / 2;
        
        // Update background position for smooth scrolling up
        background.y += background.speed;
        if (background.y >= scaledHeight) {
            background.y = 0;
        }
        
        // Draw background twice to create seamless scrolling
        ctx.drawImage(
            background.image, 
            offsetX, background.y - scaledHeight,
            scaledWidth, scaledHeight
        );
        ctx.drawImage(
            background.image,
            offsetX, background.y,
            scaledWidth, scaledHeight
        );
        
        // Update player
        player.update(deltaTime);
        
        // Time-shift logic
        if (keys.shift && gameState.timeEnergy > 0) {
            if (!gameState.timeShiftActive) {
                audio.timeShift.currentTime = 0;
                audio.timeShift.play();
            }
            gameState.timeShiftActive = true;
            gameState.timeEnergy -= 25 * deltaTime;
            
            if (gameState.timeEnergy <= 0) {
                gameState.timeEnergy = 0;
                gameState.timeShiftActive = false;
            }
        } else {
            gameState.timeShiftActive = false;
            gameState.timeEnergy += 2 * deltaTime;
            
            if (gameState.timeEnergy > gameState.maxTimeEnergy) {
                gameState.timeEnergy = gameState.maxTimeEnergy;
            }
        }
        
        updateTimeEnergyBar();
        
        // Time-shift visual effect
        if (gameState.timeShiftActive) {
            ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        
        // Spawn enemies
        enemySpawnTimer += deltaTime;
        if (enemySpawnTimer >= enemySpawnInterval && !gameState.bossPhase) {
            spawnEnemy();
            enemySpawnTimer = 0;
        }
        
        // Update game progress
        updateProgressBar();
        
        // Update boss if exists
        if (boss) {
            boss.update(deltaTime);
            boss.draw();
        }
        
        // Update bullets
        playerBullets.forEach(bullet => {
            bullet.update(deltaTime);
            bullet.draw();
        });
        
        enemyBullets.forEach(bullet => {
            bullet.update(deltaTime);
            bullet.draw();
        });
        
        // Update enemies
        enemies.forEach(enemy => {
            enemy.update(deltaTime);
            enemy.draw();
        });
        
        // Update powerups
        powerups.forEach(powerup => {
            powerup.update();
            powerup.draw();
        });
        
        // Draw player
        player.draw();
        
        // Check collisions
        checkCollisions();
        
        // Clean up deleted entities
        playerBullets = playerBullets.filter(bullet => !bullet.markedForDeletion);
        enemyBullets = enemyBullets.filter(bullet => !bullet.markedForDeletion);
        enemies = enemies.filter(enemy => !enemy.markedForDeletion);
        powerups = powerups.filter(powerup => !powerup.markedForDeletion);
        
        // Check game win condition
        if (gameState.gameWon) {
            gameOver(true);
        }
    }
    
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
            keys.up = true;
            break;
        case 'ArrowDown':
            keys.down = true;
            break;
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'Shift':
            keys.shift = true;
            break;
        case 'z':
        case 'Z':
            keys.z = true;
            break;
        case 'c':
        case 'C':
            keys.c = true;
            break;
        case 'Escape':
            if (gameState.running) {
                gameState.paused = !gameState.paused;
            }
            break;
    }
});

document.addEventListener('keyup', e => {
    switch (e.key) {
        case 'ArrowUp':
            keys.up = false;
            break;
        case 'ArrowDown':
            keys.down = false;
            break;
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'Shift':
            keys.shift = false;
            break;
        case 'z':
        case 'Z':
            keys.z = false;
            break;
        case 'c':
        case 'C':
            keys.c = false;
            break;
    }
});

// UI event listeners
document.getElementById('start-button').addEventListener('click', () => {
    audio.select.play();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('character-select').classList.remove('hidden');
    
    audio.mainMenu.pause();
    audio.mainMenu.currentTime = 0;
});

document.getElementById('options-button').addEventListener('click', () => {
    audio.select.play();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('options-menu').classList.remove('hidden');
});

document.getElementById('highscore-button').addEventListener('click', () => {
    audio.select.play();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('highscore-screen').classList.remove('hidden');
    displayHighScores();
});

document.getElementById('back-button').addEventListener('click', () => {
    audio.select.play();
    document.getElementById('highscore-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
});

document.getElementById('options-back-button').addEventListener('click', () => {
    audio.select.play();
    document.getElementById('options-menu').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    
    // Save volume settings to localStorage
    localStorage.setItem('musicVolume', musicVolume);
    localStorage.setItem('sfxVolume', sfxVolume);
});

// Volume sliders
document.getElementById('music-volume').addEventListener('input', function() {
    musicVolume = parseFloat(this.value);
    document.getElementById('music-volume-value').textContent = `${Math.round(musicVolume * 100)}%`;
    updateVolumes();
});

document.getElementById('sfx-volume').addEventListener('input', function() {
    sfxVolume = parseFloat(this.value);
    document.getElementById('sfx-volume-value').textContent = `${Math.round(sfxVolume * 100)}%`;
    updateVolumes();
});

document.getElementById('reimu').addEventListener('click', () => {
    audio.select.play();
    gameState.characterSelected = 'reimu';
    document.getElementById('reimu').classList.add('selected');
    document.getElementById('flandre').classList.remove('selected');
    
    setTimeout(() => {
        document.getElementById('character-select').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        initGame();
        
        audio.gameMusic.play();
    }, 500);
});

document.getElementById('flandre').addEventListener('click', () => {
    audio.select.play();
    gameState.characterSelected = 'flandre';
    document.getElementById('flandre').classList.add('selected');
    document.getElementById('reimu').classList.remove('selected');
    
    setTimeout(() => {
        document.getElementById('character-select').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        initGame();
        
        audio.gameMusic.play();
    }, 500);
});

document.getElementById('retry-button').addEventListener('click', () => {
    audio.select.play();
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    
    initGame();
    audio.gameMusic.currentTime = 0;
    audio.gameMusic.play();
});

document.getElementById('menu-button').addEventListener('click', () => {
    audio.select.play();
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    
    audio.gameMusic.pause();
    audio.mainMenu.play();
});

// Initialize volume settings from localStorage
function initializeVolumeSettings() {
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedSfxVolume = localStorage.getItem('sfxVolume');
    
    if (savedMusicVolume !== null) {
        musicVolume = parseFloat(savedMusicVolume);
        document.getElementById('music-volume').value = musicVolume;
        document.getElementById('music-volume-value').textContent = `${Math.round(musicVolume * 100)}%`;
    }
    
    if (savedSfxVolume !== null) {
        sfxVolume = parseFloat(savedSfxVolume);
        document.getElementById('sfx-volume').value = sfxVolume;
        document.getElementById('sfx-volume-value').textContent = `${Math.round(sfxVolume * 100)}%`;
    }
    
    updateVolumes();
}

// Start the game
window.onload = function() {
    // Initialize volume settings
    initializeVolumeSettings();
    
    // Play menu music
    audio.mainMenu.play();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
};