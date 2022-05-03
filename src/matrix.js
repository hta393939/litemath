/**
 * @file matrix.js
 */

var LITEMATH = LITEMATH || {};

(function(_global) {

class Matrix {
    constructor(inopt) {
/**
 * 行数
 */
        this.row = inopt?.row || 1;
/**
 * 列数
 */
        this.col = inopt?.col || 1;

/**
 * 'row' or col
 */
        this.major = inopt?.major ?? 'row';
/**
 * 一直線に並べた typed array
 */
        this.array = inopt?.array ?? new Float64Array(this.row * this.col);
    }

/**
 * 新しいインスタンスを生成して返す
 * @returns {Matrix}
 */
    clone() {
        const m = new Matrix({
            row: this.row,
            col: this.col,
            major: this.major,
        });
        const num = this.row * this.col;
        for (let i = 0; i < num; ++i) {
            m.array[i] = this.array[i];
        }
        return m;
    }

/**
 * 単位行列を新しく作って返す
 * @param {number} indim 
 * @returns {Matrix}
 */
    createEigen(indim) {
        const m = new Matrix({
            row: indim,
            col: indim,
            major: 'row',
        });
        const p = m.array;
        for (let i = 0; i < indim; ++i) {
            p[(m.col + 1) * i] = 1;
        }
        return m;
    }

/**
 * 新しく転置行列を作って返す
 */
    createTranspose() {
        const m = this.clone();
        m.major = (this.major === 'row') ? 'col' : 'row';
        m.row = this.col;
        m.col = this.row;
        return m;
    }

/**
 * 新しくこの行列の major を指定して返す
 * 行列としては同一内容が得られる。
 * @param {string} inmajor 'row' など
 */
    createMajor(inmajor) {
        if (inmajor === this.major) {
            return this.clone();
        }

        const m = new Matrix({
            row: this.row,
            col: this.col,
            major: inmajor,
        });

        //if (inmajor === 'row') {
            // this は column major である場合
            // m は row major の場合
            for (let i = 0; i < this.row; ++i) {
                for (let j = 0; j < this.col; ++j) {
                    let srcoffset = this.row * i + j; // col
                    let dstoffset = m.col * j + i; // row
                    m.array[dstoffset] = this.array[srcoffset];
                }
            }
        //}
        return m;
    }

/**
 * 行と列を指定してセル値を取得する
 * @param {number} inrow 
 * @param {number} incol 
 */
    getrc(inrow, incol) {
        let offset = 0;
        if (this.major === 'row') {
            offset = this.col * inrow + incol;
        } else {
            offset = this.row * incol + inrow;
        }
        return this.array[offset];
    }

/**
 * 余因子行列を新しく作って返す
 * @param {number} inrow 
 * @param {number} incol 
 */
    cofactorrc(inrow, incol) {
        if (this.row <= 1 || this.col <= 1) {
            throw new Error('small');
        }

        const m = new Matrix({
            row: this.row - 1,
            col: this.col - 1,
            major: this.major,
        });

        let offset = 0;
        const buf = new Float64Array(m.row * m.col);
        if (this.major === 'row') {
            for (let i = 0; i < this.row; ++i) {
                if (i === inrow) {
                    continue;
                }
                for (let j = 0; j < this.col; ++j) {
                    if (j === incol) {
                        continue;
                    }
                    buf[offset] = this.array[j + this.col * i];
                    offset += 1;
                }
            }
        } else {
            for (let j = 0; j < this.col; ++j) {
                if (j === incol) {
                    continue;
                }
                for (let i = 0; i < this.row; ++i) {
                    if (i === inrow) {
                        continue;
                    }
                    buf[offset] = this.array[i + this.row * j];
                    offset += 1;
                }
            }
        }
        m.array = buf;
        return m;
    }

/**
 * trace を計算する
 * @returns {number}
 */
    trace() {
        if (this.row !== this.col) {
            throw new Error('not square');
        }

        const num = this.row;
        let sum = 0;
        let offset = 0;
        for (let i = 0; i < num; ++i) {
            sum += this.array[offset];
            offset += num + 1;
        }
        return sum;
    }

/**
 * major row only
 * この行列に右から rm を掛けた新しい行列を返す
 * @param {Matrix} rm 
 * @returns {Matrix}
 */
    mulfromright(rm) {
        if (this.col !== rm.row) {
            throw new Error('size not match');
        }
        const num = rm.row;
        const m = new Matrix({
            row: this.row,
            col: rm.col,
            major: 'row',
        });
        const p = m.array;
        for (let i = 0; i < m.row; ++i) {
            for (let j = 0; j < m.col; ++j) {
                let sum = 0;
                for (let k = 0; k < num; ++k) {
                    sum += this.array[this.col * i + k] * rm.array[m.col * k + j];
                }
                p[m.col * i + j] = sum;
            }
        }
        return m;
    }

/**
 * この行列に左から lm を掛けた新しい行列を返す
 * 三つとも row major only
 * @param {Matrix} lm 
 */
    mulfromleft(lm) {
        if (lm.col !== this.row) {
            throw new Error('size not match');
        }
        const num = this.row;
        const m = new Matrix({
            row: lm.row,
            col: this.col,
            major: 'row',
        });
        const p = m.array;

        //if (m.major === 'row') {
        for (let i = 0; i < m.row; ++i) {
            for (let j = 0; j < m.col; ++j) {
                let sum = 0;
                for (let k = 0; k < num; ++k) {
                    sum += lm.array[lm.col * i + k] * this.array[this.col * k + j];
                }
                p[m.col * i + j] = sum;
            }
        }
        //}

        return m;
    }

/**
 * 余因子で行列式を計算する
 * @returns {number}
 */
    detcofactor() {
        if (this.row !== this.col) {
            throw new Error('not square');
        }

        const num = this.row;
        if (num === 1) {
            return this.array[0];
        }
        if (num === 2) {
            return this.array[0] * this.array[3] - this.array[1] * this.array[2];
        }
        if (num === 3) {
            const p = this.array;
            let sum = 0;
            sum +=  p[0] * (p[4] * p[8] - p[5] * p[7]);
            sum += -p[1] * (p[3] * p[8] - p[5] * p[6]);
            sum +=  p[2] * (p[3] * p[7] - p[4] * p[6]);
            return sum;
        }

        let sum = 0;
//        if (this.major === 'row') {
        for (let j = 0; j < num; ++j) {
            const co = this.cofactorrc(0, j);
            const codet = co.det();
            const signed = (j & 1 === 0) ? codet : -codet;
            sum += this.array[j] * signed;
        }
//        }
        return sum;
    }

/**
 * $$ $$ を含まない
 */
    totex() {
        const lines = [];
        {
            lines.push('\\left(');
        }
        {
            let s = `\\begin{array}`;
            s += `{${'c'.repeat(this.col)}}`;
            lines.push(s);
        }
        for (let i = 0; i < this.row; ++i) {
            const cells = [];
            for (let j = 0; j < this.col; ++j) {
                let s = `${this.array[this.col * i + j]}`;
                cells.push(s);
            }
            let s = cells.join(` & `);
            if (i !== this.row - 1) {
                s += ` \\\\`;
            }
            lines.push(s);
        }
        lines.push(`\\end{array}`);
        lines.push(`\\right)`);
        lines.push('');
        return lines.join('\n');
    }

}


LITEMATH.Matrix = Matrix;
_global.LITEMATH = LITEMATH;


})( (this || 0).self || (typeof self !== 'undefined' ? self : global) );


