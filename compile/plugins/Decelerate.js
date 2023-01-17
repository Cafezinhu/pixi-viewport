import { Plugin } from './Plugin';
const DEFAULT_DECELERATE_OPTIONS = {
    friction: 0.98,
    bounce: 0.8,
    minSpeed: 0.01
};
const TP = 16;
export class Decelerate extends Plugin {
    constructor(parent, options = {}) {
        super(parent);
        this.options = Object.assign({}, DEFAULT_DECELERATE_OPTIONS, options);
        this.saved = [];
        this.timeSinceRelease = 0;
        this.reset();
        this.parent.on('moved', (data) => this.handleMoved(data));
    }
    down() {
        this.saved = [];
        this.x = this.y = null;
        return false;
    }
    isActive() {
        return !!(this.x || this.y);
    }
    move() {
        if (this.paused) {
            return false;
        }
        const count = this.parent.input.count();
        if (count === 1 || (count > 1 && !this.parent.plugins.get('pinch', true))) {
            this.saved.push({ x: this.parent.x, y: this.parent.y, time: performance.now() });
            if (this.saved.length > 60) {
                this.saved.splice(0, 30);
            }
        }
        return false;
    }
    handleMoved(e) {
        if (this.saved.length) {
            const last = this.saved[this.saved.length - 1];
            if (e.type === 'clamp-x' && e.original) {
                if (last.x === e.original.x) {
                    last.x = this.parent.x;
                }
            }
            else if (e.type === 'clamp-y' && e.original) {
                if (last.y === e.original.y) {
                    last.y = this.parent.y;
                }
            }
        }
    }
    up() {
        if (this.parent.input.count() === 0 && this.saved.length) {
            const now = performance.now();
            for (const save of this.saved) {
                if (save.time >= now - 100) {
                    const time = now - save.time;
                    this.x = (this.parent.x - save.x) / time;
                    this.y = (this.parent.y - save.y) / time;
                    this.percentChangeX = this.percentChangeY = this.options.friction;
                    this.timeSinceRelease = 0;
                    break;
                }
            }
        }
        return false;
    }
    activate(options) {
        options = options || {};
        if (typeof options.x !== 'undefined') {
            this.x = options.x;
            this.percentChangeX = this.options.friction;
        }
        if (typeof options.y !== 'undefined') {
            this.y = options.y;
            this.percentChangeY = this.options.friction;
        }
    }
    update(elapsed) {
        if (this.paused) {
            return;
        }
        const moved = this.x || this.y;
        const ti = this.timeSinceRelease;
        const tf = this.timeSinceRelease + elapsed;
        if (this.x) {
            const k = this.percentChangeX;
            const lnk = Math.log(k);
            this.parent.x += ((this.x * TP) / lnk) * (Math.pow(k, tf / TP) - Math.pow(k, ti / TP));
            this.x *= Math.pow(this.percentChangeX, elapsed / TP);
        }
        if (this.y) {
            const k = this.percentChangeY;
            const lnk = Math.log(k);
            this.parent.y += ((this.y * TP) / lnk) * (Math.pow(k, tf / TP) - Math.pow(k, ti / TP));
            this.y *= Math.pow(this.percentChangeY, elapsed / TP);
        }
        this.timeSinceRelease += elapsed;
        if (this.x && this.y) {
            if (Math.abs(this.x) < this.options.minSpeed && Math.abs(this.y) < this.options.minSpeed) {
                this.x = 0;
                this.y = 0;
            }
        }
        else {
            if (Math.abs(this.x || 0) < this.options.minSpeed) {
                this.x = 0;
            }
            if (Math.abs(this.y || 0) < this.options.minSpeed) {
                this.y = 0;
            }
        }
        if (moved) {
            this.parent.emit('moved', { viewport: this.parent, type: 'decelerate' });
        }
    }
    reset() {
        this.x = this.y = null;
    }
}
//# sourceMappingURL=Decelerate.js.map