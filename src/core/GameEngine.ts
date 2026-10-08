import { Renderer } from "../graphics/Renderer";
import { Matrix4 } from "../math/Matrix4";
import { Player } from "../gameplay/Player";
import { Road } from "../environment/Road";
import { InputManager } from "./InputManager";
import { ObstacleManager } from "../gameplay/ObstacleManager";

export const GameState = {
    MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2
};

export class GameEngine {
    private renderer: Renderer;
    private player: Player;
    private road: Road;
    private input: InputManager;
    private obstacleManager: ObstacleManager;

    private viewMatrix: Matrix4;
    private projectionMatrix: Matrix4;
    
    private lastTime: number = 0;
    private distanceRun: number = 0;
    private runSpeed: number = 20;

    public state: number = GameState.MENU;
    public score: number = 0;
    public lives: number = 3;

    // UI elements
    private scoreEl: HTMLElement;
    private livesEl: HTMLElement;
    private overlayEl: HTMLElement;

    constructor(canvas: HTMLCanvasElement) {
        this.renderer = new Renderer(canvas);
        this.player = new Player();
        this.road = new Road();
        this.input = new InputManager();
        this.obstacleManager = new ObstacleManager();

        // Third-person perspective: Move world down (so we see ground), and push world away (so player at Z=0 is visible)
        // Wait, if player is at Z=-5, and we want camera behind player (e.g. Z=0), we translate world by +Z?
        // Let's keep camera at origin, and just place everything at negative Z.
        this.viewMatrix = Matrix4.translation(0, -3, 0); 
        this.projectionMatrix = Matrix4.perspective(Math.PI / 3, canvas.width / canvas.height, 0.1, 150.0);

        this.scoreEl = document.getElementById("score")!;
        this.livesEl = document.querySelector(".lives") as HTMLElement;
        this.overlayEl = document.getElementById("ui-overlay")!;
    }

    start() {
        requestAnimationFrame((time) => this.loop(time));
    }

    private resetGame() {
        this.score = 0;
        this.lives = 3;
        this.distanceRun = 0;
        this.runSpeed = 20;
        this.player = new Player();
        this.obstacleManager.reset();
        this.updateHUD();
        this.state = GameState.PLAYING;
        this.overlayEl.style.display = "none";
    }

    private updateHUD() {
        this.scoreEl.innerText = Math.floor(this.score).toString().padStart(6, '0');
        let hearts = "";
        for (let i = 0; i < this.lives; i++) hearts += "♥ ";
        for (let i = this.lives; i < 3; i++) hearts += "♡ ";
        this.livesEl.innerText = hearts;
    }

    private update(dt: number) {
        if (this.state === GameState.MENU) {
            if (this.input.isKeyPressed("Space")) {
                this.resetGame();
            }
            return;
        }

        if (this.state === GameState.GAME_OVER) {
            this.overlayEl.style.display = "block";
            this.overlayEl.innerHTML = `<h1>GAME OVER</h1><h2>SCORE: ${Math.floor(this.score)}</h2><p class="controls-title">PRESS SPACE TO RESTART</p>`;
            if (this.input.isKeyPressed("Space")) {
                this.resetGame();
            }
            return;
        }

        // Playing State
        if (this.input.isKeyPressed("KeyA") || this.input.isKeyPressed("ArrowLeft")) this.player.moveLeft();
        if (this.input.isKeyPressed("KeyD") || this.input.isKeyPressed("ArrowRight")) this.player.moveRight();
        if (this.input.isKeyPressed("Space")) this.player.jump();
        if (this.input.isKeyPressed("ArrowDown") || this.input.isKeyPressed("KeyS")) this.player.slide();

        this.player.update(dt);
        this.distanceRun += this.runSpeed * dt;
        this.score += this.runSpeed * dt * 0.1;

        // Obstacles
        const hit = this.obstacleManager.update(dt, this.runSpeed, this.player);
        if (hit) {
            this.lives--;
            // simple hit feedback
            this.renderer.clear(); // flash
            if (this.lives <= 0) {
                this.state = GameState.GAME_OVER;
            }
        }
        
        // Difficulty increase
        this.runSpeed += dt * 0.2;

        this.updateHUD();
    }

    private draw() {
        this.renderer.clear();
        
        // Draw Road
        this.renderer.drawMesh(
            this.road.mesh, 
            this.road.getWorldMatrix(this.distanceRun), 
            this.viewMatrix, 
            this.projectionMatrix, 
            "#ff00ff",
            "#ff00ff"
        );

        // Draw Obstacles
        this.obstacleManager.draw(this.renderer, this.viewMatrix, this.projectionMatrix);

        // Draw Player
        // If hit recently, blink (could add i-frames later)
        this.renderer.drawMesh(
            this.player.mesh, 
            this.player.getWorldMatrix(), 
            this.viewMatrix, 
            this.projectionMatrix, 
            "#00ffff",
            "#00ffff"
        );
    }

    private loop(time: number) {
        const dt = (time - this.lastTime) / 1000.0;
        this.lastTime = time;

        if (dt > 0 && dt < 0.1) {
            this.update(dt);
            this.draw();
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}

