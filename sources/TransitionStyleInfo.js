/**
 * Handles parsing, caching, and detecting changes to the 'transition' CSS property
 * @constructor
 * @param {Element} el the target element
 */
PIE.TransitionStyleInfo = PIE.StyleInfoBase.newStyleInfo( {

    cssProperty: 'transition',
    styleProperty: 'transition',

    parseCss: function( css ) {
        var props,
            Type = PIE.Tokenizer.Type,
            tokenizer, token, tokenType, tokenValue, currentTransition,
            a, b, c, d;

        function tokenIsChar( token, ch ) {
            return token && token.tokenValue === ch;
        }

        function tokenToNumber( token ) {
            return ( token && ( token.tokenType & Type.NUMBER ) ) ? parseFloat( token.tokenValue, 10 ) : NaN;
        }

        function flushCurrentTransition() {
            // Fill in defaults
            if (!currentTransition.property) {
                currentTransition.property = 'all';
            }
            if (!currentTransition.timingFunction) {
                currentTransition.timingFunction = 'ease';
            }
            if (!currentTransition.delay) {
                currentTransition.delay = '0';
            }
            props.push(currentTransition);
            currentTransition = 0;
        }

        if( css ) {
            tokenizer = new PIE.Tokenizer( css );
            props = [];

            while( token = tokenizer.next() ) {
                tokenType = token.tokenType;
                tokenValue = token.tokenValue;
                if (!currentTransition) {
                    currentTransition = {
                        // property: 'all',
                        // duration: '0ms',
                        // timingFunction: <PIE.TransitionTimingFunction.*>,
                        // delay: '0ms'
                    };
                }

                // Time values: first one is duration and second one is delay
                if (tokenType & Type.TIME && !currentTransition.duration) {
                    currentTransition.duration = tokenValue;
                }
                else if (tokenType & Type.TIME && !currentTransition.delay) {
                    currentTransition.delay = tokenValue;
                }

                // Timing function
                else if (tokenType & Type.IDENT && !currentTransition.timingFunction && tokenValue in PIE.TransitionTimingFunction.namedEasings) {
                    currentTransition.timingFunction = PIE.TransitionTimingFunction.namedEasings[tokenValue];
                }
                else if (tokenType & Type.FUNCTION && !currentTransition.timingFunction) {
                    if ( tokenValue === 'step' &&
                        !isNaN( a = tokenToNumber( tokenizer.next() ) ) && a > 0 && Math.floor( a ) === a &&
                        tokenIsChar( tokenizer.next(), ',' ) &&
                        ( b = tokenizer.next() ) && ( b.tokenType & Type.IDENT ) && ( b.tokenValue === 'start' || b.tokenValue === 'end' ) &&
                        tokenIsChar( tokenizer.next(), ')' )
                        ) {
                        currentTransition.timingFunction = PIE.TransitionTimingFunction.getStepsTimingFunction( a, b );
                    }
                    else if (tokenValue === 'cubic-bezier' &&
                        !isNaN( a = tokenToNumber( tokenizer.next() ) ) && a >= 0 && a <= 1 &&
                        tokenIsChar( tokenizer.next(), ',' ) &&
                        !isNaN( b = tokenToNumber( tokenizer.next() ) ) &&
                        tokenIsChar( tokenizer.next(), ',' ) &&
                        !isNaN( c = tokenToNumber( tokenizer.next() ) ) && c >= 0 && c <= 1 &&
                        tokenIsChar( tokenizer.next(), ',' ) &&
                        !isNaN( d = tokenToNumber( tokenizer.next() ) ) &&
                        tokenIsChar( tokenizer.next(), ')' )
                        ) {
                        currentTransition.timingFunction = PIE.TransitionTimingFunction.getCubicBezierTimingFunction( a, b, c, d );
                    }
                    else {
                        return null;
                    }
                }

                // Property name
                else if (tokenType & Type.IDENT && !currentTransition.property) {
                    currentTransition.property = tokenValue;
                }

                // Comma: start a new value. Only duration is required so fail if it wasn't found.
                else if (tokenType & Type.OPERATOR && tokenValue === ',' && currentTransition.duration) {
                    flushCurrentTransition();
                }

                // Something unrecognized - fail!
                else {
                    return null;
                }
            }

            // leftovers
            if( currentTransition && currentTransition.duration ) {
                flushCurrentTransition();
            }

        }

        return props && props.length ? props : null;
    }
} );
