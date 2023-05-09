export { UiText };

import { Bounds } from './bounds.js';
import { Mathf } from './math.js';
import { TextToken } from './textToken.js';
import { TextFormat } from './textFormat.js';
import { UiView } from './uiView.js';

/** ========================================================================
 * A string of text rendered to the screen as a sketch.
 */
class UiText extends UiView {
    // STATIC VARIABLES ----------------------------------------------------
    static evtUpdated = 'text.updated';
    static lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut ' + 
                   'labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris ' +
                   'nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit ' +
                   'esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in ' +
                   'culpa qui officia deserunt mollit anim id est laborum.';
    static minFontSize = 5;
    static dfltText = 'default text';

    static get rlorem() {
        let len = Math.floor(Math.random()*this.lorem.length);
        return  this.lorem.slice(0, len);
    }

    static get rword() {
        let choices = this.lorem.split(' ');
        let idx = Math.floor(Math.random() * choices.length);
        return choices[idx];
    }

    static get dfltFmt() { return new TextFormat() };

    static {
        this.schema(this, 'text', { dflt: 'default text', atUpdate: (r,o,k,ov,nv) => o.needsLayout = true });
        this.schema(this, 'fmt', { parser: (o,x) => (x.fmt || this.dfltFmt), atUpdate: (r,o,k,ov,nv) => o.needsLayout = true });
        // none, stretch, wrap, autowrap
        this.schema(this, 'fitter', { dflt: 'stretch', atUpdate: (r,o,k,ov,nv) => o.needsLayout = true });
        this.schema(this, 'alignx', { dflt: .5, atUpdate: (r,o,k,ov,nv) => o.needsLayout = true });
        this.schema(this, 'aligny', { dflt: .5, atUpdate: (r,o,k,ov,nv) => o.needsLayout = true });
        this.schema(this, 'tokens', { parser: (() => ([])) });
        this.schema(this, 'needsLayout', { eventable: false, dflt: true });
        this.schema(this, 'lastHeight', { eventable: false, dflt: 0 });
        this.schema(this, 'lastWidth', { eventable: false, dflt: 0 });
        // -- leading is the space between lines, expressed as percent of line height
        this.schema(this, 'leadingPct', { dflt: .25, atUpdate: (r,o,k,ov,nv) => o.needsLayout = true });
    }

    // STATIC METHODS ------------------------------------------------------
    // FIXME: allow for text that isn't evaluated for control strings (e.g.: user input fields)
    static tokenize(text, opts={}) {
        let fmt = opts.fmt || new TextFormat();
        // format stack
        let fmts = [fmt];
        // control stack
        let ctrls = text.match(/<[^<>]*>/g) || [];
        // break up text into text tokens
        let remaining = text;
        let tokens = [];
        for (var ctrl of ctrls) {
            // skip escaped '<'
            let splits = remaining.split(ctrl, 1);
            if (splits[0].endsWith('\\')) continue;
            let block = splits[0];
            remaining = remaining.slice(block.length+ctrl.length);
            if (block) {
                if (opts.wrap) {
                    // split on newlines
                    let lines = block.split('\n');
                    let firstLine = true;
                    for (const line of lines) {
                        if (line) {
                            // split on whitespace
                            let tstrs = line.split(/\s+/);
                            let firstStr = true;
                            for (const tstr of tstrs) {
                                if (tstr) {
                                    // FIXME: remove newline?
                                    tokens.push(new TextToken({text: tstr, fmt: fmts[fmts.length-1].copy(), newline: (!firstLine && firstStr)}));
                                    firstStr = false;
                                }
                            }
                        }
                        firstLine = false;
                    }
                } else {
                    tokens.push(new TextToken({text: block, fmt: fmts[fmts.length-1].copy()}));
                }
            }
            // parse control
            if (ctrl.startsWith('</')) {
                if (fmts.length > 1) fmts.pop();
            } else {
                ctrl = ctrl.replace(/[<>]*/g, '');
                let spec = TextFormat.parse(ctrl);
                let newFmt = fmts[fmts.length-1].copy(spec);
                fmts.push(newFmt);
            }
        }
        if (remaining) {
            if (opts.wrap) {
                // split on newlines
                let lines = remaining.split('\n');
                let firstLine = true;
                for (const line of lines) {
                    if (line) {
                        // split on whitespace
                        let tstrs = line.split(/\s+/);
                        let firstStr = true;
                        for (const tstr of tstrs) {
                            if (tstr) {
                                tokens.push(new TextToken({text: tstr, fmt: fmts[fmts.length-1].copy(), newline: (!firstLine && firstStr)}));
                                firstStr = false;
                            }
                        }
                    }
                    firstLine = false;
                }
            } else {
                tokens.push(new TextToken({text: remaining, fmt: fmts[fmts.length-1].copy()}));
            }
        }
        return tokens;
    }

