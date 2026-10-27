import { Mesh } from "../graphics/Mesh";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";

export const CollectibleType = {
    COIN: 0,
    SHIELD: 1
} as const;

export type CollectibleTypeValue = typeof CollectibleType[keyof typeof CollectibleType];

export class Collectible {
    public mesh: Mesh;
    public type: CollectibleTypeValue;
    public positionX: number;
    public positionY: number;
    public positionZ: number;
    public active: boolean = true;
    public rotationAngle: number = 0;
    public color: string;
    public glowColor: string;
    public radius: number = 0.8;

    constructor(laneX: number, y: number, z: number, type: CollectibleTypeValue) {
        this.positionX = laneX;
        this.positionY = y;
        this.positionZ = z;
        this.type = type;

        if (type === CollectibleType.COIN) {
            this.mesh = Mesh.createCoin(0.55, 0.15);
            this.color = "#ffd700"; // Gold
            this.glowColor = "#ffaa00";
        } else {
            this.mesh = Mesh.createShield(0.65);
            this.color = "#00ffff"; // Electric cyan
            this.glowColor = "#00e5ff";
        }
    }

    update(dt: number, speed: number) {
        this.positionZ += speed * dt;
        // Continuous rotation around Y axis
        this.rotationAngle += 4.0 * dt;
    }

    getWorldMatrix(): Matrix4 {
        const bob = Math.sin(this.rotationAngle * 1.5) * 0.15;
        const t = Matrix4.translation(this.positionX, this.positionY + bob, this.positionZ);
        const ry = Matrix4.rotationY(this.rotationAngle);
        
        if (this.type === CollectibleType.SHIELD) {
            // Shield tilts dynamically
            const rx = Matrix4.rotationX(0.4);
            return t.multiply(ry).multiply(rx);
        }

        return t.multiply(ry);
    }

    checkCollision(playerBounds: { min: Vector3; max: Vector3 }): boolean {
        if (!this.active) return false;

        const cMinX = this.positionX - this.radius;
        const cMaxX = this.positionX + this.radius;
        const cMinY = this.positionY - this.radius;
        const cMaxY = this.positionY + this.radius;
        const cMinZ = this.positionZ - this.radius;
        const cMaxZ = this.positionZ + this.radius;

        return (
            playerBounds.min.x <= cMaxX && playerBounds.max.x >= cMinX &&
            playerBounds.min.y <= cMaxY && playerBounds.max.y >= cMinY &&
            playerBounds.min.z <= cMaxZ && playerBounds.max.z >= cMinZ
        );
    }
}
