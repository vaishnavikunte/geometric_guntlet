import { Mesh } from "./Mesh";
import { Matrix4 } from "../math/Matrix4";
import { Vector4 } from "../math/Vector4";

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;
        this.width = canvas.width;
        this.height = canvas.height;
    }

    clear() {
        // Futuristic background
        this.ctx.fillStyle = "#050510"; 
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawMesh(mesh: Mesh, worldMatrix: Matrix4, viewMatrix: Matrix4, projectionMatrix: Matrix4, color: string, glowColor: string = color) {
        const mvp = projectionMatrix.multiply(viewMatrix).multiply(worldMatrix);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = glowColor;

        for (const face of mesh.faces) {
            this.ctx.beginPath();
            
            for (let i = 0; i < face.indices.length; i++) {
                const vertex = mesh.vertices[face.indices[i]];
                const v4 = new Vector4(vertex.x, vertex.y, vertex.z, 1);
                
                const transformed = mvp.multiplyVector(v4);
                
                let ndcX = transformed.x;
                let ndcY = transformed.y;
                let ndcZ = transformed.z;
                
                if (transformed.w !== 0) {
                    ndcX /= transformed.w;
                    ndcY /= transformed.w;
                    ndcZ /= transformed.w;
                }

                if (ndcZ < -1 || ndcZ > 1) {
                    continue; 
                }

                const screenX = (ndcX + 1) * 0.5 * this.width;
                const screenY = (1 - ndcY) * 0.5 * this.height;

                if (i === 0) {
                    this.ctx.moveTo(screenX, screenY);
                } else {
                    this.ctx.lineTo(screenX, screenY);
                }
            }
            if (face.indices.length > 2) {
                this.ctx.closePath();
            }
            this.ctx.stroke();
        }

        this.ctx.shadowBlur = 0;
    }
}
