import { Mesh } from "../graphics/Mesh";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";
import { Renderer } from "../graphics/Renderer";
import { AVATARS, getSavedAvatarId, type AvatarDefinition } from "./AvatarData";

export class Player {
    public mesh: Mesh;
    public shieldMesh: Mesh;
    
    // Avatar state
    public currentAvatar: AvatarDefinition;
    public spriteImg: HTMLImageElement | null = null;
    public spriteLoaded: boolean = false;

    // 3D World Position & Orientation
    public positionX: number = 0; // -4 (Left), 0 (Center), 4 (Right)
    public positionY: number = 0; // Current base vertical position
    public positionZ: number = -5; // Fixed position ahead of camera
    
    public scaleY: number = 1.0;
    public targetX: number = 0;

    // Physics
    public isJumping: boolean = false;
    private velocityY: number = 0;
    private readonly gravity: number = -44;

    // Sliding
    public isSliding: boolean = false;
    private slideTimer: number = 0;
    private readonly slideDuration: number = 0.8;

    // Power-up & combat
    public hasShield: boolean = false;
    public invulnerableTimer: number = 0;

    // Animation timing & kinematics
    private animTime: number = 0;
    private runningBounce: number = 0;
    private baseVertices: Vector3[] = [];

    constructor() {
        const initialAvatarId = getSavedAvatarId();
        this.currentAvatar = AVATARS.find(a => a.id === initialAvatarId) || AVATARS[0];

        this.mesh = Mesh.createRunner(this.currentAvatar.id);
        this.shieldMesh = Mesh.createShield(1.3);
        this.cacheBaseVertices();

        if (this.currentAvatar.type === "sprite" && this.currentAvatar.spriteSrc) {
            this.loadSprite(this.currentAvatar.spriteSrc);
        }
    }

    public setAvatar(avatarId: string) {
        const found = AVATARS.find(a => a.id === avatarId);
        if (!found) return;
        this.currentAvatar = found;

        if (found.type === "sprite" && found.spriteSrc) {
            this.loadSprite(found.spriteSrc);
        } else {
            this.mesh = Mesh.createRunner(found.id);
            this.cacheBaseVertices();
        }
    }

    private cacheBaseVertices() {
        this.baseVertices = this.mesh.vertices.map(v => new Vector3(v.x, v.y, v.z));
    }

    private loadSprite(src: string) {
        this.spriteImg = new Image();
        this.spriteImg.src = src;
        this.spriteImg.onload = () => {
            this.spriteLoaded = true;
        };
    }

