export{ Vect };
import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';

// =========================================================================
class Vect extends GizmoData {
    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'x', { dflt: 0 });
        Schema.apply(this, 'y', { dflt: 0 });
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
        this.normalize().mult(v);
    }
    get sqmag() {
        return this.x*this.x + this.y*this.y;
    }

    // STATIC METHODS ------------------------------------------------------
    static iVect(obj) {
        return obj && 
               obj.x !== undefined &&
               obj.y !== undefined;
    }

    static add(...vs) {
        const r = new Vect();
        for (const v of vs) {
            if (v) {
                r.x += v.x;
                r.y += v.y;
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
                r.x -= v.x;
                r.y -= v.y;
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
                r.x *= v.x;
                r.y *= v.y;
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
                r.x /= v.x;
                r.y /= v.y;
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
        return (v1.x*v2.x) (v1.y*v2.y);
    }

    static dist(v1, v2) {
        if (!v1 || !v2) return NaN;
        const dx = v2.x-v1.x;
        const dy = v2.y-v1.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    static min(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            if (v.x < r.x) r.x = v.x;
            if (v.y < r.y) r.y = v.y;
        }
        return r;
    }

    static max(v1, ...vs) {
        const r = new Vect(v1);
        for (const v of vs) {
            if (v.x > r.x) r.x = v.x;
            if (v.y > r.y) r.y = v.y;
        }
        return r;
    }

    static round(v1) {
        if (!v1) return new Vect({x:NaN,y:NaN});
        return new Vect({x:Math.round(v1.x),y:Math.round(v1.y)});
    }

    static reflect(v, n) {
        //𝑟 = 𝑑−2(𝑑⋅𝑛)𝑛
        let dot = this.dot(v,n);
        return this.sub(this.mult(n, 2*dot), v);
    }

    static neg(v1) {
        if (!v1) return new Vect({x:NaN,y:NaN});
        return new Vect(-v1.x, -v1.y);
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
        if (spec && spec.hasOwnProperty('x')) this.x = spec.x;
        if (spec && spec.hasOwnProperty('y')) this.y = spec.y;
        return this;
    }

    add(...vs) {
        for (const v of vs) {
            if (v) {
                this.x += v.x;
                this.y += v.y;
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
                this.x -= v.x;
                this.y -= v.y;
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
                this.x *= v.x;
                this.y *= v.y;
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
                this.x /= v.x;
                this.y /= v.y;
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
        return this.x*v2.x + this.y*v2.y;
    }

    dist(v2) {
        if (!v2) return NaN;
        const dx = v2.x-this.x;
        const dy = v2.y-this.y;
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
        return this.neg().add(Vect.mult(n, 2*dot));
    }

    neg() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    heading(rad=false) {
        let a = Math.atan2(this.y, this.x);
        if (rad) return a;
        return a*180/Math.PI;
    }

    rotate(angle, rad=false) {
        let ra = (rad) ? angle : angle*Math.PI/180;
        ra += this.heading(true);
        let m = this.mag;
        this.x = Math.cos(ra) * m;
        this.y = Math.sin(ra) * m;
        return this;
    }

    angle(xorv, y, rad=false) {
        let x2, y2;
        if (typeof xorv === 'number') {
            x2 = (xorv||0);
            y2 = (y||0);
        } else {
            x2 = xorv.x || 0;
            y2 = xorv.y || 0;
        }
        let a1 = Math.atan2(this.y, this.x);
        let a2 = Math.atan2(y2, x2);
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
                if (v.x < this.x) this.x = v.x;
                if (v.y < this.y) this.y = v.y;
            }
        }
        return this;
    }

    max(...vs) {
        for (const v of vs) {
            if (v) {
                if (v.x > this.x) this.x = v.x;
                if (v.y > this.y) this.y = v.y;
            }
        }
        return this;
    }

    toString() {
        return Fmt.toString('Vect', this.x, this.y);
    }

}