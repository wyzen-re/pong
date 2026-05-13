// Game State Manager
class GameStateManager {
    constructor() {
        this.state = 'loading';
        this.gameStats = this.loadStats();
        this.settings = this.loadSettings();
        this.currentDifficulty = 'normal';
        this.controlMode = 'mouse';
        this.particlesEnabled = true;
    }

    loadStats() {
        const saved = localStorage.getItem('gameStats');
        return saved ? JSON.parse(saved) : {
            highScore: 0,
            totalGames: 0,
            wins: 0
        };
    }

    saveStats() {
        localStorage.setItem('gameStats', JSON.stringify(this.gameStats));
    }

    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        return saved ? JSON.parse(saved) : {
            difficulty: 'normal',
            controlMode: 'mouse',
            particlesEnabled: true
        };
    }

    saveSettings() {
        const settings = {
            difficulty: this.currentDifficulty,
            controlMode: this.controlMode,
            particlesEnabled: this.particlesEnabled
        };
        localStorage.setItem('gameSettings', JSON.stringify(settings));
    }
}

// Initialize global state
const gameState = new GameStateManager();
let game;
let audioManager;

// UI Manager
class UIManager {
    constructor() {
        this.setupEventListeners();
        this.updateMenuStats();
    }

    setupEventListeners() {
        // Main Menu
        document.getElementById('playBtn').addEventListener('click', () => this.startGame());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('creditsBtn').addEventListener('click', () => this.showCredits());

        // Settings
        document.getElementById('backFromSettings').addEventListener('click', () => this.showMainMenu());
        document.getElementById('backFromCredits').addEventListener('click', () => this.showMainMenu());
        document.getElementById('resetSettings').addEventListener('click', () => this.resetSettings());

        // Volume sliders
        document.getElementById('masterVolume').addEventListener('input', (e) => {
            audioManager.setMasterVolume(e.target.value);
            document.getElementById('masterVolumeValue').textContent = e.target.value + '%';
        });
        document.getElementById('musicVolume').addEventListener('input', (e) => {
            audioManager.setMusicVolume(e.target.value);
            document.getElementById('musicVolumeValue').textContent = e.target.value + '%';
        });
        document.getElementById('sfxVolume').addEventListener('input', (e) => {
            audioManager.setSfxVolume(e.target.value);
            document.getElementById('sfxVolumeValue').textContent = e.target.value + '%';
        });

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setDifficulty(e.target.dataset.difficulty));
        });

        // Control mode buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setControlMode(e.target.dataset.control));
        });

        // Particle effects checkbox
        document.getElementById('particleEffects').addEventListener('change', (e) => {
            gameState.particlesEnabled = e.target.checked;
            gameState.saveSettings();
        });

        // Pause Menu
        document.getElementById('pauseBtn').addEventListener('click', () => game.togglePause());
        document.getElementById('resumeBtn').addEventListener('click', () => game.togglePause());
        document.getElementById('settingsPauseBtn').addEventListener('click', () => this.showSettingsFromPause());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.returnToMainMenu());

        // Game Over
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());
        document.getElementById('mainMenuFromGameBtn').addEventListener('click', () => this.returnToMainMenu());
    }

    showScreen(screenId) {
        document.querySelectorAll('.menu-screen, .game-container').forEach(el => el.classList.add('hidden'));
        if (screenId) {
            document.getElementById(screenId).classList.remove('hidden');
        }
    }

    showMainMenu() {
        audioManager.playMenuSelect();
        this.showScreen('mainMenu');
        this.updateMenuStats();
        audioManager.stopMenuMusic();
        audioManager.playMenuMusic();
        gameState.state = 'menu';
    }

    showSettings() {
        audioManager.playMenuSelect();
        this.showScreen('settingsMenu');
        this.updateSettingsUI();
    }

    showSettingsFromPause() {
        audioManager.playMenuSelect();
        document.getElementById('pauseMenu').classList.add('hidden');
        document.getElementById('settingsMenu').classList.remove('hidden');
        this.updateSettingsUI();
    }

    showCredits() {
        audioManager.playMenuSelect();
        this.showScreen('creditsMenu');
    }

    startGame() {
        audioManager.playMenuSelect();
        audioManager.stopMenuMusic();
        this.showScreen('gameScreen');
        gameState.state = 'playing';
        game = new PongGame();
    }

    updateMenuStats() {
        document.getElementById('highScore').textContent = gameState.gameStats.highScore;
        document.getElementById('totalGames').textContent = gameState.gameStats.totalGames;
        const winRate = gameState.gameStats.totalGames > 0 
            ? Math.round((gameState.gameStats.wins / gameState.gameStats.totalGames) * 100)
            : 0;
        document.getElementById('winRate').textContent = winRate + '%';
    }

    updateSettingsUI() {
        // Update difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === gameState.currentDifficulty) {
                btn.classList.add('active');
            }
        });

        // Update control mode buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.control === gameState.controlMode) {
                btn.classList.add('active');
            }
        });

        // Update particle effects checkbox
        document.getElementById('particleEffects').checked = gameState.particlesEnabled;
    }

    setDifficulty(difficulty) {
        gameState.currentDifficulty = difficulty;
        gameState.saveSettings();
        this.updateSettingsUI();
        audioManager.playMenuSelect();
    }

    setControlMode(mode) {
        gameState.controlMode = mode;
        gameState.saveSettings();
        this.updateSettingsUI();
        audioManager.playMenuSelect();
        if (game) {
            game.updateControlHint();
        }
    }

    resetSettings() {
        gameState.currentDifficulty = 'normal';
        gameState.controlMode = 'mouse';
        gameState.particlesEnabled = true;
        document.getElementById('masterVolume').value = 70;
        document.getElementById('musicVolume').value = 50;
        document.getElementById('sfxVolume').value = 70;
        audioManager.setMasterVolume(70);
        audioManager.setMusicVolume(50);
        audioManager.setSfxVolume(70);
        gameState.saveSettings();
        this.updateSettingsUI();
        audioManager.playMenuSelect();
    }

    returnToMainMenu() {
        if (game) {
            game.cleanup();
        }
        this.showMainMenu();
    }

    showPauseMenu() {
        document.getElementById('pausePlayerScore').textContent = game.player.score;
        document.getElementById('pauseAiScore').textContent = game.ai.score;
        this.showScreen('pauseMenu');
    }

    showGameOverScreen(playerWon) {
        const playerScore = game.player.score;
        const aiScore = game.ai.score;
        
        document.getElementById('finalScore').textContent = playerScore + ' - ' + aiScore;
        document.getElementById('winner').textContent = playerWon ? 'YOU WIN! 🎉' : 'AI WINS! 💔';
        document.getElementById('rallies').textContent = game.ballHitCount;

        // Update stats
        gameState.gameStats.totalGames++;
        if (playerWon) {
            gameState.gameStats.wins++;
        }
        const maxScore = Math.max(playerScore, gameState.gameStats.highScore);
        gameState.gameStats.highScore = maxScore;
        gameState.saveStats();

        this.showScreen('gameOverScreen');
    }
}

