import { Plugin } from './Plugin';
import { Point } from '@pixi/core';
const DEFAULT_PINCH_OPTIONS = {
    noDrag: false,
    percent: 1,
    center: null,
    factor: 1,
    axis: 'all',
};
export class Pinch extends Plugin {
    constructor(parent, options = {}) {
        super(parent);
        this.active = false;
        this.pinching = false;
        this.moved = false;
        this.options = Object.assign({}, DEFAULT_PINCH_OPTIONS, options);
    }
    down() {
        if (this.parent.input.count() >= 2) {
            this.active = true;
            return true;
        }
        return false;
    }
    isAxisX() {
        return ['all', 'x'].includes(this.options.axis);
    }
    isAxisY() {
        return ['all', 'y'].includes(this.options.axis);
    }
    move(e) {
        if (this.paused || !this.active) {
            return false;
        }
        const x = e.global.x;
        const y = e.global.y;
        const pointers = this.parent.input.touches;
        if (pointers.length >= 2) {
            const first = pointers[0];
            const second = pointers[1];
            const last = (first.last && second.last)
                ? Math.sqrt(Math.pow(second.last.x - first.last.x, 2) + Math.pow(second.last.y - first.last.y, 2))
                : null;
            if (first.id === e.pointerId) {
                first.last = { x, y, data: e };
            }
            else if (second.id === e.pointerId) {
                second.last = { x, y, data: e };
            }
            if (last) {
                let oldPoint;
                const point = new Point(first.last.x + ((second.last.x - first.last.x) / 2), first.last.y + ((second.last.y - first.last.y) / 2));
                if (!this.options.center) {
                    oldPoint = this.parent.toLocal(point);
                }
                let dist = Math.sqrt(Math.pow(second.last.x - first.last.x, 2)
                    + Math.pow(second.last.y - first.last.y, 2));
                dist = dist === 0 ? dist = 0.0000000001 : dist;
                const change = (1 - (last / dist)) * this.options.percent
                    * (this.isAxisX() ? this.parent.scale.x : this.parent.scale.y);
                if (this.isAxisX()) {
                    this.parent.scale.x += change;
                }
                if (this.isAxisY()) {
                    this.parent.scale.y += change;
                }
                this.parent.emit('zoomed', { viewport: this.parent, type: 'pinch', center: point });
                const clamp = this.parent.plugins.get('clamp-zoom', true);
                if (clamp) {
                    clamp.clamp();
                }
                if (this.options.center) {
                    this.parent.moveCenter(this.options.center);
                }
                else {
                    const newPoint = this.parent.toGlobal(oldPoint);
                    this.parent.x += (point.x - newPoint.x) * this.options.factor;
                    this.parent.y += (point.y - newPoint.y) * this.options.factor;
                    this.parent.emit('moved', { viewport: this.parent, type: 'pinch' });
                }
                if (!this.options.noDrag && this.lastCenter) {
                    this.parent.x += (point.x - this.lastCenter.x) * this.options.factor;
                    this.parent.y += (point.y - this.lastCenter.y) * this.options.factor;
                    this.parent.emit('moved', { viewport: this.parent, type: 'pinch' });
                }
                this.lastCenter = point;
                this.moved = true;
            }
            else if (!this.pinching) {
                this.parent.emit('pinch-start', this.parent);
                this.pinching = true;
            }
            return true;
        }
        return false;
    }
    up() {
        if (this.pinching) {
            if (this.parent.input.touches.length <= 1) {
                this.active = false;
                this.lastCenter = null;
                this.pinching = false;
                this.moved = false;
                this.parent.emit('pinch-end', this.parent);
                return true;
            }
        }
        return false;
    }
}
//# sourceMappingURL=Pinch.js.map