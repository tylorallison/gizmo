export { SerialData, Serializer };

import { Fmt } from './fmt.js';
import { Gizmo } from './gizmo.js';
import { GizmoData } from './gizmoData.js';
import { Hierarchy } from './hierarchy.js';
import { Util } from './util.js';


class SerialData {
    static fromStr(str) {
        let spec = JSON.parse(str);
        return new this(spec);
    }
    constructor(spec={}) {
        this.xgzos = spec.xgzos || [];
    }

    asString() {
        return JSON.stringify(this);
    }
}

class Serializer {

    static xifyGizmoData(sdata, gzd) {
        // test for gizmo data
        if (!(gzd instanceof GizmoData)) return null;
        // gzd object is serialized as an standard object based on object schema
        let sobj = {
            $gzx: true,
            cls: gzd.constructor.name,
        };
        for (const schema of Object.values(gzd.constructor.schema)) {
            // only schema keys marked for serialization are serialized
            if (!schema.serializable) continue;
            let value = gzd[schema.key];
            if (value === undefined) continue;
            // asset references are handled by creating an asset spec
            if (value.hasOwnProperty('assetTag')) {
                sobj[schema.serializeKey] = {
                    cls: 'AssetRef',
                    assetTag: value.assetTag,
                };
            // gizmos are serialized as separate objects in stored data
            } else if (schema.gizmo) {
                if (Array.isArray(value)) {
                    sobj[schema.serializeKey] = [];
                    for (const item of value) sobj[schema.serializeKey].push(this.xifyGizmo(sdata, item));
                } else {
                    sobj[schema.serializeKey] = this.xifyGizmo(sdata, value);
                }
            // linked data is recursively serialized
            } else if (schema.link) {
                if (Array.isArray(value)) {
                    sobj[schema.serializeKey] = [];
                    for (const item of value) sarray.push(this.xifyGizmoData(sdata, item));
                } else {
                    sobj[schema.serializeKey] = this.xifyGizmoData(sdata, value);
                }
            // all other data is assumed to be directly serializable
            } else {
                // copy based on schema function (defaults to deep copy)
                sobj[schema.serializeKey] = schema.serializeFcn(sdata, sobj, value);
            }
        }
        return sobj;
    }

    static xifyGizmo(sdata, gzo) {
        // test for gizmo
        if (!(gzo instanceof Gizmo)) return null;
        // save new serialized gzo
        sdata.xgzos.push(this.xifyGizmoData(sdata, gzo));
        return {
            cls: 'GizmoRef',
            gid: gzo.gid,
        }
    }

    static restore(sdata, generator) {
        let gzos = [];
        let refs = {};
        for (const xgzo of sdata.xgzos) {
            // resolve gizmo references
            let swaps = [];
            for (const [k,v,obj] of Util.kvWalk(xgzo)) {
                if (v && typeof v === 'object' && v.cls === 'GizmoRef') {
                    let ref = refs[v.gid];
                    if (ref) swaps.push([k, ref, obj]);
                }
            }
            for (const [k,v,obj] of swaps) obj[k] = v;
            // generate
            let gzo = generator.generate(xgzo);
            refs[xgzo.gid] = gzo;
            gzos.push(gzo);
        }
        // purge non-root gizmos
        for (let i=gzos.length-1; i>=0; i--) {
            let gzo = gzos[i];
            if (Hierarchy.root(gzo) !== gzo) {
                gzos.splice(i, 1);
            }
        }
        return gzos;
    }

}