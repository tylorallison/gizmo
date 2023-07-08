export{ Vect };
import { Fmt } from './fmt.js';
import { Gadget } from './gizmo.js';

// =========================================================================
class Vect extends Gadget {
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('x', { dflt: 0 });
        this.schema('y', { dflt: 0 });
    }

    // STATIC PROPERTIES ---------------------------------------------------
    static get zero() {
        return new Vect();
    }

    static get maxValue() {
        return new Vect({x: Number.MAX_SAFE_INTEGER, y:Number.MAX_SAFE_INTEGER});
    }

    // PROPERTIES ----------------------------------------------------------
    get mag() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
    set mag(v) {
        this.normalize().smult(v);
    }
    get sqmag() {
        return this.x*this.x + this.y*this.y;
    }

    // STATIC METHODS ------------------------------------------------------
    static iVect(obj) {
        return obj && ('x' in obj) && ('y' in obj);
    }

    static add(...vs) {
        const r = new Vect();
        for (const v of vs) {
            if (v) {
                if ('x' in v) r.x += v.x;
                if ('y' in v) r.y += v.y;
            }
        }
        return r;
    }

    static sadd(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            r.x += v;
            r.y += v;
        }
        return r;
    }

    static sub(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            if (v) {
                if ('x' in v) r.x -= v.x;
                if ('y' in v) r.y -= v.y;
            }
        }
        return r;
    }

    static ssub(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            r.x -= v;
            r.y -= v;
        }
        return r;
    }

    static mult(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            if (v) {
                if ('x' in v) r.x *= v.x;
                if ('y' in v) r.y *= v.y;
            }
        }
        return r;
    }

    static smult(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            r.x *= v;
            r.y *= v;
        }
        return r;
    }

    static div(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            if (v) {
                if ('x' in v) r.x /= v.x;
                if ('y' in v) r.y /= v.y;
            }
        }
        return r;
    }

    static sdiv(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            r.x /= v;
            r.y /= v;
        }
        return r;
    }

    static dot(v1, v2) {
        if (!v1 || !v2) return NaN;
        return ((v1.x||0)*(v2.x||0)) + ((v1.y||0)*(v2.y||0));
    }

    static _cross(v1x, v1y, v2x, v2y) {
        return (v1x*v2y) - (v1y*v2x);
    }
    static cross(v1,v2) {
        if (!v1 || !v2) return NaN;
        return ((v1.x||0)*(v2.y||0)) - ((v1.y||0)*(v2.x||0));
    }

    static _dist(v1x, v1y, v2x, v2y) {
        const dx = (v2x||0)-(v1x||0);
        const dy = (v2y||0)-(v1y||0);
        return Math.sqrt(dx*dx + dy*dy);
    }
    static dist(v1, v2) {
        if (!v1 || !v2) return NaN;
        return this._dist(v1.x, v1.y, v2.x, v2.y);
    }

    static mag(v1) {
        if (!v1) return NaN;
        return Math.sqrt((v1.x||0)*(v1.x||0) + (v1.y||0)*(v1.y||0));
    }

    static normalize(v1) {
        if (!v1) return null;
        let m = Math.sqrt((v1.x||0)*(v1.x||0) + (v1.y||0)*(v1.y||0));
        return new Vect({x:(v1.x||0)/m, y:(v1.y||0)/m});
    }

    static heading(v1, rad=true) {
        if (!v1) return NaN;
        let a = Math.atan2(v1.y||0, v1.x||0);
        if (rad) return a;
        return a*180/Math.PI;
    }

    static rotate(v1, angle, rad=true) {
        if (!v1) return null;
        let ra = (rad) ? angle : angle*Math.PI/180;
        ra += this.heading(v1, true);
        let m = this.mag(v1);
        return new Vect({x: Math.cos(ra)*m, y: Math.sin(ra)*m});
    }

    static angle(v1, v2, rad=true) {
        if (!v1 || !v2) return NaN;
        let a1 = Math.atan2(v1.y||0, v1.x||0);
        let a2 = Math.atan2(v2.y||0, v2.x||0);
        let angle = a2-a1;
        // handle angles > 180
        if (Math.abs(angle) > Math.PI) {
            angle = (angle>0) ? -(angle-Math.PI) : -(angle+Math.PI);
        }
        if (rad) return angle;
        return angle*180/Math.PI;
    }

    static min(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            if (('x' in v) && (v.x < r.x)) r.x = v.x;
            if (('y' in v) && (v.y < r.y)) r.y = v.y;
        }
        return r;
    }

    static max(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            if (('x' in v) && (v.x > r.x)) r.x = v.x;
            if (('y' in v) && (v.y > r.y)) r.y = v.y;
        }
        return r;
    }

    static round(v1) {
        if (!v1) return null;
        return new Vect({x:Math.round(v1.x||0), y:Math.round(v1.y||0)});
    }

    static reflect(v, n) {
        //𝑟 = 𝑑−2(𝑑⋅𝑛)𝑛
        let dot = this.dot(v,n);
        return this.sub(this.smult(n, 2*dot), v);
    }

    static neg(v1) {
        if (!v1) return null;
        return new Vect({x: ('x' in v1) ? -v1.x : 0, y: ('y' in v1) ? -v1.y: 0});
    }

    static equals(v1, v2) {
        if (!v1 && !v2) return true;
        if (v1 && !v1 || !v1 && v2) return false;
        return ((v1.x === v2.x) && (v1.y === v2.y));
    }

    // METHODS -------------------------------------------------------------
    copy() {
        return new Vect(this);
    }

    set(spec={}) {
        if (spec && ('x' in spec)) this.x = spec.x;
        if (spec && ('y' in spec)) this.y = spec.y;
        return this;
    }

    add(...vs) {
        for (const v of vs) {
            if (v) {
                if ('x' in v) this.x += v.x;
                if ('y' in v) this.y += v.y;
            }
        }
        return this;
    }

    sadd(...vs) {
        for (const v of vs) {
            this.x += v;
            this.y += v;
        }
        return this;
    }

    sub(...vs) {
        for (const v of vs) {
            if (v) {
                if ('x' in v) this.x -= v.x;
                if ('y' in v) this.y -= v.y;
            }
        }
        return this;
    }

    ssub(...vs) {
        for (const v of vs) {
            this.x -= v;
            this.y -= v;
        }
        return this;
    }

    mult(...vs) {
        for (const v of vs) {
            if (v) {
                if ('x' in v) this.x *= v.x;
                if ('y' in v) this.y *= v.y;
            }
        }
        return this;
    }

    smult(...vs) {
        for (const v of vs) {
            this.x *= v;
            this.y *= v;
        }
        return this;
    }

    div(...vs) {
        for (const v of vs) {
            if (v) {
                if ('x' in v) this.x /= v.x;
                if ('y' in v) this.y /= v.y;
            }
        }
        return this;
    }

    sdiv(...vs) {
        for (const v of vs) {
            this.x /= v;
            this.y /= v;
        }
        return this;
    }

    dot(v2) {
        if (!v2) return NaN;
        return this.x*(v2.x||0) + this.y*(v2.y||0);
    }

    cross(v2) {
        if (!v2) return NaN;
        return this.x*(v2.y||0) - this.y*(v2.x||0);
    }

    dist(v2) {
        if (!v2) return NaN;
        const dx = (v2.x||0)-this.x;
        const dy = (v2.y||0)-this.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    normalize() {
        let m = this.mag;
        if (m != 0) this.sdiv(m);
        return this;
    }

    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    reflect(n) {
        //𝑟 = 𝑑−2(𝑑⋅𝑛)𝑛
        let dot = this.dot(n);
        return this.neg().add(Vect.smult(n, 2*dot));
    }

    neg() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    heading(rad=true) {
        let a = Math.atan2(this.y, this.x);
        if (rad) return a;
        return a*180/Math.PI;
    }

    rotate(angle, rad=true) {
        let ra = (rad) ? angle : angle*Math.PI/180;
        ra += this.heading(true);
        let m = this.mag;
        this.x = Math.cos(ra) * m;
        this.y = Math.sin(ra) * m;
        return this;
    }

    angle(v2, rad=true) {
        if (!v2) return NaN;
        let a1 = Math.atan2(this.y, this.x);
        let a2 = Math.atan2(v2.y||0, v2.x||0);
        let angle = a2-a1;
        // handle angles > 180
        if (Math.abs(angle) > Math.PI) {
            angle = (angle>0) ? -(angle-Math.PI) : -(angle+Math.PI);
        }
        if (rad) return angle;
        return angle*180/Math.PI;
    }

    equals(v2) {
        if (!v2) return false;
        return (this.x === v2.x && this.y === v2.y);
    }

    limit(max) {
        if (this.sqmag > max*max) {
            this.mag = max;
        }
        return this;
    }

    min(...vs) {
        for (const v of vs) {
            if (v) {
                if (('x' in v) && (v.x < this.x)) this.x = v.x;
                if (('y' in v) && (v.y < this.y)) this.y = v.y;
            }
        }
        return this;
    }

    max(...vs) {
        for (const v of vs) {
            if (v) {
                if (('x' in v) && (v.x > this.x)) this.x = v.x;
                if (('y' in v) && (v.y > this.y)) this.y = v.y;
            }
        }
        return this;
    }

    toString() {
        return Fmt.toString('Vect', this.x, this.y);
    }

}