export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

export interface FloatingText {
    text: string;
    x: number;
    y: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    fontSize: number;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private texts: FloatingText[] = [];

    update(dt: number) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.y += t.vy * dt;
            t.life -= dt;
            if (t.life <= 0) {
                this.texts.splice(i, 1);
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        // Draw particles
        for (const p of this.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw floating text popups
        for (const t of this.texts) {
            const alpha = Math.max(0, t.life / t.maxLife);
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${t.fontSize}px 'Orbitron', monospace, sans-serif`;
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 10;
            ctx.textAlign = "center";
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.restore();
    }

    addCoinBurst(screenX: number, screenY: number) {
        // Gold sparkles
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 120;
            this.particles.push({
                x: screenX,
                y: screenY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 1.0,
                color: "#ffd700",
                size: 2 + Math.random() * 3
            });
        }
        this.addText("+100", screenX, screenY - 20, "#ffd700", 20);
    }

    addShieldBurst(screenX: number, screenY: number) {
        // Electric cyan radial shockwave
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const speed = 100 + Math.random() * 80;
            this.particles.push({
                x: screenX,
                y: screenY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.7,
                maxLife: 0.7,
                color: "#00ffff",
                size: 3 + Math.random() * 2
            });
        }
        this.addText("SHIELD DEFENSE!", screenX, screenY - 30, "#00ffff", 22);
    }

    addHitSparks(screenX: number, screenY: number) {
        // Crimson warning sparks
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 140;
            this.particles.push({
                x: screenX,
                y: screenY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.8,
                color: "#ff0055",
                size: 3 + Math.random() * 2
            });
        }
        this.addText("COLLISION!", screenX, screenY - 25, "#ff0055", 22);
    }

    addText(text: string, x: number, y: number, color: string = "#00ffff", fontSize: number = 18) {
        this.texts.push({
            text,
            x,
            y,
            vy: -40,
            life: 1.0,
            maxLife: 1.0,
            color,
            fontSize
        });
    }

    clear() {
        this.particles = [];
        this.texts = [];
    }
}
