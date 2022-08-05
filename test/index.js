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
            vecs: [],
        };
        try {
            const obj = JSON.parse(instr);
            console.log('未実装');
        } catch(ec) {
            const vecs = [];

            const lines = instr.split('\n');
            for (const line of lines) {
                if (line.trim() === '') {
                    continue;
                }
                let ss = line.split(',');
                if (ss.length <= 1) {
                    ss = line.split(' ');
                }
                const vals = [];
                for (const s of ss) {
                    let val = Number.parseFloat(s.trim());
                    if (Number.isFinite(val)) {
                        vals.push(val);
                    }
                }
                if (vals.length <= 1) {
                    continue;
                }
                vecs.push(vals);
            }

            obj.vecs = vecs;
        }

// obj.vecs でなにかする
        console.log('未実装', obj.vecs);

    }

/**
 * 
 */
    test1() {
        const m1 = new LITEMATH.Matrix().createEigen(3);
        const m2 = new LITEMATH.Matrix().createEigen(3);

        const m3 = m1.mulfromright(m2);

        console.log(m3.totex());
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
        console.log('coeffs', coeffs);
    }

/**
 * 
 */
    test3() {

    }

/**
 * 
 */
    test4() {

    }
}

const misc = new Misc();

window.addEventListener('DOMContentLoaded', () => {
    misc.initialize();
});



