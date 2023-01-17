import { Plugin } from './Plugin';
import ease from '../ease';
const DEFAULT_SNAP_OPTIONS = {
    topLeft: false,
    friction: 0.8,
    time: 1000,
    ease: 'easeInOutSine',
    interrupt: true,
    removeOnComplete: false,
    removeOnInterrupt: false,
    forceStart: false
};
export class Snap extends Plugin {
    constructor(parent, x, y, options = {}) {
        super(parent);
        this.options = Object.assign({}, DEFAULT_SNAP_OPTIONS, options);
        this.ease = ease(options.ease, 'easeInOutSine');
        this.x = x;
        this.y = y;
        if (this.options.forceStart) {
            this.snapStart();
        }
    }
    snapStart() {
        this.percent = 0;
        this.snapping = { time: 0 };
        const current = this.options.topLeft ? this.parent.corner : this.parent.center;
        this.deltaX = this.x - current.x;
        this.deltaY = this.y - current.y;
        this.startX = current.x;
        this.startY = current.y;
        this.parent.emit('snap-start', this.parent);
    }
    wheel() {
        if (this.options.removeOnInterrupt) {
            this.parent.plugins.remove('snap');
        }
        return false;
    }
    down() {
        if (this.options.removeOnInterrupt) {
            this.parent.plugins.remove('snap');
        }
        else if (this.options.interrupt) {
            this.snapping = null;
        }
        return false;
    }
    up() {
        if (this.parent.input.count() === 0) {
            const decelerate = this.parent.plugins.get('decelerate', true);
            if (decelerate && (decelerate.x || decelerate.y)) {
                decelerate.percentChangeX = decelerate.percentChangeY = this.options.friction;
            }
        }
        return false;
    }
    update(elapsed) {
        if (this.paused) {
            return;
        }
        if (this.options.interrupt && this.parent.input.count() !== 0) {
            return;
        }
        if (!this.snapping) {
            const current = this.options.topLeft ? this.parent.corner : this.parent.center;
            if (current.x !== this.x || current.y !== this.y) {
                this.snapStart();
            }
        }
        else {
            const snapping = this.snapping;
            snapping.time += elapsed;
            let finished;
            let x;
            let y;
            const startX = this.startX;
            const startY = this.startY;
            const deltaX = this.deltaX;
            const deltaY = this.deltaY;
            if (snapping.time > this.options.time) {
                finished = true;
                x = startX + deltaX;
                y = startY + deltaY;
            }
            else {
                const percent = this.ease(snapping.time, 0, 1, this.options.time);
                x = startX + (deltaX * percent);
                y = startY + (deltaY * percent);
            }
            if (this.options.topLeft) {
                this.parent.moveCorner(x, y);
            }
            else {
                this.parent.moveCenter(x, y);
            }
            this.parent.emit('moved', { viewport: this.parent, type: 'snap' });
            if (finished) {
                if (this.options.removeOnComplete) {
                    this.parent.plugins.remove('snap');
                }
                this.parent.emit('snap-end', this.parent);
                this.snapping = null;
            }
        }
    }
}
//# sourceMappingURL=Snap.js.map