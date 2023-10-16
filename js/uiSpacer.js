export { UiVerticalSpacer, UiHorizontalSpacer }

import { Evts } from './evt.js';
import { UiView } from './uiView.js';

class UiVerticalSpacer extends UiView {
    static { this.schema('aligny', { dflt: .5 }); }
    static { this.schema('size', { dflt: .1 }); }
    static { this.schema('spacer', { dflt: 0 }); }
    cpost(spec) {
        super.cpost(spec);
        console.log(`children: ${this.children}`);
        this.resize();
    }

    $onGizmoChilded(evt) {
        this.resize();
    }

    $onGizmoUnchilded(evt) {
        this.resize();
    }

    resize() {
        console.log(`this.children: ${this.children}`);
        if (this.children && this.children.length) {
            // calculate row size
            let size = this.size;
            let spacer = this.spacer;
            let maxSize = this.children.length * size + (this.children.length-1)*spacer;
            console.log(`size: ${size} spacer: ${spacer} max: ${maxSize}`);
            let otop = 0;
            if (maxSize > 1) {
                let factor = 1/maxSize;
                size *= factor;
                spacer *= factor;
            } else {
                let delta = 1-maxSize;
                otop = delta * this.aligny;
            }
            let total = size + spacer;
            for (let i=0; i<this.children.length; i++) {
                let top = otop + total*i;
                let bottom = 1-(top+size);
                this.children[i].xform.top = top;
                this.children[i].xform.bottom = bottom;
            }
        }
    }

}

class UiHorizontalSpacer extends UiView {
    static { this.schema('alignx', { dflt: .5 }); }
    static { this.schema('size', { dflt: .1 }); }
    static { this.schema('spacer', { dflt: 0 }); }
    cpost(spec) {
        super.cpost(spec);
        this.resize();
    }

    $onGizmoChilded(evt) {
        this.resize();
    }

    $onGizmoUnchilded(evt) {
        this.resize();
    }

    resize() {
        if (this.children.length) {
            // calculate column size
            let size = this.size;
            let spacer = this.spacer;
            let maxSize = this.children.length * size + (this.children.length-1)*spacer;
            let oleft = 0;
            if (maxSize > 1) {
                let factor = 1/maxSize;
                size *= factor;
                spacer *= factor;
            } else {
                let delta = 1-maxSize;
                oleft = delta * this.alignx;
            }
            let total = size + spacer;
            for (let i=0; i<this.children.length; i++) {
                let left = oleft + total*i;
                let right = 1-(left+size);
                this.children[i].xform.left = left;
                this.children[i].xform.right = right;
            }
        }
    }

}
