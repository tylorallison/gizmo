export { UiButton };

import { Hierarchy } from './hierarchy.js';
import { Rect } from './rect.js';
import { UiPanel } from './uiPanel.js';
import { UiText } from './uiText.js';

class UiButton extends UiPanel {
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('unpressed', { link: true, dflt: (o) => o.constructor.dfltUnpressed });
        this.schema('highlight', { link: true, dflt: (o) => o.constructor.dfltHighlight });
        this.schema('pressed', { link: true, dflt: (o) => o.constructor.dfltPressed });
        this.schema('inactive', { link: true, dflt: (o) => o.constructor.dfltInactive });
        this.schema('text', { link: true, dflt: 'default text', atUpdate: (o,k,ov,nv) => o._text.text = nv });
        this.schema('hltext', { link: true });
        this.schema('textSpec', { eventable: false, dflt: (o) => ({}), onset: (o,k,v) => Object.assign(o._text, v)});
        this.schema('hlTextSpec', { eventable: false, dflt: (o) => ({}) });
        this.schema('_text', { link: true, readonly: true, serializable: false, parser: (o,x) => {
            let spec = Object.assign({}, o.textSpec || {}, { text: o.text });
            return new UiText(spec);
        }});
    }

    // STATIC PROPERTIES ---------------------------------------------------
    static get dfltUnpressed() { return new Rect({ color: 'rgba(255,255,255,.25)' }); }
    static get dfltHighlight() { return new Rect({ borderColor: 'yellow', border: 3, fill: false }); }
    static get dfltPressed() { return new Rect({ color: 'rgba(255,255,255,.75)' }); }
    static get dfltInactive() { return new Rect({ color: 'rgba(127,127,127,.25)' }); }

    // CONSTRUCTOR ---------------------------------------------------------
    cpost(spec) {
        super.cpost(spec);
        Hierarchy.adopt(this, this._text);
    }

    // EVENT HANDLERS ------------------------------------------------------
    $onMouseEntered(evt) {
        super.$onMouseEntered(evt);
        if (this.hltext) {
            this._text.text = this.hltext;
        }
        if (this.hlTextSpec) {
            Object.assign(this._text, this.hlTextSpec);
        }
    }
    $onMouseExited(evt) {
        super.$onMouseExited(evt);
        if (this.hltext) {
            this._text.text = this.text;
        }
        if (this.hlTextSpec) {
            Object.assign(this._text, this.textSpec);
        }
    }

    // METHODS -------------------------------------------------------------
    subrender(ctx) {
        // render inactive
        if (!this.active) {
            this.renderSketch(ctx, this.inactive);
        } else {
            // render pressed/unpressed sketch
            if (this.mouseOver && this.mousePressed) {
                this.renderSketch(ctx, this.pressed);
            } else {
                this.renderSketch(ctx, this.unpressed);
            }
            // render highlight
            if (this.mouseOver && !this.mousePressed) {
                this.renderSketch(ctx, this.highlight);
            }
        }
    }

}
