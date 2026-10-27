import { Mesh } from "./Mesh";
import { Matrix4 } from "../math/Matrix4";
import { Vector4 } from "../math/Vector4";

export interface RenderOptions {
    color: string;
    lineWidth?: number;
    fillColor?: string;
}

export class Renderer {
    public ctx: CanvasRenderingContext2D;
    public width: number;
    public height: number;

    // Pre-allocated vertex clip cache to avoid object allocations per frame
    private clipPool: Vector4[] = [];
    private screenPool: { x: number; y: number }[] = [];

    // Reusable matrices
    private tempMVP: Matrix4 = new Matrix4();

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;
        this.width = canvas.width;
        this.height = canvas.height;

        // Pre-allocate pools for up to 256 vertices per mesh
        for (let i = 0; i < 256; i++) {
            this.clipPool.push(new Vector4(0, 0, 0, 1));
            this.screenPool.push({ x: 0, y: 0 });
        }
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    clear() {
        // High-performance fill: solid dark cyberpunk background
        this.ctx.fillStyle = "#050412";
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Fast near-plane line clipping in homogeneous clip space (w >= 0.1).
     */
    private clipLine(
        p0: Vector4, 
        p1: Vector4,
        out0: Vector4,
        out1: Vector4,
        wNear: number = 0.1
    ): boolean {
        const d0 = p0.w - wNear;
        const d1 = p1.w - wNear;

        // Both behind near plane
        if (d0 < 0 && d1 < 0) return false;

        // Both in front
        if (d0 >= 0 && d1 >= 0) {
            out0.x = p0.x; out0.y = p0.y; out0.z = p0.z; out0.w = p0.w;
            out1.x = p1.x; out1.y = p1.y; out1.z = p1.z; out1.w = p1.w;
            return true;
        }

        // Clip against w = wNear
        const t = (wNear - p0.w) / (p1.w - p0.w);
        const clipX = p0.x + t * (p1.x - p0.x);
        const clipY = p0.y + t * (p1.y - p0.y);
        const clipZ = p0.z + t * (p1.z - p0.z);

        if (d0 < 0) {
            out0.x = clipX; out0.y = clipY; out0.z = clipZ; out0.w = wNear;
            out1.x = p1.x; out1.y = p1.y; out1.z = p1.z; out1.w = p1.w;
        } else {
            out0.x = p0.x; out0.y = p0.y; out0.z = p0.z; out0.w = p0.w;
            out1.x = clipX; out1.y = clipY; out1.z = clipZ; out1.w = wNear;
        }
        return true;
    }

    private static tempC0 = new Vector4(0, 0, 0, 1);
    private static tempC1 = new Vector4(0, 0, 0, 1);

    /**
     * Highly optimized batched mesh rendering.
     * Batches all line segments into a single beginPath() -> stroke() call.
     * Zero allocations per draw call!
     */
    drawMesh(
        mesh: Mesh, 
        worldMatrix: Matrix4, 
        vpMatrix: Matrix4, 
        color: string, 
        options: Partial<RenderOptions> = {}
    ) {
        // Fast MVP = VP * World
        vpMatrix.multiplyTo(worldMatrix, this.tempMVP);
        const mvp = this.tempMVP.values;

        const vCount = mesh.vertices.length;
        if (vCount > this.clipPool.length) {
            for (let i = this.clipPool.length; i < vCount; i++) {
                this.clipPool.push(new Vector4(0, 0, 0, 1));
                this.screenPool.push({ x: 0, y: 0 });
            }
        }

        // Transform vertices to homogeneous coordinates and project
        const halfW = 0.5 * this.width;
        const halfH = 0.5 * this.height;

        for (let i = 0; i < vCount; i++) {
            const v = mesh.vertices[i];
            const cp = this.clipPool[i];

            // Inlined 4x4 multiplyVector for speed
            cp.x = mvp[0][0] * v.x + mvp[0][1] * v.y + mvp[0][2] * v.z + mvp[0][3];
            cp.y = mvp[1][0] * v.x + mvp[1][1] * v.y + mvp[1][2] * v.z + mvp[1][3];
            cp.z = mvp[2][0] * v.x + mvp[2][1] * v.y + mvp[2][2] * v.z + mvp[2][3];
            cp.w = mvp[3][0] * v.x + mvp[3][1] * v.y + mvp[3][2] * v.z + mvp[3][3];

            if (cp.w >= 0.1) {
                const invW = 1.0 / cp.w;
                this.screenPool[i].x = (cp.x * invW + 1.0) * halfW;
                this.screenPool[i].y = (1.0 - cp.y * invW) * halfH;
            }
        }

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = options.lineWidth ?? 2;
        this.ctx.beginPath();

        let hasLines = false;

        // Batch all face lines into this single path
        for (let f = 0; f < mesh.faces.length; f++) {
            const face = mesh.faces[f];
            const count = face.indices.length;
            if (count < 2) continue;

            if (count === 2) {
                const idx0 = face.indices[0];
                const idx1 = face.indices[1];
                const p0 = this.clipPool[idx0];
                const p1 = this.clipPool[idx1];

                if (p0.w >= 0.1 && p1.w >= 0.1) {
                    const s0 = this.screenPool[idx0];
                    const s1 = this.screenPool[idx1];
                    this.ctx.moveTo(s0.x, s0.y);
                    this.ctx.lineTo(s1.x, s1.y);
                    hasLines = true;
                } else if (this.clipLine(p0, p1, Renderer.tempC0, Renderer.tempC1, 0.1)) {
                    const invW0 = 1.0 / Renderer.tempC0.w;
                    const invW1 = 1.0 / Renderer.tempC1.w;
                    const sx0 = (Renderer.tempC0.x * invW0 + 1.0) * halfW;
                    const sy0 = (1.0 - Renderer.tempC0.y * invW0) * halfH;
                    const sx1 = (Renderer.tempC1.x * invW1 + 1.0) * halfW;
                    const sy1 = (1.0 - Renderer.tempC1.y * invW1) * halfH;
                    this.ctx.moveTo(sx0, sy0);
                    this.ctx.lineTo(sx1, sy1);
                    hasLines = true;
                }
            } else {
                // Closed polygon
                let allFront = true;
                for (let i = 0; i < count; i++) {
                    if (this.clipPool[face.indices[i]].w < 0.1) {
                        allFront = false;
                        break;
                    }
                }

                if (allFront) {
                    const first = this.screenPool[face.indices[0]];
                    this.ctx.moveTo(first.x, first.y);
                    for (let i = 1; i < count; i++) {
                        const pt = this.screenPool[face.indices[i]];
                        this.ctx.lineTo(pt.x, pt.y);
                    }
                    this.ctx.closePath();
                    hasLines = true;
                }
            }
        }

        if (hasLines) {
            if (options.fillColor) {
                this.ctx.fillStyle = options.fillColor;
                this.ctx.fill();
            }
            this.ctx.stroke();
        }
    }

    /**
     * Draws a 2D billboard sprite in 3D perspective space (for sprite avatars).
     */
    drawBillboard(
        img: HTMLImageElement,
        worldX: number,
        worldY: number,
        worldZ: number,
        width3D: number,
        height3D: number,
        vpMatrix: Matrix4
    ) {
        const mvp = vpMatrix.values;
        // Transform center point
        const cw = mvp[3][0] * worldX + mvp[3][1] * worldY + mvp[3][2] * worldZ + mvp[3][3];
        if (cw < 0.1) return; // Behind camera

        const invW = 1.0 / cw;
        const cx = mvp[0][0] * worldX + mvp[0][1] * worldY + mvp[0][2] * worldZ + mvp[0][3];
        const cy = mvp[1][0] * worldX + mvp[1][1] * worldY + mvp[1][2] * worldZ + mvp[1][3];

        const screenX = (cx * invW + 1.0) * 0.5 * this.width;
        const screenY = (1.0 - cy * invW) * 0.5 * this.height;

        // Size in screen pixels scaled by 1/w
        const screenW = width3D * invW * this.width * 0.6;
        const screenH = height3D * invW * this.height * 0.6;

        this.ctx.drawImage(
            img,
            screenX - screenW / 2,
            screenY - screenH,
            screenW,
            screenH
        );
    }
}
