import { AVATARS, saveAvatarId, getSavedAvatarId } from "../gameplay/AvatarData";
import { Renderer } from "../graphics/Renderer";
import { Matrix4 } from "../math/Matrix4";
import { Mesh } from "../graphics/Mesh";

export class AvatarSelectModal {
    private modalEl: HTMLElement;
    public selectedAvatarId: string;
    private onConfirmCallback: (avatarId: string) => void = () => {};
    
    // Preview canvas renderer
    private previewCanvas: HTMLCanvasElement | null = null;
    private previewRenderer: Renderer | null = null;
    private previewAnimFrame: number = 0;
    private previewRotation: number = 0;
    private previewMesh: Mesh | null = null;
    private previewVP: Matrix4 = new Matrix4();
    private previewSprite: HTMLImageElement | null = null;

    constructor() {
        this.selectedAvatarId = getSavedAvatarId();
        this.modalEl = document.createElement("div");
        this.modalEl.id = "avatar-select-modal";
        this.modalEl.className = "avatar-modal hidden";
        document.body.appendChild(this.modalEl);
    }

    public open(onConfirm: (avatarId: string) => void) {
        this.onConfirmCallback = onConfirm;
        this.selectedAvatarId = getSavedAvatarId();
        this.modalEl.classList.remove("hidden");
        this.render();
        this.startPreviewLoop();
    }

    public close() {
        this.stopPreviewLoop();
        this.modalEl.classList.add("hidden");
    }

    private selectAvatar(id: string) {
        this.selectedAvatarId = id;
        saveAvatarId(id);
        this.updateCardSelection();
        this.setupPreviewForCurrentAvatar();
    }

    private render() {
        this.modalEl.innerHTML = `
            <div class="avatar-modal-backdrop"></div>
            <div class="avatar-modal-content">
                <div class="avatar-modal-header">
                    <div class="header-titles">
                        <h2>CHOOSE YOUR AVATAR</h2>
                        <span class="sub">Select Your Cyberpunk Operative</span>
                    </div>
                    <button class="avatar-close-btn" id="avatar-close-btn">&times;</button>
                </div>

                <div class="avatar-modal-body">
                    <!-- Left: 3D Live Rotating Preview -->
                    <div class="avatar-preview-pane">
                        <div class="preview-canvas-box">
                            <canvas id="avatar-preview-canvas" width="280" height="280"></canvas>
                        </div>
                        <div class="preview-info" id="preview-avatar-info"></div>
                    </div>

                    <!-- Right: Avatar Selection Grid -->
                    <div class="avatar-cards-pane">
                        <div class="avatar-grid">
                            ${AVATARS.map(avatar => `
                                <div class="avatar-card ${avatar.id === this.selectedAvatarId ? 'active' : ''}" data-avatar-id="${avatar.id}">
                                    <div class="card-badge" style="color: ${avatar.primaryColor}; border-color: ${avatar.primaryColor};">
                                        ${avatar.type === 'sprite' ? 'SPRITE' : '3D CYBER'}
                                    </div>
                                    <h3 style="color: ${avatar.primaryColor}">${avatar.name}</h3>
                                    <span class="card-title">${avatar.title}</span>
                                    <p class="card-desc">${avatar.description}</p>
                                    <div class="card-stats">
                                        <span>AGILITY: <strong>${avatar.stats.agility}</strong></span>
                                        <span>STYLE: <strong>${avatar.stats.style}</strong></span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="avatar-modal-footer">
                    <button class="cyber-btn" id="avatar-cancel-btn">CANCEL</button>
                    <button class="cyber-btn primary-btn" id="avatar-confirm-btn">CONFIRM & RUN</button>
                </div>
            </div>
        `;

        this.bindEvents();
        this.initPreviewCanvas();
        this.setupPreviewForCurrentAvatar();
    }

    private bindEvents() {
        this.modalEl.querySelector("#avatar-close-btn")?.addEventListener("click", () => this.close());
        this.modalEl.querySelector("#avatar-cancel-btn")?.addEventListener("click", () => this.close());
        this.modalEl.querySelector(".avatar-modal-backdrop")?.addEventListener("click", () => this.close());

        this.modalEl.querySelector("#avatar-confirm-btn")?.addEventListener("click", () => {
            this.close();
            this.onConfirmCallback(this.selectedAvatarId);
        });

        this.modalEl.querySelectorAll(".avatar-card").forEach(card => {
            card.addEventListener("click", (e) => {
                const id = (e.currentTarget as HTMLElement).getAttribute("data-avatar-id");
                if (id) {
                    this.selectAvatar(id);
                }
            });
        });
    }

    private updateCardSelection() {
        this.modalEl.querySelectorAll(".avatar-card").forEach(card => {
            const id = card.getAttribute("data-avatar-id");
            if (id === this.selectedAvatarId) {
                card.classList.add("active");
            } else {
                card.classList.remove("active");
            }
        });
    }

    private initPreviewCanvas() {
        this.previewCanvas = document.getElementById("avatar-preview-canvas") as HTMLCanvasElement;
        if (!this.previewCanvas) return;
        this.previewRenderer = new Renderer(this.previewCanvas);

        const aspect = this.previewCanvas.width / this.previewCanvas.height;
        const proj = Matrix4.perspective(Math.PI / 3.2, aspect, 0.1, 50);
        const view = Matrix4.translation(0, -1.0, 0);
        this.previewVP = proj.multiply(view);
    }

    private setupPreviewForCurrentAvatar() {
        const avatar = AVATARS.find(a => a.id === this.selectedAvatarId) || AVATARS[0];
        
        // Update Info text
        const infoEl = document.getElementById("preview-avatar-info");
        if (infoEl) {
            infoEl.innerHTML = `
                <h3 style="color: ${avatar.primaryColor}">${avatar.name}</h3>
                <span class="sub-label">${avatar.title}</span>
            `;
        }

        if (avatar.type === "sprite" && avatar.spriteSrc) {
            this.previewMesh = null;
            this.previewSprite = new Image();
            this.previewSprite.src = avatar.spriteSrc;
        } else {
            this.previewSprite = null;
            this.previewMesh = Mesh.createRunner(avatar.id);
        }
    }

    private startPreviewLoop() {
        this.stopPreviewLoop();
        let lastT = performance.now();

        const loop = (t: number) => {
            const dt = (t - lastT) / 1000.0;
            lastT = t;

            this.previewRotation += dt * 1.5; // Smooth rotation speed

            if (this.previewRenderer) {
                this.previewRenderer.clear();

                const avatar = AVATARS.find(a => a.id === this.selectedAvatarId) || AVATARS[0];
                if (this.previewSprite && avatar.type === "sprite") {
                    this.previewRenderer.drawBillboard(
                        this.previewSprite,
                        0, 0, -3.8,
                        2.2, 2.4,
                        this.previewVP
                    );
                } else if (this.previewMesh) {
                    const world = Matrix4.translation(0, 0, -3.8)
                        .multiply(Matrix4.rotationY(this.previewRotation));

                    this.previewRenderer.drawMesh(
                        this.previewMesh,
                        world,
                        this.previewVP,
                        avatar.primaryColor,
                        { lineWidth: 2 }
                    );
                }
            }

            this.previewAnimFrame = requestAnimationFrame(loop);
        };

        this.previewAnimFrame = requestAnimationFrame(loop);
    }

    private stopPreviewLoop() {
        if (this.previewAnimFrame) {
            cancelAnimationFrame(this.previewAnimFrame);
            this.previewAnimFrame = 0;
        }
    }
}
