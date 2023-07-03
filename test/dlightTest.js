import { EvtSystem } from '../js/event.js';
import { Fmt } from '../js/fmt.js';
import { Game } from '../js/game.js';
import { Generator } from '../js/generator.js';
import { Gadget } from '../js/gizmo.js';
import { Hierarchy } from '../js/hierarchy.js';
import { Mathf } from '../js/math.js';
import { SheetRef } from '../js/refs.js';
import { Sprite } from '../js/sprite.js';
import { UiCanvas } from '../js/uiCanvas.js';
import { UiPanel } from '../js/uiPanel.js';
import { Vect } from '../js/vect.js';
import { Vect3 } from '../js/vect3.js';
import { XForm } from '../js/xform.js';

class Light extends Gadget {
    static {
        this.schema(this, 'point', {dflt: false});
        this.schema(this, 'color', {parser: (o,x) => x.color || new Vect3({x:1,y:1,z:1})});
        this.schema(this, 'ambientIntensity', {dflt: 0});
        this.schema(this, 'diffuseIntensity', {dflt: 1});
        this.schema(this, 'v', {parser: (o,x) => x.v || Vect3.zero});
        this.schema(this, 'attenuationConstant', {dflt: 0});
        this.schema(this, 'attenuationLinear', {dflt: 0});
        this.schema(this, 'attenuationExp', {dflt: 1});
    }
}

class NSprite extends Sprite {
    static {
        this._canvas = document.createElement('canvas');
        this._ctx = this._canvas.getContext('2d');
    }

    static {
        this.schema(this, 'nimg', {readonly: true});
        this.schema(this, 'specularity', {dflt: 1});
        this.schema(this, 'specularPower', {dflt: 1});
        this.schema(this, 'shiny', {dflt: 1});
        this.schema(this, 'idata', {readonly: true, parser: (o,x) => o.constructor.getDataFromImage(o.img)});
        this.schema(this, 'ndata', {renderable: true, parser: () => null});
        this.schema(this, 'normals', {readonly: true, parser: () => []});
    }

    static getDataFromImage(img) {
        this._canvas.width = img.width;
        this._canvas.height = img.height;
        this._ctx.clearRect(0, 0, img.width, img.height);
        this._ctx.drawImage(img, 0, 0);
        return this._ctx.getImageData(0, 0, img.width, img.height);
    }

    // FIXME: cache normals based on image... likely scenario is that image/normal image will be re-used across muliple normal-sketch instances... 
    // don't want to calculate and keep separate normal data for each instance...
    constructor(spec) {
        super(spec);
        this.data = this.constructor.getDataFromImage(this.img).data;
        var data = this.constructor.getDataFromImage(this.nimg).data;
        // precalculate the normals
        for (let i=0; i<data.length; i+=4) {
            var nx = data[i]-127;
            var ny = data[i+1]-127;
            var nz = data[i+2]-127;
            // normalize
            var magInv = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
            nx *= magInv;
            ny *= magInv;
            nz *= magInv;
            //console.log(`${i}:${data[i]},${data[i+1]},${data[i+2]} gives ${nx},${ny},${nz}`);
            this.normals.push(nx);
            this.normals.push(ny);
            this.normals.push(nz);
            // normals applied to image data which includes alpha component
            this.normals.push(0);
        }
    }

    xcalcLight(
        viewx, viewy, viewz, 
        x, y, z, 
        light, 
        lightx, lighty, lightz, 
        normalx, normaly, normalz
    ) {
        let dx = lightx - x;
        let dy = lighty - y;
        let dz = lightz;

        let magInv = 1.0 / Math.sqrt(dx * dx + dy * dy + dz * dz);
        dx *= magInv;
        dy *= magInv;
        dz *= magInv;
        var dot = dx * normalx + dy * normaly + dz * normalz;
        var spec = Math.pow(dot, 20) * this.specularity;
        spec += Math.pow(dot, 400) * this.shiny;
        var intensity = spec + 0.5;
        return new Vect3({x:light.color.x*intensity, y:light.color.y*intensity, z:light.color.z*intensity});
    }

