export { Fmt };

// =========================================================================
class Fmt {
    // STATIC METHODS ------------------------------------------------------
    static toString(name, ...args) {
        return `{${name}:${args.join('|')}}`;
    }

    static ofmt(obj, seen=new WeakSet()) {
        if (seen.has(obj)) return '<circular data>';
        if (!obj) return '';
        seen.add(obj);
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
                tokens.push( (value && (typeof value === 'object')) ? `${key}:${this.ofmt(value, seen)}` : `${key}:${value}` );
            }
            return `{${tokens.join(',')}}`;
        }
        return `${obj}`;
    }

}