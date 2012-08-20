/**
 * Renderer for element borders.
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BorderRenderer = PIE.RendererBase.newRenderer( {

    shapeZIndex: 4,

    /**
     * Single definition of arguments for use by the per-side creation loop in
     * getBorderSegmentsInfo. Arguments are, in order:
     * centerX1, centerY1, outerX1, outerY1, centerX2, centerY2, outerX2, outerY2, baseAngle
     */
    sideArgs: {
        't': [ 2, 1, 0, 3, 4, 7, 6, 5, 90 ],
        'r': [ 4, 7, 6, 5, 10, 9, 8, 11, 0 ],
        'b': [ 10, 9, 8, 11, 12, 15, 14, 13, 270 ],
        'l': [ 12, 15, 14, 13, 2, 1, 0, 3, 180 ]
    },

    dashedStyles: {
        'dotted': 1,
        'dashed': 1
    },
    colorManipStyles: {
        'groove': 1,
        'ridge': 1,
        'inset': 1,
        'outset': 1
    },
    doubleStyles: {
        'groove': 1,
        'ridge': 1,
        'double': 1
    },


    needsUpdate: function() {
        var si = this.styleInfos;
        return si.borderInfo.changed() || si.borderRadiusInfo.changed();
    },

    isActive: function() {
        var si = this.styleInfos;
        return si.borderRadiusInfo.isActive() &&
               !si.borderImageInfo.isActive() &&
               si.borderInfo.isActive(); //check BorderStyleInfo last because it's the most expensive
    },

    /**
     * Draw the border shape(s)
     */
    draw: function() {
        var me = this,
            props = me.styleInfos.borderInfo.getProps(),
            bounds = me.boundsInfo.getBounds(),
            shape, segmentsInfo, i, j, len;

        if( props ) {
            me.hideBorder();

            segmentsInfo = me.getBorderSegmentsInfo();
            for( i = j = 0, len = segmentsInfo.length; i < len; i += 2) {
                shape = me.getShape( 'border' + j++, me.shapeZIndex );
                shape.setSize( bounds.w, bounds.h );
                shape.setAttrs(
                    'path', segmentsInfo[ i ]
                );
                shape.setFillAttrs(
                    'color', segmentsInfo[ i + 1 ]
                );
            }

            // remove any previously-created border shapes which didn't get used above
            while( me.deleteShape( 'border' + j++ ) ) {}
        }
    },


    /**
     * Adds rectangular sub-paths at intervals along a given side which serve to "cut out"
     * those areas, forming the spaces in a dashed or dotted border.
     * @param {Array.<string>} path The path string array to which the extra sub-paths will be added
     * @param {number} startCoord The x or y coordinate at which the dashing starts
     * @param {number} endCoord The x or y coordinate at which the dashing ends
     * @param {number} sideWidth The width of the border on the target side
     * @param {number} shift A shift of the perpendicular coordinate
     * @param {boolean} isVertical True if this is a vertical border (left or right)
     * @param {string} style The border style, either 'dotted' or 'dashed'
     */
    dashify: function( path, startCoord, endCoord, sideWidth, shift, isVertical, style ) {
        var dashLength = sideWidth * ( style === 'dashed' ? 3 : 1 ),
            shift2 = shift + sideWidth,
            dashEndCoord;

        // If dash is longer than the box edge, don't make any cutouts
        if( dashLength < endCoord - startCoord ) {
            // adjust the start to keep the dash pattern centered on the box edge, favoring full
            // spaces over full dashes, like WebKit does.
            startCoord += ( endCoord - startCoord - dashLength ) / 2 % dashLength;

            // add rectangular sub-paths to cut out each dash's space
            while( startCoord < endCoord ) {
                dashEndCoord = Math.min( startCoord + dashLength, endCoord );
                path.push(
                    isVertical ? (
                        'm' + shift + ',' + startCoord +
                        'l' + shift + ',' + dashEndCoord +
                        'l' + shift2 + ',' + dashEndCoord +
                        'l' + shift2 + ',' + startCoord + 'x'
                    ) : (
                        'm' + startCoord + ',' + shift +
                        'l' + dashEndCoord + ',' + shift +
                        'l' + dashEndCoord + ',' + shift2 +
                        'l' + startCoord + ',' + shift2 + 'x'
                    )
                );
                startCoord += dashLength * 2;
            }
        }
    },


    /**
     * Get the VML path definitions for the border segment(s).
     * @return {Array.<string>} Pairs of segment info: 1st item in each pair is the path string, 2nd is the fill color
     */
    getBorderSegmentsInfo: function() {
        var me = this,
            borderInfo = me.styleInfos.borderInfo,
            segmentsInfo = [];

        if( borderInfo.isActive() ) {
            var mult = 2,
                el = me.targetElement,
                bounds = me.boundsInfo.getBounds(),
                borderProps = borderInfo.getProps(),
                widths = borderProps.widths,
                styles = borderProps.styles,
                colors = borderProps.colors,
                M = Math,
                abs = M.abs,
                round = M.round,
                wT = round( widths['t'].pixels( el ) ),
                wR = round( widths['r'].pixels( el ) ),
                wB = round( widths['b'].pixels( el ) ),
                wL = round( widths['l'].pixels( el ) ),
                path = [],
                innerCoords, outerCoords, doubleOuterCoords, doubleInnerCoords,
                sideArgs = me.sideArgs,
                side,
                deg = 65535,
                dashedStyles = me.dashedStyles,
                style, color;

            // When the border has uniform color and style all the way around, we can get
            // away with a single VML path shape, otherwise we need four separate shapes.
            if ( borderProps.stylesSame && borderProps.colorsSame && !( styles[ 't' ] in me.colorManipStyles ) ) {
                if( colors['t'].alpha() > 0 ) {
                    // Outer path
                    path[ 0 ] = me.getBoxPath( 0, 0, 0, 0, mult );

                    // If double style, add the middle cutout sub-paths
                    style = styles[ 't' ];
                    if( style === 'double' ) {
                        path.push(
                            me.getBoxPath( wT / 3, wR / 3, wB / 3, wL / 3, mult ) +
                            me.getBoxPath( wT * 2 / 3, wR * 2 / 3, wB * 2 / 3, wL * 2 / 3, mult )
                        );
                    }
                    // If dashed, add the dash cutout sub-paths
                    else if( style in dashedStyles ) {
                        innerCoords = me.getBoxPathCoords( wT, wR, wB, wL, mult );
                        me.dashify( path, innerCoords[ 2 ], innerCoords[ 4 ], wT * mult, 0, 0, styles[ 't' ] );
                        me.dashify( path, innerCoords[ 7 ], innerCoords[ 9 ], wR * mult, ( bounds.w - wR ) * mult, 1, styles[ 'r' ] );
                        me.dashify( path, innerCoords[ 12 ], innerCoords[ 10 ], wB * mult, ( bounds.h - wB ) * mult, 0, styles[ 'b' ] );
                        me.dashify( path, innerCoords[ 1 ], innerCoords[ 15 ], wL * mult, 0, 1, styles[ 'l' ] );
                    }

                    // Inner path
                    path.push( me.getBoxPath( wT, wR, wB, wL, mult ) );

                    segmentsInfo.push( path.join( '' ), colors['t'].colorValue( el ) );
                }
            }
            else {
                outerCoords = me.getBoxPathCoords( 0, 0, 0, 0, mult );
                innerCoords = me.getBoxPathCoords( wT, wR, wB, wL, mult );

                // Build the segment for each side
                for( side in sideArgs ) {
                    if ( sideArgs.hasOwnProperty( side ) && colors[ side ].alpha() > 0 ) {
                        var args = sideArgs[ side ],
                            centerX1 = args[ 0 ],
                            centerY1 = args[ 1 ],
                            outerX1 = args[ 2 ],
                            outerY1 = args[ 3 ],
                            centerX2 = args[ 4 ],
                            centerY2 = args[ 5 ],
                            outerX2 = args[ 6 ],
                            outerY2 = args[ 7 ],
                            baseAngle = args[ 8 ],
                            isTopLeft = side === 't' || side === 'l';

                        style = styles[ side ];

                        // Outer edge
                        path[ 0 ] = 'al' + outerCoords[ centerX1 ] + ',' + outerCoords[ centerY1 ] + ',' +
                                abs( outerCoords[ outerX1 ] - outerCoords[ centerX1 ] ) + ',' +
                                abs( outerCoords[ outerY1 ] - outerCoords[ centerY1 ] ) + ',' +
                                ( baseAngle + 45 ) * deg + ',' + -45 * deg +
                            'ae' + outerCoords[ centerX2 ] + ',' + outerCoords[ centerY2 ] + ',' +
                                abs( outerCoords[ outerX2 ] - outerCoords[ centerX2 ] ) + ',' +
                                abs( outerCoords[ outerY2 ] - outerCoords[ centerY2 ] ) + ',' +
                                baseAngle * deg + ',' + -45 * deg;

                        // If double style, add the middle sub-paths
                        if( style in me.doubleStyles ) {
                            if( !doubleOuterCoords ) {
                                if ( style === 'double' ) {
                                    doubleOuterCoords = me.getBoxPathCoords( wT / 3, wR / 3, wB / 3, wL / 3, mult );
                                    doubleInnerCoords = me.getBoxPathCoords( wT * 2 / 3, wR * 2 / 3, wB * 2 / 3, wL * 2 / 3, mult );
                                } else {
                                    doubleOuterCoords = doubleInnerCoords = me.getBoxPathCoords( wT / 2, wR / 2, wB / 2, wL / 2, mult );
                                }
                            }
                            path.push(
                                'ae' + doubleOuterCoords[ centerX2 ] + ',' + doubleOuterCoords[ centerY2 ] + ',' +
                                    abs( doubleOuterCoords[ outerX2 ] - doubleOuterCoords[ centerX2 ] ) + ',' +
                                    abs( doubleOuterCoords[ outerY2 ] - doubleOuterCoords[ centerY2 ] ) + ',' +
                                    ( baseAngle - 45 ) * deg + ',' + 45 * deg +
                                'ae' + doubleOuterCoords[ centerX1 ] + ',' + doubleOuterCoords[ centerY1 ] + ',' +
                                    abs( doubleOuterCoords[ outerX1 ] - doubleOuterCoords[ centerX1 ] ) + ',' +
                                    abs( doubleOuterCoords[ outerY1 ] - doubleOuterCoords[ centerY1 ] ) + ',' +
                                    baseAngle * deg + ',' + 45 * deg +
                                'x'
                            );

                            // Actual 'double' style with have both paths as a single shape, but 'ridge' and
                            // 'groove' need separate shapes for the different colors
                            if( style !== 'double' ) {
                                color = colors[ side ].colorValue( el ) + (
                                    ( style === 'groove' ? isTopLeft : !isTopLeft ) ? ' darken(128)' : ' lighten(128)'
                                );
                                segmentsInfo.push( path.join( '' ), color );
                                path.length = 0; //reuse same array for next loop
                            }

                            path.push(
                                'al' + doubleInnerCoords[ centerX1 ] + ',' + doubleInnerCoords[ centerY1 ] + ',' +
                                    abs( doubleInnerCoords[ outerX1 ] - doubleInnerCoords[ centerX1 ] ) + ',' +
                                    abs( doubleInnerCoords[ outerY1 ] - doubleInnerCoords[ centerY1 ] ) + ',' +
                                    ( baseAngle + 45 ) * deg + ',' + -45 * deg +
                                'ae' + doubleInnerCoords[ centerX2 ] + ',' + doubleInnerCoords[ centerY2 ] + ',' +
                                    abs( doubleInnerCoords[ outerX2 ] - doubleInnerCoords[ centerX2 ] ) + ',' +
                                    abs( doubleInnerCoords[ outerY2 ] - doubleInnerCoords[ centerY2 ] ) + ',' +
                                    baseAngle * deg + ',' + -45 * deg
                            );
                        }

                        // Inner edge
                        path.push(
                            'ae' + innerCoords[ centerX2 ] + ',' + innerCoords[ centerY2 ] + ',' +
                                abs( innerCoords[ outerX2 ] - innerCoords[ centerX2 ] ) + ',' +
                                abs( innerCoords[ outerY2 ] - innerCoords[ centerY2 ] ) + ',' +
                                ( baseAngle - 45 ) * deg + ',' + 45 * deg +
                            'ae' + innerCoords[ centerX1 ] + ',' + innerCoords[ centerY1 ] + ',' +
                                abs( innerCoords[ outerX1 ] - innerCoords[ centerX1 ] ) + ',' +
                                abs( innerCoords[ outerY1 ] - innerCoords[ centerY1 ] ) + ',' +
                                baseAngle * deg + ',' + 45 * deg +
                            'x'
                        );

                        // For dashed/dotted styles, add the dash cutout sub-paths
                        if ( style in dashedStyles ) {
                            side === 't' ?
                                me.dashify( path, innerCoords[ 2 ], innerCoords[ 4 ], wT * mult, 0, 0, style ) :
                            side === 'r' ?
                                me.dashify( path, innerCoords[ 7 ], innerCoords[ 9 ], wR * mult, ( bounds.w - wR ) * mult, 1, style ) :
                            side === 'b' ?
                                me.dashify( path, innerCoords[ 12 ], innerCoords[ 10 ], wB * mult, ( bounds.h - wB ) * mult, 0, style ) :
                            //side === 'l' ?
                                me.dashify( path, innerCoords[ 1 ], innerCoords[ 15 ], wL * mult, 0, 1, style );
                        }

                        color = colors[ side ].colorValue( el );
                        if ( style in me.colorManipStyles ) {
                            // lighten or darken as appropriate
                            color += (
                                ( ( style === 'groove' || style === 'outset' ) ? isTopLeft : !isTopLeft ) ?
                                ' lighten(128)' : ' darken(128)'
                            );
                        }
                        segmentsInfo.push( path.join( '' ), color );
                        path.length = 0; //reuse same array for next loop
                    }
                }
            }
        }

        return segmentsInfo;
    },

    destroy: function() {
        var me = this;
        if (me.finalized || !me.styleInfos.borderImageInfo.isActive()) {
            me.targetElement.runtimeStyle.borderColor = '';
        }
        PIE.RendererBase.destroy.call( me );
    }


} );
