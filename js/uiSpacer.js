export { UiVerticalSpacer, UiHorizontalSpacer }

import { EventCtx } from './eventCtx.js';
import { UiView } from './uiView.js';

class UiVerticalSpacer extends UiView {
    static { this.schema('aligny', { dflt: .5 }); }
    static { this.schema('size', { dflt: .1 }); }
    static { this.schema('spacer', { dflt: 0 }); }
    cpost(spec) {
        super.cpost(spec);
        this.onChilded = this.onChilded.bind(this);
        this.onUnchilded = this.onUnchilded.bind(this);
        EventCtx.listen(this, 'gizmo.childed', this.onChilded, this);
        EventCtx.listen(this, 'gizmo.unchilded', this.onUnchilded, this);
        this.resize();
    }

    onChilded(evt) {
        this.resize();
    }

    onUnchilded(evt) {
        this.resize();
    }

    resize() {
        if (this.children.length) {
            // calculate row size
            let size = this.size;
            let spacer = this.spacer;
            let maxSize = this.children.length * size + (this.children.length-1)*spacer;
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
        this.onChilded = this.onChilded.bind(this);
        this.onUnchilded = this.onUnchilded.bind(this);
        EventCtx.listen(this, 'gizmo.childed', this.onChilded, this);
        EventCtx.listen(this, 'gizmo.unchilded', this.onUnchilded, this);
        this.resize();
    }

    onChilded(evt) {
        this.resize();
    }

    onUnchilded(evt) {
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
