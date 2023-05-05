export { UiInput, UiInputText };

import { EvtSystem } from './event.js';
import { Hierarchy } from './hierarchy.js';
import { Rect } from './rect.js';
import { TextFormat } from './textFormat.js';
import { TextToken } from './textToken.js';
import { Timer } from './timer.js';
import { Util } from './util.js';
import { UiPanel } from './uiPanel.js';
import { UiView } from './uiView.js';

class UiInputText extends UiView {
    // STATIC VARIABLES ----------------------------------------------------
    static get dfltCursor() { return new Rect({ color: 'rgba(255,255,255,.5)' }); }
    static dfltCursorBlinkRate = 500;
    static dfltCursorHeightPct = .8;
    static dfltCursorWidthPct = .1;

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'token', { link: true, renderable: true, parser: (o,x) => (x.hasOwnProperty('token')) ? x.token : new TextToken() });
        this.schema(this, 'cursor', { link: true, renderable: true, parser: (o,x) => (x.hasOwnProperty('cursor')) ? x.cursor : o.constructor.dfltCursor });
        this.schema(this, 'cursorBlinkRate', { dflt: this.dfltCursorBlinkRate });
        this.schema(this, 'cursorHeightPct', { dflt: this.dfltCursorHeightPct });
        this.schema(this, 'cursorAlignY', { dflt: 0 });
        this.schema(this, 'cursorWidthPct', { dflt: this.dfltCursorWidthPct });
        this.schema(this, 'cursorIdx', { serializable: false, renderable: true, parser: (o,x) => o.token.text.length });
        this.schema(this, 'cursorOn', { serializable: false, dflt: false, renderable: true });
        this.schema(this, 'timer', { link: true, eventable: false, serializable: false });
        this.schema(this, 'selected', { serializable: false, dflt: false, renderable: true, atUpdate: (r,o,k,ov,nv) => o.updateSelected(nv)});
    }

    updateSelected(value) {
        this.selected = value;
        if (value) {
            this.cursorOn = true;
            if (this.cursorBlinkRate) this.timer = new Timer({ttl: this.cursorBlinkRate, cb: () => (this.cursorOn = !this.cursorOn), loop: true});
        } else {
            this.cursorOn = false;
            if (this.timer) {
                this.timer.destroy();
                this.timer = null;
            }
        }
    }

    subrender(ctx) {
        this.token.render(ctx, this.xform.minx, this.xform.miny, this.xform.width, this.xform.height);
        // determine cursor position/dimensions
        if (this.cursorOn) {
            let cursorBounds = this.token.getCharBounds(this.cursorIdx);
            let cursorHeight = Math.round(cursorBounds.height * this.cursorHeightPct);
            let cursorWidth = Math.round(cursorHeight * this.cursorWidthPct);
            // update offset for token alignment
            let offX = this.token.alignx*(this.xform.width - this.token.width);
            let offY = this.token.aligny*(this.xform.height - this.token.height);
            // update offset for cursor alignment
            offY += (cursorBounds.height - cursorHeight)*this.cursorAlignY;
            this.cursor.render(ctx, this.xform.minx+offX+cursorBounds.x, this.xform.miny+offY, cursorWidth, cursorHeight);
        }
    }

}

class UiInput extends UiPanel {
    // STATIC VARIABLES ----------------------------------------------------
    static dfltCharset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 ';
    static get dfltSketch() { return new Rect({ color: 'rgba(255,255,255,.25)' }); }
    static get dfltHighlight() { return new Rect({ borderColor: 'yellow', border: 3, fill: false }); }
    static get dfltTextFmt() { return new TextFormat({ color: 'black' }); };
    static get dfltSelectedTextFmt() { return new TextFormat({ color: 'yellow' }); };
    static get dfltEmptyTextFmt() { return new TextFormat({ color: 'gray', style: 'italic' }); };

    // SCHEMA --------------------------------------------------------------
    static {
        this.schema(this, 'sketch', { parser: (o,x) => (x.hasOwnProperty('sketch')) ? x.sketch : o.constructor.dfltSketch, link: true, renderable: true });
        this.schema(this, 'highlight', { parser: (o,x) => (x.hasOwnProperty('highlight')) ? x.highlight : o.constructor.dfltHighlight, link: true, renderable: true });
        this.schema(this, 'text', { parser: (o,x) => (x.hasOwnProperty('text')) ? x.text : 'default text', renderable: true, atUpdate: (r,o,k,ov,nv) => o.updateText(nv) }),
        this.schema(this, 'emptyText', { renderable: true, dflt: 'enter value' }),

        this.schema(this, 'textFmt', { eventable: false, renderable: false, parser: (o,x) => (x.textFmt || this.dfltTextFmt)});
        this.schema(this, 'selectedTextFmt', { eventable: false, renderable: false, parser: (o,x) => (x.selectedTextFmt || this.dfltSelectedTextFmt)});
        this.schema(this, 'emptyTextFmt', {eventable: false, renderable: false, parser: (o,x) => (x.emptyTextFmt || this.dfltEmptyTextFmt)});
        this.schema(this, 'charset', { dflt: this.dfltCharset });

        this.schema(this, 'ttext', { readonly: true, serializable: false, gizmo: true, parser: (o,x) => {
            let ttext = x.ttext || new UiInputText({});
            // override token text/format
            ttext.token.text = (o.text) ? o.text : o.emptyText;
            ttext.token.fmt = (o.text) ? o.textFmt : o.emptyTextFmt;
            if (!o.text) ttext.cursorIdx = 0;
            return ttext;
        }});
    }

