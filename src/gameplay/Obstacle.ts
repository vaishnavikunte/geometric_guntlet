import { Mesh } from "../graphics/Mesh";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";

export const ObstacleType = {
    BLOCKER: 0,
    BARRIER: 1
};

export class Obstacle {
    public mesh: Mesh;
    public positionX: number;
    public positionY: number;
    public positionZ: number;
    public type: number;
    public active: boolean = true;

    // AABB Bounds relative to center
    public boundsMin: Vector3;
    public boundsMax: Vector3;

    constructor(laneX: number, z: number, type: number) {
        this.positionX = laneX;
        this.positionZ = z;
        this.type = type;

        if (type === ObstacleType.BLOCKER) {
            this.mesh = Mesh.createCube(2);
            this.positionY = 0;
            this.boundsMin = new Vector3(-1, -1, -1);
            this.boundsMax = new Vector3(1, 1, 1);
        } else {
            // Barrier
            this.mesh = Mesh.createCube(2);
            // We scale it differently in getWorldMatrix, but bounds need to reflect it
            this.positionY = 1.5; // elevated
            this.boundsMin = new Vector3(-1.5, -0.5, -0.5);
            this.boundsMax = new Vector3(1.5, 0.5, 0.5);
        }
    }

    getWorldMatrix(): Matrix4 {
        const t = Matrix4.translation(this.positionX, this.positionY, this.positionZ);
        if (this.type === ObstacleType.BARRIER) {
            const s = Matrix4.scaling(3, 0.5, 0.5);
            return t.multiply(s);
        }
        return t;
    }

    checkCollision(playerPos: Vector3, playerScaleY: number): boolean {
        if (!this.active) return false;

        // Player bounds (roughly 1.5 unit cube)
        const pMinX = playerPos.x - 0.75;
        const pMaxX = playerPos.x + 0.75;
        
        const pMinY = playerPos.y - (0.75 * playerScaleY);
        const pMaxY = playerPos.y + (0.75 * playerScaleY);
        
        const pMinZ = playerPos.z - 0.75;
        const pMaxZ = playerPos.z + 0.75;

        // Obstacle absolute bounds
        const oMinX = this.positionX + this.boundsMin.x;
        const oMaxX = this.positionX + this.boundsMax.x;
        
        const oMinY = this.positionY + this.boundsMin.y;
        const oMaxY = this.positionY + this.boundsMax.y;
        
        const oMinZ = this.positionZ + this.boundsMin.z;
        const oMaxZ = this.positionZ + this.boundsMax.z;

        // AABB intersection
        return (
            pMinX <= oMaxX && pMaxX >= oMinX &&
            pMinY <= oMaxY && pMaxY >= oMinY &&
            pMinZ <= oMaxZ && pMaxZ >= oMinZ
        );
    }
}
