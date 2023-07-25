export { UiToggle };

import { Hierarchy } from './hierarchy.js';
import { Rect } from './rect.js';
import { Shape } from './shape.js';
import { UiView } from './uiView.js';
import { XForm } from './xform.js';

class UiToggle extends UiView {
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('unpressed', { link: true, dflt: (o) => o.constructor.dfltUnpressed });
        this.schema('highlight', { link: true, dflt: (o) => o.constructor.dfltHighlight });
        this.schema('pressed', { link: true, dflt: (o) => o.constructor.dfltPressed });
        this.schema('icon', { link: true, dflt: (o) => o.constructor.dfltIcon });
        this.schema('value', { dflt: true });

    }

    // STATIC PROPERTIES ---------------------------------------------------
    static get dfltUnpressed() { return new Rect({ color: 'rgba(255,255,255,.25)' }); }
    static get dfltHighlight() { return new Rect({ borderColor: 'yellow', border: 3, fill: false }); }
    static get dfltPressed() { return new Rect({ color: 'rgba(255,255,255,.5)' }); }
    static get dfltIcon() { return new Shape({ 
        fill: true,
        verts: [
                {x:2, y:19},
                {x:5, y:16},
                {x:10, y:21},
                {x:26, y:5},
                {x:29, y:8},
                {x:10, y:27},
        ],
        border: 2,
        borderColor: 'rgba(0,0,0,1)',
        color: 'rgba(255,255,255,1)'
    })};

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpost(spec) {
        super.cpost(spec);

        // -- link sketches
        //this.sketch = (this._value) ? this._pressed : this._unpressed;
        // -- icon xform
        //this.iconXform = spec.hasOwnProperty('iconXform') ? spec.iconXform : XForm.identity;
        //Hierarchy.adopt(this.xform, this.iconXform);
    }


    // PROPERTIES ----------------------------------------------------------
    /*
    get value() {
        return this._value;
    }
    set value(v) {
        if (v !== this._value) {
            this._value = v;
            this.sketch.hide();
            this.sketch = (this._value) ? this._pressed : this._unpressed;
            this.sketch.show();
            this.evt.trigger(this.constructor.evtUpdated, {actor: this, update: { value: v }});
            this.evt.trigger(this.constructor.evtToggled, {actor: this, update: { value: v }});
        }
    }
    */

    // EVENT HANDLERS ------------------------------------------------------
    onMouseClicked(evt) {
        super.onMouseClicked(evt);
        this.value = !this.value;
        //this.sketch = (this._value) ? this._pressed : this._unpressed;
        //this.evt.trigger(this.constructor.evtToggled, {actor: this, update: { value: this._value }});
        //super.onMouseClicked(evt);
    }

    // METHODS -------------------------------------------------------------
    /*
    show() {
        this.sketch.show();
        this._icon.show();
    }
    hide() {
        this.sketch.hide();
        this._icon.hide();
    }
    */

    subrender(ctx) {
        // render active sketch
        //this.sketch.width = this.xform.width;
        //this.sketch.height = this.xform.height;
        //this.sketch.render(ctx, this.xform.minx, this.xform.miny);
        if (this.value) {
            this.pressed.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
        } else {
            this.unpressed.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
        }
        // render highlight
        if (this.mouseOver) {
            console.log(`mouse is over`);
            this.highlight.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
            //this._highlight.width = this.xform.width;
            //this._highlight.height = this.xform.height;
            //this._highlight.render(ctx, this.xform.minx, this.xform.miny);
        }
        //if (this.dbg && this.dbg.viewXform) this.iconXform.render(ctx);
        // apply transform
        //this.iconXform.apply(ctx, false);
        // render icon
        if (this.value) {
            //this._icon.width = this.iconXform.width;
            //this._icon.height = this.iconXform.height;
            this.icon.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
        }
        //this.iconXform.revert(ctx, false);
    }

}