export class Plugin {
    constructor(parent) {
        this.parent = parent;
        this.paused = false;
    }
    destroy() {
    }
    down(_e) {
        return false;
    }
    move(_e) {
        return false;
    }
    up(_e) {
        return false;
    }
    wheel(_e) {
        return false;
    }
    update(_delta) {
    }
    resize() {
    }
    reset() {
    }
    pause() {
        this.paused = true;
    }
    resume() {
        this.paused = false;
    }
}
//# sourceMappingURL=Plugin.js.map