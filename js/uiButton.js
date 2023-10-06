export { UiButton };

import { Hierarchy } from './hierarchy.js';
import { Rect } from './rect.js';
import { UiPanel } from './uiPanel.js';
import { UiText } from './uiText.js';

class UiButton extends UiPanel {
    // SCHEMA --------------------------------------------------------------
    static {
        this.schema('unpressed', { link: true, parser: (o,x) => (x.hasOwnProperty('unpressed')) ? x.unpressed : o.constructor.dfltUnpressed });
        this.schema('highlight', { link: true, parser: (o,x) => (x.hasOwnProperty('highlight')) ? x.highlight : o.constructor.dfltHighlight });
        this.schema('pressed', { link: true, parser: (o,x) => (x.hasOwnProperty('pressed')) ? x.pressed : o.constructor.dfltPressed });
        this.schema('text', { link: true, parser: (o,x) => (x.hasOwnProperty('text')) ? x.text : 'default text', atUpdate: (o,k,ov,nv) => o._text.text = nv });
        this.schema('hltext', { link: true, parser: (o,x) => (x.hasOwnProperty('hltext')) ? x.hltext : null });
        this.schema('textSpec', { eventable: false, parser: (o,x) => (x.textSpec || {}), onset: (o,k,v) => Object.assign(o._text, v)});
        this.schema('hlTextSpec', { eventable: false, parser: (o,x) => (x.hlTextSpec || {})});
        this.schema('_text', { link: true, readonly: true, serializable: false, parser: (o,x) => {
            let spec = Object.assign({}, o.textSpec || {}, { text: o.text });
            return new UiText(spec);
        }});
    }

    // STATIC PROPERTIES ---------------------------------------------------
    static get dfltUnpressed() { return new Rect({ color: 'rgba(255,255,255,.25)' }); }
    static get dfltHighlight() { return new Rect({ borderColor: 'yellow', border: 3, fill: false }); }
    static get dfltPressed() { return new Rect({ color: 'rgba(255,255,255,.75)' }); }

    // CONSTRUCTOR ---------------------------------------------------------
    cpost(spec) {
        super.cpost(spec);
        Hierarchy.adopt(this, this._text);
    }

    // EVENT HANDLERS ------------------------------------------------------
    $onMouseEntered(evt) {
        super.onMouseEntered(evt);
        if (this.hltext) {
            this._text.text = this.hltext;
        }
        if (this.hlTextSpec) {
            Object.assign(this._text, this.hlTextSpec);
        }
    }
    $onMouseExited(evt) {
        super.onMouseExited(evt);
        if (this.hltext) {
            this._text.text = this.text;
        }
        if (this.hlTextSpec) {
            Object.assign(this._text, this.textSpec);
        }
    }

    // METHODS -------------------------------------------------------------
    subrender(ctx) {
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
