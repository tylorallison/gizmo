export { UiButton };

import { Hierarchy } from './hierarchy.js';
import { Rect } from './rect.js';
import { Schema } from './schema.js';
import { UiPanel } from './uiPanel.js';
import { UiText } from './uiText.js';

class UiButton extends UiPanel {
    // SCHEMA --------------------------------------------------------------
    static {
        Schema.apply(this, 'unpressed', { parser: (o,x) => (x.hasOwnProperty('unpressed')) ? x.unpressed : o.constructor.dfltUnpressed, link: true, renderable: true });
        Schema.apply(this, 'highlight', { parser: (o,x) => (x.hasOwnProperty('highlight')) ? x.highlight : o.constructor.dfltHighlight, link: true, renderable: true });
        Schema.apply(this, 'pressed', { parser: (o,x) => (x.hasOwnProperty('pressed')) ? x.pressed : o.constructor.dfltPressed, link: true, renderable: true });
        Schema.apply(this, 'text', { parser: (o,x) => (x.hasOwnProperty('text')) ? x.text : 'default text', renderable: true, atUpdate: (r,o,k,ov,nv) => o._text.text = nv });
        Schema.apply(this, 'hltext', { parser: (o,x) => (x.hasOwnProperty('hltext')) ? x.hltext : null, renderable: true });
        Schema.apply(this, 'textSpec', {eventable: false, renderable: false, parser: (o,x) => (x.textSpec || {}), onset: (o,k,v) => Object.assign(o._text, v)});
        Schema.apply(this, 'hlTextSpec', {eventable: false, renderable: false, parser: (o,x) => (x.hlTextSpec || {})});
        Schema.apply(this, '_text', { readonly: true, serializable: false, gizmo: true, parser: (o,x) => {
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
    onMouseEntered(evt) {
        super.onMouseEntered(evt);
        if (this.hltext) {
            this._text.text = this.hltext;
        }
        if (this.hlTextSpec) {
            Object.assign(this._text, this.hlTextSpec);
        }
    }
    onMouseExited(evt) {
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