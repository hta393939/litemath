/**
 * @file index.js
 */

class Misc {
    constructor() {
        this.cl = this.constructor.name;
    }

    async initialize() {
        this.setListener();

        const engine = new BABYLON.Engine(window.babylon);
        const scene = new BABYLON.Scene(engine);
        this.scene = scene;

        const camera = new BABYLON.ArcRotateCamera('camera',
            0, 0, 10,
            BABYLON.Vector3.Zero(),
            scene);
        camera.position = new BABYLON.Vector3(1, 2, -10);
        camera.attachControl();
        camera.wheelDeltaPercentage = 0.01;
        camera.wheelPrecision = 0.01;

        const mesh = BABYLON.MeshBuilder.CreateBox('box', {
            width: 0.2,
            height: 0.4,
            depth: 0.8,
        }, scene);

        const light = new BABYLON.HemisphericLight('light',
            new BABYLON.Vector3(0, 1, 0),
            scene);

        const box0 = BABYLON.MeshBuilder.CreateBox('box0',
            { width: 0.1, height: 0.1, depth: 0.1 },
            scene);
        const layer = new BABYLON.UtilityLayerRenderer(scene);
        const gizmo = new BABYLON.PositionGizmo(layer);
        gizmo.attachedMesh = box0;

        engine.runRenderLoop(() => {
            scene.render();
        });
    }

