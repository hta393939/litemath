/**
 * @file index.js
 */

class Misc {
    constructor() {

    }

    initialize() {
        this.test1();
        this.test2();
        this.test3();
        this.test4();
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

window.addEventListener('load', () => {
    misc.initialize();
});



