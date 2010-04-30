/**
 * Renderer for element backgrounds and borders.
 * @constructor
 * @param {Element} el The target element
 * @param {Object} styleInfos The StyleInfo objects
 * @param {PIE.RootRenderer} parent
 */
PIE.BackgroundAndBorderRenderer = (function() {
    function BackgroundAndBorderRenderer( el, styleInfos, parent ) {
        this.element = el;
        this.styleInfos = styleInfos;
        this.parent = parent;
    }
    PIE.Util.merge( BackgroundAndBorderRenderer.prototype, PIE.RendererBase, {

        zIndex: 2,

        needsUpdate: function() {
            var si = this.styleInfos;
            return si.borderInfo.changed() || si.backgroundInfo.changed() || si.borderRadiusInfo.changed();
        },

        isActive: function() {
            var si = this.styleInfos;
            return si.borderImageInfo.isActive() ||
                   si.borderRadiusInfo.isActive() ||
                   si.backgroundInfo.isActive() ||
                   ( si.boxShadowInfo.isActive() && si.boxShadowInfo.getProps().inset );
        },

        updateSize: function() {
            if( this.isActive() ) {
                this.draw();
            }
        },

        updateProps: function() {
            this.destroy();
            if( this.isActive() ) {
                this.draw();
            }
        },

        /**
         * Draw the shapes
         */
        draw: function() {
            this.drawBgColor();
            this.drawBgImages();
            this.drawBorder();
        },

        /**
         * Draw the background color shape
         */
        drawBgColor: function() {
            var props = this.styleInfos.backgroundInfo.getProps(),
                el = this.element,
                color = props && props.color && props.color.value( el ),
                shape, w, h, s, alpha;

            if( color && color !== 'transparent' ) {
                this.hideBackground();

                shape = this.getShape( 'bgColor', 'fill', 1 );
                w = el.offsetWidth;
                h = el.offsetHeight;
                shape.stroked = false;
                shape.coordsize = w * 2 + ',' + h * 2;
                shape.coordorigin = '1,1';
                shape.path = this.getBoxPath( null, 2 );
                s = shape.style;
                s.width = w;
                s.height = h;
                shape.fill.color = color;

                alpha = props.color.alpha();
                if( alpha < 1 ) {
                    shape.fill.opacity = alpha;
                }
            } else {
                this.deleteShape( 'bgColor' );
            }
        },

        /**
         * Draw all the background image layers
         */
        drawBgImages: function() {
            var props = this.styleInfos.backgroundInfo.getProps(),
                images = props && props.images,
                img, el, shape, w, h, s, i;

            if( images ) {
                this.hideBackground();

                el = this.element;
                w = el.offsetWidth,
                h = el.offsetHeight,

                i = images.length;
                while( i-- ) {
                    img = images[i];
                    shape = this.getShape( 'bgImage' + i, 'fill', 2 );

                    shape.stroked = false;
                    shape.fill.type = 'tile';
                    shape.fillcolor = 'none';
                    shape.coordsize = w * 2 + ',' + h * 2;
                    shape.coordorigin = '1,1';
                    shape.path = this.getBoxPath( 0, 2 );
                    s = shape.style;
                    s.width = w;
                    s.height = h;

                    if( img.type === 'linear-gradient' ) {
                        this.addLinearGradient( shape, img );
                    }
                    else {
                        shape.fill.src = img.url;
                        this.positionBgImage( shape, i );
                    }
                }
            }

            // Delete any bgImage shapes previously created which weren't used above
            i = images ? images.length : 0;
            while( this.deleteShape( 'bgImage' + i++ ) ) {}
        },


        /**
         * Set the position and clipping of the background image for a layer
         * @param {Element} shape
         * @param {number} index
         */
        positionBgImage: function( shape, index ) {
            PIE.Util.withImageSize( shape.fill.src, function( size ) {
                var fill = shape.fill,
                    el = this.element,
                    elW = el.offsetWidth,
                    elH = el.offsetHeight,
                    cs = el.currentStyle,
                    si = this.styleInfos,
                    border = si.borderInfo.getProps(),
                    bw = border && border.widths,
                    bwT = bw ? bw['t'].pixels( el ) : 0,
                    bwR = bw ? bw['r'].pixels( el ) : 0,
                    bwB = bw ? bw['b'].pixels( el ) : 0,
                    bwL = bw ? bw['l'].pixels( el ) : 0,
                    bg = si.backgroundInfo.getProps().images[ index ],
                    bgPos = bg.position ? bg.position.coords( el, elW - size.w - bwL - bwR, elH - size.h - bwT - bwB ) : { x:0, y:0 },
                    repeat = bg.repeat,
                    pxX, pxY,
                    clipT = 0, clipR = elW, clipB = elH, clipL = 0;

                // Positioning - find the pixel offset from the top/left and convert to a ratio
                // The position is shifted by half a pixel, to adjust for the half-pixel coordorigin shift which is
                // needed to fix antialiasing but makes the bg image fuzzy.
                pxX = bgPos.x + bwL + 0.5;
                pxY = bgPos.y + bwT + 0.5;
                fill.position = ( pxX / elW ) + ',' + ( pxY / elH );

                // Repeating - clip the image shape
                if( repeat && repeat !== 'repeat' ) {
                    if( repeat === 'repeat-x' || repeat === 'no-repeat' ) {
                        clipT = pxY + 1;
                        clipB = pxY + size.h + 1;
                    }
                    if( repeat === 'repeat-y' || repeat === 'no-repeat' ) {
                        clipL = pxX + 1;
                        clipR = pxX + size.w + 1;
                    }
                    shape.style.clip = 'rect(' + clipT + 'px,' + clipR + 'px,' + clipB + 'px,' + clipL + 'px)';
                }
            }, this );
        },


        /**
         * Draw the linear gradient for a gradient layer
         * @param {Element} shape
         * @param {Object} info The object holding the information about the gradient
         */
        addLinearGradient: function( shape, info ) {
            var el = this.element,
                w = el.offsetWidth,
                h = el.offsetHeight,
                fill = shape.fill,
                angle = info.angle,
                startPos = info.gradientStart,
                stops = info.stops,
                stopCount = stops.length,
                PI = Math.PI,
                startX, startY,
                endX, endY,
                startCornerX, startCornerY,
                endCornerX, endCornerY,
                vmlAngle, vmlGradientLength, vmlColors,
                deltaX, deltaY, lineLength,
                stopPx, vmlOffsetPct,
                p, i, j, before, after;

            /**
             * Find the point along a given line (defined by a starting point and an angle), at which
             * that line is intersected by a perpendicular line extending through another point.
             * @param x1 - x coord of the starting point
             * @param y1 - y coord of the starting point
             * @param angle - angle of the line extending from the starting point (in degrees)
             * @param x2 - x coord of point along the perpendicular line
             * @param y2 - y coord of point along the perpendicular line
             * @return [ x, y ]
             */
            function perpendicularIntersect( x1, y1, angle, x2, y2 ) {
                // Handle straight vertical and horizontal angles, for performance and to avoid
                // divide-by-zero errors.
                if( angle === 0 || angle === 180 ) {
                    return [ x2, y1 ];
                }
                else if( angle === 90 || angle === 270 ) {
                    return [ x1, y2 ];
                }
                else {
                    // General approach: determine the Ax+By=C formula for each line (the slope of the second
                    // line is the negative inverse of the first) and then solve for where both formulas have
                    // the same x/y values.
                    var a1 = Math.tan( -angle * PI / 180 ),
                        c1 = a1 * x1 - y1,
                        a2 = -1 / a1,
                        c2 = a2 * x2 - y2,
                        d = a2 - a1,
                        endX = ( c2 - c1 ) / d,
                        endY = ( a1 * c2 - a2 * c1 ) / d;
                    return [ endX, endY ];
                }
            }

            // Find the "start" and "end" corners; these are the corners furthest along the gradient line.
            // This is used below to find the start/end positions of the CSS3 gradient-line, and also in finding
            // the total length of the VML rendered gradient-line corner to corner.
            function findCorners() {
                startCornerX = ( angle >= 90 && angle < 270 ) ? w : 0;
                startCornerY = angle < 180 ? h : 0;
                endCornerX = w - startCornerX;
                endCornerY = h - startCornerY;
            }

            // Normalize the angle to a value between [0, 360)
            function normalizeAngle() {
                if( angle < 0 ) {
                    angle += 360;
                }
                angle = angle % 360;
            }

            // Find the distance between two points
            function distance( p1, p2 ) {
                var dx = p2[0] - p1[0],
                    dy = p2[1] - p1[1];
                return Math.abs(
                    dx === 0 ? dy :
                    dy === 0 ? dx :
                    Math.sqrt( dx * dx + dy * dy )
                );
            }

            // Find the start and end points of the gradient
            if( startPos ) {
                startPos = startPos.coords( el, w, h );
                startX = startPos.x;
                startY = startPos.y;
            }
            if( angle ) {
                angle = angle.degrees();

                normalizeAngle();
                findCorners();

                // If no start position was specified, then choose a corner as the starting point.
                if( !startPos ) {
                    startX = startCornerX;
                    startY = startCornerY;
                }

                // Find the end position by extending a perpendicular line from the gradient-line which
                // intersects the corner opposite from the starting corner.
                p = perpendicularIntersect( startX, startY, angle, endCornerX, endCornerY );
                endX = p[0];
                endY = p[1];
            }
            else if( startPos ) {
                // Start position but no angle specified: find the end point by rotating 180deg around the center
                endX = w - startX;
                endY = h - startY;
            }
            else {
                // Neither position nor angle specified; create vertical gradient from top to bottom
                startX = startY = endX = 0;
                endY = h;
            }
            deltaX = endX - startX;
            deltaY = endY - startY;

            if( angle === undefined ) {
                angle = -Math.atan2( deltaY, deltaX ) / PI * 180;
                normalizeAngle();
                findCorners();
            }


            // In VML land, the angle of the rendered gradient depends on the aspect ratio of the shape's
            // bounding box; for example specifying a 45 deg angle actually results in a gradient
            // drawn diagonally from one corner to its opposite corner, which will only appear to the
            // viewer as 45 degrees if the shape is equilateral.  We adjust for this by taking the x/y deltas
            // between the start and end points, multiply one of them by the shape's aspect ratio,
            // and get their arctangent, resulting in an appropriate VML angle.
            vmlAngle = Math.atan2( deltaX * w / h, deltaY ) / PI * 180;

            // VML angles are 180 degrees offset from CSS angles
            vmlAngle += 180;
            vmlAngle = vmlAngle % 360;

            // Add all the stops to the VML 'colors' list, including the first and last stops.
            // For each, we find its pixel offset along the gradient-line; if the offset of a stop is less
            // than that of its predecessor we increase it to be equal. We then map that pixel offset to a
            // percentage along the VML gradient-line, which runs from shape corner to corner.
            lineLength = distance( [ startX, startY ], [ endX, endY ] );
            vmlGradientLength = distance( [ startCornerX, startCornerY ], perpendicularIntersect( startCornerX, startCornerY, angle, endCornerX, endCornerY ) );
            vmlColors = [];
            vmlOffsetPct = distance( [ startX, startY ], perpendicularIntersect( startX, startY, angle, startCornerX, startCornerY ) ) / vmlGradientLength * 100;

            // Find the pixel offsets along the CSS3 gradient-line for each stop.
            stopPx = [];
            for( i = 0; i < stopCount; i++ ) {
                stopPx.push( stops[i].offset ? stops[i].offset.pixels( el, lineLength ) :
                             i === 0 ? 0 : i === stopCount - 1 ? lineLength : null );
            }
            // Fill in gaps with evenly-spaced offsets
            for( i = 1; i < stopCount; i++ ) {
                if( stopPx[ i ] === null ) {
                    before = stopPx[ i - 1 ];
                    j = i;
                    do {
                        after = stopPx[ ++j ];
                    } while( after === null );
                    stopPx[ i ] = before + ( after - before ) / ( j - i + 1 );
                }
                // Make sure each stop's offset is no less than the one before it
                stopPx[ i ] = Math.max( stopPx[ i ], stopPx[ i - 1 ] );
            }

            // Convert to percentage along the VML gradient line and add to the VML 'colors' value
            for( i = 0; i < stopCount; i++ ) {
                vmlColors.push(
                    ( vmlOffsetPct + ( stopPx[ i ] / vmlGradientLength * 100 ) ) + '% ' + stops[i].color.value( el )
                );
            }

            // Now, finally, we're ready to render the gradient fill. Set the start and end colors to
            // the first and last stop colors; this just sets outer bounds for the gradient.
            fill['angle'] = vmlAngle;
            fill['type'] = 'gradient';
            fill['method'] = 'sigma';
            fill['color'] = stops[0].color.value( el );
            fill['color2'] = stops[stopCount - 1].color.value( el );
            fill['colors'].value = vmlColors.join( ',' );
        },


        /**
         * Draw the border shape(s)
         */
        drawBorder: function() {
            var el = this.element,
                cs = el.currentStyle,
                w = el.offsetWidth,
                h = el.offsetHeight,
                props = this.styleInfos.borderInfo.getProps(),
                side, shape, stroke, bColor, bWidth, bStyle, s,
                segments, seg, i, len;

            if( props ) {
                this.hideBorder();

                segments = this.getBorderSegments( 2 );
                for( i = 0, len = segments.length; i < len; i++) {
                    seg = segments[i];
                    shape = this.getShape( 'borderPiece' + i, seg.stroke ? 'stroke' : 'fill', 3 );
                    shape.coordsize = w * 2 + ',' + h * 2;
                    shape.coordorigin = '1,1';
                    shape.path = seg.path;
                    s = shape.style;
                    s.width = w;
                    s.height = h;

                    shape.filled = !!seg.fill;
                    shape.stroked = !!seg.stroke;
                    if( seg.stroke ) {
                        stroke = shape.stroke;
                        stroke['weight'] = seg.weight + 'px';
                        stroke.color = seg.color.value( el );
                        stroke['dashstyle'] = seg.stroke === 'dashed' ? '2 2' : seg.stroke === 'dotted' ? '1 1' : 'solid';
                        stroke['linestyle'] = seg.stroke === 'double' && seg.weight > 2 ? 'ThinThin' : 'Single';
                    } else {
                        shape.fill.color = seg.fill.value( el );
                    }
                }

                // remove any previously-created border shapes which didn't get used above
                while( this.deleteShape( 'borderPiece' + i++ ) ) {}
            }
        },

        /**
         * Hide the actual background image and color of the element.
         */
        hideBackground: function() {
            var rs = this.element.runtimeStyle;
            rs.backgroundImage = 'none';
            rs.backgroundColor = 'transparent';
        },

        /**
         * Hide the actual border of the element. In IE7 and up we can just set its color to transparent;
         * however IE6 does not support transparent borders so we have to get tricky with it.
         */
        hideBorder: function() {
            var el = this.element,
                rs = el.runtimeStyle;
            if( PIE.isIE6 ) {
                // Wrap all the element's children in a custom element, set the element to visiblity:hidden,
                // and set the wrapper element to visiblity:visible. This hides the outer element's decorations
                // (background and border) but displays all the contents.
                // TODO find a better way to do this that doesn't mess up the DOM parent-child relationship,
                // as this can interfere with other author scripts which add/modify/delete children. Also, this
                // won't work for elements which cannot take children, e.g. input/button/textarea/img/etc. Look into
                // using a compositor filter or some other filter which masks the border.
                if( el.childNodes.length !== 1 || el.firstChild.tagName !== 'ie6-mask' ) {
                    var cont = el.document.createElement( 'ie6-mask' ),
                        s = cont.style, child;
                    s.visibility = 'visible';
                    s.zoom = 1;
                    while( child = el.firstChild ) {
                        cont.appendChild( child );
                    }
                    el.appendChild( cont );
                    rs.visibility = 'hidden';
                }
            } else {
                rs.borderColor = 'transparent';
            }
        },


        /**
         * Get the VML path definitions for the border segment(s).
         * @param {number=} mult If specified, all coordinates will be multiplied by this number
         * @return {Array.<string>}
         */
        getBorderSegments: function( mult ) {
            var el = this.element,
                elW, elH,
                borderInfo = this.styleInfos.borderInfo,
                segments = [],
                floor, ceil, wT, wR, wB, wL,
                borderProps, radiusInfo, radii, widths, styles, colors;

            if( borderInfo.isActive() ) {
                borderProps = borderInfo.getProps();

                widths = borderProps.widths;
                styles = borderProps.styles;
                colors = borderProps.colors;

                if( borderProps.widthsSame && borderProps.stylesSame && borderProps.colorsSame ) {
                    // shortcut for identical border on all sides - only need 1 stroked shape
                    wT = widths['t'].pixels( el ); //thickness
                    wR = wT / 2; //shrink
                    segments.push( {
                        path: this.getBoxPath( { t: wR, r: wR, b: wR, l: wR }, mult ),
                        stroke: styles['t'],
                        color: colors['t'],
                        weight: wT
                    } );
                }
                else {
                    mult = mult || 1;
                    elW = el.offsetWidth;
                    elH = el.offsetHeight;

                    wT = widths['t'].pixels( el );
                    wR = widths['r'].pixels( el );
                    wB = widths['b'].pixels( el );
                    wL = widths['l'].pixels( el );
                    var pxWidths = {
                        't': wT,
                        'r': wR,
                        'b': wB,
                        'l': wL
                    };

                    radiusInfo = this.styleInfos.borderRadiusInfo;
                    if( radiusInfo.isActive() ) {
                        radii = this.getRadiiPixels( radiusInfo.getProps() );
                    }

                    floor = Math.floor;
                    ceil = Math.ceil;

                    function curve( corner, shrinkX, shrinkY, startAngle, ccw ) {
                        var rx = radii.x[ corner ],
                            ry = radii.y[ corner ],
                            deg = 65535,
                            isRight = corner.charAt( 1 ) === 'r',
                            isBottom = corner.charAt( 0 ) === 'b';
                        return ( rx > 0 && ry > 0 ) ?
                                    ( isRight ? ceil( elW - rx ) : floor( rx ) ) * mult + ',' + // center x
                                    ( isBottom ? ceil( elH - ry ) : floor( ry ) ) * mult + ',' + // center y
                                    ( floor( rx ) - shrinkX ) * mult + ',' + // width
                                    ( floor( ry ) - shrinkY ) * mult + ',' + // height
                                    ( startAngle * deg ) + ',' + // start angle
                                    ( 45 * deg * ( ccw ? 1 : -1 ) ) // angle change
                                : '';
                    }


                    function addSide( side, sideBefore, sideAfter, cornerBefore, cornerAfter, baseAngle ) {
                        var vert = side === 'l' || side === 'r',
                            beforeX, beforeY, afterX, afterY;

                        if( pxWidths[ side ] > 0 && styles[ side ] !== 'none' ) {
                            beforeX = pxWidths[ vert ? side : sideBefore ];
                            beforeY = pxWidths[ vert ? sideBefore : side ];
                            afterX = pxWidths[ vert ? side : sideAfter ];
                            afterY = pxWidths[ vert ? sideAfter : side ];

                            if( styles[ side ] === 'dashed' || styles[ side ] === 'dotted' ) {
                                segments.push( {
                                    path: 'al' + curve( cornerBefore, beforeX, beforeY, baseAngle + 45, 0 ) +
                                          'ae' + curve( cornerBefore, 0, 0, baseAngle, 1 ),
                                    fill: colors[ side ]
                                } );
                                segments.push( {
                                    path: (
                                        side === 't' ?
                                            'm' + floor( radii.x['tl'] ) * mult + ',' + ceil( wT/2 ) * mult +
                                            'l' + ceil( elW - radii.x['tr'] ) * mult + ',' + ceil( wT/2 ) * mult :
                                        side === 'r' ?
                                            'm' + ceil( elW - wR/2 ) * mult + ',' + floor( radii.y['tr'] ) * mult +
                                            'l' + ceil( elW - wR/2 ) * mult + ',' + ceil( elH - radii.y['br'] ) * mult :
                                        side === 'b' ?
                                            'm' + ceil( elW - radii.x['br'] ) * mult + ',' + floor( elH - wB/2 ) * mult +
                                            'l' + floor( radii.x['bl'] ) * mult + ',' + floor( elH - wB/2 ) * mult :
                                        // side === 'l'
                                            'm' + floor( wL/2 ) * mult + ',' + ceil( elH - radii.y['bl'] ) * mult +
                                            'l' + floor( wL/2 ) * mult + ',' + floor( radii.y['tl'] ) * mult
                                    ),
                                    stroke: styles[ side ],
                                    weight: pxWidths[ side ],
                                    color: colors[ side ]
                                } );
                                segments.push( {
                                    path: 'al' + curve( cornerAfter, afterX, afterY, baseAngle, 0 ) +
                                          'ae' + curve( cornerAfter, 0, 0, baseAngle - 45, 1 ),
                                    fill: colors[ side ]
                                } );
                            }
                            else {
                                segments.push( {
                                    path: 'al' + curve( cornerBefore, beforeX, beforeY, baseAngle + 45, 0 ) +
                                          'ae' + curve( cornerAfter, afterX, afterY, baseAngle, 0 ) +

                                          ( styles[ side ] === 'double' && pxWidths[ side ] > 2 ?
                                                  'ae' + curve( cornerAfter, afterX - floor( afterX / 3 ), afterY - floor( afterY / 3 ), baseAngle - 45, 1 ) +
                                                  'ae' + curve( cornerBefore, beforeX - floor( beforeX / 3 ), beforeY - floor( beforeY / 3 ), baseAngle, 1 ) +
                                                  'x al' + curve( cornerBefore, floor( beforeX / 3 ), floor( beforeY / 3 ), baseAngle + 45, 0 ) +
                                                  'ae' + curve( cornerAfter, floor( afterX / 3 ), floor( afterY / 3 ), baseAngle, 0 )
                                              : '' ) +

                                          'ae' + curve( cornerAfter, 0, 0, baseAngle - 45, 1 ) +
                                          'ae' + curve( cornerBefore, 0, 0, baseAngle, 1 ),
                                    fill: colors[ side ]
                                } );
                            }
                        }
                    }

                    addSide( 't', 'l', 'r', 'tl', 'tr', 90 );
                    addSide( 'r', 't', 'b', 'tr', 'br', 0 );
                    addSide( 'b', 'r', 'l', 'br', 'bl', -90 );
                    addSide( 'l', 'b', 't', 'bl', 'tl', -180 );
                }
            }

            return segments;
        },


        /**
         * Get the container element for the shapes, creating it if necessary
         */
        getBox: function() {
            var box = this._box,
                infos = this.styleInfos,
                s;

            if( !box ) {
                box = this._box = this.element.document.createElement( 'bg-and-border' );
                s = box.style;
                s.position = 'absolute';
                this.parent.addLayer( this.zIndex, box );
            }

            return box;
        },


        /**
         * Destroy the rendered objects
         */
        destroy: function() {
            this.parent.removeLayer( this.zIndex );
            delete this._box;
            delete this._shapes;
            delete this._layers;
        }

    } );

    return BackgroundAndBorderRenderer;
})();