    setListener() {
        {
            const el = document.getElementById('calcbutton');
            el?.addEventListener('click', () => {
                const numsel = document.getElementById('numberselement');
                this.calc(numsel?.value ?? '');
            });
        }

        {
            const el = document.getElementById('addbutton');
            el?.addEventListener('click', () => {
                const vs = [
                    window.vecx.value,
                    window.vecy.value,
                    window.vecz.value,
                ].map(v => Number.parseFloat(v));
                this.addVector(...vs);
            });
        }
    }

/**
 * 
 * @param {string} instr 
 */
    calc(instr) {
        const obj = {
            vals: [],
        };

// 1.2e-11 など
        const numre = /[+\-]?\d*\.?\d*(eE)?[+\-]?\d*/;
        try {
            const obj = JSON.parse(instr);
            console.log('未実装');
        } catch(ec) {
            const vals = [];

            const lines = instr.split('\n');
            for (const line of lines) {
                if (line.trim() === '') {
                    continue;
                }
                let ss = line.split(',');
                if (ss.length <= 1) {
                    ss = line.split(' ');
                }
                const nums = [];
                for (const s of ss) {
                    const m = numre.exec(s.trim());
                    if (m) {
                        //console.log('match', m);
                        let val = Number.parseFloat(m[0]);
                        if (Number.isFinite(val)) {
                            nums.push(val);
                        }
                    }
                }
                if (nums.length <= 1) {
                    continue;
                }
                vals.push(nums);
            }

            obj.vals = vals;
        }

// obj.vals でなにかする
        console.log('obj.vals', obj.vals);
        const samplenum = obj.vals.length;
        const sumvec = new LITEMATH.Vector3();
        {
            obj.vecs = [];


            for (let i = 0; i < samplenum; ++i) {
                const vec = new LITEMATH.Vector3();
                for (let j = 0; j < 3; ++j) {
                    vec.array[j] = obj.vals[i][j];
                }
                obj.vecs.push(vec);

                sumvec.add(vec);
            }
            if (samplenum > 0) {
                sumvec.multiplyScalar(1 / samplenum);
            }

            console.log('重心', sumvec.toString());
            {
                window.imelement.textContent = `重心 ${sumvec.tocsv()}`;
            }

            let maxvec = new LITEMATH.Vector3();
            let minvec = new LITEMATH.Vector3();
            for (let i = 0; i < samplenum; ++i) {
                obj.vecs[i].add(sumvec, -1);

                maxvec.max(obj.vecs[i]);
                minvec.min(obj.vecs[i]);
            }

            // maxvec, minvec の各成分のうち絶対値が最大のものを知りたい
            minvec.abs();
            const maxel = Math.max(...maxvec.array, ...minvec.array);
            const invmaxel = (maxel !== 0) ? 1 / maxel : 1;
            for (let i = 0; i < samplenum; ++i) {
                obj.vecs[i].multiplyScalar(invmaxel);
            }

            console.log('重心補正後', maxel, obj, maxvec.toString(), minvec.toString());
        }

        {
/**
 * 分散共分散行列
 * 0 1 2
 * 3 4 5
 * 6 7 8
 */
            const m = new LITEMATH.Matrix3();
            for (let i = 0; i < samplenum; ++i) {
                const vec = obj.vecs[i];
                const x = vec.array[0];
                const y = vec.array[1];
                const z = vec.array[2];

                m.array[0] += x * x;
                m.array[4] += y * y;
                m.array[8] += z * z;

                m.array[1] += x * y;
                m.array[2] += x * z;
                m.array[5] += y * z;
            }
            if (samplenum > 0) {
                m.multiplyScalar(1 / samplenum);
            }

            m.array[3] = m.array[1];
            m.array[6] = m.array[2];
            m.array[7] = m.array[5];

            const c3s = m.eigenequotion();
            const real = m.searchMin(c3s);

            const eigenvalues = [real];

            if (Math.abs(c3s[0]) < (10 ** -10)) {
                console.log('x = 0 の解を持つ');
                const c2s = [c3s[1], c3s[2], c3s[3]];
                const decide = c2s[1] ** 2 - 4 * c2s[2] * c2s[0];
                if (decide < 0) {
                    console.log('虚数解', decide);
                } else {
                    const ans2s = [
                        (- c2s[1] - Math.sqrt(decide)) / (2 * c2s[2]),
                        (- c2s[1] + Math.sqrt(decide)) / (2 * c2s[2]),
                    ];
                    console.log('ans2s', ans2s);
                    eigenvalues.push(...ans2s);
                }
            }

            // 規定は文字列でソート!
            //eigenvalues.sort();

            // わけわからん。(a - b) のかっこ必要なのかも。
            eigenvalues.sort((a, b) => {
//                return (a - b);
                return a - b;
            });
            console.log('sorted', eigenvalues);

            for (const eigenvalue of eigenvalues) {
                console.log('%c固有値', 'color:deepskyblue;', eigenvalue);

                const iden = LITEMATH.Matrix.CreateIdentity(3, eigenvalue);

                const m2 = m.makeAdd(iden, -1);
                const result = m2.makePseudoInv();

                const mulm4 = m2.makeMultiply(result.m);


                let result3 = new LITEMATH.Matrix({ row: 3, col: 1 });
                for (let j = 0; j < 3; ++j) {
                    result3 = result.m.getColVec(j);
                    if (!result3.isZero()) {
                        break;
                    }
                }
                {
                    console.log('result3 ベクトル', result3, result3.toString());
                    window.resultelement.textContent = `${result3.normalize().tocsv()}`;
                }

                console.log('result.det ほぼ零', result.det, 'result.m ', result.m.toString());
                console.log('mulm4 零?', mulm4.toString());
            }

            console.log('real 実解', real);
            console.log('c3s 固有方程式の係数', c3s.toString());
            console.log('m', m.toString());
        }

    }


/**
 * 
 */
    test2() {
        const m1 = new LITEMATH.Matrix({
            row: 3,
            col: 3,
            major: 'row',
        });

        const coeffs = m1.eigenequotion();
        console.log('test2 coeffs', coeffs);
    }

    addVector(x, y, z) {
        const scene = this.scene;

        const points = [
            BABYLON.Vector3.Zero(),
            new BABYLON.Vector3(x, y, z),
        ];
        const line = BABYLON.MeshBuilder.CreateLines('line',
            { points },
            scene);

        /*
        const dir = new BABYLON.Vector3(x, y, z);
        const len = dir.length();
        const capsule = BABYLON.MeshBuilder.CreateCylinder(`cyl`,
            {
                diameterTop: 0.4,
                height: len,
                diameterBottom: 0,
            },
            scene);
        capsule.position = new BABYLON.Vector3(0, len * 0.5, 0);
            */

    }

}

const misc = new Misc();
misc.initialize();



