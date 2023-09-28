export { Media, ImageMedia };

import { Asset } from './asset.js';
import { AssetCtx } from './assetCtx.js';

/**
 * Media assets are any assets loaded from a file, URI, or data buffer
 * The given source is asynchronously loaded and stored to the data element.
 */
class Media extends Asset {
    static { this.schema('src', { readonly: true }); }
    static { this.schema('data', {}); }
    static { this.schema('tag', { order: 1, dflt: (o) => o.src }); }

    static from(src) {
        let mediaSpec;
        if (typeof src === 'string') {
            mediaSpec = { src: src };
        } else if (src.$gzx) {
            mediaSpec = src.args[0];
        } else {
            mediaSpec = src;
        }
        let media = new this(mediaSpec);
        return media;
    }

    static async load(src) {
        return new Promise((resolve) => {
            let media = this.from(src);
            media.load().then(() => {
                //console.log(`resolved media gives: ${media}`);
                resolve(media);
            });
        });
    }

    constructor(...args) {
        super(...args);
        if (!this.data) this.load();
    }

    async load() {
        if (this.tag in AssetCtx.media) {
            //console.log(`media cache hit for: ${this.tag}`);
            return Promise.resolve(AssetCtx.media[this.tag]).then((rslt) => {
                this.data = rslt;
            });
        }
        //console.log(`media cache miss for: ${this.tag}`);
        let promise = new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.crossOrigin = 'Anonymous';
            req.responseType = 'arraybuffer';
            req.addEventListener('load', () => {
                //console.log(`loaded`);
                this.data = req.response;
                return resolve( req.response );
            });
            req.addEventListener('error', err => { console.error('error: ' + Fmt.ofmt(err)); reject(err) });
            req.open('GET', this.src, true);
            req.setRequestHeader('Cache-Control', 'no-store');
            req.send()
        });
        AssetCtx.media[this.tag] = promise;
        return promise;
    }

}

class ImageMedia extends Media {
    static { this.schema('scalex', { dflt: 1 }); }
    static { this.schema('scaley', { dflt: 1 }); }
    static { this.schema('smoothing', { dflt: true }); }
    static { this.schema('width', { dflt: 0 }); }
    static { this.schema('height', { dflt: 0 }); }
    static { this.schema('x', { dflt: 0 }); }
    static { this.schema('y', { dflt: 0 }); }

    static {
        this._canvas = document.createElement('canvas');
        this._ctx = this._canvas.getContext('2d');
    }

    cpre(spec) {
        if ('scale' in spec) {
            let scale = spec.scale;
            if (!('scalex' in spec)) spec.scalex = scale;
            if (!('scaley' in spec)) spec.scaley = scale;
        }
    }

    static async loadFromSource(src) {
        let promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener("load", () => {
                resolve(img);
            })
            img.addEventListener("error", err => reject(err));
            img.src = src;
        });
        return promise;
    }

    async load() {
        // load from source
        let promise;
        // file loading can be cached to asset context -- cache lookup
        if (this.tag in AssetCtx.media) {
            //console.log(`image media cache hit for: ${this.tag}`);
            promise = AssetCtx.media[this.tag];
        } else {
            promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.addEventListener("load", () => {
                    resolve(img);
                });
                img.addEventListener("error", err => reject(err));
                img.src = this.src;
            });
            // file loading can be cached to asset context -- cache store
            //console.log(`tag: ${this.tag}`);
            AssetCtx.media[this.tag] = promise;
        }

        // if scaling, translation, or snipping is required, write image from source to internal canvas, then capture that canvas to a new image
        if (this.scalex !== 1 || this.scaley !== 1 || this.width !== 0 || this.height !== 0 || this.x !== 0 || this.y !== 0) {
            promise = promise.then(img => {
                let canvas = this.constructor._canvas;
                let ctx = this.constructor._ctx;
                let width = (this.width) ? this.width : img.width;
                let height = (this.height) ? this.height : img.height;
                canvas.width = width * this.scalex;
                canvas.height = height * this.scaley;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let savedSmoothing = ctx.imageSmoothingEnabled;
                ctx.imageSmoothingEnabled = this.smoothing;
                ctx.drawImage(img, this.x, this.y, width, height, 0, 0, canvas.width, canvas.height);
                ctx.imageSmoothingEnabled = savedSmoothing;
                return this.constructor.loadFromSource(canvas.toDataURL());
            });
        }
        // store resulting image to media
        promise.then((img) => {
            this.data = img;
        });
        return promise;
    }
}