export { Fmt };

// =========================================================================
class Fmt {
    // STATIC METHODS ------------------------------------------------------
    static toString(name, ...args) {
        if (args.length) {
            return `{${name}:${args.join('|')}}`;
        }
        return `{${name}}`;
    }

    static ofmt(obj, seen=new WeakSet()) {
        if (!obj) return '';
        if (seen.has(obj)) return '<circular data>';
        if (typeof obj === 'object') seen.add(obj);
        if (obj.$values) {
            return `${obj}`;
        }
        if (obj instanceof Map) {
            const tokens = [];
            for (const [key, value] of obj) {
                tokens.push( (value && (typeof value === 'object')) ? `${key}:${this.ofmt(value, seen)}` : `${key}:${value}` );
            }
            return `<Map:${tokens.join(',')}>`;
        } else if (Array.isArray(obj)) {
            const tokens = [];
            for (const value of obj) {
                tokens.push( (value && (typeof value === 'object')) ?  `${this.ofmt(value, seen)}` : `${value}` );
            }
            return `[${tokens.join(',')}]`;
        } else if (typeof obj === 'object') {
            const tokens = [];
            for (const [key,value] of Object.entries(obj)) {
                if (key === '$link') continue;
                tokens.push( (value && (typeof value === 'object')) ? `${key}:${this.ofmt(value, seen)}` : `${key}:${value}` );
            }
            return `{${tokens.join(',')}}`;
        } else if (typeof obj === 'function') {
            return `fcn<${obj.name}`;
        }
        return `${obj}`;
    }

}