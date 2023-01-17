import { Point, Rectangle } from '@pixi/core';
export class InputManager {
    constructor(viewport) {
        this.viewport = viewport;
        this.touches = [];
        this.addListeners();
    }
    addListeners() {
        this.viewport.interactive = true;
        if (!this.viewport.forceHitArea) {
            this.viewport.hitArea = new Rectangle(0, 0, this.viewport.worldWidth, this.viewport.worldHeight);
        }
        this.viewport.on('pointerdown', this.down, this);
        this.viewport.on('pointermove', this.move, this);
        this.viewport.on('pointerup', this.up, this);
        this.viewport.on('pointerupoutside', this.up, this);
        this.viewport.on('pointercancel', this.up, this);
        this.viewport.on('pointerout', this.up, this);
        this.wheelFunction = (e) => this.handleWheel(e);
        this.viewport.options.divWheel.addEventListener('wheel', this.wheelFunction, { passive: this.viewport.options.passiveWheel });
        this.isMouseDown = false;
    }
    destroy() {
        this.viewport.options.divWheel.removeEventListener('wheel', this.wheelFunction);
    }
    down(event) {
        if (this.viewport.pause || !this.viewport.worldVisible) {
            return;
        }
        if (event.pointerType === 'mouse') {
            this.isMouseDown = true;
        }
        else if (!this.get(event.pointerId)) {
            this.touches.push({ id: event.pointerId, last: null });
        }
        if (this.count() === 1) {
            this.last = event.global.clone();
            const decelerate = this.viewport.plugins.get('decelerate', true);
            const bounce = this.viewport.plugins.get('bounce', true);
            if ((!decelerate || !decelerate.isActive()) && (!bounce || !bounce.isActive())) {
                this.clickedAvailable = true;
            }
            else {
                this.clickedAvailable = false;
            }
        }
        else {
            this.clickedAvailable = false;
        }
        const stop = this.viewport.plugins.down(event);
        if (stop && this.viewport.options.stopPropagation) {
            event.stopPropagation();
        }
    }
    clear() {
        this.isMouseDown = false;
        this.touches = [];
        this.last = null;
    }
    checkThreshold(change) {
        if (Math.abs(change) >= this.viewport.threshold) {
            return true;
        }
        return false;
    }
    move(event) {
        if (this.viewport.pause || !this.viewport.worldVisible) {
            return;
        }
        const stop = this.viewport.plugins.move(event);
        if (this.clickedAvailable && this.last) {
            const distX = event.global.x - this.last.x;
            const distY = event.global.y - this.last.y;
            if (this.checkThreshold(distX) || this.checkThreshold(distY)) {
                this.clickedAvailable = false;
            }
        }
        if (stop && this.viewport.options.stopPropagation) {
            event.stopPropagation();
        }
    }
    up(event) {
        if (this.viewport.pause || !this.viewport.worldVisible) {
            return;
        }
        if (event.pointerType === 'mouse') {
            this.isMouseDown = false;
        }
        if (event.pointerType !== 'mouse') {
            this.remove(event.pointerId);
        }
        const stop = this.viewport.plugins.up(event);
        if (this.clickedAvailable && this.count() === 0 && this.last) {
            this.viewport.emit('clicked', {
                event,
                screen: this.last,
                world: this.viewport.toWorld(this.last),
                viewport: this.viewport
            });
            this.clickedAvailable = false;
        }
        if (stop && this.viewport.options.stopPropagation) {
            event.stopPropagation();
        }
    }
    getPointerPosition(event) {
        const point = new Point();
        if (this.viewport.options.interaction) {
            this.viewport.options.interaction.mapPositionToPoint(point, event.clientX, event.clientY);
        }
        else if (this.viewport.options.useDivWheelForInputManager && this.viewport.options.divWheel) {
            const rect = this.viewport.options.divWheel.getBoundingClientRect();
            point.x = event.clientX - rect.left;
            point.y = event.clientY - rect.top;
        }
        else {
            point.x = event.clientX;
            point.y = event.clientY;
        }
        return point;
    }
    handleWheel(event) {
        if (this.viewport.pause || !this.viewport.worldVisible) {
            return;
        }
        if (this.viewport.options.interaction
            && this.viewport.options.interaction.interactionDOMElement !== event.target) {
            return;
        }
        const point = this.viewport.toLocal(this.getPointerPosition(event));
        if (this.viewport.left <= point.x
            && point.x <= this.viewport.right
            && this.viewport.top <= point.y
            && point.y <= this.viewport.bottom) {
            const stop = this.viewport.plugins.wheel(event);
            if (stop && !this.viewport.options.passiveWheel) {
                event.preventDefault();
            }
        }
    }
    pause() {
        this.touches = [];
        this.isMouseDown = false;
    }
    get(id) {
        for (const touch of this.touches) {
            if (touch.id === id) {
                return touch;
            }
        }
        return null;
    }
    remove(id) {
        for (let i = 0; i < this.touches.length; i++) {
            if (this.touches[i].id === id) {
                this.touches.splice(i, 1);
                return;
            }
        }
    }
    count() {
        return (this.isMouseDown ? 1 : 0) + this.touches.length;
    }
}
//# sourceMappingURL=InputManager.js.map