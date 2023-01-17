import { Container } from '@pixi/display';
import { Point, Rectangle, Ticker } from '@pixi/core';
import { InputManager } from './InputManager';
import { PluginManager } from './PluginManager';
import { Animate, Bounce, Clamp, ClampZoom, Decelerate, Drag, Follow, MouseEdges, Pinch, Snap, SnapZoom, Wheel, } from './plugins';
const DEFAULT_VIEWPORT_OPTIONS = {
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: null,
    worldHeight: null,
    threshold: 5,
    passiveWheel: true,
    stopPropagation: false,
    forceHitArea: null,
    noTicker: false,
    interaction: null,
    disableOnContextMenu: false,
    ticker: Ticker.shared,
};
export class Viewport extends Container {
    constructor(options = {}) {
        super();
        this._disableOnContextMenu = (e) => e.preventDefault();
        this.options = Object.assign({}, { divWheel: document.body }, DEFAULT_VIEWPORT_OPTIONS, options);
        this.screenWidth = this.options.screenWidth;
        this.screenHeight = this.options.screenHeight;
        this._worldWidth = this.options.worldWidth;
        this._worldHeight = this.options.worldHeight;
        this.forceHitArea = this.options.forceHitArea;
        this.threshold = this.options.threshold;
        this.options.divWheel = this.options.divWheel || document.body;
        if (this.options.disableOnContextMenu) {
            this.options.divWheel.addEventListener('contextmenu', this._disableOnContextMenu);
        }
        if (!this.options.noTicker) {
            this.tickerFunction = () => this.update(this.options.ticker.elapsedMS);
            this.options.ticker.add(this.tickerFunction);
        }
        this.input = new InputManager(this);
        this.plugins = new PluginManager(this);
    }
    destroy(options) {
        if (!this.options.noTicker && this.tickerFunction) {
            this.options.ticker.remove(this.tickerFunction);
        }
        if (this.options.disableOnContextMenu) {
            this.options.divWheel.removeEventListener('contextmenu', this._disableOnContextMenu);
        }
        this.input.destroy();
        super.destroy(options);
    }
    update(elapsed) {
        if (!this.pause) {
            this.plugins.update(elapsed);
            if (this.lastViewport) {
                if (this.lastViewport.x !== this.x || this.lastViewport.y !== this.y) {
                    this.moving = true;
                }
                else if (this.moving) {
                    this.emit('moved-end', this);
                    this.moving = false;
                }
                if (this.lastViewport.scaleX !== this.scale.x || this.lastViewport.scaleY !== this.scale.y) {
                    this.zooming = true;
                }
                else if (this.zooming) {
                    this.emit('zoomed-end', this);
                    this.zooming = false;
                }
            }
            if (!this.forceHitArea) {
                this._hitAreaDefault = new Rectangle(this.left, this.top, this.worldScreenWidth, this.worldScreenHeight);
                this.hitArea = this._hitAreaDefault;
            }
            this._dirty = this._dirty || !this.lastViewport
                || this.lastViewport.x !== this.x || this.lastViewport.y !== this.y
                || this.lastViewport.scaleX !== this.scale.x || this.lastViewport.scaleY !== this.scale.y;
            this.lastViewport = {
                x: this.x,
                y: this.y,
                scaleX: this.scale.x,
                scaleY: this.scale.y
            };
            this.emit('frame-end', this);
        }
    }
    resize(screenWidth = window.innerWidth, screenHeight = window.innerHeight, worldWidth, worldHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        if (typeof worldWidth !== 'undefined') {
            this._worldWidth = worldWidth;
        }
        if (typeof worldHeight !== 'undefined') {
            this._worldHeight = worldHeight;
        }
        this.plugins.resize();
        this.dirty = true;
    }
    get worldWidth() {
        if (this._worldWidth) {
            return this._worldWidth;
        }
        return this.width / this.scale.x;
    }
    set worldWidth(value) {
        this._worldWidth = value;
        this.plugins.resize();
    }
    get worldHeight() {
        if (this._worldHeight) {
            return this._worldHeight;
        }
        return this.height / this.scale.y;
    }
    set worldHeight(value) {
        this._worldHeight = value;
        this.plugins.resize();
    }
    getVisibleBounds() {
        return new Rectangle(this.left, this.top, this.worldScreenWidth, this.worldScreenHeight);
    }
    toWorld(x, y) {
        if (arguments.length === 2) {
            return this.toLocal(new Point(x, y));
        }
        return this.toLocal(x);
    }
    toScreen(x, y) {
        if (arguments.length === 2) {
            return this.toGlobal(new Point(x, y));
        }
        return this.toGlobal(x);
    }
    get worldScreenWidth() {
        return this.screenWidth / this.scale.x;
    }
    get worldScreenHeight() {
        return this.screenHeight / this.scale.y;
    }
    get screenWorldWidth() {
        return this.worldWidth * this.scale.x;
    }
    get screenWorldHeight() {
        return this.worldHeight * this.scale.y;
    }
    get center() {
        return new Point((this.worldScreenWidth / 2) - (this.x / this.scale.x), (this.worldScreenHeight / 2) - (this.y / this.scale.y));
    }
    set center(value) {
        this.moveCenter(value);
    }
    moveCenter(...args) {
        let x;
        let y;
        if (typeof args[0] === 'number') {
            x = args[0];
            y = args[1];
        }
        else {
            x = args[0].x;
            y = args[0].y;
        }
        const newX = ((this.worldScreenWidth / 2) - x) * this.scale.x;
        const newY = ((this.worldScreenHeight / 2) - y) * this.scale.y;
        if (this.x !== newX || this.y !== newY) {
            this.position.set(newX, newY);
            this.plugins.reset();
            this.dirty = true;
        }
        return this;
    }
    get corner() {
        return new Point(-this.x / this.scale.x, -this.y / this.scale.y);
    }
    set corner(value) {
        this.moveCorner(value);
    }
    moveCorner(...args) {
        let x;
        let y;
        if (args.length === 1) {
            x = -args[0].x * this.scale.x;
            y = -args[0].y * this.scale.y;
        }
        else {
            x = -args[0] * this.scale.x;
            y = -args[1] * this.scale.y;
        }
        if (x !== this.x || y !== this.y) {
            this.position.set(x, y);
            this.plugins.reset();
            this.dirty = true;
        }
        return this;
    }
    get screenWidthInWorldPixels() {
        return this.screenWidth / this.scale.x;
    }
    get screenHeightInWorldPixels() {
        return this.screenHeight / this.scale.y;
    }
    findFitWidth(width) {
        return this.screenWidth / width;
    }
    findFitHeight(height) {
        return this.screenHeight / height;
    }
    findFit(width, height) {
        const scaleX = this.screenWidth / width;
        const scaleY = this.screenHeight / height;
        return Math.min(scaleX, scaleY);
    }
    findCover(width, height) {
        const scaleX = this.screenWidth / width;
        const scaleY = this.screenHeight / height;
        return Math.max(scaleX, scaleY);
    }
    fitWidth(width = this.worldWidth, center, scaleY = true, noClamp) {
        let save;
        if (center) {
            save = this.center;
        }
        this.scale.x = this.screenWidth / width;
        if (scaleY) {
            this.scale.y = this.scale.x;
        }
        const clampZoom = this.plugins.get('clamp-zoom', true);
        if (!noClamp && clampZoom) {
            clampZoom.clamp();
        }
        if (center && save) {
            this.moveCenter(save);
        }
        return this;
    }
    fitHeight(height = this.worldHeight, center, scaleX = true, noClamp) {
        let save;
        if (center) {
            save = this.center;
        }
        this.scale.y = this.screenHeight / height;
        if (scaleX) {
            this.scale.x = this.scale.y;
        }
        const clampZoom = this.plugins.get('clamp-zoom', true);
        if (!noClamp && clampZoom) {
            clampZoom.clamp();
        }
        if (center && save) {
            this.moveCenter(save);
        }
        return this;
    }
    fitWorld(center) {
        let save;
        if (center) {
            save = this.center;
        }
        this.scale.x = this.screenWidth / this.worldWidth;
        this.scale.y = this.screenHeight / this.worldHeight;
        if (this.scale.x < this.scale.y) {
            this.scale.y = this.scale.x;
        }
        else {
            this.scale.x = this.scale.y;
        }
        const clampZoom = this.plugins.get('clamp-zoom', true);
        if (clampZoom) {
            clampZoom.clamp();
        }
        if (center && save) {
            this.moveCenter(save);
        }
        return this;
    }
    fit(center, width = this.worldWidth, height = this.worldHeight) {
        let save;
        if (center) {
            save = this.center;
        }
        this.scale.x = this.screenWidth / width;
        this.scale.y = this.screenHeight / height;
        if (this.scale.x < this.scale.y) {
            this.scale.y = this.scale.x;
        }
        else {
            this.scale.x = this.scale.y;
        }
        const clampZoom = this.plugins.get('clamp-zoom', true);
        if (clampZoom) {
            clampZoom.clamp();
        }
        if (center && save) {
            this.moveCenter(save);
        }
        return this;
    }
    setZoom(scale, center) {
        let save;
        if (center) {
            save = this.center;
        }
        this.scale.set(scale);
        const clampZoom = this.plugins.get('clamp-zoom', true);
        if (clampZoom) {
            clampZoom.clamp();
        }
        if (center && save) {
            this.moveCenter(save);
        }
        return this;
    }
    zoomPercent(percent, center) {
        return this.setZoom(this.scale.x + (this.scale.x * percent), center);
    }
    zoom(change, center) {
        this.fitWidth(change + this.worldScreenWidth, center);
        return this;
    }
    get scaled() {
        return this.scale.x;
    }
    set scaled(scale) {
        this.setZoom(scale, true);
    }
    snapZoom(options) {
        this.plugins.add('snap-zoom', new SnapZoom(this, options));
        return this;
    }
    OOB() {
        return {
            left: this.left < 0,
            right: this.right > this.worldWidth,
            top: this.top < 0,
            bottom: this.bottom > this.worldHeight,
            cornerPoint: new Point((this.worldWidth * this.scale.x) - this.screenWidth, (this.worldHeight * this.scale.y) - this.screenHeight)
        };
    }
    get right() {
        return (-this.x / this.scale.x) + this.worldScreenWidth;
    }
    set right(value) {
        this.x = (-value * this.scale.x) + this.screenWidth;
        this.plugins.reset();
    }
    get left() {
        return -this.x / this.scale.x;
    }
    set left(value) {
        this.x = -value * this.scale.x;
        this.plugins.reset();
    }
    get top() {
        return -this.y / this.scale.y;
    }
    set top(value) {
        this.y = -value * this.scale.y;
        this.plugins.reset();
    }
    get bottom() {
        return (-this.y / this.scale.y) + this.worldScreenHeight;
    }
    set bottom(value) {
        this.y = (-value * this.scale.y) + this.screenHeight;
        this.plugins.reset();
    }
    get dirty() {
        return !!this._dirty;
    }
    set dirty(value) {
        this._dirty = value;
    }
    get forceHitArea() {
        return this._forceHitArea;
    }
    set forceHitArea(value) {
        if (value) {
            this._forceHitArea = value;
            this.hitArea = value;
        }
        else {
            this._forceHitArea = null;
            this.hitArea = new Rectangle(0, 0, this.worldWidth, this.worldHeight);
        }
    }
    drag(options) {
        this.plugins.add('drag', new Drag(this, options));
        return this;
    }
    clamp(options) {
        this.plugins.add('clamp', new Clamp(this, options));
        return this;
    }
    decelerate(options) {
        this.plugins.add('decelerate', new Decelerate(this, options));
        return this;
    }
    bounce(options) {
        this.plugins.add('bounce', new Bounce(this, options));
        return this;
    }
    pinch(options) {
        this.plugins.add('pinch', new Pinch(this, options));
        return this;
    }
    snap(x, y, options) {
        this.plugins.add('snap', new Snap(this, x, y, options));
        return this;
    }
    follow(target, options) {
        this.plugins.add('follow', new Follow(this, target, options));
        return this;
    }
    wheel(options) {
        this.plugins.add('wheel', new Wheel(this, options));
        return this;
    }
    animate(options) {
        this.plugins.add('animate', new Animate(this, options));
        return this;
    }
    clampZoom(options) {
        this.plugins.add('clamp-zoom', new ClampZoom(this, options));
        return this;
    }
    mouseEdges(options) {
        this.plugins.add('mouse-edges', new MouseEdges(this, options));
        return this;
    }
    get pause() {
        return !!this._pause;
    }
    set pause(value) {
        this._pause = value;
        this.lastViewport = null;
        this.moving = false;
        this.zooming = false;
        if (value) {
            this.input.pause();
        }
    }
    ensureVisible(x, y, width, height, resizeToFit) {
        if (resizeToFit && (width > this.worldScreenWidth || height > this.worldScreenHeight)) {
            this.fit(true, width, height);
            this.emit('zoomed', { viewport: this, type: 'ensureVisible' });
        }
        let moved = false;
        if (x < this.left) {
            this.left = x;
            moved = true;
        }
        else if (x + width > this.right) {
            this.right = x + width;
            moved = true;
        }
        if (y < this.top) {
            this.top = y;
            moved = true;
        }
        else if (y + height > this.bottom) {
            this.bottom = y + height;
            moved = true;
        }
        if (moved) {
            this.emit('moved', { viewport: this, type: 'ensureVisible' });
        }
    }
}
//# sourceMappingURL=Viewport.js.map