export { Fmt };

// =========================================================================
class Fmt {
    // STATIC METHODS ------------------------------------------------------
    static toString(name, ...args) {
        return `{${name}:${args.join('|')}}`;
    }

    static ofmt(obj, name, fmtRules={}) {
        if (!obj) return "";
        let kvs = [];
        if (obj instanceof Map) {
            for (const [key, value] of obj) {
                let rule = fmtRules[key];
                if (!rule && value && value.constructor.name === "Object") rule = Fmt.ofmt;
                if (!rule && value instanceof Map) rule = Fmt.ofmt;
                kvs.push(key + ':' + ((rule) ? rule(value) : value));
            }
        } else {
            let keys = Object.keys(obj);
            for (const key of keys) {
                let rule = fmtRules[key];
                if (!rule && obj[key] && obj[key].constructor.name === "Object") rule = Fmt.ofmt;
                if (!rule && obj[key] instanceof Map) rule = Fmt.ofmt;
                kvs.push(key + ':' + ((rule) ? rule(obj[key]) : obj[key]));
            }
        }
        if (name) {
            return `{name:${kvs.join('|')}}`;
        } else {
            return `{${kvs.join('|')}}`;
        }
    }

}