export class InputManager {
    public keys: { [key: string]: boolean } = {};
    private keyJustPressed: { [key: string]: boolean } = {};
    
    // Touch swipe handling
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private touchStartTime: number = 0;

    constructor() {
        window.addEventListener("keydown", (e) => {
            // Prevent default scrolling for game keys
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
                e.preventDefault();
            }

            if (!this.keys[e.code]) {
                this.keyJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.code] = false;
        });

        // Touch event listeners for mobile / tablet support
        window.addEventListener("touchstart", (e) => {
            if (e.touches.length > 0) {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
                this.touchStartTime = Date.now();
            }
        }, { passive: false });

        window.addEventListener("touchend", (e) => {
            if (e.changedTouches.length > 0) {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const dx = endX - this.touchStartX;
                const dy = endY - this.touchStartY;
                const dt = Date.now() - this.touchStartTime;

                if (dt < 400) {
                    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
                        // Horizontal swipe
                        if (dx > 0) this.triggerVirtualKey("ArrowRight");
                        else this.triggerVirtualKey("ArrowLeft");
                    } else if (Math.abs(dy) > 30) {
                        // Vertical swipe
                        if (dy < 0) this.triggerVirtualKey("Space");
                        else this.triggerVirtualKey("ArrowDown");
                    } else {
                        // Tap
                        this.triggerVirtualKey("Space");
                    }
                }
            }
        }, { passive: false });
    }

    public triggerVirtualKey(code: string) {
        this.keyJustPressed[code] = true;
    }

    isKeyDown(code: string): boolean {
        return !!this.keys[code];
    }

    isKeyPressed(code: string): boolean {
        if (this.keyJustPressed[code]) {
            this.keyJustPressed[code] = false;
            return true;
        }
        return false;
    }

    reset() {
        this.keyJustPressed = {};
    }
}
