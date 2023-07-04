export { UiPanel };

import { Rect } from './rect.js';
import { UiView } from './uiView.js';

class UiPanel extends UiView {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('sketch', { link: true, parser: (o,x) => (x.hasOwnProperty('sketch')) ? x.sketch : o.constructor.dfltSketch });
        this.schema('fitter', { dflt: 'stretch' });
        this.schema('alignx', { dflt: .5 });
        this.schema('aligny', { dflt: .5 });
    }

    // STATIC PROPERTIES ---------------------------------------------------
    static get dfltSketch() {
        return new Rect({ color: 'rgba(255,255,255,.25)' });
    }

    // METHODS -------------------------------------------------------------
    renderSketch(ctx, sketch ) {
        if (!sketch)  return;
        switch (this.fitter) {
            case 'none': {
                let xo = Math.round((this.xform.width - sketch.width)*this.alignx);
                let yo = Math.round((this.xform.height - sketch.height)*this.aligny);
                sketch.render(ctx, this.xform.minx + xo, this.xform.miny + yo, 0, 0);
                break;
            }
            case 'origin': {
                let wd = Math.round((this.xform.width - sketch.width)*this.xform.origx);
                let hd = Math.round((this.xform.height - sketch.height)*this.xform.origy);
                sketch.render(ctx, this.xform.minx + wd, this.xform.miny + hd, 0, 0);
                break;
            }
            case 'stretchRatio': {
                let x = this.xform.minx;
                let y = this.xform.miny;
                let adjustedWidth = this.xform.width;
                let adjustedHeight = this.xform.height;
                if (this.xform.width && this.xform.height) {
                    let desiredRatio = (sketch.width && sketch.height) ? sketch.width/sketch.height : 1;
                    let currentRatio = this.xform.width/this.xform.height;
                    if (currentRatio>desiredRatio) {
                        adjustedWidth = this.xform.height * desiredRatio;
                        x += Math.round((this.xform.width-adjustedWidth)*this.alignx);
                    } else if (currentRatio<desiredRatio) {
                        adjustedHeight = this.xform.width / desiredRatio;
                        y += Math.round((this.xform.height-adjustedHeight)*this.aligny);
                    }
                }
                sketch.render(ctx, x, y, adjustedWidth, adjustedHeight);
                break;
            }
            case 'tile': {
                if (!this.xform.width || !this.xform.height || !sketch.width || !sketch.height) return;
                // clip to xform area
                ctx.save();
                ctx.beginPath();
                ctx.rect(this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
                ctx.clip();
                // calculate/render tiled sketches
                let wd = ((this.xform.width % sketch.width)-sketch.width) * (this.alignx);
                let hd = ((this.xform.height % sketch.height)-sketch.height) * (this.aligny);
                if (Math.abs(wd) >= sketch.width) wd = 0;
                if (Math.abs(hd) >= sketch.height) hd = 0;
                let x, y;
                for (let i=0; i<(this.xform.width/sketch.width); i++) {
                    for (let j=0; j<(this.xform.height/sketch.height); j++) {
                        x = wd + i*sketch.width;
                        y = hd + j*sketch.height;
                        sketch.render(ctx, this.xform.minx+x, this.xform.miny+y);
                    }
                }
                // restore context to remove clip
                ctx.restore();
                break;
            }
            case 'autotile': {
                if (!this.xform.width || !this.xform.height || !sketch.width || !sketch.height) return;
                let xtiles = (this.xform.width > sketch.width) ? Math.floor(this.xform.width/sketch.width) : 1;
                let scaledWidth = this.xform.width/xtiles;
                let ytiles = (this.xform.height > sketch.height) ? Math.floor(this.xform.height/sketch.height) : 1;
                let scaledHeight = this.xform.height/ytiles;
                for (let i=0; i<xtiles; i++) {
                    for (let j=0; j<ytiles; j++) {
                        let x = i*scaledWidth;
                        let y = j*scaledHeight;
                        sketch.render(ctx, this.xform.minx+x, this.xform.miny+y, scaledWidth, scaledHeight);
                    }
                }
                break;
            }
            case 'stretch':
            default: {
                //Stats.enabled = true;
                sketch.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
                //Stats.enabled = false;
                break;
            }
        }
    }

    subrender(ctx) {
        this.renderSketch(ctx, this.sketch);
    }

}
