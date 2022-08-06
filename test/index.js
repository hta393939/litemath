/**
 * @file index.js
 */

class Misc {
    constructor() {
        this.cl = this.constructor.name;
    }

    initialize() {
        this.setListener();

        this.test1();
        this.test2();
        this.test3();
        this.test4();
    }

    setListener() {
        {
            const el = document.getElementById('calcbutton');
            if (el) {
                el.addEventListener('click', () => {
                    const numsel = document.getElementById('numberselement');
                    this.calc(numsel?.value ?? '');
                });
            }
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
                    let val = Number.parseFloat(s.trim());
                    if (Number.isFinite(val)) {
                        nums.push(val);
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

        {
            obj.vecs = [];

            const sumvec = new LITEMATH.Vector3();


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
            // 未実装
// 0 1 2
// 3 4 5
// 6 7 8

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
            m.array[3] = m.array[1];
            m.array[6] = m.array[2];
            m.array[7] = m.array[5];

            const c3s = m.eigenequotion();

            console.log('c3s', c3s.toString());
            console.log('m', m.toString());
        }

        {
            const el = document.getElementById('resultelement');
            if (el) {
                el.textContent = ``;
            }
        }
    }



/**
 * 
 */
    test1() {
        const m1 = LITEMATH.Matrix3.CreateIdentity();
        const m2 = LITEMATH.Matrix.CreateIdentity(3);

        const m3 = m1.mulfromright(m2);

        console.log('test1, m3', m3.totex());
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

/**
 * 
 */
    test3() {
        console.log('test3');
    }

/**
 * 
 */
    test4() {
        console.log('test4');
    }
}

const misc = new Misc();

window.addEventListener('DOMContentLoaded', () => {
    misc.initialize();
});



