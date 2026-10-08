import { Obstacle, ObstacleType } from "./Obstacle";
import { Renderer } from "../graphics/Renderer";
import { Matrix4 } from "../math/Matrix4";
import { Player } from "./Player";
import { Vector3 } from "../math/Vector3";

export class ObstacleManager {
    public obstacles: Obstacle[] = [];
    private spawnTimer: number = 0;
    
    // Config
    private lanes = [-4, 0, 4];
    private spawnDistance = -100; // How far ahead to spawn (negative Z)

    update(dt: number, speed: number, player: Player): boolean {
        let collisionOccurred = false;
        
        // Move obstacles towards camera (+Z)
        for (const obs of this.obstacles) {
            obs.positionZ += speed * dt;

            if (obs.active && obs.checkCollision(new Vector3(player.positionX, player.positionY, player.positionZ), player.scaleY)) {
                collisionOccurred = true;
                obs.active = false; // Prevent multiple hits from same obstacle
            }
        }

        // Remove obstacles that passed behind camera (positive Z)
        this.obstacles = this.obstacles.filter(o => o.positionZ < 10);

        // Spawn new obstacles
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawn();
            this.spawnTimer = 1.0 + Math.random() * 1.0; // Random interval 1-2s
        }

        return collisionOccurred;
    }

    spawn() {
        // Simple random spawner
        const laneX = this.lanes[Math.floor(Math.random() * this.lanes.length)];
        const isBarrier = Math.random() > 0.7;
        
        const type = isBarrier ? ObstacleType.BARRIER : ObstacleType.BLOCKER;
        this.obstacles.push(new Obstacle(laneX, this.spawnDistance, type));
    }

    draw(renderer: Renderer, viewMatrix: Matrix4, projectionMatrix: Matrix4) {
        for (const obs of this.obstacles) {
            if (!obs.active) continue;
            
            const color = obs.type === ObstacleType.BLOCKER ? "#ff304f" : "#ff8800";
            renderer.drawMesh(obs.mesh, obs.getWorldMatrix(), viewMatrix, projectionMatrix, color, color);
        }
    }
    
    reset() {
        this.obstacles = [];
        this.spawnTimer = 2.0; // Initial delay
    }
}