    static splitLines(tokens, width, leadingPct) {
        let wrapHeight = 0;
        let wrapWidth = 0;
        // lines are split based on current text format
        let lines = [];
        let line = [];
        let lineWidth = 0;
        let lineHeight = 0;
        for (let i=0; i<tokens.length; i++) {
            let token = tokens[i];
            // measure spacing required for token...
            let spacing = token.fmt.measure(' ');
            // check if token will fit in current line...
            let checkWidth = token.width + ((line.length) ? spacing.x : 0);
            if (lineWidth + checkWidth < width) {
                line.push(token);
                lineWidth += checkWidth;
                if (spacing.y > lineHeight) lineHeight = spacing.y;
            // otherwise, doesn't fit
            } else {
                // line is empty.  this means the token is too large to fit in space allocated for a line and will overflow.
                if (!line.length) {
                    line.push(token);
                    lines.push(line);
                    line = [];
                    // update total wrap height
                    if (lines.length > 1) {
                        wrapHeight += (lineHeight + lineHeight*leadingPct);
                    } else {
                        wrapHeight += lineHeight;
                    }
                    lineWidth = 0;
                    lineHeight = 0;
                    if (token.width > wrapWidth) wrapWidth = token.width;
                // line is not empty.  push current line and start a new line with the current token...
                } else {
                    lines.push(line);
                    line = [];
                    line.push(token);
                    if (lineWidth > wrapWidth) wrapWidth = lineWidth;
                    lineWidth = token.width;
                    // update total wrap height
                    if (lines.length > 1) {
                        wrapHeight += (lineHeight + lineHeight*leadingPct);
                    } else {
                        wrapHeight += lineHeight;
                    }
                    lineHeight = spacing.y;
                }
            }
        }
        if (line.length) {
            wrapHeight += (lineHeight + lineHeight*leadingPct);
            if (lineWidth > wrapWidth) wrapWidth = lineWidth;
            lines.push(line);
        }
        // calculate required wrap space
        return [lines, wrapHeight, wrapWidth];
    }

    static resizeTokens(tokens, delta=1) {
        for (const token of tokens) if (token.fmt.size + delta > 0) token.fmt.size += delta;
    }

    static measureWrapHeight(text, opts={}) {
        let fmt = opts.fmt || new TextFormat();
        let leadingPct = ('leadingPct' in opts) ? opts.leadingPct : .25;
        let autofit = ('autofit' in opts) ? opts.autofit : false;
        let width = opts.width || 0;
        let height = opts.height || 0;
        // tokenize
        let tokens = this.tokenize(text, {fmt: fmt, wrap: true});
        // split the lines
        let lines = [];
        let wrapHeight = 0;
        let wrapWidth = 0;
        if (autofit) {
            [lines, wrapHeight, wrapWidth] = this.splitLines(tokens, width, leadingPct);
            // grow
            if (iterations-- >= 0 && wrapWidth < width && wrapHeight < height) {
                while (wrapWidth < width && wrapHeight < height) {
                    this.resizeTokens(tokens, 1);
                    [lines, wrapHeight, wrapWidth] = this.splitLines(tokens, width, leadingPct);
                }
                this.resizeTokens(tokens, -1);
                [lines, wrapHeight, wrapWidth] = this.splitLines(tokens, width, leadingPct);
            // shrink
            } else {
                while (iterations-- >= 0 && (wrapWidth > width || wrapHeight > height)) {
                    this.resizeTokens(tokens, -1);
                    [lines, wrapHeight, wrapWidth] = this.splitLines(tokens, width, leadingPct);
                }
            }
        } else {
            [lines, wrapHeight, wrapWidth] = this.splitLines(tokens, width, leadingPct);
        }
        return wrapHeight;
    }

    // METHODS -------------------------------------------------------------

    layoutLine(tokens, bounds, top, width, autofit=false) {
        // determine overall line width and height and token spacing
        let lineWidth = 0;
        let lineHeight = 0;
        let spaces = [];
        for (let i=0; i<tokens.length; i++) {
            let token = tokens[i];
            let spacing = token.fmt.measure(' ');
            spaces[i] = spacing.x*.5;
            if (i>0) {
                spaces[i-1] += (spacing.x*.5);
                lineWidth += spaces[i-1];
            }
            lineWidth += token.width;
            if (spacing.y > lineHeight) lineHeight = spacing.y;
        }
        let delta = width-lineWidth;
        let x = delta*this.alignx;
        // update token positions
        for (let i=0; i<tokens.length; i++) {
            let token = tokens[i];
            let bound = bounds[i];
            bound.x = x;
            bound.width = token.width;
            // for autofit: allocate space for each token based on width of measured token text compared against overall width
            if (autofit) {
                let widthPct = Mathf.round(token.width/lineWidth, 2);
                bound.width = Mathf.round(widthPct*lineWidth, 2);
            // otherwise (no autofit)
            } else {
                bound.width = token.width;
            }
            bound.x = x;
            bound.y = top;
            bound.height = lineHeight;
            if (autofit) {
                x += bound.width;
            } else {
                x += (token.width + spaces[i]);
            }
        }
        return lineHeight;
    }

