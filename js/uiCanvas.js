export { UiCanvas };

import { Evts } from './evt.js';
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
    static getCanvas(id=this.dfltCanvasID) {
        let canvas = document.getElementById(id);
        if (canvas) return canvas;
        canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.constructed = true;
        document.body.appendChild(canvas);
        return canvas;
    }

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('active', {dflt: true});
        this.schema('canvasId', { readonly: true, parser: (o,x) => x.canvasId || o.constructor.dfltCanvasID });
        this.schema('canvas', { parser: (o,x) => x.canvas || o.constructor.getCanvas(o.canvasId) });
        this.schema('xform', { link: true, parser: (o,x) => x.xform || new XForm({ origx: 0, origy: 0, fixedWidth: o.canvas.width, fixedHeight: o.canvas.height }) });
        this.schema('ctx', { parser: (o,x) => o.canvas.getContext('2d') });
        this.schema('fitToWindow', { readonly: true, dflt: true });
    }

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpre(spec) {
        super.cpre(spec);
        // -- bind event handlers
        this.onWindowResize = this.onWindowResize.bind(this);
    }
    cpost(spec) {
        super.cpost(spec);
        // -- handle fit to window
        let targetWidth = this.xform.fixedWidth;
        let targetHeight = this.xform.fixedHeight;
        if (this.fitToWindow) {
            targetWidth = window.innerWidth;
            targetHeight = window.innerHeight;
        }
        // -- adjust xform/canvas to target dimensions
        this.canvas.width = this.xform.fixedWidth = targetWidth;
        this.canvas.height = this.xform.fixedHeight = targetHeight;
        //console.log(`canvas xform: ${this.xform.bounds}`);
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
        Evts.trigger(this, 'gizmo.resized', { width: width, height: height });
        // FIXME: remove?
        /*
        for (const child of Hierarchy.children(this)) {
            Evts.trigger(child, 'gizmo.resized', { root: this });
        }
        */
    }  

}
