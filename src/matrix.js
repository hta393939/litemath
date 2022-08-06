/**
 * @file matrix.js
 */

var LITEMATH = LITEMATH || {};

(function(_global) {



/**
 * 実行列クラス
 */
class Matrix {
    static ERR_NOTSQUARE = 'not square';
    static ERR_SIZENOTMATCH = 'size not match';
    static ERR_NI = 'not implemented';

    constructor(inopt) {
/**
 * 行数
 * @default 1
 */
        this.row = inopt?.row || 1;
/**
 * 列数
 * @default 1
 */
        this.col = inopt?.col || 1;

/**
 * 'row' or 'col' 格納方向。row データ格納の場合横に 1,2,3 の順。
 * なお列優先表現というのは 数学の行列みたく 行列 x 列ベクトル で書く方法。
 * 行優先表現というのは Direct3D みたく 行ベクトル x 行列 で書く方法。
 * @default 'row'
 */
        this.major = inopt?.major ?? 'row';
/**
 * 一直線に並べた typed array
 * @type {Float64Array}
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
 * 配列からこの行列にセットする。破壊。
 * @param {number[]} inarray 
 */
    setArray(inarray) {
        const num = Math.min(this.array.length, inarray.length);
        for (let i = 0; i < num; ++i) {
            this.array[i] = inarray[i];
        }
        return this;
    }

/**
 * 単位行列を新しく作って返す
 * @param {number} indim 
 * @param {number} [incoeff=1] 係数
 * @returns {Matrix}
 */
    static CreateIdentity(indim, incoeff = 1) {
        const dim = indim;
        const m = new Matrix({
            row: dim,
            col: dim,
            major: 'row',
        });
        const p = m.array;
        for (let i = 0; i < dim; ++i) {
            p[(m.col + 1) * i] = incoeff;
        }
        return m;
    }

/**
 * この行列と引数の内積を計算する
 * @param {Matrix} b 
 */
    dot(b) {
        const num = Math.min(this.array.length, b.array.length);
        let sum = 0;
        for (let i = 0; i < num; ++i) {
            sum += this.array[i] * b.array[i];
        }
        return sum;
    }

/**
* 破壊で正規化する
* @returns {Vector}
*/
    normalize() {
        const num = this.array.length;
        let sum = 0;
        for (let i = 0; i < num; ++i) {
            sum += this.array[i] ** 2;
        }
        if (sum !== 0) {
            const k = 1 / Math.sqrt(sum);
            for (let i = 0; i < num; ++i) {
                this.array[i] *= k;
            }
        }
        return this;
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
 * @param {number} inrow 行位置
 * @param {number} incol 列位置
 * @returns {Matrix} 余因子行列
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
 * @returns {number} 行列式のスカラー値
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
 * 破壊。この行列にスカラー倍つきで加算する
 * @param {Matrix} mb 足す行列
 * @param {number} [cb=1] mb 行列に掛ける係数
 * @param {number} [c=1] この行列に掛ける係数 
 * @returns {Matrix}
 */
add(mb, cb = 1, c = 1) {
    if (this.row !== mb.row || this.col !== mb.col) {
        throw new Error(Matrix.ERR_SIZENOTMATCH);
    }

    for (let i = 0; i < mb.row; ++i) {
        for (let j = 0; j < mb.col; ++j) {
            let offset = mb.col * i + j;
            this.array[offset] = this.array[offset] * c + mb.array[offset] * cb;
        }
    }
    return this;
}

/**
 * スカラー倍つき加算した新しい行列を返す
 * @param {Matrix} mb 足す行列
 * @param {number} [cb=1] mb 行列に掛ける係数
 * @param {number} [c=1] この行列に掛ける係数 
 * @returns {Matrix}
 */
    makeAdd(mb, cb = 1, c = 1) {
        if (this.row !== mb.row || this.col !== mb.col) {
            throw new Error(Matrix.ERR_SIZENOTMATCH);
        }

        const m = new Matrix({
            row: mb.row,
            col: mb.col,
            major: 'row',
        });
        for (let i = 0; i < mb.row; ++i) {
            for (let j = 0; j < mb.col; ++j) {
                let offset = mb.col * i + j;
                m.array[offset] = this.array[offset] * c + mb.array[offset] * cb;
            }
        }
        return m;
    }

/**
 * 破壊でスカラー倍
 * @param {number} k 
 * @returns {Vector}
 */
    multiplyScalar(k) {
        const num = this.array.length;
        for (let i = 0; i < num; ++i) {
            this.array[i] *= k;
        }
        return this;
    }

/**
 * 新しいスカラー倍を返す
 * @param {number} k 
 * @returns {Vector}
 */
    makeMultiplyScalar(k) {
        const ret = this.clone();
        ret.multiplyScalar(k);
        return ret;
    }

/**
 * 新しい行列を返す。row major のみ
 * @param {Matrix} b 
 */
    makeMultiply(b) {
        if (this.col !== b.row) {
            throw new Error(Matrix.ERR_SIZENOTMATCH);
        }
        const num = this.col;

        const ret = new Matrix({ row: b.row, col: this.col });
        for (let i = 0; i < ret.row; ++i) {
            for (let j = 0; j < ret.col; ++j) {
                let sum = 0.0;
                for (let k = 0; k < num; ++k) {
                    sum += this.array[this.col * i + k] * b.array[b.col * k + j];
                }
                ret.array[ret.col * i + j] = sum;
            }
        }
        return ret;
    }

/**
 * この行列の固有方程式の係数を返す。
 * 3次以下のみ。
 * @returns {number[]} 0次から3次へ
 */
    eigenequotion() {
        if (this.row !== this.col) {
            throw new Error(Matrix.ERR_NOTSQUARE);
        }
        const num = this.row;

        if (num === 1) {
            return [this.array[0], -1];
        }
        if (num === 2) {
            return [this.detcofactor(), - this.trace(), 1];
        }
        const p = this.array;
        if (num === 3) {
            return [
                this.detcofactor(),
                (p[1] * p[3] + p[2] * p[6] + p[5] * p [7])
                    - (p[4] * p[8] + p[8] * p[0] + p[0] * p[4]),
                this.trace(),
                -1,
            ];
        }

        /*
        if (num === 4) {
            const ret = [
                this.detcofactor(),
                -0,
                0,
                - this.trace(),
                1,
            ];
        }
        */

        throw new Error(Matrix.ERR_NI);
    }

/**
 * 3次方程式の実解を探す
 * 不使用。非実装
 * @param {number[]} incoeffs 
 */
    search3(incoeffs) {
        const coeffs = [0, 0, 0, 0];
        for (let i = 0; i < incoeffs.length; ++i) {
            coeffs[i] = incoeffs[i];
        }
        if (coeffs[3] === 0) {
            if (coeffs[2] === 0) {
                if (coeffs[1] === 0) {
                    if (coeffs[0] === 0) {
                        return 'na'; // 任意の値
                    }
                    return []; // 存在しない
                }
                // 0 = coeffs[1] * x + coeffs[0]
                return [- coeffs[0] / coeffs[1]];
            }
            const d = Math.pow(coeffs[1], 2) - 4 * coeffs[2] * coeffs[0];
            if (d < 0) {
                return [];
            }
            const ret = [
                -4 * coeffs[1] - Math.sqrt(d),
                -4 * coeffs[1] + Math.sqrt(d),
            ];
            return ret.map(v => v / 2 / coeffs[2]);
        }

        if (coeffs[3] < 0) {
            for (let i = 0; i < coeffs.length; ++i) {
                coeffs[i] *= -1;
            }
        }

        const maxnum = 1000;
        let minrange = -99999;
        let maxrange =  99999;
        for (let i = 0; i < 1000; ++i) {

        }


        const ret = [
            null,
            null,
            null,
        ];
        return ret;
    }

/**
 * 0以上の実3解を持つ3次方程式の最小の実解を探す
 * @param {number[]} incoeffs 3次方程式の係数。0次から3次へ。
 */
searchMin(incoeffs) {
    const coeffs = [0, 0, 0, 0];

// 3次の係数がマイナスになるようにする
    let k = (incoeffs[3] > 0) ? -1 : 1;
    for (let i = 0; i < incoeffs.length; ++i) {
        coeffs[i] = incoeffs[i] * k;
    }

/**
 * 3次式を計算する
 * @param {number} x 
 * @returns {number}
 */
    const _f = (x) => {
        return coeffs[0] + coeffs[1] * x
        + coeffs[2] * (x ** 2)
        + coeffs[3] * (x ** 3);
    };

    const spans = [
        { x: 0, y: _f(0), err: 10 ** 9 },
        { x: 0, y: _f(0), err: 10 ** 9 },
    ];

    //// 1回微分した後の2次方程式
    const d2s = [coeffs[1] * 1, coeffs[2] * 2, coeffs[3] * 3];
    const decide = d2s[1] ** 2 - 4 * d2s[0] * d2s[2];
    if (decide < 0) { // 虚数解のみ
        // 本来ありえない
    } else { // 二解
        let ans2s = [
            (- d2s[1] - Math.sqrt(decide)) / (2 * d2s[2]),
            (- d2s[1] + Math.sqrt(decide)) / (2 * d2s[2]),
        ];

        spans[1].x = Math.min(...ans2s);
        spans[1].y = _f(spans[1].x);
        spans[1].err = Math.abs(spans[1].y - 0);
    }

    for (let i = 0; i < 30; ++i) {
        let x = (spans[0].x + spans[1].x) * 0.5;
        const y = _f(x);
        const obj = {
            x,
            y,
            err: Math.abs(y - 0),
        };
        spans[(y >= 0 ? 0 : 1)] = obj;
    }

    return (spans[(spans[0].err <= spans[1].err ? 0 : 1)].x);
}


/**
 * 行列のマークダウンを作文して返す
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

/**
 * 行列を文字列で
 * @returns {string}
 */
    toString() {
        let s = `matrix col: ${this.col} row: ${this.row} \n`;
        for (let i = 0; i < this.row; ++i) {
            let start = i * this.col;
            s += this.array.slice(start, start + this.col).map(v => {
                return v.toFixed(3);
            }).join(', ');
            s += '\n';
        }
        return s;
    }

/**
 * 破壊。各要素の大きい方を残す。
 * @param {Matrix} b 
 * @returns 
 */
    max(b) {
        const num = Math.min(this.array.length, b.array.length);
        for (let i = 0; i < num; ++i) {
            this.array[i] = Math.max(this.array[i], b.array[i]);
        }
        return this;
    }

/**
 * 新しい各要素の大きい方を返す
 * @param {Matrix} b 
 * @returns 
 */
    makeMax(b) {
        const ret = this.clone();
        ret.max(b);
        return ret;
    }

/**
 * 破壊。各要素の小さい方を残す。
 * @param {Matrix} b 
 * @returns {Matrix} this 
 */
    min(b) {
        const num = Math.min(this.array.length, b.array.length);
        for (let i = 0; i < num; ++i) {
            this.array[i] = Math.min(this.array[i], b.array[i]);
        }
        return this;
    }

/**
 * 新しい各要素の小さい方を返す
 * @param {Matrix} b 
 * @returns 
 */
    makeMin(b) {
        const ret = this.clone();
        ret.min(b);
        return ret;
    }

/**
 * 破壊。絶対値にする。
 * @returns {Matrix}
 */
    abs() {
        const num = this.array.length;
        for (let i = 0; i < num; ++i) {
            this.array[i] = Math.abs(this.array[i]);
        }
        return this;
    }

/**
 * このベクトルと引数の外積を返す
 * @param {Matrix} b 
 */
    makeCross(b) {
        const ret = new Matrix({ row: 3, col: 1 });
        ret.array[0] = this.array[1] * b.array[2] - this.array[2] * b.array[1];
        ret.array[1] = this.array[2] * b.array[0] - this.array[0] * b.array[2];
        ret.array[2] = this.array[0] * b.array[1] - this.array[1] * b.array[0];
        return ret;
    }

}

class Matrix2 extends Matrix {
    constructor() {
        super({
            row: 2, col: 2,
        });
    }
    static CreateIdentity() {
        return Matrix.CreateIdentity(2);
    }
}

class Matrix3 extends Matrix {
    constructor() {
        super({
            row: 3, col: 3,
        });
    }
    static CreateIdentity() {
        return Matrix.CreateIdentity(3);
    }
}

class Matrix4 extends Matrix {
    constructor() {
        super({ row: 4, col: 4 });
    }
    static CreateIdentity() {
        return Matrix.CreateIdentity(4);
    }
}


class Vector extends Matrix {
    constructor(inopt) {
        super(inopt);
    }
}

class Vector2 extends Vector {
    constructor(inopt) {
        super({ row: 2, col: 1 });
    }
}

class Vector3 extends Vector {
    constructor(inopt) {
        super({ row: 3, col: 1 });
    }
}

class Vector4 extends Vector {
    constructor(inopt) {
        super({ row: 4, col: 1 });
    }
}


LITEMATH.Vector = Vector;
LITEMATH.Vector2 = Vector2;
LITEMATH.Vector3 = Vector3;
LITEMATH.Vector4 = Vector4;

LITEMATH.Matrix = Matrix;
LITEMATH.Matrix2 = Matrix2;
LITEMATH.Matrix3 = Matrix3;
LITEMATH.Matrix4 = Matrix4;
_global.LITEMATH = LITEMATH;


})( (this || 0).self || (typeof self !== 'undefined' ? self : global) );


