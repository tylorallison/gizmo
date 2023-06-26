export { Config };

class Config {
    static defaults = {};
    static setDefault(key, value) {
        this.defaults[key] = value;
    }
    static setDefaults(atts={}) {
        Object.assign(this.defaults, atts);
    }

    constructor(spec={}) {
        let atts = Object.assign({}, spec);
        return new Proxy(atts, {
            get(target, key, receiver) {
                if (key in target) return target[key];
                if (key in Config.defaults) return Config.defaults[key];
                //console.error(`config missing value for att: ${key}`);
                return undefined;
            },
            set(target, key, value, receiver) {
                target[key] = value;
            },
        })
    }

}