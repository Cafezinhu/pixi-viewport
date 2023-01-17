import { Point } from '@pixi/core';
import { Plugin } from './Plugin';
import ease from '../ease';
const DEFAULT_ANIMATE_OPTIONS = {
    removeOnInterrupt: false,
    ease: 'linear',
    time: 1000,
};
export class Animate extends Plugin {
    constructor(parent, options = {}) {
        super(parent);
        this.startWidth = null;
        this.startHeight = null;
        this.deltaWidth = null;
        this.deltaHeight = null;
        this.width = null;
        this.height = null;
        this.time = 0;
        this.options = Object.assign({}, DEFAULT_ANIMATE_OPTIONS, options);
        this.options.ease = ease(this.options.ease);
        this.setupPosition();
        this.setupZoom();
        this.time = 0;
    }
    setupPosition() {
        if (typeof this.options.position !== 'undefined') {
            this.startX = this.parent.center.x;
            this.startY = this.parent.center.y;
            this.deltaX = this.options.position.x - this.parent.center.x;
            this.deltaY = this.options.position.y - this.parent.center.y;
            this.keepCenter = false;
        }
        else {
            this.keepCenter = true;
        }
    }
    setupZoom() {
        this.width = null;
        this.height = null;
        if (typeof this.options.scale !== 'undefined') {
            this.width = this.parent.screenWidth / this.options.scale;
        }
        else if (typeof this.options.scaleX !== 'undefined' || typeof this.options.scaleY !== 'undefined') {
            if (typeof this.options.scaleX !== 'undefined') {
                this.width = this.parent.screenWidth / this.options.scaleX;
            }
            if (typeof this.options.scaleY !== 'undefined') {
                this.height = this.parent.screenHeight / this.options.scaleY;
            }
        }
        else {
            if (typeof this.options.width !== 'undefined') {
                this.width = this.options.width;
            }
            if (typeof this.options.height !== 'undefined') {
                this.height = this.options.height;
            }
        }
        if (this.width !== null) {
            this.startWidth = this.parent.screenWidthInWorldPixels;
            this.deltaWidth = this.width - this.startWidth;
        }
        if (this.height !== null) {
            this.startHeight = this.parent.screenHeightInWorldPixels;
            this.deltaHeight = this.height - this.startHeight;
        }
    }
    down() {
        if (this.options.removeOnInterrupt) {
            this.parent.plugins.remove('animate');
        }
        return false;
    }
    complete() {
        this.parent.plugins.remove('animate');
        if (this.width !== null) {
            this.parent.fitWidth(this.width, this.keepCenter, this.height === null);
        }
        if (this.height !== null) {
            this.parent.fitHeight(this.height, this.keepCenter, this.width === null);
        }
        if (!this.keepCenter && this.options.position) {
            this.parent.moveCenter(this.options.position);
        }
        this.parent.emit('animate-end', this.parent);
        if (this.options.callbackOnComplete) {
            this.options.callbackOnComplete(this.parent);
        }
    }
    update(elapsed) {
        if (this.paused) {
            return;
        }
        this.time += elapsed;
        const originalZoom = new Point(this.parent.scale.x, this.parent.scale.y);
        if (this.time >= this.options.time) {
            const originalWidth = this.parent.width;
            const originalHeight = this.parent.height;
            this.complete();
            if (originalWidth !== this.parent.width || originalHeight !== this.parent.height) {
                this.parent.emit('zoomed', { viewport: this.parent, original: originalZoom, type: 'animate' });
            }
        }
        else {
            const percent = this.options.ease(this.time, 0, 1, this.options.time);
            if (this.width !== null) {
                const startWidth = this.startWidth;
                const deltaWidth = this.deltaWidth;
                this.parent.fitWidth(startWidth + (deltaWidth * percent), this.keepCenter, this.height === null);
            }
            if (this.height !== null) {
                const startHeight = this.startHeight;
                const deltaHeight = this.deltaHeight;
                this.parent.fitHeight(startHeight + (deltaHeight * percent), this.keepCenter, this.width === null);
            }
            if (this.width === null) {
                this.parent.scale.x = this.parent.scale.y;
            }
            else if (this.height === null) {
                this.parent.scale.y = this.parent.scale.x;
            }
            if (!this.keepCenter) {
                const startX = this.startX;
                const startY = this.startY;
                const deltaX = this.deltaX;
                const deltaY = this.deltaY;
                const original = new Point(this.parent.x, this.parent.y);
                this.parent.moveCenter(startX + (deltaX * percent), startY + (deltaY * percent));
                this.parent.emit('moved', { viewport: this.parent, original, type: 'animate' });
            }
            if (this.width || this.height) {
                this.parent.emit('zoomed', { viewport: this.parent, original: originalZoom, type: 'animate' });
            }
        }
    }
}
//# sourceMappingURL=Animate.js.map