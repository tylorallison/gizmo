export { TextToken };

import { Bounds } from './bounds.js';
import { Fmt } from './fmt.js';
import { Schema } from './schema.js';
import { Sketch } from './sketch.js';
import { TextFormat } from './textFormat.js';

class TextToken extends Sketch {
    // STATIC VARIABLES ----------------------------------------------------
    static textCanvas = document.createElement('canvas');
    static textCtx = this.textCanvas.getContext('2d');
    static dfltColor = 'black';
    static dfltBorderColor = 'white';
    static dfltHighlightColor = 'yellow';
    static dfltText = 'default text';

    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'text', { dflt: 'default text', renderable: true });
        Schema.apply(this, 'fmt', { renderable: true, link: true, parser: (o,x) => (x.fmt || new TextFormat())});
        Schema.apply(this, 'alignx', { dflt: .5, renderable: true });
        Schema.apply(this, 'aligny', { dflt: .5, renderable: true });
        Schema.apply(this, 'width', { readonly: true, getter: ((o,x) => ( o.fmt.measure(o.text).x ))});
        Schema.apply(this, 'height', { readonly: true, getter: ((o,x) => ( o.fmt.measure(o.text).y ))});
    }

    // METHODS -------------------------------------------------------------
    subrender(ctx, x=0, y=0, width=0, height=0) {
        let fmt = this.fmt;
        let tsize = fmt.measure(this.text);

        // scale if necessary
        if ((width && width !== this.width) || (height && height !== this.height)) {
            fmt = this.fmt.copy();
            // grow
            if (tsize.x < width && tsize.y < height) {
                while (fmt.size < 1000 && tsize.x < width && tsize.y < height) {
                    fmt.size++;
                    tsize = fmt.measure(this.text);
                }
                fmt.size -= 1;
                tsize = fmt.measure(this.text);
            // shrink
            } else {
                while (fmt.size > 1 && (tsize.x > width || tsize.y > height)) {
                    fmt.size--;
                    tsize = fmt.measure(this.text);
                }
            }
            this.fmt.size = fmt.size;
        }

        // text box positions
        let tx = (width) ? (width-tsize.x)*this.alignx : 0;
        let ty = (height) ? (height-tsize.y)*this.aligny : 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        if (this.fmt.highlight) {
            ctx.fillStyle = this.fmt.highlightColor;
            ctx.fillRect(x+tx, y+ty, tsize.x, tsize.y);
        }
        ctx.fillStyle = this.fmt.color;
        ctx.font = fmt.font;
        ctx.fillText(this.text, x+tx, y+ty);
        if (this.fmt.border) {
            ctx.lineWidth = this.fmt.border;
            ctx.strokeStyle = this.fmt.borderColor;
            ctx.strokeText(this.text, x+tx, y+ty);
        }
    }

    getCharBounds(idx) {
        if (idx < 0) idx = 0;
        if (idx > this.text.length) idx = this.text.length;
        let left = this.fmt.measure( this.text.slice(0,idx) );
        let right = this.fmt.measure( this.text.slice(0,Math.min(idx, this.text.length)) );
        return new Bounds(left.x, 0, right.x-left.x, left.y);
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.text);
    }

}