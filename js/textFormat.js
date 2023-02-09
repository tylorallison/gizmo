export { TextFormat };

import { Fmt } from './fmt.js';
import { GizmoData } from './gizmoData.js';
import { Schema } from './schema.js';
import { Stats } from './stats.js';
import { Vect } from './vect.js';

class TextFormat extends GizmoData {
    static textCanvas = document.createElement('canvas');
    static textCtx = this.textCanvas.getContext('2d');

    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'style', { dflt: 'normal' });
        Schema.apply(this, 'variant', { dflt: 'normal' });
        Schema.apply(this, 'weight', { dflt: 'normal' });
        Schema.apply(this, 'size', { dflt: 12 });
        Schema.apply(this, 'family', { dflt: 'sans-serif' });
        Schema.apply(this, 'color', { dflt: 'black' });
        Schema.apply(this, 'border', { dflt: 0 });
        Schema.apply(this, 'borderColor', { dflt: 'white' });
        Schema.apply(this, 'highlight', { dflt: false });
        Schema.apply(this, 'highlightColor', { dflt: 'yellow' });
    }

    static parse(str) {
        let kvs = str.split(' ');
        let spec = {};
        for (var [k,v] of kvs.map((v) => v.split('=', 2))) {
            switch (k) {
                case 'B':
                case 'b': {
                    spec.weight = 'bold';
                    break;
                }
                case 'I':
                case 'i': {
                    spec.style = 'italic';
                    break;
                }
                case 'H':
                case 'h': {
                    spec.highlight = true;
                    break;
                }
                case 'size': 
                case 'border': 
                case 'delta': 
                {
                    spec[k] = parseInt(v);
                    break;
                }
                default: {
                    if (v) spec[k] = v;
                    break;
                }
            }
        }
        return spec;
    }

    // CONSTRUCTOR ---------------------------------------------------------
    constructor(spec={}) {
        spec.size = spec.size || 12;
        if (spec.hasOwnProperty('delta')) spec.size += spec.delta;
        super(spec);
    }

    // PROPERTIES ----------------------------------------------------------
    get font() {
        return `${this.style} ${this.variant} ${this.weight} ${this.size}px ${this.family}`;
    }

    // METHODS -------------------------------------------------------------
    measure(text) {
        Stats.count('textFormat.measure');
        const ctx = this.constructor.textCtx;
        ctx.font = this.font;
        const metrics = ctx.measureText(text);
        let h = Math.max(0, metrics.fontBoundingBoxAscent) + Math.max(0, metrics.fontBoundingBoxDescent);
        let w = Math.max(0, metrics.actualBoundingBoxLeft) + Math.max(0, metrics.actualBoundingBoxRight);
        // if text ends with a trailing space, measureText strips that off when calculating...
        // cheat by adding a random character to text string and subtract width of that char to get total width
        if (text.endsWith(' ')) {
            // measure a space...
            const m1 = ctx.measureText(text+'x');
            const m2 = ctx.measureText('x');
            let m1w = Math.max(0, m1.actualBoundingBoxLeft) + Math.max(0, m1.actualBoundingBoxRight);
            let m2w = Math.max(0, m2.actualBoundingBoxLeft) + Math.max(0, m2.actualBoundingBoxRight);
            w = m1w-m2w;
        }
        return new Vect(w, h);
    }

    copy(overrides={}) {
        return new this.constructor(Object.assign({}, this, overrides));
    }

    toString() {
        return Fmt.toString(this.constructor.name, Fmt.ofmt(this));
    }

}

