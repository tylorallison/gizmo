export { GizmoData, GizmoDataArray };

import { EvtSystem } from './event.js';
import { Fmt } from './fmt.js';
import { Stats } from './stats.js';

/**
 * A GizmoData instance is the base class for the majority of all Gizmo classes.  It defines a data schema mechanism
 * that links object properties with events and actions that can be taken when that property is accessed or set.
 * GizmoData instances may be chained together to form dependencies and complex data structures.
 */
class GizmoData {
    static registry = {};
    static get schema() {
        if (!this.hasOwnProperty('_schema')) this._schema = Object.assign({}, Object.getPrototypeOf(this)._schema);
        return this._schema;
    }
    static get $autogenKeys() {
        if (!this.hasOwnProperty('_autogenKeys')) {
            let superKeys = Object.getPrototypeOf(this)._autogenKeys;
            this._autogenKeys = (superKeys) ? Array.from(superKeys) : [];
        }
        return this._autogenKeys;
    }

    /**
     * init performs static class initialization, including updating the global class registry for this class instance.
     * @static
     */
    static init() {
        if (!(this.name in this.registry)) {
            this.registry[this.name] = this;
        }
    }
    
    /**
     * GizmoSpec defines an specification argument for the GizmoData constructor that can be passed to a {@link Generator} instance.
     * The properties defined here are the minimum required for the generator to identify the class properly.  The schema defined
     * for each GizmoData class defines other properties for that class and how they are parsed from the GizmoSpec.
     * @typedef {Object} GizmoSpec
     * @property {boolean} $gzx=true - Indicates this is a GizmoData specification 
     * @property {string} cls - Name of class associated with specification
     */

    /**
     * xspec provides an GizmoSpec which can be used by a {@link Generator} class to create a GizmoData object.
     * @param {Object} spec={} - overrides for properties to create in the GizmoSpec
     * @returns {...GizmoSpec}
     */
    static xspec(spec={}) {
        this.init();
        return Object.assign({
            $gzx: true,
            cls: this.name,
        }, spec);
    }

    /**
     * root returns the root of the given GizmoData structure (if any)
     * @param {GizmoData} gzd - The object to find the root for
     * @returns {GizmoData} - The root of the GizmoData chain (if any)
     */
    static root(gzd) {
        while (gzd) {
            if (gzd.$trunk) {
                gzd = gzd.$trunk;
            } else {
                return gzd;
            }
        }
        return null;
    }

    /**
     * path returns a string representing the path of the given GizmoData object relative to the root in dot notation.
     * @param {GizmoData} gzd - The object to determine the path of.
     * @returns {string} - dot notation path (e.g. 'root.attribute.attribute')
     */
    static path(gzd) {
        let path = null;
        while (gzd.$trunk) {
            let key = gzd.$keyFcn();
            path = (path) ? `${key}.${path}` : key;
            gzd = gzd.$trunk;
        }
        return path;
    }

    /**
     * This callback is displayed as part of the Requester class.
     * @callback GizmoData~filter
     * @param {GizmoData} gzd - GizmoData node to evaluate
     * @returns {boolean} - boolean indicating if filter function matches for given GizmoData node
     */

    /**
     * findinTrunk attempts to find a GizmoData node matching the given filter in the trunk (parent nodes) of the given GizmoData object.
     * @param {GizmoData} gzd - The object to start the search at.
     * @param {GizmoData~filter} filter - predicate filter function to apply to each node in the trunk to determine a match
     * @returns {GizmoData} - the first trunk node that matches the filter, otherwise null.
     */
    static findInTrunk(gzd, filter) {
        for (let trunk=gzd.$trunk; trunk; trunk=trunk.$trunk) {
            if (filter(trunk)) return trunk;
        }
        return null;
    }

