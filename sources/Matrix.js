PIE.Matrix = function( a, b, c, d, e, f ) {
    var me = this;
    me['a'] = a,
    me['b'] = b,
    me['c'] = c,
    me['d'] = d,
    me['e'] = e,
    me['f'] = f;
};

PIE.Matrix.prototype = {

    ////////// CSSMatrix interface methods: //////////

    /**
     * The setMatrixValue method replaces the existing matrix with one computed from parsing the passed
     * string as though it had been assigned to the transform property in a CSS style rule.
     * @param {String} cssString The string to parse.
     * @throws {DOMException} SYNTAX_ERR Thrown when the provided string can not be parsed into a CSSMatrix.
     */
    setMatrixValue: function( cssString ) {
        // TODO
        // The problem here is how to handle relative/percent units in translate() functions. Those type
        // of values mean nothing without the context of a particular element to resolve them to pixel
        // numbers. They cannot be multiplied until that conversion has been performed.
    },

    /**
     * The multiply method returns a new CSSMatrix which is the result of this matrix multiplied by the
     * passed matrix, with the passed matrix to the right. This matrix is not modified.
     * @param {CSSMatrix} secondMatrix The matrix to multiply.
     * @return {CSSMatrix} The result matrix.
     */
    multiply: function( secondMatrix ) {
        var matrix = this;
        return new PIE.Matrix(
            matrix['a'] * secondMatrix['a'] + matrix['c'] * secondMatrix['b'],
            matrix['b'] * secondMatrix['a'] + matrix['d'] * secondMatrix['b'],
            matrix['a'] * secondMatrix['c'] + matrix['c'] * secondMatrix['d'],
            matrix['b'] * secondMatrix['c'] + matrix['d'] * secondMatrix['d'],
            matrix['a'] * secondMatrix['e'] + matrix['c'] * secondMatrix['f'] + matrix['e'],
            matrix['b'] * secondMatrix['e'] + matrix['d'] * secondMatrix['f'] + matrix['f']
        )
    },

    /**
     * The multiplyLeft method returns a new CSSMatrix which is the result of this matrix multiplied
     * by the passed matrix, with the passed matrix to the left. This matrix is not modified.
     * @param {CSSMatrix} secondMatrix The matrix to multiply.
     * @return {CSSMatrix} The result matrix.
     */
    multiplyLeft: function( secondMatrix ) {
        return secondMatrix.multiply( this );
    },

    /**
     * The inverse method returns a new matrix which is the inverse of this matrix. This matrix is not modified.
     * @return {CSSMatrix} The inverted matrix.
     * @throws {DOMException} NOT_SUPPORTED_ERR Thrown when the CSSMatrix can not be inverted.
     */
    inverse: function() {
        // IS THIS USEFUL?
    },

    /**
     * The translate method returns a new matrix which is this matrix post multiplied by a translation
     * matrix containing the passed values. This matrix is not modified.
     * @param {Number} x The X component of the translation value.
     * @param {Number} y The Y component of the translation value.
     * @return {CSSMatrix} The result matrix.
     */
    translate: function( x, y ) {
        return this.multiply( new PIE.Matrix( 1, 0, 0, 1, x, y ) );
    },

    /**
     * The scale method returns a new matrix which is this matrix post multiplied by a scale matrix
     * containing the passed values. If the y component is undefined, the x component value is used in its
     * place. This matrix is not modified.
     * @param {Number} x The X component of the scale value.
     * @param {Number} y The (optional) Y component of the scale value.
     * @return {CSSMatrix} The result matrix.
     */
    scale: function( x, y, undef ) {
        return this.multiply( new PIE.Matrix( x, 0, 0, y === undef ? x : y, 0, 0 ) );
    },

    /**
     * The rotate method returns a new matrix which is this matrix post multiplied by a rotation matrix.
     * The rotation value is in degrees. This matrix is not modified.
     * @param {Number} angle The angle of rotation (in degrees).
     * @return {CSSMatrix} The result matrix.
     */
    rotate: function( angle ) {
        var maths = Math,
            radians = angle / 180 * maths.PI,
            cosine = maths.cos( radians ),
            sine = maths.sin( radians );
        return this.multiply( new PIE.Matrix( cosine, -sine, sine, cosine, 0, 0 ) );
    },

    /**
     * The skew method returns a new matrix which is this matrix post multiplied by a skew matrix. The
     * rotation value is in degrees. This matrix is not modified.
     * @param {Number} angleX The angle of skew along the X axis.
     * @param {Number} angleY The angle of skew along the Y axis.
     * @return {CSSMatrix} The result matrix.
     */
    skew: function( angleX, angleY ) {
        var maths = Math,
            pi = maths.PI;
        return this.multiply( new PIE.Matrix( 1, maths.tan( angleX / 180 * pi ), maths.tan(angleY / 180 * pi ), 1, 0, 0 ) );
    },

    toString: function() {
        var me = this;
        return 'matrix(' + [me['a'], me['b'], me['c'], me['d'], me['e'], me['f']] + ')';
    },



    ////////// PIE private methods: //////////

    /**
     * Transform a given x/y point according to this matrix.
     * @return {Object.<{x:number, y:number}>} The transformed x/y point
     */
    applyToPoint: function( x, y ) {
        var matrix = this;
        return {
            x: matrix['a'] * x + matrix['c'] * y + matrix['e'],
            y: matrix['b'] * x + matrix['d'] * y + matrix['f']
        }
    },

    /**
     * Transform a given bounding box according to this matrix and return the bounding box of the result
     * @param {Object.<{x:number, y:number, w:number, h:number}>} bounds The bounding box to transform
     * @return {Object.<{x:number, y:number, w:number, h:number}>} The resulting bounding box
     */
    getTransformedBounds: function( bounds ) {
        var matrix = this,
            tl = matrix.applyToPoint( 0, 0 ),
            tr = matrix.applyToPoint( bounds.w, 0 ),
            br = matrix.applyToPoint( bounds.w, bounds.h ),
            bl = matrix.applyToPoint( 0, bounds.h ),
            min = Math.min,
            max = Math.max,
            left = min( tl.x, tr.x, br.x, bl.x ),
            top = min( tl.y, tr.y, br.y, bl.y );
        return {
            x: left,
            y: top,
            w: max( tl.x, tr.x, br.x, bl.x ) - left,
            h: max( tl.y, tr.y, br.y, bl.y ) - top
        }
    }

};

// Alias to global CSSMatrix interface
window.CSSMatrix = PIE.Matrix;