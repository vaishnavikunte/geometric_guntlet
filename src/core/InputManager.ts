export class InputManager {
    public keys: { [key: string]: boolean } = {};
    private keyJustPressed: { [key: string]: boolean } = {};

    constructor() {
        window.addEventListener("keydown", (e) => {
            if (!this.keys[e.code]) {
                this.keyJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.code] = false;
        });
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
}
