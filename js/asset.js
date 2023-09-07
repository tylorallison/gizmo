export { Asset, GadgetRef, ImageRef, SheetRef, Sprite };

import { AssetCtx } from './assetCtx.js';
import { FileLoader } from './fileLoader.js';
import { Fmt } from './fmt.js';
import { Gadget } from './gizmo.js';
import { resolveImage } from './refs.js';
import { Util } from './util.js';

class GadgetRef extends Gadget {
    static _gid = 1;
    static referencable = true;
    static {
        //console.log(`here this: ${this}`);
        let p = this.prototype;
        //console.log(`p: ${p}`);
        this.prototype.doable = true;
    }
    static { this.schema('dbg', { dflt: false }); }
    static { this.schema('tag', { dflt: (o) => `${o.constructor.name}.${o.constructor._gid++}`}); }
    constructor(...args) {
        super(...args);
        console.log(`instance this ${this} hasown doable: ${this.hasOwnProperty('doable')} doable: ${this.doable} hasown dbg: ${this.hasOwnProperty('dbg')}`);
    }
    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }
}

class ImageRef extends GadgetRef {

    static { this.schema('src', { }); }
    static { this.schema('tag', { dflt: (o) => o.src }); }
    static { this.schema('scalex', { dflt: 1 }); }
    static { this.schema('scaley', { dflt: 1 }); }
    static { this.schema('smoothing', { dflt: true }); }
    static { this.schema('img', { }); }

    static {
        this._canvas = new OffscreenCanvas(16,16);
        this._ctx = this._canvas.getContext('2d');
    }

    static async resolver(media, encode=false) {
        let promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.addEventListener('load', () => { 
                console.log(`img: ${img}`);
                return resolve( img );
            });
            img.addEventListener('error', err => { console.error(`media: ${media} error: ${Fmt.ofmt(err)}`); reject(err) });
            let src = (encode) ? `data:image/png;base64,${Util.arrayBufferToBase64(media)}` : media;
            img.src = src;
        });
        return promise;
    }

    cpre(spec) {
        if ('scale' in spec) {
            let scale = spec.scale;
            if (!('scalex' in spec)) spec.scalex = scale;
            if (!('scaley' in spec)) spec.scaley = scale;
        }
    }

    async resolve() {
        let promise = this.constructor.resolver(this.src);
        if (this.scalex === 1 || this.scaley === 1) {
            return promise;
        } else {
            return promise.then(img => {
                let canvas = this.constructor._canvas;
                let ctx = this.constructor._ctx;
                canvas.width = this.width*this.scalex;
                canvas.height = this.height*this.scaley;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let savedSmoothing = ctx.imageSmoothingEnabled;
                ctx.imageSmoothingEnabled = this.smoothing;
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
                ctx.imageSmoothingEnabled = savedSmoothing;
                return this.constructor.resolver(canvas.toDataURL());
            });
        }
    }

}

class SheetRef extends ImageRef {

    //static { this.schema('src', { }); }
    //static { this.schema('tag', { dflt: (o) => o.src }); }
    //static { this.schema('scalex', { dflt: 1 }); }
    //static { this.schema('scaley', { dflt: 1 }); }
    //static { this.schema('smoothing', { dflt: true }); }
    //static { this.schema('img', { }); }
    static { this.schema('width', { dflt: 0 }); }
    static { this.schema('height', { dflt: 0 }); }
    static { this.schema('x', { dflt: 0 }); }
    static { this.schema('y', { dflt: 0 }); }

    async resolve() {
        let promise = this.constructor.resolver(this.src);
        //letpromise = resolveImage(media);
        return promise.then(img => {
            let canvas = this.constructor._canvas;
            let ctx = this.constructor._ctx;
            canvas.width = this.width*this.scalex;
            canvas.height = this.height*this.scaley;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let savedSmoothing = ctx.imageSmoothingEnabled;
            ctx.imageSmoothingEnabled = this.smoothing;
            ctx.drawImage(img, this.x, this.y, this.width, this.height, 0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = savedSmoothing;
            //return resolveImage(canvas.toDataURL(), false);
            return this.constructor.resolver(canvas.toDataURL());
        });
    }
}

/**
 * Assets represent game resources such as textures, audio files, etc. used by the game.
 * Every asset is either linked to the current asset context (the asset context that is in scope when the asset was created)
 * or a global asset list.  Assets linked to the asset context will only be referencable while that asset context is in scope.  Global
 * assets are always referencable once loaded.
 * All assets will be cached within the asset context (or globally) and can be referenced by an asset tag.
 * Asset contents can contain media references.  Media references link an external file/url or data to be loaded with the asset.  Assets will
 * asynchronously load media references.
 * Assets and media references can also be preloaded during asset context advancement.
 */
class Asset extends Gadget {

