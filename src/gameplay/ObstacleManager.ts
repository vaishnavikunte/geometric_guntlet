import { Obstacle, ObstacleType, type ObstacleTypeValue } from "./Obstacle";
import { Collectible, CollectibleType } from "./Collectible";
import { Renderer } from "../graphics/Renderer";
import { Matrix4 } from "../math/Matrix4";
import { Player } from "./Player";
import { SoundManager } from "../core/SoundManager";
import { ParticleSystem } from "../graphics/ParticleSystem";

export interface CollisionResult {
    hitObstacle: boolean;
    obstacleType?: ObstacleTypeValue;
    coinsCollected: number;
    shieldCollected: boolean;
    hitX: number;
    hitY: number;
}

export class ObstacleManager {
    public obstacles: Obstacle[] = [];
    public collectibles: Collectible[] = [];

    private spawnTimer: number = 0;
    private lanes = [-4, 0, 4];
    private spawnDistance = -110; // Negative Z distance where items appear

    constructor() {
        this.reset();
    }

    update(
        dt: number, 
        speed: number, 
        player: Player, 
        sound: SoundManager, 
        particles: ParticleSystem
    ): CollisionResult {
        const result: CollisionResult = {
            hitObstacle: false,
            coinsCollected: 0,
            shieldCollected: false,
            hitX: 0,
            hitY: 0
        };

        const playerBounds = player.getBounds();

        // 1. Update and check Obstacles
        for (const obs of this.obstacles) {
            obs.positionZ += speed * dt;

            if (obs.active && obs.checkCollision(playerBounds)) {
                obs.active = false; // Prevent multiple hits from same obstacle
                result.hitObstacle = true;
                result.obstacleType = obs.type;
                result.hitX = obs.positionX;
                result.hitY = obs.positionY;

                // Screen position estimation for particle burst
                // Player is at Z = -5, roughly screen center
                const screenX = window.innerWidth / 2 + (obs.positionX / 6) * (window.innerWidth * 0.25);
                const screenY = window.innerHeight * 0.65 - (player.positionY * 20);

                const lifeLost = player.hit();
                if (lifeLost) {
                    sound.playHit();
                    particles.addHitSparks(screenX, screenY);
                } else {
                    // Shield absorbed it!
                    sound.playShieldBreak();
                    particles.addShieldBurst(screenX, screenY);
                }
            }
        }

        // 2. Update and check Collectibles (Coins & Shield)
        for (const col of this.collectibles) {
            col.update(dt, speed);

            if (col.active && col.checkCollision(playerBounds)) {
                col.active = false; // Collect once only

                const screenX = window.innerWidth / 2 + (col.positionX / 6) * (window.innerWidth * 0.25);
                const screenY = window.innerHeight * 0.65 - (col.positionY * 25);

                if (col.type === CollectibleType.COIN) {
                    result.coinsCollected++;
                    sound.playCoin();
                    particles.addCoinBurst(screenX, screenY);
                } else if (col.type === CollectibleType.SHIELD) {
                    result.shieldCollected = true;
                    player.hasShield = true;
                    sound.playShieldPickup();
                    particles.addShieldBurst(screenX, screenY);
                }
            }
        }

        // 3. Clean up objects that have passed behind the camera
        this.obstacles = this.obstacles.filter(o => o.positionZ < 8);
        this.collectibles = this.collectibles.filter(c => c.positionZ < 8);

        // 4. Procedural Fair Spawner
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnFairWave();
            // Spacing dynamically adjusts with speed to keep distance fair
            const baseInterval = Math.max(1.1, 28 / speed);
            this.spawnTimer = baseInterval + Math.random() * 0.4;
        }

        return result;
    }

    private spawnFairWave() {
        // Choose how many lanes will have obstacles: 1 or 2 (NEVER all 3, guaranteeing at least one open lane)
        const laneIndices = [0, 1, 2];
        // Shuffle lane order
        for (let i = laneIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [laneIndices[i], laneIndices[j]] = [laneIndices[j], laneIndices[i]];
        }

        const isDoubleObstacle = Math.random() < 0.45;
        const obstacleCount = isDoubleObstacle ? 2 : 1;
        const occupiedLanes = new Set<number>();

        for (let i = 0; i < obstacleCount; i++) {
            const laneIndex = laneIndices[i];
            const laneX = this.lanes[laneIndex];
            occupiedLanes.add(laneIndex);

            // Choose obstacle type
            const rand = Math.random();
            let type: ObstacleTypeValue;
            if (rand < 0.38) {
                type = ObstacleType.ROAD_BARRIER; // Low hurdle (jumpable)
            } else if (rand < 0.72) {
                type = ObstacleType.CYBER_CRATE;  // Crate (switch lanes)
            } else {
                type = ObstacleType.LASER_GATE;   // Overhead laser (slide under)
            }

            this.obstacles.push(new Obstacle(laneX, this.spawnDistance, type));
        }

        // Spawn Coins in one of the remaining open lanes or over a barrier
        const openLanes = laneIndices.filter(l => !occupiedLanes.has(l));
        if (openLanes.length > 0) {
            const coinLane = this.lanes[openLanes[0]];
            const coinCount = 2 + Math.floor(Math.random() * 3); // 2 to 4 coins
            for (let c = 0; c < coinCount; c++) {
                const zOffset = this.spawnDistance + (c * 4.5);
                this.collectibles.push(new Collectible(coinLane, 0.4, zOffset, CollectibleType.COIN));
            }

            // Occasional shield power-up spawn (12% chance in remaining open lane)
            const hasExistingShield = this.collectibles.some(item => item.type === CollectibleType.SHIELD && item.active);
            if (!hasExistingShield && Math.random() < 0.14) {
                const shieldZ = this.spawnDistance - 15;
                this.collectibles.push(new Collectible(coinLane, 0.8, shieldZ, CollectibleType.SHIELD));
            }
        }
    }

    draw(renderer: Renderer, vpMatrix: Matrix4) {
        // Draw Collectibles first
        for (const col of this.collectibles) {
            if (!col.active) continue;
            renderer.drawMesh(
                col.mesh, 
                col.getWorldMatrix(), 
                vpMatrix, 
                col.color, 
                { lineWidth: 2 }
            );
        }

        // Draw Obstacles
        for (const obs of this.obstacles) {
            if (!obs.active) continue;
            renderer.drawMesh(
                obs.mesh, 
                obs.getWorldMatrix(), 
                vpMatrix, 
                obs.color, 
                { lineWidth: 2.2 }
            );
        }
    }

    reset() {
        this.obstacles = [];
        this.collectibles = [];
        this.spawnTimer = 2.0; // Initial delay before obstacles start spawning
    }
}
