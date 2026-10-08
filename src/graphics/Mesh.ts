import { Vector3 } from "../math/Vector3";

export class Face {
    indices: number[];
    constructor(indices: number[]) {
        this.indices = indices;
    }
}

export class Mesh {
    vertices: Vector3[];
    faces: Face[];

    constructor(vertices: Vector3[], faces: Face[]) {
        this.vertices = vertices;
        this.faces = faces;
    }

    static createCube(size: number = 1): Mesh {
        const s = size / 2;
        const vertices = [
            new Vector3(-s, -s,  s), 
            new Vector3( s, -s,  s), 
            new Vector3( s,  s,  s), 
            new Vector3(-s,  s,  s), 
            new Vector3(-s, -s, -s), 
            new Vector3( s, -s, -s), 
            new Vector3( s,  s, -s), 
            new Vector3(-s,  s, -s)  
        ];

        const faces = [
            new Face([0, 1, 2, 3]), 
            new Face([1, 5, 6, 2]), 
            new Face([5, 4, 7, 6]), 
            new Face([4, 0, 3, 7]), 
            new Face([3, 2, 6, 7]), 
            new Face([4, 5, 1, 0])  
        ];

        return new Mesh(vertices, faces);
    }

    static createRunner(): Mesh {
        // Simple stylized human/robot shape
        const vertices = [
            // Head
            new Vector3(0, 1.8, 0),    // 0: Head top
            new Vector3(-0.3, 1.5, 0), // 1: Head left
            new Vector3(0.3, 1.5, 0),  // 2: Head right
            new Vector3(0, 1.2, 0),    // 3: Neck
            
            // Torso
            new Vector3(-0.5, 1.0, 0), // 4: Shoulder left
            new Vector3(0.5, 1.0, 0),  // 5: Shoulder right
            new Vector3(-0.4, 0.4, 0), // 6: Hip left
            new Vector3(0.4, 0.4, 0),  // 7: Hip right
            
            // Arms
            new Vector3(-0.8, 0.5, 0.5), // 8: Hand left (running forward)
            new Vector3(0.8, 0.5, -0.5), // 9: Hand right (running backward)
            
            // Legs
            new Vector3(-0.4, -0.5, -0.5), // 10: Foot left (back)
            new Vector3(0.4, -0.5, 0.5)    // 11: Foot right (forward)
        ];

        const faces = [
            // Head diamond
            new Face([0, 1, 3, 2]),
            // Shoulders to neck
            new Face([4, 3, 5]),
            // Torso box
            new Face([4, 6, 7, 5]),
            // Left arm
            new Face([4, 8]),
            // Right arm
            new Face([5, 9]),
            // Left leg
            new Face([6, 10]),
            // Right leg
            new Face([7, 11])
        ];

        return new Mesh(vertices, faces);
    }
}