    // CONSTRUCTOR ---------------------------------------------------------
    cpre(spec) {
        super.cpre(spec);
        // -- bind event handlers
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onSystemMouseClicked = this.onSystemMouseClicked.bind(this);
    }

    cpost(spec) {
        super.cpost(spec);
        EvtSystem.listen(this.gctx, this, 'key.down', this.onKeyDown);
        EvtSystem.listen(this.gctx, this, 'mouse.clicked', this.onSystemMouseClicked);
        Hierarchy.adopt(this, this.ttext);
    }

    // EVENT HANDLERS ------------------------------------------------------
    onMouseClicked(evt) {
        // activate/deactivate
        this.updateSelected(!this.ttext.selected);
        super.onMouseClicked(evt);
    }

    onSystemMouseClicked(evt) {
        if (!this.mouseOver && this.ttext.selected) {
            this.updateSelected(false);
        }
    }

    onKeyDown(evt) {
        if (!this.active) return;
        // ignore key events if not selected
        if (!this.ttext.selected) return;
        // handle escape
        if (evt.key === 'Escape') {
            this.updateSelected(false);
            return;
        }
        // handle backspace
        if (evt.key === 'Backspace') {
            if (this.ttext.cursorIdx > 0) {
                this.ttext.cursorIdx = this.ttext.cursorIdx-1;
                this.text = Util.spliceStr(this.text, this.ttext.cursorIdx, 1);
            }
            return;
        }
        // handle arrows
        if (evt.key === 'ArrowLeft') {
            if (this.ttext.cursorIdx > 0) {
                this.ttext.cursorIdx = this.ttext.cursorIdx-1;
            }
            return;
        }
        if (evt.key === 'ArrowRight') {
            if (this.ttext.cursorIdx < this.text.length) {
                this.ttext.cursorIdx = this.ttext.cursorIdx+1;
            }
            return;
        }
        if (evt.key === 'ArrowUp') {
            if (this.ttext.cursorIdx !== 0) {
                this.ttext.cursorIdx = 0;
            }
            return;
        }
        if (evt.key === 'ArrowDown') {
            if (this.ttext.cursorIdx !== this.text.length) {
                this.ttext.cursorIdx = this.text.length;
            }
            return;
        }
        // handle delete
        if (evt.key === 'Delete') {
            if (this.ttext.cursorIdx < this.text.length) {
                this.text = Util.spliceStr(this.text, this.ttext.cursorIdx, 1);
            }
            return;
        }
        // ignore other meta keys
        if (evt.key.length > 1) return;
        let key = evt.key;
        // check charset
        if (!this.charset.includes(key)) return;
        // good to go...
        let left = this.text.slice(0, this.ttext.cursorIdx);
        let right = this.text.slice(this.ttext.cursorIdx);
        this.text = left + key + right;
        this.ttext.cursorIdx = this.ttext.cursorIdx+1;
    }

    // METHODS -------------------------------------------------------------

    updateText(value) {
        // handle null/empty string
        if (!value) {
            // display empty string using empty string format
            if (this.ttext.selected) {
                this.ttext.token.text = '';
            } else {
                this.ttext.token.text = this.emptyText;
            }
            this.ttext.token.fmt = this.emptyTextFmt;
        // handle non-empty string
        } else {
            this.ttext.token.text = value;
            if (this.ttext.selected) {
                this.ttext.token.fmt = this.selectedTextFmt;
            } else {
                this.ttext.token.fmt = this.textFmt;
            }
        }
        if (this.ttext.cursorIdx > value.length) this.ttext.cursorIdx = value.length;
    }

    updateSelected(value) {
        this.ttext.selected = value;
        // handle selected
        if (value) {
            // upon selecting empty input, replace placeholder text w/ empty string
            if (!this.text.length) this.ttext.token.text = '';
            this.ttext.token.fmt = this.selectedTextFmt;
        // handle deselected
        } else {
            if (!this.text.length) {
                this.ttext.token.text = this.emptyText;
                this.ttext.token.fmt = this.emptyTextFmt;
            } else {
                this.ttext.token.fmt = this.textFmt;
            }
        }
    }

    /*
    show() {
        this.sketch.show();
        this._highlight.show();
        this._text.show();
        this._cursor.show();
    }
    hide() {
        this.sketch.hide();
        this._highlight.hide();
        this._text.hide();
        this._cursor.hide();
    }
    */

    subrender(ctx) {
        // render sketch
        this.renderSketch(ctx, this.sketch);
        // render selected highlight
        if (this.ttext.selected) {
            this.renderSketch(ctx, this.highlight);
        }
    }

}