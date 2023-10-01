export { Hierarchy, ExtHierarchy }

import { Evts } from './evt.js';

class Hierarchy {

    // STATIC METHODS ------------------------------------------------------
    static adopt(parent, child) {
        // ensure child is orphaned
        if (child.parent) {
            this.orphan(child);
        }
        // avoid cycles in parent
        if (this.findInRoot(parent, (v) => v === child)) {
            console.error(`hierarchy loop detected ${child} already in root for parent: ${parent}`);
            return;
        }
        // avoid cycles in children
        if (Array.isArray(parent.children)) {
            if (this.find(child, (v) => v === parent)) {
                console.error(`hierarchy loop detected ${child} already in children of parent: ${parent}`);
                return;
            }
        }
        // assign parent/child links
        child.parent = parent;
        if (Array.isArray(parent.children)) parent.children.push(child);
        // event handling
        Evts.trigger(child, 'GizmoAdopted', {parent: parent, child: child});
        Evts.trigger(parent, 'GizmoChilded', {parent: parent, child: child});
        let root = this.root(parent);
        Evts.trigger(child, 'GizmoRooted', {root: root});
        for (const dec of this.children(child)) {
            Evts.trigger(dec, 'GizmoRooted', {root: root});
        }
    }

    static orphan(child) {
        if (child.parent) {
            let parent = child.parent;
            if (Array.isArray(parent.children)) {
                let idx = parent.children.indexOf(child);
                if (idx != -1) {
                    parent.children.splice(idx, 1);
                }
            }
            child.parent = null;
            // trigger events
            Evts.trigger(child, 'GizmoOrphaned', {parent: parent, child: child});
            Evts.trigger(parent, 'GizmoUnchilded', {parent: parent, child: child});
        }
    }

    /**
     * find root for given object
     * @param {*} obj 
     */
    static root(obj) {
        while(obj && obj.parent) obj = obj.parent;
        return obj;
    }

    /**
     * find object in entire hierarchy
     * @param {*} obj 
     * @param {*} filter 
     */
    static findInRoot(obj, filter) {
        return this.find(this.root(obj), filter);
    }

    /**
     * find object in hierarchy (evaluating object and its children)
     * @param {*} obj 
     * @param {*} filter 
     */
    static find(obj, filter) {
        if (filter(obj)) return obj;
        for (const child of (obj.children || [])) {
            if (filter(child)) return child;
            let match = this.find(child, filter);
            if (match) return match;
        }
        return null;
    }

    static *findall(obj, filter) {
        if (filter(obj)) yield obj;
        for (const child of (obj.children || [])) {
            yield *this.findall(child, filter);
        }
    }

    /**
     * find object in parent hierarchy (evaluating parent hierarchy)
     * @param {*} obj 
     * @param {*} filter 
     */
    static findInParent(obj, filter) {
        for (let parent = obj.parent; parent; parent = parent.parent) {
            if (filter(parent)) return parent;
        }
        return null;
    }

    static *children(obj, filter) {
        for (const child of (Array.from(obj.children || []))) {
            if (child.children) {
                yield *this.children(child, filter);
            }
            if (!filter || filter(child)) yield child;
        }
    }

}

class ExtHierarchy {
    static apply(cls, spec={}) {
        cls.schema('parent', { link: false, serializable: false, parser: () => null });
        cls.schema('children', { link: false, parser: (o,x) => { 
            let v = x.children || [];
            for (const el of v) Hierarchy.adopt(o, el);
            return v;
        }, readonly: true });
    }
}
