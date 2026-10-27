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

    static createRunner(avatarId: string = "cyber-kid"): Mesh {
        if (avatarId === "cyber-shinobi") {
            return Mesh.createShinobiRunner();
        } else if (avatarId === "titan-mech") {
            return Mesh.createTitanRunner();
        } else {
            return Mesh.createKidRunner();
        }
    }

    static createKidRunner(): Mesh {
        // Articulated stylized Cyber Kid with 2-segment limbs and neon visor
        const vertices = [
            // Head (0 - 4)
            new Vector3(0, 1.85, 0),     // 0: Head crown
            new Vector3(-0.25, 1.6, 0),  // 1: Head left
            new Vector3( 0.25, 1.6, 0),  // 2: Head right
            new Vector3(0, 1.35, 0),     // 3: Chin / Neck
            new Vector3(0, 1.6, 0.22),   // 4: Visor peak

            // Torso (5 - 8)
            new Vector3(-0.45, 1.25, 0), // 5: Shoulder left
            new Vector3( 0.45, 1.25, 0), // 6: Shoulder right
            new Vector3(-0.30, 0.65, 0), // 7: Hip left
            new Vector3( 0.30, 0.65, 0), // 8: Hip right

            // Left Arm (9 - 10)
            new Vector3(-0.65, 0.95, -0.1), // 9: Left Elbow
            new Vector3(-0.75, 0.60,  0.2), // 10: Left Hand

            // Right Arm (11 - 12)
            new Vector3(0.65, 0.95, 0.1),  // 11: Right Elbow
            new Vector3(0.75, 0.60, -0.2), // 12: Right Hand

            // Left Leg (13 - 14)
            new Vector3(-0.32, 0.20, -0.2), // 13: Left Knee
            new Vector3(-0.35, -0.35, -0.3),// 14: Left Foot

            // Right Leg (15 - 16)
            new Vector3(0.32, 0.20, 0.2),  // 15: Right Knee
            new Vector3(0.35, -0.35, 0.3), // 16: Right Foot

            // Chest Core (17)
            new Vector3(0, 0.95, 0.12)     // 17: Core reactor
        ];

        const faces = [
            // Visor & Head Diamond
            new Face([0, 1, 3, 2]),
            new Face([1, 4, 2]),
            new Face([0, 4, 3]),

            // Neck & Torso
            new Face([3, 5]),
            new Face([3, 6]),
            new Face([5, 6, 8, 7]),
            new Face([5, 17, 8]),
            new Face([6, 17, 7]),

            // Articulated Left Arm (Shoulder -> Elbow -> Hand)
            new Face([5, 9]),
            new Face([9, 10]),

            // Articulated Right Arm (Shoulder -> Elbow -> Hand)
            new Face([6, 11]),
            new Face([11, 12]),

            // Articulated Left Leg (Hip -> Knee -> Foot)
            new Face([7, 13]),
            new Face([13, 14]),

            // Articulated Right Leg (Hip -> Knee -> Foot)
            new Face([8, 15]),
            new Face([15, 16])
        ];

        return new Mesh(vertices, faces);
    }

    static createShinobiRunner(): Mesh {
        // Sleek Cyber Shinobi with angled mask and trailing cyber-scarf
        const vertices = [
            // Head & Mask (0 - 4)
            new Vector3(0, 1.88, 0),
            new Vector3(-0.28, 1.62, 0),
            new Vector3( 0.28, 1.62, 0),
            new Vector3(0, 1.35, 0.05),
            new Vector3(0, 1.65, 0.25), // Sharp visor

            // Torso (5 - 8)
            new Vector3(-0.48, 1.25, 0),
            new Vector3( 0.48, 1.25, 0),
            new Vector3(-0.28, 0.65, 0),
            new Vector3( 0.28, 0.65, 0),

            // Left Arm (9 - 10)
            new Vector3(-0.70, 0.95, 0),
            new Vector3(-0.80, 0.60, 0),

            // Right Arm (11 - 12)
            new Vector3(0.70, 0.95, 0),
            new Vector3(0.80, 0.60, 0),

            // Left Leg (13 - 14)
            new Vector3(-0.30, 0.20, 0),
            new Vector3(-0.35, -0.35, 0),

            // Right Leg (15 - 16)
            new Vector3(0.30, 0.20, 0),
            new Vector3(0.35, -0.35, 0),

            // Shinobi Trailing Cyber Scarf (17 - 19)
            new Vector3(0, 1.35, -0.15),
            new Vector3(-0.15, 1.20, -0.55),
            new Vector3(-0.25, 1.05, -0.95)
        ];

        const faces = [
            new Face([0, 1, 3, 2]),
            new Face([1, 4, 2]),
            new Face([5, 6, 8, 7]),
            new Face([5, 9]),
            new Face([9, 10]),
            new Face([6, 11]),
            new Face([11, 12]),
            new Face([7, 13]),
            new Face([13, 14]),
            new Face([8, 15]),
            new Face([15, 16]),
            // Scarf trail
            new Face([3, 17]),
            new Face([17, 18]),
            new Face([18, 19])
        ];

        return new Mesh(vertices, faces);
    }

    static createTitanRunner(): Mesh {
        // Armored Vanguard Exoskeleton Mech with heavy pauldrons
        const vertices = [
            // Armored Helmet (0 - 4)
            new Vector3(0, 1.90, 0),
            new Vector3(-0.35, 1.65, 0),
            new Vector3( 0.35, 1.65, 0),
            new Vector3(0, 1.40, 0),
            new Vector3(0, 1.65, 0.28), // Heavy horizontal visor slit

            // Heavy Torso (5 - 8)
            new Vector3(-0.60, 1.30, 0), // Broad shoulders
            new Vector3( 0.60, 1.30, 0),
            new Vector3(-0.38, 0.65, 0),
            new Vector3( 0.38, 0.65, 0),

            // Left Arm (9 - 10)
            new Vector3(-0.80, 0.95, 0),
            new Vector3(-0.90, 0.58, 0),

            // Right Arm (11 - 12)
            new Vector3(0.80, 0.95, 0),
            new Vector3(0.90, 0.58, 0),

            // Left Leg (13 - 14)
            new Vector3(-0.40, 0.20, 0),
            new Vector3(-0.45, -0.35, 0),

            // Right Leg (15 - 16)
            new Vector3(0.40, 0.20, 0),
            new Vector3(0.45, -0.35, 0),

            // Pauldrons (17 - 18)
            new Vector3(-0.75, 1.45, 0),
            new Vector3( 0.75, 1.45, 0),

            // Power Core (19)
            new Vector3(0, 1.0, 0.2)
        ];

        const faces = [
            new Face([0, 1, 3, 2]),
            new Face([1, 4, 2]),
            new Face([5, 6, 8, 7]),
            new Face([5, 17, 6, 18]), // Heavy armor collar
            new Face([5, 9]),
            new Face([9, 10]),
            new Face([6, 11]),
            new Face([11, 12]),
            new Face([7, 13]),
            new Face([13, 14]),
            new Face([8, 15]),
            new Face([15, 16]),
            new Face([5, 19, 8]),
            new Face([6, 19, 7])
        ];

        return new Mesh(vertices, faces);
    }

    static createCrate(size: number = 2): Mesh {
        const s = size / 2;
        const vertices = [
            // Base cube 8 vertices
            new Vector3(-s, -s,  s), 
            new Vector3( s, -s,  s), 
            new Vector3( s,  s,  s), 
            new Vector3(-s,  s,  s), 
            new Vector3(-s, -s, -s), 
            new Vector3( s, -s, -s), 
            new Vector3( s,  s, -s), 
            new Vector3(-s,  s, -s),
            // Inner cyber core diamond
            new Vector3(0, 0,  s),
            new Vector3(0, 0, -s)
        ];

        const faces = [
            // Outer cube 6 faces
            new Face([0, 1, 2, 3]), 
            new Face([1, 5, 6, 2]), 
            new Face([5, 4, 7, 6]), 
            new Face([4, 0, 3, 7]), 
            new Face([3, 2, 6, 7]), 
            new Face([4, 5, 1, 0]),
            // Front & Back diagonal cross reinforcement struts (Cyber X pattern)
            new Face([0, 2]),
            new Face([1, 3]),
            new Face([4, 6]),
            new Face([5, 7])
        ];

        return new Mesh(vertices, faces);
    }

    static createBarrier(width: number = 2.8, height: number = 0.9): Mesh {
        const w = width / 2;
        const h = height;
        const vertices = [
            // Left leg
            new Vector3(-w, 0, -0.3),
            new Vector3(-w, 0,  0.3),
            new Vector3(-w, h, 0),
            // Right leg
            new Vector3( w, 0, -0.3),
            new Vector3( w, 0,  0.3),
            new Vector3( w, h, 0),
            // Top cross beam
            new Vector3(-w, h * 0.8, -0.15),
            new Vector3( w, h * 0.8, -0.15),
            new Vector3( w, h, -0.15),
            new Vector3(-w, h, -0.15),
            new Vector3(-w, h * 0.8, 0.15),
            new Vector3( w, h * 0.8, 0.15),
            new Vector3( w, h, 0.15),
            new Vector3(-w, h, 0.15)
        ];

        const faces = [
            // Left support A-frame
            new Face([0, 2, 1]),
            // Right support A-frame
            new Face([3, 5, 4]),
            // Main horizontal hurdle beam (front, back, top)
            new Face([6, 7, 8, 9]),
            new Face([10, 11, 12, 13]),
            new Face([9, 8, 12, 13]),
            // Warning stripe diagonal
            new Face([6, 12]),
            new Face([7, 13])
        ];

        return new Mesh(vertices, faces);
    }

    static createLaserGate(width: number = 3.2, height: number = 2.4): Mesh {
        const w = width / 2;
        const h = height;
        const beamY = h * 0.85; // High overhead beam at height ~2.0
        const vertices = [
            // Left vertical column
            new Vector3(-w, 0, 0),
            new Vector3(-w, h, 0),
            new Vector3(-w * 0.85, h, 0),
            // Right vertical column
            new Vector3( w, 0, 0),
            new Vector3( w, h, 0),
            new Vector3( w * 0.85, h, 0),
            // Overhead horizontal laser emitter rail
            new Vector3(-w, beamY + 0.25, 0),
            new Vector3( w, beamY + 0.25, 0),
            new Vector3( w, beamY - 0.25, 0),
            new Vector3(-w, beamY - 0.25, 0),
            // Inner pulsating laser beam center lines
            new Vector3(-w * 0.9, beamY, 0),
            new Vector3( w * 0.9, beamY, 0)
        ];

        const faces = [
            // Left post
            new Face([0, 1]),
            new Face([1, 2]),
            // Right post
            new Face([3, 4]),
            new Face([4, 5]),
            // Overhead housing box
            new Face([6, 7, 8, 9]),
            // Glowing laser beam
            new Face([10, 11])
        ];

        return new Mesh(vertices, faces);
    }

    static createCoin(radius: number = 0.5, thickness: number = 0.15): Mesh {
        const segments = 8; // Octagonal cylinder
        const vertices: Vector3[] = [];
        const faces: Face[] = [];
        const halfThick = thickness / 2;

        // Front circle vertices (z = +halfThick)
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, halfThick));
        }
        // Back circle vertices (z = -halfThick)
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, -halfThick));
        }
        // Center hubs for radial spokes
        vertices.push(new Vector3(0, 0, halfThick));  // 16
        vertices.push(new Vector3(0, 0, -halfThick)); // 17

        // Front perimeter ring
        const frontIndices = [];
        for (let i = 0; i < segments; i++) frontIndices.push(i);
        faces.push(new Face(frontIndices));

        // Back perimeter ring
        const backIndices = [];
        for (let i = 0; i < segments; i++) backIndices.push(segments + i);
        faces.push(new Face(backIndices));

        // Side connecting ribs
        for (let i = 0; i < segments; i++) {
            const next = (i + 1) % segments;
            faces.push(new Face([i, segments + i, segments + next, next]));
            // Inner spokes to center
            if (i % 2 === 0) {
                faces.push(new Face([16, i]));
            }
        }

        return new Mesh(vertices, faces);
    }

    static createShield(size: number = 0.7): Mesh {
        // Regular 3D Octahedron (Diamond / Crystal shield)
        const s = size;
        const vertices = [
            new Vector3( 0,  s,  0), // 0: Top apex
            new Vector3( 0, -s,  0), // 1: Bottom apex
            new Vector3(-s,  0,  0), // 2: Left
            new Vector3( s,  0,  0), // 3: Right
            new Vector3( 0,  0,  s), // 4: Front
            new Vector3( 0,  0, -s)  // 5: Back
        ];

        const faces = [
            // Top pyramid 4 triangular faces
            new Face([0, 4, 3]),
            new Face([0, 3, 5]),
            new Face([0, 5, 2]),
            new Face([0, 2, 4]),
            // Bottom pyramid 4 triangular faces
            new Face([1, 3, 4]),
            new Face([1, 5, 3]),
            new Face([1, 2, 5]),
            new Face([1, 4, 2]),
            // Equator belt
            new Face([4, 3, 5, 2])
        ];

        return new Mesh(vertices, faces);
    }

    static createBuilding(width: number = 6, height: number = 24, depth: number = 6): Mesh {
        const w = width / 2;
        const d = depth / 2;
        const h = height;

        const vertices: Vector3[] = [
            // Base ring
            new Vector3(-w, 0,  d),
            new Vector3( w, 0,  d),
            new Vector3( w, 0, -d),
            new Vector3(-w, 0, -d),
            // Mid ring 1
            new Vector3(-w, h * 0.35,  d),
            new Vector3( w, h * 0.35,  d),
            new Vector3( w, h * 0.35, -d),
            new Vector3(-w, h * 0.35, -d),
            // Mid ring 2
            new Vector3(-w * 0.85, h * 0.7,  d * 0.85),
            new Vector3( w * 0.85, h * 0.7,  d * 0.85),
            new Vector3( w * 0.85, h * 0.7, -d * 0.85),
            new Vector3(-w * 0.85, h * 0.7, -d * 0.85),
            // Roof ring
            new Vector3(-w * 0.7, h,  d * 0.7),
            new Vector3( w * 0.7, h,  d * 0.7),
            new Vector3( w * 0.7, h, -d * 0.7),
            new Vector3(-w * 0.7, h, -d * 0.7),
            // Rooftop antenna spire
            new Vector3(0, h + 5, 0)
        ];

        const faces: Face[] = [
            // Vertical corner columns
            new Face([0, 4, 8, 12]),
            new Face([1, 5, 9, 13]),
            new Face([2, 6, 10, 14]),
            new Face([3, 7, 11, 15]),
            // Horizontal neon floor band rings
            new Face([0, 1, 2, 3]),
            new Face([4, 5, 6, 7]),
            new Face([8, 9, 10, 11]),
            new Face([12, 13, 14, 15]),
            // Rooftop antenna spire lines
            new Face([12, 16]),
            new Face([13, 16]),
            new Face([14, 16]),
            new Face([15, 16])
        ];

        return new Mesh(vertices, faces);
    }
}
