export { Animator };

import { EvtSystem, ExtEvtReceiver } from './event.js';
import { Sketch } from './sketch.js';
import { GizmoData } from './gizmoData.js';

// =========================================================================
/**
 * An animator is responsible for driving animations based on state of a parent object passed through event updates
 * @extends Sketch
 */
class Animator extends Sketch {

    // SCHEMA --------------------------------------------------------------
    /** @member {string} Animator#trunkKey='state' - if sketch came from asset, tag associated with asset definition */
    static { this.schema(this, 'trunkKey', { dflt: 'state', readonly: true }); }
    /** @member {Object} Animator#sketches - sketch state mapping <state:sketch> */
    static { this.schema(this, 'sketches', { dflt: {}, readonly: true }); }
    /** @member {Object} Animator#transitions - map of transitions  { <target state>: [ { from: <source state>, sketch: <sketch> }, ... ]} */
    static { this.schema(this, 'transitions', { dflt: {}, readonly: true }); }
    /** @member {Object} Animator#state - current animator state, tracks to target state */
    static { this.schema(this, 'state', { dflt: 'idle', renderable: true, generator: (o,v) => {
        if (o.sketches.hasOwnProperty(v)) {
            if (o.sketch) o.sketch.disable();
            let targetSketch = o.sketches[v];
            let transition = false;
            // check for transition
            if (o.sketch && o.transitions.hasOwnProperty(v)) {
                // find best
                let possibles = o.transitions[v];
                let match;
                for (const possible of possibles) {
                    if (!possible.sketch) return;
                    if (possible.from === o.state) {
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
            o.sketch = targetSketch;
            if (transition) {
                let root = GizmoData.root(o);
                let path = `${GizmoData.path(o.sketch)}.done`;
                if (EvtSystem.isEmitter(root)) {
                    EvtSystem.listen(root, o, 'gizmo.updated', (evt) => {
                        if (o.state === v) {
                            o.sketch.disable();
                            o.sketch = o.sketches[v];
                            o.sketch.reset();
                            o.sketch.enable();
                        }
                    }, { once: true, filter: (evt) => evt.update.hasOwnProperty(path) });
                }
            }
            o.sketch.reset();
            o.sketch.enable();
            return v;
        }
        return o.state;
    } }); }
    /** @member {Object} Animator#state - current animator sketch */
    static { this.schema(this, 'sketch', { link: true, renderable: true, parser: ((o,x) => ((o.sketches) ? o.sketches[o.state] : null)) }); }
    /** @member {Object} Animator#width - width of current animator sketch*/
    static { this.schema(this, 'width', { readonly: true, getter: ((o,x) => ((o.sketch) ? o.sketch.width : 0)) }); }
    /** @member {Object} Animator#height - height of current animator sketch*/
    static { this.schema(this, 'height', { readonly: true, getter: ((o,x) => ((o.sketch) ? o.sketch.height : 0)) }); }
    /** @member {integer} Sketch#ttl - time to live for current animator sketch */
    static { this.schema(this, 'ttl', { readonly: true, getter: (o,x) => ( (o.sketch) ? o.sketch.ttl : 0 )}); }
    /** @member {integer} Sketch#done - is current animator sketch marked as done */
    static { this.schema(this, 'done', { readonly: true, getter: (o,x) => ( (o.sketch) ? o.sketch.done : false )}); }
    static { ExtEvtReceiver.apply(this); }

    // DATA CHANGE HANDLERS ------------------------------------------------
    /**
     * link animator to trunk object
     * @param {GizmoData} trunk - trunk data object that has been linked to the current object.
     */
    atLink(trunk) {
        // if linked to gizmo
        let self = this;
        if (EvtSystem.isEmitter(trunk)) {
            EvtSystem.listen(trunk, this, 'gizmo.updated', (evt) => { self.state = evt.update.state }, { filter: (evt) => evt.update.hasOwnProperty(this.trunkKey) });
        }
        if (this.state !== trunk[this.trunkKey]) this.state = trunk[this.trunkKey];
    }

    /**
     * unlink animator from trunk object
     * @param {GizmoData} trunk - trunk data object that has been linked to the current object.
     */
    atUnlink(trunk) {
        if (EvtSystem.isEmitter(trunk)) {
            EvtSystem.ignore(trunk, this, 'gizmo.updated');
        }
    }

    // METHODS -------------------------------------------------------------
    /**
     * enable the animator and current animator sketch
     */
    enable() {
        if (!this.active) {
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