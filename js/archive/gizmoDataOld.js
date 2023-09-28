export { GizmoData, GizmoDataArray, GizmoMap };

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
     * eachinTrunk iterates through each node in the given trunk of the given GizmoData node and applies the given filter.  Every match is yielded.
     * @generator
     * @param {GizmoData} gzd - The object to start the search at.
     * @param {GizmoData~filter} filter - predicate filter function to apply to each node in the trunk to determine a match
     * @yields {GizmoData} - the first trunk node that matches the filter, otherwise null.
     */
    static *eachInTrunk(gzd, filter) {
        for (let trunk=gzd.$trunk; trunk; trunk=trunk.$trunk) {
            if (filter(trunk)) yield trunk;
        }
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

    /**
     * eachinPath iterates through each node in the given trunk of the given GizmoData node (starting at the given node) and applies the given filter.  
     * Every match is yielded.
     * @generator
     * @param {GizmoData} gzd - The object to start the search at.
     * @param {GizmoData~filter} filter - predicate filter function to apply to each node in the trunk to determine a match
     * @yields {GizmoData} - the first node that matches the filter, otherwise null.
     */
    static *eachInPath(gzd, filter) {
        for (let node=gzd; node; node=node.$trunk) {
            if (filter(node)) yield node;
        }
    }

    /**
     * applySchema creates a new object property for the given schema definition attached to the given gizmo data structure and with the given 
     * object specification
     * @param {Schema} schema - the schema that defines the object property
     * @param {GizmoData} gzd - the gizmo data instance to attach the property to
     * @param {GizmoSpec} spec - the gizmo spec associated with the gizmo data instance
     */
    static applySchema(schema, gzd, spec) {
        // this local variable is the backing store to the property that will be assigned to the given GizmoData object for this schema entry.
        // -- parse value from spec.
        let storedValue = schema.parser(gzd, spec);
        //console.log(`${gzd}.${schema.key} value from parser: ${storedValue}`);

        // linkable arrays create a proxy object for value
        if (schema.link === 'array') {
            storedValue = new GizmoDataArray({trunk: gzd, array: (storedValue) ? storedValue : [], schema: schema});
        } else if (schema.link === 'map') {
            storedValue = new GizmoMap({trunk: gzd, map: storedValue, schema: schema});
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
                // if attribute is attached to a readonly trunk, don't allow updates
                if (gzd.$pathReadonly) {
                    return;
                }
                // schema setter (if set) is used to finalize data before being stored
                if (schema.setter) {
                    newValue = schema.setter(gzd, spec, newValue);
                }
                // handle change of data
                if (!Object.is(storedValue, newValue)) {
                    //console.log(`${gzd}.${schema.key} storedValue (${storedValue}) !== (${newValue})`);
                    let oldValue = storedValue;
                    // linkable arrays create a proxy object for value (if value is set)
                    if (schema.link === 'array') {
                        // clear old value array
                        if (storedValue) storedValue.clear();
                        if (newValue) newValue = new GizmoDataArray({trunk: gzd, array: newValue, schema: schema});
                        storedValue = newValue;
                    } else if (schema.link === 'map') {
                        // clear old value
                        if (storedValue) storedValue.clear();
                        if (newValue) newValue = new GizmoMap({trunk: gzd, map: newValue, schema: schema});
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
                    // handle updates to autogenerated fields associated with this data node
                    for (const agk of schema.autogendeps) {
                        if (agk in gzd) gzd[agk] = '#autogen#';
                    }
                    //  autogen updates for linked trunk nodes are controlled by GizmoData.$pathAutogen
                    if (gzd.$pathAutogen) {
                        for (const gzt of gzd.constructor.eachInPath(gzd, (gzn) => (gzn.$schema && gzn.$schema.autogendeps.size))) {
                            for (const agk of gzt.$schema.autogendeps) {
                                if (agk in gzt.$trunk) gzt.$trunk[agk] = '#autogen#';
                            }
                        }
                    }
                    // handle atUpdate updates
                    // -- per attribute settings are controlled by attribute schema
                    //if (schema.atUpdate) console.log(`set calling ${gzd.$trunk}:${gzd} ${schema.key} atUpdate ${oldValue} => ${newValue}`);
                    if (schema.atUpdate) schema.atUpdate(gzd.$trunk, gzd, schema.key, oldValue, newValue);
                    // -- path updates are controlled by GizmoData.$pathUpdatable
                    if (gzd.$pathUpdatable) {
                        for (const gzt of gzd.constructor.eachInPath(gzd, (gzn) => (gzn.$schema && gzn.$schema.atUpdate))) {
                            //if (schema.atUpdate) console.log(`set path calling ${gzt.$trunk}:${gzd} ${schema.key} atUpdate ${oldValue} => ${newValue}`);
                            gzt.$schema.atUpdate(gzt.$trunk, gzd, schema.key, oldValue, newValue);
                        }
                    }

                    // trigger update if attribute is eventable
                    if (schema.eventable && gzd.$pathEventable) {
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
        if (storedValue && schema.link && schema.link !== 'array' && schema.link !== 'map') {
            //console.log(`linking ${gzd} to ${value} for key ${schema.key}`);
            storedValue.$link(gzd, schema);
        }

        // handle updates to autogenerated fields associated with this data node
        //console.log(`apply schema finishing for ${gzd}.${schema.key}: pathautogen: ${gzd.$pathAutogen}`);
        for (const agk of schema.autogendeps) {
            //console.log(`... ${gzd} autogen ${agk} has: ${agk in gzd}`);
            if (agk in gzd) gzd[agk] = '#autogen#';
        }
        // -- path updates are controlled by GizmoData.$pathUpdatable
        if (gzd.$pathAutogen) {
            for (const gzt of gzd.constructor.eachInPath(gzd, (gzn) => (gzn.$schema && gzn.$schema.autogendeps.size))) {
                for (const agk of gzt.$schema.autogendeps) {
                    //console.log(`... ${gzd.$trunk} autogen ${agk}`);
                    if (agk in gzd.$trunk) gzt.$trunk[agk] = '#autogen#';
                }
            }
        }

    }

    /**
     * Create a GizmoData instance
     * @param {object} [spec={}] - object with key/value pairs used to pass properties to the constructor
     * @param {boolean} [applySchema=true] - defines if schema should be applied to object (used to by Gizmo class)
     */
    constructor(spec={}, applySchema=true) {
        this.constructor.init();

        // local variables used as cache variables associated with the state of this GizmoData object
        let trunk;
        let schema;
        let keyFcn = () => (schema) ? schema.key : null;
        // -- pathEventable, events are triggered for this GizmoData if 
        //    (a) object is not linked or linked schema for this object has schema.eventable set to true and 
        //    (b) no nodes in the path of this GizmoData object have schema.eventable set to false
        let pathEventable = true;
        // -- pathUpdatable: atUpdate is called when values for attributes of this GizmoData are updated.  atUpdate can be called 
        //    per-attribute but also if any node in the tree has an atUpdate callback.  pathUpdatable is set for this gizmoData if
        //    (a) object is linked and linked schema for this object has schema.atUpdate set
        //    (b) object is linked and a node in the path of this GizmoData object has schema.atUpdate set
        let pathUpdatable = false;
        // -- pathAutogen: auto generated fields are updated when dependencies are updated.  pathAutogen is marked as true if:
        //    (a) object is linked and linked schema for this object has schema.autogendeps set
        //    (b) object is linked and a node in the path of this GizmoData object has an autogen dependency
        let pathAutogen = false;
        // -- pathReadonly: set to indicate that an node in the path of the given GizmoData is readonly.  Set to be true if:
        //    (a) object is linked and linked schema indicates this element is readonly
        //    (b) object is linked and a node in the path of this GizmoData object has schema.readonly set
        let pathReadonly = false;

        // gizmo data specific properties
        // -- $trunk defines the parent gizmo data reference (if any)
        Object.defineProperty(this, '$trunk', {
            enumerable: false,
            get: (() => {
                Stats.count('gzd.$trunk');
                return trunk;
            }),
        });
        // -- $schema defines the schema for this instance of gizmo data as attached to the $trunk instance.  Only present if $trunk is set.
        Object.defineProperty(this, '$schema', { enumerable: false, get: (() => { return schema; }) });
        // -- $keyFcn defines how to lookup the key for this instance of gizmo data
        Object.defineProperty(this, '$keyFcn', { enumerable: false, get: (() => { return keyFcn; }) });
        // -- $pathEventable caches whether or not all nodes in the trunk of this object are marked as eventable
        Object.defineProperty(this, '$pathEventable', { enumerable: false, get: (() => { return pathEventable; }) });
        // -- $pathEventable caches whether or not all nodes in the trunk of this object are marked as updatable
        Object.defineProperty(this, '$pathUpdatable', { enumerable: false, get: (() => { return pathUpdatable; }) });
        // -- $pathEventable caches whether or not any node in the trunk of this object is marked as auto-generated
        Object.defineProperty(this, '$pathAutogen', { enumerable: false, get: (() => { return pathAutogen; }) });
        // -- $pathEventable caches whether or not any nodes in the trunk of this object are marked as readonly
        Object.defineProperty(this, '$pathReadonly', { enumerable: false, get: (() => { return pathReadonly; }) });
        // -- defines method to update link cache variables
        Object.defineProperty(this, '$linkUpdate', {
            get: () => ((seen=new WeakSet()) => {
                if (seen.has(this)) return;
                seen.add(this);
                if (trunk) {
                    pathEventable = schema.eventable && trunk.$pathEventable;
                    pathUpdatable = !schema.nopathgen && (schema.atUpdate || trunk.$pathUpdatable);
                    //pathAutogen = !schema.nopathgen && (schema.autogendeps.size || trunk.$pathAutogen);
                    pathAutogen = (schema.autogendeps.size || trunk.$pathAutogen);
                    pathReadonly = schema.readonly || trunk.$pathReadonly;
                } else {
                    pathEventable = true;
                    pathUpdatable = false;
                    pathAutogen = false;
                    pathReadonly = false;
                }
                for (const aschema of Object.values(this.constructor.schema)) {
                    let att = this[aschema.key];
                    if (att && att instanceof GizmoData) {
                        att.$linkUpdate(seen);
                    }
                }
            }),
        });
        // -- defines method to set new trunk link
        Object.defineProperty(this, '$link', {
            get: () => ((p, s, kf) => {
                trunk = p;
                schema = s;
                if (kf) keyFcn = kf;
                // update path variables for this node and all dependent branch nodes
                this.$linkUpdate()
                this.atLink(trunk);
                // regenerate updates to autogenerated fields
                for (const agk of this.constructor.$autogenKeys) {
                    let agschema = this.constructor.schema[agk];
                    if (typeof agschema.autogen === 'function' && !agschema.autogen('$trunk')) continue;
                    // reset autogenerated value to default, setter will take care of updating value
                    if (agk in this) this[agk] = '#autogen#';
                }
                if (this.$pathAutogen) {
                    for (const gzt of this.constructor.eachInPath(this, (gzn) => (gzn.$schema && gzn.$schema.autogendeps.size))) {
                        for (const agk of gzt.$schema.autogendeps) if (agk in gzt.$trunk) gzt.$trunk[agk] = '#autogen#';
                    }
                }
            }),
        });
        // -- defines method to unset trunk link
        Object.defineProperty(this, '$unlink', {
            get: () => (() => {
                let oldTrunk = trunk;
                trunk = null;
                schema = null;
                // update path variables for this node and all dependent branch nodes
                this.$linkUpdate()
                this.atUnlink(oldTrunk);
                // regenerate updates to autogenerated fields
                for (const agk of this.constructor.$autogenKeys) {
                    let agschema = this.constructor.schema[agk];
                    if (typeof agschema.autogen === 'function' && !agschema.autogen('$trunk')) continue;
                    // reset autogenerated value to default, setter will take care of updating value
                    if (agk in this) this[agk] = '#autogen#';
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
                } else if (schema.link === 'map') {
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
        let destroy = this.destroy.bind(this);
        if (this.array.length) {
            for (const el of this.array) link(-1, el, false);
            this.doautogen();
        }
        return new Proxy(this.array, {
            get(obj, prop) {
                switch (prop) {
                    case 'destroy': 
                        return () => {
                            destroy();
                        }
                    case 'clear': 
                        return () => {
                            clear();
                        }
                    case 'push':
                        return (...v) => {
                            let i=obj.length;
                            let rv = obj.push(...v);
                            for (const el of v) link(i++, el);
                            return rv;
                        }
                    case 'unshift':
                        return (...v) => {
                            let i=0;
                            let rv = obj.unshift(...v);
                            for (const el of v) link(i++, el);
                            return rv;
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
                        let rv = obj.splice(start, deleteCount, ...v);
                        for (const el of v) link(i++, el);
                        for (let i=0; i<deleteCount; i++) unlink(start+i, obj[start+i], i==v.length);
                        return rv;
                    }
                }
                return obj[prop];
            },
            set(obj, prop, value) {
                obj[prop] = value;
                if (!isNaN(prop)) {
                    let idx = parseInt(prop)
                    if (idx >= 0) {
                        unlink(idx, obj[idx], false);
                        link(idx, value);
                    }
                }
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
            this.doautogen();
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
            this.doautogen();
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

    doautogen() {
        for (const agk of this.schema.autogendeps) {
            if (agk in this.trunk) this.trunk[agk] = '#autogen#';
        }
        if (this.trunk.$pathAutogen) {
            for (const gzt of this.trunk.constructor.eachInPath(this.trunk, (gzn) => (gzn.$schema && gzn.$schema.autogendeps.size))) {
                for (const agk of gzt.$schema.autogendeps) {
                    if (agk in gzt.$trunk) gzt.$trunk[agk] = '#autogen#';
                }
            }
        }
    }

    destroy() {
        for (const v of this.array) if (v && v instanceof GizmoData) v.destroy();
    }

    clear() {
        for (const v of this.array) {
            this.unlink(-1, v, false);
        }
    }

}

class GizmoMap {
    constructor(spec={}) {
        this.trunk = spec.trunk;
        this.map = spec.map || new Map();
        this.schema = spec.schema;
        let link = this.link.bind(this);
        let unlink = this.unlink.bind(this);
        let clear = this.clear.bind(this);
        let destroy = this.destroy.bind(this);
        if (this.map.size) {
            for (const [k,v] of this.map) link(k, v, false);
            this.doautogen();
        }
        return new Proxy(this.map, {
            get(obj, prop) {
                switch (prop) {
                    case 'destroy': 
                        return () => {
                            destroy();
                        }
                    case 'clear': 
                        return () => {
                            clear();
                        }
                    case 'set':
                        return (k,v) => {
                            let rv = obj.set(k,v);
                            link(k,v);
                            return rv;
                        }
                    case 'delete':
                        return (k) => {
                            let v = obj.get(k);
                            let rv = obj.delete(k)
                            unlink(k,v);
                            return rv;
                        }
                }
                let v = obj[prop];
                if (typeof v === 'function') v = v.bind(obj);
                return v;
            },
        });
    }

    doautogen() {
        //console.error(`>>> map autogen`);
        for (const agk of this.schema.autogendeps) {
            //console.log(`... ${this.trunk} autogen ${agk} has: ${agk in this.trunk}`);
            if (agk in this.trunk) this.trunk[agk] = '#autogen#';
        }
        if (this.trunk.$pathAutogen) {
            for (const gzt of this.trunk.constructor.eachInPath(this.trunk, (gzn) => (gzn.$schema && gzn.$schema.autogendeps.size))) {
                for (const agk of gzt.$schema.autogendeps) {
                    //console.log(`... ${gzt.$trunk} autogen ${agk}`);
                    if (agk in gzt.$trunk) gzt.$trunk[agk] = '#autogen#';
                }
            }
        }
        //console.log(`<<< map autogen`);
    }

    link(key, value, eventable=true) {
        if (value && value instanceof GizmoData) {
            value.$link(this.trunk, this.schema, () => {
                return `${this.schema.key}.${key}`;
            });
        }
        if (eventable) {
            // run auto generation for this value
            this.doautogen();
            if (this.schema.eventable && !GizmoData.findInTrunk(this.trunk, (v) => v.$schema && !v.$schema.eventable)) {
                // find event emitter in path
                let root = GizmoData.root(this.trunk);
                // emit
                if (EvtSystem.isEmitter(root)) {
                    let path = GizmoData.path(this.trunk);
                    let evtkey = (path) ? `${path}.${this.schema.key}.${key}` : `${this.schema.key}.${key}`;
                    EvtSystem.trigger(root, 'gizmo.set', { 'set': { [evtkey]: value }});
                }
            }
        }
    }

    unlink(key, value, eventable=true) {
        if (value && value instanceof GizmoData) {
            value.$unlink();
        }
        if (eventable) {
            // run auto generation for this value
            this.doautogen();
            if (this.schema.eventable && !GizmoData.findInTrunk(this.trunk, (v) => v.$schema && !v.$schema.eventable)) {
                // find event emitter in path
                let root = GizmoData.root(this.trunk);
                // emit
                if (EvtSystem.isEmitter(root)) {
                    let path = GizmoData.path(this.trunk);
                    let evtkey = (path) ? `${path}.${this.schema.key}${key}` : `${this.schema.key}.${key}`;
                    EvtSystem.trigger(root, 'gizmo.set', { 'set': { [evtkey]: null }});
                }
            }
        }
    }

    destroy() {
        for (const [k,v] of this.map) if (v && v instanceof GizmoData) v.destroy();
    }

    clear() {
        for (const [k,v] of this.map) {
            this.unlink(k, v, false);
        }
    }

}