import { Plugin } from './Plugin';
const DEFAULT_FOLLOW_OPTIONS = {
    speed: 0,
    acceleration: null,
    radius: null
};
export class Follow extends Plugin {
    constructor(parent, target, options = {}) {
        super(parent);
        this.target = target;
        this.options = Object.assign({}, DEFAULT_FOLLOW_OPTIONS, options);
        this.velocity = { x: 0, y: 0 };
    }
    update(elapsed) {
        if (this.paused) {
            return;
        }
        const center = this.parent.center;
        let toX = this.target.x;
        let toY = this.target.y;
        if (this.options.radius) {
            const distance = Math.sqrt(Math.pow(this.target.y - center.y, 2) + Math.pow(this.target.x - center.x, 2));
            if (distance > this.options.radius) {
                const angle = Math.atan2(this.target.y - center.y, this.target.x - center.x);
                toX = this.target.x - (Math.cos(angle) * this.options.radius);
                toY = this.target.y - (Math.sin(angle) * this.options.radius);
            }
            else {
                return;
            }
        }
        const deltaX = toX - center.x;
        const deltaY = toY - center.y;
        if (deltaX || deltaY) {
            if (this.options.speed) {
                if (this.options.acceleration) {
                    const angle = Math.atan2(toY - center.y, toX - center.x);
                    const distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
                    if (distance) {
                        const decelerationDistance = (Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2))
                            / (2 * this.options.acceleration);
                        if (distance > decelerationDistance) {
                            this.velocity = {
                                x: Math.min(this.velocity.x + (this.options.acceleration * elapsed, this.options.speed)),
                                y: Math.min(this.velocity.y + (this.options.acceleration * elapsed, this.options.speed))
                            };
                        }
                        else {
                            this.velocity = {
                                x: Math.max(this.velocity.x - (this.options.acceleration * this.options.speed), 0),
                                y: Math.max(this.velocity.y - (this.options.acceleration * this.options.speed), 0)
                            };
                        }
                        const changeX = Math.cos(angle) * this.velocity.x;
                        const changeY = Math.sin(angle) * this.velocity.y;
                        const x = Math.abs(changeX) > Math.abs(deltaX) ? toX : center.x + changeX;
                        const y = Math.abs(changeY) > Math.abs(deltaY) ? toY : center.y + changeY;
                        this.parent.moveCenter(x, y);
                        this.parent.emit('moved', { viewport: this.parent, type: 'follow' });
                    }
                }
                else {
                    const angle = Math.atan2(toY - center.y, toX - center.x);
                    const changeX = Math.cos(angle) * this.options.speed;
                    const changeY = Math.sin(angle) * this.options.speed;
                    const x = Math.abs(changeX) > Math.abs(deltaX) ? toX : center.x + changeX;
                    const y = Math.abs(changeY) > Math.abs(deltaY) ? toY : center.y + changeY;
                    this.parent.moveCenter(x, y);
                    this.parent.emit('moved', { viewport: this.parent, type: 'follow' });
                }
            }
            else {
                this.parent.moveCenter(toX, toY);
                this.parent.emit('moved', { viewport: this.parent, type: 'follow' });
            }
        }
    }
}
//# sourceMappingURL=Follow.js.map