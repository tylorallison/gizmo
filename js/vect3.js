export { Vect3 };

import { Fmt } from './fmt.js';
import { Gadget } from './gizmo.js';

// =========================================================================
class Vect3 extends Gadget {
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('x', { dflt: 0 });
        this.schema('y', { dflt: 0 });
        this.schema('z', { dflt: 0 });
    }

    // STATIC PROPERTIES ---------------------------------------------------
    static get zero() {
        return new Vect3();
    }

    static get maxValue() {
        return new Vect3({x:Number.MAX_SAFE_INTEGER, y:Number.MAX_SAFE_INTEGER, z:Number.MAX_SAFE_INTEGER});
    }

    // PROPERTIES ----------------------------------------------------------
    get mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    set mag(v) {
        this.normalize().smult(v);
    }
    get sqmag() {
        return this.x*this.x + this.y*this.y + this.z*this.z;
    }

    // STATIC METHODS ------------------------------------------------------
    static iVect3(obj) {
        return obj && ('x' in obj) && ('y' in obj) && ('z' in obj);
    }

    static add(...vs) {
        const r = new Vect3();
        for (const v of vs) {
            if (v) {
                if ('x' in v) r.x += v.x;
                if ('y' in v) r.y += v.y;
                if ('z' in v) r.z += v.z;
            }
        }
        return r;
    }

    static sadd(v1, ...vs) {
        const r = new Vect3(v1);
        for (const v of vs) {
            r.x += v;
            r.y += v;
            r.z += v;
        }
        return r;
    }

    static sub(v1, ...vs) {
        const r = new Vect3(v1);
        for (const v of vs) {
            if (v) {
                if ('x' in v) r.x -= v.x;
                if ('y' in v) r.y -= v.y;
                if ('z' in v) r.z -= v.z;
            }
        }
        return r;
    }

    static ssub(v1, ...vs) {
        const r = new Vect3(v1);
        for (const v of vs) {
            r.x -= v;
            r.y -= v;
            r.z -= v;
        }
        return r;
    }

    static mult(v1, ...vs) {
        const r = new Vect3(v1);
        for (const v of vs) {
            if (v) {
                if ('x' in v) r.x *= v.x;
                if ('y' in v) r.y *= v.y;
                if ('z' in v) r.z *= v.z;
            }
        }
        return r;
    }

    static smult(v1, ...vs) {
        const r = new Vect3(v1);
        for (const v of vs) {
            r.x *= v;
            r.y *= v;
            r.z *= v;
        }
        return r;
    }

    static div(v1, ...vs) {
        const r = new Vect3(v1);
        for (const v of vs) {
            if (v) {
                if ('x' in v) r.x /= v.x;
                if ('y' in v) r.y /= v.y;
                if ('z' in v) r.z /= v.z;
            }
        }
        return r;
    }

    static sdiv(v1, ...vs) {
        const r = new Vect3(v1);
        for (const v of vs) {
            r.x /= v;
            r.y /= v;
            r.z /= v;
        }
        return r;
    }

    static dot(v1, v2) {
        if (!v1 || !v2) return NaN;
        return ((v1.x||0)*(v2.x||0)) + ((v1.y||0)*(v2.y||0)) + ((v1.z||0)*(v2.z||0));
    }

    static dist(v1, v2) {
        if (!v1 || !v2) return NaN;
        const dx = (v2.x||0)-(v1.x||0);
        const dy = (v2.y||0)-(v1.y||0);
        const dz = (v2.z||0)-(v1.z||0);
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    static mag(v1) {
        if (!v1) return NaN;
        return Math.sqrt((v1.x||0)*(v1.x||0) + (v1.y||0)*(v1.y||0) + (v1.z||0)*(v1.z||0));
    }

    static normalize(v1) {
        if (!v1) return null;
        let m = Math.sqrt((v1.x||0)*(v1.x||0) + (v1.y||0)*(v1.y||0) + (v1.z||0)*(v1.z||0));
        return new Vect3({x:(v1.x||0)/m, y:(v1.y||0)/m, z:(v1.z||0)/m});
    }

    // FIXME: add heading (given axis), rotate, angle

    static min(v1, ...vs) {
        const r = new Vect3(v1);
        for (const v of vs) {
            if (('x' in v) && (v.x < r.x)) r.x = v.x;
            if (('y' in v) && (v.y < r.y)) r.y = v.y;
            if (('z' in v) && (v.z < r.z)) r.z = v.z;
        }
        return r;
    }

    static max(v1, ...vs) {
        const r = new Vect3(v1);
        for (const v of vs) {
            if (('x' in v) && (v.x > r.x)) r.x = v.x;
            if (('y' in v) && (v.y > r.y)) r.y = v.y;
            if (('z' in v) && (v.z > r.z)) r.z = v.z;
        }
        return r;
    }

    static round(v1) {
        if (!v1) return null;
        return new Vect3({x:Math.round(v1.x || 0), y:Math.round(v1.y || 0), z:Math.round(v1.z || 0)});
    }

    static reflect(v, n) {
        //𝑟 = 𝑑−2(𝑑⋅𝑛)𝑛
        let dot = this.dot(v,n);
        return this.sub(this.smult(n, 2*dot), v);
    }

    static neg(v1) {
        if (!v1) return null;
        return new Vect3({x: ('x' in v1) ? -v1.x : 0, y: ('y' in v1) ? -v1.y: 0, z: ('z' in v1) ? -v1.z : 0});
    }

    static equals(v1, v2) {
        if (!v1 && !v2) return true;
        if (v1 && !v1 || !v1 && v2) return false;
        return ((v1.x === v2.x) && (v1.y === v2.y) && (v1.z === v2.z));
    }

    // METHODS -------------------------------------------------------------
    copy() {
        return new Vect3(this);
    }

    set(spec={}) {
        if (spec && ('x' in spec)) this.x = spec.x;
        if (spec && ('y' in spec)) this.y = spec.y;
        if (spec && ('z' in spec)) this.z = spec.z;
        return this;
    }

    add(...vs) {
        for (const v of vs) {
            if (v) {
                if ('x' in v) this.x += v.x;
                if ('y' in v) this.y += v.y;
                if ('z' in v) this.z += v.z;
            }
        }
        return this;
    }

    sadd(...vs) {
        for (const v of vs) {
            this.x += v;
            this.y += v;
            this.z += v;
        }
        return this;
    }

    sub(...vs) {
        for (const v of vs) {
            if (v) {
                if ('x' in v) this.x -= v.x;
                if ('y' in v) this.y -= v.y;
                if ('z' in v) this.z -= v.z;
            }
        }
        return this;
    }

    ssub(...vs) {
        for (const v of vs) {
            this.x -= v;
            this.y -= v;
            this.z -= v;
        }
        return this;
    }

    mult(...vs) {
        for (const v of vs) {
            if (v) {
                if ('x' in v) this.x *= v.x;
                if ('y' in v) this.y *= v.y;
                if ('z' in v) this.z *= v.z;
            }
        }
        return this;
    }

    smult(...vs) {
        for (const v of vs) {
            this.x *= v;
            this.y *= v;
            this.z *= v;
        }
        return this;
    }

    div(...vs) {
        for (const v of vs) {
            if (v) {
                if ('x' in v) this.x /= v.x;
                if ('y' in v) this.y /= v.y;
                if ('z' in v) this.z /= v.z;
            }
        }
        return this;
    }

    sdiv(...vs) {
        for (const v of vs) {
            this.x /= v;
            this.y /= v;
            this.z /= v;
        }
        return this;
    }

    dot(v2) {
        if (!v2) return NaN;
        return this.x*(v2.x||0) + this.y*(v2.y||0) + this.z*(v2.z||0);
    }

    dist(v2) {
        if (!v2) return NaN;
        const dx = (v2.x||0)-this.x;
        const dy = (v2.y||0)-this.y;
        const dz = (v2.z||0)-this.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    normalize() {
        let m = this.mag;
        if (m != 0) this.sdiv(m);
        return this;
    }

    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);
        return this;
    }

    reflect(n) {
        //𝑟 = 𝑑−2(𝑑⋅𝑛)𝑛
        let dot = this.dot(n);
        return this.neg().add(Vect3.smult(n, 2*dot));
    }

    neg() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    // FIXME
    heading(rad = false) {
        let a = Math.atan2(this.y, this.x);
        if (rad) return a;
        return a * 180 / Math.PI;
    }

    // FIXME
    rotate(angle, rad = false) {
        let ra = (rad) ? angle : angle * Math.PI / 180;
        ra += this.heading(true);
        let m = this.mag;
        this.x = Math.cos(ra) * m;
        this.y = Math.sin(ra) * m;
        return this;
    }

    // FIXME
    angle(xorv, y, rad = false) {
        let x2, y2;
        if (typeof xorv === 'number') {
            x2 = (xorv || 0);
            y2 = (y || 0);
        } else {
            x2 = xorv.x || 0;
            y2 = xorv.y || 0;
        }
        let a1 = Math.atan2(this.y, this.x);
        let a2 = Math.atan2(y2, x2);
        let angle = a2 - a1;
        // handle angles > 180
        if (Math.abs(angle) > Math.PI) {
            angle = (angle > 0) ? -(angle - Math.PI) : -(angle + Math.PI);
        }
        if (rad) return angle;
        return angle * 180 / Math.PI;
    }

    equals(v2) {
        if (!v2) return false;
        return (this.x === v2.x && this.y === v2.y && this.z === v2.z);
    }

    limit(max) {
        if (this.sqmag > max * max) {
            this.mag = max;
        }
        return this;
    }

    min(...vs) {
        for (const v of vs) {
            if (v) {
                if (('x' in v) && (v.x < this.x)) this.x = v.x;
                if (('y' in v) && (v.y < this.y)) this.y = v.y;
                if (('z' in v) && (v.z < this.z)) this.z = v.z;
            }
        }
        return this;
    }

    max(...vs) {
        for (const v of vs) {
            if (v) {
                if (('x' in v) && (v.x > this.x)) this.x = v.x;
                if (('y' in v) && (v.y > this.y)) this.y = v.y;
                if (('z' in v) && (v.z > this.z)) this.z = v.z;
            }
        }
        return this;
    }

    toString() {
        return Fmt.toString('Vect3', this.x, this.y, this.z);
    }

}