    /**
     * findinPath attempts to find a GizmoData node matching the given filter in the path (node and parent nodes) of the given GizmoData object.
     * @param {GizmoData} gzd - The object to start the search at.
     * @param {GizmoData~filter} filter - predicate filter function to apply to each node in the trunk to determine a match
     * @returns {GizmoData} - the first node that matches the filter, otherwise null.
     */
    static findInPath(gzd, filter) {
        for (let node=gzd; node; node=node.$trunk) {
            if (filter(node)) return node;
        }
        return null;
    }

    static applySchema(schema, gzd, spec) {
        // parse value from spec
        let storedValue = schema.parser(gzd, spec);

        // linkable arrays create a proxy object for value
        if (schema.link === 'array') {
            storedValue = new GizmoDataArray({trunk: gzd, array: (storedValue) ? storedValue : [], schema: schema});
        }

        // create property descriptor
        let d = {
            enumerable: schema.enumerable,
            // getter
            get: (schema.getter) ? (() => schema.getter(gzd, spec)) : (() => storedValue),
        };

        // assign setter for property (if not readonly/callable)
        if (!schema.readonly && !schema.callable) {
            d.set = (newValue) => {
                // schema setter (if set) is used to finalize data before being stored
                if (schema.setter) {
                    newValue = schema.setter(gzd, spec, newValue);
                }
                // handle change of data
                if (!Object.is(storedValue, newValue)) {
                    let oldValue = storedValue;
                    // linkable arrays create a proxy object for value (if value is set)
                    if (schema.link === 'array') {
                        // clear old value array
                        if (storedValue) storedValue.clear();
                        if (newValue) newValue = new GizmoDataArray({trunk: gzd, array: newValue, schema: schema});
                        storedValue = newValue;
                    // linkable attributes will be updated to unlink any old value and link new value (if set)
                    } else if (schema.link) {
                        if (storedValue) storedValue.$unlink();
                        storedValue = newValue;
                        if (storedValue) storedValue.$link(gzd, schema);
                    // all other values just get set
                    } else {
                        storedValue = newValue;
                    }
                    // handle updates to other autogenerated fields
                    for (const agk of gzd.constructor.$autogenKeys) {
                        if (schema.key === agk) continue;
                        let agschema = gzd.constructor.schema[agk];
                        // check if autogen defined as a filter, filter on key of value changed
                        if (typeof agschema.autogen === 'function' && !agschema.autogen(schema.key)) continue;
                        // reset autogenerated value to default, setter will take care of updating value
                        //console.log(`reset ${gzd}[${agk}] to ${agschema.dflt} due to change in ${schema.key}`);
                        gzd[agk] = agschema.dflt;
                    }
                    if (schema.onSet) schema.onSet(gzd, oldValue, newValue);
                    console.log(`gzd: ${gzd} key: ${schema.key}`);
                    let trunkSetter = gzd.constructor.findInPath(gzd, (gzn) => gzn.$schema && gzn.$schema.onBranchSet);
                    if (trunkSetter) {
                        trunkSetter.$schema.onBranchSet(gzd, schema.key, oldValue, newValue);
                    }
                    // trigger update if attribute is eventable
                    if (schema.eventable && !gzd.constructor.findInPath(gzd, (gzn) => gzn.$schema && !gzn.$schema.eventable)) {
                        // find event emitter in path
                        let root = gzd.constructor.root(gzd);
                        // emit
                        if (EvtSystem.isEmitter(root)) {
                            let path = gzd.constructor.path(gzd);
                            let key = (path) ? `${path}.${schema.key}` : schema.key;
                            let renderable = schema.renderable || gzd.constructor.findInPath(gzd, (gzn) => gzn.$schema && gzn.$schema.renderable);                             
                            EvtSystem.trigger(root, 'gizmo.set', { set: { [key]: storedValue }, render: renderable });
                        }
                    }
                }
            }
        }

        // assign property
        if (schema.callable) {
            Object.defineProperty(Object.getPrototypeOf(gzd), schema.key, d);
        } else {
            Object.defineProperty(gzd, schema.key, d);
        }

        // link data
        if (storedValue && schema.link && schema.link !== 'array') {
            //console.log(`linking ${gzd} to ${value} for key ${schema.key}`);
            storedValue.$link(gzd, schema);
        }

    }

