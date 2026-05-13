class PongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game dimensions
        this.canvas.width = 1000;
        this.canvas.height = 600;
        
        // Paddle properties
        this.paddleWidth = 15;
        this.paddleHeight = 100;
        
        // Player paddle
        this.player = {
            x: 20,
            y: this.canvas.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            dy: 0,
            speed: 6,
            score: 0,
            power: 0,
            maxPower: 100,
            shieldActive: false,
            shieldTimer: 0,
            boostActive: false,
            boostTimer: 0
        };
        
        // AI paddle
        this.ai = {
            x: this.canvas.width - 20 - this.paddleWidth,
            y: this.canvas.height / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
            dy: 0,
            speed: 4.5,
            score: 0,
            difficulty: 0.8
        };
        
        // Ball properties
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 8,
            dx: 5,
            dy: 5,
            speed: 5,
            maxSpeed: 10,
            trailParticles: []
        };
        
        // Game state
        this.gameRunning = true;
        this.particles = [];
        this.effects = [];
        this.powerUpActive = null;
        this.ballHitCount = 0;
        
        // Input handling
        this.keys = {};
        this.mouseY = this.canvas.height / 2;
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                this.activateAbility();
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
    
    activateAbility() {
        if (this.player.power < 100) return;
        
        this.player.power = 0;
        this.updatePowerMeter();
        
        const abilities = [
            'speedBoost',
            'spinAttack',
            'shield',
            'powerShot'
        ];
        
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
        this.createExplosion(this.player.x + 50, this.player.y + this.paddleHeight / 2, '#00ffff');
        this.addTextEffect(this.player.x + 50, this.player.y, '⚡ SPEED BOOST!', '#00ffff');
    }
    
    activateSpinAttack() {
        this.ball.dx *= 1.5;
        this.ball.dy *= 1.5;
        this.createExplosion(this.ball.x, this.ball.y, '#ff00ff');
        this.addTextEffect(this.ball.x, this.ball.y - 30, '🌀 SPIN!', '#ff00ff');
    }
    
    activateShield() {
        this.player.shieldActive = true;
        this.player.shieldTimer = 180;
        this.createExplosion(this.player.x + 50, this.player.y + this.paddleHeight / 2, '#ffff00');
        this.addTextEffect(this.player.x + 50, this.player.y - 30, '🛡️ SHIELD!', '#ffff00');
    }
    
    activatePowerShot() {
        this.ball.speed = 12;
        this.ball.dx *= 1.8;
        this.ball.dy *= 1.8;
        this.createExplosion(this.ball.x, this.ball.y, '#ffff00');
        this.addTextEffect(this.ball.x, this.ball.y - 30, '💥 POWER SHOT!', '#ffff00');
    }
    
    updatePowerMeter() {
        const powerPercent = (this.player.power / this.player.maxPower) * 100;
        document.getElementById('powerMeter').style.width = powerPercent + '%';
    }
    
    createExplosion(x, y, color) {
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
        let targetY = this.mouseY - this.paddleHeight / 2;
        
        if (this.keys['ArrowUp']) targetY = this.player.y - this.player.speed;
        if (this.keys['ArrowDown']) targetY = this.player.y + this.player.speed;
        
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
        const aiCenter = this.ai.y + this.paddleHeight / 2;
        const ballCenter = this.ball.y;
        
        if (aiCenter < ballCenter - 35) {
            this.ai.y += this.ai.speed;
        } else if (aiCenter > ballCenter + 35) {
            this.ai.y -= this.ai.speed;
        }
        
        this.ai.y = Math.max(0, Math.min(this.ai.y, this.canvas.height - this.paddleHeight));
    }
    
    updateBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // Create trail particles
        if (this.ballHitCount % 2 === 0) {
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
        
        // Top and bottom collision
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.dy *= -1;
            this.ball.y = Math.max(this.ball.radius, Math.min(this.ball.y, this.canvas.height - this.ball.radius));
            this.createExplosion(this.ball.x, this.ball.y, '#ff00ff');
        }
        
        // Player paddle collision
        this.checkPaddleCollision(this.player);
        
        // AI paddle collision
        this.checkPaddleCollision(this.ai);
        
        // Score points
        if (this.ball.x - this.ball.radius < 0) {
            this.ai.score++;
            this.resetBall();
            this.updateScore();
        }
        
        if (this.ball.x + this.ball.radius > this.canvas.width) {
            this.player.score++;
            this.resetBall();
            this.updateScore();
        }
    }
    
    checkPaddleCollision(paddle) {
        if (this.ball.x - this.ball.radius < paddle.x + paddle.width &&
            this.ball.x + this.ball.radius > paddle.x &&
            this.ball.y > paddle.y &&
            this.ball.y < paddle.y + paddle.height) {
            
            // Ball collision detected
            const paddleCenter = paddle.y + paddle.height / 2;
            const ballDist = (this.ball.y - paddleCenter) / (paddle.height / 2);
            
            this.ball.dx *= -1.05;
            this.ball.dy += ballDist * 5;
            
            // Limit ball speed
            const speed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2);
            if (speed > this.ball.maxSpeed) {
                this.ball.dx = (this.ball.dx / speed) * this.ball.maxSpeed;
                this.ball.dy = (this.ball.dy / speed) * this.ball.maxSpeed;
            }
            
            // Push ball away from paddle
            if (paddle === this.player) {
                this.ball.x = paddle.x + paddle.width + this.ball.radius;
                this.player.power = Math.min(this.player.power + 25, this.player.maxPower);
                this.ballHitCount++;
            } else {
                this.ball.x = paddle.x - this.ball.radius;
                this.ballHitCount++;
            }
            
            this.createExplosion(this.ball.x, this.ball.y, '#00ffff');
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
        this.ballHitCount = 0;
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
        
        // Shield effect
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
        // Clear canvas with gradient background
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, 800
        );
        gradient.addColorStop(0, 'rgba(0, 50, 100, 0.5)');
        gradient.addColorStop(1, 'rgba(10, 10, 30, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw elements
        this.drawCenterLine();
        this.drawPaddle(this.player);
        this.drawPaddle(this.ai);
        this.drawBall();
        this.drawParticles();
        this.drawEffects();
    }
    
    update() {
        this.updatePlayerPaddle();
        this.updateAIPaddle();
        this.updateBall();
        this.updateParticles();
        this.updateEffects();
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new PongGame();
});