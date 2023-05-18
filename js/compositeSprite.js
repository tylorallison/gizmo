export { CompositeSprite };

import { resolveImage } from './refs.js';
import { Sketch } from './sketch.js';

class CompositeSprite extends Sketch {

    static {
        this.schema(this, 'img', {});
        this.schema(this, 'stack', {readonly: true, link: false, dflter: () => []});
        this.schema(this, 'width', {dflt: 0});
        this.schema(this, 'height', {dflt: 0});
    }

    static {
        this._canvas = document.createElement('canvas');
        this._ctx = this._canvas.getContext('2d');
    }

    // METHODS -------------------------------------------------------------
    resolve() {
        this.img = null;
        let canvas = this.constructor._canvas;
        let ctx = this.constructor._ctx;
        canvas.width = this.width;
        canvas.height = this.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log(`-- resolve`)
        for (let i=0; i<this.stack.length; i++) {
            let sketch = this.stack[i].sketch;
            sketch.render(ctx, 0, 0);
        console.log(`render sketch: ${sketch}`);
        }
        let promise = resolveImage(canvas.toDataURL(), false);
        promise.then((img) => this.img = img);
    }

    add(tag, sketch, idx=-1) {
        if (idx === -1) idx = this.stack.length;
        if (sketch.width > this.width) this.width = sketch.width;
        if (sketch.height > this.height) this.height = sketch.height;
        this.stack.splice(idx, 0, {tag: tag, sketch: sketch});
        this.resolve();
    }

    remove(tag) {
        for (let i=0; i<this.stack.length; i++) {
            if (this.stack[i].tag === tag) {
                this.stack.splice(i, 1);
                return;
            }
        }
        this.resolve();
    }

    subrender(ctx, x=0, y=0, width=0, height=0) {
        if (!this.img) return;
        // scale if necessary
        if ((width && width !== this.width) || (height && height !== this.height)) {
            if (this.width && this.height) {
                // src dims
                let sw = this.width;
                let sh = this.height;
                // dst dims
                let dw = width;
                let dh = height;
                ctx.drawImage(this.img, 
                    0, 0, sw, sh, 
                    x, y, dw, dh);
            }
        } else {
            ctx.drawImage(this.img, x, y);
        }
    }

}