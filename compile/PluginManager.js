const PLUGIN_ORDER = [
    'drag',
    'pinch',
    'wheel',
    'follow',
    'mouse-edges',
    'decelerate',
    'animate',
    'bounce',
    'snap-zoom',
    'clamp-zoom',
    'snap',
    'clamp',
];
export class PluginManager {
    constructor(viewport) {
        this.viewport = viewport;
        this.list = [];
        this.plugins = {};
    }
    add(name, plugin, index = PLUGIN_ORDER.length) {
        const oldPlugin = this.plugins[name];
        if (oldPlugin) {
            oldPlugin.destroy();
        }
        this.plugins[name] = plugin;
        const current = PLUGIN_ORDER.indexOf(name);
        if (current !== -1) {
            PLUGIN_ORDER.splice(current, 1);
        }
        PLUGIN_ORDER.splice(index, 0, name);
        this.sort();
    }
    get(name, ignorePaused) {
        var _a;
        if (ignorePaused) {
            if ((_a = this.plugins[name]) === null || _a === void 0 ? void 0 : _a.paused) {
                return null;
            }
        }
        return this.plugins[name];
    }
    update(elapsed) {
        for (const plugin of this.list) {
            plugin.update(elapsed);
        }
    }
    resize() {
        for (const plugin of this.list) {
            plugin.resize();
        }
    }
    reset() {
        for (const plugin of this.list) {
            plugin.reset();
        }
    }
    removeAll() {
        this.list.forEach((plugin) => {
            plugin.destroy();
        });
        this.plugins = {};
        this.sort();
    }
    remove(name) {
        var _a;
        if (this.plugins[name]) {
            (_a = this.plugins[name]) === null || _a === void 0 ? void 0 : _a.destroy();
            delete this.plugins[name];
            this.viewport.emit('plugin-remove', name);
            this.sort();
        }
    }
    pause(name) {
        var _a;
        (_a = this.plugins[name]) === null || _a === void 0 ? void 0 : _a.pause();
    }
    resume(name) {
        var _a;
        (_a = this.plugins[name]) === null || _a === void 0 ? void 0 : _a.resume();
    }
    sort() {
        this.list = [];
        for (const plugin of PLUGIN_ORDER) {
            if (this.plugins[plugin]) {
                this.list.push(this.plugins[plugin]);
            }
        }
    }
    down(event) {
        let stop = false;
        for (const plugin of this.list) {
            if (plugin.down(event)) {
                stop = true;
            }
        }
        return stop;
    }
    move(event) {
        let stop = false;
        for (const plugin of this.viewport.plugins.list) {
            if (plugin.move(event)) {
                stop = true;
            }
        }
        return stop;
    }
    up(event) {
        let stop = false;
        for (const plugin of this.list) {
            if (plugin.up(event)) {
                stop = true;
            }
        }
        return stop;
    }
    wheel(e) {
        let result = false;
        for (const plugin of this.list) {
            if (plugin.wheel(e)) {
                result = true;
            }
        }
        return result;
    }
}
//# sourceMappingURL=PluginManager.js.map