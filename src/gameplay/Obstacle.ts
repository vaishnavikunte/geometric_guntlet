import { Mesh } from "../graphics/Mesh";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";

export const ObstacleType = {
    ROAD_BARRIER: 0, // Low barrier - can jump over
    CYBER_CRATE: 1,  // Full height box - must switch lanes
    LASER_GATE: 2    // High overhead beam - must slide under
} as const;

export type ObstacleTypeValue = typeof ObstacleType[keyof typeof ObstacleType];

export class Obstacle {
    public mesh: Mesh;
    public positionX: number;
    public positionY: number = 0;
    public positionZ: number;
    public type: ObstacleTypeValue;
    public active: boolean = true;
    public color: string;
    public glowColor: string;

    // AABB Bounds relative to (positionX, positionY, positionZ)
    public boundsMin: Vector3;
    public boundsMax: Vector3;

    constructor(laneX: number, z: number, type: ObstacleTypeValue) {
        this.positionX = laneX;
        this.positionZ = z;
        this.type = type;

        if (type === ObstacleType.ROAD_BARRIER) {
            // Low Road Hurdle (jumpable)
            this.mesh = Mesh.createBarrier(2.8, 0.85);
            this.positionY = 0;
            this.boundsMin = new Vector3(-1.4, 0.0, -0.4);
            this.boundsMax = new Vector3( 1.4, 0.85,  0.4);
            this.color = "#ff8800";
            this.glowColor = "#ffaa00";
        } else if (type === ObstacleType.CYBER_CRATE) {
            // Cyber Crate (must switch lanes)
            this.mesh = Mesh.createCrate(2.0);
            this.positionY = 1.0; // centered at Y=1.0 so base sits at Y=0
            this.boundsMin = new Vector3(-1.0, -1.0, -1.0);
            this.boundsMax = new Vector3( 1.0,  1.0,  1.0);
            this.color = "#ff0055";
            this.glowColor = "#ff2a75";
        } else {
            // Laser Gate (must slide under)
            this.mesh = Mesh.createLaserGate(3.2, 2.4);
            this.positionY = 0;
            // The danger zone is the overhead beam from Y=1.2 to Y=2.4
            this.boundsMin = new Vector3(-1.6, 1.25, -0.4);
            this.boundsMax = new Vector3( 1.6, 2.40,  0.4);
            this.color = "#bf00ff";
            this.glowColor = "#00ffff";
        }
    }

    getWorldMatrix(): Matrix4 {
        return Matrix4.translation(this.positionX, this.positionY, this.positionZ);
    }

    /**
     * Exact 3D Axis-Aligned Bounding Box (AABB) intersection check.
     */
    checkCollision(playerBounds: { min: Vector3; max: Vector3 }): boolean {
        if (!this.active) return false;

        // Obstacle absolute world space AABB
        const oMinX = this.positionX + this.boundsMin.x;
        const oMaxX = this.positionX + this.boundsMax.x;
        const oMinY = this.positionY + this.boundsMin.y;
        const oMaxY = this.positionY + this.boundsMax.y;
        const oMinZ = this.positionZ + this.boundsMin.z;
        const oMaxZ = this.positionZ + this.boundsMax.z;

        // Check AABB overlap on all 3 Cartesian axes (X, Y, Z)
        const overlapX = playerBounds.min.x <= oMaxX && playerBounds.max.x >= oMinX;
        const overlapY = playerBounds.min.y <= oMaxY && playerBounds.max.y >= oMinY;
        const overlapZ = playerBounds.min.z <= oMaxZ && playerBounds.max.z >= oMinZ;

        return overlapX && overlapY && overlapZ;
    }
}
