import { Plugin } from './Plugin';
const MOUSE_EDGES_OPTIONS = {
    radius: null,
    distance: null,
    top: null,
    bottom: null,
    left: null,
    right: null,
    speed: 8,
    reverse: false,
    noDecelerate: false,
    linear: false,
    allowButtons: false,
};
export class MouseEdges extends Plugin {
    constructor(parent, options = {}) {
        super(parent);
        this.options = Object.assign({}, MOUSE_EDGES_OPTIONS, options);
        this.reverse = this.options.reverse ? 1 : -1;
        this.radiusSquared = typeof this.options.radius === 'number' ? Math.pow(this.options.radius, 2) : null;
        this.resize();
    }
    resize() {
        const distance = this.options.distance;
        if (distance !== null) {
            this.left = distance;
            this.top = distance;
            this.right = this.parent.screenWidth - distance;
            this.bottom = this.parent.screenHeight - distance;
        }
        else if (!this.options.radius) {
            this.left = this.options.left;
            this.top = this.options.top;
            this.right = this.options.right === null ? null : this.parent.screenWidth - this.options.right;
            this.bottom = this.options.bottom === null ? null : this.parent.screenHeight - this.options.bottom;
        }
    }
    down() {
        if (this.paused) {
            return false;
        }
        if (!this.options.allowButtons) {
            this.horizontal = this.vertical = null;
        }
        return false;
    }
    move(event) {
        if (this.paused) {
            return false;
        }
        if ((event.pointerType !== 'mouse' && event.pointerId !== 1)
            || (!this.options.allowButtons && event.buttons !== 0)) {
            return false;
        }
        const x = event.global.x;
        const y = event.global.y;
        if (this.radiusSquared) {
            const center = this.parent.toScreen(this.parent.center);
            const distance = Math.pow(center.x - x, 2) + Math.pow(center.y - y, 2);
            if (distance >= this.radiusSquared) {
                const angle = Math.atan2(center.y - y, center.x - x);
                if (this.options.linear) {
                    this.horizontal = Math.round(Math.cos(angle)) * this.options.speed * this.reverse * (60 / 1000);
                    this.vertical = Math.round(Math.sin(angle)) * this.options.speed * this.reverse * (60 / 1000);
                }
                else {
                    this.horizontal = Math.cos(angle) * this.options.speed * this.reverse * (60 / 1000);
                    this.vertical = Math.sin(angle) * this.options.speed * this.reverse * (60 / 1000);
                }
            }
            else {
                if (this.horizontal) {
                    this.decelerateHorizontal();
                }
                if (this.vertical) {
                    this.decelerateVertical();
                }
                this.horizontal = this.vertical = 0;
            }
        }
        else {
            if (this.left !== null && x < this.left) {
                this.horizontal = Number(this.reverse) * this.options.speed * (60 / 1000);
            }
            else if (this.right !== null && x > this.right) {
                this.horizontal = -1 * this.reverse * this.options.speed * (60 / 1000);
            }
            else {
                this.decelerateHorizontal();
                this.horizontal = 0;
            }
            if (this.top !== null && y < this.top) {
                this.vertical = Number(this.reverse) * this.options.speed * (60 / 1000);
            }
            else if (this.bottom !== null && y > this.bottom) {
                this.vertical = -1 * this.reverse * this.options.speed * (60 / 1000);
            }
            else {
                this.decelerateVertical();
                this.vertical = 0;
            }
        }
        return false;
    }
    decelerateHorizontal() {
        const decelerate = this.parent.plugins.get('decelerate', true);
        if (this.horizontal && decelerate && !this.options.noDecelerate) {
            decelerate.activate({ x: (this.horizontal * this.options.speed * this.reverse) / (1000 / 60) });
        }
    }
    decelerateVertical() {
        const decelerate = this.parent.plugins.get('decelerate', true);
        if (this.vertical && decelerate && !this.options.noDecelerate) {
            decelerate.activate({ y: (this.vertical * this.options.speed * this.reverse) / (1000 / 60) });
        }
    }
    up() {
        if (this.paused) {
            return false;
        }
        if (this.horizontal) {
            this.decelerateHorizontal();
        }
        if (this.vertical) {
            this.decelerateVertical();
        }
        this.horizontal = this.vertical = null;
        return false;
    }
    update() {
        if (this.paused) {
            return;
        }
        if (this.horizontal || this.vertical) {
            const center = this.parent.center;
            if (this.horizontal) {
                center.x += this.horizontal * this.options.speed;
            }
            if (this.vertical) {
                center.y += this.vertical * this.options.speed;
            }
            this.parent.moveCenter(center);
            this.parent.emit('moved', { viewport: this.parent, type: 'mouse-edges' });
        }
    }
}
//# sourceMappingURL=MouseEdges.js.map