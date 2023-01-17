import { Plugin } from './Plugin';
import ease from '../ease';
const DEFAULT_SNAP_ZOOM_OPTIONS = {
    width: 0,
    height: 0,
    time: 1000,
    ease: 'easeInOutSine',
    center: null,
    interrupt: true,
    removeOnComplete: false,
    removeOnInterrupt: false,
    forceStart: false,
    noMove: false
};
export class SnapZoom extends Plugin {
    constructor(parent, options = {}) {
        super(parent);
        this.options = Object.assign({}, DEFAULT_SNAP_ZOOM_OPTIONS, options);
        this.ease = ease(this.options.ease);
        this.xIndependent = false;
        this.yIndependent = false;
        this.xScale = 0;
        this.yScale = 0;
        if (this.options.width > 0) {
            this.xScale = parent.screenWidth / this.options.width;
            this.xIndependent = true;
        }
        if (this.options.height > 0) {
            this.yScale = parent.screenHeight / this.options.height;
            this.yIndependent = true;
        }
        this.xScale = this.xIndependent ? this.xScale : this.yScale;
        this.yScale = this.yIndependent ? this.yScale : this.xScale;
        if (this.options.time === 0) {
            parent.container.scale.x = this.xScale;
            parent.container.scale.y = this.yScale;
            if (this.options.removeOnComplete) {
                this.parent.plugins.remove('snap-zoom');
            }
        }
        else if (options.forceStart) {
            this.createSnapping();
        }
    }
    createSnapping() {
        const startWorldScreenWidth = this.parent.worldScreenWidth;
        const startWorldScreenHeight = this.parent.worldScreenHeight;
        const endWorldScreenWidth = this.parent.screenWidth / this.xScale;
        const endWorldScreenHeight = this.parent.screenHeight / this.yScale;
        this.snapping = {
            time: 0,
            startX: startWorldScreenWidth,
            startY: startWorldScreenHeight,
            deltaX: endWorldScreenWidth - startWorldScreenWidth,
            deltaY: endWorldScreenHeight - startWorldScreenHeight
        };
        this.parent.emit('snap-zoom-start', this.parent);
    }
    resize() {
        this.snapping = null;
        if (this.options.width > 0) {
            this.xScale = this.parent.screenWidth / this.options.width;
        }
        if (this.options.height > 0) {
            this.yScale = this.parent.screenHeight / this.options.height;
        }
        this.xScale = this.xIndependent ? this.xScale : this.yScale;
        this.yScale = this.yIndependent ? this.yScale : this.xScale;
    }
    wheel() {
        if (this.options.removeOnInterrupt) {
            this.parent.plugins.remove('snap-zoom');
        }
        return false;
    }
    down() {
        if (this.options.removeOnInterrupt) {
            this.parent.plugins.remove('snap-zoom');
        }
        else if (this.options.interrupt) {
            this.snapping = null;
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
        let oldCenter;
        if (!this.options.center && !this.options.noMove) {
            oldCenter = this.parent.center;
        }
        if (!this.snapping) {
            if (this.parent.scale.x !== this.xScale || this.parent.scale.y !== this.yScale) {
                this.createSnapping();
            }
        }
        else if (this.snapping) {
            const snapping = this.snapping;
            snapping.time += elapsed;
            if (snapping.time >= this.options.time) {
                this.parent.scale.set(this.xScale, this.yScale);
                if (this.options.removeOnComplete) {
                    this.parent.plugins.remove('snap-zoom');
                }
                this.parent.emit('snap-zoom-end', this.parent);
                this.snapping = null;
            }
            else {
                const snapping = this.snapping;
                const worldScreenWidth = this.ease(snapping.time, snapping.startX, snapping.deltaX, this.options.time);
                const worldScreenHeight = this.ease(snapping.time, snapping.startY, snapping.deltaY, this.options.time);
                this.parent.scale.x = this.parent.screenWidth / worldScreenWidth;
                this.parent.scale.y = this.parent.screenHeight / worldScreenHeight;
            }
            const clamp = this.parent.plugins.get('clamp-zoom', true);
            if (clamp) {
                clamp.clamp();
            }
            if (!this.options.noMove) {
                if (!this.options.center) {
                    this.parent.moveCenter(oldCenter);
                }
                else {
                    this.parent.moveCenter(this.options.center);
                }
            }
        }
    }
    resume() {
        this.snapping = null;
        super.resume();
    }
}
//# sourceMappingURL=SnapZoom.js.map