export { AssetCtx };
import { GizmoCtx } from './gizmoCtx.js';

class AssetCtx extends GizmoCtx {

    static gassets = {};

    static get(tag, overrides={}) {
        return this.instance.get(tag, overrides);
    }

    // CONSTRUCTOR ---------------------------------------------------------
    constructor(spec={}) {
        super(spec);
        // the asset references defined by the user...
        this.xassets = Array.from(spec.xassets || []);
        // the raw media cache
        this.media = {};
        // the translated asset references with resolved media files
        this.assets = {};
    }

    async advance() {

        // collect set of media file references from asset specifications
        let mrefs = [];
        for (const [k,v,o] of Util.kvWalk(this.specs)) {
            if (v instanceof BaseRef && v.src && !mrefs.includes(v.src)) {
                mrefs.push(v.src);
            }
        }

        // load media assets from files, they are cached by file name
        const media = {};
        await FileLoader.load(mrefs, media);

        // populate assets
        for (const xasset of this.xasset) {
            let args = spec.args;
            let tag = (args && args.length) ? args[0].tag : 'tag';
            if (this.assets.hasOwnProperty(tag)) {
                console.error(`duplicate asset tag detected: ${tag}, previous definition: ${Fmt.ofmt(this.assets[tag])}, skipping: ${Fmt.ofmt(spec)}`);
                continue;
            }
            // asset spec is copied from input spec
            this.assets[tag] = Object.assign({}, spec);
        }
    }

    async load() {
        // load asset files
        this.media = {}

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
        return Promise.resolve();
    }
}