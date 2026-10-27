import { Mesh, Face } from "../graphics/Mesh";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";

export class Road {
    public mesh: Mesh;
    private segmentLength: number = 5;
    
    constructor() {
        this.mesh = this.createRoadMesh();
    }

    createRoadMesh(): Mesh {
        const vertices: Vector3[] = [];
        const faces: Face[] = [];
        
        const roadLength = 160;
        const segmentCount = 32; 
        this.segmentLength = roadLength / segmentCount;

        for (let i = 0; i <= segmentCount; i++) {
            const z = -i * this.segmentLength; // Negative Z
            // Ground road plane
            vertices.push(new Vector3(-6.2, 0, z)); // 0: Left edge outer
            vertices.push(new Vector3(-6.0, 0, z)); // 1: Left lane border
            vertices.push(new Vector3(-2.0, 0, z)); // 2: Divider 1
            vertices.push(new Vector3( 2.0, 0, z)); // 3: Divider 2
            vertices.push(new Vector3( 6.0, 0, z)); // 4: Right lane border
            vertices.push(new Vector3( 6.2, 0, z)); // 5: Right edge outer
            // Elevated neon safety guardrails
            vertices.push(new Vector3(-6.2, 0.4, z)); // 6: Left guardrail top
            vertices.push(new Vector3( 6.2, 0.4, z)); // 7: Right guardrail top
        }

        const vPerSeg = 8;
        for (let i = 0; i < segmentCount; i++) {
            const c = i * vPerSeg;
            const n = (i + 1) * vPerSeg;

            // Longitudinal road rails and dividers
            // Left shoulder
            faces.push(new Face([c + 1, n + 1]));
            // Divider 1 (dashed style: draw alternating segments)
            if (i % 2 === 0) {
                faces.push(new Face([c + 2, n + 2]));
            }
            // Divider 2 (dashed style: draw alternating segments)
            if (i % 2 === 0) {
                faces.push(new Face([c + 3, n + 3]));
            }
            // Right shoulder
            faces.push(new Face([c + 4, n + 4]));

            // Guardrail top neon beams
            faces.push(new Face([c + 6, n + 6]));
            faces.push(new Face([c + 7, n + 7]));
            // Guardrail vertical stanchions
            faces.push(new Face([c + 0, c + 6]));
            faces.push(new Face([c + 5, c + 7]));

            // Horizontal cross grid line across all 3 lanes every 2 segments
            if (i % 2 === 0) {
                faces.push(new Face([c + 1, c + 4]));
            }
        }

        return new Mesh(vertices, faces);
    }

    getWorldMatrix(offsetZ: number): Matrix4 {
        // Move the road toward camera (+Z) modulo segment length for infinite smooth run
        return Matrix4.translation(0, -1, +(offsetZ % this.segmentLength));
    }
}
