import { Mesh } from "../graphics/Mesh";
import { Matrix4 } from "../math/Matrix4";

export class Player {
    public mesh: Mesh;
    
    // Physics / state
    public positionX: number = 0; // -4 (Left), 0 (Center), 4 (Right)
    public positionY: number = 0;
    public positionZ: number = -5; // Fixed position ahead of camera (negative Z is forward)
    
    public scaleY: number = 1;

    // Movement
    private targetX: number = 0;
    public isJumping: boolean = false;
    private velocityY: number = 0;
    private gravity: number = -40;
    public isSliding: boolean = false;
    private slideTimer: number = 0;

    constructor() {
        // Stylized kid/robot runner
        this.mesh = Mesh.createRunner();
    }

    update(dt: number) {
        // Smooth lane switching
        const diffX = this.targetX - this.positionX;
        if (Math.abs(diffX) > 0.1) {
            this.positionX += diffX * 10 * dt;
        } else {
            this.positionX = this.targetX;
        }

        // Jumping
        if (this.isJumping) {
            this.positionY += this.velocityY * dt;
            this.velocityY += this.gravity * dt;

            if (this.positionY <= 0) {
                this.positionY = 0;
                this.isJumping = false;
                this.velocityY = 0;
            }
        }

        // Sliding
        if (this.isSliding) {
            this.scaleY = 0.4;
            this.slideTimer -= dt;
            if (this.slideTimer <= 0) {
                this.isSliding = false;
                this.scaleY = 1.0;
            }
        }

        // Animate arms and legs (vertices 8, 9, 10, 11 of the runner mesh)
        // Only if it's the runner mesh
        if (this.mesh.vertices.length === 12) {
            const time = Date.now() / 150; // speed of running animation
            
            // Left arm (8) and Right leg (11) move together
            // Right arm (9) and Left leg (10) move together
            const swing = Math.sin(time) * 0.8;
            
            // 8: Hand left
            this.mesh.vertices[8].z = swing;
            // 9: Hand right
            this.mesh.vertices[9].z = -swing;
            // 10: Foot left
            this.mesh.vertices[10].z = -swing;
            // 11: Foot right
            this.mesh.vertices[11].z = swing;
            
            // Add a little bounce to the whole mesh by modifying Y based on absolute sine
            const bounce = Math.abs(Math.sin(time)) * 0.2;
            this.positionY = this.isJumping ? this.positionY : bounce;
        }
    }

    moveLeft() {
        if (this.targetX > -4) this.targetX -= 4;
    }

    moveRight() {
        if (this.targetX < 4) this.targetX += 4;
    }

    jump() {
        if (!this.isJumping && !this.isSliding) {
            this.isJumping = true;
            this.velocityY = 15;
        }
    }

    slide() {
        if (!this.isJumping && !this.isSliding) {
            this.isSliding = true;
            this.slideTimer = 0.8; // Slide for 0.8 seconds
        }
    }

    getWorldMatrix(): Matrix4 {
        const t = Matrix4.translation(this.positionX, this.positionY, this.positionZ);
        const s = Matrix4.scaling(1, this.scaleY, 1);
        
        // Add a slight rotation for running visual?
        const ry = Matrix4.rotationY(Math.sin(Date.now() / 200) * 0.1); 

        return t.multiply(ry).multiply(s);
    }
}
