/**
 * Handles parsing, caching, and detecting changes to CSS3 'transform' and 'transform-origin' properties
 * @constructor
 * @param {Element} el the target element
 */
PIE.TransformStyleInfo = PIE.StyleInfoBase.newStyleInfo( {
    cssProperty: 'transform',
    styleProperty: 'transform',

    transformFunctions: {
        'matrix': 1,
        'translate': 1,
        'translateX': 1,
        'translateY': 1,
        'scale': 1,
        'scaleX': 1,
        'scaleY': 1,
        'rotate': 1,
        'skew': 1,
        'skewX': 1,
        'skewY': 1
    },

    /**
     * Returns object in the format:
     * {
     *     origin: <PIE.BgPosition>,
     *     transforms: [
     *         // all named transforms are pre-translated to 2d matrices, except for translate since it
     *         // can take percentages and therefore depends on the dimensions of the element at render time.
     *         { type: 'matrix', value: [ a, b, c, d, e, f ] },
     *         { type: 'translate', value: [ <PIE.Length>, <PIE.Length> ] },
     *         ...
     *     ]
     * }
     */
    parseCss: function( css ) {
        var tokenizer = new PIE.Tokenizer( css ),
            Type = PIE.Tokenizer.Type,
            token, type, fnName,
            transforms = [];

        /**
         * Multiply two matrices together to get a resultant matrix.
         */
        function multiplyMatrices( a, b ) {
            return [
                a[0] * b[0] + a[2] * b[1],
                a[1] * b[0] + a[3] * b[1],
                a[0] * b[2] + a[2] * b[3],
                a[1] * b[2] + a[3] * b[3],
                a[0] * b[4] + a[2] * b[5] + a[4],
                a[1] * b[4] + a[3] * b[5] + a[5]
            ];
        }

        /**
         * For a given x/y point, find its resulting x/y location after the given matrix transformation.
         */
        function transformPoint( x, y, matrix ) {
            return {
                x: matrix[0] * x + matrix[2] * y + matrix[4],
                y: matrix[1] * x + matrix[3] * y + matrix[5]
            }
        }

        /**
         * Finds the top/left of the bounding rectangle of the element after being transformed by the given
         * matrix. This is used to shift the element to offset the fact that IE's matrix filter always aligns
         * the transformed bounding rect to the original top/left.
         */
        function getTransformedTopLeft( bounds, matrix ) {
            var tl = transformPoint( 0, 0, matrix ),
                tr = transformPoint( bounds.w, 0, matrix ),
                br = transformPoint( bounds.w, bounds.h, matrix ),
                bl = transformPoint( 0, bounds.h, matrix );
            return {
                x: Math.min( tl.x, tr.x, br.x, bl.x ),
                y: Math.min( tl.y, tr.y, br.y, bl.y )
            }
        }

        function getFnArgs() {
            var tokens = tokenizer.until( function(token ) {
                return token.type & Type.CHARACTER && token.value === ')';
            }, true );

            // verify tokens follow the pattern of allowed-datatype alternating with comma
            
        }

        while( token = tokenizer.next() ) {
            type = token.type;
            fnName = token.value;
            if( type & Type.FUNCTION && fnName in this.transformFunctions ) {
                if ( fnName === 'translate' ) {

                }
                else if( fnName.indexOf( 'skew' ) === 0 ) {
                    
                }
                else if( fnName.indexOf( 'translate' ) === 0 ) {

                }
                else if( fnName.indexOf( 'scale' ) === 0 ) {

                }

                transforms.push({type: fnName, args: []});
            }
//            else if( type & ( ANGLE | NUMBER ) ) {
//                props[props.length - 1].value = value;
//            }
            else {
                // something unrecognized; fail!
                return null;
            }
        }

        return transforms[0] ? {
                origin: [],
                transforms: transforms
            } : null;
    }
} );