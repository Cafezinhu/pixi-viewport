import { Plugin } from './Plugin';
const DEFAULT_CLAMP_ZOOM_OPTIONS = {
    minWidth: null,
    minHeight: null,
    maxWidth: null,
    maxHeight: null,
    minScale: null,
    maxScale: null
};
export class ClampZoom extends Plugin {
    constructor(parent, options = {}) {
        super(parent);
        this.options = Object.assign({}, DEFAULT_CLAMP_ZOOM_OPTIONS, options);
        this.clamp();
    }
    resize() {
        this.clamp();
    }
    clamp() {
        if (this.paused) {
            return;
        }
        if (this.options.minWidth || this.options.minHeight || this.options.maxWidth || this.options.maxHeight) {
            let width = this.parent.worldScreenWidth;
            let height = this.parent.worldScreenHeight;
            if (this.options.minWidth !== null && width < this.options.minWidth) {
                const original = this.parent.scale.x;
                this.parent.fitWidth(this.options.minWidth, false, false, true);
                this.parent.scale.y *= this.parent.scale.x / original;
                width = this.parent.worldScreenWidth;
                height = this.parent.worldScreenHeight;
                this.parent.emit('zoomed', { viewport: this.parent, type: 'clamp-zoom' });
            }
            if (this.options.maxWidth !== null && width > this.options.maxWidth) {
                const original = this.parent.scale.x;
                this.parent.fitWidth(this.options.maxWidth, false, false, true);
                this.parent.scale.y *= this.parent.scale.x / original;
                width = this.parent.worldScreenWidth;
                height = this.parent.worldScreenHeight;
                this.parent.emit('zoomed', { viewport: this.parent, type: 'clamp-zoom' });
            }
            if (this.options.minHeight !== null && height < this.options.minHeight) {
                const original = this.parent.scale.y;
                this.parent.fitHeight(this.options.minHeight, false, false, true);
                this.parent.scale.x *= this.parent.scale.y / original;
                width = this.parent.worldScreenWidth;
                height = this.parent.worldScreenHeight;
                this.parent.emit('zoomed', { viewport: this.parent, type: 'clamp-zoom' });
            }
            if (this.options.maxHeight !== null && height > this.options.maxHeight) {
                const original = this.parent.scale.y;
                this.parent.fitHeight(this.options.maxHeight, false, false, true);
                this.parent.scale.x *= this.parent.scale.y / original;
                this.parent.emit('zoomed', { viewport: this.parent, type: 'clamp-zoom' });
            }
        }
        else if (this.options.minScale || this.options.maxScale) {
            const minScale = { x: null, y: null };
            const maxScale = { x: null, y: null };
            if (typeof this.options.minScale === 'number') {
                minScale.x = this.options.minScale;
                minScale.y = this.options.minScale;
            }
            else if (this.options.minScale !== null) {
                const optsMinScale = this.options.minScale;
                minScale.x = typeof optsMinScale.x === 'undefined' ? null : optsMinScale.x;
                minScale.y = typeof optsMinScale.y === 'undefined' ? null : optsMinScale.y;
            }
            if (typeof this.options.maxScale === 'number') {
                maxScale.x = this.options.maxScale;
                maxScale.y = this.options.maxScale;
            }
            else if (this.options.maxScale !== null) {
                const optsMaxScale = this.options.maxScale;
                maxScale.x = typeof optsMaxScale.x === 'undefined' ? null : optsMaxScale.x;
                maxScale.y = typeof optsMaxScale.y === 'undefined' ? null : optsMaxScale.y;
            }
            let scaleX = this.parent.scale.x;
            let scaleY = this.parent.scale.y;
            if (minScale.x !== null && scaleX < minScale.x) {
                scaleX = minScale.x;
            }
            if (maxScale.x !== null && scaleX > maxScale.x) {
                scaleX = maxScale.x;
            }
            if (minScale.y !== null && scaleY < minScale.y) {
                scaleY = minScale.y;
            }
            if (maxScale.y !== null && scaleY > maxScale.y) {
                scaleY = maxScale.y;
            }
            if (scaleX !== this.parent.scale.x || scaleY !== this.parent.scale.y) {
                this.parent.scale.set(scaleX, scaleY);
                this.parent.emit('zoomed', { viewport: this.parent, type: 'clamp-zoom' });
            }
        }
    }
    reset() {
        this.clamp();
    }
}
//# sourceMappingURL=ClampZoom.js.map