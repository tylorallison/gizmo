export { Animator };

import { EvtSystem, ExtEvtReceiver } from './event.js';
import { Sketch } from './sketch.js';
import { Gadget } from './gizmo.js';

// =========================================================================
/**
 * An animator is responsible for driving animations based on state of a parent object passed through event updates
 * @extends Sketch
 */
class Animator extends Sketch {

    // SCHEMA --------------------------------------------------------------
    /** @member {string} Animator#trunkKey='state' - if sketch came from asset, tag associated with asset definition */
    static { this.schema('trunkKey', { dflt: 'state', readonly: true }); }
    /** @member {Object} Animator#sketches - sketch state mapping <state:sketch> */
    static { this.schema('sketches', { dflt: {}, readonly: true, link: false }); }
    /** @member {Object} Animator#transitions - map of transitions  { <target state>: [ { from: <source state>, sketch: <sketch> }, ... ]} */
    static { this.schema('transitions', { dflt: {}, readonly: true, link: false }); }
    /** @member {Object} Animator#state - current animator state, tracks to target state */
    static { this.schema('state', { dflt: 'idle', atUpdate: (o,k,ov,nv) => o.start(nv)});  }
    /** @member {Object} Animator#state - current animator sketch */
    static { this.schema('sketch', { link: true, parser: ((o,x) => ((o.sketches) ? o.sketches[o.state] : null)) }); }
    /** @member {Object} Animator#width - width of current animator sketch*/
    static { this.schema('width', { readonly: true, getter: ((o,x) => ((o.sketch) ? o.sketch.width : 0)) }); }
    /** @member {Object} Animator#height - height of current animator sketch*/
    static { this.schema('height', { readonly: true, getter: ((o,x) => ((o.sketch) ? o.sketch.height : 0)) }); }
    /** @member {integer} Sketch#ttl - time to live for current animator sketch */
    static { this.schema('ttl', { readonly: true, getter: (o,x) => ( (o.sketch) ? o.sketch.ttl : 0 )}); }
    /** @member {integer} Sketch#done - is current animator sketch marked as done */
    static { this.schema('done', { readonly: true, getter: (o,x) => ( (o.sketch) ? o.sketch.done : false )}); }
    static { ExtEvtReceiver.apply(this); }

    // DATA CHANGE HANDLERS ------------------------------------------------
    /**
     * link animator to trunk object
     * @param {Gadget} trunk - trunk data object that has been linked to the current object.
     */
    atLinkTrunk(trunk) {
        // if linked to gizmo
        let self = this;
        let trunkKey = this.trunkKey;
        if (EvtSystem.isEmitter(trunk)) {
            EvtSystem.listen(trunk, this, 'gizmo.updated', (evt) => { 
                self.state = evt.update[trunkKey]; 
            }, { filter: (evt) => (trunkKey in evt.update) });
        }
        if (this.state !== trunk[this.trunkKey]) this.state = trunk[trunkKey];
    }

    /**
     * unlink animator from trunk object
     * @param {Gadget} trunk - trunk data object that has been linked to the current object.
     */
    atUnlinkTrunk(trunk) {
        if (EvtSystem.isEmitter(trunk)) {
            EvtSystem.ignore(trunk, this, 'gizmo.updated');
        }
    }

    // METHODS -------------------------------------------------------------
    start(state) {
        if (state in this.sketches) {
            if (this.sketch) this.sketch.disable();
            let targetSketch = this.sketches[state];
            let transition = false;
            // check for transition
            if (this.sketch && state in this.transitions) {
                // find best
                let possibles = this.transitions[state];
                let match;
                for (const possible of possibles) {
                    if (!possible.sketch) return;
                    if (possible.from === this.state) {
                        match = possible.sketch;
                        break;
                    } else if ( !possible.from ) {
                        match = possible.sketch;
                    }
                }
                if (match) {
                    match.reset();
                    if (!match.done) {
                        transition = true;
                        targetSketch = match;
                    }
                }
            }
            this.sketch = targetSketch;
            if (transition) {
                let root = Gadget.root(this);
                let path = `${this.$path}.done`;
                if (EvtSystem.isEmitter(root)) {
                    EvtSystem.listen(root, this, 'gizmo.updated', (evt) => {
                        if (this.state === state) {
                            this.sketch.disable();
                            this.sketch = this.sketches[state];
                            this.sketch.reset();
                            this.sketch.enable();
                        }
                    }, { once: true, filter: (evt) => (path in evt.update) });
                }
            }
            this.sketch.reset();
            this.sketch.enable();
        }
    }

    /**
     * enable the animator and current animator sketch
     */
    enable() {
        if (!this.active) {
            this.start(this.state);
            if (this.sketch) this.sketch.enable();
        }
        super.enable();
    }

    /**
     * disable the animator and current animator sketch
     */
    disable() {
        // disable current sketch
        if (this.sketch) this.sketch.disable();
        super.disable();
    }

    /**
     * render the animator
     * @param {canvasContext} ctx - canvas context on which to draw
     * @param {number} [x=0] - x position to render sketch at
     * @param {number} [y=0] - y position to render sketch at
     * @param {number} [width=0] - desired width to render, if unspecified, sketch will render at internal width
     * @param {number} [height=0] - desired height to render, if unspecified, sketch will render at internal height
     */
    subrender(ctx, x=0, y=0, width=0, height=0) {
        if (this.sketch) this.sketch.render(ctx, x, y, width, height);
    }

}
