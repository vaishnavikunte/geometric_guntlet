import { Mesh, Face } from "../graphics/Mesh";
import { Matrix4 } from "../math/Matrix4";
import { Vector3 } from "../math/Vector3";

export class Road {
    public mesh: Mesh;
    
    constructor() {
        this.mesh = this.createRoadMesh();
    }

    createRoadMesh(): Mesh {
        const vertices: Vector3[] = [];
        const faces: Face[] = [];
        
        const roadLength = 200;
        const segmentCount = 40; 
        const segmentLength = roadLength / segmentCount;

        for (let i = 0; i <= segmentCount; i++) {
            const z = -i * segmentLength; // Negative Z
            vertices.push(new Vector3(-6, 0, z)); // left
            vertices.push(new Vector3(-2, 0, z)); // divider 1
            vertices.push(new Vector3(2, 0, z));  // divider 2
            vertices.push(new Vector3(6, 0, z));  // right
        }

        for (let i = 0; i <= segmentCount; i++) {
            const offset = i * 4;
            faces.push(new Face([offset, offset + 3])); 
        }

        for (let i = 0; i < segmentCount; i++) {
            const currentOffset = i * 4;
            const nextOffset = (i + 1) * 4;
            faces.push(new Face([currentOffset, nextOffset]));         
            faces.push(new Face([currentOffset + 1, nextOffset + 1])); 
            faces.push(new Face([currentOffset + 2, nextOffset + 2])); 
            faces.push(new Face([currentOffset + 3, nextOffset + 3])); 
        }

        return new Mesh(vertices, faces);
    }

    getWorldMatrix(offsetZ: number): Matrix4 {
        // Move the road toward the camera (+Z) to simulate forward motion
        return Matrix4.translation(0, -1, +(offsetZ % (200 / 40)));
    }
}