class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = 1000;
        this.canvas.height = 600;
        
        this.paddleWidth = 15;
        this.paddleHeight = 100;
        
        this.player = {
            x: 20,
            y: this.canvas.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            speed: 6,
            score: 0,
            power: 0,
            maxPower: 100,
            shieldActive: false,
            shieldTimer: 0,
            boostActive: false,
            boostTimer: 0
        };
        
        this.ai = {
            x: this.canvas.width - 20 - this.paddleWidth,
            y: this.canvas.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            speed: this.getDifficultySpeed(gameState.currentDifficulty),
            score: 0,
            reactionDistance: 35
        };
        
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 8,
            dx: 5,
            dy: 5,
            speed: 5,
            maxSpeed: 10
        };
        
        this.gameRunning = true;
        this.isPaused = false;
        this.particles = [];
        this.effects = [];
        this.ballHitCount = 0;
        
        this.keys = {};
        this.mouseY = this.canvas.height / 2;
        
        this.setupEventListeners();
        this.updateControlHint();
        document.getElementById('difficultyText').textContent = this.capitalizeFirst(gameState.currentDifficulty);
        this.gameLoop();
    }
    
    getDifficultySpeed(difficulty) {
        const speeds = {
            easy: 3,
            normal: 4.5,
            hard: 5.5,
            extreme: 6.5
        };
        return speeds[difficulty] || 4.5;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    updateControlHint() {
        const hints = {
            mouse: '🖱️ MOUSE to move | SPACEBAR for ability',
            keyboard: '⬆️⬇️ ARROWS to move | SPACEBAR for ability',
            hybrid: '🖱️/⬆️⬇️ MOUSE or ARROWS | SPACEBAR for ability'
        };
        document.getElementById('controlHint').textContent = hints[gameState.controlMode] || hints.mouse;
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                this.activateAbility();
            }
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseY = e.clientY - rect.top;
        });
    }

    togglePause() {
        if (this.gameRunning) {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                ui.showPauseMenu();
            } else {
                ui.showScreen('gameScreen');
            }
        }
    }
    
    activateAbility() {
        if (this.player.power < 100 || this.isPaused) return;
        
        this.player.power = 0;
        this.updatePowerMeter();
        audioManager.playAbility();
        
        const abilities = ['speedBoost', 'spinAttack', 'shield', 'powerShot'];
        const randomAbility = abilities[Math.floor(Math.random() * abilities.length)];
        
        switch(randomAbility) {
            case 'speedBoost':
                this.activateSpeedBoost();
                break;
            case 'spinAttack':
                this.activateSpinAttack();
                break;
            case 'shield':
                this.activateShield();
                break;
            case 'powerShot':
                this.activatePowerShot();
                break;
        }
    }
    
    activateSpeedBoost() {
        this.player.boostActive = true;
        this.player.boostTimer = 300;
        if (gameState.particlesEnabled) {
            this.createExplosion(this.player.x + 50, this.player.y + this.paddleHeight / 2, '#00ffff');
        }
        this.addTextEffect(this.player.x + 50, this.player.y, '⚡ SPEED BOOST!', '#00ffff');
    }
    
    activateSpinAttack() {
        this.ball.dx *= 1.5;
        this.ball.dy *= 1.5;
        if (gameState.particlesEnabled) {
            this.createExplosion(this.ball.x, this.ball.y, '#ff00ff');
        }
        this.addTextEffect(this.ball.x, this.ball.y - 30, '🌀 SPIN!', '#ff00ff');
    }
    
    activateShield() {
        this.player.shieldActive = true;
        this.player.shieldTimer = 180;
        if (gameState.particlesEnabled) {
            this.createExplosion(this.player.x + 50, this.player.y + this.paddleHeight / 2, '#ffff00');
        }
        this.addTextEffect(this.player.x + 50, this.player.y - 30, '🛡️ SHIELD!', '#ffff00');
    }
    
    activatePowerShot() {
        this.ball.speed = 12;
        this.ball.dx *= 1.8;
        this.ball.dy *= 1.8;
        if (gameState.particlesEnabled) {
            this.createExplosion(this.ball.x, this.ball.y, '#ffff00');
        }
        this.addTextEffect(this.ball.x, this.ball.y - 30, '💥 POWER SHOT!', '#ffff00');
    }
    
    updatePowerMeter() {
        const powerPercent = (this.player.power / this.player.maxPower) * 100;
        document.getElementById('powerMeter').style.width = powerPercent + '%';
    }
    
    createExplosion(x, y, color) {
        if (!gameState.particlesEnabled) return;
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                life: 30,
                maxLife: 30,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    addTextEffect(x, y, text, color) {
        this.effects.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 60,
            maxLife: 60,
            size: 20
        });
    }
    
    updatePlayerPaddle() {
        if (this.isPaused) return;
        
        let targetY = this.player.y;
        
        if (gameState.controlMode === 'mouse' || gameState.controlMode === 'hybrid') {
            targetY = this.mouseY - this.paddleHeight / 2;
        }
        
        if (gameState.controlMode === 'keyboard' || gameState.controlMode === 'hybrid') {
            if (this.keys['ArrowUp']) targetY = this.player.y - this.player.speed;
            if (this.keys['ArrowDown']) targetY = this.player.y + this.player.speed;
        }
        
        const speed = this.player.boostActive ? this.player.speed * 1.5 : this.player.speed;
        targetY = Math.max(0, Math.min(targetY, this.canvas.height - this.paddleHeight));
        this.player.y += (targetY - this.player.y) * 0.2;
        
        if (this.player.boostTimer > 0) {
            this.player.boostTimer--;
        } else {
            this.player.boostActive = false;
        }
        
        if (this.player.shieldTimer > 0) {
            this.player.shieldTimer--;
        } else {
            this.player.shieldActive = false;
        }
    }
    
    updateAIPaddle() {
        if (this.isPaused) return;
        
        const aiCenter = this.ai.y + this.paddleHeight / 2;
        const ballCenter = this.ball.y;
        
        if (aiCenter < ballCenter - this.ai.reactionDistance) {
            this.ai.y += this.ai.speed;
        } else if (aiCenter > ballCenter + this.ai.reactionDistance) {
            this.ai.y -= this.ai.speed;
        }
        
        this.ai.y = Math.max(0, Math.min(this.ai.y, this.canvas.height - this.paddleHeight));
    }
    
    updateBall() {
        if (this.isPaused) return;
        
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        if (gameState.particlesEnabled && this.ballHitCount % 2 === 0) {
            this.particles.push({
                x: this.ball.x,
                y: this.ball.y,
                vx: 0,
                vy: 0,
                life: 15,
                maxLife: 15,
                color: `hsl(${this.ballHitCount * 10 % 360}, 100%, 50%)`,
                size: this.ball.radius
            });
        }
        
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.dy *= -1;
            this.ball.y = Math.max(this.ball.radius, Math.min(this.ball.y, this.canvas.height - this.ball.radius));
            audioManager.playWallBounce();
            if (gameState.particlesEnabled) {
                this.createExplosion(this.ball.x, this.ball.y, '#ff00ff');
            }
        }
        
        this.checkPaddleCollision(this.player);
        this.checkPaddleCollision(this.ai);
        
        if (this.ball.x - this.ball.radius < 0) {
            this.ai.score++;
            audioManager.playScore();
            this.resetBall();
            this.updateScore();
        }
        
        if (this.ball.x + this.ball.radius > this.canvas.width) {
            this.player.score++;
            audioManager.playScore();
            this.resetBall();
            this.updateScore();
        }

        // Check win condition
        if (this.player.score >= 7) {
            this.endGame(true);
        } else if (this.ai.score >= 7) {
            this.endGame(false);
        }
    }
    
    checkPaddleCollision(paddle) {
        if (this.ball.x - this.ball.radius < paddle.x + paddle.width &&
            this.ball.x + this.ball.radius > paddle.x &&
            this.ball.y > paddle.y &&
            this.ball.y < paddle.y + paddle.height) {
            
            const paddleCenter = paddle.y + paddle.height / 2;
            const ballDist = (this.ball.y - paddleCenter) / (paddle.height / 2);
            
            this.ball.dx *= -1.05;
            this.ball.dy += ballDist * 5;
            
            const speed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2);
            if (speed > this.ball.maxSpeed) {
                this.ball.dx = (this.ball.dx / speed) * this.ball.maxSpeed;
                this.ball.dy = (this.ball.dy / speed) * this.ball.maxSpeed;
            }
            
            if (paddle === this.player) {
                this.ball.x = paddle.x + paddle.width + this.ball.radius;
                this.player.power = Math.min(this.player.power + 25, this.player.maxPower);
                this.ballHitCount++;
            } else {
                this.ball.x = paddle.x - this.ball.radius;
                this.ballHitCount++;
            }
            
            audioManager.playPaddleHit();
            if (gameState.particlesEnabled) {
                this.createExplosion(this.ball.x, this.ball.y, '#00ffff');
            }
            this.addTextEffect(this.ball.x, this.ball.y - 30, '💥', '#ffff00');
            this.updatePowerMeter();
        }
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ball.dy = (Math.random() - 0.5) * 5;
        this.ball.speed = 5;
    }
    
    updateScore() {
        document.getElementById('playerScore').textContent = this.player.score;
        document.getElementById('aiScore').textContent = this.ai.score;
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
        });
    }
    
    updateEffects() {
        this.effects = this.effects.filter(e => e.life > 0);
        this.effects.forEach(e => {
            e.y -= 2;
            e.life--;
        });
    }
    
    drawPaddle(paddle) {
        const height = paddle === this.player && this.player.shieldActive ? 
                       this.paddleHeight * 1.4 : paddle.height;
        const y = paddle === this.player && this.player.shieldActive ? 
                  paddle.y - (height - this.paddleHeight) / 2 : paddle.y;
        
        this.ctx.fillStyle = paddle === this.player ? '#00ffff' : '#ff00ff';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = paddle === this.player ? '#00ffff' : '#ff00ff';
        this.ctx.fillRect(paddle.x, y, paddle.width, height);
        
        if (paddle === this.player && this.player.shieldActive) {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 15;
            this.ctx.strokeRect(paddle.x - 5, y - 5, paddle.width + 10, height + 10);
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    drawBall() {
        this.ctx.fillStyle = `hsl(${this.ballHitCount * 10 % 360}, 100%, 50%)`;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = `hsl(${this.ballHitCount * 10 % 360}, 100%, 50%)`;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / p.maxLife;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
        this.ctx.shadowBlur = 0;
    }
    
    drawEffects() {
        this.effects.forEach(e => {
            const alpha = e.life / e.maxLife;
            this.ctx.fillStyle = e.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.font = `${e.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(e.text, e.x, e.y);
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawCenterLine() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        this.ctx.setLineDash([10, 10]);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    draw() {
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, 800
        );
        gradient.addColorStop(0, 'rgba(0, 50, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(10, 10, 30, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawCenterLine();
        this.drawPaddle(this.player);
        this.drawPaddle(this.ai);
        this.drawBall();
        this.drawParticles();
        this.drawEffects();

        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    update() {
        this.updatePlayerPaddle();
        this.updateAIPaddle();
        this.updateBall();
        this.updateParticles();
        this.updateEffects();
    }

    endGame(playerWon) {
        this.gameRunning = false;
        audioManager.playGameOver(playerWon);
        setTimeout(() => {
            ui.showGameOverScreen(playerWon);
        }, 500);
    }

    cleanup() {
        this.gameRunning = false;
        // Remove event listeners if needed
    }
    
    gameLoop() {
        this.update();
        this.draw();
        if (this.gameRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Initialize on load
window.addEventListener('load', () => {
    audioManager = new AudioManager();
    const ui = new UIManager();
    window.ui = ui; // Make UI globally accessible
    
    // Hide loading screen and show main menu
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        ui.showMainMenu();
    }, 3000);
});