    /**
     * Create a GizmoData instance
     * @param {object} [spec={}] - object with key/value pairs used to pass properties to the constructor
     * @param {boolean} [applySchema=true] - defines if schema should be applied to object (used to by Gizmo class)
     */
    constructor(spec={}, applySchema=true) {
        this.constructor.init();

        let trunk;
        let schema;
        let keyFcn = () => (schema) ? schema.key : null;

        Object.defineProperty(this, '$trunk', {
            enumerable: false,
            get: (() => {
                Stats.count('gzd.$trunk');
                return trunk;
            }),
        });
        Object.defineProperty(this, '$schema', {
            enumerable: false,
            get: (() => {
                Stats.count('gzd.$schema');
                return schema;
            }),
        });
        Object.defineProperty(this, '$keyFcn', {
            enumerable: false,
            get: (() => {
                Stats.count('gzd.$keyFcn');
                return keyFcn;
            }),
        });

        Object.defineProperty(this, '$link', {
            get: () => ((p, s, kf) => {
                //console.log(`-- gzd link p:${p} s:${s}`);
                trunk = p;
                schema = s;
                if (kf) keyFcn = kf;

                this.atLink(trunk);

                // regenerate updates to autogenerated fields
                for (const agk of this.constructor.$autogenKeys) {
                    let agschema = this.constructor.schema[agk];
                    if (typeof agschema.autogen === 'function' && !agschema.autogen('$trunk')) continue;
                    // reset autogenerated value to default, setter will take care of updating value
                    //console.log(`reset ${this}[${agk}] to ${agschema.dflt} due to link in trunk ${trunk} from ${this}`);
                    this[agk] = agschema.dflt;
                }

            }),
        });

        Object.defineProperty(this, '$unlink', {
            get: () => (() => {
                //console.log(`-- gzd unlink`);
                let oldTrunk = trunk;
                trunk = null;
                schema = null;

                this.atUnlink(oldTrunk);

                // regenerate updates to autogenerated fields
                for (const agk of this.constructor.$autogenKeys) {
                    let agschema = this.constructor.schema[agk];
                    if (typeof agschema.autogen === 'function' && !agschema.autogen('$trunk')) continue;
                    // reset autogenerated value to default, setter will take care of updating value
                    //console.log(`reset ${this}[${agk}] to ${agschema.dflt} due to unlink in trunk ${trunk}`);
                    this[agk] = agschema.dflt;
                }
            }),
        });

        // create properties based on schema
        if (applySchema) {
            for (const schema of Object.values(this.constructor.schema)) {
                this.constructor.applySchema(schema, this, spec);
            }
        }
    }

    /**
     * destroy is called to unlink this GizmoData instance
     */
    destroy() {
        for (const schema of Object.values(this.constructor.schema)) {
            if (schema.link && this[schema.key]) {
                if (schema.link === 'array') {
                    for (const gzd of this[schema.key]) gzd.destroy();
                } else {
                    this[schema.key].destroy();
                }
                this[schema.key] = null;
            }
        }
    }

    /**
     * atLink is a method called whenever a GizmoData object is linked to a trunk (parent) data object.  By default, no action is taken.
     * Override this method in a subclass to perform actions when the instance of the data object is linked.
     * @param {GizmoData} trunk - trunk data object that has been linked to the current object.
     */
    atLink(trunk) {
    }
    
    /**
     * atUnlink is a method called whenver a GizmoData object is unlinked from a trunk (parent) data object.  By default, no action is taken.
     * Override this method in a subclass to perform class specific logic when an object is unlinked.
     * @param {GizmoData} trunk - trunk data object that has been linked to the current object.
     */
    atUnlink(trunk) {
    }

