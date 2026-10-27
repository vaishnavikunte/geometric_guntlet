import { Mesh } from "../graphics/Mesh";
import { Matrix4 } from "../math/Matrix4";
import { Renderer } from "../graphics/Renderer";

interface BuildingInstance {
    mesh: Mesh;
    x: number;
    y: number;
    z: number;
    color: string;
    matrix: Matrix4;
}

export class City {
    private buildings: BuildingInstance[] = [];
    private maxZ = 15;
    private minZ = -180;

    constructor() {
        this.generateCity();
    }

    private generateCity() {
        this.buildings = [];
        const buildingCountPerSide = 8; // Optimized from 12 for better performance
        const colors = [
            "#00d8ff", // Neon cyan
            "#7209b7", // Cyber purple
            "#f72585", // Cyber magenta
            "#4cc9f0"  // Sky teal
        ];

        // Left side buildings
        for (let i = 0; i < buildingCountPerSide; i++) {
            const z = -20 - i * 20;
            const x = -15 - (i % 3) * 3;
            const height = 18 + (i % 4) * 5;
            const width = 6;
            const depth = 6;
            const col = colors[i % colors.length];

            this.buildings.push({
                mesh: Mesh.createBuilding(width, height, depth),
                x,
                y: -1,
                z,
                color: col,
                matrix: Matrix4.translation(x, -1, z)
            });
        }

        // Right side buildings
        for (let i = 0; i < buildingCountPerSide; i++) {
            const z = -20 - i * 20;
            const x = 15 + (i % 3) * 3;
            const height = 18 + ((i + 2) % 4) * 5;
            const width = 6;
            const depth = 6;
            const col = colors[(i + 2) % colors.length];

            this.buildings.push({
                mesh: Mesh.createBuilding(width, height, depth),
                x,
                y: -1,
                z,
                color: col,
                matrix: Matrix4.translation(x, -1, z)
            });
        }
    }

    update(dt: number, speed: number) {
        // Move buildings toward camera (+Z) with smooth parallax (0.5 * speed)
        const effectiveSpeed = speed * 0.5;
        for (const b of this.buildings) {
            b.z += effectiveSpeed * dt;
            if (b.z > this.maxZ) {
                b.z = this.minZ + (b.z - this.maxZ);
            }
            // Update translation in place
            b.matrix.values[2][3] = b.z;
        }
    }

    draw(renderer: Renderer, vpMatrix: Matrix4) {
        for (const b of this.buildings) {
            renderer.drawMesh(
                b.mesh, 
                b.matrix, 
                vpMatrix, 
                b.color, 
                { lineWidth: 1 }
            );
        }
    }

    reset() {
        this.generateCity();
    }
}
