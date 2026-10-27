import { Renderer } from "../graphics/Renderer";
import { Matrix4 } from "../math/Matrix4";
import { Player } from "../gameplay/Player";
import { Road } from "../environment/Road";
import { City } from "../environment/City";
import { InputManager } from "./InputManager";
import { ObstacleManager } from "../gameplay/ObstacleManager";
import { SoundManager } from "./SoundManager";
import { ParticleSystem } from "../graphics/ParticleSystem";
import { AvatarSelectModal } from "../ui/AvatarSelectModal";
import { getSavedAvatarId, AVATARS } from "../gameplay/AvatarData";

export const GameState = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3
} as const;

export type GameStateType = typeof GameState[keyof typeof GameState];

export interface LevelConfig {
    name: string;
    targetDistance: number;
    baseSpeed: number;
}

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private renderer: Renderer;
    private player: Player;
    private road: Road;
    private city: City;
    private input: InputManager;
    private obstacleManager: ObstacleManager;
    private sound: SoundManager;
    private particles: ParticleSystem;
    private avatarModal: AvatarSelectModal;

    private viewMatrix: Matrix4;
    private projectionMatrix: Matrix4;
    private vpMatrix: Matrix4 = new Matrix4();
    
    private animFrameId: number = 0;
    private lastTime: number = 0;
    private distanceRun: number = 0;
    private runSpeed: number = 22;

    public state: GameStateType = GameState.MENU;
    public score: number = 0;
    public coins: number = 0;
    public lives: number = 3;
    public currentLevelIndex: number = 0;

    // Cache HUD states to prevent DOM layout thrashing on every frame
    private lastHudScore: number = -1;
    private lastHudCoins: number = -1;
    private lastHudLives: number = -1;
    private lastHudLevel: string = "";
    private lastHudShield: boolean = false;

    private levels: LevelConfig[] = [
        { name: "LEVEL 01: NEON DISTRICT", targetDistance: 250, baseSpeed: 22 },
        { name: "LEVEL 02: CYBER HIGHWAY", targetDistance: 600, baseSpeed: 28 },
        { name: "LEVEL 03: SYNTHETICA", targetDistance: 1100, baseSpeed: 34 },
        { name: "LEVEL 04: GRID OVERDRIVE", targetDistance: 999999, baseSpeed: 40 }
    ];

    // UI elements
    private scoreEl: HTMLElement;
    private coinsEl: HTMLElement;
    private livesEl: HTMLElement;
    private levelEl: HTMLElement;
    private shieldEl: HTMLElement;
    private overlayEl: HTMLElement;
    private pauseBtn: HTMLElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.player = new Player();
        this.road = new Road();
        this.city = new City();
        this.input = new InputManager();
        this.obstacleManager = new ObstacleManager();
        this.sound = new SoundManager();
        this.particles = new ParticleSystem();
        this.avatarModal = new AvatarSelectModal();

        // Third-person perspective camera looking forward down -Z
        this.viewMatrix = Matrix4.translation(0, -2.6, 0); 
        this.projectionMatrix = Matrix4.perspective(
            Math.PI / 3, 
            canvas.width / canvas.height, 
            0.1, 
            220.0
        );
        this.updateVPMatrix();

        this.scoreEl = document.getElementById("score")!;
        this.coinsEl = document.getElementById("coins-count")!;
        this.livesEl = document.querySelector(".lives") as HTMLElement;
        this.levelEl = document.getElementById("level-name")!;
        this.shieldEl = document.getElementById("shield-indicator")!;
        this.overlayEl = document.getElementById("ui-overlay")!;
        this.pauseBtn = document.getElementById("pause-btn")!;

        this.bindUIEvents();
        this.showStartMenu();
    }

    private updateVPMatrix() {
        this.projectionMatrix.multiplyTo(this.viewMatrix, this.vpMatrix);
    }

    private bindUIEvents() {
        this.pauseBtn?.addEventListener("click", () => {
            if (this.state === GameState.PLAYING) {
                this.pauseGame();
            } else if (this.state === GameState.PAUSED) {
                this.resumeGame();
            }
        });

        window.addEventListener("resize", () => this.handleResize());
    }

    private handleResize() {
        const container = document.getElementById("game-container");
        if (!container) return;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.renderer.resize(rect.width, rect.height);
        this.projectionMatrix = Matrix4.perspective(
            Math.PI / 3, 
            rect.width / rect.height, 
            0.1, 
            220.0
        );
        this.updateVPMatrix();
    }

    start() {
        this.handleResize();
        this.lastTime = performance.now();
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = requestAnimationFrame((time) => this.loop(time));
    }

    private showStartMenu() {
        this.state = GameState.MENU;
        this.overlayEl.style.display = "flex";

        const currentAvatarId = getSavedAvatarId();
        const avatar = AVATARS.find(a => a.id === currentAvatarId) || AVATARS[0];

        this.overlayEl.innerHTML = `
            <div class="menu-box">
                <div class="logo-wrap">
                    <h1 class="glitch-title">NEON RUNNER</h1>
                    <h2 class="sub-title">CYBER CITY</h2>
                    <p class="tagline">Run. Dodge. Survive.</p>
                </div>
                
                <div class="avatar-selected-pill" id="avatar-pill-btn">
                    <span class="pill-label">OPERATIVE:</span>
                    <strong style="color: ${avatar.primaryColor}">${avatar.name} (${avatar.title})</strong>
                    <span class="pill-edit">[CHANGE]</span>
                </div>

                <div class="menu-actions">
                    <button class="cyber-btn primary-btn" id="start-game-btn">START GAME [SPACE]</button>
                    <button class="cyber-btn" id="select-avatar-btn">👤 CHOOSE YOUR AVATAR</button>
                </div>

                <div class="controls-guide">
                    <div class="guide-title">CONTROL DIRECTIVE</div>
                    <div class="guide-grid">
                        <div class="guide-item"><span>A / D or ← / →</span> Lane Switch</div>
                        <div class="guide-item"><span>SPACE / ↑</span> Jump Hurdle</div>
                        <div class="guide-item"><span>S / ↓</span> Slide Laser Gate</div>
                        <div class="guide-item"><span>P / ESC</span> Pause Simulation</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("start-game-btn")?.addEventListener("click", () => this.resetGame());
        
        const openAvatarSelect = () => {
            this.avatarModal.open((selectedId) => {
                this.player.setAvatar(selectedId);
                this.showStartMenu();
            });
        };

        document.getElementById("select-avatar-btn")?.addEventListener("click", openAvatarSelect);
        document.getElementById("avatar-pill-btn")?.addEventListener("click", openAvatarSelect);
    }

    private pauseGame() {
        this.state = GameState.PAUSED;
        this.overlayEl.style.display = "flex";
        this.overlayEl.innerHTML = `
            <div class="menu-box">
                <h1 class="paused-title">SYSTEM PAUSED</h1>
                <p class="tagline">Simulation Frozen</p>
                
                <div class="menu-actions">
                    <button class="cyber-btn primary-btn" id="resume-btn">RESUME [P]</button>
                    <button class="cyber-btn" id="restart-btn">RESTART RUN</button>
                    <button class="cyber-btn" id="sound-btn">SOUND: ${this.sound.isMuted ? 'OFF 🔇' : 'ON 🔊'}</button>
                </div>
            </div>
        `;

        document.getElementById("resume-btn")?.addEventListener("click", () => this.resumeGame());
        document.getElementById("restart-btn")?.addEventListener("click", () => this.resetGame());
        document.getElementById("sound-btn")?.addEventListener("click", () => {
            const isMuted = this.sound.toggleMute();
            const btn = document.getElementById("sound-btn");
            if (btn) btn.innerText = `SOUND: ${isMuted ? 'OFF 🔇' : 'ON 🔊'}`;
        });
    }

    private resumeGame() {
        this.state = GameState.PLAYING;
        this.overlayEl.style.display = "none";
    }

    private showGameOver() {
        this.state = GameState.GAME_OVER;
        this.sound.playGameOver();
        this.overlayEl.style.display = "flex";
        this.overlayEl.innerHTML = `
            <div class="menu-box game-over-box">
                <h1 class="game-over-title">SYSTEM TERMINATED</h1>
                <h2 class="sub-title">RUN OVER</h2>
                
                <div class="stats-summary">
                    <div class="stat-row"><span>FINAL SCORE:</span> <strong>${Math.floor(this.score).toString().padStart(6, '0')}</strong></div>
                    <div class="stat-row"><span>COINS COLLECTED:</span> <strong>🪙 ${this.coins}</strong></div>
                    <div class="stat-row"><span>DISTANCE RUN:</span> <strong>${Math.floor(this.distanceRun)} m</strong></div>
                    <div class="stat-row"><span>OPERATIVE:</span> <strong>${this.player.currentAvatar.name}</strong></div>
                </div>

                <div class="menu-actions">
                    <button class="cyber-btn primary-btn" id="restart-game-btn">RUN AGAIN [SPACE]</button>
                    <button class="cyber-btn" id="gameover-avatar-btn">👤 CHANGE AVATAR</button>
                </div>
            </div>
        `;

        document.getElementById("restart-game-btn")?.addEventListener("click", () => this.resetGame());
        document.getElementById("gameover-avatar-btn")?.addEventListener("click", () => {
            this.avatarModal.open((selectedId) => {
                this.player.setAvatar(selectedId);
                this.showStartMenu();
            });
        });
    }

    private resetGame() {
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.distanceRun = 0;
        this.currentLevelIndex = 0;
        this.runSpeed = this.levels[0].baseSpeed;
        
        this.player.reset();
        this.obstacleManager.reset();
        this.city.reset();
        this.particles.clear();
        this.input.reset();

        // Force full HUD refresh
        this.lastHudScore = -1;
        this.lastHudCoins = -1;
        this.lastHudLives = -1;
        this.lastHudLevel = "";
        this.lastHudShield = !this.player.hasShield;
        this.updateHUD();

        this.state = GameState.PLAYING;
        this.overlayEl.style.display = "none";
    }

    /**
     * Efficient HUD update: Only modifies DOM when values actually change!
     * Eliminates 60 FPS DOM layout thrashing completely.
     */
    private updateHUD() {
        const floorScore = Math.floor(this.score);
        if (this.scoreEl && floorScore !== this.lastHudScore) {
            this.lastHudScore = floorScore;
            this.scoreEl.innerText = floorScore.toString().padStart(6, '0');
        }

        if (this.coinsEl && this.coins !== this.lastHudCoins) {
            this.lastHudCoins = this.coins;
            this.coinsEl.innerText = this.coins.toString().padStart(3, '0');
        }

        const levelName = this.levels[this.currentLevelIndex].name;
        if (this.levelEl && levelName !== this.lastHudLevel) {
            this.lastHudLevel = levelName;
            this.levelEl.innerText = levelName;
        }

        if (this.livesEl && this.lives !== this.lastHudLives) {
            this.lastHudLives = this.lives;
            let hearts = "";
            for (let i = 0; i < this.lives; i++) hearts += "♥ ";
            for (let i = this.lives; i < 3; i++) hearts += "♡ ";
            this.livesEl.innerText = hearts;
        }

        if (this.shieldEl && this.player.hasShield !== this.lastHudShield) {
            this.lastHudShield = this.player.hasShield;
            if (this.player.hasShield) {
                this.shieldEl.classList.remove("hidden");
                this.shieldEl.innerHTML = `<span class="shield-badge">🛡️ SHIELD ACTIVE</span>`;
            } else {
                this.shieldEl.classList.add("hidden");
            }
        }
    }

    private update(dt: number) {
        // Toggle Pause key
        if (this.input.isKeyPressed("KeyP") || this.input.isKeyPressed("Escape")) {
            if (this.state === GameState.PLAYING) {
                this.pauseGame();
                return;
            } else if (this.state === GameState.PAUSED) {
                this.resumeGame();
                return;
            }
        }

        if (this.state === GameState.MENU) {
            if (this.input.isKeyPressed("Space")) {
                this.resetGame();
            }
            return;
        }

        if (this.state === GameState.PAUSED) {
            return; // Simulation is completely frozen while paused
        }

        if (this.state === GameState.GAME_OVER) {
            if (this.input.isKeyPressed("Space")) {
                this.resetGame();
            }
            return;
        }

        // Active Playing State Input Controls
        if (this.input.isKeyPressed("KeyA") || this.input.isKeyPressed("ArrowLeft")) {
            this.player.moveLeft();
        }
        if (this.input.isKeyPressed("KeyD") || this.input.isKeyPressed("ArrowRight")) {
            this.player.moveRight();
        }
        if (this.input.isKeyPressed("Space") || this.input.isKeyPressed("ArrowUp") || this.input.isKeyPressed("KeyW")) {
            const jumped = this.player.jump();
            if (jumped) this.sound.playJump();
        }
        if (this.input.isKeyPressed("ArrowDown") || this.input.isKeyPressed("KeyS")) {
            const slid = this.player.slide();
            if (slid) this.sound.playSlide();
        }

        // 1. Update Player
        this.player.update(dt);

        // 2. Progression & Distance
        this.distanceRun += this.runSpeed * dt;
        this.score += this.runSpeed * dt * 0.15;

        // Level Progression Check
        const currentLvl = this.levels[this.currentLevelIndex];
        if (this.distanceRun >= currentLvl.targetDistance && this.currentLevelIndex < this.levels.length - 1) {
            this.currentLevelIndex++;
            this.runSpeed = this.levels[this.currentLevelIndex].baseSpeed;
            this.sound.playLevelUp();
            this.particles.addText(
                `ENTERING ${this.levels[this.currentLevelIndex].name}`, 
                this.canvas.width / 2, 
                this.canvas.height * 0.4, 
                "#00ffff", 
                26
            );
        } else {
            this.runSpeed += dt * 0.12;
        }

        // 3. Update Environment
        this.city.update(dt, this.runSpeed);

        // 4. Update Obstacles & Collectibles
        const collision = this.obstacleManager.update(
            dt, 
            this.runSpeed, 
            this.player, 
            this.sound, 
            this.particles
        );

        if (collision.coinsCollected > 0) {
            this.coins += collision.coinsCollected;
            this.score += collision.coinsCollected * 100;
        }

        if (collision.hitObstacle && !this.player.hasShield && this.player.invulnerableTimer > 1.3) {
            this.lives--;
            if (this.lives <= 0) {
                this.lives = 0;
                this.updateHUD();
                this.showGameOver();
                return;
            }
        }

        // 5. Update Particles
        this.particles.update(dt);

        this.updateHUD();
    }

    private draw() {
        this.renderer.clear();

        // 1. Draw Background 3D Cyber City Skyline (using precomputed vpMatrix)
        this.city.draw(this.renderer, this.vpMatrix);
        
        // 2. Draw 3D Infinite Road
        this.renderer.drawMesh(
            this.road.mesh, 
            this.road.getWorldMatrix(this.distanceRun), 
            this.vpMatrix, 
            "#ff007f", // Neon magenta road
            { lineWidth: 2 }
        );

        // 3. Draw Dynamic Obstacles & Collectibles
        this.obstacleManager.draw(this.renderer, this.vpMatrix);

        // 4. Draw Player Runner (Mesh or Billboard Sprite, with Shield if active)
        this.player.draw(this.renderer, this.vpMatrix);

        // 5. Draw 2D Foreground Particle System
        this.particles.draw(this.renderer.ctx);
    }

    private loop(time: number) {
        let dt = (time - this.lastTime) / 1000.0;
        this.lastTime = time;

        // Cap dt to 50ms (20 FPS equivalent) to prevent large physics tunneling if tab is blurred
        dt = Math.min(dt, 0.05);

        if (dt > 0) {
            this.update(dt);
            this.draw();
        }

        this.animFrameId = requestAnimationFrame((t) => this.loop(t));
    }
}
