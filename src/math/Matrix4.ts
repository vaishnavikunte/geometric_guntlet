import { Vector4 } from "./Vector4";

export class Matrix4 {
    public values: number[][];

    constructor() {
        this.values = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }

    multiply(m: Matrix4): Matrix4 {
        const result = new Matrix4();
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                result.values[r][c] = 
                    this.values[r][0] * m.values[0][c] +
                    this.values[r][1] * m.values[1][c] +
                    this.values[r][2] * m.values[2][c] +
                    this.values[r][3] * m.values[3][c];
            }
        }
        return result;
    }

    multiplyVector(v: Vector4): Vector4 {
        return new Vector4(
            this.values[0][0] * v.x + this.values[0][1] * v.y + this.values[0][2] * v.z + this.values[0][3] * v.w,
            this.values[1][0] * v.x + this.values[1][1] * v.y + this.values[1][2] * v.z + this.values[1][3] * v.w,
            this.values[2][0] * v.x + this.values[2][1] * v.y + this.values[2][2] * v.z + this.values[2][3] * v.w,
            this.values[3][0] * v.x + this.values[3][1] * v.y + this.values[3][2] * v.z + this.values[3][3] * v.w
        );
    }

    static translation(tx: number, ty: number, tz: number): Matrix4 {
        const m = new Matrix4();
        m.values[0][3] = tx;
        m.values[1][3] = ty;
        m.values[2][3] = tz;
        return m;
    }

    static scaling(sx: number, sy: number, sz: number): Matrix4 {
        const m = new Matrix4();
        m.values[0][0] = sx;
        m.values[1][1] = sy;
        m.values[2][2] = sz;
        return m;
    }

    static rotationX(angleRad: number): Matrix4 {
        const m = new Matrix4();
        const c = Math.cos(angleRad);
        const s = Math.sin(angleRad);
        m.values[1][1] = c;
        m.values[1][2] = -s;
        m.values[2][1] = s;
        m.values[2][2] = c;
        return m;
    }

    static rotationY(angleRad: number): Matrix4 {
        const m = new Matrix4();
        const c = Math.cos(angleRad);
        const s = Math.sin(angleRad);
        m.values[0][0] = c;
        m.values[0][2] = s;
        m.values[2][0] = -s;
        m.values[2][2] = c;
        return m;
    }

    static rotationZ(angleRad: number): Matrix4 {
        const m = new Matrix4();
        const c = Math.cos(angleRad);
        const s = Math.sin(angleRad);
        m.values[0][0] = c;
        m.values[0][1] = -s;
        m.values[1][0] = s;
        m.values[1][1] = c;
        return m;
    }

    static perspective(fovRad: number, aspect: number, near: number, far: number): Matrix4 {
        const m = new Matrix4();
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                m.values[i][j] = 0;
            }
        }
        const f = 1.0 / Math.tan(fovRad / 2);
        m.values[0][0] = f / aspect;
        m.values[1][1] = f;
        m.values[2][2] = (far + near) / (near - far);
        m.values[2][3] = (2 * far * near) / (near - far);
        m.values[3][2] = -1; 
        return m;
    }
}