    update(dt: number) {
        this.animTime += dt;

        // Invulnerability countdown
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer < 0) this.invulnerableTimer = 0;
        }

        // Smooth 3-Lane Movement (fast, responsive exponential damping)
        const diffX = this.targetX - this.positionX;
        if (Math.abs(diffX) > 0.005) {
            this.positionX += diffX * (1 - Math.exp(-22 * dt));
        } else {
            this.positionX = this.targetX;
        }

        // Jump physics
        if (this.isJumping) {
            this.positionY += this.velocityY * dt;
            this.velocityY += this.gravity * dt;

            // Soft landing
            if (this.positionY <= 0) {
                this.positionY = 0;
                this.isJumping = false;
                this.velocityY = 0;
            }
            this.runningBounce = 0;
        } else if (!this.isSliding) {
            // Running vertical stride bounce
            const strideFreq = 11.0;
            this.runningBounce = Math.abs(Math.sin(this.animTime * strideFreq)) * 0.10;
        } else {
            this.runningBounce = 0;
        }

        // Slide crouch
        if (this.isSliding) {
            this.slideTimer -= dt;
            this.scaleY = 0.42;
            if (this.slideTimer <= 0) {
                this.isSliding = false;
                this.scaleY = 1.0;
            }
        } else if (!this.isJumping) {
            this.scaleY = 1.0;
        }

        // Update Articulated 3D Runner Skeletal Kinematics
        this.updateRunningKinematics();
    }

    private updateRunningKinematics() {
        if (this.baseVertices.length < 17 || this.mesh.vertices.length < 17) return;

        const strideFreq = 11.0;
        const phase = this.animTime * strideFreq;
        const cycle = Math.sin(phase);

        // Reset to base positions
        for (let i = 0; i < this.baseVertices.length; i++) {
            this.mesh.vertices[i].x = this.baseVertices[i].x;
            this.mesh.vertices[i].y = this.baseVertices[i].y;
            this.mesh.vertices[i].z = this.baseVertices[i].z;
        }

        if (this.isJumping) {
            // Athletic tucked leap pose in mid-air
            // Arms raised forward for flight balance
            this.mesh.vertices[9].z = 0.45;  // Left elbow
            this.mesh.vertices[10].z = 0.70; // Left hand
            this.mesh.vertices[11].z = 0.45; // Right elbow
            this.mesh.vertices[12].z = 0.70; // Right hand

            // Legs tucked slightly forward
            this.mesh.vertices[13].z = 0.35; // Left knee
            this.mesh.vertices[13].y = 0.40;
            this.mesh.vertices[14].z = 0.15; // Left foot
            this.mesh.vertices[14].y = -0.15;

            this.mesh.vertices[15].z = 0.35; // Right knee
            this.mesh.vertices[15].y = 0.40;
            this.mesh.vertices[16].z = 0.15; // Right foot
            this.mesh.vertices[16].y = -0.15;
        } else if (this.isSliding) {
            // Low crouch slide pose
            this.mesh.vertices[9].z = -0.3;
            this.mesh.vertices[10].z = -0.4;
            this.mesh.vertices[11].z = -0.3;
            this.mesh.vertices[12].z = -0.4;

            // Feet extended forward
            this.mesh.vertices[13].z = 0.6;
            this.mesh.vertices[14].z = 0.95;
            this.mesh.vertices[15].z = 0.6;
            this.mesh.vertices[16].z = 0.95;
        } else {
            // Biomechanically smooth running cycle:
            // 1. Left leg & knee bend
            const hipSwingL = cycle * 0.45;
            const backKickL = Math.max(0, -cycle); // flexion when kicking backward
            this.mesh.vertices[13].z = hipSwingL;
            this.mesh.vertices[13].y = 0.20 + backKickL * 0.15;
            this.mesh.vertices[14].z = hipSwingL * 1.3 - backKickL * 0.35;
            this.mesh.vertices[14].y = -0.35 + backKickL * 0.28;

            // 2. Right leg & knee bend (counter-phase)
            const hipSwingR = -cycle * 0.45;
            const backKickR = Math.max(0, cycle);
            this.mesh.vertices[15].z = hipSwingR;
            this.mesh.vertices[15].y = 0.20 + backKickR * 0.15;
            this.mesh.vertices[16].z = hipSwingR * 1.3 - backKickR * 0.35;
            this.mesh.vertices[16].y = -0.35 + backKickR * 0.28;

            // 3. Left arm (opposes left leg)
            const armSwingL = -cycle * 0.45;
            this.mesh.vertices[9].z = armSwingL * 0.8;
            this.mesh.vertices[10].z = armSwingL * 1.4 + 0.15;

            // 4. Right arm (opposes right leg)
            const armSwingR = cycle * 0.45;
            this.mesh.vertices[11].z = armSwingR * 0.8;
            this.mesh.vertices[12].z = armSwingR * 1.4 + 0.15;

            // 5. Shinobi scarf dynamic flutter if present
            if (this.mesh.vertices.length >= 20) {
                const flutter = Math.sin(phase * 1.4) * 0.18;
                this.mesh.vertices[18].x += flutter * 0.5;
                this.mesh.vertices[19].x += flutter;
            }
        }
    }

    moveLeft() {
        if (this.targetX > -4) {
            this.targetX = Math.max(-4, this.targetX - 4);
        }
    }

    moveRight() {
        if (this.targetX < 4) {
            this.targetX = Math.min(4, this.targetX + 4);
        }
    }

    jump(): boolean {
        if (!this.isJumping && !this.isSliding) {
            this.isJumping = true;
            this.velocityY = 16.5;
            return true;
        }
        return false;
    }

    slide(): boolean {
        if (!this.isJumping && !this.isSliding) {
            this.isSliding = true;
            this.slideTimer = this.slideDuration;
            return true;
        }
        return false;
    }

    getBounds(): { min: Vector3; max: Vector3 } {
        const halfWidth = 0.7;
        const halfDepth = 0.7;
        const effectiveY = this.positionY + this.runningBounce;
        const height = 1.9 * this.scaleY;

        return {
            min: new Vector3(this.positionX - halfWidth, effectiveY, this.positionZ - halfDepth),
            max: new Vector3(this.positionX + halfWidth, effectiveY + height, this.positionZ + halfDepth)
        };
    }

    getWorldMatrix(): Matrix4 {
        const effectiveY = this.positionY + this.runningBounce;
        const t = Matrix4.translation(this.positionX, effectiveY, this.positionZ);
        const s = Matrix4.scaling(1, this.scaleY, 1);
        
        // Dynamic bank roll when switching lanes
        const laneLean = (this.targetX - this.positionX) * -0.06;
        const rz = Matrix4.rotationZ(laneLean);

        // Aerodynamic forward sprint lean (8 degrees)
        const rx = Matrix4.rotationX(0.14);

        return t.multiply(rz).multiply(rx).multiply(s);
    }

    getShieldWorldMatrix(): Matrix4 {
        const effectiveY = this.positionY + this.runningBounce;
        const t = Matrix4.translation(this.positionX, effectiveY + 0.8 * this.scaleY, this.positionZ);
        const ry = Matrix4.rotationY(this.animTime * 3.5);
        const rx = Matrix4.rotationX(0.3);
        const pulse = 1.0 + Math.sin(this.animTime * 6.0) * 0.08;
        const s = Matrix4.scaling(pulse, pulse, pulse);

        return t.multiply(ry).multiply(rx).multiply(s);
    }

    draw(renderer: Renderer, vpMatrix: Matrix4) {
        const isBlinking = this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0;
        if (isBlinking) return;

        if (this.currentAvatar.type === "sprite" && this.spriteImg && this.spriteLoaded) {
            // Draw 2D billboard sprite in 3D perspective
            const effectiveY = this.positionY + this.runningBounce;
            renderer.drawBillboard(
                this.spriteImg,
                this.positionX,
                effectiveY,
                this.positionZ,
                2.2,
                2.4 * this.scaleY,
                vpMatrix
            );
        } else {
            // Draw 3D Articulated Avatar Mesh
            renderer.drawMesh(
                this.mesh,
                this.getWorldMatrix(),
                vpMatrix,
                this.currentAvatar.primaryColor,
                { lineWidth: 2.2 }
            );
        }

        // Draw Protective Forcefield Shield if active
        if (this.hasShield) {
            renderer.drawMesh(
                this.shieldMesh,
                this.getShieldWorldMatrix(),
                vpMatrix,
                "#00ffff",
                { lineWidth: 1.8 }
            );
        }
    }

    hit(): boolean {
        if (this.invulnerableTimer > 0) return false;

        if (this.hasShield) {
            this.hasShield = false;
            this.invulnerableTimer = 1.2;
            return false;
        }

        this.invulnerableTimer = 1.5;
        return true;
    }

    reset() {
        this.positionX = 0;
        this.targetX = 0;
        this.positionY = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.isSliding = false;
        this.scaleY = 1.0;
        this.hasShield = false;
        this.invulnerableTimer = 0;
        this.animTime = 0;
        this.runningBounce = 0;
    }
}
