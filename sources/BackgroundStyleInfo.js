/**
 * Handles parsing, caching, and detecting changes to background (and -pie-background) CSS
 * @constructor
 * @param {Element} el the target element
 */
PIE.BackgroundStyleInfo = PIE.StyleInfoBase.newStyleInfo( {

    cssProperty: PIE.CSS_PREFIX + 'background',
    styleProperty: PIE.STYLE_PREFIX + 'Background',

    attachIdents: { 'scroll':1, 'fixed':1, 'local':1 },
    repeatIdents: { 'repeat-x':1, 'repeat-y':1, 'repeat':1, 'no-repeat':1 },
    originIdents: { 'padding-box':1, 'border-box':1, 'content-box':1 },
    clipIdents: { 'padding-box':1, 'border-box':1 },
    positionIdents: { 'top':1, 'right':1, 'bottom':1, 'left':1, 'center':1 },
    sizeIdents: { 'contain':1, 'cover':1 },

    /**
     * For background styles, we support the -pie-background property but fall back to the standard
     * backround* properties.  The reason we have to use the prefixed version is that IE natively
     * parses the standard properties and if it sees something it doesn't know how to parse, for example
     * multiple values or gradient definitions, it will throw that away and not make it available through
     * currentStyle.
     *
     * Format of return object:
     * {
     *     color: <PIE.Color>,
     *     bgImages: [
     *         {
     *             imgType: 'image',
     *             imgUrl: 'image.png',
     *             imgRepeat: <'no-repeat' | 'repeat-x' | 'repeat-y' | 'repeat'>,
     *             bgPosition: <PIE.BgPosition>,
     *             attachment: <'scroll' | 'fixed' | 'local'>,
     *             bgOrigin: <'border-box' | 'padding-box' | 'content-box'>,
     *             clip: <'border-box' | 'padding-box'>,
     *             size: <'contain' | 'cover' | { w: <'auto' | PIE.Length>, h: <'auto' | PIE.Length> }>
     *         },
     *         {
     *             imgType: 'linear-gradient',
     *             gradientStart: <PIE.BgPosition>,
     *             angle: <PIE.Angle>,
     *             stops: [
     *                 { color: <PIE.Color>, offset: <PIE.Length> },
     *                 { color: <PIE.Color>, offset: <PIE.Length> }, ...
     *             ]
     *         }
     *     ]
     * }
     * @param {String} css
     * @override
     */
    parseCss: function( css ) {
        var el = this.targetElement,
            cs = el.currentStyle,
            tokenizer, token, image,
            tok_type = PIE.Tokenizer.Type,
            type_operator = tok_type.OPERATOR,
            type_ident = tok_type.IDENT,
            type_color = tok_type.COLOR,
            tokType, tokVal,
            positionIdents = this.positionIdents,
            gradient, stop,
            props = null;

        function isBgPosToken( token ) {
            return token.isLengthOrPercent() || ( token.tokenType & type_ident && token.tokenValue in positionIdents );
        }

        function sizeToken( token ) {
            return ( token.isLengthOrPercent() && PIE.getLength( token.tokenValue ) ) || ( token.tokenValue === 'auto' && 'auto' );
        }

        // If the CSS3-specific -pie-background property is present, parse it
        if( this.getCss3() ) {
            tokenizer = new PIE.Tokenizer( css );
            props = { bgImages: [] };
            image = {};

            while( token = tokenizer.next() ) {
                tokType = token.tokenType;
                tokVal = token.tokenValue;

                if( !image.imgType && tokType & tok_type.FUNCTION && tokVal === 'linear-gradient' ) {
                    gradient = { stops: [], imgType: tokVal };
                    stop = {};
                    while( token = tokenizer.next() ) {
                        tokType = token.tokenType;
                        tokVal = token.tokenValue;

                        // If we reached the end of the function and had at least 2 stops, flush the info
                        if( tokType & tok_type.CHARACTER && tokVal === ')' ) {
                            if( stop.color ) {
                                gradient.stops.push( stop );
                            }
                            if( gradient.stops.length > 1 ) {
                                PIE.Util.merge( image, gradient );
                            }
                            break;
                        }

                        // Color stop - must start with color
                        if( tokType & type_color ) {
                            // if we already have an angle/position, make sure that the previous token was a comma
                            if( gradient.angle || gradient.gradientStart ) {
                                token = tokenizer.prev();
                                if( token.tokenType !== type_operator ) {
                                    break; //fail
                                }
                                tokenizer.next();
                            }

                            stop = {
                                color: PIE.getColor( tokVal )
                            };
                            // check for offset following color
                            token = tokenizer.next();
                            if( token.isLengthOrPercent() ) {
                                stop.offset = PIE.getLength( token.tokenValue );
                            } else {
                                tokenizer.prev();
                            }
                        }
                        // Angle - can only appear in first spot
                        else if( tokType & tok_type.ANGLE && !gradient.angle && !stop.color && !gradient.stops.length ) {
                            gradient.angle = new PIE.Angle( token.tokenValue );
                        }
                        else if( isBgPosToken( token ) && !gradient.gradientStart && !stop.color && !gradient.stops.length ) {
                            tokenizer.prev();
                            gradient.gradientStart = new PIE.BgPosition(
                                tokenizer.until( function( t ) {
                                    return !isBgPosToken( t );
                                }, false )
                            );
                        }
                        else if( tokType & type_operator && tokVal === ',' ) {
                            if( stop.color ) {
                                gradient.stops.push( stop );
                                stop = {};
                            }
                        }
                        else {
                            // Found something we didn't recognize; fail without adding image
                            break;
                        }
                    }
                }
                else if( !image.imgType && tokType & tok_type.URL ) {
                    image.imgUrl = tokVal;
                    image.imgType = 'image';
                }
                else if( isBgPosToken( token ) && !image.size ) {
                    tokenizer.prev();
                    image.bgPosition = new PIE.BgPosition(
                        tokenizer.until( function( t ) {
                            return !isBgPosToken( t );
                        }, false )
                    );
                }
                else if( tokType & type_ident ) {
                    if( tokVal in this.repeatIdents ) {
                        image.imgRepeat = tokVal;
                    }
                    else if( tokVal in this.originIdents ) {
                        image.bgOrigin = tokVal;
                        if( tokVal in this.clipIdents ) {
                            image.clip = tokVal;
                        }
                    }
                    else if( tokVal in this.attachIdents ) {
                        image.attachment = tokVal;
                    }
                }
                else if( tokType & type_color && !props.color ) {
                    props.color = PIE.getColor( tokVal );
                }
                else if( tokType & type_operator ) {
                    // background size
                    if( tokVal === '/' ) {
                        token = tokenizer.next();
                        tokType = token.tokenType;
                        tokVal = token.tokenValue;
                        if( tokType & type_ident && tokVal in this.sizeIdents ) {
                            image.size = tokVal;
                        }
                        else if( tokVal = sizeToken( token ) ) {
                            image.size = {
                                w: tokVal,
                                h: sizeToken( tokenizer.next() ) || ( tokenizer.prev() && tokVal )
                            };
                        }
                    }
                    // new layer
                    else if( tokVal === ',' && image.imgType ) {
                        props.bgImages.push( image );
                        image = {};
                    }
                }
                else {
                    // Found something unrecognized; chuck everything
                    return null;
                }
            }

            // leftovers
            if( image.imgType ) {
                props.bgImages.push( image );
            }
        }

        // Otherwise, use the standard background properties; let IE give us the values rather than parsing them
        else {
            this.withActualBg( function() {
                var posX = cs.backgroundPositionX,
                    posY = cs.backgroundPositionY,
                    img = cs.backgroundImage,
                    color = cs.backgroundColor;

                props = {};
                if( color !== 'transparent' ) {
                    props.color = PIE.getColor( color )
                }
                if( img !== 'none' ) {
                    props.bgImages = [ {
                        imgType: 'image',
                        imgUrl: new PIE.Tokenizer( img ).next().tokenValue,
                        imgRepeat: cs.backgroundRepeat,
                        bgPosition: new PIE.BgPosition( new PIE.Tokenizer( posX + ' ' + posY ).all() )
                    } ];
                }
            } );
        }

        return ( props && ( props.color || ( props.bgImages && props.bgImages[0] ) ) ) ? props : null;
    },

    /**
     * Execute a function with the actual background styles (not overridden with runtimeStyle
     * properties set by the renderers) available via currentStyle.
     * @param fn
     */
    withActualBg: function( fn ) {
        var rs = this.targetElement.runtimeStyle,
            rsImage = rs.backgroundImage,
            rsColor = rs.backgroundColor,
            ret;

        if( rsImage ) rs.backgroundImage = '';
        if( rsColor ) rs.backgroundColor = '';

        ret = fn.call( this );

        if( rsImage ) rs.backgroundImage = rsImage;
        if( rsColor ) rs.backgroundColor = rsColor;

        return ret;
    },

    getCss: PIE.StyleInfoBase.cacheWhenLocked( function() {
        return this.getCss3() ||
               this.withActualBg( function() {
                   var cs = this.targetElement.currentStyle;
                   return cs.backgroundColor + ' ' + cs.backgroundImage + ' ' + cs.backgroundRepeat + ' ' +
                   cs.backgroundPositionX + ' ' + cs.backgroundPositionY;
               } );
    } ),

    getCss3: PIE.StyleInfoBase.cacheWhenLocked( function() {
        var el = this.targetElement;
        return el.style[ this.styleProperty ] || el.currentStyle.getAttribute( this.cssProperty );
    } ),

    /**
     * Tests if style.PiePngFix or the -pie-png-fix property is set to true in IE6.
     */
    isPngFix: function() {
        var val = 0, el;
        if( PIE.ieVersion < 7 ) {
            el = this.targetElement;
            val = ( '' + ( el.style[ PIE.STYLE_PREFIX + 'PngFix' ] || el.currentStyle.getAttribute( PIE.CSS_PREFIX + 'png-fix' ) ) === 'true' );
        }
        return val;
    },
    
    /**
     * The isActive logic is slightly different, because getProps() always returns an object
     * even if it is just falling back to the native background properties.  But we only want
     * to report is as being "active" if either the -pie-background override property is present
     * and parses successfully or '-pie-png-fix' is set to true in IE6.
     */
    isActive: PIE.StyleInfoBase.cacheWhenLocked( function() {
        return (this.getCss3() || this.isPngFix()) && !!this.getProps();
    } )

} );