    static _gid = 1;

    static { this.schema('tag', { dflt: (o) => `${o.constructor.name}.${o.constructor._gid++}`}); }
    static { this.schema('global', { readonly: true }); }
    constructor(spec={}) {
        super(spec);
        // scan for references
        for (const [k,v,o] of Util.kvWalk(this.$store)) {
            //console.log(`k: ${k} v: ${v}`)
            if (v && v.constructor && v.constructor.referencable && v.src) {
                console.log(`${this} referencable: ${k} ${v}`);
                // media tag
                let mtag = v.tag;
                if (mtag in AssetCtx.instance.media) {
                    console.log(`media cache hit for: ${mtag}`);
                    Promise.resolve(AssetCtx.instance.media[mtag]).then((rslt) => {
                        o[k] = rslt;
                    });
                } else {
                    console.log(`media cache miss for: ${mtag}`);
                    let promise = new Promise((resolve, reject) => {
                        v.resolve().then((rslt) => {
                            console.log(`media cache set for: ${mtag} => ${rslt}`);
                            //AssetCtx.instance.media[mtag] = rslt;
                            o[k] = rslt;
                            resolve(rslt);
                        });
                    });
                    AssetCtx.instance.media[mtag] = promise;
                }
            }
        }
    }

    toString() {
        return Fmt.toString(this.constructor.name, this.tag);
    }
}

class Sprite extends Asset {

    static resolveImage(media, encode=true) {
        let promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.addEventListener('load', () => { 
                //console.log(`img: ${img}`);
                return resolve( img );
            });
            //console.log(`media: ${media}`);
            img.addEventListener('error', err => { console.error(`media: ${media} error: ${Fmt.ofmt(err)}`); reject(err) });
            let src = (encode) ? `data:image/png;base64,${Util.arrayBufferToBase64(media)}` : media;
            img.src = src;
        });
        return promise;
    }

    /*
    static loader(src, options={}) {
        let canvas = this.constructor._canvas;
        let ctx = this.constructor._ctx;
        canvas.width = this.width*this.scalex;
        canvas.height = this.height*this.scaley;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let savedSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = this.smoothing;
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = savedSmoothing;
        return resolveImage(canvas.toDataURL(), false);
    }
    */

    static async loader(src, tag, options={}) {
        let media;
        if (src in AssetCtx.instance.media) {
            console.log(`media cache hit for: ${src}`);
            media = await AssetCtx.instance.media[src];
        } else {
            console.log(`media cache miss for: ${src}`);
            let promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.addEventListener("load", () => resolve(img));
                img.addEventListener("error", err => reject(err));
                img.src = src;
            });
            AssetCtx.instance.media[src] = promise;
            media = await promise;
        }
        return media;

        /*
        //let promise = resolveImage(media);
        return promise.then(img => {
            let canvas = this.constructor._canvas;
            let ctx = this.constructor._ctx;
            canvas.width = this.width*this.scalex;
            canvas.height = this.height*this.scaley;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let savedSmoothing = ctx.imageSmoothingEnabled;
            ctx.imageSmoothingEnabled = this.smoothing;
            ctx.drawImage(img, this.x, this.y, this.width, this.height, 0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = savedSmoothing;
            return resolveImage(canvas.toDataURL(), false);
        });
        */
    }

    static { this.schema('img', {readonly: false}); }
    static { this.schema('width', {getter: ((o,x) => ((o.img) ? o.img.width : 0)), readonly: true}); }
    static { this.schema('height', {getter: ((o,x) => ((o.img) ? o.img.height : 0)), readonly: true}); }

    static from(src, options={}) {
        let sprite = new Sprite();
        this.loader(src, 'tag', options).then((img) => {
            console.log(`sprite loaded: ${img}`);
            sprite.img = img;
        });
        //FileLoader.loadImage(src).then( (img) => sprite.img = img);
        return sprite;
    }

};