    calcLight(
        viewx, viewy, viewz, 
        x, y, z, 
        light, 
        lightx, lighty, lightz, 
        normalx, normaly, normalz
    ) {
        let acx = light.color.x * light.ambientIntensity;
        let acy = light.color.y * light.ambientIntensity;
        let acz = light.color.z * light.ambientIntensity;
        let diffuseFactor = normalx*-lightx + normaly*-lighty + normalz*-lightz;
        let dcx = 0, dcy = 0, dcz = 0;
        let scx = 0, scy = 0, scz = 0;
        if (diffuseFactor > 0) {
            let diffuse = light.diffuseIntensity*diffuseFactor;
            dcx = light.color.x * diffuse;
            dcy = light.color.y * diffuse;
            dcz = light.color.z * diffuse;
            let vtvx = viewx - x;
            let vtvy = viewy - y;
            let vtvz = viewz - z;
            let ivtvm = 1/Math.sqrt(vtvx*vtvx + vtvy*vtvy + vtvz*vtvz);
            vtvx *= ivtvm;
            vtvy *= ivtvm;
            vtvz *= ivtvm;
            let lrdot2 = lightx*normalx + lighty*normaly + lightz*normalz*2;
            let lrx = normalx*lrdot2 - lightx;
            let lry = normaly*lrdot2 - lighty;
            let lrz = normaly*lrdot2 - lightz;
            let ilrm = 1/Math.sqrt(lrx*lrx + lry*lry + lrz*lrz);
            lrx *= ilrm;
            lry *= ilrm;
            lrz *= ilrm;
            let specularFactor = vtvx*lrx + vtvy*lry + vtvz*lrz;
            if (specularFactor > 0) {
                specularFactor = Math.pow(specularFactor, this.specularPower);
                let specular = this.specularity * specularFactor;
                scx = light.color.x * specular;
                scy = light.color.y * specular;
                scz = light.color.z * specular;
            }
        }
        let rv = new Vect3({x:acx + dcx + scx, y:acy + dcy + scy, z:acz + dcz + scz});
        return rv;
    }

    /*
    calcLight(BaseLight Light, vec3 LightDirection, vec3 Normal) {
        vec4 AmbientColor = vec4(Light.Color, 1.0f) * Light.AmbientIntensity;
        float DiffuseFactor = dot(Normal, -LightDirection);
        vec4 DiffuseColor = vec4(0, 0, 0, 0);
        vec4 SpecularColor = vec4(0, 0, 0, 0);
        if (DiffuseFactor > 0) {
            DiffuseColor = vec4(Light.Color * Light.DiffuseIntensity * DiffuseFactor, 1.0f);
            vec3 VertexToEye = normalize(gEyeWorldPos - WorldPos0);
            vec3 LightReflect = normalize(reflect(LightDirection, Normal));
            float SpecularFactor = dot(VertexToEye, LightReflect);
            if (SpecularFactor > 0) {
                SpecularFactor = pow(SpecularFactor, gSpecularPower);
                SpecularColor = vec4(Light.Color * gMatSpecularIntensity * SpecularFactor, 1.0f);
            }
        }
        return (AmbientColor + DiffuseColor + SpecularColor);
    }
    */

    updateLight(view, light) {
        let imgData = new ImageData(this.idata.data, this.idata.width);
        let odata = new Array();
        for (let i=0; i<this.idata.width*this.idata.height*4; i++) odata.push(127);
        let data = imgData.data;
        var i = 0;
        for (var y = 0; y < this.idata.height; y++) {
            for (var x = 0; x < this.idata.width; x++) {
                //console.log(`-- ${x},${y} i: ${i}`);
                let nx = this.normals[i];
                let ny = this.normals[i+1];
                let nz = this.normals[i+2];
                //let normal = new Vect3(this.normals[i], this.normals[i+1], this.normals[i+2]);
                //let pos = new Vect3(x, y, 0);
                let lightAtPoint;
                if (light.point) {
                    let lx = x - light.v.x;
                    let ly = y - light.v.y;
                    let lz = -light.v.z;
                    let distance = Math.sqrt(lx * lx + ly * ly + lz * lz);
                    let dinv = 1/distance;
                    lx *= dinv;
                    ly *= dinv;
                    lz *= dinv;
                    //if (x === 25 && y === 25) console.log(`-- ${x},${y},0 ${light.v} ${lx},${ly},${lz}`)
                    //let lightDirection = Vect3.sub(pos, light.v);
                    //let distance = lightDirection.mag;
                    //lightDirection.normalize();
                    lightAtPoint = this.calcLight(view.x, view.y, view.z, x, y, 0, light, lx, ly, lz, nx, ny, nz);
                    let attenuation = light.attenuationConstant + light.attenuationLinear * distance + light.attenuationExp * distance * distance;
                    //console.log(`lightAtPoint: ${x},${y} ${lightAtPoint} d: ${distance} attenuation: ${attenuation}`)
                    if (attenuation > 0) {
                        lightAtPoint.sdiv(attenuation);
                    }
                } else {
                    lightAtPoint = this.calcLight(Vect3.add(pos, new Vect({x:0,y:0,z:100})), pos, light, light.v, normal);
                }
                data[i] = Math.round(Mathf.clamp(odata[i] * lightAtPoint.x, 0, 255));
                data[i+1] = Math.round(Mathf.clamp(odata[i+1] * lightAtPoint.y, 0, 255));
                data[i+2] = Math.round(Mathf.clamp(odata[i+2] * lightAtPoint.z, 0, 255));
                i += 4;
            }
        }

        //let odata = new Array();
        //let data = imgData.data;
        //let odata = this.idata.data;
        // FIXME
        /*
        for (let i=0; i<this.idata.width*this.idata.height*4; i++) odata.push(127);
        var i = 0;
        var dx = 0, dy = 0, dz = 0;
        for (var y = 0; y < this.idata.height; y++) {
            for (var x = 0; x < this.idata.width; x++) {
                // get surface normal
                let nx = this.normals[i];
                let ny = this.normals[i + 1];
                let nz = this.normals[i + 2];
                // make it a bit faster by only updateing the direction
                // for every other pixel
                if (this.shiny > 0 || (i & 1) == 0) {
                    // calculate the light direction vector
                    dx = lx - x;
                    dy = ly - y;
                    dz = lz;
                    if (x===12 && y===12) console.log(`p: ${x},${y} l: ${lx},${ly},${lz} d: ${dx},${dy},${dz}`);
                    // normalize it
                    let magInv = 1.0 / Math.sqrt(dx * dx + dy * dy + dz * dz);
                    dx *= magInv;
                    dy *= magInv;
                    dz *= magInv;
                }
                // take the dot product of the direction and the normal
                // to get the amount of specularity
                var dot = dx * nx + dy * ny + dz * nz;
                var spec = Math.pow(dot, 20) * this.specularity;
                spec += Math.pow(dot, 400) * this.shiny;
                // spec + ambient
                // FIXME: add color filter for light
                var intensity = spec + 0.5;
                data[i] = Math.round(Mathf.clamp(odata[i] * intensity, 0, 255));
                data[i+1] = Math.round(Mathf.clamp(odata[i+1] * intensity, 0, 255));
                data[i+2] = Math.round(Mathf.clamp(odata[i+2] * intensity, 0, 255));
                i += 4;
            }
        }
        */
        let p = createImageBitmap(imgData);
        let target = this;
        p.then((bits) => {
            //console.log(`setting ndata: ${bits} dim: ${bits.width},${bits.height}`);
            target.ndata = bits;
        });
        //ctx.putImageData(imgData, 0, 0);
    }

