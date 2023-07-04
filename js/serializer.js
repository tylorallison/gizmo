export { SerialData, Serializer };

import { Fmt } from './fmt.js';
import { Hierarchy } from './hierarchy.js';
import { Util } from './util.js';


class SerialData {
    static fromStr(str) {
        let spec = JSON.parse(str);
        return new this(spec);
    }
    constructor(spec={}) {
        this.xgzos = spec.xgzos || {};
    }

    asString() {
        return JSON.stringify(this);
    }
}

class Serializer {

    static xifyData(sdata, obj, sobj={}) {
        if (!obj) return null;
        if (typeof obj !== 'object') return obj;
        for (const [k,v] of Object.entries(obj)) {
            if (v && typeof v === 'object') {
                sobj[k] = this.xify(sdata, v);
            } else {
                sobj[k] = v;
            }
        }
        return sobj;
    }

    static xify(sdata, obj) {
        if (!obj) return null;
        if (obj.xify) return obj.xify(sdata);
        if (typeof obj !== 'object') return obj;
        let sobj = (Array.isArray(obj)) ? [] : {};
        return this.xifyData(sdata, obj, sobj);
    }

    static restore(sdata, generator) {
        let gzos = [];
        let refs = {};
        for (const xgzo of Object.values(sdata.xgzos)) {
            // resolve gizmo references
            let swaps = [];
            for (const [k,v,obj] of Util.kvWalk(xgzo)) {
                if (v && typeof v === 'object' && v.cls === '$GizmoRef') {
                    //console.log(`found gizmoref in ${Fmt.ofmt(obj)} ${Fmt.ofmt(v)}`)
                    let ref = refs[v.gid];
                    if (ref) swaps.push([k, ref, obj]);
                }
            }
            for (const [k,v,obj] of swaps) obj[k] = v;
            // generate
            let gzo = generator.generate(xgzo);
            //console.log(`push ref: ${xgzo.args[0].gid} ${gzo}`);
            refs[xgzo.args[0].gid] = gzo;
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