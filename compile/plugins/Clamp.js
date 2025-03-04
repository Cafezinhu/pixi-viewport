import { Point } from '@pixi/core';
import { Plugin } from './Plugin';
const DEFAULT_CLAMP_OPTIONS = {
    left: false,
    right: false,
    top: false,
    bottom: false,
    direction: null,
    underflow: 'center'
};
export class Clamp extends Plugin {
    constructor(parent, options = {}) {
        super(parent);
        this.options = Object.assign({}, DEFAULT_CLAMP_OPTIONS, options);
        if (this.options.direction) {
            this.options.left = this.options.direction === 'x' || this.options.direction === 'all' ? true : null;
            this.options.right = this.options.direction === 'x' || this.options.direction === 'all' ? true : null;
            this.options.top = this.options.direction === 'y' || this.options.direction === 'all' ? true : null;
            this.options.bottom = this.options.direction === 'y' || this.options.direction === 'all' ? true : null;
        }
        this.parseUnderflow();
        this.last = { x: null, y: null, scaleX: null, scaleY: null };
        this.update();
    }
    parseUnderflow() {
        const clamp = this.options.underflow.toLowerCase();
        if (clamp === 'none') {
            this.noUnderflow = true;
        }
        else if (clamp === 'center') {
            this.underflowX = this.underflowY = 0;
            this.noUnderflow = false;
        }
        else {
            this.underflowX = (clamp.indexOf('left') !== -1) ? -1 : (clamp.indexOf('right') !== -1) ? 1 : 0;
            this.underflowY = (clamp.indexOf('top') !== -1) ? -1 : (clamp.indexOf('bottom') !== -1) ? 1 : 0;
            this.noUnderflow = false;
        }
    }
    move() {
        this.update();
        return false;
    }
    update() {
        if (this.paused) {
            return;
        }
        if (this.parent.x === this.last.x
            && this.parent.y === this.last.y
            && this.parent.scale.x === this.last.scaleX
            && this.parent.scale.y === this.last.scaleY) {
            return;
        }
        const original = new Point(this.parent.x, this.parent.y);
        const decelerate = this.parent.plugins.decelerate || {};
        if (this.options.left !== null || this.options.right !== null) {
            let moved = false;
            if (!this.noUnderflow && this.parent.screenWorldWidth < this.parent.screenWidth) {
                switch (this.underflowX) {
                    case -1:
                        if (this.parent.x !== 0) {
                            this.parent.x = 0;
                            moved = true;
                        }
                        break;
                    case 1:
                        if (this.parent.x !== this.parent.screenWidth - this.parent.screenWorldWidth) {
                            this.parent.x = this.parent.screenWidth - this.parent.screenWorldWidth;
                            moved = true;
                        }
                        break;
                    default:
                        if (this.parent.x !== (this.parent.screenWidth - this.parent.screenWorldWidth) / 2) {
                            this.parent.x = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2;
                            moved = true;
                        }
                }
            }
            else {
                if (this.options.left !== null) {
                    if (this.parent.left < (this.options.left === true ? 0 : this.options.left)) {
                        this.parent.x = -(this.options.left === true ? 0 : this.options.left) * this.parent.scale.x;
                        decelerate.x = 0;
                        moved = true;
                    }
                }
                if (this.options.right !== null) {
                    if (this.parent.right > (this.options.right === true ? this.parent.worldWidth : this.options.right)) {
                        this.parent.x = (-(this.options.right === true ? this.parent.worldWidth : this.options.right)
                            * this.parent.scale.x) + this.parent.screenWidth;
                        decelerate.x = 0;
                        moved = true;
                    }
                }
            }
            if (moved) {
                this.parent.emit('moved', { viewport: this.parent, original, type: 'clamp-x' });
            }
        }
        if (this.options.top !== null || this.options.bottom !== null) {
            let moved = false;
            if (!this.noUnderflow && this.parent.screenWorldHeight < this.parent.screenHeight) {
                switch (this.underflowY) {
                    case -1:
                        if (this.parent.y !== 0) {
                            this.parent.y = 0;
                            moved = true;
                        }
                        break;
                    case 1:
                        if (this.parent.y !== this.parent.screenHeight - this.parent.screenWorldHeight) {
                            this.parent.y = (this.parent.screenHeight - this.parent.screenWorldHeight);
                            moved = true;
                        }
                        break;
                    default:
                        if (this.parent.y !== (this.parent.screenHeight - this.parent.screenWorldHeight) / 2) {
                            this.parent.y = (this.parent.screenHeight - this.parent.screenWorldHeight) / 2;
                            moved = true;
                        }
                }
            }
            else {
                if (this.options.top !== null) {
                    if (this.parent.top < (this.options.top === true ? 0 : this.options.top)) {
                        this.parent.y = -(this.options.top === true ? 0 : this.options.top)
                            * this.parent.scale.y;
                        decelerate.y = 0;
                        moved = true;
                    }
                }
                if (this.options.bottom !== null) {
                    if (this.parent.bottom > (this.options.bottom === true ? this.parent.worldHeight : this.options.bottom)) {
                        this.parent.y = (-(this.options.bottom === true ? this.parent.worldHeight : this.options.bottom)
                            * this.parent.scale.y) + this.parent.screenHeight;
                        decelerate.y = 0;
                        moved = true;
                    }
                }
            }
            if (moved) {
                this.parent.emit('moved', { viewport: this.parent, original, type: 'clamp-y' });
            }
        }
        this.last.x = this.parent.x;
        this.last.y = this.parent.y;
        this.last.scaleX = this.parent.scale.x;
        this.last.scaleY = this.parent.scale.y;
    }
    reset() {
        this.update();
    }
}
//# sourceMappingURL=Clamp.js.map