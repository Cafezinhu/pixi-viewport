import { Point } from '@pixi/core';
import { Plugin } from './Plugin';
const DEFAULT_DRAG_OPTIONS = {
    direction: 'all',
    pressDrag: true,
    wheel: true,
    wheelScroll: 1,
    reverse: false,
    clampWheel: false,
    underflow: 'center',
    factor: 1,
    mouseButtons: 'all',
    keyToPress: null,
    ignoreKeyToPressOnTouch: false,
    lineHeight: 20,
    wheelSwapAxes: false,
};
export class Drag extends Plugin {
    constructor(parent, options = {}) {
        super(parent);
        this.windowEventHandlers = [];
        this.options = Object.assign({}, DEFAULT_DRAG_OPTIONS, options);
        this.moved = false;
        this.reverse = this.options.reverse ? 1 : -1;
        this.xDirection = !this.options.direction || this.options.direction === 'all' || this.options.direction === 'x';
        this.yDirection = !this.options.direction || this.options.direction === 'all' || this.options.direction === 'y';
        this.keyIsPressed = false;
        this.parseUnderflow();
        this.mouseButtons(this.options.mouseButtons);
        if (this.options.keyToPress) {
            this.handleKeyPresses(this.options.keyToPress);
        }
    }
    handleKeyPresses(codes) {
        const keydownHandler = (e) => {
            if (codes.includes(e.code)) {
                this.keyIsPressed = true;
            }
        };
        const keyupHandler = (e) => {
            if (codes.includes(e.code)) {
                this.keyIsPressed = false;
            }
        };
        this.addWindowEventHandler('keyup', keyupHandler);
        this.addWindowEventHandler('keydown', keydownHandler);
    }
    addWindowEventHandler(event, handler) {
        window.addEventListener(event, handler);
        this.windowEventHandlers.push({ event, handler });
    }
    destroy() {
        this.windowEventHandlers.forEach(({ event, handler }) => {
            window.removeEventListener(event, handler);
        });
    }
    mouseButtons(buttons) {
        if (!buttons || buttons === 'all') {
            this.mouse = [true, true, true];
        }
        else {
            this.mouse = [
                buttons.indexOf('left') !== -1,
                buttons.indexOf('middle') !== -1,
                buttons.indexOf('right') !== -1
            ];
        }
    }
    parseUnderflow() {
        const clamp = this.options.underflow.toLowerCase();
        if (clamp === 'center') {
            this.underflowX = 0;
            this.underflowY = 0;
        }
        else {
            if (clamp.includes('left')) {
                this.underflowX = -1;
            }
            else if (clamp.includes('right')) {
                this.underflowX = 1;
            }
            else {
                this.underflowX = 0;
            }
            if (clamp.includes('top')) {
                this.underflowY = -1;
            }
            else if (clamp.includes('bottom')) {
                this.underflowY = 1;
            }
            else {
                this.underflowY = 0;
            }
        }
    }
    checkButtons(event) {
        const isMouse = event.pointerType === 'mouse';
        const count = this.parent.input.count();
        if ((count === 1) || (count > 1 && !this.parent.plugins.get('pinch', true))) {
            if (!isMouse || this.mouse[event.button]) {
                return true;
            }
        }
        return false;
    }
    checkKeyPress(event) {
        return (!this.options.keyToPress
            || this.keyIsPressed
            || (this.options.ignoreKeyToPressOnTouch && event.data.pointerType === 'touch'));
    }
    down(event) {
        if (this.paused || !this.options.pressDrag) {
            return false;
        }
        if (this.checkButtons(event) && this.checkKeyPress(event)) {
            this.last = { x: event.global.x, y: event.global.y };
            this.current = event.pointerId;
            return true;
        }
        this.last = null;
        return false;
    }
    get active() {
        return this.moved;
    }
    move(event) {
        if (this.paused || !this.options.pressDrag) {
            return false;
        }
        if (this.last && this.current === event.data.pointerId) {
            const x = event.global.x;
            const y = event.global.y;
            const count = this.parent.input.count();
            if (count === 1 || (count > 1 && !this.parent.plugins.get('pinch', true))) {
                const distX = x - this.last.x;
                const distY = y - this.last.y;
                if (this.moved
                    || ((this.xDirection && this.parent.input.checkThreshold(distX))
                        || (this.yDirection && this.parent.input.checkThreshold(distY)))) {
                    const newPoint = { x, y };
                    if (this.xDirection) {
                        this.parent.x += (newPoint.x - this.last.x) * this.options.factor;
                    }
                    if (this.yDirection) {
                        this.parent.y += (newPoint.y - this.last.y) * this.options.factor;
                    }
                    this.last = newPoint;
                    if (!this.moved) {
                        this.parent.emit('drag-start', {
                            event,
                            screen: new Point(this.last.x, this.last.y),
                            world: this.parent.toWorld(new Point(this.last.x, this.last.y)),
                            viewport: this.parent
                        });
                    }
                    this.moved = true;
                    this.parent.emit('moved', { viewport: this.parent, type: 'drag' });
                    return true;
                }
            }
            else {
                this.moved = false;
            }
        }
        return false;
    }
    up(event) {
        if (this.paused) {
            return false;
        }
        const touches = this.parent.input.touches;
        if (touches.length === 1) {
            const pointer = touches[0];
            if (pointer.last) {
                this.last = { x: pointer.last.x, y: pointer.last.y };
                this.current = pointer.id;
            }
            this.moved = false;
            return true;
        }
        else if (this.last) {
            if (this.moved) {
                const screen = new Point(this.last.x, this.last.y);
                this.parent.emit('drag-end', {
                    event, screen,
                    world: this.parent.toWorld(screen),
                    viewport: this.parent,
                });
                this.last = null;
                this.moved = false;
                return true;
            }
        }
        return false;
    }
    wheel(event) {
        if (this.paused) {
            return false;
        }
        if (this.options.wheel) {
            const wheel = this.parent.plugins.get('wheel', true);
            if (!wheel || (!wheel.options.wheelZoom && !event.ctrlKey)) {
                const step = event.deltaMode ? this.options.lineHeight : 1;
                const deltas = [event.deltaX, event.deltaY];
                const [deltaX, deltaY] = this.options.wheelSwapAxes ? deltas.reverse() : deltas;
                if (this.xDirection) {
                    this.parent.x += deltaX * step * this.options.wheelScroll * this.reverse;
                }
                if (this.yDirection) {
                    this.parent.y += deltaY * step * this.options.wheelScroll * this.reverse;
                }
                if (this.options.clampWheel) {
                    this.clamp();
                }
                this.parent.emit('wheel-scroll', this.parent);
                this.parent.emit('moved', { viewport: this.parent, type: 'wheel' });
                if (!this.parent.options.passiveWheel) {
                    event.preventDefault();
                }
                if (this.parent.options.stopPropagation) {
                    event.stopPropagation();
                }
                return true;
            }
        }
        return false;
    }
    resume() {
        this.last = null;
        this.paused = false;
    }
    clamp() {
        const decelerate = this.parent.plugins.get('decelerate', true) || {};
        if (this.options.clampWheel !== 'y') {
            if (this.parent.screenWorldWidth < this.parent.screenWidth) {
                switch (this.underflowX) {
                    case -1:
                        this.parent.x = 0;
                        break;
                    case 1:
                        this.parent.x = (this.parent.screenWidth - this.parent.screenWorldWidth);
                        break;
                    default:
                        this.parent.x = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2;
                }
            }
            else if (this.parent.left < 0) {
                this.parent.x = 0;
                decelerate.x = 0;
            }
            else if (this.parent.right > this.parent.worldWidth) {
                this.parent.x = (-this.parent.worldWidth * this.parent.scale.x) + this.parent.screenWidth;
                decelerate.x = 0;
            }
        }
        if (this.options.clampWheel !== 'x') {
            if (this.parent.screenWorldHeight < this.parent.screenHeight) {
                switch (this.underflowY) {
                    case -1:
                        this.parent.y = 0;
                        break;
                    case 1:
                        this.parent.y = (this.parent.screenHeight - this.parent.screenWorldHeight);
                        break;
                    default:
                        this.parent.y = (this.parent.screenHeight - this.parent.screenWorldHeight) / 2;
                }
            }
            else {
                if (this.parent.top < 0) {
                    this.parent.y = 0;
                    decelerate.y = 0;
                }
                if (this.parent.bottom > this.parent.worldHeight) {
                    this.parent.y = (-this.parent.worldHeight * this.parent.scale.y) + this.parent.screenHeight;
                    decelerate.y = 0;
                }
            }
        }
    }
}
//# sourceMappingURL=Drag.js.map