    $regen() {
        // regenerate updates to autogenerated fields
        for (const agk of this.constructor.$autogenKeys) {
            let agschema = this.constructor.schema[agk];
            // reset autogenerated value to default, setter will take care of updating value
            //console.log(`reset ${this}[${agk}] to ${agschema.dflt} due to regen`);
            this[agk] = agschema.dflt;
        }
    }

    /**
     * toString prints a string representation of the GizmoData
     * @returns {string}
     */
    toString() {
        return Fmt.toString(this.constructor.name);
    }

}

class GizmoDataArray {
    constructor(spec={}) {
        this.trunk = spec.trunk;
        this.array = spec.array || [];
        this.schema = spec.schema;
        let link = this.link.bind(this);
        let unlink = this.unlink.bind(this);
        let clear = this.clear.bind(this);
        for (const el of this.array) link(-1, el, false);
        return new Proxy(this.array, {
            get(obj, prop) {
                switch (prop) {
                    case 'clear': 
                        return () => {
                            clear();
                        }
                    case 'push':
                        return (...v) => {
                            let i=obj.length;
                            for (const el of v) link(i++, el);
                            return obj.push(...v);
                        }
                    case 'unshift':
                        return (...v) => {
                            let i=0;
                            for (const el of v) link(i++, el);
                            return obj.unshift(...v);
                        }
                    case 'pop': return () => {
                        let idx = obj.length-1;
                        let v = obj.pop();
                        unlink(idx, v, (idx>=0));
                        return v;
                    }
                    case 'shift': return () => {
                        let idx = (obj.length) ? 0 : -1;
                        let v = obj.shift();
                        unlink(idx, v, (idx>=0));
                        return v;
                    }
                    case 'splice': return (start, deleteCount=0, ...v) => {
                        let i = start;
                        for (const el of v) link(i++, el);
                        for (let i=0; i<deleteCount; i++) unlink(start+i, obj[start+i], i==v.length);
                        return obj.splice(start, deleteCount, ...v);
                    }

                }
                return obj[prop];
            },
            set(obj, prop, value) {
                if (!isNaN(prop)) {
                    let idx = parseInt(prop)
                    if (idx >= 0) {
                        unlink(idx, obj[idx], false);
                        link(idx, value);
                    }
                }
                obj[prop] = value;
                return true;
            }
        });
    }

    link(idx, value, eventable=true) {
        if (value && value instanceof GizmoData) {
            value.$link(this.trunk, this.schema, () => {
                let i = this.array.indexOf(value);
                return `${this.schema.key}[${i}]`;
            });
        }
        if (eventable) {
            if (this.schema.eventable && !GizmoData.findInTrunk(this.trunk, (v) => v.$schema && !v.$schema.eventable)) {
                // find event emitter in path
                let root = GizmoData.root(this.trunk);
                // emit
                if (EvtSystem.isEmitter(root)) {
                    let path = GizmoData.path(this.trunk);
                    let key = (path) ? `${path}.${this.schema.key}[${idx}]` : `${this.schema.key}[${idx}]`;
                    EvtSystem.trigger(root, 'gizmo.set', { 'set': { [key]: value }});
                }
            }
        }
    }

    unlink(idx, value, eventable=true) {
        if (value && value.$gdl) {
            value.$gdl.trunk = null;
            value.$gdl.schema = null;
            value.$gdl.keyFcn = null;
        }
        if (eventable) {
            if (this.schema.eventable && !GizmoData.findInTrunk(this.trunk, (v) => v.$schema && !v.$schema.eventable)) {
                // find event emitter in path
                let root = GizmoData.root(this.trunk);
                // emit
                if (EvtSystem.isEmitter(root)) {
                    let path = GizmoData.path(this.trunk);
                    let key = (path) ? `${path}.${this.schema.key}[${idx}]` : `${this.schema.key}[${idx}]`;
                    EvtSystem.trigger(root, 'gizmo.set', { 'set': { [key]: null }});
                }
            }
        }
    }

    clear() {
        for (const v of this.array) {
            this.unlink(-1, v, false);
        }
    }

}