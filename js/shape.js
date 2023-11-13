export { Shape };

import { Fmt } from './fmt.js';
import { Sketch } from './sketch.js';
import { Vect } from './vect.js';

/** ========================================================================
 * A shape is a simple sketch primitive utilizing js Path2D to render a shape
 */
class Shape extends Sketch {

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('border', {dflt: 0});
        this.schema('fill', {dflt: true});
        this.schema('color', {dflt: 'rgba(127,127,127,.75'});
        this.schema('borderColor', {dflt: 'black'});
        this.schema('dash', {dflt: null});
        this.schema('verts', {dflt: () => [{x:0,y:0}, {x:20,y:0}, {x:20,y:20}, {x:0,y:20}], readonly: true});
        this.schema('path', { generator: (o, ov) => o.constructor.toPath(o.verts)});
        this.schema('min', { generator: (o, ov) => Vect.min(...o.verts) });
        this.schema('max', { generator: (o, ov) => Vect.max(...o.verts) });
        this.schema('width', { generator: (o, ov) => (o.max.x-o.min.x) });
        this.schema('height', { generator: (o, ov) => (o.max.y-o.min.y) });
    }

    static toPath(verts) {
        let path = new Path2D();
        path.moveTo(verts[0].x, verts[0].y);
        for (let i=1; i<verts.length; i++) {
            let vert = verts[i];
            path.lineTo(vert.x, vert.y);
        }
        path.closePath();
        return path;
    }

    // METHODS -------------------------------------------------------------
    subrender(ctx, x=0, y=0, width=0, height=0) {
        // default width/height to internal width/height if not specified
        if (!width) width = this.width;
        if (!height) height = this.height;
        // translate
        let cform = ctx.getTransform();
        if (x || y) ctx.translate(x, y);
        let scalex = 1, scaley = 1;
        if (width !== this.width || height !== this.height) {
            scalex = width/this.width;
            scaley = height/this.height;
            ctx.scale(scalex, scaley);
        }
        //if (this.min.x || this.min.y) ctx.translate(-this.min.x, -this.min.y);
        if (this.fill) {
            ctx.fillStyle = this.color;
            ctx.fill(this.path);
        }
        if (this.border) {
            ctx.lineWidth = this.border;
            ctx.strokeStyle = this.borderColor;
            ctx.stroke(this.path);
        }
        ctx.setTransform(cform);
    }    
}