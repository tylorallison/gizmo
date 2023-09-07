export { Media, ImageMedia };

import { Asset } from './asset.js';

class Media extends Asset {
    static { this.schema('src', {}); }
    static { this.schema('data', {}); }
    static { this.schema('tag', { dflt: (o) => o.src }); }

    static async _load(src) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.crossOrigin = 'Anonymous';
            req.responseType = 'arraybuffer';
            req.addEventListener('load', () => {
                return resolve( req.response );
            });
            req.addEventListener('error', err => { console.error('error: ' + Fmt.ofmt(err)); reject(err) });
            req.open('GET', src, true);
            req.setRequestHeader('Cache-Control', 'no-store');
            req.send()
        });
    }

    static async load(src, spec={}) {
        return new Promise((resolve) => {
            let media = new Media(Object.assign({src: src}, spec));
            this._load(src).then((buffer) => {
                media.data = buffer;
                resolve(media);
            });
        });
    }

    static from(src, spec={}) {
        let media = new Media(Object.assign({src: src}, spec));
        this._load(src).then((buffer) => {
            media.data = buffer;
        });
        return media;
    }

}

class ImageMedia extends Media {

    static async _load(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener("load", () => resolve(img));
            img.addEventListener("error", err => reject(err));
            img.src = src;
        });
    }

}