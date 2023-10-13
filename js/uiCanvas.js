export { UiCanvas };

import { Evts } from './evt.js';
import { Hierarchy } from './hierarchy.js';
import { UiView } from './uiView.js';
import { XForm } from './xform.js';

/** ========================================================================
 * class representing base canvas as a UI view
 */
class UiCanvas extends UiView {
    // STATIC VARIABLES ----------------------------------------------------
    static dfltCanvasID = 'game.canvas';
    static canvasable = true;

    // STATIC PROPERTIES ---------------------------------------------------
    static getCanvas(id=this.dfltCanvasID, fit=true) {
        let canvas = document.getElementById(id);
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = id;
            canvas.constructed = true;
            document.body.appendChild(canvas);
        }
        if (fit) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        return canvas;
    }

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('canvasId', { order: -3, readonly: true, parser: (o,x) => x.canvasId || o.constructor.dfltCanvasID });
        this.schema('fitToWindow', { order: -3, readonly: true, dflt: true });
        this.schema('canvas', { order: -2, dflt: (o) => o.constructor.getCanvas(o.canvasId, o.fitToWindow) });
        this.schema('xform', { order: -1, link: true, dflt: (o) => new XForm({ origx: 0, origy: 0, fixedWidth: o.canvas.width, fixedHeight: o.canvas.height }) });
        this.schema('active', { dflt: true });
        this.schema('ctx', { parser: (o,x) => o.canvas.getContext('2d') });
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpre(spec) {
        super.cpre(spec);
        // -- bind event handlers
        this.onWindowResize = this.onWindowResize.bind(this);
    }
    cpost(spec) {
        super.cpost(spec);
        if (!this.fitToWindow) {
            this.canvas.width = this.xform.fixedWidth;
            this.canvas.height = this.xform.fixedHeight;
            Evts.trigger(this, 'CanvasResized', { width: this.canvas.width, height: this.canvas.height });
            for (const dec of Hierarchy.children(this)) {
                Evts.trigger(dec, 'CanvasResized', { canvas: this, width: this.canvas.width, height: this.canvas.height });
            }
        }
        // -- setup event handlers
        if (this.fitToWindow) {
            window.addEventListener('resize', this.onWindowResize); // resize when window resizes
        }
    }

    destroy() {
        if (this.canvas && this.canvas.constructed) this.canvas.remove();
        window.removeEventListener('resize', this.onWindowResize); // resize when window resizes
        super.destroy();
    }

    // METHODS -------------------------------------------------------------
    onWindowResize() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        this.canvas.width = width;
        this.canvas.height = height;
        this.xform.fixedWidth = width;
        this.xform.fixedHeight = height;
        Evts.trigger(this, 'CanvasResized', { width: width, height: height });
        for (const dec of Hierarchy.children(this)) {
            Evts.trigger(dec, 'CanvasResized', { canvas: this, width: width, height: height });
        }
    }  

}
