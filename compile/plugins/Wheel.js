import { Plugin } from './Plugin';
const DEFAULT_WHEEL_OPTIONS = {
    percent: 0.1,
    smooth: false,
    interrupt: true,
    reverse: false,
    center: null,
    lineHeight: 20,
    axis: 'all',
    keyToPress: null,
    trackpadPinch: false,
    wheelZoom: true,
};
export class Wheel extends Plugin {
    constructor(parent, options = {}) {
        super(parent);
        this.options = Object.assign({}, DEFAULT_WHEEL_OPTIONS, options);
        this.keyIsPressed = false;
        if (this.options.keyToPress) {
            this.handleKeyPresses(this.options.keyToPress);
        }
    }
    handleKeyPresses(codes) {
        window.addEventListener('keydown', (e) => {
            if (codes.includes(e.code)) {
                this.keyIsPressed = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            if (codes.includes(e.code)) {
                this.keyIsPressed = false;
            }
        });
    }
    checkKeyPress() {
        return !this.options.keyToPress || this.keyIsPressed;
    }
    down() {
        if (this.options.interrupt) {
            this.smoothing = null;
        }
        return false;
    }
    isAxisX() {
        return ['all', 'x'].includes(this.options.axis);
    }
    isAxisY() {
        return ['all', 'y'].includes(this.options.axis);
    }
    update() {
        if (this.smoothing) {
            const point = this.smoothingCenter;
            const change = this.smoothing;
            let oldPoint;
            if (!this.options.center) {
                oldPoint = this.parent.toLocal(point);
            }
            if (this.isAxisX()) {
                this.parent.scale.x += change.x;
            }
            if (this.isAxisY()) {
                this.parent.scale.y += change.y;
            }
            this.parent.emit('zoomed', { viewport: this.parent, type: 'wheel' });
            const clamp = this.parent.plugins.get('clamp-zoom', true);
            if (clamp) {
                clamp.clamp();
            }
            if (this.options.center) {
                this.parent.moveCenter(this.options.center);
            }
            else {
                const newPoint = this.parent.toGlobal(oldPoint);
                this.parent.x += point.x - newPoint.x;
                this.parent.y += point.y - newPoint.y;
            }
            this.parent.emit('moved', { viewport: this.parent, type: 'wheel' });
            this.smoothingCount++;
            if (this.smoothingCount >= this.options.smooth) {
                this.smoothing = null;
            }
        }
    }
    pinch(e) {
        if (this.paused) {
            return;
        }
        const point = this.parent.input.getPointerPosition(e);
        const step = -e.deltaY * (e.deltaMode ? this.options.lineHeight : 1) / 200;
        const change = Math.pow(2, (1 + this.options.percent) * step);
        let oldPoint;
        if (!this.options.center) {
            oldPoint = this.parent.toLocal(point);
        }
        if (this.isAxisX()) {
            this.parent.scale.x *= change;
        }
        if (this.isAxisY()) {
            this.parent.scale.y *= change;
        }
        this.parent.emit('zoomed', { viewport: this.parent, type: 'wheel' });
        const clamp = this.parent.plugins.get('clamp-zoom', true);
        if (clamp) {
            clamp.clamp();
        }
        if (this.options.center) {
            this.parent.moveCenter(this.options.center);
        }
        else {
            const newPoint = this.parent.toGlobal(oldPoint);
            this.parent.x += point.x - newPoint.x;
            this.parent.y += point.y - newPoint.y;
        }
        this.parent.emit('moved', { viewport: this.parent, type: 'wheel' });
        this.parent.emit('wheel-start', { event: e, viewport: this.parent });
    }
    wheel(e) {
        if (this.paused) {
            return false;
        }
        if (!this.checkKeyPress()) {
            return false;
        }
        if (e.ctrlKey && this.options.trackpadPinch) {
            this.pinch(e);
        }
        else if (this.options.wheelZoom) {
            const point = this.parent.input.getPointerPosition(e);
            const sign = this.options.reverse ? -1 : 1;
            const step = sign * -e.deltaY * (e.deltaMode ? this.options.lineHeight : 1) / 500;
            const change = Math.pow(2, (1 + this.options.percent) * step);
            if (this.options.smooth) {
                const original = {
                    x: this.smoothing ? this.smoothing.x * (this.options.smooth - this.smoothingCount) : 0,
                    y: this.smoothing ? this.smoothing.y * (this.options.smooth - this.smoothingCount) : 0
                };
                this.smoothing = {
                    x: (((this.parent.scale.x + original.x) * change) - this.parent.scale.x) / this.options.smooth,
                    y: (((this.parent.scale.y + original.y) * change) - this.parent.scale.y) / this.options.smooth,
                };
                this.smoothingCount = 0;
                this.smoothingCenter = point;
            }
            else {
                let oldPoint;
                if (!this.options.center) {
                    oldPoint = this.parent.toLocal(point);
                }
                if (this.isAxisX()) {
                    this.parent.scale.x *= change;
                }
                if (this.isAxisY()) {
                    this.parent.scale.y *= change;
                }
                this.parent.emit('zoomed', { viewport: this.parent, type: 'wheel' });
                const clamp = this.parent.plugins.get('clamp-zoom', true);
                if (clamp) {
                    clamp.clamp();
                }
                if (this.options.center) {
                    this.parent.moveCenter(this.options.center);
                }
                else {
                    const newPoint = this.parent.toGlobal(oldPoint);
                    this.parent.x += point.x - newPoint.x;
                    this.parent.y += point.y - newPoint.y;
                }
            }
            this.parent.emit('moved', { viewport: this.parent, type: 'wheel' });
            this.parent.emit('wheel-start', { event: e, viewport: this.parent });
        }
        return !this.parent.options.passiveWheel;
    }
}
//# sourceMappingURL=Wheel.js.map