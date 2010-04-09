PIE.BackgroundStyleInfo = function( el ) {
    this.element = el;
};
PIE.Util.merge( PIE.BackgroundStyleInfo.prototype, PIE.StyleBase, {

    cssProperty: PIE.CSS_PREFIX + 'background',
    styleProperty: PIE.STYLE_PREFIX + 'Background',

    attachIdents: { scroll:1, fixed:1, local:1 },
    repeatIdents: { 'repeat-x':1, 'repeat-y':1, 'repeat':1, 'no-repeat':1 },
    originIdents: { 'padding-box':1, 'border-box':1, 'content-box':1 },
    positionIdents: { top:1, right:1, bottom:1, left:1, center:1 },

    /**
     * For background styles, we support the -pie-background property but fall back to the standard
     * backround* properties.  The reason we have to use the prefixed version is that IE natively
     * parses the standard properties and if it sees something it doesn't know how to parse, for example
     * multiple values or gradient definitions, it will throw that away and not make it available through
     * currentStyle.
     *
     * Format of return object:
     * {
     *     color: new PIE.Color('red'),
     *     images: [
     *         {
     *             type: 'image',
     *             url: 'image.png',
     *             repeat: 'no-repeat',
     *             position: new PIE.BgPosition(...)
     *         },
     *         {
     *             type: 'linear-gradient',
     *             gradientStart: new PIE.BgPosition(...),
     *             angle: new PIE.Angle( '45deg' ),
     *             stops: [
     *                 { color: new PIE.Color('blue'), offset: new Length( '0' ) },
     *                 { color: new PIE.Color('red'), offset: new Length( '100%' ) }
     *             ]
     *         }
     *     ]
     * }
     * @param css
     */
    parseCss: function( css ) {
        var el = this.element,
            cs = el.currentStyle,
            rs = el.runtimeStyle,
            tokenizer, token, image,
            tokType, tokVal,
            positionIdents = this.positionIdents,
            gradient, stop,
            props = null;

        function isBgPosToken( token ) {
            return token.type === 'LENGTH' || token.type === 'PERCENT' || token.type === 'NUMBER' ||
                   ( token.type === 'IDENT' && token.value in positionIdents );
        }

        // If the CSS3-specific -pie-background property is present, parse it
        if( this.getCss3() ) {
            tokenizer = new PIE.Tokenizer( css );
            props = { images: [] };
            image = {};

            while( token = tokenizer.next() ) {
                tokType = token.type;
                tokVal = token.value;

                if( !image.type && tokType === 'FUNCTION' && tokVal === 'linear-gradient(' ) {
                    gradient = { stops: [], type: 'linear-gradient' };
                    stop = {};
                    while( token = tokenizer.next() ) {
                        tokType = token.type;
                        tokVal = token.value;

                        // If we reached the end of the function and had at least 2 stops, flush the info
                        if( tokType === 'CHAR' && tokVal === ')' ) {
                            if( stop.color ) {
                                gradient.stops.push( stop );
                            }
                            if( gradient.stops.length > 1 ) {
                                PIE.Util.merge( image, gradient );
                            }
                            break;
                        }

                        // Color stop - must start with color
                        if( tokType === 'COLOR' ) {
                            // if we already have an angle/position, make sure that the previous token was a comma
                            if( gradient.angle || gradient.gradientStart ) {
                                token = tokenizer.prev();
                                if( token.type !== 'OPERATOR' ) {
                                    break; //fail
                                }
                                tokenizer.next();
                            }

                            stop = {
                                color: new PIE.Color( tokVal )
                            };
                            // check for offset following color
                            token = tokenizer.next();
                            if( token.type === 'LENGTH' || token.type === 'PERCENT' || token.type === 'NUMBER' ) {
                                stop.offset = new PIE.Length( token.value );
                            } else {
                                tokenizer.prev();
                            }
                        }
                        // Angle - can only appear in first spot
                        else if( tokType === 'ANGLE' && !gradient.angle && !stop.color && !gradient.stops.length ) {
                            gradient.angle = new PIE.Angle( token.value );
                        }
                        else if( isBgPosToken( token ) && !gradient.gradientStart && !stop.color && !gradient.stops.length ) {
                            tokenizer.prev();
                            gradient.gradientStart = new PIE.BgPosition(
                                tokenizer.until( function( t ) {
                                    return !isBgPosToken( t );
                                }, false ).slice( 0, -1 )
                            );
                            tokenizer.prev();
                        }
                        else if( tokType === 'OPERATOR' && tokVal === ',' ) {
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
                else if( !image.type && tokType === 'URL' ) {
                    image.url = tokVal;
                    image.type = 'image';
                }
                else if( isBgPosToken( token ) ) {
                    tokenizer.prev();
                    image.position = new PIE.BgPosition(
                        tokenizer.until( function( t ) {
                            return !isBgPosToken( t );
                        }, false ).slice( 0, -1 )
                    );
                    tokenizer.prev();
                }
                else if( tokType === 'IDENT' ) {
                    if( tokVal in this.repeatIdents ) {
                        image.repeat = tokVal;
                    }
                    // TODO attachment, origin
                }
                else if( tokType === 'COLOR' && !props.color ) {
                    props.color = new PIE.Color( tokVal );
                }
                else if( tokType === 'OPERATOR' ) {
                    /* TODO bg-size
                    if( tokVal === '/' ) {
                    }*/
                    if( tokVal === ',' && image.type ) {
                        props.images.push( image );
                        image = {};
                    }
                }
                else {
                    // Found something unrecognized; chuck everything
                    return null;
                }
            }

            // leftovers
            if( image.type ) {
                props.images.push( image );
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
                    props.color = new PIE.Color( color )
                }
                if( img !== 'none' ) {
                    props.images = [ {
                        type: 'image',
                        url: img.replace( this.urlRE, "$1" ),
                        repeat: cs.backgroundRepeat,
                        position: new PIE.BgPosition( new PIE.Tokenizer( posX + ' ' + posY ).all() )
                    } ];
                }
            } );
        }

        return props;
    },

    /**
     * Execute a function with the actual background styles (not overridden with runtimeStyle
     * properties set by the renderers) available via currentStyle.
     * @param fn
     */
    withActualBg: function( fn ) {
        var rs = this.element.runtimeStyle,
            rsImage = rs.backgroundImage,
            rsColor = rs.backgroundColor,
            ret;

        rs.backgroundImage = rs.backgroundColor = '';

        ret = fn.call( this );

        rs.backgroundImage = rsImage;
        rs.backgroundColor = rsColor;

        return ret;
    },

    getCss: function() {
        var cs = this.element.currentStyle;
        return this.getCss3() ||
               this.withActualBg( function() {
                   return cs.backgroundColor + ' ' + cs.backgroundImage + ' ' + cs.backgroundRepeat + ' ' +
                   cs.backgroundPositionX + ' ' + cs.backgroundPositionY;
               } );
    },

    getCss3: function() {
        var el = this.element;
        return el.style[ this.styleProperty ] || el.currentStyle.getAttribute( this.cssProperty );
    },

    /**
     * The isActive logic is slightly different, because getProps() always returns an object
     * even if it is just falling back to the native background properties.  But we only want
     * to report is as being "active" if the -pie-background override property is present and
     * parses successfully.
     */
    isActive: function() {
        return this.getCss3() && !!this.getProps();
    }

} );