    // METHODS -------------------------------------------------------------
    subrender(ctx, x=0, y=0, width=0, height=0) {
        if (!this.img) return;
        // scale if necessary
        if ((width && width !== this.width) || (height && height !== this.height)) {
            if (this.width && this.height) {
                // src dims
                let sw = this.width;
                let sh = this.height;
                // dst dims
                let dw = width;
                let dh = height;
                ctx.drawImage(this.ndata || this.img, 
                    0, 0, sw, sh, 
                    x, y, dw, dh);
            }
        } else {
            ctx.drawImage(this.ndata || this.img, x, y);
        }
    }

}

let tileSize = 26;

class DLightTest extends Game {

    static assetSpecs = [
        Sprite.xspec({tag: 'test.sprite', img: new SheetRef({src: '../media/sphere-normal.png', width: tileSize, height: tileSize, x: 0, y: 0, smoothing: false}), smoothing: false }),
    ];

    async prepare() {
        let cvs = new UiCanvas({ gctx: this.gctx });
        let panel = new UiPanel({
            gctx: this.gctx, 
            sketch: Generator.generate(this.assets.get('test.sprite')),
            xform: new XForm({grip: .5, x: -tileSize*3, fixedWidth: tileSize, fixedHeight: tileSize, scale: 4, smoothing: false}),
        });
        Hierarchy.adopt(cvs, panel);

        let tsprite = this.assets.get('test.sprite');
        let light = new Light({
            point: true,
            ambientIntensity: .5,
            diffuseIntensity: 2,
            attenuationConstant: .1,
            attenuationExp: 0.002,
        });

        let panels = [];
        let rows = 2;
        let cols = 3;
        let scale = 4;
        for (let i=0; i<cols; i++) {
            for (let j=0; j<rows; j++) {
                let nsprite = new NSprite({img: tsprite.img, nimg: tsprite.img, specularity: .25*i, specularPower: 2.5*j});
                let panel = new UiPanel({
                    gctx: this.gctx, 
                    sketch: nsprite,
                    xform: new XForm({grip: .5, x:-tileSize*2*scale+tileSize*i*scale, y:-tileSize*2*scale+tileSize*j*scale, fixedWidth: tileSize, fixedHeight: tileSize, scale: scale, smoothing: false}),
                });
                Hierarchy.adopt(cvs, panel);
                panels.push(panel);
            }
        }

        let view = new Vect3({x:cvs.width/2,y:cvs.height/2,z:100});
        EvtSystem.listen(this.gctx, this, 'mouse.moved', (evt) => {
            for (const panel of panels) {
                let lpos = panel.xform.getLocal(new Vect({x:evt.x,y:evt.y}));
                light.v = new Vect3({x:lpos.x-panel.xform.minx, y:lpos.y-panel.xform.miny, z:32});
                panel.sketch.updateLight(view, light);
            }
        });
    }
}

/** ========================================================================
 * start the game when page is loaded
 */
window.onload = async function() {
    // start the game
    let game = new DLightTest();
    game.start();
}
