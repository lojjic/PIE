/**
 * Handles parsing, caching, and detecting changes to CSS3 'transform' and 'transform-origin' properties
 * @constructor
 * @param {Element} el the target element
 */
PIE.TransformStyleInfo = PIE.StyleInfoBase.newStyleInfo( {
    cssProperty: 'transform',
    styleProperty: 'transform',

    transformFunctions: (function() {
        var Type = PIE.Tokenizer.Type,
            NUMBER = Type.NUMBER,
            ANGLE = Type.ANGLE,
            LENGTH = Type.LENGTH,
            PERCENT = Type.PERCENT,
            LengthCls = PIE.Length,
            AngleCls = PIE.Angle;
        return {
            // function_name: [ allowed_type, min_values, max_values, wrapper_class ]
            'matrix': [ NUMBER, 6, 6 ], //TODO moz allows (requires?) a length w/units for the final 2 args, should we?
            'translate': [ LENGTH | PERCENT, 1, 2, LengthCls ],
            'translateX': [ LENGTH | PERCENT, 1, 1, LengthCls ],
            'translateY': [ LENGTH | PERCENT, 1, 1, LengthCls ],
            'scale': [ NUMBER, 1, 2 ],
            'scaleX': [ NUMBER, 1, 1 ],
            'scaleY': [ NUMBER, 1, 1 ],
            'rotate': [ ANGLE, 1, 1, AngleCls ],
            'skew': [ ANGLE, 1, 2, AngleCls ],
            'skewX': [ ANGLE, 1, 1, AngleCls ],
            'skewY': [ ANGLE, 1, 1, AngleCls ]
        };
    })(),

    xyFunctionRE: /^(.+)(X|Y)$/,

    /**
     * Returns object in the format:
     *   {
     *     origin: <PIE.BgPosition>,
     *     transforms: [
     *       { type: 'matrix', value: [ <Number>, <Number>, <Number>, <Number>, <Number>, <Number> ] },
     *       { type: 'translate', value: [ <PIE.Length>, <PIE.Length> ] },
     *       { type: 'skew', value: [ <PIE.Angle>, <PIE.Angle> ] },
     *       { type: 'scale', value: [ <Number>, <Number> ] },
     *       { type: 'rotate', value: <PIE.Angle> }
     *     ]
     *   }
     *
     * Note that XY-specific functions will be pre-combined into their single counterparts:
     *   scaleX(n) -> scale(n)
     *   scaleY(n) -> scale(1, n)
     *   skewX(a) -> skew(a)
     *   skewY(a) -> skew(0, a)
     *   translateX(l) -> translate(l)
     *   translateY(l) -> translate(0, l)
     */
    parseCss: function( css ) {
        var tokenizer = new PIE.Tokenizer( css ),
            Type = PIE.Tokenizer.Type,
            transformFunctions = this.transformFunctions,
            xyFunctionRE = this.xyFunctionRE,
            YEP = true,
            NOPE = false,
            NULL = null,
            token, tokenType, tokenValue, fnSignature, fnName, fnArgs, hangingArg, hangingComma, xyMatch,
            transforms = [];

        while( token = tokenizer.next() ) {
            tokenType = token.type;
            tokenValue = token.value;

            // Start of function - set up for collection of args
            if( !fnName && ( tokenType & Type.FUNCTION ) && tokenValue in transformFunctions ) {
                fnName = tokenValue;
                fnSignature = transformFunctions[tokenValue];
                fnArgs = [];
            }

            // End of function - validate number of args is within allowed range, push onto transforms list, and reset
            else if ( ( tokenType & Type.CHARACTER ) && tokenValue === ')' && fnName && !hangingComma &&
                      fnArgs.length >= fnSignature[1] && fnArgs.length <= fnSignature[2] ) {

                // Combine XY-specific functions into single functions, e.g. scaleY(n) -> scale(1, n)
                if ( xyMatch = fnName.match( xyFunctionRE ) ) {
                    fnName = xyMatch[1];
                    // For fooX we use the arg untouched, for fooY we push an x value onto the front of the args
                    if ( xyMatch[2] === 'Y' ) {
                        fnArgs.unshift( fnName === 'scale' ? 1 : 0 );
                    }
                }
                // Fill in optional second argument
                else if ( fnArgs.length < 2 ) {
                    fnArgs[1] = fnName === 'scale' ? fnArgs[0] : 0;
                }

                transforms.push( { type: fnName, value: fnArgs } );
                fnSignature = fnName = fnArgs = hangingArg = hangingComma = NOPE;
            }

            // Commas - allowed in between function args
            else if ( ( tokenType & Type.CHARACTER ) && tokenValue === ',' && hangingArg ) {
                hangingArg = NOPE;
                hangingComma = YEP;
            }

            // Function args - allowed at start of function or after comma
            else if ( fnName && ( hangingComma || !hangingArg ) && ( tokenType & fnSignature[0] ) ) {
                fnArgs.push( fnSignature[3] ? new fnSignature[3]( tokenValue ) : parseFloat( tokenValue, 10 ) );
                hangingArg = YEP;
                hangingComma = NOPE;
            }

            // Something not allowed - FAIL!
            else {
                return NULL;
            }
        }

        return transforms[0] && !fnName ? {
                origin: [],
                transforms: transforms
            } : NULL;
    },


    /**
     * Return the {@link PIE.Matrix} 
     */
    getMatrix: PIE.StyleInfoBase.cacheWhenLocked( function( bounds ) {
        var me = this,
            el = me.targetElement,
            props = me.getProps(),
            origin = props.origin.coords( el, bounds.w, bounds.h ),
            transforms = props.transforms,
            matrix = new PIE.Matrix( 1, 0, 0, 1, origin.x, origin.y ),
            i = 0, len = transforms.length,
            type, value;

        // apply each transform in order
        for( ; i < len; i++ ) {
            type = transforms[i].type;
            value = transforms[i].value;
            matrix = matrix[ type ].apply(
                matrix,
                type === 'translate' ? [ value[0].pixels( el ), value[1].pixels( el ) ] : value
            );
        }

        return matrix;
    } )
} );