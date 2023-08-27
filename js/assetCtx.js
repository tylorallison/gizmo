import { GizmoCtx } from './gizmoCtx.js';

class AssetCtx extends GizmoCtx {

    // CONSTRUCTOR ---------------------------------------------------------
    constructor(spec={}) {
        // the asset references defined by the user...
        this.specs = Array.from(spec.specs || []);
        // the raw media loaded from media files
        this.media = {};
        // the translated asset references with resolved media files
        this.assets = {};
    }

    getMediaRefs() {
        let mrefs = [];
        for (const [k,v,o] of Util.kvWalk(this.specs)) {
            if (v instanceof BaseRef && v.src && !mrefs.includes(v.src)) {
                mrefs.push(v.src);
            }
        }
        return mrefs;
    }

    async load() {
        // load asset files
        this.media = {}
        await FileLoader.load(this.getMediaRefs(), this.media);
        // populate assets
        for (const spec of this.specs) {
            let args = spec.args;
            let tag = (args && args.length) ? args[0].tag : 'tag';
            if (this.assets.hasOwnProperty(tag)) {
                console.error(`duplicate asset tag detected: ${tag}, previous definition: ${Fmt.ofmt(this.assets[tag])}, skipping: ${Fmt.ofmt(spec)}`);
                continue;
            }
            if (args && args.length) args[0].assetTag = tag;
            // asset spec is copied from input spec
            this.assets[tag] = Object.assign({}, spec);
        }
        // once specs have been loaded, they get cleared
        this.specs = [];
        // resolve media references
        await this.resolve();
        // resolve asset references
        this.resolveAssets();
        // clear media references
        this.media = {}
    }

    async advance() {
        return Promise.resolve();
    }
    async withdraw() {
    }
}