import { Assets } from '../js/assets.js';
import { Fmt } from '../js/fmt.js';
import { Generator } from '../js/generator.js';
import { Gizmo } from '../js/gizmo.js';
import { GizmoContext } from '../js/gizmoContext.js';
import { GizmoData } from '../js/gizmoData.js';
import { Rect } from '../js/rect.js';
import { SerialData, Serializer } from '../js/serializer.js';
import { XForm } from '../js/xform.js';

class TSerializerSub extends GizmoData {
    static { this.schema(this, 'value'); };
};
class TSerializerData extends GizmoData {
    static { 
        this.schema(this, 'sub', { link: true });
    };
};
class TSerializerGizmo extends Gizmo {
    static { 
        this.schema(this, 'data', { link: true });
        this.schema(this, 'asset', { link: true });
    };
}

describe('a serializer', () => {
    let gctx, sdata, generator, assets;
    beforeEach(async () => {
        gctx = new GizmoContext({tag: 'test'});
        sdata = new SerialData();
        assets = new Assets({specs: [
            Rect.xspec({tag: 'test.rect', color: 'blue', borderColor: 'red', border: 2, xform: XForm.xspec({ fixedWidth: 32, fixedHeight: 32 })}),
        ]});
        await assets.load();
        generator = new Generator({gctx: gctx, assets: assets});
    });

    it('can xify a basic gizmo', ()=>{
        let g = new Gizmo({ gctx: gctx, tag: 'root' });
        let rslt = Serializer.xify(sdata, g);
        expect(rslt).toEqual({ cls: '$GizmoRef', gid: g.gid });
        expect(sdata.xgzos[g.gid]).toEqual({
            $gzx: true,
            cls: 'Gizmo',
            gid: g.gid,
            tag: g.tag,
            children: [],
        });
        // test restore
        let gzos = Serializer.restore(sdata, generator);
        expect(gzos.length).toEqual(1);
        expect(gzos[0].tag).toEqual('root');
    });

    it('can xify a gizmo chain', ()=>{
        let sub2 = new Gizmo({ gctx: gctx, tag: 'sub2' });
        let sub1 = new Gizmo({ gctx: gctx, tag: 'sub1', children: [ sub2 ] });
        let root = new Gizmo({ gctx: gctx, tag: 'root', children: [ sub1 ] });
        let rslt = Serializer.xify(sdata, root);
        expect(rslt).toEqual({ cls: '$GizmoRef', gid: root.gid });
        expect(sdata.xgzos[sub2.gid]).toEqual({
            $gzx: true,
            cls: 'Gizmo',
            gid: sub2.gid,
            tag: sub2.tag,
            children: [],
        });
        expect(sdata.xgzos[sub1.gid]).toEqual({
            $gzx: true,
            cls: 'Gizmo',
            gid: sub1.gid,
            tag: sub1.tag,
            children: [ { cls: '$GizmoRef', gid: sub2.gid }],
        });
        expect(sdata.xgzos[root.gid]).toEqual({
            $gzx: true,
            cls: 'Gizmo',
            gid: root.gid,
            tag: root.tag,
            children: [ { cls: '$GizmoRef', gid: sub1.gid }],
        });
        // test restore
        let gzos = Serializer.restore(sdata, generator);
        expect(gzos.length).toEqual(1);
        expect(gzos[0].tag).toEqual('root');
        expect(gzos[0].children[0].tag).toEqual('sub1');
        expect(gzos[0].children[0].children[0].tag).toEqual('sub2');
    });

    it('can xify a data chain', ()=>{
        let root = new TSerializerGizmo({ 
            gctx: gctx, 
            tag: 'root', 
            data: new TSerializerData({
                sub: new TSerializerSub({
                    value: 'hello world',
                }),
            }),
        });
        let rslt = Serializer.xify(sdata, root);
        expect(rslt).toEqual({ cls: '$GizmoRef', gid: root.gid });
        expect(sdata.xgzos[root.gid]).toEqual({
            $gzx: true,
            cls: 'TSerializerGizmo',
            gid: root.gid,
            tag: root.tag,
            children: [],
            data: {
                $gzx: true,
                cls: 'TSerializerData',
                sub: {
                    $gzx: true,
                    cls: 'TSerializerSub',
                    value: 'hello world',
                },
            },
            asset: undefined,
        });
        // test restore
        let gzos = Serializer.restore(sdata, generator);
        expect(gzos.length).toEqual(1);
        expect(gzos[0].tag).toEqual('root');
        expect(gzos[0].data.sub.value).toEqual(root.data.sub.value);
    });

    it('can xify a gizmo with asset ref', ()=>{
        let g = new TSerializerGizmo({ gctx: gctx, tag: 'root', asset: generator.generate(assets.get('test.rect')) });
        let rslt = Serializer.xify(sdata, g);
        expect(rslt).toEqual({ cls: '$GizmoRef', gid: g.gid });
        expect(sdata.xgzos[g.gid]).toEqual({
            $gzx: true,
            cls: 'TSerializerGizmo',
            gid: g.gid,
            tag: g.tag,
            data: undefined,
            asset: { assetTag: 'test.rect', cls: 'AssetRef'},
            children: [],
        });
        // test restore
        let gzos = Serializer.restore(sdata, generator);
        expect(gzos.length).toEqual(1);
        expect(gzos[0].tag).toEqual('root');
        expect(gzos[0].asset.assetTag).toEqual('test.rect');
    });

});