    // define layout of tokens
    layout() {
        this.tokens = this.constructor.tokenize(this.text, {fmt: this.fmt, wrap: (this.fitter === 'wrap' || this.fitter === 'autowrap')});
        // create bounds for each token
        this.bounds = [];
        for (let i=0; i<this.tokens.length; i++) this.bounds[i] = new Bounds({x:0, y:0, width:this.xform.width, height:this.xform.height});

        // special case (single token)
        if (this.tokens.length === 1) {
            let token = this.tokens[0];
            let bounds = this.bounds[0];
            switch (this.fitter) {
                case 'none':
                    token.alignx = this.alignx;
                    token.aligny = this.aligny;
                    bounds.width = 0;
                    bounds.height = 0;
                    break;
                case 'stretch':
                    token.alignx = this.alignx;
                    token.aligny = this.aligny;
                    break;
            }
        } else {
            // wrap
            if (this.fitter === 'wrap' || this.fitter === 'autowrap') {
                let lines = [];
                let wrapHeight = 0;
                let wrapWidth = 0;
                let iterations = 1000;

                // autofit: adjust size of font so that we maximize space for rows
                if (this.fitter === 'autowrap') {
                    [lines, wrapHeight, wrapWidth] = this.constructor.splitLines(this.tokens, this.xform.width, this.leadingPct);
                    // grow
                    if (iterations-- >= 0 && wrapWidth < this.xform.width && wrapHeight < this.xform.height) {
                        while (wrapWidth < this.xform.width && wrapHeight < this.xform.height) {
                            this.constructor.resizeTokens(this.tokens, 1);
                            [lines, wrapHeight, wrapWidth] = this.constructor.splitLines(this.tokens, this.xform.width, this.leadingPct);
                        }
                        this.constructor.resizeTokens(this.tokens, -1);
                        [lines, wrapHeight, wrapWidth] = this.constructor.splitLines(this.tokens, this.xform.width, this.leadingPct);
                    // shrink
                    } else {
                        while (iterations-- >= 0 && (wrapWidth > this.xform.width || wrapHeight > this.xform.height)) {
                            this.constructor.resizeTokens(this.tokens, -1);
                            [lines, wrapHeight, wrapWidth] = this.constructor.splitLines(this.tokens, this.xform.width, this.leadingPct);
                        }
                    }

                } else {
                    [lines, wrapHeight, wrapWidth] = this.constructor.splitLines(this.tokens, this.xform.width, this.leadingPct);
                }

                // layout lines
                let top = (this.xform.height-wrapHeight)*this.aligny;
                let bi = 0;
                for (let li=0; li<lines.length; li++) {
                    let line = lines[li];
                    let lineHeight = this.layoutLine(line, this.bounds.slice(bi, bi+line.length), top, this.xform.width, false);
                    bi += line.length;
                    top += (lineHeight + lineHeight*this.leadingPct);
                }
            // single line
            } else {
                this.layoutLine(this.tokens, this.bounds, 0, this.xform.width, this.fitter === 'autowrap');
            }
        }
    }

    getCursorBounds(idx) {
        if (this.needsLayout) {
            this.needsLayout = false;
            this.layout();
        }
        if (!this.tokens.length) {
            console.log(`this: ${this} fmt: ${this.fmt}`)
            let tsize = this.fmt.measure(' ');
            return new Bounds({x:0,y:0, width:tsize.x, height:tsize.y});
        }
        // FIXME: assumes single token
        if (idx < 0) idx = 0;
        let token = this.tokens[0];
        if (idx > token.text.length) idx = token.text.length;
        let substr = this.text.slice(0,idx);
        let spacing = token.fmt.measure(substr);

        let bounds = this.bounds[0];
        let tx = (bounds.width) ? (bounds.width-token.width)*this.alignx : 0;
        let ty = (bounds.height) ? (bounds.height-token.height)*this.aligny : 0;

        return new Bounds({x:this.bounds[0].x + spacing.x + tx, y:this.bounds[0].y + ty, width: token.width, height:token.height});
    }

    subrender(ctx) {
        if (!this.text || !this.text.length) return;
        if (this.lastWidth != this.xform.width || this.lastHeight != this.xform.height || this.needsLayout) {
            this.lastWidth = this.xform.width;
            this.lastHeight = this.xform.height;
            this.needsLayout = false;
            this.layout();
        }
        for (let i=0; i<this.tokens.length; i++) {
            let token = this.tokens[i];
            let bounds = this.bounds[i];
            token.render(ctx, this.xform.minx+bounds.x, this.xform.miny+bounds.y, bounds.width, bounds.height);
            //ctx.strokeStyle = 'green';
            //ctx.strokeRect(this.xform.minx+bounds.x, this.xform.miny+bounds.y, bounds.width, bounds.height);
        }
    }
}