export { UiToggle };

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
        this.schema('blankIcon', { link: true, dflt: (o) => o.constructor.dfltBlankIcon });
        this.schema('iconXForm', { link: true, dflt: (o) => new XForm({grip: .1, gripOffsetForceRatio: 1})});
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
    static get dfltBlankIcon() { return new Shape({ 
        fill: false,
        verts: [
                {x:2, y:19},
                {x:5, y:16},
                {x:10, y:21},
                {x:26, y:5},
                {x:29, y:8},
                {x:10, y:27},
        ],
        border: 2,
        borderColor: 'rgba(0,0,0,.25)',
    })};

    // CONSTRUCTOR/DESTRUCTOR ----------------------------------------------
    cpost(spec) {
        super.cpost(spec);
        this.iconXForm._parent = this.xform;
    }

    // PROPERTIES ----------------------------------------------------------
    // EVENT HANDLERS ------------------------------------------------------
    $onMouseClicked(evt) {
        super.$onMouseClicked(evt);
        this.value = !this.value;
    }

    // METHODS -------------------------------------------------------------
    subrender(ctx) {
        // render active sketch
        if (this.value) {
            this.pressed.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
        } else {
            this.unpressed.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
        }
        // render highlight
        if (this.mouseOver) {
            this.highlight.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
        }
        //if (this.dbg && this.dbg.viewXform) this.iconXform.render(ctx);
        // apply transform
        if (this.iconXForm) this.iconXForm.apply(ctx, false);
        // render icon
        if (this.value) {
            this.icon.render(ctx, this.iconXForm.minx, this.iconXForm.miny, this.iconXForm.width, this.iconXForm.height);
        } else {
            this.blankIcon.render(ctx, this.iconXForm.minx, this.iconXForm.miny, this.iconXForm.width, this.iconXForm.height);
        }
        if (this.iconXForm) this.iconXForm.revert(ctx, false);
    }

}
