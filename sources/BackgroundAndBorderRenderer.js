PIE.BackgroundAndBorderRenderer = function( el, styleInfos, parent ) {
    this.element = el;
    this.styleInfos = styleInfos;
    this.parent = parent;
};
PIE.Util.merge( PIE.BackgroundAndBorderRenderer.prototype, PIE.RendererBase, {

    zIndex: 200,

    needsUpdate: function() {
        var si = this.styleInfos;
        return si.border.changed() || si.background.changed();
    },

    isActive: function() {
        var si = this.styleInfos;
        return si.borderImage.isActive() ||
               si.borderRadius.isActive() ||
               si.background.isActive() ||
               ( si.boxShadow.isActive() && si.boxShadow.getProps().inset );
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

    draw: function() {
        this.drawBgColor();
        this.drawBgImages();
        this.drawBorder();
    },

    drawBgColor: function() {
        var props = this.styleInfos.background.getProps(),
            color = props && props.color && props.color.value(),
            cont, el, shape, w, h, s, alpha;

        if( color && color !== 'transparent' ) {
            this.hideBackground();

            cont = this.getBox();
            el = this.element;
            shape = this.getShape( 'bgColor', 'fill' );
            w = el.offsetWidth;
            h = el.offsetHeight;
            shape.stroked = false;
            shape.coordsize = w + ',' + h;
            shape.path = this.getBoxPath();
            s = shape.style;
            s.width = w;
            s.height = h;
            s.zIndex = 1;
            shape.fill.color = color;

            alpha = props.color.alpha();
            if( alpha < 1 ) {
                shape.fill.opacity = alpha;
            }
        }
    },

    drawBgImages: function() {
        var props = this.styleInfos.background.getProps(),
            images = props && props.images,
            img, cont, el, shape, w, h, s, i;

        if( images ) {
            this.hideBackground();

            el = this.element;
            w = el.offsetWidth,
            h = el.offsetHeight,

            i = images.length;
            while( i-- ) {
                img = images[i];
                shape = this.getShape( 'bgImage' + i, 'fill' );

                shape.stroked = false;
                shape.fill.type = 'tile';
                shape.fillcolor = 'none';
                shape.coordsize = w + ',' + h;
                shape.path = this.getBoxPath();
                s = shape.style;
                s.width = w;
                s.height = h;
                s.zIndex = 2;

                if( img.type === 'linear-gradient' ) {
                    this.addLinearGradient( shape, img );
                }
                else {
                    shape.fill.src = img.url;
                    this.positionBgImage( shape, i );
                }
            }
        }
    },

    positionBgImage: function( shape, index ) {
        PIE.Util.withImageSize( shape.fill.src, function( size ) {
            var fill = shape.fill,
                el = this.element,
                elW = el.offsetWidth,
                elH = el.offsetHeight,
                cs = el.currentStyle,
                si = this.styleInfos,
                border = si.border.getProps(),
                bw = border && border.widths,
                bwT = bw ? bw.t.pixels( el ) : 0,
                bwR = bw ? bw.r.pixels( el ) : 0,
                bwB = bw ? bw.b.pixels( el ) : 0,
                bwL = bw ? bw.l.pixels( el ) : 0,
                bg = si.background.getProps().images[ index ],
                bgPos = bg.position.coords( el, elW - size.w - bwL - bwR, elH - size.h - bwT - bwB ),
                repeat = bg.repeat,
                pxX, pxY,
                clipT = 0, clipR = elW, clipB = elH, clipL = 0;

            // Positioning - find the pixel offset from the top/left and convert to a ratio
            pxX = bgPos.x + bwL;
            pxY = bgPos.y + bwT;
            fill.position = ( pxX / elW ) + ',' + ( pxY / elH );

            // Repeating - clip the image shape
            if( repeat !== 'repeat' ) {
                if( repeat === 'repeat-x' || repeat === 'no-repeat' ) {
                    clipT = pxY;
                    clipB = pxY + size.h;
                }
                if( repeat === 'repeat-y' || repeat === 'no-repeat' ) {
                    clipL = pxX;
                    clipR = pxX + size.w;
                }
                shape.style.clip = 'rect(' + clipT + 'px,' + clipR + 'px,' + clipB + 'px,' + clipL + 'px)';
            }
        }, this );
    },

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
        /*vmlGradientLength = Math.abs(
                Math.cos(
                    Math.atan2( endCornerX - startCornerX, endCornerY - startCornerY ) +
                    ( angle * PI / 180 )
                ) *
                Math.sqrt( w * w + h * h )
            );*/
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
                ( vmlOffsetPct + ( stopPx[ i ] / vmlGradientLength * 100 ) ) + '% ' + stops[i].color.value()
            );
        }

        // Now, finally, we're ready to render the gradient fill. Set the start and end colors to
        // the first and last stop colors; this just sets outer bounds for the gradient.
        fill.angle = vmlAngle;
        fill.type = 'gradient';
        fill.method = 'sigma';
        fill.color = stops[0].color.value();
        fill.color2 = stops[stopCount - 1].color.value();
        fill.colors.value = vmlColors.join( ',' );
    },

    drawBorder: function() {
        var cont = this.getBox(),
            el = this.element,
            cs = el.currentStyle,
            w = el.offsetWidth,
            h = el.offsetHeight,
            props = this.styleInfos.border.getProps(),
            styles, colors, widths,
            side, shape, stroke, bColor, bWidth, bStyle, s;

        if( props ) {
            styles = props.styles;
            colors = props.colors;
            widths = props.widths;

            this.hideBorder();

            var segments = this.getBorderSegments();
            for( var i=0; i<segments.length; i++) {
                var seg = segments[i];
                shape = this.getShape( 'borderPiece' + i, seg.stroke ? 'stroke' : 'fill' );
                shape.coordsize = w + ',' + h;
                shape.path = seg.path;
                s = shape.style;
                s.width = w;
                s.height = h;
                s.zIndex = 3;

                shape.filled = !!seg.fill;
                shape.stroked = !!seg.stroke;
                if( seg.stroke ) {
                    stroke = shape.stroke;
                    stroke.weight = seg.weight + 'px';
                    stroke.color = seg.color.value();
                    stroke.dashstyle = seg.stroke === 'dashed' ? '2 2' : seg.stroke === 'dotted' ? '1 1' : 'solid';
                    stroke.linestyle = seg.stroke === 'double' && seg.weight > 2 ? 'ThinThin' : 'Single';
                } else {
                    shape.fill.color = seg.fill.value();
                }
            }
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
        var el = this.element;
        if( PIE.isIE6 ) {
            // Wrap all the element's children in a custom element, set the element to visiblity:hidden,
            // and set the wrapper element to visiblity:visible. This hides the outer element's decorations
            // (background and border) but displays all the contents.
            // TODO find a better way to do this that doesn't mess up the DOM parent-child relationship,
            // as this can interfere with other author scripts which add/modify/delete children. Look into
            // using a compositor filter which masks the border.
            if( el.childNodes.length !== 1 || el.firstChild.tagName !== 'ie6-mask' ) {
                var cont = this.element.document.createElement( 'ie6-mask' );
                cont.style.visibility = 'visible';
                cont.style.zoom = 1;
                while( el.firstChild ) {
                    cont.appendChild( el.firstChild );
                }
                el.appendChild( cont );
                el.runtimeStyle.visibility = 'hidden';
            }
        } else {
            el.runtimeStyle.borderColor = 'transparent';
        }
    },

    getBorderSegments: function() {
        var el = this.element,
            elW, elH,
            borderInfo = this.styleInfos.border,
            segments = [],
            deg = 65535,
            floor, ceil, wT, wR, wB, wL,
            borderProps, radiusInfo, radii, widths, styles, colors;

        if( borderInfo.isActive() ) {
            borderProps = borderInfo.getProps();

            widths = borderProps.widths;
            styles = borderProps.styles;
            colors = borderProps.colors;

            if( borderProps.widthsSame && borderProps.stylesSame && borderProps.colorsSame ) {
                // shortcut for identical border on all sides - only need 1 stroked shape
                wT = widths.t.pixels( el );
                segments.push( {
                    path: this.getBoxPath( wT / 2 ),
                    stroke: styles.t,
                    color: colors.t,
                    weight: wT
                } );
            }
            else {
                elW = el.offsetWidth - 1;
                elH = el.offsetHeight - 1;

                wT = widths.t.pixels( el );
                wR = widths.r.pixels( el );
                wB = widths.b.pixels( el );
                wL = widths.l.pixels( el );
                var pxWidths = {
                    t: wT,
                    r: wR,
                    b: wB,
                    l: wL
                };

                radiusInfo = this.styleInfos.borderRadius;
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
                                ( isRight ? ceil( elW - rx ) : floor( rx ) ) + ',' + // center x
                                ( isBottom ? ceil( elH - ry ) : floor( ry ) ) + ',' + // center y
                                ( floor( rx ) - shrinkX ) + ',' + // width
                                ( floor( ry ) - shrinkY ) + ',' + // height
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
                                        'm' + floor( radii.x.tl ) + ',' + ceil( wT/2 ) +
                                        'l' + ceil( elW - radii.x.tr ) + ',' + ceil( wT/2 ) :
                                    side === 'r' ?
                                        'm' + ceil( elW - wR/2 ) + ',' + floor( radii.y.tr ) +
                                        'l' + ceil( elW - wR/2 ) + ',' + ceil( elH - radii.y.br ) :
                                    side === 'b' ?
                                        'm' + ceil( elW - radii.x.br ) + ',' + floor( elH - wB/2 ) +
                                        'l' + floor( radii.x.bl ) + ',' + floor( elH - wB/2 ) :
                                    // side === 'l'
                                        'm' + floor( wL/2 ) + ',' + ceil( elH - radii.y.bl ) +
                                        'l' + floor( wL/2 ) + ',' + floor( radii.y.tl )
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

    getBox: function() {
        var box = this._box,
            infos = this.styleInfos,
            s;

        if( !box ) {
            box = this._box = this.element.document.createElement( 'bg-and-border' );
            s = box.style;
            s.position = 'absolute';
            s.zIndex = this.zIndex;
            this.parent.getBox().appendChild( box );
        }

        return box;
    },

    destroy: function() {
        var box = this._box;
        if( box && box.parentNode ) {
            box.parentNode.removeChild( box );
        }
        delete this._box;
        delete this._shapes;
    }

} );
